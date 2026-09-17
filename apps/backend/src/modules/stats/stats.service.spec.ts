import assert from "node:assert/strict";
import test from "node:test";
import { StatsService } from "./stats.service";

test("public stats count active categories and visible providers only", async () => {
  const providerWheres: unknown[] = [];
  const prisma = {
    category: {
      count: async ({ where }: { where: unknown }) => {
        assert.deepEqual(where, { isActive: true });
        return 19;
      },
    },
    provider: {
      count: async ({ where }: { where: Record<string, unknown> }) => {
        providerWheres.push(where);
        return where.verificationStatus === "VERIFIED" ? 13 : 15;
      },
    },
  };

  const stats = await new StatsService(prisma as never).getPublicStats();

  assert.deepEqual(stats, { categories: 19, countries: 2, providers: 15, verifiedProviders: 13 });
  assert.deepEqual(providerWheres, [
    { hidden: false, user: { isActive: true } },
    { hidden: false, user: { isActive: true }, verificationStatus: "VERIFIED" },
  ]);
});
