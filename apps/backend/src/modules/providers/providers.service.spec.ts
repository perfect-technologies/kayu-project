import assert from "node:assert/strict";
import test from "node:test";
import { ProvidersService } from "./providers.service";

test("provider search only queries launch-ready published providers", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    provider: {
      findMany: async (args: unknown) => {
        calls.findMany = args;
        return [];
      },
    },
    review: {
      groupBy: async () => [],
    },
    certification: {
      groupBy: async () => [],
    },
  };

  const service = new ProvidersService(prisma as never, {} as never, {} as never);
  await service.search({ page: 1, limit: 20 } as never);

  const where = (calls.findMany as { where: { AND: Array<Record<string, unknown>> } })
    .where;
  assert.deepEqual(where.AND[1], {
    onboardingCompleteAt: { not: null },
  });
  assert.deepEqual(where.AND[2], {
    profession: { not: "" },
  });
  assert.deepEqual(where.AND[3], {
    hourlyRate: { gt: 0 },
  });
  assert.deepEqual(where.AND[4], {
    categories: {
      some: {
        category: {
          isActive: true,
        },
      },
    },
  });
  assert.deepEqual(where.AND[5], {
    serviceZones: { some: {} },
  });
  assert.deepEqual(where.AND[6], {
    trustScore: { isNot: null },
  });
});

