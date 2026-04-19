import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { JobRequestsService } from "../job-requests/job-requests.service";

const participantUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  city: true,
  country: true,
  email: true,
  phone: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

const providerDashboardInclude = {
  user: {
    select: {
      ...participantUserSelect,
      onboardingStep: true,
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
  skills: true,
  serviceZones: true,
  portfolio: true,
  trustScore: {
    include: {
      badges: {
        where: {
          isVisible: true,
        },
      },
    },
  },
} satisfies Prisma.ProviderInclude;

const providerTodayBookingInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.BookingInclude;

type ProviderTodayBookingRecord = Prisma.BookingGetPayload<{
  include: typeof providerTodayBookingInclude;
}>;

const providerBookingsInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.BookingInclude;

const clientBookingsInclude = {
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
          avatar: true,
        },
      },
    },
  },
  service: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.BookingInclude;

const providerReviewInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  booking: {
    select: {
      title: true,
      service: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ReviewInclude;

const favoriteProviderInclude = {
  provider: {
    include: {
      user: {
        select: participantUserSelect,
      },
      categories: {
        include: {
          category: true,
        },
      },
      serviceZones: true,
    },
  },
} satisfies Prisma.FavoriteInclude;

type ProviderDashboardRecord = Prisma.ProviderGetPayload<{
  include: typeof providerDashboardInclude;
}>;

type ProviderBookingRecord = Prisma.BookingGetPayload<{
  include: typeof providerBookingsInclude;
}>;

type ClientBookingRecord = Prisma.BookingGetPayload<{
  include: typeof clientBookingsInclude;
}>;

type ProviderReviewRecord = Prisma.ReviewGetPayload<{
  include: typeof providerReviewInclude;
}>;

type FavoriteProviderRecord = Prisma.FavoriteGetPayload<{
  include: typeof favoriteProviderInclude;
}>;

type RecentAdminProviderRecord = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: typeof participantUserSelect;
    };
    categories: {
      include: {
        category: true;
      };
    };
    _count: {
      select: {
        reviews: true;
        bookings: true;
      };
    };
  };
}>;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRequests: JobRequestsService,
  ) {}

  async getProviderDashboard(actor: Actor) {
    if (actor.role !== "PROVIDER") {
      throw new ForbiddenException("Only providers can access this dashboard");
    }

    const provider = await this.prisma.provider.findUnique({
      where: {
        userId: actor.id,
      },
      include: providerDashboardInclude,
    });

    if (!provider) {
      throw new NotFoundException("Provider profile not found");
    }

    const todayBounds = this.todayRange();

    const [
      todayBookings,
      recentBookings,
      upcomingBookings,
      recentReviews,
      unreadNotifications,
      certifiedProviderIds,
      statsSummary,
      currentRating,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          providerId: provider.id,
          status: {
            in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
          },
          scheduledDate: {
            gte: todayBounds.start,
            lt: todayBounds.end,
          },
        },
        orderBy: {
          scheduledDate: "asc",
        },
        include: providerTodayBookingInclude,
      }),
      this.prisma.booking.findMany({
        where: {
          providerId: provider.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: providerBookingsInclude,
      }),
      this.prisma.booking.findMany({
        where: {
          providerId: provider.id,
          status: {
            in: ["CONFIRMED", "IN_PROGRESS"],
          },
          scheduledDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledDate: "asc",
        },
        take: 3,
        include: providerBookingsInclude,
      }),
      this.prisma.review.findMany({
        where: {
          providerId: provider.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        include: providerReviewInclude,
      }),
      this.prisma.notification.count({
        where: {
          userId: actor.id,
          isRead: false,
        },
      }),
      this.getCertifiedProviderIds([provider.id]),
      this.computeProviderStatsSummary(provider.id),
      this.getProviderAverageRating(provider.id),
    ]);

    const todayJobs = todayBookings.map((booking) => this.mapTodayJob(booking));
    const estimatedRecette = todayJobs.reduce((acc, job) => acc + job.fee, 0);

    const topMatches = await this.jobRequests.topMatchesForDashboard(provider.id, 3);
    const newRequests = topMatches.map((match) => this.mapRequestPreview({
      id: match.id,
      client: {
        id: match.client.id,
        name: this.formatName(match.client.firstName, match.client.lastName, "Client"),
        avatar: match.client.avatar ?? null,
      },
      newClient: match.client.newClient,
      clientRating: match.client.rating,
      clientJobs: match.client.jobs,
      service: match.service,
      message: match.description,
      when: match.whenPref,
      address: match.address,
      distance: 0,
      matchScore: match.matchScore,
      receivedAt: (match.notifiedAt instanceof Date
        ? match.notifiedAt
        : new Date(match.notifiedAt)).toISOString(),
      urgent: match.urgent,
    }));

    const completionItems = {
      hasPhoto: Boolean(provider.user.avatar),
      hasDescription: Boolean(provider.description && provider.description.length > 20),
      hasSkills: provider.skills.length > 0,
      hasServiceZones: provider.serviceZones.length > 0,
      hasPortfolio: provider.portfolio.length > 0,
    };

    const completionPercentage = Math.round(
      (Object.values(completionItems).filter(Boolean).length / Object.keys(completionItems).length) *
        100,
    );

    const onboarding = this.deriveOnboardingStatus(provider);
    const legacyStats = {
      totalBookings: statsSummary.totalBookingsAllTime,
      completedBookings: statsSummary.completedBookingsAllTime,
      pendingBookings: statsSummary.pendingBookingsAllTime,
      totalEarnings: statsSummary.revenue.totalAllTime,
      rating: currentRating,
      totalReviews: provider.totalReviews,
      totalJobs: provider.totalJobs,
    };

    return {
      success: true as const,
      provider: {
        id: provider.id,
        userId: provider.userId,
        profession: provider.profession,
        description: provider.description,
        experience: provider.experience,
        hourlyRate: provider.hourlyRate,
        totalReviews: provider.totalReviews,
        totalJobs: provider.totalJobs,
        rating: currentRating,
        responseTime: provider.responseTime,
        isPremium: provider.isPremium,
        premiumExpiry: provider.premiumExpiry,
        isAvailable: provider.isAvailable,
        verificationStatus: provider.verificationStatus,
        isCertified: certifiedProviderIds.has(provider.id),
        categories: provider.categories.map((item) => item.category.name),
        completionPercentage,
        completionItems,
      },
      onboarding,
      availability: {
        isAvailable: provider.isAvailable,
        zoneCity: provider.user.city ?? provider.serviceZones[0]?.city ?? null,
        zoneRadiusKm: 10,
      },
      today: {
        jobs: todayJobs,
        estimatedRecette,
      },
      newRequests,
      stats: {
        period: "month" as const,
        revenue: {
          value: statsSummary.revenue.value,
          deltaPct: statsSummary.revenue.deltaPct,
          sparkline: statsSummary.revenue.sparkline,
        },
        missions: {
          value: statsSummary.missions.value,
          deltaPct: statsSummary.missions.deltaPct,
          sparkline: statsSummary.missions.sparkline,
        },
        responseRate: {
          value: statsSummary.responseRate.value,
          label: statsSummary.responseRate.label,
        },
        avgRating: {
          value: currentRating,
          delta: statsSummary.avgRating.delta,
        },
      },
      notifications: {
        unreadCount: unreadNotifications,
      },
      // Legacy fields for `/dashboard/provider` (v1) — retained for backward compat.
      user: {
        firstName: actor.firstName,
        lastName: actor.lastName,
        avatar: actor.avatar,
        city: provider.user.city,
      },
      recentBookings: recentBookings.map((booking) => this.mapProviderDashboardBooking(booking)),
      upcomingBookings: upcomingBookings.map((booking) => this.mapProviderDashboardBooking(booking)),
      recentReviews: recentReviews.map((review) => this.mapDashboardReview(review)),
      legacyStats,
    };
  }

  async getClientDashboard(actor: Actor) {
    if (actor.role !== "CLIENT") {
      throw new ForbiddenException("Only clients can access this dashboard");
    }

    const [stats, recentBookings, favorites, notifications] = await Promise.all([
      this.getClientDashboardStats(actor.id),
      this.prisma.booking.findMany({
        where: {
          clientId: actor.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: clientBookingsInclude,
      }),
      this.prisma.favorite.findMany({
        where: {
          userId: actor.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
        include: favoriteProviderInclude,
      }),
      this.prisma.notification.findMany({
        where: {
          userId: actor.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    const providerIds = favorites.map((favorite) => favorite.providerId);
    const [ratingByProviderId, certifiedProviderIds] = await Promise.all([
      this.getRatingByProviderIds(providerIds),
      this.getCertifiedProviderIds(providerIds),
    ]);

    return {
      success: true as const,
      stats,
      recentBookings: recentBookings.map((booking) => this.mapClientDashboardBooking(booking)),
      favoriteProviders: favorites.map((favorite) =>
        this.mapFavoriteProvider(
          favorite,
          ratingByProviderId.get(favorite.providerId) ?? 0,
          certifiedProviderIds.has(favorite.providerId),
        ),
      ),
      notifications: notifications.map((notification) => this.mapNotification(notification)),
      user: {
        firstName: actor.firstName,
        lastName: actor.lastName,
      },
    };
  }

  async getAdminDashboard(actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new ForbiddenException("Only admins can access this dashboard");
    }

    const today = this.startOfDay(new Date());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalProviders,
      totalClients,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      totalReviews,
      totalRevenue,
      recentProviders,
      recentBookings,
      topCities,
      categories,
      trustScores,
      pendingCertifications,
      premiumProviders,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newBookingsToday,
      revenueToday,
      monthlyRevenue,
      activeUsers,
      verifiedUsers,
      bookingsByDaySource,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.provider.count(),
      this.prisma.user.count({ where: { role: "CLIENT" } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: "PENDING" } }),
      this.prisma.booking.count({ where: { status: "CONFIRMED" } }),
      this.prisma.booking.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.booking.count({ where: { status: "COMPLETED" } }),
      this.prisma.booking.count({ where: { status: "CANCELLED" } }),
      this.prisma.review.count(),
      this.prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          isPaid: true,
        },
        _sum: {
          price: true,
        },
      }),
      this.prisma.provider.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: participantUserSelect,
          },
          categories: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          provider: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.getTopCities(),
      this.prisma.category.findMany({
        where: {
          isActive: true,
        },
        include: {
          _count: {
            select: {
              providers: true,
              subcategories: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      this.prisma.trustScore.groupBy({
        by: ["trustLevel"],
        _count: {
          id: true,
        },
      }),
      this.prisma.certification.count({
        where: {
          status: "PENDING",
        },
      }),
      this.prisma.provider.count({
        where: {
          isPremium: true,
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: this.daysAgo(7),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: this.daysAgo(30),
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
          status: "COMPLETED",
          isPaid: true,
        },
        _sum: {
          price: true,
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
          status: "COMPLETED",
          isPaid: true,
        },
        _sum: {
          price: true,
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.user.count({
        where: {
          isVerified: true,
        },
      }),
      this.prisma.booking.findMany({
        where: {
          createdAt: {
            gte: this.daysAgo(7),
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    const providerIds = recentProviders.map((provider) => provider.id);
    const [ratingByProviderId, certifiedProviderIds, verifiedProviders] = await Promise.all([
      this.getRatingByProviderIds(providerIds),
      this.getCertifiedProviderIds(providerIds),
      this.prisma.provider.count({
        where: {
          verificationStatus: "VERIFIED",
        },
      }),
    ]);

    return {
      success: true as const,
      stats: {
        totalUsers,
        totalProviders,
        totalClients,
        totalBookings,
        totalReviews,
        pendingBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        activeUsers,
        verifiedUsers,
        verifiedProviders,
        premiumProviders,
        pendingCertifications,
        totalRevenue: totalRevenue._sum.price ?? 0,
        revenueToday: revenueToday._sum.price ?? 0,
        monthlyRevenue: monthlyRevenue._sum.price ?? 0,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        newBookingsToday,
        bookingsByDay: this.groupBookingsByDay(bookingsByDaySource),
        trustLevels: trustScores.reduce<Record<string, number>>((accumulator, item) => {
          accumulator[item.trustLevel] = item._count.id;
          return accumulator;
        }, {}),
      },
      providers: recentProviders.map((provider) =>
        this.mapAdminProvider(
          provider,
          ratingByProviderId.get(provider.id) ?? 0,
          certifiedProviderIds.has(provider.id),
        ),
      ),
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        status: booking.status,
        price: booking.price ?? 0,
        scheduledDate: booking.scheduledDate,
        createdAt: booking.createdAt,
        isPaid: booking.isPaid,
        clientName: this.formatName(booking.client.firstName, booking.client.lastName, "Client"),
        clientAvatar: booking.client.avatar,
        providerName: this.formatName(
          booking.provider.user.firstName,
          booking.provider.user.lastName,
          "Prestataire",
        ),
        providerAvatar: booking.provider.user.avatar,
      })),
      topCategories: categories
        .filter((category) => category._count.providers > 0)
        .sort((left, right) => right._count.providers - left._count.providers)
        .slice(0, 10)
        .map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          providerCount: category._count.providers,
          subcategoryCount: category._count.subcategories,
        })),
      topCities,
      allCategories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        providerCount: category._count.providers,
      })),
    };
  }

  private async getProviderDashboardStats(providerId: string) {
    const [totalBookings, completedBookings, pendingBookings, totalEarnings, ratingAggregate, totalReviews] =
      await Promise.all([
        this.prisma.booking.count({
          where: {
            providerId,
          },
        }),
        this.prisma.booking.count({
          where: {
            providerId,
            status: "COMPLETED",
          },
        }),
        this.prisma.booking.count({
          where: {
            providerId,
            status: "PENDING",
          },
        }),
        this.prisma.booking.aggregate({
          where: {
            providerId,
            status: "COMPLETED",
            price: {
              not: null,
            },
          },
          _sum: {
            price: true,
          },
        }),
        this.prisma.review.aggregate({
          where: {
            providerId,
          },
          _avg: {
            overallScore: true,
          },
        }),
        this.prisma.review.count({
          where: {
            providerId,
          },
        }),
      ]);

    const provider = await this.prisma.provider.findUnique({
      where: {
        id: providerId,
      },
      select: {
        totalJobs: true,
      },
    });

    return {
      totalBookings,
      completedBookings,
      pendingBookings,
      totalEarnings: totalEarnings._sum.price ?? 0,
      rating: this.round(ratingAggregate._avg.overallScore ?? 0),
      totalReviews,
      totalJobs: provider?.totalJobs ?? 0,
    };
  }

  private async getClientDashboardStats(userId: string) {
    const [totalBookings, completedBookings, pendingBookings, favoritesCount, reviewsCount] =
      await Promise.all([
        this.prisma.booking.count({
          where: {
            clientId: userId,
          },
        }),
        this.prisma.booking.count({
          where: {
            clientId: userId,
            status: "COMPLETED",
          },
        }),
        this.prisma.booking.count({
          where: {
            clientId: userId,
            status: "PENDING",
          },
        }),
        this.prisma.favorite.count({
          where: {
            userId,
          },
        }),
        this.prisma.review.count({
          where: {
            clientId: userId,
          },
        }),
      ]);

    return {
      totalBookings,
      completedBookings,
      pendingBookings,
      favoritesCount,
      reviewsCount,
    };
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

  private async getTopCities() {
    const zones = await this.prisma.serviceZone.findMany({
      select: {
        city: true,
        providerId: true,
      },
      distinct: ["city", "providerId"],
    });

    const counts = new Map<string, number>();
    for (const zone of zones) {
      counts.set(zone.city, (counts.get(zone.city) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 5);
  }

  private groupBookingsByDay(bookings: Array<{ createdAt: Date }>) {
    const counts = new Map<string, number>();

    for (const booking of bookings) {
      const key = booking.createdAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  private mapProviderDashboardBooking(booking: ProviderBookingRecord) {
    return {
      id: booking.id,
      clientId: booking.clientId,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      title: booking.title,
      description: booking.description,
      status: booking.status,
      address: booking.address,
      city: booking.city,
      clientLatitude: booking.clientLatitude,
      clientLongitude: booking.clientLongitude,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      clientNotes: booking.clientNotes,
      providerNotes: booking.providerNotes,
      paymentMethod: booking.paymentMethod,
      isPaid: booking.isPaid,
      paidAt: booking.paidAt,
      confirmedAt: booking.confirmedAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancelReason: booking.cancelReason,
      cancelledBy: booking.cancelledBy,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      client: {
        id: booking.client.id,
        name: this.formatName(booking.client.firstName, booking.client.lastName, "Client"),
        avatar: booking.client.avatar,
      },
      service: booking.service,
    };
  }

  private mapClientDashboardBooking(booking: ClientBookingRecord) {
    return {
      id: booking.id,
      clientId: booking.clientId,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      title: booking.title,
      description: booking.description,
      status: booking.status,
      address: booking.address,
      city: booking.city,
      clientLatitude: booking.clientLatitude,
      clientLongitude: booking.clientLongitude,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      clientNotes: booking.clientNotes,
      providerNotes: booking.providerNotes,
      paymentMethod: booking.paymentMethod,
      isPaid: booking.isPaid,
      paidAt: booking.paidAt,
      confirmedAt: booking.confirmedAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancelReason: booking.cancelReason,
      cancelledBy: booking.cancelledBy,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      provider: {
        id: booking.provider.id,
        name: this.formatName(
          booking.provider.user.firstName,
          booking.provider.user.lastName,
          "Prestataire",
        ),
        avatar: booking.provider.user.avatar,
        profession: booking.provider.profession,
      },
      service: booking.service,
    };
  }

  private mapDashboardReview(review: ProviderReviewRecord) {
    return {
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
      satisfactionTags: review.satisfactionTags ? JSON.stringify(review.satisfactionTags) : null,
      comment: review.comment,
      reply: review.reply,
      repliedAt: review.repliedAt,
      isPublic: review.isPublic,
      isEdited: review.isEdited,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      client: {
        id: review.client.id,
        name: this.formatName(review.client.firstName, review.client.lastName, "Client"),
        firstName: review.client.firstName,
        lastName: review.client.lastName,
        avatar: review.client.avatar,
      },
      booking: {
        title: review.booking.title,
      },
      service: review.booking.service?.name ?? review.booking.title,
    };
  }

  private mapFavoriteProvider(
    favorite: FavoriteProviderRecord,
    rating: number,
    isCertified: boolean,
  ) {
    return {
      id: favorite.provider.id,
      userId: favorite.provider.userId,
      profession: favorite.provider.profession,
      description: favorite.provider.description,
      experience: favorite.provider.experience,
      hourlyRate: favorite.provider.hourlyRate,
      videoUrl: favorite.provider.videoUrl,
      rating,
      totalReviews: favorite.provider.totalReviews,
      totalJobs: favorite.provider.totalJobs,
      responseTime: favorite.provider.responseTime,
      isCertified,
      isPremium: favorite.provider.isPremium,
      premiumExpiry: favorite.provider.premiumExpiry,
      isAvailable: favorite.provider.isAvailable,
      verificationStatus: favorite.provider.verificationStatus,
      createdAt: favorite.provider.createdAt,
      updatedAt: favorite.provider.updatedAt,
      user: {
        id: favorite.provider.user.id,
        firstName: favorite.provider.user.firstName,
        lastName: favorite.provider.user.lastName,
        avatar: favorite.provider.user.avatar,
        city: favorite.provider.user.city,
        country: favorite.provider.user.country,
        isVerified: favorite.provider.user.isVerified,
      },
      categories: favorite.provider.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        description: item.category.description,
        icon: item.category.icon,
        image: item.category.image,
        color: item.category.color,
        order: item.category.order,
        isActive: item.category.isActive,
        createdAt: item.category.createdAt,
      })),
      serviceZones: favorite.provider.serviceZones.map((zone) => ({
        id: zone.id,
        providerId: zone.providerId,
        city: zone.city,
        commune: zone.commune,
        createdAt: zone.createdAt,
      })),
    };
  }

  private mapNotification(notification: {
    id: string;
    userId: string;
    type: Prisma.NotificationUncheckedCreateInput["type"];
    title: string;
    message: string;
    data: Prisma.JsonValue | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ?? undefined,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  private mapAdminProvider(
    provider: RecentAdminProviderRecord,
    rating: number,
    isCertified: boolean,
  ) {
    return {
      id: provider.id,
      userId: provider.userId,
      firstName: provider.user.firstName,
      lastName: provider.user.lastName,
      email: provider.user.email,
      phone: provider.user.phone,
      city: provider.user.city,
      avatar: provider.user.avatar,
      profession: provider.profession,
      description: provider.description,
      experience: provider.experience,
      hourlyRate: provider.hourlyRate,
      rating,
      totalReviews: provider._count.reviews,
      totalJobs: provider.totalJobs,
      totalBookings: provider._count.bookings,
      isCertified,
      isPremium: provider.isPremium,
      premiumExpiry: provider.premiumExpiry,
      isAvailable: provider.isAvailable,
      verificationStatus: provider.verificationStatus,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      categories: provider.categories.map((item) => item.category.name),
    };
  }

  private formatName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    fallback: string,
  ) {
    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    return fullName || fallback;
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private startOfDay(date: Date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private todayRange() {
    const start = this.startOfDay(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private startOfMonth(date: Date) {
    const value = new Date(date);
    value.setDate(1);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private mapTodayJob(booking: ProviderTodayBookingRecord) {
    const scheduled = booking.scheduledDate ?? booking.createdAt;
    const time = scheduled
      ? scheduled.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    const duration = this.formatDuration(booking.duration);
    const status: "confirmed" | "en_route" | "completed" =
      booking.status === "COMPLETED"
        ? "completed"
        : booking.status === "IN_PROGRESS"
          ? "en_route"
          : "confirmed";

    const addressParts = [booking.address, booking.city].filter(Boolean);

    return {
      id: booking.id,
      time,
      duration,
      kind: booking.service?.name ?? booking.title,
      client: {
        id: booking.client.id,
        name: this.formatName(booking.client.firstName, booking.client.lastName, "Client"),
        avatar: booking.client.avatar,
      },
      address: addressParts.join(", ") || "Adresse à confirmer",
      distance: 0,
      status,
      fee: booking.price ?? 0,
    };
  }

  // Shape reserved for I04; exposed here so `newRequests` keeps a stable type.
  private mapRequestPreview(request: {
    id: string;
    client: { id: string; name: string; avatar: string | null };
    newClient: boolean;
    clientRating: number | null;
    clientJobs: number;
    service: string;
    message: string;
    when: string;
    address: string;
    distance: number;
    matchScore: number;
    receivedAt: string;
    urgent: boolean;
  }) {
    return request;
  }

  private formatDuration(minutes: number | null | undefined) {
    if (!minutes || minutes <= 0) return "~1h";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) return `~${hours}h`;
    return `~${hours}h${String(rest).padStart(2, "0")}`;
  }

  private deriveOnboardingStatus(
    provider: ProviderDashboardRecord,
  ): {
    isComplete: boolean;
    currentStep: number | null;
    totalSteps: number;
    missingForPublish: string[];
  } {
    // I07 persisted state takes precedence. Fallback: field-based derivation.
    const totalSteps = 6;
    if (provider.onboardingCompleteAt) {
      return { isComplete: true, currentStep: null, totalSteps, missingForPublish: [] };
    }

    const fieldSteps: { key: string; ok: boolean }[] = [
      { key: "profession", ok: Boolean(provider.profession?.trim()) },
      { key: "categories", ok: provider.categories.length > 0 },
      { key: "serviceZones", ok: provider.serviceZones.length > 0 },
      { key: "hourlyRate", ok: typeof provider.hourlyRate === "number" && provider.hourlyRate > 0 },
      {
        key: "description",
        ok: Boolean(provider.description && provider.description.trim().length >= 20),
      },
      { key: "photo", ok: Boolean(provider.user.avatar) },
    ];

    const missing = fieldSteps.filter((step) => !step.ok).map((step) => step.key);
    const firstMissingIndex = fieldSteps.findIndex((step) => !step.ok);
    const savedStep = provider.user.onboardingStep;
    const currentStep = savedStep ?? (firstMissingIndex === -1 ? 0 : firstMissingIndex);

    return {
      isComplete: false,
      currentStep,
      totalSteps,
      missingForPublish: missing,
    };
  }

  private async getProviderAverageRating(providerId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { providerId },
      _avg: { overallScore: true },
    });
    return this.round(agg._avg.overallScore ?? 0);
  }

  private async computeProviderStatsSummary(providerId: string) {
    const now = new Date();
    const monthStart = this.startOfMonth(now);
    const prevMonthStart = this.startOfMonth(new Date(monthStart));
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const sevenDaysAgo = this.daysAgo(6); // inclusive of today → 7 data points

    const [
      totalBookingsAllTime,
      completedBookingsAllTime,
      pendingBookingsAllTime,
      revenueAllTimeAgg,
      monthRevenueAgg,
      prevMonthRevenueAgg,
      monthMissions,
      prevMonthMissions,
      last7DaysBookings,
      ratingNow,
      ratingPrev,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { providerId } }),
      this.prisma.booking.count({ where: { providerId, status: "COMPLETED" } }),
      this.prisma.booking.count({ where: { providerId, status: "PENDING" } }),
      this.prisma.booking.aggregate({
        where: { providerId, status: "COMPLETED", price: { not: null } },
        _sum: { price: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          providerId,
          status: "COMPLETED",
          price: { not: null },
          completedAt: { gte: monthStart },
        },
        _sum: { price: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          providerId,
          status: "COMPLETED",
          price: { not: null },
          completedAt: { gte: prevMonthStart, lt: monthStart },
        },
        _sum: { price: true },
      }),
      this.prisma.booking.count({
        where: {
          providerId,
          status: "COMPLETED",
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          providerId,
          status: "COMPLETED",
          completedAt: { gte: prevMonthStart, lt: monthStart },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          providerId,
          status: "COMPLETED",
          completedAt: { gte: this.startOfDay(sevenDaysAgo) },
        },
        select: {
          completedAt: true,
          price: true,
        },
      }),
      this.getProviderAverageRating(providerId),
      this.prisma.review
        .aggregate({
          where: {
            providerId,
            createdAt: { lt: this.daysAgo(30) },
          },
          _avg: { overallScore: true },
        })
        .then((agg) => this.round(agg._avg.overallScore ?? 0)),
    ]);

    const monthRevenue = monthRevenueAgg._sum.price ?? 0;
    const prevMonthRevenue = prevMonthRevenueAgg._sum.price ?? 0;

    const revenueSparkline = this.buildDailySparkline(
      last7DaysBookings,
      (booking) => booking.completedAt ?? null,
      (booking) => booking.price ?? 0,
    );

    const missionsSparkline = this.buildDailySparkline(
      last7DaysBookings,
      (booking) => booking.completedAt ?? null,
      () => 1,
    );

    // Response rate proxy: % of all-time bookings that were not cancelled.
    // Replace with "replied within 24h of a JobRequest" once I04 lands.
    const responseRateValue =
      totalBookingsAllTime === 0
        ? 0
        : Math.round(((totalBookingsAllTime - (await this.countCancelled(providerId))) / totalBookingsAllTime) * 100);

    const responseLabel =
      responseRateValue >= 90
        ? "Excellent"
        : responseRateValue >= 70
          ? "Bon"
          : "À améliorer";

    return {
      totalBookingsAllTime,
      completedBookingsAllTime,
      pendingBookingsAllTime,
      revenue: {
        value: monthRevenue,
        deltaPct: this.percentDelta(monthRevenue, prevMonthRevenue),
        sparkline: revenueSparkline,
        totalAllTime: revenueAllTimeAgg._sum.price ?? 0,
      },
      missions: {
        value: monthMissions,
        deltaPct: this.percentDelta(monthMissions, prevMonthMissions),
        sparkline: missionsSparkline,
      },
      responseRate: {
        value: responseRateValue,
        label: responseLabel as "Excellent" | "Bon" | "À améliorer",
      },
      avgRating: {
        delta: this.round(ratingNow - ratingPrev),
      },
    };
  }

  private async countCancelled(providerId: string) {
    return this.prisma.booking.count({
      where: { providerId, status: "CANCELLED" },
    });
  }

  private buildDailySparkline<T>(
    records: T[],
    getDate: (record: T) => Date | null,
    getValue: (record: T) => number,
  ): number[] {
    const buckets: number[] = [];
    const today = this.startOfDay(new Date());
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const total = records.reduce((acc, record) => {
        const ts = getDate(record);
        if (!ts) return acc;
        if (ts >= day && ts < nextDay) return acc + getValue(record);
        return acc;
      }, 0);
      buckets.push(total);
    }
    return buckets;
  }

  private percentDelta(current: number, previous: number) {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

}
