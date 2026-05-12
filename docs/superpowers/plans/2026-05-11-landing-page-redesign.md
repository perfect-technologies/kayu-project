# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage with 9 sections (hero kept; trust strip, categories, trending/discovery services, top-rated providers, how-it-works, testimonials, provider CTA, app download CTA), backed by a new trending-services endpoint and 6 new UI components.

**Architecture:** A new `GET /stats/trending-services` endpoint in the existing `StatsModule` returns either trending (last-7-day bookings) or discovery (fallback) cards. The homepage server component fetches stats, categories, providers and trending in parallel; `HomePageClient` composes the new sections. New presentational components live in `packages/ui/src/web/` next to the existing ones; `CategoryTile` gains a backward-compatible `variant` prop.

**Tech Stack:**
- Backend: NestJS + Prisma, in-memory cache (plain `Map`), validation via Zod through `@kayu/schemas`.
- Frontend: Next.js App Router server components, plain CSS-in-JS via `style` props (matching existing pattern in `HomePageClient.tsx`).
- Shared: `@kayu/schemas` (DTOs), `@kayu/api` (typed HTTP client), `@kayu/ui/web` (components).
- Tests: backend `node:test` + `node:assert/strict` with hand-rolled Prisma fakes (mirrors `admin.service.spec.ts`). UI work is verified via `pnpm type-check` and manual visual inspection (`packages/ui` has no test runner today — out of scope to add one).

**Spec:** `docs/superpowers/specs/2026-05-11-landing-page-redesign-design.md`

**Important constraint from user (`MEMORY.md`):** No intermediate commits — implement all tasks end-to-end; the user reviews the full diff before anything ships. Tasks below therefore do **not** include commit steps.

---

## File Structure

**Schemas — `packages/schemas/src/dto.ts`** (modify)
- Add `TrendingServiceItemSchema`, `TrendingServicesResponseSchema`, and types.

**API client — `packages/api/src/endpoints.ts`** (modify)
- Extend `statsApi` with `getTrending()`.

**Backend stats module — `apps/backend/src/modules/stats/`**
- `stats.service.ts` (modify) — add `getTrendingServices()` with helper methods + 10-min cache.
- `stats.controller.ts` (modify) — add `@Get("trending-services")` route.
- `stats.service.spec.ts` (new) — tests for trending logic, discovery fallback, image filter, starting-price, caching.

**UI package — `packages/ui/src/web/`** (new files unless noted)
- `CategoryTile.tsx` (modify) — add `variant` prop.
- `TrustStrip.tsx`
- `TrendingServiceCard.tsx`
- `ProviderHorizontalCard.tsx`
- `HowItWorksStep.tsx` (renders one step; mockup sub-renderer inside).
- `TestimonialCard.tsx`
- `ProviderDashboardPreview.tsx` (the 3 stacked dashboard cards inside the Provider CTA).
- `AppPhoneMockup.tsx` (renders one phone with `variant: "home" | "booking-confirmed"`).
- `index.ts` (modify) — re-export new components.

**Web app — `apps/web/src/app/`**
- `page.tsx` (modify) — add `getTrending` to the parallel fetches.
- `HomePageClient.tsx` (rewrite) — compose new sections.
- `home/HardcodedTestimonials.ts` (new) — 3-entry constants array.

---

## Task 1: Add trending DTOs to the schemas package

**Files:**
- Modify: `packages/schemas/src/dto.ts`

This unblocks the backend and the api client. Start here.

- [ ] **Step 1: Confirm the schemas don't already exist**

Run: `grep -n "TrendingServiceItem\|TrendingServicesResponse" packages/schemas/src/dto.ts`
Expected: no matches.

- [ ] **Step 2: Add the schemas next to `PublicStatsResponseSchema`**

In `packages/schemas/src/dto.ts`, locate `PublicStatsResponseSchema` (around line 781). Insert the following block immediately after the closing `});` of that schema:

```ts
export const TrendingBadgeSchema = z.union([
  z.object({
    kind: z.literal("growth"),
    pct: z.number().int(),
  }),
  z.object({
    kind: z.literal("top"),
    rank: z.number().int().min(1),
  }),
]);

export const TrendingServiceItemSchema = z.object({
  categoryId: IdSchema,
  categorySlug: z.string(),
  categoryName: z.string(),
  categoryImage: z.string(),
  categoryColor: z.string().nullable(),
  description: z.string().nullable(),
  startingPrice: z.number().int().nullable(),
  trendBadge: TrendingBadgeSchema.nullable(),
});

export const TrendingServicesResponseSchema = z.object({
  mode: z.enum(["trending", "discovery"]),
  items: z.array(TrendingServiceItemSchema),
});
```

- [ ] **Step 3: Export the inferred types alongside the other Public types**

Search for `export type PublicStatsResponse` (around line 1115). Add the new types directly below it:

```ts
export type TrendingBadge = z.infer<typeof TrendingBadgeSchema>;
export type TrendingServiceItem = z.infer<typeof TrendingServiceItemSchema>;
export type TrendingServicesResponse = z.infer<typeof TrendingServicesResponseSchema>;
```

- [ ] **Step 4: Confirm IdSchema is imported in this file**

Run: `grep -n "IdSchema" packages/schemas/src/dto.ts | head -3`
Expected: at least one occurrence in the same file (the schema is used heavily). If it's only imported indirectly, no action needed — re-using it is enough.

- [ ] **Step 5: Type-check the package**

Run: `pnpm --filter @kayu/schemas type-check`
Expected: no errors. If there's no `type-check` script in this package, run `pnpm --filter @kayu/schemas build` instead and ensure it succeeds.

---

## Task 2: Add the typed API endpoint

**Files:**
- Modify: `packages/api/src/endpoints.ts`

- [ ] **Step 1: Locate the `statsApi` block**

Run: `grep -n "export const statsApi" packages/api/src/endpoints.ts`
Expected: a single match around line 294.

- [ ] **Step 2: Add `TrendingServicesResponse` to the imports**

At the top of the file, find the `import type { … } from "@kayu/schemas";` block and add `TrendingServicesResponse` to it (keep the rest of the imports as-is). If it's a side-effect import, add a separate type import line below it:

```ts
import type { TrendingServicesResponse } from "@kayu/schemas";
```

- [ ] **Step 3: Extend `statsApi`**

Replace the existing `statsApi` block with:

```ts
export const statsApi = (client: ApiClient) => ({
  getGlobal: () => client.get<PublicStatsResponse>("/stats"),
  getTrending: () =>
    client.get<TrendingServicesResponse>("/stats/trending-services"),
});
```

- [ ] **Step 4: Type-check the package**

Run: `pnpm --filter @kayu/api type-check`
Expected: no errors. If no `type-check` script exists, run `pnpm --filter @kayu/api build`.

---

## Task 3: Write failing tests for `StatsService.getTrendingServices`

**Files:**
- Create: `apps/backend/src/modules/stats/stats.service.spec.ts`

This file does not exist yet. Mirror the pattern in `apps/backend/src/modules/admin/admin.service.spec.ts` — `node:test` + `node:assert/strict` + hand-rolled Prisma fakes (no test framework setup needed; the repo runs `*.spec.ts` files with the existing Nest test config).

- [ ] **Step 1: Create the test file with one passing harness check**

Create `apps/backend/src/modules/stats/stats.service.spec.ts`:

```ts
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
    booking: { count: async () => 0, groupBy: async () => [] },
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
```

- [ ] **Step 2: Run the smoke test**

Run from repo root:
```
pnpm --filter backend test -- --grep "smoke: StatsService"
```

If that command doesn't exist, look at `apps/backend/package.json` for the test script and adapt. The admin spec is the working reference — replicate whatever command runs it. Expected: PASS.

- [ ] **Step 3: Add the first failing test — trending mode with 3 categories**

Append to `stats.service.spec.ts`:

```ts
test("getTrendingServices returns trending mode when 3+ categories have bookings and images", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");

  const prisma = makePrismaFake({
    booking: {
      count: async () => 0,
      groupBy: async (args: { where?: { createdAt?: { gte: Date; lt: Date } } }) => {
        const gte = args.where?.createdAt?.gte?.toISOString();
        // Last 7 days window (more bookings)
        if (gte === "2026-05-04T12:00:00.000Z") {
          return [
            { categoryId: "cat_plumb", _count: { _all: 30 } },
            { categoryId: "cat_hair", _count: { _all: 20 } },
            { categoryId: "cat_elec", _count: { _all: 10 } },
          ];
        }
        // Previous 7 days
        if (gte === "2026-04-27T12:00:00.000Z") {
          return [
            { categoryId: "cat_plumb", _count: { _all: 10 } }, // +200%
            { categoryId: "cat_hair", _count: { _all: 18 } }, // +11%
            { categoryId: "cat_elec", _count: { _all: 11 } }, // -9%
          ];
        }
        return [];
      },
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

  // Top of ranking: highest "thisWeek" count first
  assert.equal(result.items[0].categoryId, "cat_plumb");
  assert.equal(result.items[0].startingPrice, 25000);          // MIN hourlyRate
  assert.deepEqual(result.items[0].trendBadge, { kind: "growth", pct: 200 });

  assert.equal(result.items[1].categoryId, "cat_hair");
  assert.equal(result.items[1].startingPrice, 15000);
  assert.deepEqual(result.items[1].trendBadge, { kind: "growth", pct: 11 });

  // Third one didn't grow ≥ 10% → "top" badge with rank
  assert.equal(result.items[2].categoryId, "cat_elec");
  assert.deepEqual(result.items[2].trendBadge, { kind: "top", rank: 3 });
});
```

- [ ] **Step 4: Add the second failing test — image filter**

Append:

```ts
test("getTrendingServices skips categories with null image", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const prisma = makePrismaFake({
    booking: {
      count: async () => 0,
      groupBy: async () => [
        { categoryId: "cat_no_img", _count: { _all: 50 } },
        { categoryId: "cat_with_img", _count: { _all: 5 } },
      ],
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
```

- [ ] **Step 5: Add the third failing test — discovery fallback**

Append:

```ts
test("getTrendingServices returns discovery mode when no bookings exist", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const prisma = makePrismaFake({
    booking: { count: async () => 0, groupBy: async () => [] },
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
  assert.deepEqual(result.items.map(i => i.categoryId), ["c1", "c2", "c3"]);
  for (const item of result.items) assert.equal(item.trendBadge, null);
});
```

- [ ] **Step 6: Add the fourth failing test — empty result**

Append:

```ts
test("getTrendingServices returns empty items when no category has an image", async () => {
  const now = new Date("2026-05-11T12:00:00.000Z");
  const prisma = makePrismaFake({
    booking: { count: async () => 0, groupBy: async () => [] },
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
```

- [ ] **Step 7: Run all new tests and confirm they FAIL**

Run the test command from Step 2 (filter on `getTrendingServices`). Expected: all four new tests fail with `service.getTrendingServices is not a function`. The smoke test still passes.

---

## Task 4: Implement `StatsService.getTrendingServices`

**Files:**
- Modify: `apps/backend/src/modules/stats/stats.service.ts`

- [ ] **Step 1: Add the public method and supporting helpers**

In `stats.service.ts`, replace the entire file with:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type {
  TrendingServiceItem,
  TrendingServicesResponse,
  TrendingBadge,
} from "@kayu/schemas";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TRENDING_LIMIT = 3;
const GROWTH_THRESHOLD = 0.1; // 10%

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

    const [thisWeekRaw, lastWeekRaw, categories, providerLinks] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ["categoryId"],
        where: { createdAt: { gte: last7Start, lt: now } },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ["categoryId"],
        where: { createdAt: { gte: prev7Start, lt: last7Start } },
        _count: { _all: true },
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

    // Build min-price map per category
    const minPriceByCategory = new Map<string, number>();
    for (const link of providerLinks) {
      const rate = link.provider?.hourlyRate;
      if (typeof rate !== "number" || Number.isNaN(rate)) continue;
      const current = minPriceByCategory.get(link.categoryId);
      if (current === undefined || rate < current) {
        minPriceByCategory.set(link.categoryId, rate);
      }
    }

    const thisWeekCounts = new Map<string, number>(
      thisWeekRaw
        .filter((r) => r.categoryId)
        .map((r) => [r.categoryId as string, r._count._all]),
    );
    const lastWeekCounts = new Map<string, number>(
      lastWeekRaw
        .filter((r) => r.categoryId)
        .map((r) => [r.categoryId as string, r._count._all]),
    );

    // Candidates: ranked by thisWeek count, filtered to categories with an image
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
      // Image presence is enforced by the caller; ! is safe.
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
```

- [ ] **Step 2: Run the spec — all tests should pass**

Run the same command from Task 3 Step 2. Expected: all 5 tests (smoke + 4 new) PASS.

- [ ] **Step 3: Type-check the backend**

Run: `pnpm --filter backend type-check` (or `tsc --noEmit` equivalent — see the package's scripts).
Expected: no errors. If `providerCategory.findMany` signature objects to the `select` shape, double-check Prisma schema includes the `provider` relation on `ProviderCategory`. If not, fall back to a two-step fetch (list provider IDs per category, then `provider.findMany`).

---

## Task 5: Wire the trending endpoint into the controller with caching

**Files:**
- Modify: `apps/backend/src/modules/stats/stats.controller.ts`

- [ ] **Step 1: Add the cached route**

Replace the file contents with:

```ts
import { Controller, Get } from "@nestjs/common";
import type { TrendingServicesResponse } from "@kayu/schemas";
import { StatsService } from "./stats.service";

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
```

- [ ] **Step 2: Smoke-test the endpoint locally**

Start the backend (use the existing dev script, e.g. `pnpm --filter backend dev`). Once it's up, run:

```
curl -s http://localhost:3001/stats/trending-services | head -200
```

(Adjust port if different. Check `apps/backend/.env` or the main bootstrap if unsure.)
Expected: JSON with `{ "mode": "trending" | "discovery", "items": [...] }`. If the database has no bookings or no category images, `items` may be empty — that's the documented behavior.

- [ ] **Step 3: Stop the backend before continuing**

Kill the dev process.

---

## Task 6: `CategoryTile` — add the `centered-mono` variant

**Files:**
- Modify: `packages/ui/src/web/CategoryTile.tsx`

The existing tile is left-aligned with a tinted icon box; the homepage needs a centered monochrome variant. Existing consumers must not break — add a `variant` prop defaulting to `"default"`.

- [ ] **Step 1: Add the `variant` prop type and accept it**

Find the `CategoryTileProps` block and replace it with:

```ts
export type CategoryTileVariant = "default" | "centered-mono";

export type CategoryTileProps = {
  slug?: CategorySlug;
  label?: string;
  count?: number;
  iconName?: IconName | string;
  color?: string;
  size?: CategoryTileSize;
  variant?: CategoryTileVariant;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};
```

- [ ] **Step 2: Read the variant in the component and branch the render**

Update the component signature to destructure `variant = "default"` and replace its body with a branch:

```tsx
export const CategoryTile: React.FC<CategoryTileProps> = ({
  slug,
  label,
  count,
  iconName,
  color,
  size = "lg",
  variant = "default",
  onClick,
  className,
  style,
}) => {
  const portfolio = slug ? tokens.portfolio[slug] : undefined;
  const tint = slug ? tokens.categoryTint[slug] : undefined;

  const resolvedLabel = label ?? portfolio?.label ?? "Catégorie";
  const Icon =
    resolveLucideIcon(iconName) ??
    (portfolio ? (I[portfolio.iconName as IconName] as React.FC<IconProps>) : null) ??
    FallbackCategoryIcon;

  const [hovered, setHovered] = React.useState(false);

  if (variant === "centered-mono") {
    return (
      <button
        onClick={onClick ? () => onClick() : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={className}
        style={{
          position: "relative",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: "30px 14px 22px",
          textAlign: "center",
          cursor: onClick ? "pointer" : "default",
          width: "100%",
          minWidth: 0,
          boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
          transform: hovered && onClick ? "translateY(-2px)" : undefined,
          transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
          font: "inherit",
          color: "inherit",
          ...style,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            color: hovered ? tokens.color.textMuted : "transparent",
            transition: "color 160ms",
          }}
        >
          <I.arrowUpRight size={16} />
        </span>
        <div
          style={{
            color: tokens.color.textPrimary,
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon size={38} strokeWidth={1.6} />
        </div>
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.25,
            color: tokens.color.textPrimary,
            overflowWrap: "anywhere",
          }}
        >
          {resolvedLabel}
        </div>
        {count != null ? (
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 12,
              fontWeight: 500,
              color: tokens.color.textMuted,
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count} pros
          </div>
        ) : null}
      </button>
    );
  }

  // Existing default behavior preserved verbatim below.
  const tileBg = color
    ? hexWithAlpha(color, 0.16)
    : tint?.bg ?? tokens.color.surfaceMuted;
  const tileFg = color ?? tint?.fg ?? tokens.color.textBody;
  // ... keep the rest of the existing render unchanged
```

Keep the existing default render block exactly as it was — only the wrapping branch is added.

- [ ] **Step 3: Confirm `I.arrowUpRight` exists; add it if it doesn't**

Run: `grep -n "arrowUpRight" packages/ui/src/web/Icon.tsx`

If there's no match, open `packages/ui/src/web/Icon.tsx`:
1. Add `ArrowUpRight` to the existing `import { … } from "lucide-react";` block.
2. In the `export const I = { … }` object, add `arrowUpRight: wrap(ArrowUpRight),`.

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @kayu/ui type-check`
Expected: no errors.

---

## Task 7: Build `TrustStrip`

**Files:**
- Create: `packages/ui/src/web/TrustStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { BadgeCheck, Star, Clock, MapPin } from "lucide-react";
import { tokens } from "../tokens.js";

export type TrustStripProps = {
  verifiedProviders: number | null;
  averageRating: number | null;
  cityCount: number | null;
  responseTime?: string; // hardcoded "~1h" by default per spec v1
};

type Metric = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
};

export const TrustStrip: React.FC<TrustStripProps> = ({
  verifiedProviders,
  averageRating,
  cityCount,
  responseTime = "~1h",
}) => {
  const fmt = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n);

  const metrics: Metric[] = [
    {
      icon: <BadgeCheck size={22} strokeWidth={1.8} color={tokens.color.success} />,
      value: <>{fmt(verifiedProviders)}{verifiedProviders != null ? "+" : ""}</>,
      label: "Pros vérifiés",
    },
    {
      icon: <Star size={22} fill={tokens.color.warning} stroke="none" />,
      value: averageRating == null ? "—" : <>{averageRating.toFixed(1)}<span style={{ color: tokens.color.textMuted, fontSize: 14, fontWeight: 500 }}>/5</span></>,
      label: "Note moyenne",
    },
    {
      icon: <Clock size={22} strokeWidth={1.8} color={tokens.color.primary} />,
      value: responseTime,
      label: "Temps de réponse",
    },
    {
      icon: <MapPin size={22} strokeWidth={1.8} color="#8B5CF6" />,
      value: fmt(cityCount),
      label: "Villes RDC & Congo",
    },
  ];

  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px" }}>
      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 16,
          padding: "20px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          alignItems: "center",
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingLeft: i === 0 ? 0 : 24,
              borderRight: i < metrics.length - 1 ? `1px solid ${tokens.color.border}` : "none",
              paddingRight: i < metrics.length - 1 ? 24 : 0,
            }}
          >
            <div>{m.icon}</div>
            <div>
              <div
                style={{
                  fontFamily: tokens.font.mono,
                  fontWeight: 700,
                  fontSize: 22,
                  color: tokens.color.textPrimary,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: tokens.color.textMuted }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Export from `index.ts`**

Open `packages/ui/src/web/index.ts` and add (alphabetical with the existing pattern):

```ts
export { TrustStrip, type TrustStripProps } from "./TrustStrip.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 8: Build `TrendingServiceCard`

**Files:**
- Create: `packages/ui/src/web/TrendingServiceCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { ArrowRight, TrendingUp, Star } from "lucide-react";
import type { TrendingServiceItem } from "@kayu/schemas";
import { tokens } from "../tokens.js";

export type TrendingServiceCardProps = {
  item: TrendingServiceItem;
  onClick?: (slug: string) => void;
};

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export const TrendingServiceCard: React.FC<TrendingServiceCardProps> = ({ item, onClick }) => {
  const accent = item.categoryColor ?? tokens.color.primary;
  const [hovered, setHovered] = React.useState(false);

  return (
    <article
      onClick={onClick ? () => onClick(item.categorySlug) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        transform: hovered && onClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
      }}
    >
      <div style={{ position: "relative", height: 160 }}>
        <img
          src={item.categoryImage}
          alt={item.categoryName}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {item.trendBadge ? (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <TrendBadge badge={item.trendBadge} />
          </div>
        ) : null}
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: tokens.color.textPrimary, marginBottom: 6 }}>
          {item.categoryName}
        </div>
        <div
          style={{
            fontSize: 13,
            color: tokens.color.textBody,
            lineHeight: 1.5,
            marginBottom: 16,
            minHeight: 38,
          }}
        >
          {item.description ?? " "}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontSize: 10,
                color: tokens.color.textMuted,
                letterSpacing: ".05em",
                fontWeight: 600,
              }}
            >
              À PARTIR DE
            </div>
            <div
              style={{
                fontFamily: tokens.font.mono,
                fontWeight: 700,
                fontSize: 16,
                color: tokens.color.textPrimary,
                marginTop: 2,
              }}
            >
              {item.startingPrice != null ? (
                <>
                  {formatPrice(item.startingPrice)}{" "}
                  <span style={{ fontSize: 11, color: tokens.color.textMuted, fontFamily: "inherit" }}>FC</span>
                </>
              ) : (
                <span style={{ color: tokens.color.textMuted, fontFamily: "inherit", fontWeight: 500 }}>—</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(item.categorySlug);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              padding: "6px 0",
              color: accent,
            }}
          >
            Réserver <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
};

const TrendBadge: React.FC<{ badge: NonNullable<TrendingServiceItem["trendBadge"]> }> = ({ badge }) => {
  if (badge.kind === "growth") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 8px",
          borderRadius: 6,
          background: tokens.color.surface,
          color: "#C2410C",
          border: "1px solid #FED7AA",
        }}
      >
        <TrendingUp size={11} strokeWidth={2.5} />
        +{badge.pct}%
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: 6,
        background: tokens.color.surface,
        color: "#1E40AF",
        border: "1px solid #BFDBFE",
      }}
    >
      <Star size={11} fill="currentColor" stroke="none" />
      Top {badge.rank}
    </span>
  );
};
```

- [ ] **Step 2: Export from `index.ts`**

Add to `packages/ui/src/web/index.ts`:

```ts
export { TrendingServiceCard, type TrendingServiceCardProps } from "./TrendingServiceCard.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 9: Build `ProviderHorizontalCard`

**Files:**
- Create: `packages/ui/src/web/ProviderHorizontalCard.tsx`

- [ ] **Step 1: Create the component**

This card reuses `ProviderCardData` from `cards.ts`. Avatar fallback = initials on neutral beige; if no name either, fall back to a `User` Lucide icon.

```tsx
"use client";

import * as React from "react";
import { ArrowRight, Star, BadgeCheck, User } from "lucide-react";
import type { ProviderCardData } from "../cards.js";
import { formatHourly } from "../cards.js";
import { tokens } from "../tokens.js";

export type ProviderHorizontalCardProps = {
  provider: ProviderCardData;
  onClick?: (id: string) => void;
};

const initialsOf = (p: ProviderCardData): string | null => {
  if (p.initials) return p.initials.slice(0, 2).toUpperCase();
  const first = p.firstName?.[0] ?? "";
  const last = p.lastName?.[0] ?? "";
  const composed = `${first}${last}`.toUpperCase();
  return composed.length > 0 ? composed : null;
};

export const ProviderHorizontalCard: React.FC<ProviderHorizontalCardProps> = ({ provider, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const handleClick = onClick ? () => onClick(provider.id) : undefined;
  const initials = initialsOf(provider);
  const fullName = [provider.firstName, provider.lastName].filter(Boolean).join(" ").trim();
  const cityLine = [provider.commune, provider.city].filter(Boolean).join(" · ");

  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "stretch",
        cursor: handleClick ? "pointer" : "default",
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        transform: hovered && handleClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
      }}
    >
      <div
        style={{
          width: 140,
          flexShrink: 0,
          background: "#F5F2E9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {provider.avatarUrl ? (
          <img
            src={provider.avatarUrl}
            alt={fullName || "Provider"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : initials ? (
          <span
            style={{
              fontFamily: tokens.font.mono,
              fontWeight: 700,
              fontSize: 36,
              color: tokens.color.textMuted,
            }}
          >
            {initials}
          </span>
        ) : (
          <User size={36} color={tokens.color.textMuted} strokeWidth={1.6} />
        )}
      </div>

      <div style={{ flex: 1, padding: 16, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: tokens.color.textPrimary }}>
              {fullName || "Pro KAYOU"}
            </div>
            {provider.verified ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#15803D",
                  background: "#DCFCE7",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                <BadgeCheck size={10} fill="currentColor" stroke="white" strokeWidth={2} />
                Vérifié
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 13, color: tokens.color.textMuted, marginBottom: 8 }}>
            {[provider.profession, cityLine].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: tokens.color.textMuted, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: tokens.color.textPrimary, fontFamily: tokens.font.mono }}>
              <Star size={13} fill={tokens.color.warning} stroke="none" />
              {provider.rating.toFixed(1)} ({provider.reviews})
            </span>
            <span style={{ fontFamily: tokens.font.mono }}>⚡ {provider.response}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: tokens.color.textMuted, letterSpacing: ".05em", fontWeight: 600 }}>
              À PARTIR DE
            </div>
            <div style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 14, color: tokens.color.textPrimary }}>
              {formatHourly(provider.hourly)}{" "}
              <span style={{ fontSize: 11, color: tokens.color.textMuted, fontFamily: "inherit", fontWeight: 500 }}>FC</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick?.();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              padding: "6px 0",
              color: tokens.color.primary,
            }}
          >
            Voir le profil <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
};
```

- [ ] **Step 2: Export from `index.ts`**

Add:
```ts
export { ProviderHorizontalCard, type ProviderHorizontalCardProps } from "./ProviderHorizontalCard.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 10: Build `HowItWorksStep` with mockup sub-renderers

**Files:**
- Create: `packages/ui/src/web/HowItWorksStep.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { tokens } from "../tokens.js";

export type HowItWorksStepProps = {
  number: 1 | 2 | 3;
  title: string;
  description: string;
};

export const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ number, title, description }) => (
  <div
    style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 16,
      padding: 24,
    }}
  >
    <div
      style={{
        fontFamily: tokens.font.mono,
        fontSize: 11,
        color: tokens.color.textMuted,
        letterSpacing: ".05em",
        fontWeight: 600,
      }}
    >
      ÉTAPE {String(number).padStart(2, "0")}
    </div>
    <div style={{ fontWeight: 700, fontSize: 17, color: tokens.color.textPrimary, marginTop: 6, marginBottom: 6 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: tokens.color.textBody, lineHeight: 1.5 }}>{description}</div>
    <div
      style={{
        marginTop: 18,
        background: "#FAFAF7",
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 10,
        padding: 14,
      }}
    >
      <StepMockup number={number} />
    </div>
  </div>
);

const StepMockup: React.FC<{ number: 1 | 2 | 3 }> = ({ number }) => {
  if (number === 1) return <Mockup1Search />;
  if (number === 2) return <Mockup2Chat />;
  return <Mockup3Booking />;
};

const Mockup1Search: React.FC = () => (
  <>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: "8px 10px",
        marginBottom: 8,
      }}
    >
      <Search size={14} color={tokens.color.textMuted} strokeWidth={2} />
      <span style={{ fontSize: 11, color: tokens.color.textMuted }}>Plomberie · Gombe</span>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {["⭐ 4.8+", "⚡ <1h"].map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: 10,
            background: tokens.color.surface,
            color: tokens.color.textMuted,
            padding: "3px 8px",
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 999,
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  </>
);

const Mockup2Chat: React.FC = () => {
  const bubbleBase: React.CSSProperties = {
    fontSize: 11,
    padding: "6px 10px",
    maxWidth: "80%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-start",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: "10px 10px 10px 2px",
          color: tokens.color.textBody,
        }}
      >
        Bonjour, vous êtes dispo demain ?
      </div>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-end",
          background: tokens.color.primary,
          color: "#fff",
          borderRadius: "10px 10px 2px 10px",
        }}
      >
        Oui, 14h ça vous va ?
      </div>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-start",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: "10px 10px 10px 2px",
          color: tokens.color.textBody,
        }}
      >
        Parfait 👍
      </div>
    </div>
  );
};

const Mockup3Booking: React.FC = () => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: tokens.color.textMuted, marginBottom: 6 }}>
      <span>Réservation #4827</span>
      <span style={{ color: "#15803D", fontWeight: 600 }}>Confirmée</span>
    </div>
    <div style={{ fontSize: 11, color: tokens.color.textBody, marginBottom: 8 }}>
      Plomberie · 23 mai · 14h
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${tokens.color.border}` }}>
      <span style={{ fontSize: 10, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>TOTAL</span>
      <span style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 12, color: tokens.color.textPrimary }}>25 000 FC</span>
    </div>
  </>
);
```

- [ ] **Step 2: Export**

Add to `packages/ui/src/web/index.ts`:
```ts
export { HowItWorksStep, type HowItWorksStepProps } from "./HowItWorksStep.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 11: Build `TestimonialCard` + hardcoded data file

**Files:**
- Create: `packages/ui/src/web/TestimonialCard.tsx`
- Create: `apps/web/src/app/home/HardcodedTestimonials.ts`

- [ ] **Step 1: Create the testimonial card**

```tsx
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { tokens } from "../tokens.js";

export type Testimonial = {
  initials: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
};

export type TestimonialCardProps = {
  data: Testimonial;
};

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ data }) => (
  <div
    style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 16,
      padding: 24,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: tokens.color.warning }}>
      {Array.from({ length: Math.round(data.rating) }).map((_, i) => (
        <Star key={i} size={14} fill="currentColor" stroke="none" />
      ))}
    </div>
    <p
      style={{
        fontSize: 14,
        color: tokens.color.textBody,
        lineHeight: 1.55,
        margin: "0 0 18px 0",
      }}
    >
      “{data.quote}”
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#F5F2E9",
          color: tokens.color.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {data.initials}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: tokens.color.textPrimary }}>{data.name}</div>
        <div style={{ fontSize: 11, color: tokens.color.textMuted }}>{data.role}</div>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Create the hardcoded data**

```ts
import type { Testimonial } from "@kayu/ui";

export const HARDCODED_TESTIMONIALS: Testimonial[] = [
  {
    initials: "MK",
    name: "Marie K.",
    role: "Cliente · Kinshasa",
    rating: 5,
    quote:
      "J'ai trouvé un plombier en moins de 10 minutes. Il est venu le même jour, prix correct, travail propre. Je ne cherche plus ailleurs.",
  },
  {
    initials: "JM",
    name: "Jean-Pierre M.",
    role: "Plombier · Kinshasa",
    rating: 5,
    quote:
      "Depuis KAYOU, j'ai doublé mes missions. Les clients voient ma note et mes photos, ils me font confiance avant même de m'appeler.",
  },
  {
    initials: "GN",
    name: "Grace N.",
    role: "Cliente · Brazzaville",
    rating: 5,
    quote:
      "Système de notation transparent, vrais profils, prix annoncés. Pour une fois, on ne se fait pas avoir.",
  },
];
```

- [ ] **Step 3: Export**

Add to `packages/ui/src/web/index.ts`:
```ts
export { TestimonialCard, type Testimonial, type TestimonialCardProps } from "./TestimonialCard.js";
```

- [ ] **Step 4: Type-check both packages**

Run: `pnpm --filter @kayu/ui type-check && pnpm --filter web type-check`. Expected: no errors.

---

## Task 12: Build `ProviderDashboardPreview`

**Files:**
- Create: `packages/ui/src/web/ProviderDashboardPreview.tsx`

This renders the three stacked mini-cards (revenue / new booking / recent review). Hardcoded content lives inside.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { Coins, Star } from "lucide-react";
import { tokens } from "../tokens.js";

const cardBase: React.CSSProperties = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,.04)",
  position: "absolute",
};

export const ProviderDashboardPreview: React.FC = () => (
  <div style={{ position: "relative", height: 340 }}>
    {/* Revenue card — top-left */}
    <div style={{ ...cardBase, top: 0, left: 0, width: 280 }}>
      <div style={{ fontSize: 10, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>
        REVENUS CE MOIS
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontWeight: 700,
          fontSize: 24,
          color: tokens.color.textPrimary,
          marginTop: 4,
        }}
      >
        842 500 <span style={{ fontSize: 12, color: tokens.color.textMuted }}>FC</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803D", marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>↑ +23%</span>
        <span style={{ fontSize: 11, color: tokens.color.textMuted }}>vs mois dernier</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, marginTop: 12 }}>
        {[18, 28, 22, 32, 24, 34, 36].map((h, i, arr) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              background: i === arr.length - 1 ? tokens.color.primary : "#E0F2FE",
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>

    {/* New booking notification — middle-right */}
    <div style={{ ...cardBase, top: 140, right: 0, width: 260 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#DCFCE7",
            color: "#15803D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Coins size={16} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#15803D" }}>Nouvelle réservation</div>
          <div style={{ fontSize: 10, color: tokens.color.textMuted }}>il y a 3 min</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: tokens.color.textPrimary, lineHeight: 1.4 }}>
        Marie K. a réservé <b>Plomberie</b> pour demain 14h ·{" "}
        <span style={{ fontFamily: tokens.font.mono }}>25 000 FC</span>
      </div>
    </div>

    {/* Recent review — bottom-left (offset to avoid overlap) */}
    <div style={{ ...cardBase, top: 230, left: 30, width: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#F5F2E9",
            color: tokens.color.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: tokens.font.mono,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          PN
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textPrimary }}>Patrick N.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: tokens.color.warning }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} fill="currentColor" stroke="none" />
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: tokens.color.textBody, fontStyle: "italic", lineHeight: 1.4 }}>
        "Travail rapide et propre, je recommande sans hésiter."
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Export**

Add to `packages/ui/src/web/index.ts`:
```ts
export { ProviderDashboardPreview } from "./ProviderDashboardPreview.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 13: Build `AppPhoneMockup`

**Files:**
- Create: `packages/ui/src/web/AppPhoneMockup.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import * as React from "react";
import { Search, Wrench, Scissors, Zap, Check } from "lucide-react";
import { tokens } from "../tokens.js";

export type AppPhoneMockupVariant = "home" | "booking-confirmed";
export type AppPhoneMockupProps = {
  variant: AppPhoneMockupVariant;
  rotate?: number; // degrees, used for layered display
  style?: React.CSSProperties;
};

export const AppPhoneMockup: React.FC<AppPhoneMockupProps> = ({ variant, rotate = 0, style }) => (
  <div
    style={{
      width: 200,
      height: 400,
      background: "#111",
      borderRadius: 30,
      padding: 7,
      transform: `rotate(${rotate}deg)`,
      boxShadow: rotate === 0 ? "0 20px 40px rgba(0,0,0,.15)" : "0 20px 40px rgba(0,0,0,.2)",
      position: "relative",
      ...style,
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 80,
        height: 18,
        background: "#111",
        borderRadius: "0 0 12px 12px",
        zIndex: 2,
      }}
    />
    <div
      style={{
        width: "100%",
        height: "100%",
        background: variant === "home" ? "#FAFAF7" : tokens.color.surface,
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      {variant === "home" ? <HomeContent /> : <BookingContent />}
    </div>
  </div>
);

const HomeContent: React.FC = () => (
  <div style={{ padding: "34px 12px 10px" }}>
    <div style={{ fontSize: 8, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>BONJOUR</div>
    <div style={{ fontWeight: 700, fontSize: 14, color: tokens.color.textPrimary, marginTop: 1 }}>Marie 👋</div>
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: "7px 9px",
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Search size={10} color={tokens.color.textMuted} strokeWidth={2} />
      <span style={{ fontSize: 9, color: tokens.color.textMuted }}>Quel service ?</span>
    </div>
    <div style={{ fontSize: 9, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em", marginTop: 12 }}>
      CATÉGORIES
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginTop: 5 }}>
      {([
        { name: "Plomberie", Icon: Wrench },
        { name: "Coiffure", Icon: Scissors },
        { name: "Élec.", Icon: Zap },
      ] as const).map(({ name, Icon }) => (
        <div
          key={name}
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 7,
            padding: "7px 4px",
            textAlign: "center",
          }}
        >
          <div style={{ color: tokens.color.textPrimary, display: "flex", justifyContent: "center", marginBottom: 3 }}>
            <Icon size={11} strokeWidth={1.7} />
          </div>
          <div style={{ fontSize: 7, color: tokens.color.textPrimary, fontWeight: 600 }}>{name}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 9, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em", marginTop: 12 }}>
      TOP PROS
    </div>
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: 7,
        marginTop: 5,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#F5F2E9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontSize: 8,
          color: tokens.color.textMuted,
          fontWeight: 700,
        }}
      >
        JM
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: tokens.color.textPrimary }}>Jean-Pierre M.</div>
        <div style={{ fontSize: 7, color: tokens.color.textMuted }}>Plombier · ⭐ 4.9</div>
      </div>
    </div>
  </div>
);

const BookingContent: React.FC = () => (
  <div style={{ padding: "34px 14px 10px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        background: "#DCFCE7",
        borderRadius: "50%",
        margin: "8px auto",
        color: "#15803D",
      }}
    >
      <Check size={26} strokeWidth={2.5} />
    </div>
    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, color: tokens.color.textPrimary, marginTop: 6 }}>
      Réservation confirmée
    </div>
    <div style={{ textAlign: "center", fontSize: 9, color: tokens.color.textMuted, marginTop: 2 }}>
      Réservation #4827
    </div>
    <div style={{ marginTop: 14, background: "#FAFAF7", borderRadius: 8, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#F5F2E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: tokens.font.mono,
            fontSize: 9,
            color: tokens.color.textMuted,
            fontWeight: 700,
          }}
        >
          JM
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: tokens.color.textPrimary }}>Jean-Pierre M.</div>
          <div style={{ fontSize: 8, color: tokens.color.textMuted }}>Plombier</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${tokens.color.border}`,
          fontSize: 9,
          color: tokens.color.textMuted,
          lineHeight: 1.5,
        }}
      >
        {[
          ["Date", "23 mai · 14h"],
          ["Service", "Plomberie"],
          ["Adresse", "Gombe"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{k}</span>
            <span style={{ color: tokens.color.textPrimary, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${tokens.color.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 8, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>TOTAL</span>
        <span style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 11, color: tokens.color.textPrimary }}>
          25 000 FC
        </span>
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <button
        style={{
          flex: 1,
          background: tokens.color.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: 7,
          fontSize: 9,
          fontWeight: 600,
        }}
      >
        Chatter
      </button>
      <button
        style={{
          flex: 1,
          background: tokens.color.surface,
          color: tokens.color.primary,
          border: "1px solid #BAE6FD",
          borderRadius: 8,
          padding: 7,
          fontSize: 9,
          fontWeight: 600,
        }}
      >
        Appeler
      </button>
    </div>
  </div>
);
```

- [ ] **Step 2: Export**

Add to `packages/ui/src/web/index.ts`:
```ts
export { AppPhoneMockup, type AppPhoneMockupProps, type AppPhoneMockupVariant } from "./AppPhoneMockup.js";
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @kayu/ui type-check`. Expected: no errors.

---

## Task 14: Add the trending fetch to `page.tsx`

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Replace the file with the updated version**

```tsx
import { createServerApiClient } from "@/lib/api";
import { statsApi, categoriesApi, providersApi } from "@kayu/api";
import HomePageClient from "./HomePageClient";
import { buildCategoryLookup, toProviderCardData } from "@/lib/provider-card";
import type { ProviderCardData } from "@kayu/ui";
import type { TrendingServicesResponse } from "@kayu/schemas";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const client = createServerApiClient();

  let stats = null;
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon: string | null;
    color: string | null;
    providersCount: number;
  }> = [];
  let featured: ProviderCardData[] = [];
  let trending: TrendingServicesResponse = { mode: "discovery", items: [] };

  try {
    const [statsRes, catRes, providersRes, trendingRes] = await Promise.all([
      statsApi(client).getGlobal(),
      categoriesApi(client).getHierarchy(),
      providersApi(client).search({ limit: 6 } as Record<string, string | number | boolean | undefined>),
      statsApi(client).getTrending().catch(() => ({ mode: "discovery" as const, items: [] })),
    ]);
    stats = statsRes;
    const rawCategories = Array.isArray(catRes) ? catRes : (catRes as { categories?: unknown[] })?.categories ?? [];
    categories = (rawCategories as Array<Record<string, unknown>>).map((cat) => ({
      id: (cat.id as string) ?? "",
      name: cat.name as string,
      slug: (cat.slug as string) ?? "",
      description: (cat.description as string) ?? undefined,
      icon: (cat.icon as string | null) ?? null,
      color: (cat.color as string | null) ?? null,
      providersCount: (cat.providersCount as number) ?? 0,
    }));
    const categoryLookup = buildCategoryLookup(categories);
    const rawProviders = (providersRes as { providers?: unknown[] })?.providers ?? [];
    featured = (rawProviders as Array<Record<string, unknown>>).map((p) =>
      toProviderCardData(p, categoryLookup),
    );
    trending = trendingRes;
  } catch {
    // SSR fallback: backend unavailable
  }

  return (
    <HomePageClient
      initialStats={stats}
      initialCategories={categories}
      featuredProviders={featured}
      trending={trending}
    />
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter web type-check`. Expected: errors are limited to `HomePageClient` not accepting `trending` yet — that's the next task.

---

## Task 15: Rewrite `HomePageClient.tsx`

**Files:**
- Modify: `apps/web/src/app/HomePageClient.tsx`

This is the biggest task — the new file orchestrates all the sections.

- [ ] **Step 1: Replace the file with the new composition**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, Star, Clock, ArrowRight } from "lucide-react";
import {
  CategoryTile,
  TrustStrip,
  TrendingServiceCard,
  ProviderHorizontalCard,
  HowItWorksStep,
  TestimonialCard,
  ProviderDashboardPreview,
  AppPhoneMockup,
} from "@kayu/ui/web";
import type { ProviderCardData } from "@kayu/ui";
import type { PublicStatsResponse, TrendingServicesResponse } from "@kayu/schemas";
import { Layout } from "@/components/layout";
import { HARDCODED_TESTIMONIALS } from "./home/HardcodedTestimonials";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string | null;
  color: string | null;
  providersCount: number;
}

interface HomePageClientProps {
  initialStats: PublicStatsResponse | null;
  initialCategories: Category[];
  featuredProviders: ProviderCardData[];
  trending: TrendingServicesResponse;
}

// ----------------- Hero (kept) -----------------
function Hero({ onSearch }: { onSearch: (query: string, where: string) => void }) {
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState("Kinshasa");
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 30%, rgba(14,165,233,0.09), transparent 50%), radial-gradient(circle at 82% 70%, rgba(251,113,133,0.06), transparent 48%)",
        }}
      />
      <div className="relative mx-auto max-w-[1240px] px-5 py-12 md:px-10 md:py-20">
        <div className="max-w-[820px]">
          <div
            className="k-overline mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 pr-3.5"
            style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
          >
            <span style={{ background: "var(--k-success)", color: "white", borderRadius: 9999, padding: "2px 8px", fontSize: 10 }}>NOUVEAU</span>
            Marketplace #1 de services au Congo
          </div>
          <h1 className="k-display-xl" style={{ margin: "0 0 18px" }}>
            Le bon pro,
            <br />
            <span
              style={{
                background: "linear-gradient(100deg, #0EA5E9 0%, #0EA5E9 40%, #FB7185 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              près de chez toi.
            </span>
          </h1>
          <p className="k-body-l" style={{ color: "var(--k-text-body)", maxWidth: 580, margin: "0 0 28px" }}>
            2 400 pros vérifiés à Kinshasa, Brazzaville, Lubumbashi, Matadi, Pointe-Noire. Plombiers, électriciens, coiffeurs, ménage… Réserve en quelques clics.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(query, where);
            }}
            className="k-card flex items-center p-2"
            style={{ borderRadius: "var(--k-r-lg)", boxShadow: "var(--k-e2)" }}
          >
            <label className="flex flex-1 items-center gap-3 px-5 py-3.5">
              <Search className="h-5 w-5" style={{ color: "var(--k-text-muted)" }} />
              <span className="flex-1">
                <span className="k-caption block" style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}>Quel service ?</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Plomberie, coiffure, ménage…" className="w-full bg-transparent text-[15px] outline-none" style={{ color: "var(--k-text-body)" }} />
              </span>
            </label>
            <div style={{ width: 1, height: 40, background: "var(--k-border)" }} />
            <label className="flex flex-1 items-center gap-3 px-5 py-3.5">
              <MapPin className="h-5 w-5" style={{ color: "var(--k-text-muted)" }} />
              <span className="flex-1">
                <span className="k-caption block" style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}>Où ?</span>
                <input value={where} onChange={(e) => setWhere(e.target.value)} className="w-full bg-transparent text-[15px] outline-none" style={{ color: "var(--k-text-body)" }} />
              </span>
            </label>
            <button type="submit" className="k-btn k-btn-primary" style={{ height: 56, padding: "0 28px", fontSize: 16 }}>
              <Search className="h-[18px] w-[18px]" />
              Rechercher
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ----------------- New sections -----------------

function CategoryGridSection({ categories, onSelect }: { categories: Category[]; onSelect: (slug: string) => void }) {
  const items = categories.slice(0, 12);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>EXPLORE</div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>Trouve ton service</h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir toutes les catégories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6">
        {items.map((c) => (
          <CategoryTile
            key={c.id}
            label={c.name}
            iconName={c.icon ?? undefined}
            color={c.color ?? undefined}
            count={c.providersCount}
            variant="centered-mono"
            onClick={() => onSelect(c.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function TrendingSection({ trending, onSelect }: { trending: TrendingServicesResponse; onSelect: (slug: string) => void }) {
  if (trending.items.length === 0) return null;
  const isTrending = trending.mode === "trending";
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: isTrending ? "var(--k-accent)" : "var(--k-text-muted)" }}>
            {isTrending ? "🔥 TENDANCE CETTE SEMAINE" : "✨ À DÉCOUVRIR"}
          </div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>
            {isTrending ? "Services populaires" : "Catégories à découvrir"}
          </h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir tout <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
        {trending.items.map((item) => (
          <TrendingServiceCard key={item.categoryId} item={item} onClick={onSelect} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProvidersSection({ providers, onOpen }: { providers: ProviderCardData[]; onOpen: (id: string) => void }) {
  const top = providers.slice(0, 4);
  if (top.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>⭐ TOP RATED</div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>Pros vérifiés à Kinshasa</h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir tous les pros <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {top.map((p) => (
          <ProviderHorizontalCard key={p.id} provider={p} onClick={onOpen} />
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: 1 as const, title: "Cherche un pro", desc: "Filtre par service, quartier et disponibilité. Compare les notes et les missions effectuées." },
    { number: 2 as const, title: "Discute directement", desc: "Appelle ou envoie un message pour confirmer le besoin, le prix et l'adresse." },
    { number: 3 as const, title: "Réserve et paie", desc: "Paiement en espèces à la fin de la mission. Tu notes le pro après." },
  ];
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10" id="how-it-works">
      <div className="text-center mb-8">
        <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>SIMPLE</div>
        <h2 className="k-display-m" style={{ margin: "4px 0 6px 0" }}>Comment ça marche</h2>
        <p className="k-body" style={{ color: "var(--k-text-body)" }}>Trouve, discute, réserve. En quelques clics.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <HowItWorksStep key={s.number} number={s.number} title={s.title} description={s.desc} />
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div className="text-center mb-8">
        <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>TÉMOIGNAGES</div>
        <h2 className="k-display-m" style={{ margin: "4px 0 6px 0" }}>Ils utilisent KAYOU</h2>
        <p className="k-body" style={{ color: "var(--k-text-body)" }}>Clients et pros parlent de leur expérience.</p>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {HARDCODED_TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.name} data={t} />
        ))}
      </div>
    </section>
  );
}

function ProviderCTASection({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div
        className="grid items-center gap-8 overflow-hidden md:grid-cols-[1fr_1.1fr] md:p-12"
        style={{ background: "#FFFBF5", border: "1px solid #F1ECDE", borderRadius: 20, padding: 40 }}
      >
        <div>
          <div className="k-overline" style={{ color: "var(--k-accent)" }}>POUR LES PROS</div>
          <h3 className="k-display-l" style={{ margin: "8px 0 14px 0", lineHeight: 1.15 }}>Tu es un pro ?<br />Rejoins KAYOU.</h3>
          <p className="k-body" style={{ color: "var(--k-text-body)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
            Crée ton profil, reçois des messages et réservations directes, construis ta réputation. Zéro frais d'inscription.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Profil vérifié et notations clients",
              "Messages et appels directs",
              "Tableau de bord des revenus",
            ].map((label) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--k-text-body)" }}>
                <BadgeCheck size={14} color="#15803D" strokeWidth={2.5} />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button className="k-btn k-btn-primary k-btn-lg" onClick={onJoin}>
              Devenir pro <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/#how-it-works" className="k-btn k-btn-ghost k-btn-lg">En savoir plus</Link>
          </div>
        </div>
        <div className="hidden md:block">
          <ProviderDashboardPreview />
        </div>
      </div>
    </section>
  );
}

function AppDownloadCTASection() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div
        className="grid items-center gap-8 overflow-hidden md:grid-cols-[1fr_1.1fr] md:p-12"
        style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 20, padding: 40 }}
      >
        <div>
          <div className="k-overline" style={{ color: "var(--k-primary)" }}>📱 MOBILE</div>
          <h3 className="k-display-l" style={{ margin: "8px 0 14px 0", lineHeight: 1.15 }}>L'app KAYOU,<br />dans ta poche.</h3>
          <p className="k-body" style={{ color: "var(--k-text-body)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
            Réserve un pro, chatte, suis tes missions, reçois des alertes. iOS et Android.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Notifications en temps réel",
              "Chat avec les pros",
              "Historique et factures",
            ].map((label) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--k-text-body)" }}>
                <BadgeCheck size={14} color="#15803D" strokeWidth={2.5} />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "App Store", note: "Télécharger sur" },
              { label: "Google Play", note: "Disponible sur" },
            ].map(({ label, note }) => (
              <a
                key={label}
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 18px",
                  textDecoration: "none",
                }}
              >
                <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{note}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="hidden md:flex" style={{ position: "relative", height: 440, justifyContent: "center", alignItems: "center" }}>
          <AppPhoneMockup variant="home" rotate={-6} style={{ position: "absolute", left: 0, top: 20 }} />
          <AppPhoneMockup variant="booking-confirmed" rotate={6} style={{ position: "absolute", right: 10, top: 0, zIndex: 2 }} />
        </div>
      </div>
    </section>
  );
}

// ----------------- Root -----------------
export default function HomePageClient({
  initialStats,
  initialCategories,
  featuredProviders,
  trending,
}: HomePageClientProps) {
  const router = useRouter();

  const goSearch = (query: string, where: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (where && where !== "Kinshasa") params.set("city", where);
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  };
  const openProvider = (id: string) => router.push(`/providers/${id}`);
  const openCategory = (slug: string) => router.push(`/services?category=${slug}`);

  const averageRating =
    initialStats?.averageRating != null
      ? Number.parseFloat(String(initialStats.averageRating))
      : null;

  return (
    <Layout>
      <Hero onSearch={goSearch} />
      <TrustStrip
        verifiedProviders={initialStats?.verifiedProviders ?? null}
        averageRating={Number.isFinite(averageRating) ? (averageRating as number) : null}
        cityCount={initialStats?.providersByCity?.length ?? null}
      />
      <CategoryGridSection categories={initialCategories} onSelect={openCategory} />
      <TrendingSection trending={trending} onSelect={openCategory} />
      <FeaturedProvidersSection providers={featuredProviders} onOpen={openProvider} />
      <HowItWorksSection />
      <TestimonialsSection />
      <ProviderCTASection onJoin={() => router.push("/auth?mode=signup")} />
      <AppDownloadCTASection />
    </Layout>
  );
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter web type-check`. Expected: no errors.

- [ ] **Step 3: Build the UI package**

Run: `pnpm --filter @kayu/ui build`. Expected: success. (The web app consumes the `dist/` output.)

---

## Task 16: Manual visual verification

**Files:** none (verification only)

- [ ] **Step 1: Boot backend + web together**

Open two shells:
- Shell A: `pnpm --filter backend dev`
- Shell B: `pnpm --filter web dev`

- [ ] **Step 2: Visit the homepage**

Open `http://localhost:3000` (adjust port if different).

Verify each section in order, top to bottom:
- Hero unchanged (gradient text, search bar).
- Trust strip: 4 metrics in a single bordered row. Values come from `/stats` or show `—` if backend is down.
- Categories grid: 12 tiles (or fewer if DB has fewer), monochrome icons, centered, plain "X pros" text, arrow ↗ appears on hover.
- Trending services: either a "🔥 TENDANCE CETTE SEMAINE" or "✨ À DÉCOUVRIR" header. 3 cards with photos. Cards are hidden entirely if 0 qualify. Réserver text-button uses category color.
- Top-rated providers: 2×2 grid of horizontal cards. If a provider has no avatar, the left column shows initials on beige. "Vérifié" badge appears next to the name when `verified` is true.
- How it works: 3 step cards, each containing its mini mockup.
- Testimonials: 3 quote cards with stars and initials avatars.
- Provider CTA: warm off-white background, no gradient, 3 stacked dashboard cards visible on md+.
- App download CTA: 2 phone mockups on md+. Buttons link to `#`.

- [ ] **Step 3: Verify the trending endpoint independently**

In a third shell:
```
curl -s http://localhost:3001/stats/trending-services | jq .
```
Expected: `{ "mode": "trending" | "discovery", "items": [...] }`. Run again — second response should come from cache (sub-millisecond). After 10 minutes, it refreshes.

- [ ] **Step 4: Type-check the whole repo**

Run from repo root: `pnpm -r type-check` (or whichever command runs all type-checks).
Expected: no errors.

---

## Self-Review checklist

After all tasks complete, before handing back to the user:

- [ ] Every spec section (1–9) maps to a task above. Hero (kept) requires no task; Trust strip = Task 7; Categories = Task 6; Trending = Tasks 1–5 + 8; Providers = Task 9; How it works = Task 10; Testimonials = Task 11; Provider CTA = Task 12; App CTA = Task 13. Page glue = Tasks 14–15. Verification = Task 16.
- [ ] No "TBD" / placeholder strings in the plan.
- [ ] `startingPrice` field name matches between schema (Task 1), service (Task 4), card props (Task 8). ✓
- [ ] `centered-mono` variant name matches between `CategoryTile` (Task 6) and `HomePageClient` consumer (Task 15). ✓
- [ ] `HARDCODED_TESTIMONIALS` import path matches between Task 11 (creates `apps/web/src/app/home/HardcodedTestimonials.ts`) and Task 15 (imports it). ✓
- [ ] No commit steps anywhere in the plan, per the user's `MEMORY.md` rule. ✓
- [ ] All UI components are exported from `packages/ui/src/web/index.ts` (Tasks 7, 8, 9, 10, 11, 12, 13). ✓
