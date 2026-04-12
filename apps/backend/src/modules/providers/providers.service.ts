import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Prisma,
  Provider,
  User,
  VisibilityLevel,
} from "@prisma/client";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service";
import { SupabaseJwtService } from "../../common/auth/supabase-jwt.service";
import { PrismaService } from "../../database/prisma.service";

type ProviderSearchQuery = {
  q?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  verified?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type UpdateProviderBody = {
  profession?: string;
  description?: string | null;
  experience?: number | null;
  hourlyRate?: number | null;
  isAvailable?: boolean;
  categoryIds?: string[];
  skills?: Array<{
    name: string;
    level?: number;
  }>;
  serviceZones?: Array<{
    city: string;
    commune?: string | null;
  }>;
  tradeIds?: string[];
  primaryTradeId?: string | null;
};

type Viewer = User | null;

type ProviderSummaryRecord = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        avatar: true;
        city: true;
        country: true;
        isVerified: true;
      };
    };
    categories: {
      where: {
        category: {
          isActive: true;
        };
      };
      include: {
        category: true;
      };
    };
    serviceZones: true;
  };
}>;

type ProviderDetailRecord = Prisma.ProviderGetPayload<{
  include: typeof providerDetailInclude;
}>;

const providerDetailInclude = {
  user: {
    include: {
      visibilitySettings: true,
    },
  },
  categories: {
    where: {
      category: {
        isActive: true,
      },
    },
    include: {
      category: true,
    },
  },
  trades: {
    include: {
      trade: {
        include: {
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              categoryId: true,
            },
          },
        },
      },
    },
  },
  skills: {
    orderBy: {
      name: "asc",
    },
  },
  serviceZones: {
    orderBy: [{ city: "asc" }, { commune: "asc" }],
  },
  trustScore: {
    include: {
      badges: {
        where: {
          isVisible: true,
        },
      },
    },
  },
  certifications: {
    orderBy: {
      createdAt: "desc",
    },
    include: {
      documents: true,
    },
  },
  portfolio: {
    orderBy: {
      order: "asc",
    },
  },
  portfolioProjects: {
    where: {
      isPublished: true,
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      images: {
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  },
  availabilitySchedules: {
    orderBy: {
      dayOfWeek: "asc",
    },
  },
  subscription: true,
  reviews: {
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  },
  _count: {
    select: {
      bookings: true,
      reviews: true,
    },
  },
} satisfies Prisma.ProviderInclude;

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: SupabaseJwtService,
    private readonly identity: IdentityService,
  ) {}

  async search(query: ProviderSearchQuery) {
    const providers = await this.prisma.provider.findMany({
      where: this.buildSearchWhere(query),
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            city: true,
            country: true,
            isVerified: true,
          },
        },
        categories: {
          where: {
            category: {
              isActive: true,
            },
          },
          include: {
            category: true,
          },
        },
        serviceZones: true,
      },
    });

    const [ratingByProviderId, certifiedProviderIds] = await Promise.all([
      this.getRatingByProviderId(providers.map((provider) => provider.id)),
      this.getCertifiedProviderIds(providers.map((provider) => provider.id)),
    ]);

    const filteredProviders = providers
      .map((provider) =>
        this.mapProviderSummary(
          provider,
          ratingByProviderId.get(provider.id) ?? 0,
          certifiedProviderIds.has(provider.id),
        ),
      )
      .filter((provider) =>
        query.minRating !== undefined ? provider.rating >= query.minRating : true,
      )
      .sort((left, right) => {
        if (left.isPremium !== right.isPremium) {
          return Number(right.isPremium) - Number(left.isPremium);
        }

        if (left.rating !== right.rating) {
          return right.rating - left.rating;
        }

        if (left.totalReviews !== right.totalReviews) {
          return right.totalReviews - left.totalReviews;
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      });

    const total = filteredProviders.length;
    const start = (query.page - 1) * query.limit;
    const paginatedProviders = filteredProviders.slice(start, start + query.limit);

    return {
      success: true as const,
      providers: paginatedProviders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        hasMore: start + query.limit < total,
      },
    };
  }

  async findById(id: string, viewer: Viewer) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: providerDetailInclude,
    });

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    const [ratingStats, certifiedProviderIds, hasAccess] = await Promise.all([
      this.getProviderRatingStats(provider.id),
      this.getCertifiedProviderIds([provider.id]),
      this.canAccessProfile(provider, viewer),
    ]);

    const detail = this.mapProviderDetail(
      provider,
      ratingStats.average,
      certifiedProviderIds.has(provider.id),
      ratingStats,
    );

    const accessDeniedReason = hasAccess
      ? null
      : this.getAccessDeniedReason(
          provider.user.visibilitySettings?.profileVisible ?? "PUBLIC",
          viewer,
        );

    return {
      success: true as const,
      provider: this.applyVisibility(detail, provider, {
        hasAccess,
        isOwner: this.isOwner(provider, viewer),
      }),
      hasAccess,
      accessDeniedReason,
    };
  }

  async updateMe(actor: User, body: UpdateProviderBody) {
    const provider = await this.prisma.provider.findUnique({
      where: {
        userId: actor.id,
      },
      include: {
        trades: true,
      },
    });

    if (!provider) {
      throw new NotFoundException("Provider profile not found");
    }

    const categoryIds = body.categoryIds ? this.unique(body.categoryIds) : undefined;
    const tradeIds = body.tradeIds ? this.unique(body.tradeIds) : undefined;

    if (tradeIds && tradeIds.length > 3) {
      throw new BadRequestException("A provider can have at most 3 trades");
    }

    if (
      body.primaryTradeId &&
      tradeIds &&
      !tradeIds.includes(body.primaryTradeId)
    ) {
      throw new BadRequestException("primaryTradeId must be included in tradeIds");
    }

    await this.validateReferencedRecords({
      categoryIds,
      tradeIds,
    });

    if (body.primaryTradeId && !tradeIds) {
      const existingTradeIds = provider.trades.map((item) => item.tradeId);
      if (!existingTradeIds.includes(body.primaryTradeId)) {
        throw new BadRequestException(
          "primaryTradeId must reference one of the provider's existing trades",
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: {
          id: provider.id,
        },
        data: {
          profession: body.profession,
          description: body.description,
          experience: body.experience,
          hourlyRate: body.hourlyRate,
          isAvailable: body.isAvailable,
        },
      });

      if (categoryIds) {
        await tx.providerCategory.deleteMany({
          where: {
            providerId: provider.id,
          },
        });

        if (categoryIds.length > 0) {
          await tx.providerCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              providerId: provider.id,
              categoryId,
            })),
          });
        }
      }

      if (body.skills) {
        const skills = this.uniqueSkills(body.skills);
        await tx.skill.deleteMany({
          where: {
            providerId: provider.id,
          },
        });

        if (skills.length > 0) {
          await tx.skill.createMany({
            data: skills.map((skill) => ({
              providerId: provider.id,
              name: skill.name,
              level: skill.level ?? 1,
            })),
          });
        }
      }

      if (body.serviceZones) {
        const zones = this.uniqueZones(body.serviceZones);
        await tx.serviceZone.deleteMany({
          where: {
            providerId: provider.id,
          },
        });

        if (zones.length > 0) {
          await tx.serviceZone.createMany({
            data: zones.map((zone) => ({
              providerId: provider.id,
              city: zone.city,
              commune: zone.commune ?? null,
            })),
          });
        }
      }

      if (tradeIds || body.primaryTradeId !== undefined) {
        const existingTrades = await tx.providerTrade.findMany({
          where: {
            providerId: provider.id,
          },
        });

        const desiredTradeIds = tradeIds ?? existingTrades.map((item) => item.tradeId);
        const primaryTradeId =
          body.primaryTradeId === undefined
            ? existingTrades.find((item) => item.isPrimary)?.tradeId ??
              desiredTradeIds[0] ??
              null
            : body.primaryTradeId ?? desiredTradeIds[0] ?? null;

        if (primaryTradeId && !desiredTradeIds.includes(primaryTradeId)) {
          throw new BadRequestException(
            "primaryTradeId must reference one of the provider's trades",
          );
        }

        await tx.providerTrade.deleteMany({
          where: {
            providerId: provider.id,
          },
        });

        if (desiredTradeIds.length > 0) {
          const existingExperienceByTradeId = new Map(
            existingTrades.map((item) => [item.tradeId, item.experience]),
          );

          await tx.providerTrade.createMany({
            data: desiredTradeIds.map((tradeId, index) => ({
              providerId: provider.id,
              tradeId,
              isPrimary: primaryTradeId
                ? tradeId === primaryTradeId
                : index === 0,
              experience:
                body.experience ??
                existingExperienceByTradeId.get(tradeId) ??
                provider.experience ??
                null,
            })),
          });
        }
      }
    });

    const result = await this.findById(provider.id, actor);
    return {
      success: true as const,
      provider: result.provider,
      hasAccess: result.hasAccess,
      accessDeniedReason: result.accessDeniedReason,
    };
  }

  async resolveViewer(request: Request): Promise<Viewer> {
    const token = this.extractToken(request);
    if (!token) {
      return null;
    }

    const claims = await this.jwt.verify(token).catch(() => null);
    if (!claims?.sub) {
      return null;
    }

    return this.identity
      .resolve({
        authUserId: claims.sub,
        email: this.normalizeClaim(claims.email),
        phone: this.normalizeClaim(claims.phone),
        claims,
      })
      .catch(() => null);
  }

  private buildSearchWhere(query: ProviderSearchQuery): Prisma.ProviderWhereInput {
    const conditions: Prisma.ProviderWhereInput[] = [
      {
        user: {
          isActive: true,
        },
      },
      this.visibilityWhere("appearInSearch"),
    ];

    if (query.q) {
      conditions.push({
        OR: [
          {
            profession: {
              contains: query.q,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query.q,
              mode: "insensitive",
            },
          },
          {
            user: {
              firstName: {
                contains: query.q,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              lastName: {
                contains: query.q,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    if (query.category) {
      conditions.push({
        categories: {
          some: {
            category: {
              isActive: true,
              OR: [{ id: query.category }, { slug: query.category }],
            },
          },
        },
      });
      conditions.push(this.visibilityWhere("appearInCategory"));
    }

    if (query.subcategory) {
      conditions.push({
        trades: {
          some: {
            trade: {
              isActive: true,
              subcategory: {
                isActive: true,
                OR: [{ id: query.subcategory }, { slug: query.subcategory }],
              },
            },
          },
        },
      });
      conditions.push(this.visibilityWhere("appearInCategory"));
    }

    if (query.city) {
      conditions.push({
        OR: [
          {
            user: {
              city: {
                contains: query.city,
                mode: "insensitive",
              },
            },
          },
          {
            serviceZones: {
              some: {
                city: {
                  contains: query.city,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    if (query.available) {
      conditions.push({
        isAvailable: true,
      });
    }

    if (query.verified) {
      conditions.push({
        verificationStatus: "VERIFIED",
      });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      conditions.push({
        hourlyRate: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        },
      });
    }

    return { AND: conditions };
  }

  private async validateReferencedRecords(params: {
    categoryIds?: string[];
    tradeIds?: string[];
  }) {
    const [categoryCount, tradeCount] = await Promise.all([
      params.categoryIds
        ? this.prisma.category.count({
            where: {
              id: { in: params.categoryIds },
              isActive: true,
            },
          })
        : Promise.resolve(undefined),
      params.tradeIds
        ? this.prisma.trade.count({
            where: {
              id: { in: params.tradeIds },
              isActive: true,
            },
          })
        : Promise.resolve(undefined),
    ]);

    if (
      params.categoryIds &&
      categoryCount !== undefined &&
      categoryCount !== params.categoryIds.length
    ) {
      throw new BadRequestException("One or more categories are invalid");
    }

    if (
      params.tradeIds &&
      tradeCount !== undefined &&
      tradeCount !== params.tradeIds.length
    ) {
      throw new BadRequestException("One or more trades are invalid");
    }
  }

  private async getRatingByProviderId(providerIds: string[]) {
    if (providerIds.length === 0) {
      return new Map<string, number>();
    }

    const ratings = await this.prisma.review.groupBy({
      by: ["providerId"],
      where: {
        providerId: {
          in: providerIds,
        },
      },
      _avg: {
        overallScore: true,
      },
      _count: {
        providerId: true,
      },
    });

    return new Map(
      ratings.map((item) => [
        item.providerId,
        this.roundRating(item._avg.overallScore ?? 0),
      ]),
    );
  }

  private async getCertifiedProviderIds(providerIds: string[]) {
    if (providerIds.length === 0) {
      return new Set<string>();
    }

    const certifications = await this.prisma.certification.groupBy({
      by: ["providerId"],
      where: {
        providerId: {
          in: providerIds,
        },
        status: "VERIFIED",
      },
      _count: {
        providerId: true,
      },
    });

    return new Set(certifications.map((item) => item.providerId));
  }

  private async getProviderRatingStats(providerId: string) {
    const [aggregate, reviews] = await Promise.all([
      this.prisma.review.aggregate({
        where: {
          providerId,
        },
        _avg: {
          overallScore: true,
          punctuality: true,
          quality: true,
          communication: true,
          value: true,
          professionalism: true,
        },
      }),
      this.prisma.review.findMany({
        where: {
          providerId,
        },
        select: {
          overallScore: true,
        },
      }),
    ]);

    const ratingBreakdown = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };

    for (const review of reviews) {
      const bucket = String(
        Math.min(5, Math.max(1, Math.round(review.overallScore || 0))),
      ) as keyof typeof ratingBreakdown;
      ratingBreakdown[bucket] += 1;
    }

    return {
      average: this.roundRating(aggregate._avg.overallScore ?? 0),
      totalReviews: reviews.length,
      ratingBreakdown,
      ratingAverages: {
        overall: this.roundRating(aggregate._avg.overallScore ?? 0),
        punctuality: this.roundRating(aggregate._avg.punctuality ?? 0),
        quality: this.roundRating(aggregate._avg.quality ?? 0),
        communication: this.roundRating(aggregate._avg.communication ?? 0),
        value: this.roundRating(aggregate._avg.value ?? 0),
        professionalism: this.roundRating(aggregate._avg.professionalism ?? 0),
      },
    };
  }

  private async canAccessProfile(
    provider: ProviderDetailRecord,
    viewer: Viewer,
  ): Promise<boolean> {
    const visibility = provider.user.visibilitySettings?.profileVisible ?? "PUBLIC";

    if (this.isOwner(provider, viewer) || viewer?.role === "ADMIN") {
      return true;
    }

    if (visibility === "PUBLIC") {
      return true;
    }

    if (visibility === "REGISTERED") {
      return Boolean(viewer);
    }

    if (visibility === "PRIVATE") {
      return false;
    }

    if (!viewer || viewer.role !== "CLIENT") {
      return false;
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        clientId: viewer.id,
        providerId: provider.id,
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(booking);
  }

  private mapProviderSummary(
    provider: ProviderSummaryRecord,
    rating: number,
    isCertified: boolean,
  ) {
    return {
      id: provider.id,
      userId: provider.userId,
      profession: provider.profession,
      description: provider.description,
      experience: provider.experience,
      hourlyRate: provider.hourlyRate,
      videoUrl: provider.videoUrl,
      rating,
      totalReviews: provider.totalReviews,
      totalJobs: provider.totalJobs,
      responseTime: provider.responseTime,
      isCertified,
      isPremium: provider.isPremium,
      premiumExpiry: provider.premiumExpiry,
      isAvailable: provider.isAvailable,
      verificationStatus: provider.verificationStatus,
      user: provider.user,
      categories: provider.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        icon: item.category.icon,
        color: item.category.color,
      })),
      serviceZones: provider.serviceZones,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private mapProviderDetail(
    provider: ProviderDetailRecord,
    rating: number,
    isCertified: boolean,
    ratingStats: Awaited<ReturnType<ProvidersService["getProviderRatingStats"]>>,
  ) {
    return {
      id: provider.id,
      userId: provider.userId,
      profession: provider.profession,
      description: provider.description,
      experience: provider.experience,
      hourlyRate: provider.hourlyRate,
      videoUrl: provider.videoUrl,
      rating,
      totalReviews: provider.totalReviews,
      totalJobs: provider.totalJobs,
      responseTime: provider.responseTime,
      isCertified,
      isPremium: provider.isPremium,
      premiumExpiry: provider.premiumExpiry,
      isAvailable: provider.isAvailable,
      verificationStatus: provider.verificationStatus,
      user: {
        id: provider.user.id,
        email: provider.user.email,
        phone: provider.user.phone,
        firstName: provider.user.firstName,
        lastName: provider.user.lastName,
        avatar: provider.user.avatar,
        city: provider.user.city,
        country: provider.user.country,
        address: provider.user.address,
        latitude: provider.user.latitude,
        longitude: provider.user.longitude,
        isVerified: provider.user.isVerified,
      },
      categories: provider.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        description: item.category.description,
        image: item.category.image,
        icon: item.category.icon,
        color: item.category.color,
        order: item.category.order,
        isActive: item.category.isActive,
        createdAt: item.category.createdAt,
      })),
      trades: provider.trades
        .map((item) => ({
          id: item.trade.id,
          subcategoryId: item.trade.subcategoryId,
          name: item.trade.name,
          slug: item.trade.slug,
          description: item.trade.description,
          icon: item.trade.icon,
          basePrice: item.trade.basePrice,
          duration: item.trade.duration,
          isActive: item.trade.isActive,
          order: item.trade.order,
          createdAt: item.trade.createdAt,
          isPrimary: item.isPrimary,
          experience: item.experience,
        }))
        .sort((left, right) => {
          if (left.isPrimary !== right.isPrimary) {
            return Number(right.isPrimary) - Number(left.isPrimary);
          }

          if ((left.order ?? 0) !== (right.order ?? 0)) {
            return (left.order ?? 0) - (right.order ?? 0);
          }

          return left.name.localeCompare(right.name);
        }),
      skills: provider.skills,
      serviceZones: provider.serviceZones,
      trustScore: provider.trustScore
        ? {
            ...provider.trustScore,
            badges: provider.trustScore.badges,
          }
        : null,
      badges: provider.trustScore?.badges ?? [],
      certifications: provider.certifications,
      portfolio: provider.portfolio,
      portfolioProjects: provider.portfolioProjects,
      availabilitySchedules: provider.availabilitySchedules,
      subscription: provider.subscription,
      recentReviews: provider.reviews.map((review) => ({
        id: review.id,
        bookingId: review.bookingId,
        clientId: review.clientId,
        providerId: review.providerId,
        rating: this.roundRating(review.overallScore),
        punctuality: review.punctuality,
        quality: review.quality,
        communication: review.communication,
        value: review.value,
        professionalism: review.professionalism,
        overallScore: review.overallScore,
        satisfactionTags: review.satisfactionTags
          ? JSON.stringify(review.satisfactionTags)
          : null,
        comment: review.comment,
        reply: review.reply,
        repliedAt: review.repliedAt,
        isPublic: review.isPublic,
        isEdited: review.isEdited,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        client: review.client,
      })),
      stats: {
        totalReviews: provider._count.reviews,
        totalBookings: provider._count.bookings,
        ratingBreakdown: ratingStats.ratingBreakdown,
        ratingAverages: ratingStats.ratingAverages,
      },
      hasAccess: true,
      accessDeniedReason: null,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private applyVisibility(
    detail: ReturnType<ProvidersService["mapProviderDetail"]>,
    provider: ProviderDetailRecord,
    access: {
      hasAccess: boolean;
      isOwner: boolean;
    },
  ) {
    const visibility = provider.user.visibilitySettings ?? this.defaultVisibility();
    const fullAccess = access.hasAccess || access.isOwner;

    return {
      ...detail,
      user: {
        ...detail.user,
        email: fullAccess || visibility.showEmail ? detail.user.email : null,
        phone: fullAccess || visibility.showPhone ? detail.user.phone : null,
        address:
          fullAccess || visibility.showExactLocation ? detail.user.address : null,
        latitude:
          fullAccess || visibility.showExactLocation ? detail.user.latitude : null,
        longitude:
          fullAccess || visibility.showExactLocation ? detail.user.longitude : null,
      },
      hourlyRate:
        fullAccess || visibility.showHourlyRate ? detail.hourlyRate : null,
      isAvailable:
        fullAccess || visibility.showAvailability ? detail.isAvailable : false,
      availabilitySchedules:
        fullAccess || visibility.showAvailability
          ? detail.availabilitySchedules
          : [],
      portfolio:
        fullAccess || visibility.showPastWork ? detail.portfolio : [],
      portfolioProjects:
        fullAccess || visibility.showPastWork ? detail.portfolioProjects : [],
      certifications:
        fullAccess || visibility.showCertifications ? detail.certifications : [],
      recentReviews:
        fullAccess || visibility.showReviews ? detail.recentReviews : [],
      stats:
        fullAccess || visibility.showReviews
          ? detail.stats
          : {
              ...detail.stats,
              totalReviews: 0,
              ratingBreakdown: {
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
              },
              ratingAverages: {
                overall: 0,
                punctuality: 0,
                quality: 0,
                communication: 0,
                value: 0,
                professionalism: 0,
              },
            },
      hasAccess: access.hasAccess,
      accessDeniedReason: access.hasAccess
        ? null
        : this.getAccessDeniedReason(visibility.profileVisible, null),
    };
  }

  private visibilityWhere(
    field: "appearInSearch" | "appearInCategory",
  ): Prisma.ProviderWhereInput {
    return {
      OR: [
        { user: { visibilitySettings: null } },
        { user: { visibilitySettings: { [field]: true } } },
      ],
    };
  }

  private defaultVisibility() {
    return {
      profileVisible: "PUBLIC" as VisibilityLevel,
      showEmail: false,
      showPhone: false,
      showExactLocation: false,
      showHourlyRate: true,
      showPastWork: true,
      showReviews: true,
      showAvailability: true,
      showCertifications: true,
      showClientHistory: true,
      showClientReviews: true,
      allowDirectContact: true,
      allowMessages: true,
      appearInSearch: true,
      appearInCategory: true,
    };
  }

  private getAccessDeniedReason(
    visibility: VisibilityLevel,
    viewer: Viewer,
  ): string {
    if (visibility === "PRIVATE") {
      return "This profile is private";
    }

    if (visibility === "REGISTERED") {
      return "Sign in to view this profile";
    }

    if (visibility === "CLIENTS_ONLY") {
      return viewer ? "This profile is only visible to confirmed clients" : "Sign in to view this profile";
    }

    return "Access denied";
  }

  private isOwner(provider: Provider | ProviderDetailRecord, viewer: Viewer) {
    return Boolean(viewer && provider.userId === viewer.id);
  }

  private roundRating(value: number) {
    return Math.round(value * 10) / 10;
  }

  private unique(values: string[]) {
    return [...new Set(values)];
  }

  private uniqueSkills(skills: NonNullable<UpdateProviderBody["skills"]>) {
    const seen = new Set<string>();

    return skills
      .map((skill) => ({
        name: skill.name.trim(),
        level: skill.level,
      }))
      .filter((skill) => {
        if (!skill.name) {
          return false;
        }

        const key = skill.name.toLowerCase();
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  }

  private uniqueZones(zones: NonNullable<UpdateProviderBody["serviceZones"]>) {
    const seen = new Set<string>();

    return zones.filter((zone) => {
      const key = `${zone.city.trim().toLowerCase()}:${zone.commune?.trim().toLowerCase() ?? ""}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private normalizeClaim(value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private extractToken(request: Request) {
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length).trim();
      if (token) {
        return token;
      }
    }

    const cookies = request.cookies as Record<string, unknown> | undefined;
    if (!cookies) {
      return null;
    }

    const preferredKeys = [
      "access_token",
      "sb-access-token",
      "supabase-access-token",
      "supabase.auth.token",
    ];

    for (const key of preferredKeys) {
      const token = this.readTokenCandidate(cookies[key]);
      if (token) {
        return token;
      }
    }

    for (const [key, value] of Object.entries(cookies)) {
      if (!/^sb-.*-auth-token/.test(key)) {
        continue;
      }

      const token = this.readTokenCandidate(value);
      if (token) {
        return token;
      }
    }

    return null;
  }

  private readTokenCandidate(value: unknown): string | null {
    if (typeof value !== "string" || !value) {
      return null;
    }

    const decoded = this.decodeCookieValue(value);
    const directToken = this.findJwt(decoded);
    if (directToken) {
      return directToken;
    }

    try {
      const parsed = JSON.parse(decoded) as unknown;
      return this.findTokenInJson(parsed);
    } catch {
      return null;
    }
  }

  private decodeCookieValue(value: string) {
    let decoded = value;

    try {
      decoded = decodeURIComponent(value);
    } catch {
      return value;
    }

    if (!decoded.startsWith("base64-")) {
      return decoded;
    }

    return Buffer.from(decoded.slice("base64-".length), "base64").toString("utf8");
  }

  private findJwt(value: string) {
    const match = value.match(
      /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
    );

    return match?.[0] ?? null;
  }

  private findTokenInJson(value: unknown): string | null {
    if (typeof value === "string") {
      return this.findJwt(value);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const token = this.findTokenInJson(item);
        if (token) {
          return token;
        }
      }
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const accessToken = record.access_token;
      if (typeof accessToken === "string" && accessToken) {
        return accessToken;
      }

      for (const item of Object.values(record)) {
        const token = this.findTokenInJson(item);
        if (token) {
          return token;
        }
      }
    }

    return null;
  }
}
