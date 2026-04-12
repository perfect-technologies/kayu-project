import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";

type FavoriteBody = {
  providerId: string;
};

const favoriteProviderInclude = {
  provider: {
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
  },
} satisfies Prisma.FavoriteInclude;

type FavoriteRecord = Prisma.FavoriteGetPayload<{
  include: typeof favoriteProviderInclude;
}>;

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
      include: {
        category: true;
      };
    };
    serviceZones: true;
  };
}>;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: Actor, providerId?: string) {
    if (providerId) {
      return this.isFavorited(actor, providerId);
    }

    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId: actor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: favoriteProviderInclude,
    });

    const providerIds = favorites.map((favorite) => favorite.providerId);
    const [ratingByProviderId, certifiedProviderIds] = await Promise.all([
      this.getRatingByProviderId(providerIds),
      this.getCertifiedProviderIds(providerIds),
    ]);

    return {
      success: true as const,
      favorites: favorites.map((favorite) =>
        this.mapFavorite(
          favorite,
          ratingByProviderId.get(favorite.providerId) ?? 0,
          certifiedProviderIds.has(favorite.providerId),
        ),
      ),
    };
  }

  async add(actor: Actor, body: FavoriteBody) {
    const provider = await this.prisma.provider.findUnique({
      where: {
        id: body.providerId,
      },
      select: {
        id: true,
      },
    });

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_providerId: {
          userId: actor.id,
          providerId: body.providerId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException("Provider is already in favorites");
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId: actor.id,
        providerId: body.providerId,
      },
      select: {
        id: true,
      },
    });

    return {
      success: true as const,
      favorite,
    };
  }

  async remove(actor: Actor, body: FavoriteBody) {
    await this.prisma.favorite.deleteMany({
      where: {
        userId: actor.id,
        providerId: body.providerId,
      },
    });

    return {
      success: true as const,
    };
  }

  async isFavorited(actor: Actor, providerId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_providerId: {
          userId: actor.id,
          providerId,
        },
      },
      select: {
        id: true,
      },
    });

    return {
      success: true as const,
      isFavorited: Boolean(favorite),
    };
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
    });

    return new Set(certifications.map((item) => item.providerId));
  }

  private mapFavorite(favorite: FavoriteRecord, rating: number, isCertified: boolean) {
    return {
      id: favorite.id,
      userId: favorite.userId,
      providerId: favorite.providerId,
      createdAt: favorite.createdAt,
      provider: this.mapProviderSummary(favorite.provider, rating, isCertified),
    };
  }

  private mapProviderSummary(provider: ProviderSummaryRecord, rating: number, isCertified: boolean) {
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

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }
}
