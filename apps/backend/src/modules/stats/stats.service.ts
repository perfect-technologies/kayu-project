import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [
      totalProviders,
      totalClients,
      totalCategories,
      totalBookings,
      totalReviews,
      verifiedProviders,
      premiumProviders,
      averageRating,
      providersByCity,
      topCategories,
    ] = await Promise.all([
      this.prisma.provider.count(),
      this.prisma.user.count({
        where: {
          role: "CLIENT",
        },
      }),
      this.prisma.category.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.booking.count(),
      this.prisma.review.count(),
      this.prisma.provider.count({
        where: {
          verificationStatus: "VERIFIED",
        },
      }),
      this.prisma.provider.count({
        where: {
          isPremium: true,
        },
      }),
      this.prisma.review.aggregate({
        _avg: {
          overallScore: true,
        },
      }),
      this.getProvidersByCity(),
      this.prisma.category.findMany({
        where: {
          isActive: true,
        },
        include: {
          _count: {
            select: {
              providers: true,
            },
          },
        },
        orderBy: {
          providers: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    return {
      success: true as const,
      totalProviders,
      totalClients,
      totalUsers: totalProviders + totalClients,
      totalCategories,
      totalBookings,
      totalReviews,
      verifiedProviders,
      premiumProviders,
      averageRating: this.round(averageRating._avg.overallScore ?? 0),
      providersByCity,
      topCategories: topCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        providersCount: category._count.providers,
        providerCount: category._count.providers,
      })),
    };
  }

  private async getProvidersByCity() {
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
      .map(([city, count]) => ({ city, count }))
      .sort((left, right) => right.count - left.count || left.city.localeCompare(right.city))
      .slice(0, 5);
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }
}
