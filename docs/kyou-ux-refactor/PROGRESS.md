# KAYOU × K-YOU UX Refactor — Progress

## Status Summary

Created: 2026-09-16

Overall status: **Planning complete; implementation not started**

KAYOU adopts the K-YOU product model and visual system across backend, shared packages and the Next.js web app. The brand stays KAYOU. The Expo app is frozen. Launch-lead data and endpoints are preserved through a full database baseline reset. Work happens on `refactor/kyou-ux` and merges to `main` only after workstream 10.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Design Contract | Done | Planning | Frozen 2026-09-16 |
| 01 — Domain And Schema Reset | Not started | TBD | First; squashes migrations to `0_init` |
| 02 — Backend Modules | Not started | TBD | After 01 merges |
| 03 — Shared Packages | Not started | TBD | After 02 contract is fixed |
| 04 — Web Shell And Design System | Not started | TBD | After 03 |
| 05 — Web Public Screens | Not started | TBD | Parallel with 06–08 after 02, 03, 04 |
| 06 — Web Auth And Provider Onboarding | Not started | TBD | Parallel with 05, 07, 08 |
| 07 — Web Client And Provider Spaces | Not started | TBD | Parallel with 05, 06, 08 |
| 08 — Web Admin Console | Not started | TBD | Parallel with 05–07 |
| 09 — Launch Campaign Restyle | Not started | TBD | After 04; zero behaviour change |
| 10 — QA, Migration And Release | Not started | TBD | Scaffold during wave 3; finish last |

Status values:

- `Not started`
- `In progress`
- `Blocked`
- `In review`
- `Done`

Only mark `Done` when acceptance criteria and documented verification pass.

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-09-16 | Brand stays KAYOU; the K-YOU visual system, screens and flows are adopted | Owner decision; legal identity and domain are already KAYOU |
| 2026-09-16 | Product model is K-YOU's contact-first flow: search → profile → message/call/WhatsApp → book a slot → provider confirms → completes → review; cash outside the platform | The May v1 contract had already moved this way; K-YOU is the UX the owner wants |
| 2026-09-16 | Job requests, quotes and the quote marketplace are removed from product and schema | Hidden by flags since v1 alignment; no K-YOU equivalent |
| 2026-09-16 | Final offers are removed; the agreed price is recorded on the Booking at completion | One fewer object; matches K-YOU's booking-only model while keeping commission tracking |
| 2026-09-16 | Payouts and the mobile-money stub are removed; the Transaction ledger stays | Earnings screen needs real numbers; payouts were a `TODO: call PSP` stub |
| 2026-09-16 | Trust scores, badges and disputes are removed; verification status, premium tier, Reports and Blocks replace them | K-YOU safety model is simpler and admin-driven |
| 2026-09-16 | Favorites, VisibilitySettings, Subscription, Certification, Portfolio models are removed | Not in the K-YOU UX; contact gating becomes a site setting plus tier |
| 2026-09-16 | Supabase phone OTP stays the only sign-in; screens are restyled only | Avoids SMTP and password flows; launch-lead activation path unchanged |
| 2026-09-16 | K-YOU hierarchical Place references with admin curation and user suggestions replace hard-coded commune lists | Covers RDC and Congo-Brazzaville beyond Kinshasa with curated data |
| 2026-09-16 | Taxonomy stays DB-managed, gains a third level via `Subcategory.parentId`, and is reseeded with K-YOU's 19 categories | Keeps admin CRUD and launch-lead FKs while matching the reference tree |
| 2026-09-16 | French only; copy centralised in `apps/web/src/copy/*` | EN toggle deferred; seam kept for a locale layer |
| 2026-09-16 | `/launch*` pages are restyled in this refactor with zero behaviour change | Shared tokens would otherwise leave the live funnel visually stranded |
| 2026-09-16 | Agent concierge phase 1 stays on `feat/agent-concierge-phase-1` (commit `6bb6dca`) and is out of scope | It is not on `main` (`3b74f38`); it will be rebased onto the new contract in its own workstream, and its `search_providers` tool must follow the new `ProvidersService.search` signature then |
| 2026-09-16 | Full database reset allowed; migrations squashed into a new `0_init`; dev and prod databases recreated on deploy | No real marketplace users exist before the closed beta; lead tables are exported and restored |
| 2026-09-16 | French route slugs from K-YOU are canonical with one release of permanent redirects from the old English paths | French-only product; pre-launch so no external links to preserve |
| 2026-09-16 | Expo mobile app is frozen and removed from the launch gate | It consumes `@kayu/api` and `@kayu/schemas`, both rewritten; follow-up in `docs/kyou-mobile-refactor/` |
| 2026-09-16 | `IN_PROGRESS` booking status removed | K-YOU lifecycle is pending → confirmed → completed, cancel from the first two |
| 2026-09-16 | Single-rating reviews replace five-criteria reviews | K-YOU review form is one 1–5 rating plus a 500-character comment |
| 2026-09-16 | Provider wizard draft lives in sessionStorage, not on the server | Matches K-YOU; removes `onboardingStep`/`onboardingDraft` and the draft endpoints |
| 2026-09-16 | Storage deletions are synchronous with ActivityLog on failure | Simpler than a deletion queue; revisit if failures appear |
| 2026-09-16 | Campaign form keeps `KIN_COMMUNES` as its commune source | Lead DTO stores a controlled string; switching to Place ids is a closed-beta follow-up |

## Open Questions

- Should client-side geolocation sorting ("À proximité") stay available when no place filter is chosen, or should distance sorting require a chosen place?
- Should admins be able to set `premiumTier` and `premiumUntil` before any paid plan exists, or should the tier stay `FREE` for everyone until a purchase flow ships?
- Will a provider → client downgrade ever be needed? The UI offers none; the database allows an admin SQL change only.
- Do `html2canvas` and `jspdf` stay for the admin member CV export, or is a print stylesheet enough?
- When `feat/agent-concierge-phase-1` is rebased after this refactor, should the concierge be surfaced in the K-YOU navigation, and if so on which tab?
- Should the campaign form move from `KIN_COMMUNES` strings to Place ids once the closed-beta folder picks it up?

## How To Update This File

When starting work:

- Set the workstream status to `In progress`.
- Add owner/agent name.
- Add start date and scope note.

When finishing work:

- Set status to `Done`, `In review` or `Blocked`.
- List changed files.
- List commands run and result.
- Add decisions to the Decisions Log.
- Add blockers or follow-ups to Open Questions or a new blocker section.
- Add screenshots under `docs/kyou-ux-refactor/screenshots/0N/` and link them.

Shared-contract changes (schema, DTOs, endpoints, tokens, redirects) are recorded here **before** the consuming workstream merges.

## Workstream Evidence

Add implementation evidence below as each workstream completes.

### 01 — Domain And Schema Reset

Status: Not started

### 02 — Backend Modules

Status: Not started

### 03 — Shared Packages

Status: Not started

### 04 — Web Shell And Design System

Status: Not started

### 05 — Web Public Screens

Status: Not started

### 06 — Web Auth And Provider Onboarding

Status: Not started

### 07 — Web Client And Provider Spaces

Status: Not started

### 08 — Web Admin Console

Status: Not started

### 09 — Launch Campaign Restyle

Status: Not started

### 10 — QA, Migration And Release

Status: Not started
