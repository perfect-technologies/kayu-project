# Design Plan v2 — Progress Tracker

## Overall

- **Track:** KAYOU Design v2 Iteration — new screens
- **Primary reference:** `./00-overview.md` + `../DESIGN_SYSTEM.md` (unchanged)
- **Visual source of truth:** `./prototype/`
- **Status:** in_progress (DS01, DS02, DS03, DS04, DS05, DS06, DS07, DS08, DS09 done)
- **Last updated:** 2026-04-19

---

## Feature status table

| ID | Chunk | Priority | Depends on | Platforms | Status | Notes |
|---|---|---|---|---|---|---|
| DS01 | Shared upgrades — icons, tab bar, routing | P0 | v1 shipped | web + mobile + `@kayu/ui` | done | Icons, role-aware tabs, booking→review routing, KayouMoment polish all landed |
| DS02 | Auth — phone OTP + role picker | P0 | DS01 | web + mobile | done | UI shipped on web (`/auth`) and mobile (`AuthScreen`). V1 Login/Register retired. OTP backend wiring deferred — see Blockers. |
| DS03 | My Bookings + Booking Detail (client) | P0 | DS01 | web + mobile | done | `/bookings` + `/bookings/[id]` on web; mobile v1 BookingsScreen + BookingDetailScreen rewritten in place. `BookingDetail` is one component with `perspective: "client" \| "pro"` — pro sees Commission KAYOU + payout in QuoteBreakdown. |
| DS04 | Messages upgrade | P1 | DS01 | web + mobile | done | `/messages` split layout (360px list + thread) on web; mobile `ConversationsScreen` + `ChatScreen` rewritten in place. System messages (emerald pill), mission banner, suggested replies, status chips + unread badges. Composer send enables only when draft is non-empty. Backend wiring (status/online/profession) still fixture-driven — see Blockers. |
| DS05 | Write Review upgrade | P1 | DS03 (linked nav) | web + mobile | done | Web `/review/[providerId]` single-page form with live overall-score banner; mobile 3-step wizard rewritten in `ReviewScreen.tsx`. 5-dim KAYOU ratings, QuickTags chip cloud, dashed photo uploader (UI-only), success screen with emerald check. BookingDetail now passes `?bookingId=` to scope the review. Photo upload endpoint deferred — see Blockers. |
| DS06 | Provider Dashboard | P0 (pro) | DS01 | web + mobile | done | Web `/pro` (role-gated — CLIENT/ADMIN redirected) + mobile `ProviderDashboardScreen` (replaces `ComingSoonScreen` placeholder). `StatCard` + `Sparkline` promoted to `@kayu/ui` for reuse by DS08. JobCard/RequestCard stay local to the dashboard. Data is mocked (TODAY_JOBS/NEW_REQUESTS/STATS) — pro-dashboard backend wiring blocked until DS07 ships. |
| DS07 | Job Requests + Quote Compose (pro) | P0 (pro) | DS06 | web + mobile | done | `/pro/requests` (JobRequestsClient, urgent-first sort, InboundRequestCard + ActiveJobsCard grouped card) and `/pro/devis/new?requestId=…` (QuoteComposeClient, line-items + presets per métier, discount %, start-date radio, validity days, live totals with KAYOU 10% commission + payout, QuoteSent success) on web; mobile `JobRequestsScreen` + `QuoteComposeScreen` shipped in new `RequestsNavigator` (RequestsMain / QuoteCompose / BookingDetail). Shared fixtures (`INCOMING_REQUESTS`, `PRO_ACTIVE_JOBS`, `PRESET_LINE_ITEMS`) duplicated across web/mobile. Backend wiring (requests DTO + quote submit) deferred to a later chunk. |
| DS08 | Earnings (pro, Mobile Money) | P1 (pro) | DS06 | web + mobile | done | Web `/pro/earnings` (EarningsClient 2-col grid, 1.4fr main + 1fr sidebar) and mobile `EarningsScreen` (replaces ComingSoonScreen placeholder in RoleAwareTabs). MoneyChart weekly bars (today ring-highlighted, future dim), balance card + stats tiles, filter chips (Tout/Gains/Paiements/Bonus) and 7 type-coded transaction rows (earning emerald / payout sky / bonus amber). Payout sheet (modal on web, bottom-sheet on mobile) with the four canonical operators (M-Pesa / Airtel / Orange / MTN MoMo) in a 2×2 grid, masked number, 1% fee preview, "Valider le paiement" placeholder CTA. Real Mobile Money wiring deferred — see Blockers. |
| DS09 | Provider Onboarding + Verification | P0 (pro) | DS06 | web + mobile | done | Web `/pro/onboarding` (6-step wizard: Identité → Métier → Zones → Tarifs → Profil → Publier with per-step validators, localStorage auto-save, sticky footer CTA, confirmation modal on exit) and `/pro/verify` (VerifyStatus with 5 state configs, VerifyWizard 4-step doc upload, DisputeView with timeline + response composer + 4-option resolution picker, debug state switcher behind `?debug=1`). Mobile mirrors both: `ProviderOnboardingScreen` (6 steps with circle-only StepIndicator, stepper-based radius control replacing slider dep, sticky bottom CTA) and `ProVerificationScreen` (same 3 modes, dev-only state toggle). `StepIndicator` promoted to `@kayu/ui/web` + `@kayu/ui/mobile`. Mobile tab bar hides on `ProviderOnboarding` route; provider stack wraps the dashboard so onboarding/verify are push-navigated. Dashboard prompt card on mobile; web sidebar gains a "Vérification" nav link. Backend wiring for `/me/provider-draft` + verification KYC provider deferred — see Blockers. |
| DS10 | Admin Ops | P1 | DS01 | web only | not_started | Desktop-first, dense layout |
| DS11 | Cleanup + cross-platform audit | P0 | all above | web + mobile | not_started | Closes the loop, retires v1 stubs |

---

## Milestones

### M1 — Shared upgrades ready (DS01)
Mobile tab bar navigates correctly to `bookings/messages/provider`. Icons available in `@kayu/ui`. Booking→review routing chain works. Hide-tab-bar list updated.
**Status:** done

### M2 — Client v2 complete (DS02–DS05)
Client can auth with phone OTP, see their bookings and details, chat with pros (system messages + suggested replies), leave a 5-dim review.
**Status:** done — DS02 + DS03 + DS04 + DS05 all landed.

### M3 — Pro v2 complete (DS06–DS09)
Pro has a dashboard with today's schedule + requests, can accept/decline requests, compose quotes with line items + commission visibility, view weekly earnings and request Mobile Money payouts, onboard in 6 steps, complete verification.
**Status:** done — DS06 + DS07 + DS08 + DS09 all landed.

### M4 — Admin Ops (DS10)
Internal team has a desktop tool for dispute resolution, verification review, and weekly payout batches.
**Status:** not_started

### M5 — Cleanup (DS11)
V1 dashboard stubs removed, cross-platform audit passes, docs updated, PROGRESS closed.
**Status:** not_started

---

## Dependency notes

- **DS01 gates everything.** Icons, tab bar, routing chain.
- **DS02 (Auth)** is independent of DS03-05 but comes before them in UX order; can run in parallel with DS03-05 once DS01 lands.
- **DS03 and DS04 and DS05** are the client track — can run in parallel.
- **DS06 is the first pro chunk** and unblocks DS07, DS08, DS09. These three can run in any order after DS06.
- **DS10** is independent of the pro track and the client track; any time after DS01.
- **DS11** must run last.

Most realistic team throughput: DS01 sequentially → then DS02/DS03/DS06/DS10 in parallel on four different agents → then everything else.

---

## Blockers

| Date | Chunk | Blocker | Next action |
|---|---|---|---|
| 2026-04-18 | DS02 | Supabase SMS provider not confirmed configured for CD/CG dial codes. UI currently mocks OTP send/verify (step progression is client-side). A dev-only "Accès rapide" panel on both platforms signs in with the three seeded email accounts (Client / Prestataire / Admin) so each role can be exercised end-to-end; DoneStep also falls back to the matching demo account. Hidden when `NODE_ENV === 'production'`. | Confirm `supabase.auth.signInWithOtp` + `verifyOtp` work against the project's SMS provider, then replace the mock in `AuthFlow.tsx` (web) and `AuthScreen.tsx` (mobile) with real calls, plus a `setRole` + `refreshUser` step on DoneStep for first-time users. Keep the dev demo panel until phone+OTP seed accounts exist. |
| 2026-04-19 | DS04 | Conversation schema lacks `status` (active/quote/completed), `profession`, and `online` — all three drive new DS04 visuals (status chip, mission banner, presence dot). Mobile + web currently render from a local `DEMO_THREADS` fixture so the UI is complete, but nothing is wired to `/messaging`. | Backend: derive `status` from linked booking/quote state and add `profession` + `online` (or `lastSeenAt`) to the conversation DTO. Then replace `DEMO_THREADS` in `apps/web/src/app/messages/MessagesClient.tsx` and `apps/mobile/src/screens/messages/fixtures.ts` with real `api.messages.getConversations()` data, and wire send to `api.messages.send`. |
| 2026-04-19 | DS05 | Photo upload for reviews is UI-only — the dashed "Ajouter" tile pushes a placeholder entry to the photos array but no multipart upload endpoint exists. Photo count is stitched into `comment` text as a placeholder note. `CreateReviewDto` also requires `bookingId`, so the booking → review chain coming from `KayouMoment` (web only has `?fromBooking=1`, no id) will currently submit a review without persisting when no bookingId is captured. | Backend: add a review-media upload endpoint (likely `/reviews/:id/photos` with S3-signed URL) and extend `CreateReviewDto` with `photoUrls: string[]`. Frontend: capture the `bookingId` from `bookingsApi.create` in `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx` and `apps/mobile/src/screens/booking/BookingScreen.tsx` so the review chain has an id to attach to. |
| 2026-04-19 | DS07 | Both `JobRequestsClient` / `JobRequestsScreen` and `QuoteComposeClient` / `QuoteComposeScreen` are driven by the `INCOMING_REQUESTS` / `PRO_ACTIVE_JOBS` / `PRESET_LINE_ITEMS` fixtures in `apps/web/src/components/pro/fixtures.ts` and `apps/mobile/src/screens/pro/fixtures.ts`. Decline + submit are optimistic UI with no network calls. Quote submit does not persist — it only flips `sent=true` to show `QuoteSent`. | Backend: expose a provider-requests endpoint (rich shape with category, budget, expiration, photos count, competing count) and a `POST /quotes` endpoint that accepts line items, discount %, validity days, start date, message, linked requestId. Frontend: replace fixtures with real queries on both platforms and wire submit to `api.quotes.create`. |
| 2026-04-19 | DS09 | Provider Onboarding has no backend wiring for `/me/provider-draft` (auto-save is localStorage only on web; in-memory on mobile), and "Publier mon profil" is a placeholder that shows a toast and routes to `/pro` without persisting. ProVerification state is fixture-driven with a debug toggle (`?debug=1` on web, dev-only button on mobile) — the 5-state lifecycle is UI-only; document uploads are click-to-toggle placeholders, not real multipart uploads. DisputeView's 4-option resolution picker + composer submits to a toast, not a backend. | Backend: add `GET/PATCH /me/provider-draft` (persist wizard state across sessions), `POST /providers/publish` (graduate draft → visible profile), verification KYC integration (Smile Identity or Veriff) with a `GET /verification/status` poll + `POST /verification/submit` multipart endpoint, and dispute response endpoints (`POST /disputes/:id/respond`). Frontend: replace the localStorage draft with a live query/mutation, wire the VerifyWizard upload target to real camera/file capture + signed-URL upload, and bind DisputeView to the dispute mutation. |
| 2026-04-19 | DS08 | Earnings is fixture-only: `EARNINGS_WEEKLY`, `TRANSACTIONS`, `BALANCES`, and `MM_OPERATORS` live inline in `apps/web/src/app/pro/earnings/fixtures.ts` and `apps/mobile/src/screens/pro/EarningsScreen.tsx`. The "Valider le paiement" CTA in the payout sheet is a front-end placeholder — tapping it just flips local state to a success confirmation, no network call is made. Fee preview uses a flat 1% placeholder; real Mobile Money fees vary per operator. | Backend: add an `/earnings` endpoint returning week-bucketed amounts, running balance / pending / lifetime, paginated transactions; add a saved-payout-methods endpoint per pro (masked numbers per operator); wire a `POST /payouts` endpoint that integrates with the selected Mobile Money provider (M-Pesa, Airtel, Orange, MTN MoMo) and returns a real fee + reference. Frontend: replace the fixtures, wire the payout CTA, and persist the new-number sub-step behind the "Modifier" button. |

---

## Decisions log

| Date | Decision | Affects | Rationale |
|---|---|---|---|
| 2026-04-18 | Auth is phone OTP (CD +243 / CG +242). Email is optional later. | DS02 | DRC/Congo-B audience expects SMS. v1 email+password is retired. |
| 2026-04-18 | Post-booking routes to `review/[providerId]`, not `home` | DS01, v1 BookingFlow | The review loop only closes if prompted. |
| 2026-04-18 | Mobile tab bar is **role-aware** — Pro sees: Dashboard / Demandes / Messages / Gains / Moi | DS01, DS06 | Same screens, different order / set. Role comes from `/me`. |
| 2026-04-18 | Admin is desktop-only | DS10 | Dispute + verification review are workstation tasks. |
| 2026-04-18 | KAYOU commission = 10% on quotes | DS07 | Baked into QuoteCompose. Confirm with finance before shipping. |
| 2026-04-18 | Mobile Money is first-class in Earnings (M-Pesa, Airtel, Orange, MTN) | DS08 | Market reality. No card-first flow. |
| 2026-04-18 | `BookingDetail` is ONE component with a `perspective: "client" \| "pro"` prop | DS03, DS07 | Same data shape, different actions. Avoids two implementations. |
| 2026-04-18 | V1 `/dashboard/{admin,client,provider,settings}` retired | DS11 | Replaced by `/admin`, `/bookings`+`/messages`+profile, `/pro`, and in-profile settings respectively. |
| 2026-04-18 | `apps/mobile/src/screens/auth/{Login,Register}Screen.tsx` retired | DS02 | Replaced by a single `AuthScreen` running the phone-OTP flow. |
| 2026-04-18 | 30+ new icons added to `@kayu/ui` (list in DS01) | DS01 | Driven by new screens. Adds no runtime cost (lucide is tree-shakeable). |
| 2026-04-18 | Mobile ADMIN role falls through to CLIENT tabs for now (TODO in DS10) | DS01, DS10 | Admin is desktop-only; mobile needs some sensible fallback, and CLIENT is least surprising. |
| 2026-04-18 | Pro-tab placeholder screens (`ProviderDashboard`, `Requests`, `Earnings`) live in `apps/mobile/src/screens/pro/` | DS01, DS06–DS08 | Ships the role-aware tab structure without blocking on pro content; those chunks replace the placeholders in place. |

---

## Current focus

**Objective:** client + pro tracks are complete (DS02–DS09 all landed). Next up: DS10 (Admin Ops — desktop-only) and DS11 (cleanup + cross-platform audit, retires v1 dashboard stubs).

**Definition of done for DS03 (shipped):** MyBookings list with 4 tabs (À venir / En cours / Terminées / Annulées) on web (`/bookings`) and mobile; unified `BookingDetail` (web `/bookings/[id]`; mobile screen) with Timeline, QuoteBreakdown (+ commission split for pro), CounterpartyCard, AddressCard mini-map and context-aware ActionButtons. V1 `BookingsScreen.tsx` + `BookingDetailScreen.tsx` rewritten in place.

---

## Launch-critical checklist

- [x] DS01 shared upgrades landed
- [x] Auth replaces v1 login across web + mobile *(UI complete; OTP backend wiring tracked in Blockers)*
- [x] Client sees MyBookings + BookingDetail + Messages + WriteReview, all v2
- [ ] Pro sees Dashboard + Requests + Quote + Earnings + Onboarding + Verify
- [ ] Admin has Ops dashboard on desktop
- [ ] Mobile tab bar is role-aware
- [ ] V1 `/dashboard/*` stubs removed
- [ ] Cross-platform audit passes (see DS11 checklist)
- [ ] PROGRESS closed, DESIGN_SYSTEM updated only if a decision during v2 changed a token or pattern

---

## Update rules

1. Update this file whenever a chunk status changes.
2. Log cross-chunk decisions in the decisions log.
3. Record blockers immediately.
4. Mark chunks `done` only after the chunk's own checklist passes AND the DS11 cross-cutting rules are respected.
