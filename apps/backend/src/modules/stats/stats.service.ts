import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { searchableProviderWhere } from "../providers/provider-visibility";

export const COVERED_COUNTRIES = 2;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [categories, providers, verifiedProviders] = await Promise.all([
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.provider.count({ where: searchableProviderWhere() }),
      this.prisma.provider.count({
        where: { ...searchableProviderWhere(), verificationStatus: "VERIFIED" },
      }),
    ]);
    return { categories, countries: COVERED_COUNTRIES, providers, verifiedProviders };
  }
}
