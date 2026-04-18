# KAYOU Design Plan — Iteration 2 (new screens)

> The original design plan lives in [../design-plan/](../design-plan/) and is shipped. This v2 iteration is **additive** — it fills the gaps that were improvised or deferred in v1 and adds the full provider + admin + trust surface.

## What this iteration is

KAYOU v1 shipped with the marketplace spine complete: Home, Search, Provider Profile, Booking flow, Kayou Moment, plus a working client auth scaffold and tokens/primitives. In the next Claude Design session, we expanded to **15 total screens** covering the client journey end-to-end and the provider + admin journeys from scratch.

This v2 plan is the implementation plan for:
1. **Upgrading** client screens where v1 improvised (Auth, MyBookings, BookingDetail, Messages, WriteReview)
2. **Adding** the provider surface (Dashboard, JobRequests, QuoteCompose, Earnings, Onboarding, Verification)
3. **Adding** the admin ops surface (dispute resolution, verification queue, payout queue)

## Source materials

Everything you need lives in `prototype/`:

- `KAYOU Prototype.html` — routes **all 15 screens** via a single `SCREENS` array. Look at the `App()` function to see the routing and tab-bar-hiding rules — they changed from v1.
- `tokens.css` — unchanged from v1
- `components/` — **18 JSX files**:
  - 6 unchanged or lightly tweaked: `shared.jsx` (+30 new icons), `MobileShell.jsx` (tab bar reshuffle), `Homepage.jsx`, `SearchPage.jsx`, `ProviderProfile.jsx`, `BookingFlow.jsx` (+Kayou Moment polish and review routing)
  - 12 new: `Auth.jsx`, `MyBookings.jsx`, `BookingDetail.jsx`, `Messages.jsx`, `WriteReview.jsx`, `ProviderDashboard.jsx`, `JobRequests.jsx`, `QuoteCompose.jsx`, `Earnings.jsx`, `ProviderOnboarding.jsx`, `ProVerification.jsx`, `AdminOps.jsx`
- `design-chat.md` — the full conversation in which these screens were designed. **Read it when you pick up a chunk** — it has the design rationale (why phone OTP and not email, why 4 booking tabs and not 3, why the admin is desktop-first, etc.).

## What already exists and what's missing

| v2 Screen | Route | Current web state | Current mobile state |
|---|---|---|---|
| **Auth** | `/auth` | ❌ missing | ⚠️ `Login/Register` v1 — email+password, wrong flow |
| Home | `/` | ✅ v1 shipped | ✅ v1 shipped |
| Search | `/pros` | ✅ v1 shipped | ✅ v1 shipped |
| Provider profile | `/pros/[id]` | ✅ v1 shipped | ✅ v1 shipped |
| Booking flow | `/book/[id]` | ✅ v1 shipped | ✅ v1 shipped (needs review-routing fix) |
| **MyBookings** | `/bookings` | ❌ missing | ⚠️ v1 `BookingsScreen` predates v2 |
| **BookingDetail** | `/bookings/[id]` | ❌ missing | ⚠️ v1 `BookingDetailScreen` predates v2 |
| **Messages** | `/messages` | ❌ missing | ⚠️ v1 `ConversationsScreen/ChatScreen` predate v2 |
| **WriteReview** | `/review/[id]` | ❌ missing | ⚠️ v1 `ReviewScreen` predates v2 |
| **ProviderDashboard** | `/pro` | ⚠️ v1 stub at `/dashboard/provider` | ❌ missing |
| **JobRequests** | `/pro/requests` | ❌ missing | ❌ missing |
| **QuoteCompose** | `/pro/devis/new` | ❌ missing | ❌ missing |
| **Earnings** | `/pro/earnings` | ❌ missing | ❌ missing |
| **ProviderOnboarding** | `/pro/onboarding` | ❌ missing | ❌ missing |
| **ProVerification** | `/pro/verify` | ❌ missing | ❌ missing |
| **AdminOps** | `/admin` | ⚠️ v1 stub at `/dashboard/admin` | n/a (desktop-only) |

## How to use this plan

1. Read `00-overview.md` for the architectural consequences (mobile tab bar reshuffle, new role-based navigation, retiring v1 dashboard stubs).
2. Check `PROGRESS.md` for current status.
3. Pick the next chunk (DS01 → DS11). Each chunk is self-contained.
4. Open the corresponding JSX file(s) in `prototype/components/` alongside the chunk — that's the visual source of truth.
5. Follow `AGENT-HANDOFFS.md` for a ready-to-send prompt per chunk.
6. Update `PROGRESS.md` when done.

## Relationship to other plans

| | Migration plan | v1 Design plan | **v2 Design plan (this)** |
|---|---|---|---|
| **Location** | `../implementation-plan/` | `../design-plan/` | `docs/design-plan-v2/` |
| **Scope** | Backend + monorepo + data | Tokens + primitives + core screens | New screens (provider + admin) + upgrades |
| **Status** | shipped | shipped | **not started** |

**Important:** do not reinvent what v1 already shipped. Tokens, primitives, canonical cards, shell are all in `@kayu/ui`. Pull from them. If you find something missing from `@kayu/ui` during a chunk (e.g. a new icon, a new card variant), add it there rather than inline in the app.

## Recommended execution order

1. [DS01 — Shared upgrades: icons, tab bar, routing](./DS01-shared-upgrades.md)
2. [DS02 — Auth (phone OTP + role picker)](./DS02-auth.md)
3. [DS03 — My Bookings + Booking Detail (client)](./DS03-bookings-detail.md)
4. [DS04 — Messages upgrade](./DS04-messages.md)
5. [DS05 — Write Review upgrade](./DS05-write-review.md)
6. [DS06 — Provider Dashboard](./DS06-provider-dashboard.md)
7. [DS07 — Job Requests + Quote Compose (pro)](./DS07-requests-quote.md)
8. [DS08 — Earnings (pro, Mobile Money)](./DS08-earnings.md)
9. [DS09 — Provider Onboarding + Verification](./DS09-onboarding-verification.md)
10. [DS10 — Admin Ops (desktop-only)](./DS10-admin-ops.md)
11. [DS11 — Cleanup, cross-platform audit, v1 retirement](./DS11-cleanup-audit.md)

## Parallelization

- **DS01** must come first (shell + icons unblock everything)
- **DS02** can run in parallel with DS03/04/05 after DS01 lands
- **Client track** (DS03 / DS04 / DS05) can run in parallel
- **Pro track** (DS06 → DS07 → DS08, DS09) has internal dependencies but runs parallel to the client track
- **DS10** (Admin) is independent, desktop-only
- **DS11** must come last

## Working agreement

1. Shared pieces (icons, shell tab bar, new card variants) live in `@kayu/ui`. Apps just consume them.
2. All 30+ new Lucide icons added to `shared.jsx` in the prototype go into `@kayu/ui/Icon.tsx` (web) and the Icon record in mobile.
3. Tab bar reshuffle from v2 is **breaking** — update once in `@kayu/ui` for mobile, use navigator config for web nav. Don't leave v1 targets around.
4. The `BookingFlow → KayouMoment → Review` routing is a chain: fixing it is part of DS01 because it cross-cuts multiple chunks.
5. V1 dashboard stubs (`/dashboard/{admin,client,provider,settings}`) are **retired** in DS11 once their replacements ship.
6. Admin UI uses its own information density — denser tables, smaller type, more data per viewport. Still uses tokens, but the layout language is different. Follow the prototype's `AdminOps.jsx`.
7. The mobile app has no admin tab. Admin is desktop-only.

## File map

| File | Purpose |
|---|---|
| `README.md` | This file |
| `00-overview.md` | Architectural shifts in v2 and their consequences |
| `PROGRESS.md` | Live status tracker |
| `AGENT-HANDOFFS.md` | Copy-paste prompts per chunk |
| `DS01-shared-upgrades.md` | Icons, tab bar, booking→review routing |
| `DS02-auth.md` | Phone OTP + country picker + role selection |
| `DS03-bookings-detail.md` | Client bookings list + unified detail page |
| `DS04-messages.md` | Split layout web, unified mobile, system messages, suggested replies |
| `DS05-write-review.md` | 5-dim rating + tags + photos wizard |
| `DS06-provider-dashboard.md` | Schedule, requests, stats, availability |
| `DS07-requests-quote.md` | Inbound requests + devis builder |
| `DS08-earnings.md` | Weekly chart + Mobile Money payouts |
| `DS09-onboarding-verification.md` | Pro 6-step onboarding + KYC wizard + dispute view |
| `DS10-admin-ops.md` | KPIs, verify queue, disputes, payout queue |
| `DS11-cleanup-audit.md` | Retire v1 stubs, cross-platform audit |
| `prototype/` | The v2 design sketch — visual source of truth |
