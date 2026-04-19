# Integration Plan — Progress Tracker

## Overall

- **Track:** Backend Integration — wire frontend fixtures to real API
- **Status:** not_started
- **Last updated:** 2026-04-19

---

## Feature status table

| ID | Chunk | Priority | Depends on | Status | Notes |
|---|---|---|---|---|---|
| I01 | Messages wiring | P0 (easy win) | — | not_started | Backend ready; swap `DEMO_THREADS` for `/messages` |
| I02 | Auth OTP finalization | P0 | — | not_started | Remove demo accounts; enable Supabase SMS |
| I03 | Provider Dashboard data | P0 | — | not_started | Expand `/dashboard/provider` response; wire both platforms |
| I04 | Job Requests module | P0 | — | not_started | NEW backend model + module + wiring |
| I05 | Quote / Devis module | P0 | I04 | not_started | NEW Quote + QuoteLineItem; quote created against a request |
| I06 | Earnings + Mobile Money | P0 | — | not_started | NEW Transaction + Payout; PSP stubbed |
| I07 | Onboarding draft persist | P1 | — | not_started | Replace localStorage with backend |
| I08 | Verification docs + KYC | P1 | — | not_started | NEW VerificationDoc model |
| I09 | Admin disputes + payouts | P2 (deferred) | I05, I06, I08 | not_started | Optional — admin pro trust loop |
| I10 | Fixture sweep + audit | P0 | all above | not_started | Delete residual fixtures, verify loading/empty/error |

---

## Milestones

### M1 — Easy wins landed (I01 + I02)
Messages wired. Auth OTP real. Dev demo accounts removed. No `DEMO_*` in client screens.
**Status:** not_started

### M2 — Pro surface dynamic (I03-I06)
ProviderDashboard, JobRequests, QuoteCompose, Earnings all read from real backend. New modules shipped for quotes and earnings.
**Status:** not_started

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

---

## Current focus

**Objective:** land I01 (Messages wiring) and I02 (Auth OTP) to prove the integration pattern works.

**Definition of done for M1:** zero `DEMO_THREADS` / `DEMO_ACCOUNTS` references in `apps/web` or `apps/mobile`, messages on mobile and web paginate and send against the real backend, phone OTP works with Supabase SMS on a real phone in CD/CG.

---

## Launch-critical checklist

- [ ] Messages wired end-to-end (web + mobile)
- [ ] Auth OTP works without dev demo accounts
- [ ] Provider dashboard stats + schedule + requests feed all real
- [ ] Job Requests flow operable (client requests → pro sees → pro quotes)
- [ ] Quote acceptance creates a booking atomically
- [ ] Earnings page reads real transaction + payout history
- [ ] Provider onboarding survives app reload (draft persisted server-side)
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
