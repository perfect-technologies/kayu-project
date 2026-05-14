# Provider Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/pro` as a state-led mission-control surface. Eight hero variants (onboarding / pending_request / in_progress / next_today / next_upcoming / unavailable / calm / empty), an "À FAIRE" strip with four row types ranked by urgency, an `Aujourd'hui + À venir` grid, a read-only `Avis récents` list, and a compact 4-cell `Pouls de la semaine` strip. Availability folds into a chip in the greeting. Job-match feature removed from the dashboard. Mobile-first; flat surfaces; no gradients; no big stats grid.

**Architecture:** Backend gains additive fields on `getProviderDashboard` (no breaking changes; legacy fields kept for other callers). The shared Zod schema is extended additively. The web page is rewritten as a thin orchestrator that delegates to ~14 new components under `apps/web/src/components/dashboard/provider/`. Hero variant selection lives in one pure helper (`pickHeroVariant`). The existing `HeroStatusChip` atom from the client dashboard is reused via re-export.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, inline styles + `globals.css` atoms (`k-btn-*`, `k-overline`, `k-display-*`, mono/display fonts already wired), `@kayu/ui` (`I` icon registry, `formatMoneyFc`, `TrustChip`, tokens), `@tanstack/react-query`, `@kayu/api`, `@kayu/schemas`. Backend: NestJS, Prisma, `node:test` with hand-rolled fakes.

**Project conventions:**
- **No per-task commits.** Implement every task end-to-end; one commit at the very end so the user reviews the full diff.
- Match the existing inline-style + `className` pattern used by the client dashboard rebuild (`DashboardHero.tsx`, `TodoStrip.tsx`). No new stylesheets or CSS-in-JS libraries.
- Backend is CJS while `@kayu/schemas` is ESM. Service code doesn't import the Zod schemas at runtime — it just returns objects shaped to match. Types flow through to the web via `DashboardProviderResponse = z.infer<...>`.
- Web app has no React test runner. Verification per task is `pnpm --filter @kayu/web typecheck` + manual visual check at `localhost:3000/pro`. Treat that as the "tests pass" gate.
- Backend tests: `node --test -r ts-node/register apps/backend/src/modules/dashboard/dashboard.service.provider.spec.ts` from `apps/backend/`.
- Mobile-first: every component designed at 375 px first, then at ≥ 768 px.
- CSS class prefix `k-pd-*` (provider-dashboard) to stay clear of `k-cd-*` (client), `k-bd-*` (booking details), `k-bk-*` (booking flow).
- Spec to follow: `docs/superpowers/specs/2026-05-14-provider-dashboard-redesign-design.md`.

---

## File Structure

### New files (web — all under `apps/web/src/components/dashboard/provider/`)

| File | Responsibility |
|---|---|
| `providerDashboardHelpers.ts` | Pure helpers: `pickHeroVariant(data)`, `formatShortMoney(fc)`, `formatRelativeShort(date)`, `dayMonthAbbr(date)`, `deriveProfileGaps(completionItems)`, `endOfTodayUTC(now)`. No JSX, no React. |
| `Greeting.tsx` | Salutation + meta line + `<AvailabilityChip />`. |
| `AvailabilityChip.tsx` | Tappable chip that opens a `<AvailabilitySheet />` on mobile / popover on desktop. Owns the `providersApi.updateAvailability` mutation. |
| `AvailabilitySheet.tsx` | Bottom-sheet / popover content: switch row + zone summary + "Modifier →" link. |
| `HeroStatusChip.tsx` | Re-export of `apps/web/src/components/dashboard/client/HeroStatusChip.tsx` so both dashboards share one chip atom. (The atom already supports `live`, `confirmed`, `pending`, `neutral`, `welcome` variants — exactly what the provider hero needs.) |
| `DashboardHero.tsx` | State-aware hero. Receives the full `ProviderDashboardData`, picks the variant via `pickHeroVariant`, dispatches to one of eight inline render branches. Owns the accept/refuse mutations and the in-component `RefuseReasonSheet` open state. |
| `RefuseReasonSheet.tsx` | Bottom-sheet / popover with three radio reasons + textarea for "Autre raison…". Fires `bookingsApi.update` with `status: "CANCELLED"` + `cancelReason`. |
| `TodoStrip.tsx` | "À FAIRE" card. Receives the merged + sorted to-do list, caps visible to 5, renders rows. Hidden when empty. |
| `TodoRow.tsx` | One to-do row. Dispatches per `kind` (`extra_pending` / `close_overdue` / `unread_message` / `profile_gap`). |
| `TodayList.tsx` | "AUJOURD'HUI" section. Receives `items: ProviderTodayJob[]` (with the hero booking excluded). |
| `TodayRow.tsx` | One row in `TodayList`. |
| `UpcomingList.tsx` | "À VENIR" section. Receives `items: ProviderUpcomingBooking[]` (CONFIRMED, beyond today, hero excluded, capped at 3). |
| `UpcomingRow.tsx` | One row in `UpcomingList`. |
| `ReviewsList.tsx` | "AVIS RÉCENTS" section. Receives `items: ProviderRecentReview[]` (last 3). |
| `ReviewRow.tsx` | One row in `ReviewsList`. Read-only. |
| `PulseStrip.tsx` | 4-cell "POULS DE LA SEMAINE" card. Whole card links to `/pro/earnings`. |
| `DashboardSkeleton.tsx` | Page-level skeleton mirroring the loaded layout 1:1. |

### Modified files

| File | Change |
|---|---|
| `packages/schemas/src/dto.ts` | Extend `DashboardProviderResponseSchema` additively with `todos` (`unreadMessages` + `bookingsToClose`) and `hasAnyBookingEver`. Add the new sub-schemas. |
| `apps/backend/src/modules/dashboard/dashboard.service.ts` | Extend `getProviderDashboard` to compute and return `todos.unreadMessages`, `todos.bookingsToClose`, `hasAnyBookingEver`. |
| `apps/web/src/app/pro/ProviderDashboardClient.tsx` | Rewritten end-to-end. Becomes a thin orchestrator: hosts the single `useQuery`, renders `<DashboardSkeleton />` while loading, error state on failure, otherwise composes `Greeting → DashboardHero → TodoStrip → DashboardGrid (TodayList + UpcomingList) → ReviewsList → PulseStrip`. |

### New backend test file

| File | Responsibility |
|---|---|
| `apps/backend/src/modules/dashboard/dashboard.service.provider.spec.ts` | Tests for the new provider-dashboard fields. Hand-rolled Prisma fakes, `node:test` + `node:assert/strict`. |

### Unchanged

`packages/api/src/endpoints.ts` (the typed client picks up new fields automatically through `z.infer<typeof DashboardProviderResponseSchema>`), all client/admin dashboard code, the existing `Avatar`, `StarRating`, `StatCard`, `TrustChip` atoms (`StatCard` is no longer imported on the dashboard but other surfaces still use it), the existing `JobCard` / `RequestCard` files (still used on `/pro/requests`), `BookingHero.tsx`, `lib/booking-v2.ts`. The `apps/web/src/app/dashboard/provider/page.tsx` legacy redirect to `/pro` stays.

---

## Task 1: Extend the shared DTO schema

Make the new response fields known to TypeScript (web + backend) before touching service code. All additions are optional in Zod so older deployments don't reject the response.

**Files:**
- Modify: `packages/schemas/src/dto.ts` (around line 686, `DashboardProviderResponseSchema`)

- [ ] **Step 1.1: Add the new sub-schemas above `DashboardProviderResponseSchema`**

Insert immediately above `export const DashboardProviderResponseSchema = z.object({ ... });` (around line 668):

```ts
export const ProviderDashboardMessageTodoSchema = z.object({
  conversationId: IdSchema,
  unreadCount: z.number().int().min(0),
  lastMessageAt: z.string(),
  lastMessagePreview: z.string().nullable(),
  client: z.object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
});

export const ProviderDashboardCloseTodoSchema = z.object({
  bookingId: IdSchema,
  title: z.string(),
  scheduledDate: z.string(),
  price: z.number(),
  client: z.object({
    firstName: z.string(),
  }),
});

export const ProviderDashboardTodosSchema = z.object({
  unreadMessages: z.array(ProviderDashboardMessageTodoSchema).default([]),
  bookingsToClose: z.array(ProviderDashboardCloseTodoSchema).default([]),
});
```

- [ ] **Step 1.2: Extend `DashboardProviderResponseSchema` with `todos` and `hasAnyBookingEver`**

Find the existing `DashboardProviderResponseSchema = z.object({ ... });` block. Add the two new fields just below the existing `notifications` field. Final shape (only the new bits shown, do not remove existing fields):

```ts
export const DashboardProviderResponseSchema = z.object({
  // ... existing fields kept verbatim (provider, onboarding, availability, today, newRequests, bookingRequests, stats, notifications) ...

  todos: ProviderDashboardTodosSchema.default({ unreadMessages: [], bookingsToClose: [] }),
  hasAnyBookingEver: z.boolean().default(false),

  // ... existing legacy fields kept (user, recentBookings, upcomingBookings, recentReviews, viewsData) ...
});
```

- [ ] **Step 1.3: Typecheck the schemas package**

Run from repo root: `pnpm --filter @kayu/schemas typecheck`
Expected: PASS. No errors.

- [ ] **Step 1.4: Typecheck the API client (picks up the new types via inference)**

Run: `pnpm --filter @kayu/api typecheck`
Expected: PASS.

---

## Task 2: Backend tests for new `getProviderDashboard` fields

TDD: write the failing tests first, then implement the service changes in Task 3. The existing `dashboard.service.spec.ts` already covers the legacy provider response shape — we add a sibling spec file focused on the new fields.

**Files:**
- Create: `apps/backend/src/modules/dashboard/dashboard.service.provider.spec.ts`

- [ ] **Step 2.1: Create the test file with imports and fake harness**

```ts
import { strict as assert } from "node:assert";
import { describe, it, beforeEach } from "node:test";

import { DashboardService } from "./dashboard.service";
import type { PrismaService } from "../../database/prisma.service";
import type { JobRequestsService } from "../job-requests/job-requests.service";
import type { Actor } from "../../common/auth/types";

type ProviderRow = {
  id: string;
  userId: string;
  profession: string;
  description: string | null;
  experience: number | null;
  hourlyRate: number | null;
  totalReviews: number;
  totalJobs: number;
  rating: number;
  responseTime: number | null;
  isPremium: boolean;
  premiumExpiry: Date | null;
  isAvailable: boolean;
  verificationStatus: string;
  user: { id: string; firstName: string; lastName: string; avatar: string | null; city: string | null; country: string | null; latitude: number | null; longitude: number | null; email: string; phone: string; isVerified: boolean; onboardingStep: number | null };
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  skills: Array<{ id: string; name: string }>;
  serviceZones: Array<{ id: string; city: string }>;
  portfolio: Array<{ id: string; url: string }>;
  trustScore: { badges: Array<{ id: string; name: string; isVisible: boolean }> } | null;
};

type BookingRow = {
  id: string;
  providerId: string;
  clientId: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  scheduledDate: Date;
  duration: number | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; firstName: string; lastName: string; avatar: string | null };
};

type ReviewRow = {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  overallScore: number;
  punctuality: number;
  quality: number;
  communication: number;
  value: number;
  professionalism: number;
  comment: string | null;
  reply: string | null;
  repliedAt: Date | null;
  isPublic: boolean;
  isEdited: boolean;
  satisfactionTags: unknown;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; firstName: string; lastName: string; avatar: string | null };
  booking: { title: string };
};

type ConversationRow = {
  id: string;
  lastMessageAt: Date | null;
  participants: Array<{ userId: string; user: { id: string; firstName: string; lastName: string } }>;
  messages: Array<{ id: string; content: string; senderId: string; createdAt: Date; readAt: Date | null }>;
  _count: { messages: number };
};

function buildPrismaFake(seed: {
  provider: ProviderRow;
  bookings?: BookingRow[];
  reviews?: ReviewRow[];
  conversations?: ConversationRow[];
}) {
  const bookings = seed.bookings ?? [];
  const reviews = seed.reviews ?? [];
  const conversations = seed.conversations ?? [];

  return {
    provider: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === seed.provider.userId ? seed.provider : null,
    },
    booking: {
      findMany: async ({ where, orderBy, take }: any) => {
        let rows = bookings.filter((b) => {
          if (where.providerId && b.providerId !== where.providerId) return false;
          if (where.status?.in && !where.status.in.includes(b.status)) return false;
          if (where.status && typeof where.status === "string" && b.status !== where.status) return false;
          if (where.scheduledDate?.gte && b.scheduledDate < where.scheduledDate.gte) return false;
          if (where.scheduledDate?.lt && b.scheduledDate >= where.scheduledDate.lt) return false;
          return true;
        });
        if (Array.isArray(orderBy)) {
          // not exercised; sufficient for these specs
        } else if (orderBy?.scheduledDate === "asc") {
          rows = rows.slice().sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
        } else if (orderBy?.scheduledDate === "desc") {
          rows = rows.slice().sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
        } else if (orderBy?.createdAt === "desc") {
          rows = rows.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (take && rows.length > take) rows = rows.slice(0, take);
        return rows;
      },
      count: async ({ where }: any) =>
        bookings.filter((b) => (where.providerId ? b.providerId === where.providerId : true)).length,
      groupBy: async () => [],
    },
    review: {
      findMany: async ({ where, orderBy, take }: any) => {
        let rows = reviews.filter((r) => r.providerId === where.providerId);
        if (orderBy?.createdAt === "desc") {
          rows = rows.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (take && rows.length > take) rows = rows.slice(0, take);
        return rows;
      },
    },
    notification: {
      count: async () => 0,
    },
    conversation: {
      findMany: async ({ where, take }: any) => {
        const userId = where.participants?.some?.userId;
        let rows = conversations.filter((c) => c.participants.some((p) => p.userId === userId));
        if (take && rows.length > take) rows = rows.slice(0, take);
        return rows;
      },
    },
  } as unknown as PrismaService;
}

function buildJobRequestsFake(): JobRequestsService {
  return {
    topMatchesForDashboard: async () => [],
  } as unknown as JobRequestsService;
}

function buildActor(userId: string): Actor {
  return {
    id: userId,
    role: "PROVIDER",
    firstName: "Daniel",
    lastName: "Mbuyi",
    email: "daniel@example.test",
    avatar: null,
  } as Actor;
}

function buildProviderRow(overrides: Partial<ProviderRow> = {}): ProviderRow {
  return {
    id: "prov_1",
    userId: "user_1",
    profession: "Coiffeuse",
    description: "Coiffure professionnelle à domicile.",
    experience: 5,
    hourlyRate: 15000,
    totalReviews: 12,
    totalJobs: 32,
    rating: 4.8,
    responseTime: 90,
    isPremium: false,
    premiumExpiry: null,
    isAvailable: true,
    verificationStatus: "VERIFIED",
    user: {
      id: "user_1",
      firstName: "Daniel",
      lastName: "Mbuyi",
      avatar: null,
      city: "Kinshasa",
      country: "CD",
      latitude: null,
      longitude: null,
      email: "daniel@example.test",
      phone: "+243000000000",
      isVerified: true,
      onboardingStep: null,
    },
    categories: [
      { category: { id: "cat_1", name: "Coiffure", slug: "coiffure" } },
    ],
    skills: [{ id: "sk_1", name: "Tresses" }],
    serviceZones: [{ id: "zone_1", city: "Kinshasa" }],
    portfolio: [{ id: "p_1", url: "https://example.test/p1.jpg" }],
    trustScore: { badges: [] },
    ...overrides,
  };
}
```

- [ ] **Step 2.2: Add the spec for `hasAnyBookingEver: false` when there are no bookings**

Append to the same file:

```ts
describe("DashboardService.getProviderDashboard — new fields", () => {
  it("returns hasAnyBookingEver: false and empty todos when the provider has no bookings", async () => {
    const provider = buildProviderRow();
    const prisma = buildPrismaFake({ provider });
    const jobRequests = buildJobRequestsFake();
    const service = new DashboardService(prisma, jobRequests);

    const result = await service.getProviderDashboard(buildActor("user_1"));

    assert.equal(result.hasAnyBookingEver, false);
    assert.deepEqual(result.todos.unreadMessages, []);
    assert.deepEqual(result.todos.bookingsToClose, []);
  });
});
```

- [ ] **Step 2.3: Add the spec for `bookingsToClose` (CONFIRMED past `now - 2h`)**

Append:

```ts
  it("returns a bookingsToClose row for CONFIRMED bookings whose scheduledDate is more than 2h in the past", async () => {
    const now = new Date("2026-05-14T12:00:00.000Z");
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const provider = buildProviderRow();
    const prisma = buildPrismaFake({
      provider,
      bookings: [
        {
          id: "bk_1",
          providerId: provider.id,
          clientId: "cli_1",
          status: "CONFIRMED",
          title: "Coiffure",
          description: null,
          address: "1, Av. de la République",
          city: "Bandal",
          scheduledDate: threeHoursAgo,
          duration: 90,
          price: 30000,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          updatedAt: now,
          client: { id: "cli_1", firstName: "Jeanne", lastName: "Kabongo", avatar: null },
        },
      ],
    });
    const service = new DashboardService(prisma, buildJobRequestsFake());

    const result = await service.getProviderDashboard(buildActor("user_1"));

    assert.equal(result.todos.bookingsToClose.length, 1);
    assert.equal(result.todos.bookingsToClose[0].bookingId, "bk_1");
    assert.equal(result.todos.bookingsToClose[0].client.firstName, "Jeanne");
    assert.equal(result.hasAnyBookingEver, true);
  });
```

- [ ] **Step 2.4: Add the spec for "future CONFIRMED is not in bookingsToClose"**

Append:

```ts
  it("does not surface a CONFIRMED booking whose scheduledDate is in the future", async () => {
    const now = new Date("2026-05-14T12:00:00.000Z");
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const provider = buildProviderRow();
    const prisma = buildPrismaFake({
      provider,
      bookings: [
        {
          id: "bk_2",
          providerId: provider.id,
          clientId: "cli_2",
          status: "CONFIRMED",
          title: "Tresses",
          description: null,
          address: "14, Av. Kasai",
          city: "Gombe",
          scheduledDate: inOneHour,
          duration: 120,
          price: 35000,
          createdAt: now,
          updatedAt: now,
          client: { id: "cli_2", firstName: "Marie", lastName: "K.", avatar: null },
        },
      ],
    });
    const service = new DashboardService(prisma, buildJobRequestsFake());

    const result = await service.getProviderDashboard(buildActor("user_1"));

    assert.deepEqual(result.todos.bookingsToClose, []);
  });
```

- [ ] **Step 2.5: Add the spec for `todos.unreadMessages`**

Append:

```ts
  it("returns unreadMessages todos for conversations with inbound unread messages", async () => {
    const provider = buildProviderRow();
    const prisma = buildPrismaFake({
      provider,
      conversations: [
        {
          id: "conv_1",
          lastMessageAt: new Date("2026-05-14T10:00:00.000Z"),
          participants: [
            { userId: "user_1", user: { id: "user_1", firstName: "Daniel", lastName: "Mbuyi" } },
            { userId: "user_2", user: { id: "user_2", firstName: "Pierre", lastName: "Ngandu" } },
          ],
          messages: [
            {
              id: "msg_1",
              content: "À quelle heure tu arrives ?",
              senderId: "user_2",
              createdAt: new Date("2026-05-14T10:00:00.000Z"),
              readAt: null,
            },
          ],
          _count: { messages: 2 },
        },
      ],
    });
    const service = new DashboardService(prisma, buildJobRequestsFake());

    const result = await service.getProviderDashboard(buildActor("user_1"));

    assert.equal(result.todos.unreadMessages.length, 1);
    assert.equal(result.todos.unreadMessages[0].conversationId, "conv_1");
    assert.equal(result.todos.unreadMessages[0].unreadCount, 2);
    assert.equal(result.todos.unreadMessages[0].client.firstName, "Pierre");
    assert.equal(result.todos.unreadMessages[0].lastMessagePreview, "À quelle heure tu arrives ?");
  });
```

- [ ] **Step 2.6: Add the spec for "outbound-only conversations are not surfaced"**

Append:

```ts
  it("does not surface a conversation whose last message is outbound (sent by the provider)", async () => {
    const provider = buildProviderRow();
    const prisma = buildPrismaFake({
      provider,
      conversations: [
        {
          id: "conv_2",
          lastMessageAt: new Date("2026-05-14T10:00:00.000Z"),
          participants: [
            { userId: "user_1", user: { id: "user_1", firstName: "Daniel", lastName: "Mbuyi" } },
            { userId: "user_2", user: { id: "user_2", firstName: "Pierre", lastName: "Ngandu" } },
          ],
          messages: [
            {
              id: "msg_2",
              content: "Je passe à 14h.",
              senderId: "user_1",
              createdAt: new Date("2026-05-14T10:00:00.000Z"),
              readAt: null,
            },
          ],
          _count: { messages: 0 },
        },
      ],
    });
    const service = new DashboardService(prisma, buildJobRequestsFake());

    const result = await service.getProviderDashboard(buildActor("user_1"));

    assert.deepEqual(result.todos.unreadMessages, []);
  });
});
```

- [ ] **Step 2.7: Run the new specs and verify they FAIL**

Run from `apps/backend/`:

```bash
node --test -r ts-node/register src/modules/dashboard/dashboard.service.provider.spec.ts
```

Expected: 5 failing tests. The errors will mention missing `todos` / `hasAnyBookingEver` on the returned object. This confirms the tests exercise the new fields.

---

## Task 3: Backend `getProviderDashboard` returns new fields

Implement the service changes that satisfy Task 2's tests. All changes are additive — existing fields stay untouched.

**Files:**
- Modify: `apps/backend/src/modules/dashboard/dashboard.service.ts`

- [ ] **Step 3.1: Add a `messagePreviewLimit` helper near the top of the file**

Insert after the existing `participantUserSelect` declaration (around line 23):

```ts
const TODO_MESSAGE_PREVIEW_LIMIT = 120;
const PROVIDER_CLOSE_OVERDUE_MS = 2 * 60 * 60 * 1000;
```

- [ ] **Step 3.2: Extend the `Promise.all` in `getProviderDashboard` to fetch the new data**

Locate the existing `Promise.all([...])` block inside `getProviderDashboard` (starts around line 245). Add three new awaited values to the destructure and three new queries in the same `Promise.all`. The final block looks like:

```ts
const now = new Date();
const twoHoursAgo = new Date(now.getTime() - PROVIDER_CLOSE_OVERDUE_MS);

const [
  todayBookings,
  recentBookings,
  upcomingBookings,
  bookingRequests,
  recentReviews,
  unreadNotifications,
  certifiedProviderIds,
  statsSummary,
  currentRating,
  bookingsToCloseRows,
  conversationRows,
  totalBookingsEver,
] = await Promise.all([
  // ... existing 9 queries kept verbatim ...

  this.prisma.booking.findMany({
    where: {
      providerId: provider.id,
      status: "CONFIRMED",
      scheduledDate: { lt: twoHoursAgo },
    },
    orderBy: { scheduledDate: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      scheduledDate: true,
      price: true,
      client: { select: { firstName: true } },
    },
  }),
  this.prisma.conversation.findMany({
    where: {
      participants: { some: { userId: actor.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          messages: { where: { readAt: null, senderId: { not: actor.id } } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 10,
  }),
  this.prisma.booking.count({ where: { providerId: provider.id } }),
]);
```

- [ ] **Step 3.3: Map the new payload at the end of the method**

Find the existing `return { success: true as const, ... }` block in `getProviderDashboard` (around line 371). Add the two new mapped fields just before the closing brace, alongside `notifications`:

```ts
return {
  success: true as const,
  // ... existing fields kept verbatim ...
  notifications: {
    unreadCount: unreadNotifications,
  },
  todos: {
    unreadMessages: conversationRows
      .filter((c) => {
        const last = c.messages[0];
        if (!last) return false;
        if (last.senderId === actor.id) return false;
        return (c._count.messages ?? 0) > 0;
      })
      .map((c) => {
        const otherParticipant = c.participants.find((p) => p.userId !== actor.id);
        const lastMessage = c.messages[0];
        const preview = lastMessage
          ? lastMessage.content.length > TODO_MESSAGE_PREVIEW_LIMIT
            ? lastMessage.content.slice(0, TODO_MESSAGE_PREVIEW_LIMIT - 1) + "…"
            : lastMessage.content
          : null;
        return {
          conversationId: c.id,
          unreadCount: c._count.messages ?? 0,
          lastMessageAt: (c.lastMessageAt ?? lastMessage?.createdAt ?? new Date()).toISOString(),
          lastMessagePreview: preview,
          client: {
            id: otherParticipant?.user.id ?? "",
            firstName: otherParticipant?.user.firstName ?? "Client",
            lastName: otherParticipant?.user.lastName ?? "",
          },
        };
      })
      .slice(0, 5),
    bookingsToClose: bookingsToCloseRows.map((b) => ({
      bookingId: b.id,
      title: b.title,
      scheduledDate: b.scheduledDate.toISOString(),
      price: b.price,
      client: { firstName: b.client.firstName ?? "Client" },
    })),
  },
  hasAnyBookingEver: totalBookingsEver > 0,
  // ... legacy fields kept verbatim (user, recentBookings, upcomingBookings, recentReviews, legacyStats) ...
};
```

- [ ] **Step 3.4: Run the new specs and verify they PASS**

Run from `apps/backend/`:

```bash
node --test -r ts-node/register src/modules/dashboard/dashboard.service.provider.spec.ts
```

Expected: 5 passing tests.

- [ ] **Step 3.5: Run the existing dashboard specs to verify no regression**

```bash
node --test -r ts-node/register src/modules/dashboard/dashboard.service.spec.ts
```

Expected: PASS. Legacy fields untouched.

- [ ] **Step 3.6: Typecheck the backend**

```bash
pnpm --filter @kayu/backend typecheck
```

Expected: PASS.

---

## Task 4: Web — pure helpers (`providerDashboardHelpers.ts`)

Hero-variant selection, money formatting, and small date helpers. Pure functions; no React. Putting them in their own file keeps the variant tree easy to test by eye and lets the orchestrator stay short.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/providerDashboardHelpers.ts`

- [ ] **Step 4.1: Create the file with imports and type aliases**

```ts
import type { DashboardProviderResponse } from "@kayu/schemas";

export type ProviderDashboardData = DashboardProviderResponse;

export type HeroVariant =
  | "onboarding"
  | "pending_request"
  | "in_progress"
  | "next_today"
  | "next_upcoming"
  | "unavailable"
  | "calm"
  | "empty";

export type ProfileGap =
  | { key: "photo"; label: string; meta: string; href: string }
  | { key: "description"; label: string; meta: string; href: string }
  | { key: "portfolio"; label: string; meta: string; href: string }
  | { key: "skills"; label: string; meta: string; href: string }
  | { key: "zones"; label: string; meta: string; href: string };
```

- [ ] **Step 4.2: Add `endOfTodayLocal` and `pickHeroVariant`**

Append to the same file:

```ts
function endOfTodayLocal(now: Date = new Date()): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function pickHeroVariant(data: ProviderDashboardData, now: Date = new Date()): HeroVariant {
  if (!data.onboarding.isComplete) return "onboarding";

  const pending = data.bookingRequests ?? [];
  if (pending.length > 0) return "pending_request";

  const upcomingAll = data.upcomingBookings ?? [];
  const inProgress = upcomingAll
    .filter((b) => b.status === "IN_PROGRESS")
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
  if (inProgress) return "in_progress";

  const confirmedFuture = upcomingAll
    .filter((b) => b.status === "CONFIRMED")
    .filter((b) => new Date(b.scheduledDate).getTime() > now.getTime())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const soonest = confirmedFuture[0];
  if (soonest) {
    const ts = new Date(soonest.scheduledDate).getTime();
    return ts <= endOfTodayLocal(now).getTime() ? "next_today" : "next_upcoming";
  }

  if (!data.availability.isAvailable) return "unavailable";

  if (data.hasAnyBookingEver) return "calm";
  return "empty";
}
```

- [ ] **Step 4.3: Add `pickHeroBookingId` (used to exclude the hero booking from sections)**

Append:

```ts
export function pickHeroBookingId(data: ProviderDashboardData, variant: HeroVariant): string | null {
  if (variant === "pending_request") {
    const sorted = (data.bookingRequests ?? [])
      .slice()
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return sorted[0]?.id ?? null;
  }
  if (variant === "in_progress") {
    const inProgress = (data.upcomingBookings ?? [])
      .filter((b) => b.status === "IN_PROGRESS")
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    return inProgress[0]?.id ?? null;
  }
  if (variant === "next_today" || variant === "next_upcoming") {
    const sorted = (data.upcomingBookings ?? [])
      .filter((b) => b.status === "CONFIRMED")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return sorted[0]?.id ?? null;
  }
  return null;
}
```

- [ ] **Step 4.4: Add money + date formatters**

Append:

```ts
export function formatShortMoney(fc: number): string {
  if (!Number.isFinite(fc) || fc === 0) return "0 FC";
  if (fc >= 1_000_000) {
    const millions = fc / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    return `${rounded.toString().replace(/\.0$/, "")}M FC`;
  }
  if (fc >= 1_000) {
    const k = Math.round(fc / 1_000);
    return `${k}k FC`;
  }
  return `${Math.round(fc).toLocaleString("fr-FR")} FC`;
}

export function formatRelativeShort(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const MONTHS_FR_ABBR = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];

export function dayMonthAbbr(value: Date | string): { day: string; month: string } {
  const date = value instanceof Date ? value : new Date(value);
  return {
    day: String(date.getDate()),
    month: MONTHS_FR_ABBR[date.getMonth()] ?? "",
  };
}

export function dayLongFR(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("fr-FR", { weekday: "long" });
}

export function timeOfDayFR(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
```

- [ ] **Step 4.5: Add `deriveProfileGaps`**

Append:

```ts
const PROFILE_GAP_DEFS: ReadonlyArray<{
  key: ProfileGap["key"];
  itemKey: string;
  label: string;
  meta: string;
  href: string;
}> = [
  {
    key: "photo",
    itemKey: "hasPhoto",
    label: "Ajoute une photo de profil",
    meta: "+18 % de clics sur les profils avec photo",
    href: "/pro/onboarding?step=photo",
  },
  {
    key: "description",
    itemKey: "hasDescription",
    label: "Écris une description",
    meta: "Aide les clients à comprendre ce que tu proposes",
    href: "/pro/onboarding?step=description",
  },
  {
    key: "portfolio",
    itemKey: "hasPortfolio",
    label: "Ajoute un portfolio",
    meta: "Les profils avec portfolio convertissent mieux",
    href: "/pro/onboarding?step=portfolio",
  },
  {
    key: "skills",
    itemKey: "hasSkills",
    label: "Ajoute tes compétences",
    meta: "Améliore ta visibilité dans les recherches",
    href: "/pro/onboarding?step=skills",
  },
  {
    key: "zones",
    itemKey: "hasServiceZones",
    label: "Définis tes zones de service",
    meta: "Reçois des demandes dans les bonnes communes",
    href: "/pro/onboarding?step=zones",
  },
];

export function deriveProfileGaps(
  completionItems: Record<string, boolean> | undefined,
  cap = 2,
): ProfileGap[] {
  if (!completionItems) return [];
  const gaps: ProfileGap[] = [];
  for (const def of PROFILE_GAP_DEFS) {
    if (gaps.length >= cap) break;
    if (completionItems[def.itemKey] === false) {
      gaps.push({ key: def.key, label: def.label, meta: def.meta, href: def.href });
    }
  }
  return gaps;
}
```

- [ ] **Step 4.6: Typecheck the web app**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS. The helper file compiles in isolation; no consumers yet.

---

## Task 5: Web — `HeroStatusChip` re-export

Both dashboards share the same chip atom. Re-export from a single new file in the provider folder so the rest of the provider tree imports from a local path (keeps the dependency graph readable).

**Files:**
- Create: `apps/web/src/components/dashboard/provider/HeroStatusChip.tsx`

- [ ] **Step 5.1: Create the re-export file**

```tsx
export { HeroStatusChip, type HeroStatusChipVariant } from "../client/HeroStatusChip";
```

- [ ] **Step 5.2: Confirm the underlying atom supports all five variants used by the provider hero**

Read `apps/web/src/components/dashboard/client/HeroStatusChip.tsx`. Expected: it exports a `HeroStatusChipVariant` union including at least `"live" | "confirmed" | "pending" | "neutral" | "welcome"`. If any is missing, add it to that file in this step (background/text/dot tokens per spec §3.12 of the provider design doc).

- [ ] **Step 5.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 6: Web — `AvailabilityChip` + `AvailabilitySheet`

The chip in the greeting that toggles availability. Encapsulates the existing `providersApi.updateAvailability` mutation that today lives inline in `ProviderDashboardClient.tsx`.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/AvailabilityChip.tsx`
- Create: `apps/web/src/components/dashboard/provider/AvailabilitySheet.tsx`

- [ ] **Step 6.1: Create `AvailabilitySheet.tsx`**

```tsx
"use client";

import { I } from "@kayu/ui/web";

export type AvailabilitySheetProps = {
  isOpen: boolean;
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
  pending: boolean;
  onToggle: (next: boolean) => void;
  onClose: () => void;
};

export function AvailabilitySheet(props: AvailabilitySheetProps) {
  if (!props.isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--k-surface)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "16px 18px 22px",
          boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "var(--k-border)",
            margin: "0 auto 14px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid var(--k-border-subtle)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Disponibilité
            </div>
            <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 2 }}>
              {props.isAvailable
                ? "Tu apparais dans les recherches."
                : "Tu n'apparais pas dans les recherches."}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={props.isAvailable}
            disabled={props.pending}
            onClick={() => props.onToggle(!props.isAvailable)}
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              background: props.isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
              border: 0,
              position: "relative",
              cursor: props.pending ? "wait" : "pointer",
              opacity: props.pending ? 0.6 : 1,
              transition: "background 160ms var(--k-ease-std)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: props.isAvailable ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 160ms var(--k-ease-std)",
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
          }}
        >
          <I.mapPin size={16} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{props.zoneCity}</div>
            <div style={{ fontSize: 11, color: "var(--k-text-muted)" }}>
              Rayon · {props.zoneRadiusKm} km
            </div>
          </div>
          <a
            href="/pro/onboarding?step=zones"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--k-text-primary)",
              padding: "6px 10px",
              background: "#F1F5F9",
              borderRadius: "var(--k-r-md)",
              textDecoration: "none",
            }}
          >
            Modifier →
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Create `AvailabilityChip.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { providersApi, queryKeys } from "@kayu/api";
import { AvailabilitySheet } from "./AvailabilitySheet";

export type AvailabilityChipProps = {
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
};

export function AvailabilityChip(props: AvailabilityChipProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      providersApi(apiClient).updateAvailability({ isAvailable: next }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(
        queryKeys.dashboard.provider,
        (old: any) =>
          old
            ? {
                ...old,
                availability: { ...old.availability, isAvailable: next },
                provider: { ...old.provider, isAvailable: next },
              }
            : old,
      );
      return { prev };
    },
    onError: (_err, _value, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.dashboard.provider, context.prev);
      }
      toast.error("Impossible de mettre à jour ta disponibilité.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.search() });
    },
  });

  const label = props.isAvailable
    ? `Disponible · ${props.zoneCity}, ${props.zoneRadiusKm} km`
    : "Indisponible";

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        className="k-pd-avail-chip"
        data-on={props.isAvailable}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          fontSize: 11.5,
          fontFamily: "var(--font-body)",
          border: `1px solid ${props.isAvailable ? "#A7F3D0" : "var(--k-border)"}`,
          borderRadius: 999,
          background: props.isAvailable ? "var(--k-success-subtle)" : "#F1F5F9",
          color: props.isAvailable ? "#047857" : "var(--k-text-body)",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: props.isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
            boxShadow: props.isAvailable ? "0 0 0 4px rgba(16,185,129,0.18)" : "none",
            flexShrink: 0,
          }}
        />
        {label}
      </button>
      <AvailabilitySheet
        isOpen={sheetOpen}
        isAvailable={props.isAvailable}
        zoneCity={props.zoneCity}
        zoneRadiusKm={props.zoneRadiusKm}
        pending={mutation.isPending}
        onToggle={(next) => mutation.mutate(next)}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 6.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 7: Web — `Greeting`

Greeting block. Plain text salutation, trust + rating + missions meta line, `<AvailabilityChip />` on the right.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/Greeting.tsx`

- [ ] **Step 7.1: Create the file**

```tsx
"use client";

import { TrustChip } from "@kayu/ui/web";
import { AvailabilityChip } from "./AvailabilityChip";

export type GreetingProps = {
  firstName: string;
  rating: number;
  totalJobs: number;
  trust: "NEWCOMER" | "ESTABLISHED" | "TRUSTED" | "EXPERT";
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
};

export function Greeting(props: GreetingProps) {
  return (
    <header
      className="k-pd-greet"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 200 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "var(--k-text-primary)",
            lineHeight: 1.15,
          }}
        >
          Bonjour {props.firstName}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            fontSize: 12,
            color: "var(--k-text-muted)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#F59E0B", fontWeight: 700 }}>★</span>
          <span style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>
            {props.rating.toFixed(1)}
          </span>
          <span>· {props.totalJobs} missions</span>
          <span>·</span>
          <TrustChip trust={props.trust} />
        </div>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <AvailabilityChip
          isAvailable={props.isAvailable}
          zoneCity={props.zoneCity}
          zoneRadiusKm={props.zoneRadiusKm}
        />
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.k-pd-greet h1) {
            font-size: 26px;
          }
        }
        @media (max-width: 480px) {
          :global(.k-pd-greet) {
            flex-direction: column;
            align-items: flex-start;
          }
          :global(.k-pd-greet > div:last-child) {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </header>
  );
}
```

- [ ] **Step 7.2: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 8: Web — `RefuseReasonSheet`

Bottom-sheet with three radios + textarea for "Autre raison…". Submit fires the cancel mutation.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/RefuseReasonSheet.tsx`

- [ ] **Step 8.1: Create the file**

```tsx
"use client";

import { useState } from "react";

export type RefuseReasonSheetProps = {
  isOpen: boolean;
  pending: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

type PresetReason = "Créneau indisponible" | "Trop loin" | "Autre raison…";

const PRESETS: PresetReason[] = ["Créneau indisponible", "Trop loin", "Autre raison…"];

export function RefuseReasonSheet(props: RefuseReasonSheetProps) {
  const [selected, setSelected] = useState<PresetReason>("Créneau indisponible");
  const [other, setOther] = useState("");

  if (!props.isOpen) return null;

  const onSubmit = () => {
    const reason = selected === "Autre raison…" ? (other.trim() || "Autre raison") : selected;
    props.onConfirm(reason);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--k-surface)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "16px 18px 22px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "var(--k-border)",
            margin: "0 auto 14px",
          }}
        />
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          Pourquoi refuser ?
        </h2>

        {PRESETS.map((preset) => (
          <label
            key={preset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid var(--k-border-subtle)",
              cursor: "pointer",
              fontSize: 13.5,
              color: "var(--k-text-primary)",
            }}
          >
            <input
              type="radio"
              name="refuse-reason"
              checked={selected === preset}
              onChange={() => setSelected(preset)}
            />
            {preset}
          </label>
        ))}

        {selected === "Autre raison…" && (
          <textarea
            value={other}
            onChange={(e) => setOther(e.target.value.slice(0, 280))}
            placeholder="Précise (optionnel, max 280 caractères)"
            rows={3}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "8px 10px",
              border: "1px solid var(--k-border)",
              borderRadius: 8,
              fontFamily: "var(--font-body)",
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.pending}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={props.pending}
            style={{
              flex: 1.4,
              padding: "10px 14px",
              borderRadius: 8,
              border: 0,
              background: "var(--k-text-primary)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: props.pending ? "wait" : "pointer",
            }}
          >
            {props.pending ? "Envoi…" : "Confirmer le refus"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 9: Web — `DashboardHero` (all 8 variants)

The state-aware hero. One file, eight inline variant render branches. Mirrors the client `DashboardHero.tsx` style. Owns the accept/refuse mutations and the share-profile handler.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/DashboardHero.tsx`

- [ ] **Step 9.1: Create file scaffolding with imports + props + variant dispatch**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { bookingsApi, providersApi, queryKeys } from "@kayu/api";
import { HeroStatusChip } from "./HeroStatusChip";
import { RefuseReasonSheet } from "./RefuseReasonSheet";
import {
  type ProviderDashboardData,
  type HeroVariant,
  dayLongFR,
  formatRelativeShort,
  formatShortMoney,
  pickHeroBookingId,
  pickHeroVariant,
  timeOfDayFR,
} from "./providerDashboardHelpers";

export type DashboardHeroProps = {
  data: ProviderDashboardData;
};

export function DashboardHero({ data }: DashboardHeroProps) {
  const variant: HeroVariant = useMemo(() => pickHeroVariant(data), [data]);
  const heroBookingId = useMemo(() => pickHeroBookingId(data, variant), [data, variant]);

  switch (variant) {
    case "onboarding":
      return <OnboardingHero data={data} />;
    case "pending_request":
      return <PendingHero data={data} bookingId={heroBookingId!} />;
    case "in_progress":
      return <InProgressHero data={data} bookingId={heroBookingId!} />;
    case "next_today":
    case "next_upcoming":
      return <NextHero data={data} bookingId={heroBookingId!} variant={variant} />;
    case "unavailable":
      return <UnavailableHero data={data} />;
    case "calm":
      return <CalmHero data={data} />;
    case "empty":
      return <EmptyHero data={data} />;
  }
}

const HERO_SHELL: React.CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-lg)",
  padding: 16,
  marginBottom: 14,
};
```

- [ ] **Step 9.2: Add `OnboardingHero`**

Append:

```tsx
function OnboardingHero({ data }: { data: ProviderDashboardData }) {
  const router = useRouter();
  const currentStep = data.onboarding.currentStep ?? 0;
  const totalSteps = data.onboarding.totalSteps || 6;
  const pct = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <section style={HERO_SHELL} className="k-pd-hero">
      <HeroStatusChip variant="welcome" label={`PROFIL INCOMPLET · ÉTAPE ${currentStep + 1}/${totalSteps}`} />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Termine ton inscription.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Tu n'apparaîtras dans les recherches qu'une fois ton profil publié.
      </p>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#FEF3C7",
          margin: "14px 0 14px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#F59E0B",
            transition: "width 200ms var(--k-ease-std)",
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => router.push("/pro/onboarding")}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: 0,
          background: "var(--k-text-primary)",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Continuer l'inscription →
      </button>
    </section>
  );
}
```

- [ ] **Step 9.3: Add `PendingHero` with accept + refuse mutations**

Append:

```tsx
function PendingHero({ data, bookingId }: { data: ProviderDashboardData; bookingId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refuseOpen, setRefuseOpen] = useState(false);

  const booking = (data.bookingRequests ?? []).find((b) => b.id === bookingId);
  if (!booking) return null;

  const mutation = useMutation({
    mutationFn: ({ status, cancelReason }: { status: "CONFIRMED" | "CANCELLED"; cancelReason?: string }) =>
      bookingsApi(apiClient).update(bookingId, { status, cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      setRefuseOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "La réservation n'a pas pu être mise à jour.");
    },
  });

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration ? `${Math.round(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}` : "Durée à confirmer";
  const whenLabel = formatWhenLabel(booking.scheduledDate);
  const requestedRel = formatRelativeShort(booking.createdAt);
  const preview = (booking.description ?? booking.clientNotes ?? "").trim();

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--pending">
      <HeroStatusChip
        variant="pending"
        label={`À CONFIRMER · ${requestedRel.toUpperCase()}`}
      />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        {whenLabel}
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {dur} · {commune} · {priceLabel}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#0EA5E9",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{clientName}</div>
          {preview && (
            <div
              style={{
                fontSize: 11,
                color: "var(--k-text-muted)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              « {preview.slice(0, 80)}{preview.length > 80 ? "…" : ""} »
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(`/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`)
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => setRefuseOpen(true)}
          disabled={mutation.isPending}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate({ status: "CONFIRMED" })}
          disabled={mutation.isPending}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-success)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: mutation.isPending ? "wait" : "pointer",
          }}
        >
          {mutation.isPending && mutation.variables?.status === "CONFIRMED" ? "Envoi…" : "Accepter ✓"}
        </button>
      </div>

      <RefuseReasonSheet
        isOpen={refuseOpen}
        pending={mutation.isPending}
        onConfirm={(reason) => mutation.mutate({ status: "CANCELLED", cancelReason: reason })}
        onClose={() => setRefuseOpen(false)}
      />
    </section>
  );
}
```

- [ ] **Step 9.4: Add `InProgressHero`**

Append:

```tsx
function InProgressHero({ data, bookingId }: { data: ProviderDashboardData; bookingId: string }) {
  const router = useRouter();
  const booking = (data.upcomingBookings ?? []).find((b) => b.id === bookingId);
  if (!booking) return null;

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const address = [booking.address, booking.city].filter(Boolean).join(", ");
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration ? `${Math.round(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}` : null;
  const startedTime = booking.startedAt
    ? timeOfDayFR(booking.startedAt)
    : timeOfDayFR(booking.scheduledDate);

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--live">
      <HeroStatusChip variant="live" label="EN COURS · CHEZ LE CLIENT" />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Mission en cours
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {clientName} · {address}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#FB7185",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{clientName} · démarrée à {startedTime}</div>
          <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>
            {dur ? `Estimée ${dur} · ` : ""}{priceLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(`/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`)
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Terminer la mission →
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.5: Add `NextHero` (covers `next_today` + `next_upcoming`)**

Append:

```tsx
function NextHero({
  data,
  bookingId,
  variant,
}: {
  data: ProviderDashboardData;
  bookingId: string;
  variant: "next_today" | "next_upcoming";
}) {
  const router = useRouter();
  const booking = (data.upcomingBookings ?? []).find((b) => b.id === bookingId);
  if (!booking) return null;

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration ? `${Math.round(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}` : "Durée à confirmer";

  const scheduled = new Date(booking.scheduledDate);
  const now = new Date();
  const proximityLabel = (() => {
    if (variant === "next_today") {
      const diffMin = Math.max(0, Math.round((scheduled.getTime() - now.getTime()) / 60_000));
      if (diffMin < 60) return `DANS ${diffMin} MIN`;
      const diffH = Math.floor(diffMin / 60);
      return diffH < 6 ? `DANS ${diffH}H${diffMin % 60 ? Math.round(diffMin % 60) : ""}` : "AUJOURD'HUI";
    }
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((scheduled.getTime() - now.getTime()) / oneDay);
    if (diffDays <= 1) return "DEMAIN";
    if (diffDays <= 7) return dayLongFR(scheduled).toUpperCase();
    return "";
  })();

  const chipLabel = proximityLabel ? `CONFIRMÉE · ${proximityLabel}` : "CONFIRMÉE";
  const whenLabel = formatWhenLabel(booking.scheduledDate);

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--confirmed">
      <HeroStatusChip variant="confirmed" label={chipLabel} />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        {whenLabel}
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {dur} · {commune} · {priceLabel}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#0EA5E9",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{clientName}</div>
          <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>
            {priceLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(`/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`)
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Voir la mission →
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.6: Add `UnavailableHero` (owns its own availability mutation)**

Append:

```tsx
function UnavailableHero({ data }: { data: ProviderDashboardData }) {
  const queryClient = useQueryClient();
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";

  const mutation = useMutation({
    mutationFn: () => providersApi(apiClient).updateAvailability({ isAvailable: true }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(
        queryKeys.dashboard.provider,
        (old: any) =>
          old
            ? {
                ...old,
                availability: { ...old.availability, isAvailable: true },
                provider: { ...old.provider, isAvailable: true },
              }
            : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.dashboard.provider, ctx.prev);
      toast.error("Impossible de mettre à jour ta disponibilité.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    },
  });

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--unavailable">
      <HeroStatusChip variant="neutral" label="INDISPONIBLE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Tu es invisible aux clients.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Réactive ta disponibilité pour recevoir des demandes à {zoneCity} et autour.
      </p>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "10px 14px",
          background: "var(--k-success)",
          color: "white",
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: mutation.isPending ? "wait" : "pointer",
        }}
      >
        {mutation.isPending ? "Mise à jour…" : "Redevenir disponible"}
      </button>
    </section>
  );
}
```

- [ ] **Step 9.7: Add `CalmHero`**

Append:

```tsx
function CalmHero({ data }: { data: ProviderDashboardData }) {
  const router = useRouter();
  const revenueLabel = formatShortMoney(data.stats.revenue.value);
  const missions = data.stats.missions.value;
  const periodLabel = data.stats.period === "week" ? "cette semaine" : "ce mois-ci";

  const onShare = async () => {
    const providerId = data.provider.id;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/providers/${providerId}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Mon profil KAYOU", url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  };

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--calm">
      <HeroStatusChip variant="neutral" label="AUCUNE MISSION PRÉVUE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Journée libre.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {missions} mission{missions === 1 ? "" : "s"} {periodLabel} · {revenueLabel}. Partage ton profil
        pour des demandes supplémentaires.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={() => router.push("/pro/earnings")}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Voir mes revenus
        </button>
        <button
          type="button"
          onClick={onShare}
          style={{
            flex: 1.2,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Partager mon profil →
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.8: Add `EmptyHero` and shared helpers**

Append:

```tsx
function EmptyHero({ data }: { data: ProviderDashboardData }) {
  const primaryCategory = data.provider.categories?.[0] ?? "ton service";
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";

  const onShare = async () => {
    const providerId = data.provider.id;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/providers/${providerId}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Mon profil KAYOU", url });
        return;
      } catch {
        // fall through
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  };

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--empty">
      <HeroStatusChip variant="welcome" label="BIENVENUE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Ton profil est en ligne.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Tu apparais dans les recherches « {primaryCategory} · {zoneCity} ». Ta première demande
        arrivera bientôt.
      </p>
      <ul
        style={{
          margin: "12px 0 0 0",
          padding: "0 0 0 18px",
          fontSize: 12,
          color: "var(--k-text-body)",
          lineHeight: 1.5,
        }}
      >
        <li>Réponds en moins de 2 h pour booster ta visibilité</li>
        <li>Ajoute des photos de tes réalisations</li>
      </ul>
      <button
        type="button"
        onClick={onShare}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "10px 14px",
          background: "var(--k-text-primary)",
          color: "white",
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Partager mon profil
      </button>
    </section>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatWhenLabel(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const time = timeOfDayFR(date);
  if (sameDay(date, today)) return `Aujourd'hui · ${time}`;
  if (sameDay(date, tomorrow)) {
    const dayLong = dayLongFR(date);
    return `Demain, ${dayLong} ${date.getDate()} · ${time}`;
  }
  const long = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return `${long.charAt(0).toUpperCase()}${long.slice(1)} · ${time}`;
}
```

- [ ] **Step 9.9: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS. If any property access fails (`data.provider.categories`, `booking.startedAt`, `booking.clientNotes`), inspect the DTO schemas and adjust the access patterns to match the actual fields (some may be optional / undefined).

---

## Task 10: Web — `TodoStrip` + `TodoRow`

The unified to-do strip rendering extra-pendings, close-overdue, unread-messages, and profile-gap rows.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/TodoRow.tsx`
- Create: `apps/web/src/components/dashboard/provider/TodoStrip.tsx`

- [ ] **Step 10.1: Create `TodoRow.tsx`**

```tsx
"use client";

import { I } from "@kayu/ui/web";

export type TodoRowItem =
  | {
      key: string;
      kind: "extra_pending";
      title: string;
      meta: string;
      href: string;
      cta: string;
    }
  | {
      key: string;
      kind: "close_overdue";
      title: string;
      meta: string;
      href: string;
      cta: string;
    }
  | {
      key: string;
      kind: "unread_message";
      title: string;
      meta: string;
      href: string;
      cta: string;
    }
  | {
      key: string;
      kind: "profile_gap";
      iconName: keyof typeof I;
      title: string;
      meta: string;
      href: string;
      cta: string;
    };

const KIND_STYLE: Record<
  TodoRowItem["kind"],
  { bg: string; color: string; icon: keyof typeof I }
> = {
  close_overdue: { bg: "#FEE2E2", color: "#B91C1C", icon: "alertTriangle" },
  extra_pending: { bg: "#FEF3C7", color: "#92400E", icon: "clock" },
  unread_message: { bg: "#E0E7FF", color: "#4338CA", icon: "messageCircle" },
  profile_gap: { bg: "#F0FDF4", color: "#15803D", icon: "checkSquare" },
};

export function TodoRow({ item, isFirst }: { item: TodoRowItem; isFirst: boolean }) {
  const palette = KIND_STYLE[item.kind];
  const iconKey = item.kind === "profile_gap" ? item.iconName : palette.icon;
  const Icon = (I as any)[iconKey] ?? I.checkSquare;

  return (
    <a
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        color: "var(--k-text-primary)",
        textDecoration: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: palette.bg,
          color: palette.color,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          padding: "6px 10px",
          background: "#F1F5F9",
          borderRadius: "var(--k-r-md)",
          flexShrink: 0,
          color: "var(--k-text-primary)",
        }}
      >
        {item.cta} →
      </span>
    </a>
  );
}
```

- [ ] **Step 10.2: Create `TodoStrip.tsx`**

```tsx
"use client";

import { TodoRow, type TodoRowItem } from "./TodoRow";

export type TodoStripProps = {
  items: TodoRowItem[];
};

export function TodoStrip({ items }: TodoStripProps) {
  if (items.length === 0) return null;

  const visible = items.slice(0, 5);
  const overflow = items.length - visible.length;
  const label = items.length === 1 ? "1 tâche" : `${items.length} tâches`;

  return (
    <section
      className="k-pd-todo"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          À FAIRE
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            background: "#F1F5F9",
            padding: "2px 8px",
            borderRadius: "var(--k-r-pill)",
          }}
        >
          {label}
        </span>
      </div>

      {visible.map((item) => (
        <TodoRow key={item.key} item={item} isFirst={false} />
      ))}

      {overflow > 0 && (
        <a
          href="/bookings"
          style={{
            display: "block",
            padding: "10px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            textAlign: "right",
            textDecoration: "none",
          }}
        >
          +{overflow} de plus →
        </a>
      )}
    </section>
  );
}
```

- [ ] **Step 10.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 11: Web — `TodayList` + `TodayRow`

Today's planning section. Time-of-day rows with `IN_PROGRESS` highlighted.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/TodayRow.tsx`
- Create: `apps/web/src/components/dashboard/provider/TodayList.tsx`

- [ ] **Step 11.1: Create `TodayRow.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { TodayJob } from "@kayu/schemas";
import { HeroStatusChip } from "./HeroStatusChip";

export function TodayRow({ job, isFirst }: { job: TodayJob; isFirst: boolean }) {
  const variant = job.status === "completed" ? "neutral" : job.status === "en_route" ? "live" : "confirmed";
  const chipLabel = job.status === "completed" ? "TERMINÉE" : job.status === "en_route" ? "EN ROUTE" : "CONFIRMÉE";
  const priceLabel = job.fee ? `${job.fee.toLocaleString("fr-FR")} FC` : "Prix à confirmer";

  return (
    <Link
      href={`/bookings/${job.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        color: "var(--k-text-primary)",
        textDecoration: "none",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {job.time}
        </div>
        {job.duration && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              color: "var(--k-text-muted)",
              marginTop: 3,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {job.duration}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {job.kind} · {job.client.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {job.address} · {priceLabel}
        </div>
      </div>
      <HeroStatusChip variant={variant} label={chipLabel} compact />
    </Link>
  );
}
```

> Note: this assumes `HeroStatusChip` accepts a `compact` prop. If it doesn't, add it: at compact size (font 9.5 px, padding 2 × 6 px) the chip's styles need to scale down. Make the change in `apps/web/src/components/dashboard/client/HeroStatusChip.tsx` as part of this step.

- [ ] **Step 11.2: Create `TodayList.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { TodayJob } from "@kayu/schemas";
import { TodayRow } from "./TodayRow";

export type TodayListProps = {
  items: TodayJob[];
  estimatedRecette: number;
};

export function TodayList({ items, estimatedRecette }: TodayListProps) {
  const totalLabel = items.length === 0
    ? null
    : items.length === 1
      ? "1 MISSION"
      : `${items.length} MISSIONS`;
  const moneyLabel = estimatedRecette ? `${estimatedRecette.toLocaleString("fr-FR")} FC` : null;

  return (
    <section
      className="k-pd-section"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          AUJOURD'HUI{totalLabel ? ` · ${totalLabel}` : ""}{moneyLabel ? ` · ${moneyLabel}` : ""}
        </div>
        <Link
          href="/bookings"
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            textDecoration: "none",
          }}
        >
          Calendrier →
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            textAlign: "center",
          }}
        >
          Aucune mission aujourd'hui
        </div>
      ) : (
        items.map((j) => <TodayRow key={j.id} job={j} isFirst={false} />)
      )}
    </section>
  );
}
```

- [ ] **Step 11.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 12: Web — `UpcomingList` + `UpcomingRow`

Next 3 CONFIRMED missions beyond today.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/UpcomingRow.tsx`
- Create: `apps/web/src/components/dashboard/provider/UpcomingList.tsx`

- [ ] **Step 12.1: Create `UpcomingRow.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { DashboardBooking } from "@kayu/schemas";
import { dayMonthAbbr, timeOfDayFR } from "./providerDashboardHelpers";

export function UpcomingRow({ booking, isFirst }: { booking: DashboardBooking; isFirst: boolean }) {
  const { day, month } = dayMonthAbbr(booking.scheduledDate);
  const time = timeOfDayFR(booking.scheduledDate);
  const clientFirstName = (booking.client?.name ?? "Client").split(" ")[0] ?? "Client";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à confirmer";

  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        color: "var(--k-text-primary)",
        textDecoration: "none",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {day}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--k-text-muted)",
            marginTop: 3,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {month}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {booking.title} · {clientFirstName}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {time} · {commune} · {priceLabel}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 12.2: Create `UpcomingList.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { DashboardBooking } from "@kayu/schemas";
import { UpcomingRow } from "./UpcomingRow";

export type UpcomingListProps = {
  items: DashboardBooking[];
};

export function UpcomingList({ items }: UpcomingListProps) {
  return (
    <section
      className="k-pd-section"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          À VENIR
        </div>
        <Link
          href="/bookings"
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            textDecoration: "none",
          }}
        >
          Tout voir →
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            textAlign: "center",
          }}
        >
          Aucune mission à venir
        </div>
      ) : (
        items.map((b) => <UpcomingRow key={b.id} booking={b} isFirst={false} />)
      )}
    </section>
  );
}
```

- [ ] **Step 12.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 13: Web — `ReviewsList` + `ReviewRow`

Read-only list of the last 3 reviews. No reply action.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/ReviewRow.tsx`
- Create: `apps/web/src/components/dashboard/provider/ReviewsList.tsx`

- [ ] **Step 13.1: Create `ReviewRow.tsx`**

```tsx
"use client";

import type { Review } from "@kayu/schemas";
import { dayMonthAbbr } from "./providerDashboardHelpers";

const AVATAR_COLORS = ["#FB7185", "#10B981", "#F59E0B", "#BE185D", "#7C3AED", "#475569", "#0EA5E9", "#DC2626"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function ReviewRow({ review, isFirst }: { review: Review; isFirst: boolean }) {
  const firstName = review.client?.firstName ?? "Client";
  const lastName = review.client?.lastName ?? "";
  const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
  const name = `${firstName} ${lastInitial}`.trim();
  const score = Math.round(review.overallScore ?? review.rating ?? 0);
  const { day, month } = dayMonthAbbr(review.createdAt);
  const service = review.service ?? null;

  return (
    <div
      style={{
        padding: "11px 14px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: colorFor(review.client?.id ?? firstName),
          color: "white",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {initialsFor(`${firstName} ${lastName}`)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: 11, color: "#F59E0B", letterSpacing: 1 }}>
            {"★".repeat(score)}
            <span style={{ color: "var(--k-border)" }}>{"★".repeat(Math.max(0, 5 - score))}</span>
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--k-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {day} {month}
          </span>
        </div>
        {review.comment && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--k-text-body)",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            « {review.comment} »
          </div>
        )}
        {service && (
          <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 4 }}>{service}</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: Create `ReviewsList.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { Review } from "@kayu/schemas";
import { ReviewRow } from "./ReviewRow";

export type ReviewsListProps = {
  providerId: string;
  items: Review[];
};

export function ReviewsList({ providerId, items }: ReviewsListProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="k-pd-section"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          AVIS RÉCENTS
        </div>
        <Link
          href={`/providers/${providerId}#avis`}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            textDecoration: "none",
          }}
        >
          Voir tous →
        </Link>
      </div>
      {items.slice(0, 3).map((r) => (
        <ReviewRow key={r.id} review={r} isFirst={false} />
      ))}
    </section>
  );
}
```

- [ ] **Step 13.3: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 14: Web — `PulseStrip`

4-cell business pulse. Whole card links to `/pro/earnings`.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/PulseStrip.tsx`

- [ ] **Step 14.1: Create `PulseStrip.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { ProviderDashboardStats } from "@kayu/schemas";
import { formatShortMoney } from "./providerDashboardHelpers";

const MONTHS_FR_FULL = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];

export type PulseStripProps = {
  stats: ProviderDashboardStats;
  ratingValue: number;
  ratingDelta: number;
};

export function PulseStrip({ stats, ratingValue, ratingDelta }: PulseStripProps) {
  const now = new Date();
  const periodLabel = stats.period === "week" ? "CETTE SEMAINE" : `${MONTHS_FR_FULL[now.getMonth()]} ${now.getFullYear()}`;

  const revenueLabel = formatShortMoney(stats.revenue.value);
  const revenueDelta = stats.revenue.deltaPct;
  const missions = stats.missions.value;
  const missionsDelta = stats.missions.deltaPct;
  const responseValue = stats.responseRate.value;
  const responseQual = stats.responseRate.label;

  const deltaColor = (n: number) =>
    n > 0 ? "#047857" : n < 0 ? "#B91C1C" : "var(--k-text-muted)";

  return (
    <Link
      href="/pro/earnings"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <section
        className="k-pd-pulse"
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.04em",
              color: "var(--k-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            POULS · {periodLabel}
          </div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--k-text-primary)",
            }}
          >
            Voir les revenus →
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          <Cell value={revenueLabel} sub={
            <span style={{ color: deltaColor(revenueDelta) }}>{revenueDelta >= 0 ? "+" : ""}{revenueDelta}%</span>
          } label="REVENUS" />
          <Cell value={String(missions)} sub={
            <span style={{ color: deltaColor(missionsDelta) }}>{missionsDelta >= 0 ? "+" : ""}{missionsDelta}</span>
          } label="MISSIONS" />
          <Cell value={`${responseValue}%`} sub={<span>{responseQual}</span>} label="RÉPONSE" />
          <Cell
            value={`${ratingValue.toFixed(1)} ★`}
            sub={
              <span style={{ color: deltaColor(ratingDelta) }}>
                {ratingDelta >= 0 ? "+" : ""}{ratingDelta.toFixed(1)} CE MOIS
              </span>
            }
            label=""
          />
        </div>
      </section>
    </Link>
  );
}

function Cell({ value, sub, label }: { value: string; sub: React.ReactNode; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          color: "var(--k-text-muted)",
          letterSpacing: "0.04em",
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {label ? `${label} · ` : ""}{sub}
      </div>
    </div>
  );
}
```

- [ ] **Step 14.2: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 15: Web — `DashboardSkeleton`

Layout-mirroring skeleton. Replaces the existing inline `DashboardLoadingState` in `ProviderDashboardClient.tsx`.

**Files:**
- Create: `apps/web/src/components/dashboard/provider/DashboardSkeleton.tsx`

- [ ] **Step 15.1: Create the file**

```tsx
"use client";

export function DashboardSkeleton() {
  return (
    <div style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Block h={22} w={180} />
          <Block h={12} w={220} style={{ marginTop: 6 }} />
        </div>
        <Block h={26} w={140} r={999} />
      </div>

      <Block h={210} style={{ marginBottom: 14 }} r={14} />

      <Block h={140} style={{ marginBottom: 14 }} r={14} />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Block h={150} r={14} />
        <Block h={150} r={14} />
      </div>

      <Block h={170} style={{ marginBottom: 14 }} r={14} />

      <Block h={110} r={14} />

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.k-pd-skel-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Block({
  w,
  h,
  r = 8,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: w ?? "100%",
        height: h ?? 16,
        borderRadius: r,
        background:
          "linear-gradient(90deg, rgba(148,163,184,0.12), rgba(148,163,184,0.22), rgba(148,163,184,0.12))",
        backgroundSize: "200% 100%",
        animation: "k-shimmer 1.2s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
```

- [ ] **Step 15.2: Typecheck**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS.

---

## Task 16: Web — rewrite `ProviderDashboardClient.tsx` as the orchestrator

Replace the entire current contents with a thin composition of the new components. Drops the avatar header, full-width availability bar, OnboardingBanner above the page, big stats grid, two parallel columns, "Actualisation…" toast, and the feature-flagged job-match column.

**Files:**
- Modify (full rewrite): `apps/web/src/app/pro/ProviderDashboardClient.tsx`

- [ ] **Step 16.1: Read the existing file once for reference**

```bash
wc -l apps/web/src/app/pro/ProviderDashboardClient.tsx
```

Expected: around 1058 lines. Confirm the existing exports are `ProviderDashboardClient` (named) — no default export.

- [ ] **Step 16.2: Replace the file contents end-to-end**

Write the following as the complete new file content:

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { dashboardApi, queryKeys } from "@kayu/api";
import { Greeting } from "@/components/dashboard/provider/Greeting";
import { DashboardHero } from "@/components/dashboard/provider/DashboardHero";
import { TodoStrip } from "@/components/dashboard/provider/TodoStrip";
import type { TodoRowItem } from "@/components/dashboard/provider/TodoRow";
import { TodayList } from "@/components/dashboard/provider/TodayList";
import { UpcomingList } from "@/components/dashboard/provider/UpcomingList";
import { ReviewsList } from "@/components/dashboard/provider/ReviewsList";
import { PulseStrip } from "@/components/dashboard/provider/PulseStrip";
import { DashboardSkeleton } from "@/components/dashboard/provider/DashboardSkeleton";
import {
  deriveProfileGaps,
  formatRelativeShort,
  formatShortMoney,
  pickHeroBookingId,
  pickHeroVariant,
} from "@/components/dashboard/provider/providerDashboardHelpers";

export function ProviderDashboardClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
    enabled: !!user && user?.role === "PROVIDER",
  });

  const todos = useMemo<TodoRowItem[]>(() => {
    if (!data) return [];
    const items: TodoRowItem[] = [];
    const heroVariant = pickHeroVariant(data);
    const heroId = pickHeroBookingId(data, heroVariant);

    // close_overdue rows
    for (const todo of data.todos?.bookingsToClose ?? []) {
      items.push({
        key: `close-${todo.bookingId}`,
        kind: "close_overdue",
        title: `Clôture "${todo.title} · ${todo.client.firstName}"`,
        meta: `Mission du ${new Date(todo.scheduledDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })} non terminée · ${todo.price.toLocaleString("fr-FR")} FC en attente`,
        href: `/bookings/${todo.bookingId}`,
        cta: "Clôturer",
      });
    }

    // extra_pending rows (everything but the hero booking)
    for (const booking of data.bookingRequests ?? []) {
      if (booking.id === heroId) continue;
      const clientName = booking.client?.name ?? "Client";
      const firstName = clientName.split(" ")[0] ?? clientName;
      const dayShort = new Date(booking.scheduledDate).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      });
      const priceLabel = booking.price
        ? `${booking.price.toLocaleString("fr-FR")} FC`
        : "Prix à convenir";
      items.push({
        key: `pending-${booking.id}`,
        kind: "extra_pending",
        title: `Réponds à ${firstName} · ${booking.title} ${dayShort}`,
        meta: `Demandé ${formatRelativeShort(booking.createdAt)} · ${priceLabel}`,
        href: `/bookings/${booking.id}`,
        cta: "Répondre",
      });
    }

    // unread_message rows
    for (const m of data.todos?.unreadMessages ?? []) {
      const title = m.unreadCount > 1
        ? `${m.client.firstName} t'a écrit · ${m.unreadCount} messages`
        : `${m.client.firstName} t'a écrit`;
      const meta = m.lastMessagePreview
        ? `« ${m.lastMessagePreview} »`
        : `Conversation · ${formatRelativeShort(m.lastMessageAt)}`;
      const recipientId = m.client.id;
      const recipientName = `${m.client.firstName} ${m.client.lastName}`.trim();
      items.push({
        key: `msg-${m.conversationId}`,
        kind: "unread_message",
        title,
        meta,
        href: recipientId
          ? `/messages?recipientId=${encodeURIComponent(recipientId)}&recipientName=${encodeURIComponent(recipientName)}`
          : "/messages",
        cta: "Répondre",
      });
    }

    // profile_gap rows
    for (const gap of deriveProfileGaps(data.provider.completionItems as Record<string, boolean> | undefined)) {
      const iconName: keyof typeof I =
        gap.key === "photo"
          ? "camera"
          : gap.key === "portfolio"
            ? "image"
            : gap.key === "description"
              ? "fileText"
              : gap.key === "zones"
                ? "mapPin"
                : "checkSquare";
      items.push({
        key: `gap-${gap.key}`,
        kind: "profile_gap",
        iconName,
        title: gap.label,
        meta: gap.meta,
        href: gap.href,
        cta: "Compléter",
      });
    }

    return items;
  }, [data]);

  if (authLoading || !user || user.role !== "PROVIDER") {
    return <DashboardSkeleton />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }}>
        <ErrorBlock onRetry={() => refetch()} firstName={user.firstName ?? "Pro"} />
      </div>
    );
  }

  const variant = pickHeroVariant(data);
  const heroBookingId = pickHeroBookingId(data, variant);

  const provider = data.provider;
  const firstName = user.firstName ?? "Pro";
  const rating = data.stats.avgRating.value;
  const totalJobs = provider.totalJobs ?? 0;
  const trust =
    totalJobs >= 50 ? "EXPERT" : totalJobs >= 20 ? "TRUSTED" : totalJobs >= 5 ? "ESTABLISHED" : "NEWCOMER";
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";
  const zoneRadiusKm = data.availability.zoneRadiusKm ?? 10;
  const isAvailable = data.availability.isAvailable;

  // Filter today/upcoming to exclude the hero booking
  const todayJobs = (data.today.jobs ?? []).filter((j) => j.id !== heroBookingId);
  const upcoming = (data.upcomingBookings ?? [])
    .filter((b) => b.status === "CONFIRMED")
    .filter((b) => {
      const ts = new Date(b.scheduledDate).getTime();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return ts > end.getTime();
    })
    .filter((b) => b.id !== heroBookingId)
    .slice(0, 3);
  const recentReviews = data.recentReviews ?? [];

  const showSections = variant !== "onboarding" && variant !== "unavailable" && variant !== "empty";

  return (
    <div style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }} className="k-pd-page">
      <Greeting
        firstName={firstName}
        rating={rating}
        totalJobs={totalJobs}
        trust={trust as "NEWCOMER" | "ESTABLISHED" | "TRUSTED" | "EXPERT"}
        isAvailable={isAvailable}
        zoneCity={zoneCity}
        zoneRadiusKm={zoneRadiusKm}
      />

      <DashboardHero data={data} />

      {todos.length > 0 && <TodoStrip items={todos} />}

      {showSections && (
        <div
          className="k-pd-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <TodayList items={todayJobs} estimatedRecette={data.today.estimatedRecette ?? 0} />
          <UpcomingList items={upcoming} />
        </div>
      )}

      {showSections && recentReviews.length > 0 && (
        <ReviewsList providerId={provider.id} items={recentReviews} />
      )}

      <PulseStrip
        stats={data.stats}
        ratingValue={rating}
        ratingDelta={data.stats.avgRating.delta}
      />

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.k-pd-page) {
            padding: 20px 24px 40px !important;
          }
          :global(.k-pd-grid) {
            grid-template-columns: 1.4fr 1fr !important;
            gap: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}

function ErrorBlock({ firstName, onRetry }: { firstName: string; onRetry: () => void }) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Bonjour {firstName}
        </h1>
      </div>
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 32,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <I.alertCircle size={36} color="var(--k-text-muted)" />
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>
          Impossible de charger ton tableau de bord.
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--k-text-body)" }}>
          Vérifie ta connexion et réessaie.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="k-btn k-btn-primary"
          style={{
            marginTop: 8,
            padding: "10px 16px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 16.3: Typecheck the web app**

```bash
pnpm --filter @kayu/web typecheck
```

Expected: PASS. If `data.provider.categories`, `data.todos`, or `data.hasAnyBookingEver` flag any TS errors, double-check the DTO additions from Task 1 propagated through `@kayu/api` (re-run `pnpm --filter @kayu/api typecheck` if needed). If `I.fileText` isn't in the registry, swap to the closest available icon (`I.fileText` was added in earlier work; if absent use `I.file`).

---

## Task 17: Visual sweep + final commit

Verify the page renders for all 8 hero states by manual probing, then make a single commit covering the whole redesign.

**Files:**
- No new files. Run the app, probe the surface, commit.

- [ ] **Step 17.1: Run dev servers**

In two terminals:

```bash
# Terminal A
pnpm --filter @kayu/backend dev
```

```bash
# Terminal B
pnpm --filter @kayu/web dev
```

Then open `http://localhost:3000/pro` in a browser. Sign in as a provider account.

- [ ] **Step 17.2: Manual QA — verify each hero variant renders**

For each of the 8 variants below, manipulate seed data (via admin tools or direct DB writes) to trigger the state, refresh the page, and confirm the hero matches the spec:

1. **`onboarding`** — make a provider whose `onboarding.isComplete === false`. Hero shows amber chip with "PROFIL INCOMPLET · ÉTAPE N/6", progress bar, "Continuer l'inscription →".
2. **`pending_request`** — provider has a PENDING booking. Hero shows amber chip "À CONFIRMER · IL Y A …", booking summary, three buttons (Message / Refuser / Accepter). Click Refuser → reason sheet opens; submitting it cancels the booking.
3. **`in_progress`** — provider has a booking with `status: "IN_PROGRESS"`. Hero shows pulsing green "EN COURS · CHEZ LE CLIENT", "Terminer la mission →" CTA routes to `/bookings/{id}`.
4. **`next_today`** — provider has a CONFIRMED booking later today. Hero shows "CONFIRMÉE · DANS …".
5. **`next_upcoming`** — provider has a CONFIRMED booking tomorrow. Hero shows "CONFIRMÉE · DEMAIN" or weekday.
6. **`unavailable`** — provider has no pendings/in-progress/upcoming and `availability.isAvailable === false`. Hero shows neutral "INDISPONIBLE" chip + "Redevenir disponible" button (clicking it flips the toggle).
7. **`calm`** — provider has booking history but nothing active and is available. Hero shows neutral "AUCUNE MISSION PRÉVUE" + "Journée libre." + share CTA.
8. **`empty`** — brand-new provider, profile published, no bookings ever. Hero shows amber "BIENVENUE" + tips list + share CTA.

- [ ] **Step 17.3: Manual QA — sections below the hero**

With a provider that has 2+ pending bookings, multiple today/upcoming missions, recent reviews, and `completionPercentage < 100`:

- À FAIRE strip shows rows in the right order (close-overdue red first if any, then extra-pending amber, then unread indigo, then profile-gap green).
- Aujourd'hui + À venir grid stacks on mobile (open DevTools, 375 × 812). Hero booking is **not** duplicated.
- Avis récents shows up to 3 read-only rows.
- Pouls de la semaine renders 4 cells with display-font numbers.
- Availability chip in the greeting toggles when tapped (opens the sheet).

- [ ] **Step 17.4: Mobile sweep at 375 px and desktop sweep at 1280 px**

In DevTools, switch viewport to 375 × 812 and verify:

- No horizontal overflow on the page.
- Greeting reflows: availability chip drops below the name at < 480 px (Greeting's media query).
- Pending hero's three buttons stay on one row down to ~ 360 px; below that they wrap naturally.
- Pouls cells stay on one row (font shrinks visually, not via JS).

At 1280 px verify:

- Aujourd'hui / À venir become a 1.4fr / 1fr grid with 18 px gap.
- Hero headline is 26 px (the media query in Greeting controls h1 size).
- All cards retain `max-width: 1080px` outer container.

- [ ] **Step 17.5: Confirm the job-match feature is gone**

Search the rendered DOM at `localhost:3000/pro` for "Nouvelles demandes" or "Voir les demandes" — there should be zero matches even when `launchFlags.enableJobRequests === true`.

```bash
grep -rn "launchFlags.enableJobRequests\|newRequests" apps/web/src/app/pro/ProviderDashboardClient.tsx
```

Expected: no matches in the new file.

- [ ] **Step 17.6: Verify backend typecheck + tests still green**

```bash
pnpm --filter @kayu/backend typecheck
cd apps/backend && node --test -r ts-node/register src/modules/dashboard/dashboard.service.spec.ts src/modules/dashboard/dashboard.service.provider.spec.ts
```

Expected: PASS for both.

- [ ] **Step 17.7: Verify web typecheck and lint**

```bash
pnpm --filter @kayu/web typecheck
pnpm --filter @kayu/web lint
```

Expected: PASS. If lint flags unused imports from the old file (now deleted), the rewrite already dropped them — no action needed.

- [ ] **Step 17.8: Commit the redesign**

Stage everything in one commit. The user reviews the full diff before merging.

```bash
git add packages/schemas/src/dto.ts
git add apps/backend/src/modules/dashboard/dashboard.service.ts
git add apps/backend/src/modules/dashboard/dashboard.service.provider.spec.ts
git add apps/web/src/components/dashboard/provider/
git add apps/web/src/app/pro/ProviderDashboardClient.tsx

git status

git commit -m "$(cat <<'EOF'
Rebuild provider dashboard around state-led hero and focused sections

Eight hero variants (onboarding / pending / in_progress / next_today /
next_upcoming / unavailable / calm / empty) pick the single most urgent
action and run it inline (accept/refuse with reason picker, mark complete
via booking detail, toggle availability, share profile). Replaces the
avatar header, full-width availability bar, four big stat cards, and the
flagged job-match column with a compact greeting + availability chip,
an A FAIRE strip ranked by urgency, Aujourd'hui + A venir grid with the
hero booking excluded, read-only Avis recents, and a 4-cell Pouls de la
semaine strip linking to /pro/earnings.

Backend additive: todos.unreadMessages, todos.bookingsToClose,
hasAnyBookingEver. No breaking changes; legacy fields kept for other
callers.
EOF
)"
```

- [ ] **Step 17.9: Sanity-check the commit**

```bash
git log -1 --stat
```

Expected: the commit includes the modified schema/service files, the new spec file, the new provider component folder (~ 13 files), and the rewritten `ProviderDashboardClient.tsx`. No stray `.superpowers/` files.
