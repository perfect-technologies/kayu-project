import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TRENDING_LIMIT = 3;
const GROWTH_THRESHOLD = 0.1; // 10%

// Local copies of the schema types — backend is CJS, @kayu/schemas is ESM.
// Other modules in this codebase use the same pattern (e.g., dynamic await import
// for runtime values; types re-declared locally).
type TrendingBadge =
  | { kind: "growth"; pct: number }
  | { kind: "top"; rank: number };

type TrendingServiceItem = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryImage: string;
  categoryColor: string | null;
  description: string | null;
  startingPrice: number | null;
  trendBadge: TrendingBadge | null;
};

type TrendingServicesResponse = {
  mode: "trending" | "discovery";
  items: TrendingServiceItem[];
};

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
      this.prisma.user.count({ where: { role: "CLIENT" } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      this.prisma.review.count(),
      this.prisma.provider.count({ where: { verificationStatus: "VERIFIED" } }),
      this.prisma.provider.count({ where: { isPremium: true } }),
      this.prisma.review.aggregate({ _avg: { overallScore: true } }),
      this.getProvidersByCity(),
      this.prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { providers: true } } },
        orderBy: { providers: { _count: "desc" } },
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

  async getTrendingServices(now: Date = new Date()): Promise<TrendingServicesResponse> {
    const last7Start = new Date(now.getTime() - SEVEN_DAYS_MS);
    const prev7Start = new Date(now.getTime() - 2 * SEVEN_DAYS_MS);

    const [bookings, categories, providerLinks] = await Promise.all([
      this.prisma.booking.findMany({
        where: { createdAt: { gte: prev7Start, lt: now } },
        select: {
          createdAt: true,
          provider: {
            select: {
              categories: { select: { categoryId: true } },
            },
          },
        },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
      this.prisma.providerCategory.findMany({
        select: { categoryId: true, provider: { select: { hourlyRate: true } } },
      }),
    ]);

    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    // Build min-price map per category from ProviderCategory join.
    const minPriceByCategory = new Map<string, number>();
    for (const link of providerLinks) {
      const rate = link.provider?.hourlyRate;
      if (typeof rate !== "number" || Number.isNaN(rate)) continue;
      const current = minPriceByCategory.get(link.categoryId);
      if (current === undefined || rate < current) {
        minPriceByCategory.set(link.categoryId, rate);
      }
    }

    // Attribute each booking to every category its provider operates in.
    const thisWeekCounts = new Map<string, number>();
    const lastWeekCounts = new Map<string, number>();
    for (const booking of bookings) {
      const target = booking.createdAt >= last7Start ? thisWeekCounts : lastWeekCounts;
      const providerCats = booking.provider?.categories ?? [];
      for (const link of providerCats) {
        target.set(link.categoryId, (target.get(link.categoryId) ?? 0) + 1);
      }
    }

    // Candidates: ranked by thisWeek count, filtered to categories with an image.
    const ranked = [...thisWeekCounts.entries()]
      .map(([categoryId, count]) => ({ categoryId, count }))
      .filter(({ categoryId }) => categoriesById.get(categoryId)?.image)
      .sort((a, b) => b.count - a.count);

    if (ranked.length >= TRENDING_LIMIT) {
      const items = ranked.slice(0, TRENDING_LIMIT).map((entry, index): TrendingServiceItem => {
        const category = categoriesById.get(entry.categoryId)!;
        const previous = lastWeekCounts.get(entry.categoryId) ?? 0;
        const growth = (entry.count - previous) / Math.max(previous, 1);
        const badge: TrendingBadge =
          growth >= GROWTH_THRESHOLD
            ? { kind: "growth", pct: Math.round(growth * 100) }
            : { kind: "top", rank: index + 1 };
        return this.buildItem(category, badge, minPriceByCategory);
      });
      return { mode: "trending", items };
    }

    // Discovery fallback
    const discovery = categories
      .filter((c) => c.image)
      .slice(0, TRENDING_LIMIT)
      .map((category) => this.buildItem(category, null, minPriceByCategory));

    return { mode: "discovery", items: discovery };
  }

  private buildItem(
    category: { id: string; slug: string; name: string; image: string | null; color: string | null; description: string | null },
    badge: TrendingBadge | null,
    minPriceByCategory: Map<string, number>,
  ): TrendingServiceItem {
    const price = minPriceByCategory.get(category.id);
    return {
      categoryId: category.id,
      categorySlug: category.slug,
      categoryName: category.name,
      categoryImage: category.image!,
      categoryColor: category.color ?? null,
      description: category.description ?? null,
      startingPrice: typeof price === "number" ? Math.round(price) : null,
      trendBadge: badge,
    };
  }

  private async getProvidersByCity() {
    const zones = await this.prisma.serviceZone.findMany({
      select: { city: true, providerId: true },
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
