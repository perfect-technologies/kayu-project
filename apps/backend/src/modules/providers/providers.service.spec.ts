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
      count: async (args: unknown) => {
        calls.count = args;
        return 0;
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

  const where = (calls.count as { where: { AND: Array<Record<string, unknown>> } })
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

test("provider search city filter matches both service-zone city and commune", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    provider: {
      count: async (args: unknown) => {
        calls.count = args;
        return 0;
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
  await service.search({ page: 1, limit: 20, city: "Gombe" } as never);

  const where = (calls.count as { where: { AND: Array<Record<string, unknown>> } }).where;
  const cityCondition = where.AND.find((condition) =>
    JSON.stringify(condition).includes("\"commune\""),
  );

  assert.deepEqual(cityCondition, {
    OR: [
      {
        user: {
          city: {
            contains: "Gombe",
            mode: "insensitive",
          },
        },
      },
      {
        serviceZones: {
          some: {
            OR: [
              {
                city: {
                  contains: "Gombe",
                  mode: "insensitive",
                },
              },
              {
                commune: {
                  contains: "Gombe",
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ],
  });
});

test("provider search applies category and subcategory filters by id or slug", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    provider: {
      count: async (args: unknown) => {
        calls.count = args;
        return 0;
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
  await service.search({
    page: 1,
    limit: 20,
    category: "plomberie",
    subcategory: "robinetterie",
  } as never);

  const where = (calls.count as { where: { AND: Array<Record<string, unknown>> } }).where;

  assert.ok(
    where.AND.some(
      (condition) =>
        JSON.stringify(condition) ===
        JSON.stringify({
          categories: {
            some: {
              category: {
                isActive: true,
                OR: [{ id: "plomberie" }, { slug: "plomberie" }],
              },
            },
          },
        }),
    ),
  );
  assert.ok(
    where.AND.some(
      (condition) =>
        JSON.stringify(condition) ===
        JSON.stringify({
          trades: {
            some: {
              trade: {
                isActive: true,
                subcategory: {
                  isActive: true,
                  OR: [{ id: "robinetterie" }, { slug: "robinetterie" }],
                },
              },
            },
          },
        }),
    ),
  );
});

test("provider search applies min rating before database pagination and sorts by requested field", async () => {
  const calls: {
    providerFindMany: unknown[];
    providerCount?: unknown;
    reviewGroupBy?: unknown;
  } = {
    providerFindMany: [],
  };

  const prisma = {
    provider: {
      findMany: async (args: {
        select?: { id: true };
        include?: unknown;
      }) => {
        calls.providerFindMany.push(args);

        if (args.select?.id) {
          return [{ id: "provider-1" }, { id: "provider-2" }];
        }

        return [];
      },
      count: async (args: unknown) => {
        calls.providerCount = args;
        return 1;
      },
    },
    review: {
      groupBy: async (args: unknown) => {
        calls.reviewGroupBy = args;
        return [
          {
            providerId: "provider-1",
            _avg: { overallScore: 4.8 },
          },
          {
            providerId: "provider-2",
            _avg: { overallScore: 4.1 },
          },
        ];
      },
    },
    certification: {
      groupBy: async () => [],
    },
  };

  const service = new ProvidersService(prisma as never, {} as never, {} as never);
  await service.search({
    page: 2,
    limit: 10,
    minRating: 4.5,
    sortBy: "hourlyRate",
    sortOrder: "asc",
  } as never);

  assert.equal(calls.providerFindMany.length, 2);
  assert.deepEqual(
    (calls.reviewGroupBy as { where: { providerId: { in: string[] } } }).where,
    {
      providerId: {
        in: ["provider-1", "provider-2"],
      },
    },
  );

  const countedWhere = (calls.providerCount as {
    where: { AND: Array<Record<string, unknown>> };
  }).where;
  assert.deepEqual(countedWhere.AND.at(-1), {
    id: { in: ["provider-1"] },
  });

  const pageQuery = calls.providerFindMany[1] as {
    orderBy: Array<Record<string, "asc" | "desc">>;
    skip: number;
    take: number;
  };
  assert.deepEqual(pageQuery.orderBy, [{ hourlyRate: "asc" }, { id: "asc" }]);
  assert.equal(pageQuery.skip, 10);
  assert.equal(pageQuery.take, 10);
});
