import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  BadgeType,
  ClientTrustLevel,
  PaymentRating,
  TrustLevel,
} from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type ReviewQuery = {
  providerId: string;
  page: number;
  limit: number;
  sortBy: "recent" | "highest" | "lowest";
};

type CreateReviewBody = {
  bookingId: string;
  providerId: string;
  rating: number;
  punctuality?: number;
  quality?: number;
  communication?: number;
  value?: number;
  professionalism?: number;
  satisfactionTags?: string[];
  comment?: string;
  isPublic: boolean;
};

type CreateClientReviewBody = {
  bookingId: string;
  clientId: string;
  paymentRating: PaymentRating;
  communication?: number;
  respectfulness?: number;
  tags: string[];
  comment?: string;
  isPublic: boolean;
};

const reviewInclude = {
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

type ReviewRecord = Prisma.ReviewGetPayload<{
  include: typeof reviewInclude;
}>;

const clientReviewInclude = {
  client: {
    select: {
      id: true,
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
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  },
} satisfies Prisma.ClientReviewInclude;

type ClientReviewRecord = Prisma.ClientReviewGetPayload<{
  include: typeof clientReviewInclude;
}>;

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

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ReviewQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const orderBy =
      query.sortBy === "highest"
        ? [{ overallScore: "desc" as const }, { createdAt: "desc" as const }]
        : query.sortBy === "lowest"
          ? [{ overallScore: "asc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({
        where: {
          providerId: query.providerId,
          isPublic: true,
        },
      }),
      this.prisma.review.findMany({
        where: {
          providerId: query.providerId,
          isPublic: true,
        },
        skip,
        take: limit,
        orderBy,
        include: reviewInclude,
      }),
    ]);

    return {
      success: true as const,
      reviews: reviews.map((review) => this.mapReview(review)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async create(actor: Actor, body: CreateReviewBody) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: {
        provider: {
          select: {
            id: true,
            userId: true,
          },
        },
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.clientId !== actor.id) {
      throw new BadRequestException("You can only review your own booking");
    }

    if (booking.providerId !== body.providerId) {
      throw new BadRequestException("providerId does not match the booking provider");
    }

    if (booking.status !== "COMPLETED") {
      throw new BadRequestException("Only completed bookings can be reviewed");
    }

    if (booking.review) {
      throw new ConflictException("A review already exists for this booking");
    }

    const overallScore = this.calculateOverallScore(body);

    const result: ReviewRecord = await this.prisma.$transaction(
      async (tx): Promise<ReviewRecord> => {
      const review = await tx.review.create({
        data: {
          bookingId: body.bookingId,
          clientId: actor.id,
          providerId: body.providerId,
          punctuality: body.punctuality ?? null,
          quality: body.quality ?? null,
          communication: body.communication ?? null,
          value: body.value ?? null,
          professionalism: body.professionalism ?? null,
          overallScore,
          satisfactionTags:
            body.satisfactionTags && body.satisfactionTags.length > 0
              ? body.satisfactionTags
              : Prisma.JsonNull,
          comment: body.comment ?? null,
          isPublic: body.isPublic,
        },
        include: reviewInclude,
      });

      await this.syncProviderMetrics(tx, body.providerId);

      await this.notifications.create(
        {
          userId: booking.provider.userId,
          type: "NEW_REVIEW",
          title: "Nouvel avis client",
          message: `${this.getDisplayName(actor)} a laisse un avis pour "${booking.title}"`,
          data: {
            bookingId: booking.id,
            reviewId: review.id,
            providerId: body.providerId,
          },
        },
        tx,
      );

      return review;
      },
    );

    return {
      success: true as const,
      review: this.mapReview(result),
    };
  }

  async createClientReview(actor: Actor, body: CreateClientReviewBody) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: {
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
            userId: true,
          },
        },
        clientReview: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.provider.userId !== actor.id) {
      throw new BadRequestException("You can only review clients for your own bookings");
    }

    if (booking.clientId !== body.clientId) {
      throw new BadRequestException("clientId does not match the booking client");
    }

    if (booking.status !== "COMPLETED") {
      throw new BadRequestException("Only completed bookings can be reviewed");
    }

    if (booking.clientReview) {
      throw new ConflictException("A client review already exists for this booking");
    }

    const result: ClientReviewRecord = await this.prisma.$transaction(
      async (tx): Promise<ClientReviewRecord> => {
      const clientReview = await tx.clientReview.create({
        data: {
          bookingId: body.bookingId,
          providerId: booking.providerId,
          clientId: body.clientId,
          paymentTimeliness: body.paymentRating,
          communication: body.communication ?? null,
          respectfulness: body.respectfulness ?? null,
          tags: body.tags.length > 0 ? body.tags : Prisma.JsonNull,
          comment: body.comment ?? null,
          isPublic: body.isPublic,
        },
        include: clientReviewInclude,
      });

      await this.syncClientMetrics(tx, body.clientId);

      await this.notifications.create(
        {
          userId: booking.clientId,
          type: "NEW_CLIENT_REVIEW",
          title: "Retour du prestataire",
          message: `${this.getDisplayName(actor)} a evalue votre comportement client`,
          data: {
            bookingId: booking.id,
            clientReviewId: clientReview.id,
            providerId: booking.providerId,
          },
        },
        tx,
      );

      return clientReview;
      },
    );

    return {
      success: true as const,
      clientReview: this.mapClientReview(result),
    };
  }

  private calculateOverallScore(body: CreateReviewBody) {
    const criteriaScores = [
      body.punctuality,
      body.quality,
      body.communication,
      body.value,
      body.professionalism,
    ].filter((value): value is number => value !== undefined);

    const baseScores = criteriaScores.length > 0 ? criteriaScores : [body.rating];
    const average = baseScores.reduce((sum, value) => sum + value, 0) / baseScores.length;

    return this.round(average);
  }

  private async syncProviderMetrics(tx: Prisma.TransactionClient, providerId: string) {
    const [
      provider,
      reviewAggregate,
      favoriteCount,
      verifiedCertificationCount,
      cancelledJobs,
      repeatClientGroups,
    ] = await Promise.all([
      tx.provider.findUnique({
        where: { id: providerId },
        select: {
          id: true,
          userId: true,
          totalJobs: true,
          responseTime: true,
          trustScore: {
            select: {
              id: true,
            },
          },
          user: {
            select: {
              isVerified: true,
            },
          },
        },
      }),
      tx.review.aggregate({
        where: { providerId },
        _count: {
          _all: true,
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
      tx.favorite.count({
        where: { providerId },
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
      where: { id: providerId },
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

  private async syncClientMetrics(tx: Prisma.TransactionClient, clientId: string) {
    const [client, reviewAggregate, paymentReviews] = await Promise.all([
      tx.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
        },
      }),
      tx.clientReview.aggregate({
        where: { clientId },
        _count: {
          _all: true,
        },
        _avg: {
          communication: true,
          respectfulness: true,
        },
      }),
      tx.clientReview.findMany({
        where: { clientId },
        select: {
          paymentTimeliness: true,
        },
      }),
    ]);

    if (!client) {
      throw new NotFoundException("Client not found");
    }

    const weightedScores = [
      reviewAggregate._avg.communication != null
        ? { weight: 0.35, value: this.toPercentage(reviewAggregate._avg.communication) }
        : null,
      reviewAggregate._avg.respectfulness != null
        ? { weight: 0.35, value: this.toPercentage(reviewAggregate._avg.respectfulness) }
        : null,
      paymentReviews.length > 0
        ? {
            weight: 0.3,
            value:
              paymentReviews.reduce(
                (sum, review) => sum + this.paymentRatingScore(review.paymentTimeliness),
                0,
              ) / paymentReviews.length,
          }
        : null,
    ].filter((entry): entry is { weight: number; value: number } => entry !== null);

    const clientScore =
      weightedScores.length > 0
        ? this.round(
            weightedScores.reduce((sum, entry) => sum + entry.value * entry.weight, 0) /
              weightedScores.reduce((sum, entry) => sum + entry.weight, 0),
          )
        : 0;

    await tx.user.update({
      where: { id: clientId },
      data: {
        clientScore,
        clientTrustLevel: this.getClientTrustLevel(
          reviewAggregate._count._all,
          clientScore,
        ),
      },
    });
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

  private getClientTrustLevel(
    totalReviews: number,
    clientScore: number,
  ): ClientTrustLevel {
    if (totalReviews >= 10 && clientScore >= 90) {
      return "VIP_CLIENT";
    }
    if (totalReviews >= 5 && clientScore >= 75) {
      return "GOOD_CLIENT";
    }
    if (totalReviews >= 2 && clientScore >= 55) {
      return "REGULAR";
    }
    return "NEW_CLIENT";
  }

  private mapReview(review: ReviewRecord) {
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
      service: review.booking.service?.name ?? review.booking.title,
    };
  }

  private mapClientReview(review: ClientReviewRecord) {
    return {
      id: review.id,
      bookingId: review.bookingId,
      clientId: review.clientId,
      providerId: review.providerId,
      rating: this.clientReviewRating(review),
      paymentRating: review.paymentTimeliness,
      paymentTimeliness: review.paymentTimeliness,
      communication: review.communication,
      respectfulness: review.respectfulness,
      comment: review.comment,
      tags: review.tags ? JSON.stringify(review.tags) : null,
      isPublic: review.isPublic,
      createdAt: review.createdAt,
    };
  }

  private toPercentage(value: number) {
    return this.round((value / 5) * 100);
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private clientReviewRating(review: {
    communication: number | null;
    respectfulness: number | null;
  }) {
    const ratings = [review.communication, review.respectfulness].filter(
      (value): value is number => typeof value === "number",
    );

    if (ratings.length === 0) {
      return null;
    }

    return this.round(
      ratings.reduce((sum, value) => sum + value, 0) / ratings.length,
    );
  }

  private paymentRatingScore(rating: PaymentRating) {
    switch (rating) {
      case "PREPAID":
        return 100;
      case "ONTIME":
        return 85;
      case "LATE":
        return 55;
      case "PARTIAL":
        return 35;
      case "DISPUTED":
        return 0;
      default:
        return 0;
    }
  }

  private getDisplayName(actor: Actor) {
    const fullName = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim();
    return fullName || "Un client";
  }
}
