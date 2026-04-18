# Design Plan v2 — Progress Tracker

## Overall

- **Track:** KAYOU Design v2 Iteration — new screens
- **Primary reference:** `./00-overview.md` + `../DESIGN_SYSTEM.md` (unchanged)
- **Visual source of truth:** `./prototype/`
- **Status:** not_started
- **Last updated:** 2026-04-18

---

## Feature status table

| ID | Chunk | Priority | Depends on | Platforms | Status | Notes |
|---|---|---|---|---|---|---|
| DS01 | Shared upgrades — icons, tab bar, routing | P0 | v1 shipped | web + mobile + `@kayu/ui` | not_started | Unblocks everything; cheapest + highest leverage |
| DS02 | Auth — phone OTP + role picker | P0 | DS01 | web + mobile | not_started | Replaces v1 Login/Register |
| DS03 | My Bookings + Booking Detail (client) | P0 | DS01 | web + mobile | not_started | Tightly coupled; single chunk |
| DS04 | Messages upgrade | P1 | DS01 | web + mobile | not_started | Rewrites v1 conv/chat screens |
| DS05 | Write Review upgrade | P1 | DS03 (linked nav) | web + mobile | not_started | Rewrites v1 ReviewScreen |
| DS06 | Provider Dashboard | P0 (pro) | DS01 | web + mobile | not_started | Opens the pro surface |
| DS07 | Job Requests + Quote Compose (pro) | P0 (pro) | DS06 | web + mobile | not_started | Share request data |
| DS08 | Earnings (pro, Mobile Money) | P1 (pro) | DS06 | web + mobile | not_started | Payout flow is placeholder until backend |
| DS09 | Provider Onboarding + Verification | P0 (pro) | DS06 | web + mobile | not_started | Gates the pro role |
| DS10 | Admin Ops | P1 | DS01 | web only | not_started | Desktop-first, dense layout |
| DS11 | Cleanup + cross-platform audit | P0 | all above | web + mobile | not_started | Closes the loop, retires v1 stubs |

---

## Milestones

### M1 — Shared upgrades ready (DS01)
Mobile tab bar navigates correctly to `bookings/messages/provider`. Icons available in `@kayu/ui`. Booking→review routing chain works. Hide-tab-bar list updated.
**Status:** not_started

### M2 — Client v2 complete (DS02–DS05)
Client can auth with phone OTP, see their bookings and details, chat with pros (system messages + suggested replies), leave a 5-dim review.
**Status:** not_started

### M3 — Pro v2 complete (DS06–DS09)
Pro has a dashboard with today's schedule + requests, can accept/decline requests, compose quotes with line items + commission visibility, view weekly earnings and request Mobile Money payouts, onboard in 6 steps, complete verification.
**Status:** not_started

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
| — | — | — | — |

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

---

## Current focus

**Objective:** start DS01 so the foundation unblocks parallel work on DS02/DS03/DS06/DS10.

**Definition of done for DS01:** icons available, mobile tab bar targets + hide list + role-aware set all update from one place, booking→review routing works end-to-end, `@kayu/ui` re-published.

---

## Launch-critical checklist

- [ ] DS01 shared upgrades landed
- [ ] Auth replaces v1 login across web + mobile
- [ ] Client sees MyBookings + BookingDetail + Messages + WriteReview, all v2
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
