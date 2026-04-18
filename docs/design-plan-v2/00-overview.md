# 00 — v2 Overview: what changed, why, consequences

## Goal

Take KAYOU from "marketplace spine with placeholders for dashboards and improvised auth" to "complete marketplace with full client, provider, and admin surfaces."

## Why this iteration exists

The v1 design plan was focused on the 4 most visited screens (Home, Search, Profile, Booking) plus the Kayou Moment. Everything else was either stubbed (v1 dashboards at `/dashboard/{admin,client,provider,settings}`) or improvised (Login/Register with email+password on mobile). The v2 design pass closed that gap by sketching 11 new screens and upgrading 4 existing ones.

The user's direction through the v2 session:
- **Auth must be phone-OTP**, not email+password. DRC/Congo-B users expect SMS login. Email is optional later.
- **After booking, route to a review prompt**, not back to home. Every booking with outcome = review opportunity. The data loop only closes if we prompt.
- **Bookings and Messages deserve real tabs in the bottom nav**, not dead-end placeholders. The v1 tab bar was a lie — it pointed everything to `home`.
- **There's a whole provider app inside KAYOU.** Pros need a dashboard, inbound requests, a way to send quotes, earnings/payouts in Mobile Money, onboarding, and verification. Fatal to ship without these.
- **Admin Ops is desktop-only.** Dispute resolution and verification review are workstation tasks. Don't cram into mobile.

## Domain & role model

The v2 design makes the three roles explicit:

```
           Shared
         ┌─────────┐
         │   Auth  │ ← phone OTP, ends on role picker
         └─────────┘
              │
        ┌─────┴──────┬───────────┐
        ▼            ▼           ▼
     CLIENT         PRO         ADMIN
        │            │           │
   Home · Search     Dashboard   Ops dashboard
   Provider profile  Requests    Verify queue
   Booking flow      Quote       Disputes
   MyBookings        Earnings    Payouts
   BookingDetail*    Onboarding
   Messages          Verification
   WriteReview       + shares BookingDetail*
```

\* `BookingDetail` is a single component with a `perspective` prop — it renders for both client and pro depending on which list you came from.

## Mobile navigation reshuffle

**v1 tab bar targets (broken):**
```
Accueil → home
Rechercher → search
Réservations → home  ← lie
Messages → home      ← lie
Moi → home           ← lie
```

**v2 tab bar targets (fixed):**
```
Accueil      → home
Rechercher   → search
Réservations → bookings
Messages     → messages
Mon espace pro → provider  ← renamed, now goes to ProviderDashboard
```

And the "hide tab bar on this screen" list expanded:
- v1: `["booking", "profile"]`
- v2: `["booking", "profile", "review", "onboarding", "auth", "quote"]`

The principle: hide the tab bar whenever a sticky bottom CTA is active (booking, review, quote) or whenever the user is in a full-screen flow that takes over (auth, onboarding) or when a sticky price bar needs the space (profile).

## Web routing additions

These routes don't exist yet in `apps/web`:

```
/auth                      → Auth screen (replaces any email-login remnants)
/bookings                  → MyBookings
/bookings/[id]             → BookingDetail (client perspective)
/messages                  → Messages inbox
/messages/[threadId]       → (mobile-style routing if we want deep-linkable threads)
/review/[providerId]       → WriteReview
/pro                       → ProviderDashboard
/pro/requests              → JobRequests
/pro/requests/[id]         → BookingDetail (pro perspective — same component)
/pro/devis/new             → QuoteCompose (with ?requestId=…)
/pro/earnings              → Earnings
/pro/onboarding            → ProviderOnboarding
/pro/verify                → ProVerification
/admin                     → AdminOps (retires /dashboard/admin v1)
```

Retired after DS11:
```
/dashboard/admin    → replaced by /admin
/dashboard/client   → replaced by /bookings + /messages + profile
/dashboard/provider → replaced by /pro
/dashboard/settings → moved under profile (existing EditProfile/Settings on mobile, TBD on web)
```

## Mobile navigation stacks

The pro flow introduces a new bottom-tab destination ("Mon espace pro" / `ProviderDashboard`). If the signed-in user is a pro, their tab bar re-orders to foreground pro screens; if they're a client, it keeps the client flavor. Concretely:

- **Client bottom tabs:** Accueil · Rechercher · Réservations · Messages · Moi (profile)
- **Pro bottom tabs:** Dashboard · Demandes · Messages · Gains · Moi
- **Both share** the same underlying screens — only the tab set differs. The role is read from the user record after auth.

## What the shared `@kayu/ui` package needs

1. **30+ new icons** added to the `I` record (web) and RN equivalent. The full list is in `DS01`: trash, pencil, fileText, percent, copy, info, alertTriangle, eye, camera, upload, flag, bell, settings, globe, lock, logout, chevronLeft, refresh, wifi, wifiOff, creditCard, trendingUp, trendingDown, users, moreVertical, fileCheck, xCircle, checkCircle, server, rotate, selfie, idCard.
2. **Shell upgrades** in mobile: tab bar targets + role-aware tab set + expanded hide-tab-bar list.
3. **Kayou Moment polish**: soft shadow on summary card, emerald shadow on success circle, 14px button radius, booking→review routing.
4. **New reusable components** surfaced during v2 that belong in `@kayu/ui`:
   - `StepIndicator` (used in Auth, ProviderOnboarding, WriteReview, Verification)
   - `Timeline` (used in BookingDetail)
   - `Sparkline` (used in ProviderDashboard StatCard, Earnings weekly chart)
   - `StatusChip` variants (booking, dispute, verification)
   - `DimensionRow` (5-dim rating, used in Profile and WriteReview — likely already exists in v1)
   - `MessageBubble` (used in Messages, ThreadView)
   - `MoneyChart` weekly-bar primitive (Earnings)

Not every sub-component needs to go in `@kayu/ui` on day one. If a component is used by exactly one screen, it can live with that screen. The ones listed above are **used in 2+ screens** and qualify for promotion.

## Cross-cutting rules (v2)

1. **Hide-tab-bar list** is the source of truth for mobile navigator config. Export from `@kayu/ui/shell` or centralize in mobile navigation code; don't scatter.
2. **Role-based tab sets** require knowing the user's role after auth. Backend identity already exposes `role: CLIENT | PROVIDER | ADMIN`. Route the mobile navigator accordingly.
3. **Booking state → detail** is `nav("detail", bookingId)` in the prototype, but should be a proper `/bookings/:id` route in web and `BookingDetail` screen in mobile. The `perspective` prop determines which view renders.
4. **`nav("booking") → nav("review", providerId)`** after confirmation is already wired in the v2 prototype's `<App>` routing. Bring this to web + mobile. In web, use `router.push(\`/review/${providerId}\`)`. In mobile, use a stack replace (don't leave the booking in the back stack).
5. **Phone-first, email-optional** in Auth. The v1 mobile screens `LoginScreen.tsx` / `RegisterScreen.tsx` are retired in DS11.

## Scope

### In scope
- All 12 new / upgraded screens listed in the table
- Shared `@kayu/ui` additions (icons, components)
- Mobile navigator reshuffle (tab bar targets, role-based tabs, hide list)
- Web routes for all new screens
- Retirement of v1 dashboard stubs
- Cross-platform QA audit

### Out of scope
- Notifications center (listed as "candidate 2" in the chat but not actually designed — defer to a future iteration)
- Settings / account management expansion beyond what mobile already has
- Marketing/landing page for the web public home (listed as "candidate 5" in the chat)
- Pitch deck / PPTX export (irrelevant to engineering)
- Backend work — the NestJS endpoints for pro requests, quotes, earnings, verification, admin queues may or may not exist post-migration. **If they don't, flag them in DS11 and defer to a parallel backend chunk.** This plan does not own backend.

## Principal risks

1. **Mobile tab bar reshuffle breaks v1 implementation.** The existing mobile navigator treats `bookings/messages/profile` tabs as all routing back to `home`. Fixing this is a ripple through the Expo app. Mitigate: ship DS01 first and verify all 5 client tabs navigate correctly before moving on.
2. **V1 BookingsScreen/ReviewScreen/Messages on mobile already exist and need upgrade.** Not a greenfield build — a rewrite in-place with the same file paths or a clean replace. Mitigate: each client chunk (DS03/04/05) explicitly notes "replaces existing file" in its acceptance criteria.
3. **Role-based tabs require identity awareness.** If the backend `/me` endpoint doesn't distinguish a pro's active state (pending verification, active, suspended), the mobile app can't choose the right tab set. Mitigate: DS01 specifies the fields it needs from `/me`; if missing, they're a backend blocker.
4. **Mobile Money payout is real money.** `Earnings.jsx` shows "Valider" on a payout. Design can ship with the flow; backend must be gated behind a real Mobile Money integration. Mitigate: DS08 makes the happy-path look real; the "confirmer" button is a no-op placeholder until backend wires up.
5. **Admin Ops uses a different visual language (denser tables).** Easy to let this drift from the design system. Mitigate: DS10 calls out which primitives come from `@kayu/ui` and which are admin-local.
6. **QuoteCompose shows "Commission KAYOU 10%" to the pro.** This is a business decision baked into the design. Confirm it before shipping — if the rate differs, it's a cheap fix but important. Mitigate: DS07 notes the copy and links a decision log entry.

## Milestones

- **M1 — Shared upgrades ready** (DS01). Tab bar works, icons available, routing chain correct. Low risk, high unblock.
- **M2 — Client v2 complete** (DS02–DS05). Client can Auth, see their bookings and details, chat, review.
- **M3 — Pro v2 complete** (DS06–DS09). Pro has a dashboard, can handle requests, send quotes, see earnings, onboard, verify.
- **M4 — Admin Ops** (DS10). Internal team can operate the marketplace.
- **M5 — Cleanup** (DS11). V1 stubs removed, cross-platform QA passed, PROGRESS closed.

## Open questions

- **Role selection on web after Auth** — the prototype has the DoneStep navigate to `home` (client flow) or `onboarding` (pro flow). What if the user already has a role set on the backend? Should the DoneStep skip entirely? (Suggested: yes — if `/me.role` is already set, nav directly to the role-appropriate screen. DS02 writes this up.)
- **Admin auth** — admin is not reachable via the public auth flow. It needs a separate login (or an impersonation toggle for internal users). DS10 calls this out as a backend question.
- **`/admin` vs `/dashboard/admin`** — I'm proposing `/admin` for the new and retiring `/dashboard/admin`. Confirm: no bookmarks / external refs to `/dashboard/admin` exist that would break.
- **Profile tab on mobile for the client** — v1 tab bar had "Moi" pointing to `home` (broken). V2 says "Moi" should point to the existing `ProfileScreen`. Confirm: existing `apps/mobile/src/screens/profile/ProfileScreen.tsx` is what we want there, or does it need a v2 pass too? DS11 addresses.
