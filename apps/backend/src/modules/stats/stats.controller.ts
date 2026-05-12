import { Controller, Get } from "@nestjs/common";
import { StatsService } from "./stats.service";

// Local type — backend is CJS, @kayu/schemas is ESM (other modules use the same pattern).
type TrendingServicesResponse = Awaited<ReturnType<StatsService["getTrendingServices"]>>;

const TRENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Controller("stats")
export class StatsController {
  private trendingCache: { value: TrendingServicesResponse; expiresAt: number } | null = null;

  constructor(private readonly stats: StatsService) {}

  @Get()
  getPublicStats() {
    return this.stats.getPublicStats();
  }

  @Get("trending-services")
  async getTrending(): Promise<TrendingServicesResponse> {
    const now = Date.now();
    if (this.trendingCache && this.trendingCache.expiresAt > now) {
      return this.trendingCache.value;
    }
    const value = await this.stats.getTrendingServices(new Date(now));
    this.trendingCache = { value, expiresAt: now + TRENDING_TTL_MS };
    return value;
  }
}
