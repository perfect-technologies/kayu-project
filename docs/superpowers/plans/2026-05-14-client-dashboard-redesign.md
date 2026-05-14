# Client Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/dashboard/client` as a state-led mission-control surface. Five hero variants (in_progress / upcoming_confirmed / upcoming_pending / calm / empty), a narrow "À faire" strip (reviews + unread messages), an upcoming list, a merged providers list, and a compact recent-activity feed. Mobile-first; flat surfaces; no gradients; no stats grid; no quick-actions tiles.

**Architecture:** Backend gains additive fields on `getClientDashboard` (no breaking changes to existing callers). The shared Zod schema is extended additively. The web page is rewritten as a thin orchestrator that delegates to 14 new components under `apps/web/src/components/dashboard/client/`. Hero variant selection lives in one pure helper (`pickHeroVariant`). Existing dashboard components (`DashboardStats`, `QuickActions`, `BookingCard`, `FavoriteList`) stay in place because the provider dashboard still imports them.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, inline styles + `globals.css` atoms (`k-btn-*`, `k-overline`, `k-display-*`, mono/display fonts already wired), `@kayu/ui` (`I` icon registry, `formatMoneyFc`, tokens), `@tanstack/react-query`, `@kayu/api`, `@kayu/schemas`. Backend: NestJS, Prisma, `node:test` with hand-rolled fakes.

**Project conventions:**
- **No per-task commits.** Implement every task end-to-end; one commit at the very end so the user reviews the full diff.
- Match the existing inline-style + `className` pattern used by the booking-details rebuild (`BookingHero.tsx`, `AccordCard.tsx`). No new stylesheets or CSS-in-JS libraries.
- Backend is CJS while `@kayu/schemas` is ESM. Service code doesn't import the Zod schemas at runtime — it just returns objects shaped to match. Types flow through to the web via `DashboardClientResponse = z.infer<...>`.
- Web app has no React test runner. Verification per task is `pnpm --filter @kayu/web typecheck` + manual visual check at `localhost:3000/dashboard/client`. Treat that as the "tests pass" gate.
- Backend tests: `node --test -r ts-node/register apps/backend/src/modules/dashboard/dashboard.service.client.spec.ts` from `apps/backend/`.
- Mobile-first: every component designed at 375 px first, then at ≥ 768 px.
- Spec to follow: `docs/superpowers/specs/2026-05-14-client-dashboard-redesign-design.md`.

---

## File Structure

### New files (web — all under `apps/web/src/components/dashboard/client/`)

| File | Responsibility |
|---|---|
| `dashboardHelpers.ts` | Pure helpers: `pickHeroVariant(data)`, `formatRelativeShort(date)`, `dayMonthAbbr(date)` (returns `{ day: "15", month: "MAI" }`), `interleaveTodos(reviews, messages)`. No JSX, no React. |
| `Greeting.tsx` | Salutation + summary meta line. Receives `firstName`, `variant`, `summary`. |
| `HeroStatusChip.tsx` | StatusChip atom with five variants (`live`, `confirmed`, `pending`, `neutral`, `welcome`). Used by all hero variants. |
| `DashboardHero.tsx` | State-aware hero. Receives the full `ClientDashboardData`, picks the variant via `pickHeroVariant`, dispatches to one of the five inline render branches. |
| `CalmProviderPills.tsx` | Horizontal pill list for the Calm variant. Receives `providers: ClientDashboardProviderRow[]`, links each pill to `/providers/{id}`. |
| `CategoryTilesRow.tsx` | 4-tile category grid for the Empty variant. Receives `categories`, links each tile to `/services?category={slug}`. |
| `TodoStrip.tsx` | "À FAIRE" card. Receives `todos: { reviews, unreadMessages }`, interleaves them (`interleaveTodos`), caps visible to 5, renders rows. Hidden if both arrays are empty. |
| `TodoRow.tsx` | One to-do row (`review` or `message`). |
| `UpcomingList.tsx` | "À VENIR" section. Receives `items: ClientDashboardUpcomingBooking[]` already excluding the hero booking. |
| `UpcomingRow.tsx` | One upcoming-booking row. |
| `ProvidersList.tsx` | "TES PRESTATAIRES" section. Owns the desktop/mobile layout swap (vertical rows vs horizontal scroll). |
| `ProviderRow.tsx` | Desktop row. |
| `ProviderCard.tsx` | Mobile horizontal-scroll card. |
| `ActivityList.tsx` | "ACTIVITÉ RÉCENTE" section. |
| `ActivityRow.tsx` | One completed-booking row with rating or "À NOTER ★". |
| `DashboardSkeleton.tsx` | Page-level skeleton that mirrors the loaded layout 1:1. |

### Modified files

| File | Change |
|---|---|
| `packages/schemas/src/dto.ts` | Extend `DashboardClientResponseSchema` additively with `upcoming`, `completed`, `providers`, `todos`, `hasAnyBookingEver` plus their sub-schemas. |
| `apps/backend/src/modules/dashboard/dashboard.service.ts` | Extend `getClientDashboard` to compute and return the new fields. Add new private mappers (`mapUpcomingBooking`, `mapCompletedBooking`, `mapProviderRow`, `mapReviewTodo`, `mapMessageTodo`). |
| `apps/web/src/app/dashboard/client/page.tsx` | Rewritten end-to-end. Becomes a thin orchestrator: hosts the single `useQuery`, renders `<DashboardSkeleton />` while loading, error state on failure, otherwise composes `Greeting → DashboardHero → TodoStrip → DashboardGrid (UpcomingList + ProvidersList) → ActivityList`. |

### New backend test file

| File | Responsibility |
|---|---|
| `apps/backend/src/modules/dashboard/dashboard.service.client.spec.ts` | All tests for the new client-dashboard fields. Hand-rolled Prisma fakes, `node:test` + `node:assert/strict`. |

### Unchanged

`packages/api/src/endpoints.ts` (the typed client picks up the new fields automatically through `z.infer<typeof DashboardClientResponseSchema>`), all provider/admin dashboard code, `BookingCard.tsx`, `BookingHero.tsx`, `lib/booking-v2.ts`, the existing `components/dashboard/*` files (still used by the provider dashboard).

---

## Task 1: Extend the shared DTO schema

Make the new response fields known to TypeScript (web + backend) before touching service code. All additions are optional in Zod so older deployments that haven't been updated yet won't reject the response — but the backend will always return them.

**Files:**
- Modify: `packages/schemas/src/dto.ts` (around line 712, `DashboardClientResponseSchema`)

- [ ] **Step 1.1: Add the new sub-schemas above `DashboardClientResponseSchema`**

Insert immediately above `export const DashboardClientResponseSchema = z.object({ ... });` (around line 712):

```ts
const ClientDashboardProviderShortSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  profession: z.string(),
  avatar: z.string().nullable(),
  rating: z.number().min(0).max(5),
  verified: z.boolean(),
});

export const ClientDashboardUpcomingBookingSchema = z.object({
  id: IdSchema,
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
  title: z.string(),
  scheduledDate: z.string(),
  durationMinutes: z.number().int().min(0).nullable(),
  price: z.number().min(0),
  hasOffer: z.boolean(),
  commune: z.string().nullable(),
  ref: z.string(),
  provider: ClientDashboardProviderShortSchema,
});

export const ClientDashboardCompletedBookingSchema = z.object({
  id: IdSchema,
  title: z.string(),
  completedAt: z.string(),
  price: z.number().min(0),
  provider: z.object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
  hasReview: z.boolean(),
  reviewScore: z.number().int().min(1).max(5).nullable(),
});

export const ClientDashboardProviderRowSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  profession: z.string(),
  avatar: z.string().nullable(),
  rating: z.number().min(0).max(5),
  verified: z.boolean(),
  isFavorite: z.boolean(),
  bookingCount: z.number().int().min(0),
});

export const ClientDashboardReviewTodoSchema = z.object({
  bookingId: IdSchema,
  title: z.string(),
  completedAt: z.string(),
  price: z.number().min(0),
  provider: z.object({ firstName: z.string() }),
});

export const ClientDashboardMessageTodoSchema = z.object({
  conversationId: IdSchema,
  unreadCount: z.number().int().min(1),
  lastMessageAt: z.string(),
  lastMessagePreview: z.string().nullable(),
  provider: z.object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
});
```

- [ ] **Step 1.2: Extend `DashboardClientResponseSchema` with the new fields**

Replace the existing object body with:

```ts
export const DashboardClientResponseSchema = z.object({
  // Legacy fields — kept for backward-compat with non-web callers
  stats: z.object({
    totalBookings: z.number().int().min(0),
    completedBookings: z.number().int().min(0),
    pendingBookings: z.number().int().min(0),
    favoritesCount: z.number().int().min(0),
    reviewsCount: z.number().int().min(0),
  }),
  recentBookings: z.array(DashboardBookingSchema),
  favoriteProviders: z.array(ProviderSchema).optional(),
  favorites: z.array(ProviderSchema.partial()).optional(),
  notifications: z.array(NotificationSchema),
  user: UserSchema.pick({ firstName: true, lastName: true }).optional(),

  // New fields consumed by the redesigned client dashboard
  upcoming: z.array(ClientDashboardUpcomingBookingSchema),
  completed: z.array(ClientDashboardCompletedBookingSchema),
  providers: z.array(ClientDashboardProviderRowSchema),
  todos: z.object({
    reviews: z.array(ClientDashboardReviewTodoSchema),
    unreadMessages: z.array(ClientDashboardMessageTodoSchema),
  }),
  hasAnyBookingEver: z.boolean(),
});
```

- [ ] **Step 1.3: Export the new types**

Find the `export type DashboardClientResponse = z.infer<typeof DashboardClientResponseSchema>;` line (around line 1141). Above it, add:

```ts
export type ClientDashboardUpcomingBooking = z.infer<typeof ClientDashboardUpcomingBookingSchema>;
export type ClientDashboardCompletedBooking = z.infer<typeof ClientDashboardCompletedBookingSchema>;
export type ClientDashboardProviderRow = z.infer<typeof ClientDashboardProviderRowSchema>;
export type ClientDashboardReviewTodo = z.infer<typeof ClientDashboardReviewTodoSchema>;
export type ClientDashboardMessageTodo = z.infer<typeof ClientDashboardMessageTodoSchema>;
```

- [ ] **Step 1.4: Build the schemas package**

Run:
```bash
pnpm --filter @kayu/schemas build
```
Expected: zero errors. The package emits to `packages/schemas/dist/`.

- [ ] **Step 1.5: Typecheck the api package consumes the new types**

Run:
```bash
pnpm --filter @kayu/api typecheck
```
Expected: zero errors (the api package just re-exports types from `@kayu/schemas`).

---

## Task 2: Backend tests for new `getClientDashboard` fields

Write all backend tests first (TDD). Each test uses a hand-rolled Prisma fake. We're following the established pattern from `apps/backend/src/modules/admin/admin.service.spec.ts` and `apps/backend/src/modules/dashboard/dashboard.service.ts` — the latter has no spec today (we're adding the first one).

**Files:**
- Create: `apps/backend/src/modules/dashboard/dashboard.service.client.spec.ts`

- [ ] **Step 2.1: Create the spec scaffold with a shared `makeClientActor` + `makePrisma` helper**

```ts
// apps/backend/src/modules/dashboard/dashboard.service.client.spec.ts
import assert from "node:assert/strict";
import test from "node:test";
import { DashboardService } from "./dashboard.service";

function makeClientActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "client_1",
    email: "client@example.com",
    firstName: "Alain",
    lastName: "Mukendi",
    role: "CLIENT",
    isActive: true,
    ...overrides,
  };
}

type PrismaCalls = Record<string, unknown[]>;

function makePrisma(stub: Record<string, Record<string, unknown>>) {
  const calls: PrismaCalls = {};
  const handler: ProxyHandler<object> = {
    get(_target, modelName: string) {
      const model = stub[modelName];
      if (!model) {
        throw new Error(`prisma.${modelName} not stubbed`);
      }
      return new Proxy(model, {
        get(_t, method: string) {
          return async (args: unknown) => {
            calls[`${modelName}.${method}`] = [
              ...(calls[`${modelName}.${method}`] ?? []),
              args,
            ];
            const fn = model[method];
            if (typeof fn !== "function") {
              throw new Error(`prisma.${modelName}.${method} not stubbed`);
            }
            return (fn as (a: unknown) => unknown)(args);
          };
        },
      });
    },
  };
  const prisma = new Proxy({}, handler);
  return { prisma, calls };
}
```

- [ ] **Step 2.2: Add the "brand new client" test**

```ts
test("getClientDashboard for a brand new client returns empty arrays and hasAnyBookingEver=false", async () => {
  const { prisma } = makePrisma({
    booking: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    favorite: {
      count: async () => 0,
      findMany: async () => [],
    },
    notification: {
      findMany: async () => [],
    },
    review: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    certification: {
      groupBy: async () => [],
    },
    conversation: {
      findMany: async () => [],
    },
    provider: {
      findMany: async () => [],
    },
  });

  const jobRequests = { getActiveCount: async () => 0 } as never;
  const service = new DashboardService(prisma as never, jobRequests);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.hasAnyBookingEver, false);
  assert.deepEqual(result.upcoming, []);
  assert.deepEqual(result.completed, []);
  assert.deepEqual(result.providers, []);
  assert.deepEqual(result.todos, { reviews: [], unreadMessages: [] });
});
```

- [ ] **Step 2.3: Add the "1 PENDING upcoming, no offer" test**

```ts
test("upcoming includes PENDING bookings with hasOffer=false when no FinalOffer is attached", async () => {
  const scheduled = new Date("2026-05-20T14:00:00.000Z");
  const { prisma } = makePrisma({
    booking: {
      count: async () => 1,
      findMany: async (args: { where?: { status?: { in?: string[] } } }) => {
        if (args?.where?.status?.in?.includes("PENDING")) {
          return [
            {
              id: "booking_pending_1",
              status: "PENDING",
              title: "Plomberie",
              scheduledDate: scheduled,
              durationMinutes: 120,
              price: 50000,
              ref: "KY-9C1B",
              commune: "Limete",
              finalOffer: null,
              provider: {
                id: "provider_1",
                profession: "Plombier",
                user: {
                  id: "user_1",
                  firstName: "Jean",
                  lastName: "Pinda",
                  avatar: null,
                  isVerified: true,
                },
              },
            },
          ];
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.hasAnyBookingEver, true);
  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].status, "PENDING");
  assert.equal(result.upcoming[0].hasOffer, false);
  assert.equal(result.upcoming[0].ref, "KY-9C1B");
});
```

- [ ] **Step 2.4: Add the "CONFIRMED upcoming with FinalOffer" test**

```ts
test("upcoming sets hasOffer=true when a FinalOffer row is attached", async () => {
  const scheduled = new Date("2026-05-15T14:00:00.000Z");
  const { prisma } = makePrisma({
    booking: {
      count: async () => 1,
      findMany: async (args: { where?: { status?: { in?: string[] } } }) => {
        if (args?.where?.status?.in?.includes("PENDING")) {
          return [
            {
              id: "booking_conf_1",
              status: "CONFIRMED",
              title: "Coiffure",
              scheduledDate: scheduled,
              durationMinutes: 120,
              price: 35000,
              ref: "KY-3F2A",
              commune: "Gombe",
              finalOffer: { id: "offer_1", acceptedAt: new Date(), price: 35000 },
              provider: {
                id: "provider_2",
                profession: "Coiffeuse",
                user: {
                  id: "user_2",
                  firstName: "Marie",
                  lastName: "Kalonga",
                  avatar: null,
                  isVerified: true,
                },
              },
            },
          ];
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].hasOffer, true);
});
```

- [ ] **Step 2.5: Add the "completed bookings with mixed review state" test**

```ts
test("completed bookings carry hasReview/reviewScore based on Review rows", async () => {
  const completed = [
    { id: "b_a", completedAt: new Date("2026-05-09T12:00:00Z"), title: "Ménage", price: 25000, provider: { id: "p_a", user: { firstName: "Sarah", lastName: "Mbuyi" } } },
    { id: "b_b", completedAt: new Date("2026-05-02T12:00:00Z"), title: "Coiffure", price: 35000, provider: { id: "p_b", user: { firstName: "Marie", lastName: "Kalonga" } } },
    { id: "b_c", completedAt: new Date("2026-04-28T12:00:00Z"), title: "Plomberie", price: 50000, provider: { id: "p_c", user: { firstName: "Jean", lastName: "Pinda" } } },
  ];
  const { prisma } = makePrisma({
    booking: {
      count: async () => 3,
      findMany: async (args: { where?: { status?: string | { in?: string[] } } }) => {
        if (args?.where?.status === "COMPLETED") {
          return completed.map((b) => ({ ...b, provider: { ...b.provider, profession: "X", user: { ...b.provider.user, id: "u_" + b.id, avatar: null, isVerified: true } } }));
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: {
      count: async () => 1,
      findMany: async () => [
        { bookingId: "b_b", overallScore: 5 },
      ],
      groupBy: async () => [],
    },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.completed.length, 3);
  const byId = Object.fromEntries(result.completed.map((b) => [b.id, b]));
  assert.equal(byId["b_a"].hasReview, false);
  assert.equal(byId["b_a"].reviewScore, null);
  assert.equal(byId["b_b"].hasReview, true);
  assert.equal(byId["b_b"].reviewScore, 5);
  assert.equal(byId["b_c"].hasReview, false);

  assert.equal(result.todos.reviews.length, 2);
  const todoIds = result.todos.reviews.map((r) => r.bookingId).sort();
  assert.deepEqual(todoIds, ["b_a", "b_c"]);
});
```

- [ ] **Step 2.6: Add the "merged providers list" test**

```ts
test("providers list shows favorites first then most-booked-not-favorited, capped at 4", async () => {
  const { prisma } = makePrisma({
    booking: {
      count: async () => 5,
      findMany: async () => [],
      groupBy: async () => [
        { providerId: "p_fav_1", _count: { providerId: 3 } },
        { providerId: "p_booked_only_1", _count: { providerId: 5 } },
        { providerId: "p_booked_only_2", _count: { providerId: 2 } },
        { providerId: "p_booked_only_3", _count: { providerId: 1 } },
      ],
    },
    favorite: {
      count: async () => 1,
      findMany: async () => [
        { providerId: "p_fav_1", createdAt: new Date("2026-05-01T10:00:00Z") },
      ],
    },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: {
      findMany: async () => [
        { id: "p_fav_1", profession: "Coiffeuse", user: { id: "u_fav_1", firstName: "Marie", lastName: "K", avatar: null, isVerified: true } },
        { id: "p_booked_only_1", profession: "Ménagère", user: { id: "u_bo1", firstName: "Sarah", lastName: "M", avatar: null, isVerified: true } },
        { id: "p_booked_only_2", profession: "Plombier", user: { id: "u_bo2", firstName: "Jean", lastName: "P", avatar: null, isVerified: true } },
        { id: "p_booked_only_3", profession: "Électricien", user: { id: "u_bo3", firstName: "Paul", lastName: "L", avatar: null, isVerified: true } },
      ],
    },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.providers.length, 4);
  assert.equal(result.providers[0].id, "p_fav_1");
  assert.equal(result.providers[0].isFavorite, true);
  assert.equal(result.providers[0].bookingCount, 3);
  assert.equal(result.providers[1].id, "p_booked_only_1");
  assert.equal(result.providers[1].isFavorite, false);
  assert.equal(result.providers[1].bookingCount, 5);
  assert.equal(result.providers[2].id, "p_booked_only_2");
  assert.equal(result.providers[3].id, "p_booked_only_3");
});
```

- [ ] **Step 2.7: Add the "unread message todos" test**

```ts
test("todos.unreadMessages includes conversations with inbound unread messages and skips outbound-last conversations", async () => {
  const { prisma } = makePrisma({
    booking: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    provider: { findMany: async () => [] },
    conversation: {
      findMany: async () => [
        {
          id: "conv_unread",
          user1Id: "client_1",
          user2Id: "provider_user_a",
          lastMessageAt: new Date("2026-05-13T10:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_a", firstName: "Marie", lastName: "Kalonga" },
          messages: [
            { id: "m1", senderId: "provider_user_a", content: "Bonjour, je confirme demain à 14h.", createdAt: new Date("2026-05-13T10:00:00Z") },
          ],
          _count: { messages: 3 },
        },
        {
          id: "conv_outbound_last",
          user1Id: "client_1",
          user2Id: "provider_user_b",
          lastMessageAt: new Date("2026-05-12T09:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_b", firstName: "Sarah", lastName: "Mbuyi" },
          messages: [
            { id: "m2", senderId: "client_1", content: "Merci!", createdAt: new Date("2026-05-12T09:00:00Z") },
          ],
          _count: { messages: 1 },
        },
        {
          id: "conv_no_unread",
          user1Id: "client_1",
          user2Id: "provider_user_c",
          lastMessageAt: new Date("2026-05-10T09:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_c", firstName: "Jean", lastName: "Pinda" },
          messages: [
            { id: "m3", senderId: "provider_user_c", content: "Lu!", createdAt: new Date("2026-05-10T09:00:00Z") },
          ],
          _count: { messages: 0 },
        },
      ],
    },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.todos.unreadMessages.length, 1);
  assert.equal(result.todos.unreadMessages[0].conversationId, "conv_unread");
  assert.equal(result.todos.unreadMessages[0].unreadCount, 3);
  assert.equal(result.todos.unreadMessages[0].provider.firstName, "Marie");
  assert.equal(result.todos.unreadMessages[0].lastMessagePreview, "Bonjour, je confirme demain à 14h.");
});
```

- [ ] **Step 2.8: Add the "non-client forbidden" test**

```ts
test("getClientDashboard throws ForbiddenException when actor is not a client", async () => {
  const { prisma } = makePrisma({});
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  await assert.rejects(
    () => service.getClientDashboard(makeClientActor({ role: "PROVIDER" }) as never),
    /Only clients/,
  );
});
```

- [ ] **Step 2.9: Run the new spec and verify it fails**

Run from `apps/backend/`:
```bash
node --test -r ts-node/register src/modules/dashboard/dashboard.service.client.spec.ts
```
Expected: **all 7 tests FAIL** because `getClientDashboard` doesn't yet return the new fields. This confirms TDD shape — Task 3 will make them pass.

---

## Task 3: Backend `getClientDashboard` returns new fields

Implement the changes so the tests from Task 2 pass.

**Files:**
- Modify: `apps/backend/src/modules/dashboard/dashboard.service.ts`

- [ ] **Step 3.1: Add Prisma include constants near the existing `clientBookingsInclude` (around line 83)**

Insert immediately after the existing `clientBookingsInclude`:

```ts
const clientUpcomingBookingInclude = {
  finalOffer: { select: { id: true, acceptedAt: true } },
  provider: {
    select: {
      id: true,
      profession: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

const clientCompletedBookingInclude = {
  provider: {
    select: {
      id: true,
      profession: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

const conversationForTodoInclude = {
  user1: { select: { id: true, firstName: true, lastName: true } },
  user2: { select: { id: true, firstName: true, lastName: true } },
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
    select: { id: true, senderId: true, content: true, createdAt: true },
  },
  _count: { select: { messages: { where: { isRead: false } } } },
} satisfies Prisma.ConversationInclude;
```

- [ ] **Step 3.2: Replace the body of `getClientDashboard` (currently lines 405-466)**

```ts
async getClientDashboard(actor: Actor) {
  if (actor.role !== "CLIENT") {
    throw new ForbiddenException("Only clients can access this dashboard");
  }

  const now = new Date();
  const completedTakeLimit = 5;
  const upcomingTakeLimit = 5;

  const [
    legacyStats,
    legacyRecentBookings,
    legacyFavorites,
    legacyNotifications,
    upcomingRaw,
    completedRaw,
    favoritesForProviders,
    bookedCountsRaw,
    candidateReviewsRaw,
    conversationsRaw,
    totalBookingCount,
  ] = await Promise.all([
    this.getClientDashboardStats(actor.id),
    this.prisma.booking.findMany({
      where: { clientId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: clientBookingsInclude,
    }),
    this.prisma.favorite.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: favoriteProviderInclude,
    }),
    this.prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    this.prisma.booking.findMany({
      where: {
        clientId: actor.id,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        scheduledDate: { gte: now },
      },
      orderBy: { scheduledDate: "asc" },
      take: upcomingTakeLimit,
      include: clientUpcomingBookingInclude,
    }),
    this.prisma.booking.findMany({
      where: { clientId: actor.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: completedTakeLimit,
      include: clientCompletedBookingInclude,
    }),
    this.prisma.favorite.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      select: { providerId: true, createdAt: true },
    }),
    this.prisma.booking.groupBy({
      by: ["providerId"],
      where: { clientId: actor.id, status: "COMPLETED" },
      _count: { providerId: true },
      orderBy: { _count: { providerId: "desc" } },
      take: 8,
    }),
    this.prisma.booking.findMany({
      where: { clientId: actor.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        completedAt: true,
        price: true,
        provider: { select: { user: { select: { firstName: true } } } },
      },
    }),
    this.prisma.conversation.findMany({
      where: { OR: [{ user1Id: actor.id }, { user2Id: actor.id }] },
      orderBy: { lastMessageAt: "desc" },
      take: 10,
      include: conversationForTodoInclude,
    }),
    this.prisma.booking.count({ where: { clientId: actor.id } }),
  ]);

  // Build providers list (merged: favorites + booked-not-favorited)
  const favoriteProviderIds = favoritesForProviders.map((f) => f.providerId);
  const favoriteIdSet = new Set(favoriteProviderIds);
  const bookedNotFavorited = bookedCountsRaw
    .filter((b) => !favoriteIdSet.has(b.providerId))
    .map((b) => ({ id: b.providerId, bookingCount: b._count.providerId }));
  const mergedProviderIds = [
    ...favoriteProviderIds,
    ...bookedNotFavorited.map((b) => b.id),
  ].slice(0, 4);

  const bookingCountByProviderId = new Map<string, number>(
    bookedCountsRaw.map((b) => [b.providerId, b._count.providerId]),
  );

  const providerRecords =
    mergedProviderIds.length > 0
      ? await this.prisma.provider.findMany({
          where: { id: { in: mergedProviderIds } },
          select: {
            id: true,
            profession: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isVerified: true,
              },
            },
          },
        })
      : [];
  const providerById = new Map(providerRecords.map((p) => [p.id, p]));
  const ratingsByProviderId = await this.getRatingByProviderIds(mergedProviderIds);

  const providers = mergedProviderIds
    .map((id) => {
      const p = providerById.get(id);
      if (!p) return null;
      return this.mapClientDashboardProviderRow(
        p,
        ratingsByProviderId.get(id) ?? 0,
        favoriteIdSet.has(id),
        bookingCountByProviderId.get(id) ?? 0,
      );
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  // Build completed + review todos
  const completedIds = completedRaw.map((b) => b.id);
  const reviewsForCompleted = completedIds.length
    ? await this.prisma.review.findMany({
        where: { bookingId: { in: completedIds }, clientId: actor.id },
        select: { bookingId: true, overallScore: true },
      })
    : [];
  const reviewByBookingId = new Map<string, { overallScore: number }>(
    reviewsForCompleted.map((r) => [r.bookingId, { overallScore: r.overallScore }]),
  );

  const completed = completedRaw.map((b) =>
    this.mapClientDashboardCompletedBooking(b, reviewByBookingId.get(b.id) ?? null),
  );

  // Review todos: completed bookings without a review (independent take=10 query so we surface older ones too)
  const candidateReviewIds = candidateReviewsRaw.map((b) => b.id);
  const reviewedCandidateIds = candidateReviewIds.length
    ? await this.prisma.review.findMany({
        where: { bookingId: { in: candidateReviewIds }, clientId: actor.id },
        select: { bookingId: true },
      })
    : [];
  const reviewedCandidateSet = new Set(reviewedCandidateIds.map((r) => r.bookingId));
  const reviewTodos = candidateReviewsRaw
    .filter((b) => !reviewedCandidateSet.has(b.id))
    .slice(0, 5)
    .map((b) => this.mapClientReviewTodo(b));

  // Unread message todos
  const unreadMessageTodos = conversationsRaw
    .filter((c) => c._count.messages > 0)
    .filter((c) => c.messages.length > 0 && c.messages[0].senderId !== actor.id)
    .slice(0, 5)
    .map((c) => this.mapClientMessageTodo(c, actor.id));

  // Upcoming
  const upcoming = upcomingRaw.map((b) => this.mapClientUpcomingBooking(b));

  return {
    success: true as const,
    stats: legacyStats,
    recentBookings: legacyRecentBookings.map((b) => this.mapClientDashboardBooking(b)),
    favoriteProviders: legacyFavorites.map((favorite) =>
      this.mapFavoriteProvider(
        favorite,
        ratingsByProviderId.get(favorite.providerId) ?? 0,
        favoriteIdSet.has(favorite.providerId),
      ),
    ),
    notifications: legacyNotifications.map((notification) => this.mapNotification(notification)),
    user: {
      firstName: actor.firstName,
      lastName: actor.lastName,
    },

    upcoming,
    completed,
    providers,
    todos: {
      reviews: reviewTodos,
      unreadMessages: unreadMessageTodos,
    },
    hasAnyBookingEver: totalBookingCount > 0,
  };
}
```

- [ ] **Step 3.3: Add the new private mapper methods at the bottom of the class (near other `private map*` methods, around line 990)**

```ts
private mapClientUpcomingBooking(
  booking: Prisma.BookingGetPayload<{ include: typeof clientUpcomingBookingInclude }>,
) {
  const user = booking.provider?.user;
  return {
    id: booking.id,
    status: booking.status as "PENDING" | "CONFIRMED" | "IN_PROGRESS",
    title: booking.title,
    scheduledDate: booking.scheduledDate.toISOString(),
    durationMinutes: booking.durationMinutes ?? null,
    price: booking.price ?? 0,
    hasOffer: booking.finalOffer !== null,
    commune: booking.commune ?? null,
    ref: booking.ref ?? booking.id.slice(-6).toUpperCase(),
    provider: {
      id: booking.provider?.id ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      profession: booking.provider?.profession ?? "",
      avatar: user?.avatar ?? null,
      rating: 0, // hydrated below if needed; per spec only displayed in hero, derived from provider record
      verified: user?.isVerified ?? false,
    },
  };
}

private mapClientDashboardCompletedBooking(
  booking: Prisma.BookingGetPayload<{ include: typeof clientCompletedBookingInclude }>,
  review: { overallScore: number } | null,
) {
  const user = booking.provider?.user;
  return {
    id: booking.id,
    title: booking.title,
    completedAt: (booking.completedAt ?? booking.updatedAt).toISOString(),
    price: booking.price ?? 0,
    provider: {
      id: booking.provider?.id ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
    hasReview: review !== null,
    reviewScore: review?.overallScore ?? null,
  };
}

private mapClientDashboardProviderRow(
  provider: { id: string; profession: string; user: { id: string; firstName: string; lastName: string; avatar: string | null; isVerified: boolean } },
  rating: number,
  isFavorite: boolean,
  bookingCount: number,
) {
  return {
    id: provider.id,
    firstName: provider.user.firstName,
    lastName: provider.user.lastName,
    profession: provider.profession,
    avatar: provider.user.avatar,
    rating,
    verified: provider.user.isVerified,
    isFavorite,
    bookingCount,
  };
}

private mapClientReviewTodo(booking: {
  id: string;
  title: string;
  completedAt: Date | null;
  price: number | null;
  provider: { user: { firstName: string } } | null;
}) {
  return {
    bookingId: booking.id,
    title: booking.title,
    completedAt: (booking.completedAt ?? new Date()).toISOString(),
    price: booking.price ?? 0,
    provider: { firstName: booking.provider?.user.firstName ?? "" },
  };
}

private mapClientMessageTodo(
  conversation: Prisma.ConversationGetPayload<{ include: typeof conversationForTodoInclude }>,
  actorId: string,
) {
  const other = conversation.user1.id === actorId ? conversation.user2 : conversation.user1;
  const lastMessage = conversation.messages[0] ?? null;
  return {
    conversationId: conversation.id,
    unreadCount: conversation._count.messages,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    lastMessagePreview: lastMessage ? lastMessage.content.slice(0, 80) : null,
    provider: {
      id: other.id,
      firstName: other.firstName,
      lastName: other.lastName,
    },
  };
}
```

- [ ] **Step 3.4: Re-run the spec; expect 7 PASS**

Run from `apps/backend/`:
```bash
node --test -r ts-node/register src/modules/dashboard/dashboard.service.client.spec.ts
```
Expected: **all 7 tests PASS**. If any fail, fix the mapper or query and re-run.

- [ ] **Step 3.5: Typecheck the backend**

Run from repo root:
```bash
pnpm --filter @kayu/backend typecheck
```
Expected: zero errors. Common issues:
- `booking.ref` or `booking.commune` not in Prisma schema → use a fallback (already shown in mapper).
- `Prisma.ConversationInclude`/`ConversationGetPayload` type issues → ensure `conversationForTodoInclude` uses `as const` on `orderBy` (already shown).
- `completedAt` is `Date | null` on `Booking` → handle as in the mapper.

If the `ref` or `commune` columns don't exist on the `Booking` schema (verify against `apps/backend/prisma/schema.prisma`), replace the mapper line with a derived shortcode: `ref: booking.id.slice(-6).toUpperCase()` and `commune: null`.

---

## Task 4: Web — pure helpers (`dashboardHelpers.ts`)

State-derivation logic in one pure module. No JSX, no React imports.

**Files:**
- Create: `apps/web/src/components/dashboard/client/dashboardHelpers.ts`

- [ ] **Step 4.1: Create the helpers file**

```ts
// apps/web/src/components/dashboard/client/dashboardHelpers.ts
import type {
  DashboardClientResponse,
  ClientDashboardUpcomingBooking,
  ClientDashboardCompletedBooking,
  ClientDashboardReviewTodo,
  ClientDashboardMessageTodo,
} from "@kayu/schemas";

export type HeroVariant =
  | "in_progress"
  | "upcoming_confirmed"
  | "upcoming_pending"
  | "calm"
  | "empty";

export function pickHeroVariant(data: DashboardClientResponse): HeroVariant {
  const inProgress = data.upcoming.find((b) => b.status === "IN_PROGRESS");
  if (inProgress) return "in_progress";

  const soonest = [...data.upcoming]
    .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

  if (soonest && soonest.status === "PENDING") return "upcoming_pending";
  if (soonest) return "upcoming_confirmed";

  if (data.hasAnyBookingEver) return "calm";
  return "empty";
}

export function pickHeroBooking(
  data: DashboardClientResponse,
  variant: HeroVariant,
): ClientDashboardUpcomingBooking | null {
  if (variant === "in_progress") {
    return data.upcoming.find((b) => b.status === "IN_PROGRESS") ?? null;
  }
  if (variant === "upcoming_confirmed" || variant === "upcoming_pending") {
    return (
      [...data.upcoming]
        .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0] ??
      null
    );
  }
  return null;
}

const MONTHS_FR_SHORT = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];

export function dayMonthAbbr(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: MONTHS_FR_SHORT[d.getMonth()],
  };
}

export function formatRelativeShort(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const day = 86_400_000;
  if (diffMs < day) return "aujourd'hui";
  if (diffMs < 2 * day) return "hier";
  const days = Math.floor(diffMs / day);
  if (days < 14) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function isTomorrow(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

const JOURS_LONGS = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

export function chipLabelForConfirmed(iso: string): string {
  if (isToday(iso)) return "CONFIRMÉE · AUJOURD'HUI";
  if (isTomorrow(iso)) return "CONFIRMÉE · DEMAIN";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays >= 0 && diffDays < 7) return `CONFIRMÉE · ${JOURS_LONGS[d.getDay()]}`;
  return "CONFIRMÉE";
}

export type TodoItem =
  | { kind: "review"; key: string; data: ClientDashboardReviewTodo }
  | { kind: "message"; key: string; data: ClientDashboardMessageTodo };

export function interleaveTodos(
  reviews: ClientDashboardReviewTodo[],
  unreadMessages: ClientDashboardMessageTodo[],
): TodoItem[] {
  // Messages first, then reviews. Already pre-sorted by the backend.
  const items: TodoItem[] = [
    ...unreadMessages.map<TodoItem>((m) => ({ kind: "message", key: `msg-${m.conversationId}`, data: m })),
    ...reviews.map<TodoItem>((r) => ({ kind: "review", key: `rev-${r.bookingId}`, data: r })),
  ];
  return items;
}

export function excludeHeroFromUpcoming(
  data: DashboardClientResponse,
  heroBookingId: string | null,
): ClientDashboardUpcomingBooking[] {
  if (!heroBookingId) return data.upcoming.slice(0, 3);
  return data.upcoming.filter((b) => b.id !== heroBookingId).slice(0, 3);
}

export function pickActivityRows(
  data: DashboardClientResponse,
): ClientDashboardCompletedBooking[] {
  return data.completed.slice(0, 3);
}

export function pickGreetingSummary(data: DashboardClientResponse, variant: HeroVariant): string {
  const upcomingCount = data.upcoming.length;
  const dateLong = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (variant === "empty") return "Bienvenue sur KAYOU";
  if (variant === "calm") {
    const last = data.completed[0];
    if (!last) return "Aucune réservation active";
    return `Aucune réservation active · dernière mission ${formatRelativeShort(last.completedAt)}`;
  }
  return `${dateLong} · ${upcomingCount} réservation${upcomingCount > 1 ? "s" : ""} à venir`;
}
```

- [ ] **Step 4.2: Typecheck the web package**

Run from repo root:
```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 5: Web — `HeroStatusChip` atom

The 5-variant chip used by every hero variant.

**Files:**
- Create: `apps/web/src/components/dashboard/client/HeroStatusChip.tsx`

- [ ] **Step 5.1: Create the component**

```tsx
// apps/web/src/components/dashboard/client/HeroStatusChip.tsx
import type { CSSProperties } from "react";

export type HeroStatusVariant = "live" | "confirmed" | "pending" | "neutral" | "welcome";

const STYLES: Record<HeroStatusVariant, { bg: string; fg: string; dot: string | null; pulse: boolean }> = {
  live:      { bg: "var(--k-success-subtle)", fg: "#047857", dot: "var(--k-success)", pulse: true  },
  confirmed: { bg: "var(--k-success-subtle)", fg: "#047857", dot: "var(--k-success)", pulse: true  },
  pending:   { bg: "var(--k-warning-subtle)", fg: "#92400E", dot: "var(--k-warning)", pulse: false },
  neutral:   { bg: "#F1F5F9",                 fg: "var(--k-text-body)", dot: null,    pulse: false },
  welcome:   { bg: "#FDE68A",                 fg: "#92400E",            dot: null,    pulse: false },
};

export function HeroStatusChip({
  variant,
  label,
}: {
  variant: HeroStatusVariant;
  label: string;
}) {
  const s = STYLES[variant];
  const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10.5,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
    background: s.bg,
    color: s.fg,
    letterSpacing: "0.02em",
  };
  const dotStyle: CSSProperties | null = s.dot
    ? {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: s.dot,
        animation: s.pulse ? "kPulse 1.5s ease-in-out infinite" : undefined,
      }
    : null;
  return (
    <span style={chipStyle}>
      {dotStyle && <span style={dotStyle} aria-hidden />}
      {label}
    </span>
  );
}
```

The `kPulse` keyframes are already defined in `globals.css` (used by `BookingHero.tsx` / `BookingStatusChip.tsx`). No new CSS needed.

- [ ] **Step 5.2: Typecheck**

Run:
```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 6: Web — `DashboardHero` (5 variants in one component)

**Files:**
- Create: `apps/web/src/components/dashboard/client/DashboardHero.tsx`
- Create: `apps/web/src/components/dashboard/client/CalmProviderPills.tsx`
- Create: `apps/web/src/components/dashboard/client/CategoryTilesRow.tsx`

The hero is large but each branch is small. Use a single component with internal sub-branches; the alternative (5 separate components) duplicates the shell.

- [ ] **Step 6.1: Create `CalmProviderPills.tsx`**

```tsx
// apps/web/src/components/dashboard/client/CalmProviderPills.tsx
import Link from "next/link";
import type { ClientDashboardProviderRow } from "@kayu/schemas";

const PALETTE = ["#F59E0B", "#6366F1", "#10B981", "#EC4899", "#0EA5E9"];
function colorFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(first: string, last: string): string {
  return `${(first[0] ?? "").toUpperCase()}${(last[0] ?? "").toUpperCase()}`;
}

export function CalmProviderPills({ providers }: { providers: ClientDashboardProviderRow[] }) {
  const items = providers.slice(0, 3);
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/providers/${p.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "#F8FAFC",
            borderRadius: 999,
            textDecoration: "none",
            color: "var(--k-text-primary)",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: colorFor(p.id),
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 10,
              fontFamily: "var(--k-font-display)",
            }}
          >
            {initials(p.firstName, p.lastName)}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>
            {p.firstName} {p.lastName.slice(0, 1)}. · {p.profession}
          </span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 6.2: Create `CategoryTilesRow.tsx` (stub with hardcoded categories — verified against the landing page approach)**

```tsx
// apps/web/src/components/dashboard/client/CategoryTilesRow.tsx
import Link from "next/link";
import { I } from "@kayu/ui/web";

// Starter set for the Empty hero. The landing page fetches dynamic categories;
// for this v1 we use a curated subset that matches the most-booked categories.
const STARTERS = [
  { slug: "coiffure", label: "Coiffure", icon: I.scissors },
  { slug: "menage", label: "Ménage", icon: I.sparkles },
  { slug: "plomberie", label: "Plomberie", icon: I.wrench },
  { slug: "electricite", label: "Électricité", icon: I.zap },
];

export function CategoryTilesRow() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginTop: 16,
      }}
      className="k-cd-cat-row"
    >
      {STARTERS.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.slug}
            href={`/services?category=${c.slug}`}
            style={{
              background: "#F8FAFC",
              border: "1px solid transparent",
              borderRadius: 10,
              padding: 10,
              textAlign: "center",
              textDecoration: "none",
              color: "var(--k-text-primary)",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                background: "#fff",
                border: "1px solid var(--k-border)",
                borderRadius: 999,
                margin: "0 auto 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Icon && <Icon size={14} />}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.label}</span>
          </Link>
        );
      })}
      <style jsx>{`
        @media (max-width: 480px) {
          .k-cd-cat-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
```

If any of `I.scissors`, `I.sparkles`, `I.zap` aren't in the registry (`packages/ui/src/web/I.ts`), substitute the closest available — `I.wrench` is already used in `BookingCard.tsx` so it's known to exist. Verify at implementation time by grepping `packages/ui/src/web/I.ts`.

- [ ] **Step 6.3: Create `DashboardHero.tsx`**

```tsx
// apps/web/src/components/dashboard/client/DashboardHero.tsx
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DashboardClientResponse, ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { I, formatMoneyFc } from "@kayu/ui/web";
import { HeroStatusChip, type HeroStatusVariant } from "./HeroStatusChip";
import { CalmProviderPills } from "./CalmProviderPills";
import { CategoryTilesRow } from "./CategoryTilesRow";
import {
  pickHeroVariant,
  pickHeroBooking,
  chipLabelForConfirmed,
  formatRelativeShort,
  type HeroVariant,
} from "./dashboardHelpers";

const HERO_SHELL: CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};

const HEADLINE: CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: "-0.02em",
  color: "var(--k-text-primary)",
  lineHeight: 1.15,
};

const SUB: CSSProperties = {
  fontSize: 13,
  color: "var(--k-text-body)",
  marginTop: 4,
  lineHeight: 1.45,
};

function durationLabel(min: number | null): string {
  if (min == null) return "Durée à confirmer";
  if (min <= 60) return "≈ 1 h";
  if (min <= 120) return "≈ 2 h";
  if (min <= 240) return "½ jour";
  return "Journée";
}

function whenLabel(b: ClientDashboardUpcomingBooking, variant: HeroVariant): string {
  const d = new Date(b.scheduledDate);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (variant === "in_progress") return `En ce moment · ${time}`;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(d, today)) return `Aujourd'hui · ${time}`;
  if (isSameDay(d, tomorrow))
    return `Demain · ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${time}`;
  return `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${time}`;
}

export function DashboardHero({ data }: { data: DashboardClientResponse }) {
  const variant = pickHeroVariant(data);
  const booking = pickHeroBooking(data, variant);

  if (variant === "empty") return <EmptyHero />;
  if (variant === "calm") return <CalmHero providers={data.providers} lastCompletedAt={data.completed[0]?.completedAt ?? null} />;
  if (!booking) return null;
  return <BookingHero variant={variant} booking={booking} />;
}

function BookingHero({ variant, booking }: { variant: HeroVariant; booking: ClientDashboardUpcomingBooking }) {
  const isPending = variant === "upcoming_pending";
  const isLive = variant === "in_progress";
  const chipVariant: HeroStatusVariant = isPending ? "pending" : isLive ? "live" : "confirmed";
  const chipLabel = isPending
    ? "EN ATTENTE"
    : isLive
    ? "EN COURS"
    : chipLabelForConfirmed(booking.scheduledDate);
  const showInfoStripConfirmed = variant === "upcoming_confirmed" && booking.hasOffer;
  const subParts = [booking.title, durationLabel(booking.durationMinutes), booking.commune].filter(Boolean);

  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant={chipVariant} label={chipLabel} />
        <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 10.5, color: "var(--k-text-subtle)" }}>
          #{booking.ref}
        </span>
      </div>
      <h2 style={HEADLINE}>{whenLabel(booking, variant)}</h2>
      <p style={SUB}>
        {subParts.join(" · ")} · {formatMoneyFc(booking.price)}
      </p>

      {isPending && (
        <div
          style={{
            marginTop: 12,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <I.clock size={14} aria-hidden />
          {booking.provider.firstName} n'a pas encore confirmé. Réponse habituelle en moins de 2 h.
        </div>
      )}
      {showInfoStripConfirmed && (
        <div
          style={{
            marginTop: 12,
            background: "#F8FAFC",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--k-text-body)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--k-text-subtle)" }} aria-hidden />
          Accord enregistré · espèces à la fin de la mission.
        </div>
      )}

      <WhoRow
        firstName={booking.provider.firstName}
        lastName={booking.provider.lastName}
        profession={booking.provider.profession}
        rating={booking.provider.rating}
        verified={booking.provider.verified}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Link
          href={`/messages?provider=${booking.provider.id}`}
          className="k-btn k-btn-secondary k-btn-sm"
          style={{ flex: 1, textAlign: "center" }}
        >
          Message
        </Link>
        <Link
          href={`/bookings/${booking.id}`}
          className="k-btn k-btn-primary k-btn-sm"
          style={{ flex: 1.4, textAlign: "center" }}
        >
          Voir la réservation →
        </Link>
      </div>
    </section>
  );
}

function WhoRow({
  firstName,
  lastName,
  profession,
  rating,
  verified,
}: {
  firstName: string;
  lastName: string;
  profession: string;
  rating: number;
  verified: boolean;
}) {
  const initials = `${(firstName[0] ?? "").toUpperCase()}${(lastName[0] ?? "").toUpperCase()}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid var(--k-border-subtle)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "#FDE68A",
          color: "#92400E",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "var(--k-font-display)",
        }}
      >
        {initials}
      </span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--k-text-primary)", display: "flex", alignItems: "center", gap: 4 }}>
          {firstName} {lastName.slice(0, 1)}.
          {verified && <I.badgeCheck size={14} color="var(--k-success)" />}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--k-text-muted)", marginTop: 1 }}>
          {profession ? `Ta/Ton ${profession.toLowerCase()}` : ""}
          {rating > 0 ? ` · ★ ${rating.toFixed(1)}` : ""}
        </div>
      </div>
    </div>
  );
}

function CalmHero({
  providers,
  lastCompletedAt,
}: {
  providers: DashboardClientResponse["providers"];
  lastCompletedAt: string | null;
}) {
  const ago = lastCompletedAt ? formatRelativeShort(lastCompletedAt) : "récemment";
  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant="neutral" label="AUCUNE RÉSERVATION ACTIVE" />
      </div>
      <h2 style={HEADLINE}>Rien de prévu pour l'instant.</h2>
      <p style={SUB}>
        Ta dernière mission s'est terminée {ago}. Réserve à nouveau ou retrouve un prestataire de confiance.
      </p>
      <CalmProviderPills providers={providers} />
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Link href="/" className="k-btn k-btn-primary k-btn-sm">
          Réserver un nouveau service →
        </Link>
      </div>
    </section>
  );
}

function EmptyHero() {
  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant="welcome" label="BIENVENUE" />
      </div>
      <h2 style={HEADLINE}>Réserve ton premier service.</h2>
      <p style={SUB}>
        Des prestataires vérifiés à Kinshasa et Brazzaville. Tu paies en espèces à la fin de la mission, pas avant.
      </p>
      <CategoryTilesRow />
      <div style={{ marginTop: 16 }}>
        <Link href="/" className="k-btn k-btn-primary k-btn-sm">
          Découvrir les prestataires →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 6.4: Typecheck**

Run:
```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors. If `I.clock` or `I.scissors`/`I.sparkles`/`I.zap` aren't in the registry, fall back to the closest available icon and adjust imports accordingly.

---

## Task 7: Web — `TodoStrip` + `TodoRow`

**Files:**
- Create: `apps/web/src/components/dashboard/client/TodoRow.tsx`
- Create: `apps/web/src/components/dashboard/client/TodoStrip.tsx`

- [ ] **Step 7.1: Create `TodoRow.tsx`**

```tsx
// apps/web/src/components/dashboard/client/TodoRow.tsx
import Link from "next/link";
import { I } from "@kayu/ui/web";
import { formatMoneyFc } from "@kayu/ui/web";
import { formatRelativeShort, type TodoItem } from "./dashboardHelpers";

export function TodoRow({ item, isFirst }: { item: TodoItem; isFirst: boolean }) {
  const isReview = item.kind === "review";
  const Icon = isReview ? I.star : I.messageCircle;
  const iconBg = isReview ? "#FEF3C7" : "#E0E7FF";
  const iconFg = isReview ? "#92400E" : "#4338CA";

  let title: string;
  let meta: string;
  let href: string;
  let cta: string;

  if (item.kind === "review") {
    title = `Note ton ${item.data.title.toLowerCase()} avec ${item.data.provider.firstName}`;
    meta = `Terminé ${formatRelativeShort(item.data.completedAt)} · ${formatMoneyFc(item.data.price)}`;
    href = `/bookings/${item.data.bookingId}`;
    cta = "Noter →";
  } else {
    const n = item.data.unreadCount;
    title =
      n > 1
        ? `${item.data.provider.firstName} t'a écrit · ${n} messages`
        : `${item.data.provider.firstName} t'a envoyé un message`;
    meta = item.data.lastMessagePreview
      ? `« ${item.data.lastMessagePreview} »`
      : `Conversation · ${formatRelativeShort(item.data.lastMessageAt)}`;
    href = `/messages?conversation=${item.data.conversationId}`;
    cta = "Répondre →";
  }

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: iconBg,
          color: iconFg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "#F1F5F9",
          padding: "6px 10px",
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        {cta}
      </span>
    </Link>
  );
}
```

- [ ] **Step 7.2: Create `TodoStrip.tsx`**

```tsx
// apps/web/src/components/dashboard/client/TodoStrip.tsx
import Link from "next/link";
import type { ClientDashboardReviewTodo, ClientDashboardMessageTodo } from "@kayu/schemas";
import { interleaveTodos } from "./dashboardHelpers";
import { TodoRow } from "./TodoRow";

export function TodoStrip({
  reviews,
  unreadMessages,
}: {
  reviews: ClientDashboardReviewTodo[];
  unreadMessages: ClientDashboardMessageTodo[];
}) {
  const all = interleaveTodos(reviews, unreadMessages);
  if (all.length === 0) return null;

  const visible = all.slice(0, all.length > 5 ? 4 : 5);
  const overflow = all.length > 5 ? all.length - 4 : 0;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 6px",
        }}
      >
        <span className="k-overline">À FAIRE</span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            background: "#F1F5F9",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {all.length} {all.length === 1 ? "tâche" : "tâches"}
        </span>
      </header>
      {visible.map((item, idx) => (
        <TodoRow key={item.key} item={item} isFirst={idx === 0} />
      ))}
      {overflow > 0 && (
        <Link
          href="/bookings"
          style={{
            display: "block",
            padding: "11px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            textDecoration: "none",
          }}
        >
          +{overflow} de plus →
        </Link>
      )}
    </section>
  );
}
```

- [ ] **Step 7.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 8: Web — `UpcomingList` + `UpcomingRow`

**Files:**
- Create: `apps/web/src/components/dashboard/client/UpcomingRow.tsx`
- Create: `apps/web/src/components/dashboard/client/UpcomingList.tsx`

- [ ] **Step 8.1: Create `UpcomingRow.tsx`**

```tsx
// apps/web/src/components/dashboard/client/UpcomingRow.tsx
import Link from "next/link";
import type { ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { formatMoneyFc } from "@kayu/ui/web";
import { dayMonthAbbr, isTomorrow } from "./dashboardHelpers";
import { HeroStatusChip } from "./HeroStatusChip";

export function UpcomingRow({
  booking,
  isFirst,
}: {
  booking: ClientDashboardUpcomingBooking;
  isFirst: boolean;
}) {
  const { day, month } = dayMonthAbbr(booking.scheduledDate);
  const tomorrow = isTomorrow(booking.scheduledDate);
  const time = new Date(booking.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const chipVariant = booking.status === "PENDING" ? "pending" : "confirmed";
  const chipLabel = booking.status === "PENDING" ? "EN ATTENTE" : "CONFIRMÉE";

  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, fontFamily: "var(--k-font-display)" }}>
          {tomorrow ? "DEM" : day}
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: "var(--k-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 3,
            fontFamily: "var(--k-font-mono)",
          }}
        >
          {tomorrow ? "DEMAIN" : month}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{booking.title}</div>
        <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>
          {time} · {booking.provider.firstName} · {booking.commune ?? ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--k-text-body)",
              background: "#F8FAFC",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            {formatMoneyFc(booking.price)}
          </span>
          {booking.hasOffer && (
            <span
              style={{
                fontSize: 10,
                color: "var(--k-text-muted)",
                background: "#F8FAFC",
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              Accord enregistré
            </span>
          )}
        </div>
      </div>
      <HeroStatusChip variant={chipVariant} label={chipLabel} />
    </Link>
  );
}
```

- [ ] **Step 8.2: Create `UpcomingList.tsx`**

```tsx
// apps/web/src/components/dashboard/client/UpcomingList.tsx
import Link from "next/link";
import type { ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { UpcomingRow } from "./UpcomingRow";

export function UpcomingList({ items }: { items: ClientDashboardUpcomingBooking[] }) {
  if (items.length === 0) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">
          À VENIR · {items.length} {items.length === 1 ? "RÉSERVATION" : "RÉSERVATIONS"}
        </span>
        <Link href="/bookings" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}>
          Tout voir →
        </Link>
      </header>
      {items.map((b, idx) => (
        <UpcomingRow key={b.id} booking={b} isFirst={idx === 0} />
      ))}
    </section>
  );
}
```

- [ ] **Step 8.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 9: Web — `ProvidersList` + rows / cards

**Files:**
- Create: `apps/web/src/components/dashboard/client/ProviderRow.tsx`
- Create: `apps/web/src/components/dashboard/client/ProviderCard.tsx`
- Create: `apps/web/src/components/dashboard/client/ProvidersList.tsx`

- [ ] **Step 9.1: Create `ProviderRow.tsx`** (desktop variant)

```tsx
// apps/web/src/components/dashboard/client/ProviderRow.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientDashboardProviderRow } from "@kayu/schemas";

const PALETTE = ["#F59E0B", "#6366F1", "#10B981", "#EC4899", "#0EA5E9"];
function colorFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function ProviderRow({ provider, isFirst }: { provider: ClientDashboardProviderRow; isFirst: boolean }) {
  const router = useRouter();
  const initials = `${(provider.firstName[0] ?? "").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;
  const meta =
    provider.bookingCount > 0
      ? `${provider.profession} · ${provider.isFavorite ? "★ " : ""}${provider.bookingCount} fois`
      : `${provider.profession}${provider.isFavorite ? " · ★ favori" : ""}`;
  return (
    <Link
      href={`/providers/${provider.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: colorFor(provider.id),
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "var(--k-font-display)",
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
          {provider.firstName} {provider.lastName.slice(0, 1)}.
        </div>
        <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 1 }}>{meta}</div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/services?provider=${provider.id}`);
        }}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        Réserver →
      </button>
    </Link>
  );
}
```

- [ ] **Step 9.2: Create `ProviderCard.tsx`** (mobile horizontal-scroll variant)

```tsx
// apps/web/src/components/dashboard/client/ProviderCard.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientDashboardProviderRow } from "@kayu/schemas";

const PALETTE = ["#F59E0B", "#6366F1", "#10B981", "#EC4899", "#0EA5E9"];
function colorFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function ProviderCard({ provider }: { provider: ClientDashboardProviderRow }) {
  const router = useRouter();
  const initials = `${(provider.firstName[0] ?? "").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;
  return (
    <Link
      href={`/providers/${provider.id}`}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 10,
        minWidth: 140,
        flexShrink: 0,
        scrollSnapAlign: "start",
        textDecoration: "none",
        color: "var(--k-text-primary)",
        display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: colorFor(provider.id),
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "var(--k-font-display)",
          }}
        >
          {initials}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {provider.firstName} {provider.lastName.slice(0, 1)}.
          </div>
          <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 1 }}>
            {provider.profession}
            {provider.rating > 0 ? ` · ★ ${provider.rating.toFixed(1)}` : ""}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/services?provider=${provider.id}`);
        }}
        style={{
          display: "block",
          width: "100%",
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "#F1F5F9",
          border: "none",
          borderRadius: 8,
          padding: "6px 8px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        Réserver →
      </button>
    </Link>
  );
}
```

- [ ] **Step 9.3: Create `ProvidersList.tsx`**

```tsx
// apps/web/src/components/dashboard/client/ProvidersList.tsx
import Link from "next/link";
import type { ClientDashboardProviderRow } from "@kayu/schemas";
import { ProviderRow } from "./ProviderRow";
import { ProviderCard } from "./ProviderCard";

export function ProvidersList({ items }: { items: ClientDashboardProviderRow[] }) {
  if (items.length === 0) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
      className="k-cd-providers"
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">TES PRESTATAIRES</span>
        <Link href="/dashboard/settings" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}>
          Tous →
        </Link>
      </header>

      {/* Desktop: vertical list */}
      <div className="k-cd-providers-desktop">
        {items.map((p, idx) => (
          <ProviderRow key={p.id} provider={p} isFirst={idx === 0} />
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div
        className="k-cd-providers-mobile"
        style={{
          display: "none",
          gap: 10,
          overflowX: "auto",
          margin: "0 -16px",
          padding: "4px 16px 2px",
          scrollSnapType: "x mandatory",
        }}
      >
        {items.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          :global(.k-cd-providers-desktop) {
            display: none;
          }
          :global(.k-cd-providers-mobile) {
            display: flex !important;
          }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 9.4: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 10: Web — `ActivityList` + `ActivityRow`

**Files:**
- Create: `apps/web/src/components/dashboard/client/ActivityRow.tsx`
- Create: `apps/web/src/components/dashboard/client/ActivityList.tsx`

- [ ] **Step 10.1: Create `ActivityRow.tsx`**

```tsx
// apps/web/src/components/dashboard/client/ActivityRow.tsx
import Link from "next/link";
import type { ClientDashboardCompletedBooking } from "@kayu/schemas";
import { formatMoneyFc, I } from "@kayu/ui/web";
import { dayMonthAbbr } from "./dashboardHelpers";

export function ActivityRow({
  booking,
  isFirst,
}: {
  booking: ClientDashboardCompletedBooking;
  isFirst: boolean;
}) {
  const { day, month } = dayMonthAbbr(booking.completedAt);
  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        gap: 12,
        alignItems: "center",
        padding: "9px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
        fontSize: 12,
      }}
    >
      <span style={{ fontWeight: 500 }}>
        {booking.title} · {booking.provider.firstName}
      </span>
      <span style={{ fontSize: 10.5, fontFamily: "var(--k-font-mono)", color: "var(--k-text-muted)" }}>
        {day} {month}
      </span>
      <span style={{ fontWeight: 600, fontSize: 11.5, fontFamily: "var(--k-font-display)" }}>
        {formatMoneyFc(booking.price)}
      </span>
      {booking.hasReview ? (
        <span style={{ fontSize: 10.5, color: "var(--k-text-muted)", display: "inline-flex", gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <I.star
              key={i}
              size={10}
              fill={i < (booking.reviewScore ?? 0) ? "currentColor" : "none"}
            />
          ))}
        </span>
      ) : (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "#92400E",
            background: "#FEF3C7",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          À NOTER ★
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 10.2: Create `ActivityList.tsx`**

```tsx
// apps/web/src/components/dashboard/client/ActivityList.tsx
import Link from "next/link";
import type { ClientDashboardCompletedBooking } from "@kayu/schemas";
import { ActivityRow } from "./ActivityRow";

export function ActivityList({ items }: { items: ClientDashboardCompletedBooking[] }) {
  if (items.length === 0) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
        marginTop: 14,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">ACTIVITÉ RÉCENTE</span>
        <Link href="/bookings" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}>
          Historique →
        </Link>
      </header>
      {items.map((b, idx) => (
        <ActivityRow key={b.id} booking={b} isFirst={idx === 0} />
      ))}
    </section>
  );
}
```

- [ ] **Step 10.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 11: Web — `Greeting` + `DashboardSkeleton`

**Files:**
- Create: `apps/web/src/components/dashboard/client/Greeting.tsx`
- Create: `apps/web/src/components/dashboard/client/DashboardSkeleton.tsx`

- [ ] **Step 11.1: Create `Greeting.tsx`**

```tsx
// apps/web/src/components/dashboard/client/Greeting.tsx
export function Greeting({
  firstName,
  summary,
  showLongSuffix,
}: {
  firstName: string;
  summary: string;
  showLongSuffix: boolean;
}) {
  return (
    <header style={{ marginBottom: 14 }}>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: "var(--k-text-primary)",
          margin: 0,
        }}
      >
        Bonjour {firstName}
        {showLongSuffix && (
          <span style={{ fontWeight: 400, color: "var(--k-text-body)" }}>
            {" — voici l'état de tes services"}
          </span>
        )}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--k-text-muted)", marginTop: 2, marginBottom: 0 }}>
        {summary}
      </p>
    </header>
  );
}
```

The `showLongSuffix` prop is set to `true` only when the viewport is ≥ 768 px. The page hosts this state via `useMediaQuery` (verify the codebase has a hook — `apps/web/src/lib/useMediaQuery.ts` or similar — and use it; if absent, inline a `useEffect` + `window.matchMedia` watcher).

- [ ] **Step 11.2: Create `DashboardSkeleton.tsx`**

```tsx
// apps/web/src/components/dashboard/client/DashboardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

const cardShell = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: 14,
  padding: 18,
};

export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div style={cardShell}>
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div style={cardShell}>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ ...cardShell, flex: "1.4 1 280px" }}>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div style={{ ...cardShell, flex: "1 1 240px" }}>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div style={cardShell}>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 11.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

---

## Task 12: Rewrite `dashboard/client/page.tsx`

Replace the current page end-to-end. Wire all the new components together.

**Files:**
- Modify (full rewrite): `apps/web/src/app/dashboard/client/page.tsx`

- [ ] **Step 12.1: Inspect the page's current imports + auth gate**

Read `apps/web/src/app/dashboard/client/page.tsx` again to confirm: it uses `useAuth`, `useRouter`, `useQuery({ queryKey: queryKeys.dashboard.client, queryFn: () => dashboardApi(apiClient).getClientDashboard(), enabled: !!user })`. The new page keeps that exact data-fetching contract — only the rendering changes.

- [ ] **Step 12.2: Replace the file contents**

```tsx
// apps/web/src/app/dashboard/client/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { dashboardApi, queryKeys } from "@kayu/api";
import { Greeting } from "@/components/dashboard/client/Greeting";
import { DashboardHero } from "@/components/dashboard/client/DashboardHero";
import { TodoStrip } from "@/components/dashboard/client/TodoStrip";
import { UpcomingList } from "@/components/dashboard/client/UpcomingList";
import { ProvidersList } from "@/components/dashboard/client/ProvidersList";
import { ActivityList } from "@/components/dashboard/client/ActivityList";
import { DashboardSkeleton } from "@/components/dashboard/client/DashboardSkeleton";
import {
  pickHeroVariant,
  pickHeroBooking,
  excludeHeroFromUpcoming,
  pickActivityRows,
  pickGreetingSummary,
} from "@/components/dashboard/client/dashboardHelpers";

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.client,
    queryFn: () => dashboardApi(apiClient).getClientDashboard(),
    enabled: !!user,
  });

  if (isLoading || !data) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 16px 32px" }}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 16px 32px" }}>
        <Greeting
          firstName={user?.firstName ?? ""}
          summary="Tableau de bord"
          showLongSuffix={isDesktop}
        />
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 14,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <I.alertCircle size={36} color="var(--k-text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Impossible de charger ton tableau de bord.
          </h2>
          <p style={{ fontSize: 13, color: "var(--k-text-muted)", margin: 0 }}>
            Vérifie ta connexion et réessaie.
          </p>
          <button className="k-btn k-btn-primary" onClick={() => refetch()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const firstName = data.user?.firstName ?? "";
  const variant = pickHeroVariant(data);
  const heroBooking = pickHeroBooking(data, variant);
  const upcomingForList = excludeHeroFromUpcoming(data, heroBooking?.id ?? null);
  const activityRows = pickActivityRows(data);
  const summary = pickGreetingSummary(data, variant);
  const isEmpty = variant === "empty";

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: isDesktop ? "20px 24px 40px" : "12px 16px 32px",
      }}
    >
      <Greeting firstName={firstName} summary={summary} showLongSuffix={isDesktop} />
      <DashboardHero data={data} />

      {!isEmpty && (
        <TodoStrip
          reviews={data.todos.reviews}
          unreadMessages={data.todos.unreadMessages}
        />
      )}

      {!isEmpty && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1.4fr 1fr" : "1fr",
            gap: 14,
          }}
        >
          <UpcomingList items={upcomingForList} />
          <ProvidersList items={data.providers} />
        </div>
      )}

      {!isEmpty && <ActivityList items={activityRows} />}
    </div>
  );
}
```

- [ ] **Step 12.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```
Expected: zero errors.

- [ ] **Step 12.4: Run the dev server and visually verify each state**

From the repo root:
```bash
pnpm dev
```
Then visit `http://localhost:3000/dashboard/client` as different test accounts:
- A brand-new client (no bookings) → Empty hero with welcome chip + 4 category tiles + discover CTA. No other sections.
- A client with 1 PENDING upcoming → amber chip + "n'a pas encore confirmé" info strip.
- A client with 1 IN_PROGRESS booking → green pulse chip "EN COURS · {time}".
- A client with 3 upcoming bookings, soonest is CONFIRMED tomorrow with offer → "CONFIRMÉE · DEMAIN" chip + "Accord enregistré" strip. À venir lists the other 2.
- A client with 0 upcoming, 5 completed → calm hero + 3 provider pills + primary CTA to `/`. ActivityList shows 3 most recent.
- A client with 2 unreviewed bookings → TodoStrip renders 2 review rows. ActivityList shows them with "À NOTER ★".
- A client with 1 unread conversation → TodoStrip renders 1 message row above the reviews.

For each state, also resize the browser to ~ 375 px width and confirm:
- Hero collapses to single column, headline at 22 px.
- ProvidersList swaps to horizontal-scroll cards.
- DashboardGrid stacks vertically.
- No horizontal overflow anywhere.

If any state fails, fix and re-typecheck.

---

## Task 13: Final commit

- [ ] **Step 13.1: Confirm working tree**

```bash
git status
```
Expected: modifications to `packages/schemas/src/dto.ts`, `apps/backend/src/modules/dashboard/dashboard.service.ts`, `apps/web/src/app/dashboard/client/page.tsx`, plus 16 new files under `apps/web/src/components/dashboard/client/` and 1 new file under `apps/backend/src/modules/dashboard/`.

- [ ] **Step 13.2: Run full backend test for the new file once more**

```bash
cd apps/backend
node --test -r ts-node/register src/modules/dashboard/dashboard.service.client.spec.ts
cd -
```
Expected: 7/7 PASS.

- [ ] **Step 13.3: Final typechecks**

```bash
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api typecheck
pnpm --filter @kayu/backend typecheck
pnpm --filter @kayu/web typecheck
```
Expected: zero errors across all four.

- [ ] **Step 13.4: Stage and commit**

```bash
git add packages/schemas/src/dto.ts \
        apps/backend/src/modules/dashboard/dashboard.service.ts \
        apps/backend/src/modules/dashboard/dashboard.service.client.spec.ts \
        apps/web/src/app/dashboard/client/page.tsx \
        apps/web/src/components/dashboard/client/
git status
git commit -m "$(cat <<'EOF'
Rebuild client dashboard around state-led hero and focused sections

Five hero variants (in_progress, upcoming_confirmed, upcoming_pending,
calm, empty) replace the stats grid + quick-actions tiles. À faire
strip surfaces only genuine to-dos (reviews + unread messages).
À venir, Tes prestataires, and Activité récente sit below. Backend
adds additive fields to getClientDashboard; legacy fields kept for
backward-compat.
EOF
)"
```

- [ ] **Step 13.5: Confirm clean status after commit**

```bash
git status
```
Expected: working tree clean.

---

## Self-Review

**Spec coverage (each section → which task implements it):**
- §1 Page composition → Task 12 (page.tsx wires everything)
- §2 Greeting → Task 11
- §3 DashboardHero (all 5 variants + StatusChip + selection rules) → Tasks 4, 5, 6
- §3.7 CategoryTilesRow → Task 6
- §3.6 CalmProviderPills → Task 6
- §4 TodoStrip + reviews + unread messages + interleave + cap → Tasks 4, 7
- §5.1 UpcomingList → Task 8
- §5.2 ProvidersList (desktop list + mobile horizontal scroll) → Task 9
- §6 ActivityList with rating / "À NOTER" → Task 10
- §7 Backend new fields + DTOs + mappers + tests → Tasks 1, 2, 3
- §8 Loading / error / auth guard → Tasks 11 (Skeleton), 12 (error block + skeleton wire-up)
- §9 Mobile vs desktop matrix → covered by inline media queries in Tasks 6, 9, 11, 12
- §10 Tokens, atoms, file map → all new files placed under `apps/web/src/components/dashboard/client/`
- §11 State × component matrix → Task 12 (the `isEmpty` gating block matches the matrix)
- §12 Edge cases → handled by null-safe mappers in Task 3 and conditional renders in Tasks 7-10
- §13 Acceptance criteria → Step 12.4 (manual verification at each state)
- §14 Out-of-scope follow-ups → explicitly not implemented

**Placeholder scan:** None. Every step contains complete code or commands.

**Type consistency:**
- `ClientDashboardUpcomingBooking`, `ClientDashboardCompletedBooking`, `ClientDashboardProviderRow`, `ClientDashboardReviewTodo`, `ClientDashboardMessageTodo` — same names defined in Task 1.3 are consumed in Tasks 4-11.
- `HeroVariant` defined in Task 4, consumed in Tasks 6, 12.
- `pickHeroVariant`, `pickHeroBooking`, `excludeHeroFromUpcoming`, `pickActivityRows`, `pickGreetingSummary`, `chipLabelForConfirmed`, `interleaveTodos`, `dayMonthAbbr`, `formatRelativeShort`, `isToday`, `isTomorrow` — defined in Task 4, all referenced names consumed elsewhere match.
- `HeroStatusVariant` exported by Task 5, consumed by Task 6.
- `TodoItem` defined in Task 4, consumed in Task 7.

Plan complete and saved to `docs/superpowers/plans/2026-05-14-client-dashboard-redesign.md`.
