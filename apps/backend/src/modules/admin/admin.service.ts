import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  BadgeType,
  BookingStatus,
  DisputeOrigin,
  DisputeSeverity,
  DisputeStatus,
  Prisma,
  TrustLevel,
  User,
  UserRole,
  VerificationDecision,
  VerificationDoc,
  VerificationStatus,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type AdminUserQuery = {
  page: number;
  limit: number;
  role?: UserRole;
  status?: "active" | "inactive" | "verified" | "unverified";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type AdminProviderQuery = {
  page: number;
  limit: number;
  status?: "premium" | "available" | "unavailable";
  verificationStatus?: VerificationStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type AdminCategoryQuery = {
  includeInactive?: boolean;
};

type AdminVerificationQueueQuery = {
  page: number;
  limit: number;
  status?: VerificationStatus;
  search?: string;
};

type AdminReviewQuery = {
  page: number;
  limit: number;
  isPublic?: boolean;
  minRating?: number;
  maxRating?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type AdminSupportBookingQuery = {
  page: number;
  limit: number;
  status?: BookingStatus;
  search?: string;
};

type AdminDisputeQuery = {
  page: number;
  limit: number;
  status?: DisputeStatus;
  severity?: DisputeSeverity;
  search?: string;
};

type UpdateUserBody = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  city?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  role?: UserRole;
};

type UpdateProviderBody = {
  providerId: string;
  verificationStatus?: VerificationStatus;
  isPremium?: boolean;
  isAvailable?: boolean;
  rejectionReason?: string;
};

type CreateCategoryBody = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  color?: string;
  order?: number;
  subcategories?: Array<{
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order?: number;
  }>;
};

type UpdateCategoryBody = Partial<CreateCategoryBody> & {
  id?: string;
  categoryId?: string;
  isActive?: boolean;
};

type CreateSubcategoryBody = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
};

type UpdateSubcategoryBody = {
  id: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
};

type ReviewVerificationDocBody = {
  providerId: string;
  docId: string;
  decision: VerificationDecision;
  rejectionReason?: string;
};

type ModerateReviewBody = {
  reviewId: string;
  isPublic?: boolean;
  isEdited?: boolean;
  reply?: string | null;
};

type CreateDisputeBody = {
  bookingId: string;
  reporterRole: DisputeOrigin;
  reason: string;
  statement: string;
  severity?: DisputeSeverity;
};

type UpdateDisputeBody = {
  disputeId: string;
  status?: DisputeStatus;
  severity?: DisputeSeverity;
  resolution?: string | null;
  resolutionPct?: number | null;
  deadlineAt?: string | Date | null;
};

const managedBadges: BadgeType[] = [
  "PUNCTUAL",
  "QUALITY_WORK",
  "FAST_RESPONSE",
  "GREAT_COMMUNICATOR",
  "ID_VERIFIED",
  "CERTIFIED",
  "SUPER_PRO",
  "CLIENT_FAVORITE",
  "REPEAT_CLIENTS",
];

const adminProviderInclude = {
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      avatar: true,
      city: true,
      country: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  },
  categories: {
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  certifications: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  trustScore: {
    include: {
      badges: {
        select: {
          badgeType: true,
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

const REQUIRED_VERIFICATION_KINDS = [
  "ID_FRONT",
  "ID_BACK",
  "SELFIE",
  "ADDRESS",
] as const;

const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = [
  "NEW",
  "PENDING_PRO",
  "PENDING_CLIENT",
  "INVESTIGATING",
  "ESCALATED",
];

const adminVerificationInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isVerified: true,
    },
  },
  verificationDocs: {
    orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
  },
} satisfies Prisma.ProviderInclude;

type AdminProviderRecord = Prisma.ProviderGetPayload<{
  include: typeof adminProviderInclude;
}>;

type AdminVerificationRecord = Prisma.ProviderGetPayload<{
  include: typeof adminVerificationInclude;
}>;

const adminSupportBookingInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  provider: {
    select: {
      id: true,
      userId: true,
      profession: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  disputes: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      status: true,
      severity: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingInclude;

type AdminSupportBookingRecord = Prisma.BookingGetPayload<{
  include: typeof adminSupportBookingInclude;
}>;

const adminDisputeInclude = {
  booking: {
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      scheduledDate: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      provider: {
        select: {
          id: true,
          userId: true,
          profession: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  },
  evidences: {
    orderBy: [{ uploadedAt: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.DisputeInclude;

type AdminDisputeRecord = Prisma.DisputeGetPayload<{
  include: typeof adminDisputeInclude;
}>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listUsers(query: AdminUserQuery) {
    const where = this.buildUserWhere(query);
    const [total, users, stats] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: this.buildUserOrderBy(query),
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          city: true,
          country: true,
          isVerified: true,
          isActive: true,
          clientScore: true,
          clientTrustLevel: true,
          createdAt: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          _count: {
            select: {
              bookingsAsClient: true,
              reviewsGiven: true,
              messages: true,
            },
          },
          provider: {
            select: {
              id: true,
              profession: true,
              isPremium: true,
              isAvailable: true,
              verificationStatus: true,
              totalJobs: true,
              totalReviews: true,
              trustScore: {
                select: {
                  trustLevel: true,
                  overallScore: true,
                },
              },
            },
          },
        },
      }),
      this.getUserStats(),
    ]);

    return {
      success: true as const,
      users: users.map((user) => ({
        ...user,
        stats: {
          bookingsAsClient: user._count.bookingsAsClient,
          reviewsGiven: user._count.reviewsGiven,
          messages: user._count.messages,
        },
      })),
      pagination: this.buildPagination(query.page, query.limit, total),
      stats,
    };
  }

  async updateUser(actor: User, body: UpdateUserBody, ipAddress?: string) {
    if (body.userId === actor.id && body.isActive === false) {
      throw new BadRequestException("You cannot deactivate your own account");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: body.userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    const data: Prisma.UserUpdateInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      city: body.city,
      avatar: body.avatar,
      isActive: body.isActive,
      role: body.role,
    };

    if (body.isVerified !== undefined) {
      data.isVerified = body.isVerified;
      data.emailVerifiedAt = body.isVerified ? new Date() : null;
      data.phoneVerifiedAt = body.isVerified ? new Date() : null;
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: body.userId,
      },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "UPDATE_USER_STATUS",
      entityType: "User",
      entityId: body.userId,
      metadata: {
        isActive: body.isActive,
        isVerified: body.isVerified,
        role: body.role,
      },
      ipAddress,
    });

    return {
      success: true as const,
      user: updatedUser,
      message: "User updated successfully",
    };
  }

  async listProviders(query: AdminProviderQuery) {
    const where = this.buildProviderWhere(query);
    const [total, providers, stats] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: this.buildProviderOrderBy(query),
        include: adminProviderInclude,
      }),
      this.getProviderStats(),
    ]);

    const providerIds = providers.map((provider) => provider.id);
    const [ratingByProviderId, certifiedProviderIds] = await Promise.all([
      this.getRatingByProviderIds(providerIds),
      this.getCertifiedProviderIds(providerIds),
    ]);

    return {
      success: true as const,
      providers: providers.map((provider) =>
        this.mapAdminProvider(
          provider,
          ratingByProviderId.get(provider.id) ?? 0,
          certifiedProviderIds.has(provider.id),
        ),
      ),
      pagination: this.buildPagination(query.page, query.limit, total),
      stats,
    };
  }

  async listVerificationSubmissions(query: AdminVerificationQueueQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const where = this.buildVerificationQueueWhere(query);

    const [total, providers, stats] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        include: adminVerificationInclude,
      }),
      this.getVerificationQueueStats(),
    ]);

    return {
      success: true as const,
      submissions: providers.map((provider) =>
        this.mapVerificationSubmission(provider),
      ),
      pagination: this.buildPagination(page, limit, total),
      stats,
    };
  }

  async updateProvider(actor: User, body: UpdateProviderBody, ipAddress?: string) {
    const provider = await this.prisma.provider.findUnique({
      where: {
        id: body.providerId,
      },
      select: {
        id: true,
        userId: true,
        verificationStatus: true,
        isPremium: true,
        isAvailable: true,
      },
    });

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    const updatedProvider = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ProviderUpdateInput = {};

      if (body.verificationStatus !== undefined) {
        data.verificationStatus = body.verificationStatus;
      }

      if (body.isPremium !== undefined) {
        data.isPremium = body.isPremium;
        data.premiumExpiry = body.isPremium ? this.daysFromNow(30) : null;
      }

      if (body.isAvailable !== undefined) {
        data.isAvailable = body.isAvailable;
      }

      if (body.verificationStatus === "VERIFIED") {
        await this.approveVerificationDocsForManualOverride(
          tx,
          body.providerId,
          actor.id,
        );
      }

      if (body.verificationStatus === "REJECTED") {
        const rejectionReason = body.rejectionReason?.trim();
        if (!rejectionReason) {
          throw new BadRequestException("Rejection reason is required");
        }

        await this.rejectVerificationDocsForManualOverride(
          tx,
          body.providerId,
          actor.id,
          rejectionReason,
        );
      }

      if (body.verificationStatus !== undefined) {
        await tx.provider.update({
          where: {
            id: body.providerId,
          },
          data,
        });
        await this.syncProviderVerificationArtifacts(
          tx,
          body.providerId,
          provider.userId,
          body.verificationStatus,
        );
      } else {
        await tx.provider.update({
          where: {
            id: body.providerId,
          },
          data,
        });
      }

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action:
            body.verificationStatus !== undefined
              ? "UPDATE_PROVIDER_VERIFICATION"
              : "UPDATE_PROVIDER_STATUS",
          entityType: "Provider",
          entityId: body.providerId,
          metadata: {
            previousVerificationStatus: provider.verificationStatus,
            verificationStatus: body.verificationStatus,
            isPremium: body.isPremium,
            isAvailable: body.isAvailable,
            rejectionReason: body.rejectionReason,
          },
          ipAddress,
        },
      });

      const saved = await tx.provider.findUnique({
        where: {
          id: body.providerId,
        },
        select: {
          id: true,
          verificationStatus: true,
          isPremium: true,
          isAvailable: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isVerified: true,
            },
          },
        },
      });

      if (!saved) {
        throw new NotFoundException("Provider not found");
      }

      const notification = this.buildProviderNotification(body);
      if (notification) {
        await this.notifications.create(
          {
            userId: saved.user.id,
            ...notification,
          },
          tx,
        );
      }
      return saved;
    });

    return {
      success: true as const,
      provider: updatedProvider,
      message: "Provider updated successfully",
    };
  }

  async reviewVerificationDoc(
    actor: User,
    body: ReviewVerificationDocBody,
    ipAddress?: string,
  ) {
    const rejectionReason = body.rejectionReason?.trim() || undefined;
    if (body.decision === "REJECTED" && !rejectionReason) {
      throw new BadRequestException("Rejection reason is required");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: body.providerId },
        select: {
          id: true,
          userId: true,
          verificationStatus: true,
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!provider) {
        throw new NotFoundException("Provider not found");
      }

      const existingDoc = await tx.verificationDoc.findFirst({
        where: {
          id: body.docId,
          providerId: body.providerId,
        },
      });

      if (!existingDoc) {
        throw new NotFoundException("Verification document not found");
      }

      const reviewedAt = new Date();
      const reviewedDoc = await tx.verificationDoc.update({
        where: { id: existingDoc.id },
        data: {
          decision: body.decision,
          rejectionReason:
            body.decision === "REJECTED" ? rejectionReason ?? null : null,
          reviewedAt,
          reviewedBy: actor.id,
        },
      });

      const docs = await tx.verificationDoc.findMany({
        where: { providerId: body.providerId },
        orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
      });
      const verificationStatus = this.deriveVerificationStatusFromDocs(docs);

      await tx.provider.update({
        where: { id: body.providerId },
        data: { verificationStatus },
      });
      await this.syncProviderVerificationArtifacts(
        tx,
        body.providerId,
        provider.userId,
        verificationStatus,
      );

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "REVIEW_VERIFICATION_DOC",
          entityType: "VerificationDoc",
          entityId: body.docId,
          metadata: {
            providerId: body.providerId,
            kind: reviewedDoc.kind,
            decision: body.decision,
            rejectionReason: rejectionReason ?? null,
            previousStatus: provider.verificationStatus,
            verificationStatus,
          },
          ipAddress,
        },
      });

      if (verificationStatus !== provider.verificationStatus) {
        const notification = this.buildProviderNotification({
          providerId: body.providerId,
          verificationStatus,
          rejectionReason:
            this.findVerificationRejectionReason(docs) ?? undefined,
        });
        if (notification) {
          await this.notifications.create(
            {
              userId: provider.user.id,
              ...notification,
            },
            tx,
          );
        }
      }

      return {
        providerId: body.providerId,
        previousStatus: provider.verificationStatus,
        verificationStatus,
        docs,
        reviewedDoc,
        reviewedAt: this.latestReviewedAt(docs),
        rejectionReason: this.findVerificationRejectionReason(docs),
      };
    });

    return {
      success: true as const,
      ...result,
      docs: result.docs.map((doc) => this.mapVerificationDoc(doc)),
      reviewedDoc: this.mapVerificationDoc(result.reviewedDoc),
    };
  }

  async getCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            providers: true,
            subcategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return {
      success: true as const,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        image: category.image,
        color: category.color,
        order: category.order,
        isActive: category.isActive,
        createdAt: category.createdAt,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          categoryId: subcategory.categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description,
          icon: subcategory.icon,
          order: subcategory.order,
          isActive: subcategory.isActive,
          createdAt: subcategory.createdAt,
        })),
        stats: {
          providerCount: category._count.providers,
          subcategoryCount: category._count.subcategories,
        },
      },
    };
  }

  async listCategories(query: AdminCategoryQuery) {
    const categories = await this.prisma.category.findMany({
      where: query.includeInactive ? {} : { isActive: true },
      include: {
        subcategories: {
          where: query.includeInactive ? {} : { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            providers: true,
            subcategories: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    const [totalCategories, totalSubcategories, activeCategories, inactiveCategories] =
      await Promise.all([
        this.prisma.category.count(),
        this.prisma.subcategory.count(),
        this.prisma.category.count({ where: { isActive: true } }),
        this.prisma.category.count({ where: { isActive: false } }),
      ]);

    return {
      success: true as const,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        image: category.image,
        color: category.color,
        order: category.order,
        isActive: category.isActive,
        createdAt: category.createdAt,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          categoryId: subcategory.categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description,
          icon: subcategory.icon,
          order: subcategory.order,
          isActive: subcategory.isActive,
          createdAt: subcategory.createdAt,
        })),
        stats: {
          providerCount: category._count.providers,
          subcategoryCount: category._count.subcategories,
        },
      })),
      stats: {
        totalCategories,
        totalSubcategories,
        activeCategories,
        inactiveCategories,
        topCategories: categories
          .map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            providerCount: category._count.providers,
          }))
          .sort((left, right) => right.providerCount - left.providerCount)
          .slice(0, 10),
      },
    };
  }

  async createCategory(actor: User, body: CreateCategoryBody, ipAddress?: string) {
    await this.ensureCategorySlugAvailable(body.slug);
    await this.ensureSubcategorySlugsAvailable(body.subcategories);

    const maxOrder = await this.prisma.category.aggregate({
      _max: {
        order: true,
      },
    });

    const category = await this.prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        image: body.image,
        color: body.color,
        order: body.order ?? (maxOrder._max.order ?? 0) + 1,
        subcategories: body.subcategories
          ? {
              create: body.subcategories.map((subcategory) => ({
                name: subcategory.name,
                slug: subcategory.slug,
                description: subcategory.description,
                icon: subcategory.icon,
                order: subcategory.order ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        subcategories: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "CREATE_CATEGORY",
      entityType: "Category",
      entityId: category.id,
      metadata: {
        name: body.name,
        slug: body.slug,
      },
      ipAddress,
    });

    return {
      success: true as const,
      category,
      message: "Category created successfully",
    };
  }

  async updateCategory(actor: User, body: UpdateCategoryBody, ipAddress?: string) {
    const categoryId = body.categoryId ?? body.id;
    if (!categoryId) {
      throw new BadRequestException("Category id is required");
    }

    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException("Category not found");
    }

    if (body.slug && body.slug !== existingCategory.slug) {
      await this.ensureCategorySlugAvailable(body.slug);
    }

    const updatedCategory = await this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        image: body.image,
        color: body.color,
        order: body.order,
        isActive: body.isActive,
      },
      include: {
        subcategories: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "UPDATE_CATEGORY",
      entityType: "Category",
      entityId: categoryId,
      metadata: {
        name: body.name,
        slug: body.slug,
        isActive: body.isActive,
      },
      ipAddress,
    });

    return {
      success: true as const,
      category: updatedCategory,
      message: "Category updated successfully",
    };
  }

  async deleteCategory(actor: User, id: string, ipAddress?: string) {
    const providersCount = await this.prisma.providerCategory.count({
      where: {
        categoryId: id,
      },
    });

    if (providersCount > 0) {
      throw new BadRequestException(
        `Category still has ${providersCount} provider association(s)`,
      );
    }

    await this.prisma.category.delete({
      where: {
        id,
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "DELETE_CATEGORY",
      entityType: "Category",
      entityId: id,
      ipAddress,
    });

    return {
      success: true as const,
      message: "Category deleted successfully",
    };
  }

  async createSubcategory(
    actor: User,
    body: CreateSubcategoryBody,
    ipAddress?: string,
  ) {
    const parent = await this.prisma.category.findUnique({
      where: { id: body.categoryId },
    });
    if (!parent) {
      throw new NotFoundException("Category not found");
    }

    await this.ensureSubcategorySlugUnique(body.slug);

    const subcategory = await this.prisma.subcategory.create({
      data: {
        categoryId: body.categoryId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        order: body.order ?? 0,
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "CREATE_SUBCATEGORY",
      entityType: "Subcategory",
      entityId: subcategory.id,
      metadata: {
        categoryId: body.categoryId,
        name: body.name,
        slug: body.slug,
      },
      ipAddress,
    });

    return {
      success: true as const,
      subcategory,
      message: "Subcategory created successfully",
    };
  }

  async updateSubcategory(
    actor: User,
    body: UpdateSubcategoryBody,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.subcategory.findUnique({
      where: { id: body.id },
    });
    if (!existing) {
      throw new NotFoundException("Subcategory not found");
    }

    if (body.slug && body.slug !== existing.slug) {
      await this.ensureSubcategorySlugUnique(body.slug, body.id);
    }

    const updated = await this.prisma.subcategory.update({
      where: { id: body.id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        order: body.order,
        isActive: body.isActive,
      },
    });

    await this.logActivity({
      userId: actor.id,
      action: "UPDATE_SUBCATEGORY",
      entityType: "Subcategory",
      entityId: body.id,
      metadata: {
        name: body.name,
        slug: body.slug,
        isActive: body.isActive,
      },
      ipAddress,
    });

    return {
      success: true as const,
      subcategory: updated,
      message: "Subcategory updated successfully",
    };
  }

  async deleteSubcategory(actor: User, id: string, ipAddress?: string) {
    const providersCount = await this.prisma.providerSubcategory.count({
      where: { subcategoryId: id },
    });

    if (providersCount > 0) {
      throw new BadRequestException(
        `Subcategory still has ${providersCount} provider association(s)`,
      );
    }

    await this.prisma.subcategory.delete({
      where: { id },
    });

    await this.logActivity({
      userId: actor.id,
      action: "DELETE_SUBCATEGORY",
      entityType: "Subcategory",
      entityId: id,
      ipAddress,
    });

    return {
      success: true as const,
      message: "Subcategory deleted successfully",
    };
  }

  async listReviews(query: AdminReviewQuery) {
    const where = this.buildReviewWhere(query);

    const [
      total,
      reviews,
      totalReviews,
      publicReviews,
      hiddenReviews,
      averageScores,
      reviewsWithComments,
      reviewsThisWeek,
      reviewsThisMonth,
      ratingDistribution,
    ] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: this.buildReviewOrderBy(query),
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          provider: {
            select: {
              id: true,
              profession: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              title: true,
              status: true,
              price: true,
              scheduledDate: true,
            },
          },
        },
      }),
      this.prisma.review.count(),
      this.prisma.review.count({ where: { isPublic: true } }),
      this.prisma.review.count({ where: { isPublic: false } }),
      this.prisma.review.aggregate({
        _avg: {
          overallScore: true,
          punctuality: true,
          quality: true,
          communication: true,
          value: true,
          professionalism: true,
        },
      }),
      this.prisma.review.count({
        where: {
          comment: {
            not: null,
          },
        },
      }),
      this.prisma.review.count({
        where: {
          createdAt: {
            gte: this.daysAgo(7),
          },
        },
      }),
      this.prisma.review.count({
        where: {
          createdAt: {
            gte: this.daysAgo(30),
          },
        },
      }),
      this.prisma.review.groupBy({
        by: ["overallScore"],
        _count: {
          id: true,
        },
        orderBy: {
          overallScore: "desc",
        },
      }),
    ]);

    return {
      success: true as const,
      reviews: reviews.map((review) => ({
        id: review.id,
        bookingId: review.bookingId,
        clientId: review.clientId,
        providerId: review.providerId,
        rating: this.round(review.overallScore),
        punctuality: review.punctuality,
        quality: review.quality,
        communication: review.communication,
        value: review.value,
        professionalism: review.professionalism,
        overallScore: review.overallScore,
        comment: review.comment,
        isPublic: review.isPublic,
        isEdited: review.isEdited,
        reply: review.reply,
        repliedAt: review.repliedAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        client: review.client,
        provider: {
          id: review.provider.id,
          profession: review.provider.profession,
          userId: review.provider.user.id,
          firstName: review.provider.user.firstName,
          lastName: review.provider.user.lastName,
          avatar: review.provider.user.avatar,
        },
        booking: review.booking
          ? {
              id: review.booking.id,
              title: review.booking.title,
              status: review.booking.status,
              price: review.booking.price,
              scheduledDate: review.booking.scheduledDate,
              service: review.booking.title,
            }
          : null,
      })),
      pagination: this.buildPagination(query.page, query.limit, total),
      stats: {
        totalReviews,
        publicReviews,
        hiddenReviews,
        avgOverallScore: this.round(averageScores._avg.overallScore ?? 0),
        avgPunctuality: this.round(averageScores._avg.punctuality ?? 0),
        avgQuality: this.round(averageScores._avg.quality ?? 0),
        avgCommunication: this.round(averageScores._avg.communication ?? 0),
        avgValue: this.round(averageScores._avg.value ?? 0),
        avgProfessionalism: this.round(averageScores._avg.professionalism ?? 0),
        reviewsWithComments,
        reviewsThisWeek,
        reviewsThisMonth,
        ratingDistribution: ratingDistribution.map((item) => ({
          score: item.overallScore,
          count: item._count.id,
        })),
      },
    };
  }

  async moderateReview(actor: User, body: ModerateReviewBody, ipAddress?: string) {
    const review = await this.prisma.review.findUnique({
      where: {
        id: body.reviewId,
      },
      select: {
        id: true,
        clientId: true,
      },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const updatedReview = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.review.update({
        where: {
          id: body.reviewId,
        },
        data: {
          isPublic: body.isPublic,
          isEdited: body.isEdited,
          reply: body.reply === undefined ? undefined : body.reply,
          repliedAt:
            body.reply === undefined ? undefined : body.reply ? new Date() : null,
        },
        select: {
          id: true,
          isPublic: true,
          isEdited: true,
          reply: true,
          repliedAt: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          provider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "MODERATE_REVIEW",
          entityType: "Review",
          entityId: body.reviewId,
          metadata: {
            isPublic: body.isPublic,
            isEdited: body.isEdited,
            hasReply: Boolean(body.reply),
          },
          ipAddress,
        },
      });

      if (body.isPublic === false) {
        await this.notifications.create(
          {
            userId: review.clientId,
            type: "SYSTEM",
            title: "Avis masque",
            message:
              "Votre avis a ete masque par un administrateur car il ne respecte pas les regles de la plateforme.",
          },
          tx,
        );
      }

      return saved;
    });

    return {
      success: true as const,
      review: updatedReview,
      message: "Review updated successfully",
    };
  }

  async deleteReview(actor: User, id: string, ipAddress?: string) {
    const review = await this.prisma.review.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        overallScore: true,
        comment: true,
        clientId: true,
        providerId: true,
      },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: {
          id,
        },
      });

      await this.syncProviderTrustArtifacts(tx, review.providerId);

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "DELETE_REVIEW",
          entityType: "Review",
          entityId: id,
          metadata: {
            clientId: review.clientId,
            providerId: review.providerId,
            overallScore: review.overallScore,
            comment: review.comment?.slice(0, 100) ?? null,
          },
          ipAddress,
        },
      });

      await this.notifications.create(
        {
          userId: review.clientId,
          type: "SYSTEM",
          title: "Avis supprime",
          message:
            "Votre avis a ete supprime par un administrateur car il ne respecte pas les regles de la plateforme.",
        },
        tx,
      );
    });

    return {
      success: true as const,
      message: "Review deleted successfully",
    };
  }

  async listSupportBookings(query: AdminSupportBookingQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const where = this.buildSupportBookingWhere(query);

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        include: adminSupportBookingInclude,
      }),
    ]);

    return {
      success: true as const,
      bookings: bookings.map((booking) => this.mapSupportBooking(booking)),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async listDisputes(query: AdminDisputeQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const where = this.buildDisputeWhere(query);
    const baseWhere = this.buildDisputeWhere({ ...query, status: undefined });

    const [total, disputes, open, escalated, resolved] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ resolvedAt: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
        include: adminDisputeInclude,
      }),
      this.prisma.dispute.count({
        where: {
          ...baseWhere,
          status: {
            in: ACTIVE_DISPUTE_STATUSES,
          },
        },
      }),
      this.prisma.dispute.count({
        where: {
          ...baseWhere,
          status: "ESCALATED",
        },
      }),
      this.prisma.dispute.count({
        where: {
          ...baseWhere,
          status: "RESOLVED",
        },
      }),
    ]);

    return {
      success: true as const,
      disputes: disputes.map((dispute) => this.mapAdminDispute(dispute)),
      pagination: this.buildPagination(page, limit, total),
      stats: {
        open,
        escalated,
        resolved,
      },
    };
  }

  async createDispute(actor: User, body: CreateDisputeBody, ipAddress?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: body.bookingId },
      select: {
        id: true,
        title: true,
        clientId: true,
        providerId: true,
        provider: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const existingActiveDispute = await this.prisma.dispute.findFirst({
      where: {
        bookingId: body.bookingId,
        status: {
          in: ACTIVE_DISPUTE_STATUSES,
        },
      },
      select: {
        id: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    if (existingActiveDispute) {
      throw new BadRequestException(
        "An active support ticket already exists for this booking",
      );
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          bookingId: body.bookingId,
          origin: body.reporterRole,
          openedById:
            body.reporterRole === "CLIENT"
              ? booking.clientId
              : booking.provider.userId,
          reason: body.reason.trim(),
          clientStatement:
            body.reporterRole === "CLIENT" ? body.statement.trim() : null,
          proStatement:
            body.reporterRole === "PROVIDER" ? body.statement.trim() : null,
          severity: body.severity ?? "MEDIUM",
          status:
            body.reporterRole === "CLIENT" ? "PENDING_PRO" : "PENDING_CLIENT",
        },
        include: adminDisputeInclude,
      });

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "CREATE_DISPUTE",
          entityType: "Dispute",
          entityId: created.id,
          metadata: {
            bookingId: body.bookingId,
            reporterRole: body.reporterRole,
            severity: created.severity,
            status: created.status,
          },
          ipAddress,
        },
      });

      const notificationTargets = [
        created.booking.client.id,
        created.booking.provider.user.id,
      ];
      await Promise.all(
        notificationTargets.map((userId) =>
          this.notifications.create(
            {
              userId,
              type: "SYSTEM",
              title: "Support ticket ouvert",
              message: `Un ticket support a ete ouvert pour la reservation ${booking.title}.`,
            },
            tx,
          ),
        ),
      );

      return created;
    });

    return {
      success: true as const,
      dispute: this.mapAdminDispute(dispute),
      message: "Support ticket created successfully",
    };
  }

  async updateDispute(actor: User, body: UpdateDisputeBody, ipAddress?: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: body.disputeId },
      select: {
        id: true,
        status: true,
        severity: true,
        booking: {
          select: {
            title: true,
            clientId: true,
            provider: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    const nextStatus = body.status ?? dispute.status;
    const resolution = body.resolution === undefined ? undefined : body.resolution?.trim() || null;

    if (nextStatus === "RESOLVED" && !resolution) {
      throw new BadRequestException("Resolution note is required");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.dispute.update({
        where: { id: body.disputeId },
        data: {
          status: body.status,
          severity: body.severity,
          resolution,
          resolutionPct:
            body.resolutionPct === undefined ? undefined : body.resolutionPct,
          deadlineAt:
            body.deadlineAt === undefined
              ? undefined
              : body.deadlineAt
                ? new Date(body.deadlineAt)
                : null,
          resolvedAt:
            body.status === undefined
              ? undefined
              : body.status === "RESOLVED"
                ? new Date()
                : null,
        },
        include: adminDisputeInclude,
      });

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "UPDATE_DISPUTE",
          entityType: "Dispute",
          entityId: body.disputeId,
          metadata: {
            previousStatus: dispute.status,
            status: body.status,
            previousSeverity: dispute.severity,
            severity: body.severity,
            resolutionPct: body.resolutionPct,
            hasResolution: Boolean(resolution),
          },
          ipAddress,
        },
      });

      const transitionedToResolved =
        dispute.status !== "RESOLVED" && saved.status === "RESOLVED";

      if (transitionedToResolved) {
        await Promise.all(
          [saved.booking.client.id, saved.booking.provider.user.id].map((userId) =>
            this.notifications.create(
              {
                userId,
                type: "SYSTEM",
                title: "Support ticket resolu",
                message: `Le ticket support pour la reservation ${saved.booking.title} a ete marque comme resolu.`,
              },
              tx,
            ),
          ),
        );
      }

      return saved;
    });

    return {
      success: true as const,
      dispute: this.mapAdminDispute(updated),
      message: "Support ticket updated successfully",
    };
  }

  private buildUserWhere(query: AdminUserQuery): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status === "active") {
      where.isActive = true;
    } else if (query.status === "inactive") {
      where.isActive = false;
    } else if (query.status === "verified") {
      where.isVerified = true;
    } else if (query.status === "unverified") {
      where.isVerified = false;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private buildProviderWhere(query: AdminProviderQuery): Prisma.ProviderWhereInput {
    const conditions: Prisma.ProviderWhereInput[] = [];

    if (query.status === "premium") {
      conditions.push({ isPremium: true });
    } else if (query.status === "available") {
      conditions.push({ isAvailable: true });
    } else if (query.status === "unavailable") {
      conditions.push({ isAvailable: false });
    }

    if (query.verificationStatus) {
      conditions.push({ verificationStatus: query.verificationStatus });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { profession: { contains: query.search, mode: "insensitive" } },
          { user: { firstName: { contains: query.search, mode: "insensitive" } } },
          { user: { lastName: { contains: query.search, mode: "insensitive" } } },
          { user: { email: { contains: query.search, mode: "insensitive" } } },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private buildSupportBookingWhere(
    query: AdminSupportBookingQuery,
  ): Prisma.BookingWhereInput {
    const conditions: Prisma.BookingWhereInput[] = [];

    if (query.status) {
      conditions.push({ status: query.status });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { id: { contains: query.search, mode: "insensitive" } },
          { title: { contains: query.search, mode: "insensitive" } },
          { city: { contains: query.search, mode: "insensitive" } },
          { address: { contains: query.search, mode: "insensitive" } },
          {
            client: {
              firstName: { contains: query.search, mode: "insensitive" },
            },
          },
          {
            client: {
              lastName: { contains: query.search, mode: "insensitive" },
            },
          },
          { client: { email: { contains: query.search, mode: "insensitive" } } },
          { client: { phone: { contains: query.search, mode: "insensitive" } } },
          {
            provider: {
              profession: { contains: query.search, mode: "insensitive" },
            },
          },
          {
            provider: {
              user: {
                firstName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            provider: {
              user: {
                lastName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            provider: {
              user: {
                email: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private buildDisputeWhere(query: AdminDisputeQuery): Prisma.DisputeWhereInput {
    const conditions: Prisma.DisputeWhereInput[] = [];

    if (query.status) {
      conditions.push({ status: query.status });
    }

    if (query.severity) {
      conditions.push({ severity: query.severity });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { id: { contains: query.search, mode: "insensitive" } },
          { bookingId: { contains: query.search, mode: "insensitive" } },
          { reason: { contains: query.search, mode: "insensitive" } },
          { clientStatement: { contains: query.search, mode: "insensitive" } },
          { proStatement: { contains: query.search, mode: "insensitive" } },
          { resolution: { contains: query.search, mode: "insensitive" } },
          {
            booking: {
              title: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
          {
            booking: {
              client: {
                firstName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            booking: {
              client: {
                lastName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            booking: {
              provider: {
                user: {
                  firstName: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          {
            booking: {
              provider: {
                user: {
                  lastName: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private buildReviewWhere(query: AdminReviewQuery): Prisma.ReviewWhereInput {
    const conditions: Prisma.ReviewWhereInput[] = [];

    if (query.isPublic !== undefined) {
      conditions.push({ isPublic: query.isPublic });
    }

    if (query.minRating !== undefined || query.maxRating !== undefined) {
      conditions.push({
        overallScore: {
          ...(query.minRating !== undefined ? { gte: query.minRating } : {}),
          ...(query.maxRating !== undefined ? { lte: query.maxRating } : {}),
        },
      });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { comment: { contains: query.search, mode: "insensitive" } },
          { client: { firstName: { contains: query.search, mode: "insensitive" } } },
          { client: { lastName: { contains: query.search, mode: "insensitive" } } },
          {
            provider: {
              user: {
                firstName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            provider: {
              user: {
                lastName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private buildUserOrderBy(query: AdminUserQuery): Prisma.UserOrderByWithRelationInput {
    const sortOrder = query.sortOrder ?? "desc";

    switch (query.sortBy) {
      case "firstName":
        return { firstName: sortOrder };
      case "lastName":
        return { lastName: sortOrder };
      case "role":
        return { role: sortOrder };
      case "lastLoginAt":
        return { lastLoginAt: sortOrder };
      case "createdAt":
      default:
        return { createdAt: sortOrder };
    }
  }

  private buildProviderOrderBy(query: AdminProviderQuery): Prisma.ProviderOrderByWithRelationInput {
    const sortOrder = query.sortOrder ?? "desc";

    switch (query.sortBy) {
      case "profession":
        return { profession: sortOrder };
      case "verificationStatus":
        return { verificationStatus: sortOrder };
      case "totalJobs":
        return { totalJobs: sortOrder };
      case "createdAt":
      default:
        return { createdAt: sortOrder };
    }
  }

  private buildReviewOrderBy(query: AdminReviewQuery): Prisma.ReviewOrderByWithRelationInput {
    const sortOrder = query.sortOrder ?? "desc";

    switch (query.sortBy) {
      case "overallScore":
        return { overallScore: sortOrder };
      case "updatedAt":
        return { updatedAt: sortOrder };
      case "createdAt":
      default:
        return { createdAt: sortOrder };
    }
  }

  private async getUserStats() {
    const [totalUsers, totalClients, totalProviders, totalAdmins, activeUsers, verifiedUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: "CLIENT" } }),
        this.prisma.user.count({ where: { role: "PROVIDER" } }),
        this.prisma.user.count({ where: { role: "ADMIN" } }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isVerified: true } }),
      ]);

    return {
      totalUsers,
      totalClients,
      totalProviders,
      totalAdmins,
      activeUsers,
      verifiedUsers,
      newUsersThisWeek: await this.prisma.user.count({
        where: {
          createdAt: {
            gte: this.daysAgo(7),
          },
        },
      }),
      newUsersThisMonth: await this.prisma.user.count({
        where: {
          createdAt: {
            gte: this.daysAgo(30),
          },
        },
      }),
    };
  }

  private async getProviderStats() {
    const [
      totalProviders,
      verifiedProviders,
      premiumProviders,
      availableProviders,
      pendingVerifications,
      totalBookings,
      completedBookings,
      verificationDistribution,
      trustLevelDistribution,
    ] = await Promise.all([
      this.prisma.provider.count(),
      this.prisma.provider.count({ where: { verificationStatus: "VERIFIED" } }),
      this.prisma.provider.count({ where: { isPremium: true } }),
      this.prisma.provider.count({ where: { isAvailable: true } }),
      this.prisma.provider.count({
        where: {
          verificationStatus: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: "COMPLETED" } }),
      this.prisma.provider.groupBy({
        by: ["verificationStatus"],
        _count: {
          id: true,
        },
      }),
      this.prisma.trustScore.groupBy({
        by: ["trustLevel"],
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalProviders,
      verifiedProviders,
      premiumProviders,
      availableProviders,
      pendingVerifications,
      totalBookings,
      completedBookings,
      verificationDistribution: verificationDistribution.map((item) => ({
        status: item.verificationStatus,
        count: item._count.id,
      })),
      trustLevelDistribution: trustLevelDistribution.map((item) => ({
        level: item.trustLevel,
        count: item._count.id,
      })),
    };
  }

  private async ensureCategorySlugAvailable(slug: string) {
    const existing = await this.prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException("Category slug already exists");
    }
  }

  private async ensureSubcategorySlugsAvailable(
    subcategories?: CreateCategoryBody["subcategories"],
  ) {
    if (!subcategories || subcategories.length === 0) {
      return;
    }

    const slugs = subcategories.map((subcategory) => subcategory.slug);
    const uniqueSlugs = new Set(slugs);
    if (uniqueSlugs.size !== slugs.length) {
      throw new BadRequestException("Subcategory slugs must be unique");
    }

    const existing = await this.prisma.subcategory.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
      select: {
        slug: true,
      },
    });

    if (existing.length > 0) {
      throw new BadRequestException("One or more subcategory slugs already exist");
    }
  }

  private async ensureSubcategorySlugUnique(slug: string, excludeId?: string) {
    const existing = await this.prisma.subcategory.findMany({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing.length > 0) {
      throw new BadRequestException("Subcategory slug already exists");
    }
  }

  private buildProviderNotification(body: UpdateProviderBody) {
    if (body.verificationStatus === "VERIFIED") {
      return {
        type: "CERTIFICATION_VERIFIED" as const,
        title: "Compte verifie",
        message: "Votre compte prestataire a ete verifie avec succes.",
      };
    }

    if (body.verificationStatus === "REJECTED") {
      return {
        type: "SYSTEM" as const,
        title: "Verification rejetee",
        message: body.rejectionReason
          ? `Votre verification a ete rejetee: ${body.rejectionReason}`
          : "Votre verification a ete rejetee.",
      };
    }

    if (body.isPremium === true) {
      return {
        type: "SYSTEM" as const,
        title: "Compte Premium active",
        message: "Votre compte Premium a ete active pour 30 jours.",
      };
    }

    if (body.isPremium === false) {
      return {
        type: "SYSTEM" as const,
        title: "Compte Premium desactive",
        message: "Votre compte Premium a ete desactive.",
      };
    }

    return null;
  }

  private async getRatingByProviderIds(providerIds: string[]) {
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
    });

    return new Map(
      ratings.map((item) => [item.providerId, this.round(item._avg.overallScore ?? 0)]),
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

  private mapAdminProvider(
    provider: AdminProviderRecord,
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
      rating,
      totalJobs: provider.totalJobs,
      totalReviews: provider.totalReviews,
      responseTime: provider.responseTime,
      isPremium: provider.isPremium,
      premiumExpiry: provider.premiumExpiry,
      isAvailable: provider.isAvailable,
      isCertified,
      verificationStatus: provider.verificationStatus,
      createdAt: provider.createdAt,
      user: provider.user,
      categories: provider.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
      })),
      certifications: provider.certifications,
      trustScore: provider.trustScore,
      stats: {
        totalBookings: provider._count.bookings,
        totalReviews: provider._count.reviews,
      },
    };
  }

  private mapSupportBooking(booking: AdminSupportBookingRecord) {
    const activeDispute = booking.disputes.find((dispute) =>
      ACTIVE_DISPUTE_STATUSES.includes(dispute.status),
    );
    const latestDispute = booking.disputes[0] ?? null;

    return {
      id: booking.id,
      title: booking.title,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      createdAt: booking.createdAt,
      price: booking.price,
      city: booking.city,
      address: booking.address,
      isPaid: booking.isPaid,
      paymentMethod: booking.paymentMethod ?? null,
      client: {
        id: booking.client.id,
        name: this.formatDisplayName(
          booking.client.firstName,
          booking.client.lastName,
          "Client",
        ),
        email: booking.client.email,
        phone: booking.client.phone,
      },
      provider: {
        id: booking.provider.id,
        userId: booking.provider.userId,
        name: this.formatDisplayName(
          booking.provider.user.firstName,
          booking.provider.user.lastName,
          "Prestataire",
        ),
        profession: booking.provider.profession,
        email: booking.provider.user.email,
        phone: booking.provider.user.phone,
      },
      support: {
        disputeCount: booking.disputes.length,
        activeDisputeId: activeDispute?.id ?? null,
        activeDisputeStatus: activeDispute?.status ?? null,
        activeDisputeSeverity: activeDispute?.severity ?? null,
        lastDisputeAt: latestDispute?.createdAt ?? null,
      },
    };
  }

  private mapAdminDispute(dispute: AdminDisputeRecord) {
    return {
      id: dispute.id,
      bookingId: dispute.bookingId,
      origin: dispute.origin,
      openedById: dispute.openedById,
      reason: dispute.reason,
      clientStatement: dispute.clientStatement,
      proStatement: dispute.proStatement,
      status: dispute.status,
      severity: dispute.severity,
      resolution: dispute.resolution,
      resolutionPct: dispute.resolutionPct,
      resolvedAt: dispute.resolvedAt,
      deadlineAt: dispute.deadlineAt,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      evidences: dispute.evidences.map((evidence) => ({
        id: evidence.id,
        url: evidence.url,
        note: evidence.note,
        uploadedAt: evidence.uploadedAt,
        uploadedByRole:
          evidence.uploadedById === dispute.booking.client.id
            ? "client"
            : evidence.uploadedById === dispute.booking.provider.user.id
              ? "pro"
              : "ops",
      })),
      booking: {
        id: dispute.booking.id,
        title: dispute.booking.title,
        status: dispute.booking.status,
        price: dispute.booking.price,
        scheduledDate: dispute.booking.scheduledDate,
        client: {
          id: dispute.booking.client.id,
          name: this.formatDisplayName(
            dispute.booking.client.firstName,
            dispute.booking.client.lastName,
            "Client",
          ),
          email: dispute.booking.client.email,
          phone: dispute.booking.client.phone,
        },
        provider: {
          id: dispute.booking.provider.id,
          userId: dispute.booking.provider.userId,
          name: this.formatDisplayName(
            dispute.booking.provider.user.firstName,
            dispute.booking.provider.user.lastName,
            "Prestataire",
          ),
          profession: dispute.booking.provider.profession,
          email: dispute.booking.provider.user.email,
          phone: dispute.booking.provider.user.phone,
        },
      },
      client: {
        id: dispute.booking.client.id,
        firstName: dispute.booking.client.firstName,
        lastName: dispute.booking.client.lastName,
        avatar: dispute.booking.client.avatar,
      },
    };
  }

  private buildVerificationQueueWhere(query: AdminVerificationQueueQuery) {
    const search = query.search?.trim();
    const where: Prisma.ProviderWhereInput = {
      verificationDocs: {
        some: {},
      },
    };

    if (query.status) {
      where.verificationStatus = query.status;
    } else {
      where.verificationStatus = {
        in: ["UNDER_REVIEW", "REJECTED"],
      };
    }

    if (search) {
      where.OR = [
        {
          profession: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    return where;
  }

  private async getVerificationQueueStats() {
    const [underReview, rejected, verified] = await Promise.all([
      this.prisma.provider.count({
        where: {
          verificationStatus: "UNDER_REVIEW",
          verificationDocs: { some: {} },
        },
      }),
      this.prisma.provider.count({
        where: {
          verificationStatus: "REJECTED",
          verificationDocs: { some: {} },
        },
      }),
      this.prisma.provider.count({
        where: {
          verificationStatus: "VERIFIED",
          verificationDocs: { some: {} },
        },
      }),
    ]);

    return {
      underReview,
      rejected,
      verified,
    };
  }

  private mapVerificationSubmission(provider: AdminVerificationRecord) {
    return {
      providerId: provider.id,
      providerName: this.formatDisplayName(
        provider.user.firstName,
        provider.user.lastName,
      ),
      providerEmail: provider.user.email,
      profession: provider.profession,
      verificationStatus: provider.verificationStatus,
      submittedAt: this.latestUploadedAt(provider.verificationDocs),
      reviewedAt: this.latestReviewedAt(provider.verificationDocs),
      rejectionReason: this.findVerificationRejectionReason(
        provider.verificationDocs,
      ),
      docs: provider.verificationDocs.map((doc) => this.mapVerificationDoc(doc)),
      counts: {
        total: provider.verificationDocs.length,
        pending: provider.verificationDocs.filter((doc) => !doc.decision).length,
        approved: provider.verificationDocs.filter(
          (doc) => doc.decision === "APPROVED",
        ).length,
        rejected: provider.verificationDocs.filter(
          (doc) => doc.decision === "REJECTED",
        ).length,
      },
    };
  }

  private mapVerificationDoc(doc: VerificationDoc) {
    return {
      id: doc.id,
      kind: doc.kind,
      url: doc.url,
      storagePolicy: "LAUNCH_STUB_METADATA_ONLY" as const,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt,
      reviewedBy: doc.reviewedBy,
      decision: doc.decision,
      rejectionReason: doc.rejectionReason,
    };
  }

  private deriveVerificationStatusFromDocs(docs: VerificationDoc[]): VerificationStatus {
    const presentKinds = new Set(docs.map((doc) => doc.kind));
    const missingRequired = REQUIRED_VERIFICATION_KINDS.some(
      (kind) => !presentKinds.has(kind),
    );
    if (missingRequired) {
      return "PENDING";
    }

    if (docs.some((doc) => doc.decision === "REJECTED")) {
      return "REJECTED";
    }

    const requiredDocs = docs.filter((doc) =>
      REQUIRED_VERIFICATION_KINDS.includes(doc.kind as (typeof REQUIRED_VERIFICATION_KINDS)[number]),
    );
    if (requiredDocs.every((doc) => doc.decision === "APPROVED")) {
      return "VERIFIED";
    }

    return "UNDER_REVIEW";
  }

  private async syncProviderVerificationArtifacts(
    tx: Prisma.TransactionClient,
    providerId: string,
    userId: string,
    verificationStatus: VerificationStatus,
  ) {
    await tx.user.update({
      where: {
        id: userId,
      },
      data:
        verificationStatus === "VERIFIED"
          ? {
              isVerified: true,
              emailVerifiedAt: new Date(),
              phoneVerifiedAt: new Date(),
            }
          : {
              isVerified: false,
            },
    });

    await this.syncProviderTrustArtifacts(tx, providerId);
  }

  private async approveVerificationDocsForManualOverride(
    tx: Prisma.TransactionClient,
    providerId: string,
    reviewerId: string,
  ) {
    const docs = await tx.verificationDoc.findMany({
      where: { providerId },
      orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
    });

    const presentKinds = new Set(docs.map((doc) => doc.kind));
    const missingRequired = REQUIRED_VERIFICATION_KINDS.filter(
      (kind) => !presentKinds.has(kind),
    );
    if (missingRequired.length > 0) {
      throw new BadRequestException("Required verification documents are missing");
    }

    const reviewedAt = new Date();
    for (const doc of docs) {
      if (doc.decision === "APPROVED") {
        continue;
      }

      await tx.verificationDoc.update({
        where: { id: doc.id },
        data: {
          decision: "APPROVED",
          rejectionReason: null,
          reviewedAt,
          reviewedBy: reviewerId,
        },
      });
    }
  }

  private async rejectVerificationDocsForManualOverride(
    tx: Prisma.TransactionClient,
    providerId: string,
    reviewerId: string,
    rejectionReason: string,
  ) {
    const docs = await tx.verificationDoc.findMany({
      where: { providerId },
      orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
    });

    if (docs.length === 0) {
      throw new BadRequestException("No verification documents submitted");
    }

    const target =
      docs.find((doc) => !doc.decision) ??
      docs.find((doc) => doc.decision === "APPROVED") ??
      docs[0];

    await tx.verificationDoc.update({
      where: { id: target.id },
      data: {
        decision: "REJECTED",
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });
  }

  private latestUploadedAt(docs: VerificationDoc[]) {
    return docs.reduce<Date | null>((latest, doc) => {
      if (!latest || doc.uploadedAt > latest) {
        return doc.uploadedAt;
      }
      return latest;
    }, null);
  }

  private latestReviewedAt(docs: VerificationDoc[]) {
    return docs.reduce<Date | null>((latest, doc) => {
      if (!doc.reviewedAt) {
        return latest;
      }
      if (!latest || doc.reviewedAt > latest) {
        return doc.reviewedAt;
      }
      return latest;
    }, null);
  }

  private findVerificationRejectionReason(docs: VerificationDoc[]) {
    return docs.find((doc) => doc.decision === "REJECTED")?.rejectionReason ?? null;
  }

  private formatDisplayName(
    firstName?: string | null,
    lastName?: string | null,
    fallback = "Prestataire",
  ) {
    const value = [firstName, lastName].filter(Boolean).join(" ").trim();
    return value || fallback;
  }

  private async syncProviderTrustArtifacts(
    tx: Prisma.TransactionClient,
    providerId: string,
  ) {
    const [
      provider,
      reviewAggregate,
      favoriteCount,
      verifiedCertificationCount,
      cancelledJobs,
      repeatClientGroups,
    ] = await Promise.all([
      tx.provider.findUnique({
        where: {
          id: providerId,
        },
        select: {
          id: true,
          userId: true,
          totalJobs: true,
          responseTime: true,
          user: {
            select: {
              isVerified: true,
            },
          },
        },
      }),
      tx.review.aggregate({
        where: {
          providerId,
        },
        _count: {
          _all: true,
        },
        _avg: {
          overallScore: true,
          punctuality: true,
          quality: true,
          communication: true,
          professionalism: true,
          value: true,
        },
      }),
      tx.favorite.count({
        where: {
          providerId,
        },
      }),
      tx.certification.count({
        where: {
          providerId,
          status: "VERIFIED",
        },
      }),
      tx.booking.count({
        where: {
          providerId,
          status: "CANCELLED",
        },
      }),
      tx.booking.groupBy({
        by: ["clientId"],
        where: {
          providerId,
          status: "COMPLETED",
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    const totalReviews = reviewAggregate._count._all;
    const reliability = this.toPercentage(
      reviewAggregate._avg.punctuality ?? reviewAggregate._avg.overallScore ?? 0,
    );
    const quality = this.toPercentage(
      reviewAggregate._avg.quality ?? reviewAggregate._avg.overallScore ?? 0,
    );
    const communication = this.toPercentage(
      reviewAggregate._avg.communication ?? reviewAggregate._avg.overallScore ?? 0,
    );
    const professionalism = this.toPercentage(
      reviewAggregate._avg.professionalism ??
        reviewAggregate._avg.value ??
        reviewAggregate._avg.overallScore ??
        0,
    );
    const overallScore = this.round(
      reliability * 0.3 +
        quality * 0.3 +
        communication * 0.2 +
        professionalism * 0.2,
    );
    const repeatClients = repeatClientGroups.filter((group) => group._count._all >= 2).length;
    const trustLevel = this.getTrustLevel(provider.totalJobs, overallScore);

    await tx.provider.update({
      where: {
        id: providerId,
      },
      data: {
        totalReviews,
      },
    });

    const trustScore = await tx.trustScore.upsert({
      where: {
        providerId,
      },
      update: {
        overallScore,
        reliability,
        quality,
        communication,
        professionalism,
        trustLevel,
        completedJobs: provider.totalJobs,
        cancelledJobs,
        avgResponseTime: provider.responseTime,
      },
      create: {
        providerId,
        overallScore,
        reliability,
        quality,
        communication,
        professionalism,
        trustLevel,
        completedJobs: provider.totalJobs,
        cancelledJobs,
        avgResponseTime: provider.responseTime,
      },
      select: {
        id: true,
      },
    });

    const badgeOwnerId = trustScore.id;
    const existingBadges = await tx.providerBadge.findMany({
      where: {
        providerId: badgeOwnerId,
        badgeType: {
          in: managedBadges,
        },
      },
      select: {
        badgeType: true,
      },
    });

    const desiredBadges = new Set<BadgeType>();
    if (totalReviews >= 10 && (reviewAggregate._avg.punctuality ?? 0) >= 4.5) {
      desiredBadges.add("PUNCTUAL");
    }
    if (totalReviews >= 10 && (reviewAggregate._avg.quality ?? 0) >= 4.5) {
      desiredBadges.add("QUALITY_WORK");
    }
    if (totalReviews >= 10 && (reviewAggregate._avg.communication ?? 0) >= 4.5) {
      desiredBadges.add("GREAT_COMMUNICATOR");
    }
    if (provider.responseTime > 0 && provider.responseTime <= 30) {
      desiredBadges.add("FAST_RESPONSE");
    }
    if (favoriteCount >= 5) {
      desiredBadges.add("CLIENT_FAVORITE");
    }
    if (repeatClients >= 3) {
      desiredBadges.add("REPEAT_CLIENTS");
    }
    if (provider.user.isVerified) {
      desiredBadges.add("ID_VERIFIED");
    }
    if (verifiedCertificationCount > 0) {
      desiredBadges.add("CERTIFIED");
    }
    if (provider.totalJobs >= 100) {
      desiredBadges.add("SUPER_PRO");
    }

    const existingBadgeSet = new Set(existingBadges.map((badge) => badge.badgeType));
    const badgesToCreate = [...desiredBadges].filter((badge) => !existingBadgeSet.has(badge));
    const badgesToDelete = [...existingBadgeSet].filter((badge) => !desiredBadges.has(badge));

    if (badgesToDelete.length > 0) {
      await tx.providerBadge.deleteMany({
        where: {
          providerId: badgeOwnerId,
          badgeType: {
            in: badgesToDelete,
          },
        },
      });
    }

    if (badgesToCreate.length > 0) {
      await tx.providerBadge.createMany({
        data: badgesToCreate.map((badgeType) => ({
          providerId: badgeOwnerId,
          badgeType,
        })),
      });

      await this.notifications.createMany(
        badgesToCreate.map((badgeType) => ({
          userId: provider.userId,
          type: "BADGE_EARNED",
          title: "Nouveau badge",
          message: `Vous avez obtenu le badge ${badgeType}`,
          data: {
            providerId,
            badgeType,
          },
        })),
        tx,
      );
    }
  }

  private getTrustLevel(completedJobs: number, overallScore: number): TrustLevel {
    if (completedJobs >= 50 && overallScore >= 90) {
      return "TOP_RATED";
    }
    if (completedJobs >= 30 && overallScore >= 80) {
      return "EXPERT";
    }
    if (completedJobs >= 15 && overallScore >= 70) {
      return "TRUSTED";
    }
    if (completedJobs >= 5 && overallScore >= 50) {
      return "ESTABLISHED";
    }
    return "NEWCOMER";
  }

  private toPercentage(value: number) {
    return this.round((value / 5) * 100);
  }

  private async logActivity(params: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    await this.prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  }

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
