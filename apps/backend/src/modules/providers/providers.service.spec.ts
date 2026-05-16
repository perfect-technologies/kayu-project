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

  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
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

  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
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

  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
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
          subcategories: {
            some: {
              subcategory: {
                isActive: true,
                OR: [{ id: "robinetterie" }, { slug: "robinetterie" }],
              },
            },
          },
        }),
    ),
  );
});

test("getStrength derives strength from the caller's provider record", async () => {
  const prisma = {
    provider: {
      findUnique: async (args: unknown) => {
        assert.deepEqual((args as { where: unknown }).where, { userId: "user_1" });
        return {
          id: "provider_1",
          description: "Plombier fiable",
          verificationStatus: "PENDING",
          languages: ["Français"],
          user: { avatar: "https://cdn/x.jpg" },
          _count: { portfolioProjects: 2, skills: 4, serviceZones: 1 },
        };
      },
    },
  };
  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
  const result = await service.getStrength({ id: "user_1" } as never);
  assert.equal(result.score, 84);
  assert.equal(result.tier, "solide");
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

  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
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

test("createPortfolioProject confirms image paths and persists the project", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    portfolioProject: {
      create: async (args: unknown) => {
        calls.create = args;
        return {
          id: "proj_1",
          title: "Fuite cuisine",
          description: null,
          categoryId: null,
          duration: null,
          price: null,
          isFeatured: false,
          isPublished: true,
          createdAt: new Date("2026-05-16T00:00:00.000Z"),
          images: [
            {
              id: "img_1",
              imageType: "BEFORE",
              imageUrl: "https://cdn/p.jpg",
              caption: null,
              displayOrder: 0,
            },
          ],
        };
      },
    },
  };
  const ownedCalls: Array<[string, string, string]> = [];
  const storage = {
    assertOwnedPath: (p: string, a: string, path: string) => {
      ownedCalls.push([p, a, path]);
      return true;
    },
    resolveStoredUrl: (_p: string, path: string) => `https://cdn/${path}`,
  };
  const service = new ProvidersService(prisma as never, {} as never, {} as never, storage as never);
  const result = await service.createPortfolioProject({ id: "user_1" } as never, {
    title: "Fuite cuisine",
    images: [{ imageType: "BEFORE", path: "portfolio/user_1/x.jpg", displayOrder: 0 }],
  });
  assert.equal(result.success, true);
  assert.equal(result.project.id, "proj_1");
  const createData = (calls.create as { data: { images: { create: unknown[] } } }).data;
  assert.equal(
    (createData.images.create[0] as { imageUrl: string }).imageUrl,
    "https://cdn/portfolio/user_1/x.jpg",
  );
  assert.deepEqual(ownedCalls, [["portfolio", "user_1", "portfolio/user_1/x.jpg"]]);
});

test("updatePortfolioProject re-checks ownership and runs image paths through storage", async () => {
  let capturedUpdate: unknown;
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1" }) },
    portfolioProject: {
      findUnique: async () => ({ id: "proj_1", providerId: "provider_1" }),
    },
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        portfolioImage: { deleteMany: async () => {} },
        portfolioProject: {
          update: async (args: unknown) => {
            capturedUpdate = args;
            return {
              id: "proj_1",
              title: "x",
              description: null,
              categoryId: null,
              duration: null,
              price: null,
              isFeatured: false,
              isPublished: true,
              createdAt: new Date("2026-05-16T00:00:00.000Z"),
              images: [
                {
                  id: "img_1",
                  imageType: "AFTER",
                  imageUrl: "https://cdn/portfolio/user_1/after.jpg",
                  caption: null,
                  displayOrder: 0,
                },
              ],
            };
          },
        },
      };
      return cb(tx);
    },
  };
  const ownedCalls: Array<[string, string, string]> = [];
  const storage = {
    assertOwnedPath: (p: string, a: string, path: string) => {
      ownedCalls.push([p, a, path]);
      return true;
    },
    resolveStoredUrl: (_p: string, path: string) => `https://cdn/${path}`,
  };
  const service = new ProvidersService(prisma as never, {} as never, {} as never, storage as never);
  const result = await service.updatePortfolioProject({ id: "user_1" } as never, "proj_1", {
    title: "x",
    images: [{ imageType: "AFTER", path: "portfolio/user_1/after.jpg", displayOrder: 0 }],
  });
  assert.equal(result.success, true);
  assert.equal(result.project.images[0].imageUrl, "https://cdn/portfolio/user_1/after.jpg");
  assert.deepEqual(ownedCalls, [["portfolio", "user_1", "portfolio/user_1/after.jpg"]]);
  void capturedUpdate;
});

test("updatePortfolioProject rejects a project owned by another provider", async () => {
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1" }) },
    portfolioProject: {
      findUnique: async () => ({ id: "proj_1", providerId: "provider_OTHER" }),
    },
  };
  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
  await assert.rejects(
    () => service.updatePortfolioProject({ id: "user_1" } as never, "proj_1", {
      title: "x",
      images: [],
    }),
    { name: "NotFoundException" },
  );
});

test("deletePortfolioProject rejects a project owned by another provider", async () => {
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1" }) },
    portfolioProject: {
      findUnique: async () => ({ id: "proj_9", providerId: "provider_OTHER" }),
    },
  };
  const service = new ProvidersService(prisma as never, {} as never, {} as never, {} as never);
  await assert.rejects(
    () => service.deletePortfolioProject({ id: "user_1" } as never, "proj_9"),
    { name: "NotFoundException" },
  );
});
