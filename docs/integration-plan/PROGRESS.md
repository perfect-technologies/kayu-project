# Integration Plan — Progress Tracker

## Overall

- **Track:** Backend Integration — wire frontend fixtures to real API
- **Status:** in_progress (I01 + I02 + I03 + I04 + I05 + I06 + I07 done)
- **Last updated:** 2026-04-19

---

## Feature status table

| ID | Chunk | Priority | Depends on | Status | Notes |
|---|---|---|---|---|---|
| I01 | Messages wiring | P0 (easy win) | — | done | Web + mobile wired to `/messages` via useQuery/useMutation with optimistic send, polling (15s list / 5s thread), Loading/Empty/Error states; `DEMO_THREADS` removed on both platforms |
| I02 | Auth OTP finalization | P0 | — | done | Real Supabase SMS OTP wired (web + mobile); signup/login modes; legacy dialogs removed; demo accounts kept as dev-only panel (per user direction) |
| I03 | Provider Dashboard data | P0 | — | done | `/dashboard/provider` returns expanded shape (today, newRequests, stats-with-sparkline, availability, onboarding); web `/pro` + mobile `ProviderDashboardScreen` wired via useQuery; availability toggle mutates `PATCH /providers/me/availability` with optimistic rollback; onboarding banner derived from profile completeness until I07 ships persistent onboarding state; legacy `/dashboard/provider` v1 page redirects to `/pro` |
| I04 | Job Requests module | P0 | — | done | NEW `JobRequest` + `JobRequestMatch` Prisma models; `JobRequestsModule` backend with client `POST /job-requests`, `GET /job-requests/mine`, `POST /job-requests/:id/cancel`; pro `GET /pro/requests`, `GET /pro/requests/:id`, `POST /pro/requests/:id/dismiss`. Matching service fans out to top 10 matching pros on create (category + city + verified, ordered by totalJobs then totalReviews) and writes match scores + notification rows. Dashboard `newRequests` now populated from `JobRequestMatch` (top 3 per pro). Web `/pro/requests` + mobile `JobRequestsScreen` wired via TanStack Query with 30s poll, dismiss mutation, Loading/Empty/Error states; `INCOMING_REQUESTS` + `PRO_ACTIVE_JOBS` fixtures removed (active jobs pulled from `bookingsApi.getAll({role: "provider"})`, filtered to `CONFIRMED` + `IN_PROGRESS`). |
| I05 | Quote / Devis module | P0 | I04 | done | NEW `Quote` + `QuoteLineItem` Prisma models + `QuoteStatus` enum; `QuotesModule` with pro endpoints (`GET/POST /pro/quotes`, `PATCH /pro/quotes/:id`, `POST /pro/quotes/:id/send`, `GET /pro/quotes/:id`) and client endpoints (`GET /job-requests/:id/quotes`, `GET /quotes/:id`, `POST /quotes/:id/{accept,decline}`). Totals (subtotal, discount, total, commission @ 10%, payout) computed server-side. `Accept` creates a Booking + marks JobRequest as MATCHED in a single `$transaction`; `commissionPct` stored on the quote for historical correctness. SEND also writes a `QUOTE_RECEIVED` notification to the client; accept/decline notify the pro. Web `/pro/devis/new` + mobile `QuoteComposeScreen` wired via TanStack Query against `GET /pro/requests/:id` + `POST /pro/quotes` + `POST /pro/quotes/:id/send`; `PRESET_LINE_ITEMS` stays as static catalog. New client-facing `/quotes/[id]` page with accept/decline actions. `findRequest()` fixture helper removed on both web + mobile. |
| I06 | Earnings + Mobile Money | P0 | — | done | NEW `Transaction` + `Payout` Prisma models (+ `TransactionType`, `TransactionStatus`, `PayoutOperator`, `PayoutStatus` enums); `EarningsModule` with `GET /pro/earnings/summary`, `GET /pro/earnings/transactions`, `POST /pro/earnings/payouts` (PSP call stubbed — creates Payout + linked negative Transaction in a Prisma `$transaction`, status PENDING, no real money moves), `GET /pro/earnings/payouts`. Booking → COMPLETED auto-creates an EARNING transaction (`status = COMPLETED` if `isPaid`, else `PENDING`, 10% commission). Web `/pro/earnings` + mobile `EarningsScreen` wired via `useQuery`/`useMutation`, with Loading/Empty/Error states, real weekly-chart days from `summary.weekly.days` (backend computes `isToday`/`isFuture`), live fee preview, operator tile + phone entry. `EARNINGS_WEEKLY` + `TRANSACTIONS` + `BALANCES` fixtures removed on both platforms (only `MM_OPERATORS` UI catalog remains — name/color/initial, no phone). |
| I07 | Onboarding draft persist | P1 | — | done | Added `User.onboardingStep` + `User.onboardingDraft` Json (overflow) + `Provider.onboardingCompleteAt` to Prisma; `OnboardingModule` wired with `GET /me/provider-draft`, `PATCH /me/provider-draft` (partial merge; syncs User + lazy-created Provider + skills/zones/primaryCategory), `POST /me/provider-publish` (validates + stamps `onboardingCompleteAt` + clears step, all in a Prisma `$transaction`). Provider search now filters out drafts (`onboardingCompleteAt is not null`). Dashboard `deriveOnboardingStatus` prefers `Provider.onboardingCompleteAt` + `User.onboardingStep` then falls back to field derivation. Web `/pro/onboarding` + mobile `ProviderOnboardingScreen` load draft via `useQuery`, debounce 600ms PATCH on field changes, flush-on-step-change, resume at saved step, publish via `useMutation` with missing-field → step jump on web; `INITIAL_DATA` fixture removed on both platforms. |
| I08 | Verification docs + KYC | P1 | — | not_started | NEW VerificationDoc model |
| I09 | Admin disputes + payouts | P2 (deferred) | I05, I06, I08 | not_started | Optional — admin pro trust loop |
| I10 | Fixture sweep + audit | P0 | all above | not_started | Delete residual fixtures, verify loading/empty/error |

---

## Milestones

### M1 — Easy wins landed (I01 + I02)
Messages wired. Auth OTP real. Demo accounts retained as dev-only panel (user direction). Legacy modal dialogs removed.
**Status:** done

### M2 — Pro surface dynamic (I03-I06)
ProviderDashboard, JobRequests, QuoteCompose, Earnings all read from real backend. New modules shipped for quotes and earnings.
**Status:** done

### M3 — Trust loop (I07 + I08)
Provider onboarding persists server-side. Verification docs upload to real storage. KYC state transitions visible in the UI.
**Status:** not_started

### M4 — Admin (I09, optional)
Dispute resolution + Mobile Money payout queue operable by internal team.
**Status:** not_started / deferred

### M5 — Clean (I10)
No fixtures left. Loading/empty/error states audited. PROGRESS closed.
**Status:** not_started

---

## Dependency notes

- **I01 and I02** are easy wins with no cross-dependencies. Start here.
- **I03** expands the provider dashboard endpoint. Does NOT require I04/I05/I06 to be done — the dashboard can return empty lists for sections that depend on future modules. But once I04/I06 land, I03's dashboard endpoint includes richer data.
- **I04 → I05**: A quote is composed against a job request. `POST /pro/quotes` expects a `jobRequestId`. I04 must land first (the JobRequest model is a FK target).
- **I07 + I08** are independent of each other but both are "trust track" work. Can parallelize.
- **I09** depends on I05 (disputes reference a booking which may have come from a quote), I06 (admin payouts reference the Payout model), I08 (admin reviews VerificationDoc state). Deferred explicitly per user direction.
- **I10** must run last.

---

## Blockers

| Date | Chunk | Blocker | Next action |
|---|---|---|---|
| — | — | — | — |

---

## Decisions log

| Date | Decision | Affects | Rationale |
|---|---|---|---|
| 2026-04-19 | Mobile Money PSP integration deferred — backend stubs only | I06 | Real PSP wiring is a separate ticket; UI + data model ships now |
| 2026-04-19 | Admin disputes + payouts deferred (I09 optional) | I09 | User direction: client + pro surface first, admin later |
| 2026-04-19 | `PRESET_LINE_ITEMS` stays as static code catalog | I05 | Not data — it's product config. Keeping in code is cheaper than a new table + admin UI |
| 2026-04-19 | Quote acceptance creates a Booking in a Prisma transaction | I05 | Atomic conversion; no orphaned quotes |
| 2026-04-19 | Onboarding draft autosave is debounced 600ms | I07 | Avoid chatty PATCH; balance responsiveness vs cost |
| 2026-04-19 | No WebSockets. Polling with TanStack Query for real-time feel | all | Scope + complexity; WS is a future ticket |
| 2026-04-19 | `VerificationDoc.url` is a placeholder signed URL (no cloud storage yet) | I08 | Cloud storage is its own ticket. DB stores URL string. |
| 2026-04-19 | New pro accounts go straight from OTP → DoneStep → `/pro/onboarding` (no interstitial) | I02, I03, I07 | Surface the core activity immediately; no "welcome pro" splash |
| 2026-04-19 | Dashboard shows a persistent "Complétez votre inscription · Étape N/6" banner when onboarding is incomplete | I03, I07 | Safety net for pros who abandon mid-wizard. Not dismissible until complete. |
| 2026-04-19 | Pro feature screens (JobRequests, QuoteCompose, Earnings) show a gated empty state when onboarding is incomplete; Verification is not gated | I03, I04, I05, I06 | Features tied to a published profile require it; person-level features (verify) don't |
| 2026-04-19 | Role picker moves **before** phone entry on the signup flow | I02 | Committing to a role is meaningful — asking after OTP felt like a consolation. Copy during OTP can now reference the chosen role ("créer votre compte pro") |
| 2026-04-19 | `/auth` has two modes: default (login, 2 steps) and `?mode=signup` (3 steps with role picker first) | I02 | Separates intent — login is fast; signup commits to a role explicitly |
| 2026-04-19 | Legacy homepage dialogs (LoginDialog, RegisterDialog, etc.) are deleted; Se connecter / S'inscrire buttons navigate to `/auth` | I02, I10 | Modal auth is confusing when the flow is multi-step; full-page dedicated route is the right surface. Cleanup lands in I02 (not deferred to I10) |
| 2026-04-19 | Client signup has a 4th step (name entry) after OTP; pros skip it because onboarding step 1 collects the same data | I02 | UI breaks without firstName (greetings, chat attribution, receipts); asking 2 required fields takes <10s. Avoids double-prompt for pros. |
| 2026-04-19 | `CompleteProfileDto` extended with optional `email` (plus repo write-through) | I02 | Client name step collects optional email at signup; flows through `PATCH /me/profile`. |
| 2026-04-19 | DEMO_ACCOUNTS dev panel kept on both `/auth` (web) and `AuthScreen` (mobile) behind `NODE_ENV !== "production"` | I02 | User direction reversed the original removal — real OTP is the default path, but dev team needs a fast role-switch in the absence of a wired SMS provider. |
| 2026-04-19 | Legacy modal dialogs (`LoginDialog`, `RegisterDialog`, `ProfessionSelection`, `ProviderOnboarding`) deleted; `/components/auth` directory removed | I02 | Full-page `/auth` route is the single entry; Header / HomePage / booking / provider profile all navigate instead of opening modals. |
| 2026-04-19 | I01 ships without thread `status` chip, mission banner, or gated suggested-replies — those fields aren't on the backend response yet | I01, I04, I05 | User scoped I01 to a pure frontend swap; UI reads what backend returns today and gracefully hides status-dependent chrome. A later chunk that adds `status` derivation server-side re-enables them. Suggested replies remain a static catalog, shown on every open thread for MVP. |
| 2026-04-19 | I03 derives `onboarding.isComplete` + `currentStep` from profile fields (profession/categories/zones/hourlyRate/description/avatar) rather than a dedicated `Provider.onboardingCompleteAt` column | I03, I07 | I07 will add the persistent column + explicit wizard-resume state. Until then, derivation from existing fields gives a good-enough banner and never leaves users stranded — when all fields are populated, the banner disappears. |
| 2026-04-19 | I03 keeps legacy fields on the dashboard response (`user`, `recentBookings`, `upcomingBookings`, `recentReviews`) as optional, retained purely for back-compat with the v1 dashboard path | I03, I10 | New `/pro` consumer uses the plan's structured shape; legacy `/dashboard/provider` now redirects to `/pro`. I10 will delete the optional fields once no consumer remains. |
| 2026-04-19 | I03 response-rate metric uses "non-cancelled / total bookings" as a proxy until I04's JobRequest matcher is available | I03, I04 | Real "replied within 24h of a JobRequest" rate requires the JobRequestMatch table; I04 will swap the proxy for the real calculation without changing the response shape. |
| 2026-04-19 | I04 matching: crude category + city + verified + isAvailable filter; order by `totalJobs desc, totalReviews desc`; fan out to top 10 pros; score = `max(20, 100 - rank*8)` | I04 | Haversine/distance matching is a later tuning pass — for MVP, city-level filtering is correct for Kinshasa's commune density. Notifications go out in the same transaction so the pro sees the match whether or not the job-requests screen is polling. |
| 2026-04-19 | I04 keeps both booking paths: direct pro booking (existing) **and** JobRequest fan-out (new). Client frontend entry point for JobRequests deferred — backend + pro-side UI ship now; client "Trouvez un pro pour moi" CTA will land with I05 when quote acceptance closes the loop. | I04, I05 | Per plan scope, the pro-side UI is the bigger unblocker (it feeds QuoteCompose in I05). Client-initiated request UI without a working quote would be a dead-end flow. |
| 2026-04-19 | Added `JOB_REQUEST_NEW` to `NotificationType` enum (Prisma + Zod) | I04 | Pros need a distinct notification surface for matches vs. direct booking events; keeps the notification feed categorizable once a UI consumer exists. |
| 2026-04-19 | `findRequest()` in pro fixtures stubbed to return `undefined` instead of deleting — QuoteCompose (I05) will swap it for a real `GET /pro/requests/:id` call without a rename | I04, I05 | Avoids churning the QuoteCompose import surface mid-flight. I05's first patch will replace the stub with `useQuery(queryKeys.jobRequests.detail(id), () => jobRequestsApi(apiClient).getById(id))`. |
| 2026-04-19 | I06 balance formula: `balance = sum(EARNING+BONUS where status=COMPLETED).netAmt − abs(sum(PAYOUT where status in (PENDING,COMPLETED)).netAmt)`; pending tile shows EARNING+BONUS still in PENDING | I06, I09 | Matches the mental model on the UI (Solde dispo / En attente). PAYOUT PENDING counts against balance so pros can't double-draw while a payout is in-flight. When I09 ships admin resolution, FAILED payouts should be released back to balance. |
| 2026-04-19 | I06 payout sheet calls `POST /pro/earnings/payouts` which creates a `Payout` + a linked `Transaction(type=PAYOUT, status=PENDING)` in a Prisma `$transaction`. The `// TODO: call PSP` line in `EarningsService.createPayout` is the integration seam for real M-Pesa/Airtel/Orange/MTN wiring. No real money moves until that TODO is replaced. | I06, I09 | Plan section 5 boundary — ship read-side integrity now, leave one clear edit point for the PSP ticket. Payouts stay PENDING indefinitely without admin action (I09). |
| 2026-04-19 | I06 week chart: backend fills `EarningsSummary.weekly.days` with 7 items Lun-Dim (ISO week), including `isToday`/`isFuture` flags so the UI never has to know today's date | I06 | Keeps MoneyChart dumb (pure props), same shape on web + mobile. Zero-amount days still render a 2px sliver; future days dim via the flag. |
| 2026-04-19 | I05 requires a `jobRequestId` on `POST /pro/quotes` (standalone/no-request quotes rejected with 400) | I05 | Simpler MVP: every quote is the response to a specific request, which keeps `clientId` derivation trivial and avoids a UX for picking/searching clients. Standalone quotes can be revisited later if pros ask for them. |
| 2026-04-19 | I05 commission rate stored on each `Quote` (`commissionPct` + `commissionAmt`) at creation time | I05 | Historical correctness — if KAYOU changes the take rate later, already-sent quotes show what was offered at the time. The live value (10%) is in code, not a config table, for MVP. |
| 2026-04-19 | I05 client-side live preview is labelled "estimation"; the backend recomputes on CREATE and on every PATCH | I05 | Never trust the client's math. Live preview is a UX convenience; truth lives server-side. Labelled explicitly so pros know the sticky recap is illustrative. |
| 2026-04-19 | I05 quote expiry handled lazily on read (`getByIdForClient` / `listForJobRequest` / `accept`) — no cron yet | I05 | Acceptable for MVP — the only consumer-visible flows read the quote on the accept path, which is gated by a fresh `expiresAt` check. A scheduled job can formalise the transition later without changing API shapes. |
| 2026-04-19 | Added `QUOTE_RECEIVED`, `QUOTE_ACCEPTED`, `QUOTE_DECLINED` to `NotificationType` enum (Prisma + Zod) | I05 | Distinct categorisation for the eventual notification feed UI; keeps `JOB_REQUEST_NEW`-style breakdowns coherent. |
| 2026-04-19 | Minimal client-facing `/quotes/[id]` detail page built (view + accept/decline + confirmation dialog) — no JobRequest-level "all received quotes" screen yet | I05 | Unblocks the end-to-end flow via notification deep-link. A client-side JobRequest detail page listing competing quotes can land with a follow-up once a client request-initiation UI exists. |
| 2026-04-19 | I07 stores overflow draft fields (idFront/back flags, zoneRadiusKm, visitFee, bio, languages, primaryCategoryId, subcategoryIds) in `User.onboardingDraft Json?`; core fields land on User/Provider columns directly. Provider row is created lazily on first PATCH with `profession=""` and hidden from search by `onboardingCompleteAt is not null` until publish | I07 | Keeps the plan's approach 1 (denormalize into Provider) while handling UI-only fields that don't map to existing columns without adding five new columns. Single JSON blob is trivially extendable as the wizard grows. |
| 2026-04-19 | I07 publish sets `Provider.profession` from the primary category's name when the pro hasn't typed a free-text title (and rejects publish if neither is set) | I07 | DS09's Step 2 picks a category, not a free-text profession — the existing `Provider.profession` column (legacy required String) gets sensible content without forcing another field in the wizard. |
| 2026-04-19 | I07 dashboard `deriveOnboardingStatus` now prefers the persisted `Provider.onboardingCompleteAt` + `User.onboardingStep` over the field-based derivation shipped in I03 — the field derivation remains as a fallback for pros whose draft predates I07 | I03, I07 | The banner stays accurate the moment a pro advances a step in the wizard, instead of waiting for a Provider column to flip. |
| 2026-04-19 | I07 avatar capture is a placeholder URL (`placeholder://avatar`) on PATCH — real cloud upload ships with I08 | I07, I08 | Scope boundary per the I07 doc — the wizard tracks "photo attached" as a boolean; the URL column is filled with a non-empty sentinel so `draft.avatar` validation passes in isolation. |

---

## Current focus

**Objective:** I01 + I02 + I03 + I04 + I05 + I06 + I07 complete. Provider onboarding now persists server-side — 600ms-debounced PATCH on field change, resume-at-saved-step on mount, atomic publish with missing-field → step-jump on 400. `INITIAL_DATA` fixture gone on both platforms; localStorage remains as optimistic cache on web. Next: I08 (verification docs + KYC) to close out M3 (Trust loop), or tackle I10 fixture sweep.

**Definition of done for M1:** zero `DEMO_THREADS` in `apps/web` or `apps/mobile` (met); `DEMO_ACCOUNTS` remains as dev-only panel gated by `NODE_ENV !== "production"` (per user direction); messages on mobile and web paginate and send against the real backend (met); phone OTP wired to Supabase `signInWithOtp` + `verifyOtp` on both platforms, with the Twilio provider already configured in the Supabase dashboard (met).

---

## Launch-critical checklist

- [x] Messages wired end-to-end (web + mobile)
- [ ] Auth OTP works without dev demo accounts
- [x] Provider dashboard stats + schedule + requests feed all real
- [x] Job Requests flow operable (client requests → pro sees → pro quotes)
- [x] Quote acceptance creates a booking atomically
- [x] Earnings page reads real transaction + payout history (payout PSP call stubbed)
- [x] Provider onboarding survives app reload (draft persisted server-side)
- [ ] Verification documents upload and state transitions reflect in the UI
- [ ] Every wired screen has Loading + Empty + Error states
- [ ] No `DEMO_*` constant left in app code
- [ ] (deferred) Admin disputes + payouts

---

## Update rules

1. Update this file at the start and end of each chunk.
2. Log schema decisions in the Decisions log as they happen — downstream chunks depend on them.
3. Record blockers immediately.
4. A chunk is `done` only when: migrations applied + endpoints tested via curl + fixture removed + UI renders real data with loading/empty/error states.
