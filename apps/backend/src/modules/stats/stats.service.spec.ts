import assert from "node:assert/strict";
import test from "node:test";
import { StatsService } from "./stats.service";

type PrismaFake = ConstructorParameters<typeof StatsService>[0];

function makePrismaFake(overrides: Partial<Record<string, unknown>> = {}): PrismaFake {
  // Defaults that satisfy `getPublicStats` callers; individual tests override only what they need.
  const base = {
    provider: { count: async () => 0 },
    user: { count: async () => 0 },
    category: { count: async () => 0, findMany: async () => [] },
    booking: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    review: { count: async () => 0, aggregate: async () => ({ _avg: { overallScore: 0 } }) },
    serviceZone: { findMany: async () => [] },
    providerCategory: { findMany: async () => [] },
  };
  return { ...base, ...overrides } as unknown as PrismaFake;
}

test("smoke: StatsService instantiates", () => {
  const service = new StatsService(makePrismaFake());
  assert.ok(service);
});

test("getTrendingServices returns trending mode when 3+ categories have bookings and images", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  // Helper to build N booking records for a given category and date.
  const make = (count: number, categoryId: string, when: Date) =>
    Array.from({ length: count }, () => ({
      createdAt: when,
      provider: { categories: [{ categoryId }] },
    }));

  // last 7d: cat_plumb=30, cat_hair=20, cat_elec=10
  const thisWeek = new Date("2026-05-08T00:00:00.000Z"); // within last 7d
  // prev 7d: cat_plumb=10, cat_hair=18, cat_elec=11
  const lastWeek = new Date("2026-04-30T00:00:00.000Z"); // within prev 7d

  const allBookings = [
    ...make(30, "cat_plumb", thisWeek),
    ...make(20, "cat_hair", thisWeek),
    ...make(10, "cat_elec", thisWeek),
    ...make(10, "cat_plumb", lastWeek),
    ...make(18, "cat_hair", lastWeek),
    ...make(11, "cat_elec", lastWeek),
  ];

  const prisma = makePrismaFake({
    booking: {
      count: async () => 0,
      findMany: async () => allBookings,
      groupBy: async () => [],
    },
    category: {
      count: async () => 0,
      findMany: async () => [
        { id: "cat_plumb", slug: "plomberie", name: "Plomberie", image: "img/p.jpg", color: "#0EA5E9", description: "Fuites", isActive: true, order: 1 },
        { id: "cat_hair", slug: "coiffure", name: "Coiffure", image: "img/h.jpg", color: "#EC4899", description: "Coupes", isActive: true, order: 2 },
        { id: "cat_elec", slug: "electricite", name: "Électricité", image: "img/e.jpg", color: "#F59E0B", description: "Pannes", isActive: true, order: 3 },
      ],
    },
    providerCategory: {
      findMany: async () => [
        { categoryId: "cat_plumb", provider: { hourlyRate: 25000 } },
        { categoryId: "cat_plumb", provider: { hourlyRate: 30000 } },
        { categoryId: "cat_hair",  provider: { hourlyRate: 15000 } },
        { categoryId: "cat_elec",  provider: { hourlyRate: 35000 } },
      ],
    },
  });

  const service = new StatsService(prisma);
  const result = await service.getTrendingServices(now);

  assert.equal(result.mode, "trending");
  assert.equal(result.items.length, 3);

  assert.equal(result.items[0].categoryId, "cat_plumb");
  assert.equal(result.items[0].startingPrice, 25000);
  assert.deepEqual(result.items[0].trendBadge, { kind: "growth", pct: 200 });

  assert.equal(result.items[1].categoryId, "cat_hair");
  assert.equal(result.items[1].startingPrice, 15000);
  assert.deepEqual(result.items[1].trendBadge, { kind: "growth", pct: 11 });

  assert.equal(result.items[2].categoryId, "cat_elec");
  assert.deepEqual(result.items[2].trendBadge, { kind: "top", rank: 3 });
});

test("getTrendingServices skips categories with null image", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const thisWeek = new Date("2026-05-08T00:00:00.000Z");
  const prisma = makePrismaFake({
    booking: {
      count: async () => 0,
      findMany: async () => [
        ...Array.from({ length: 50 }, () => ({
          createdAt: thisWeek,
          provider: { categories: [{ categoryId: "cat_no_img" }] },
        })),
        ...Array.from({ length: 5 }, () => ({
          createdAt: thisWeek,
          provider: { categories: [{ categoryId: "cat_with_img" }] },
        })),
      ],
      groupBy: async () => [],
    },
    category: {
      count: async () => 0,
      findMany: async () => [
        { id: "cat_no_img", slug: "no-img", name: "No Img", image: null, color: null, description: null, isActive: true, order: 1 },
        { id: "cat_with_img", slug: "ok", name: "OK", image: "img/ok.jpg", color: null, description: null, isActive: true, order: 2 },
      ],
    },
    providerCategory: { findMany: async () => [] },
  });

  const service = new StatsService(prisma);
  const result = await service.getTrendingServices(now);

  // Only one qualifies → falls back to discovery
  assert.equal(result.mode, "discovery");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].categoryId, "cat_with_img");
  assert.equal(result.items[0].trendBadge, null);
});

test("getTrendingServices returns discovery mode when no bookings exist", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const prisma = makePrismaFake({
    booking: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    category: {
      count: async () => 0,
      findMany: async () => [
        { id: "c1", slug: "s1", name: "C1", image: "img/1.jpg", color: null, description: null, isActive: true, order: 1 },
        { id: "c2", slug: "s2", name: "C2", image: "img/2.jpg", color: null, description: null, isActive: true, order: 2 },
        { id: "c3", slug: "s3", name: "C3", image: "img/3.jpg", color: null, description: null, isActive: true, order: 3 },
        { id: "c4", slug: "s4", name: "C4", image: null,         color: null, description: null, isActive: true, order: 4 },
      ],
    },
    providerCategory: { findMany: async () => [] },
  });

  const service = new StatsService(prisma);
  const result = await service.getTrendingServices(now);

  assert.equal(result.mode, "discovery");
  assert.equal(result.items.length, 3);
  // discovery uses `order` ascending; c4 (no image) excluded
  assert.deepEqual(result.items.map((item) => item.categoryId), ["c1", "c2", "c3"]);
  for (const item of result.items) assert.equal(item.trendBadge, null);
});

test("getTrendingServices returns empty items when no category has an image", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const prisma = makePrismaFake({
    booking: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    category: {
      count: async () => 0,
      findMany: async () => [
        { id: "c1", slug: "s1", name: "C1", image: null, color: null, description: null, isActive: true, order: 1 },
      ],
    },
    providerCategory: { findMany: async () => [] },
  });

  const service = new StatsService(prisma);
  const result = await service.getTrendingServices(now);

  assert.equal(result.mode, "discovery");
  assert.deepEqual(result.items, []);
});
