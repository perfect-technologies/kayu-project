# KAYOU × K-YOU UX Refactor — Progress

## Status Summary

Created: 2026-09-16

Overall status: **Iteration A in progress (01 done; 02 next)**

KAYOU adopts the K-YOU product model and visual system across backend, shared packages and the Next.js web app. The brand stays KAYOU. The Expo app is frozen. Launch-lead data and endpoints are preserved through a full database baseline reset. Work happens on `refactor/kyou-ux` and merges to `main` only after workstream 10.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Design Contract | Done | Planning | Frozen 2026-09-16 |
| 01 — Domain And Schema Reset | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/01-schema` merged into `refactor/kyou-ux`; all acceptance commands pass (see evidence) |
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
| 2026-09-16 | (01) Provider languages and intervention modes use one `Provider.references ProviderReference[]` relation filtered by `kind`, not the doc's `languages` / `interventionModes` named relations | Two named relations over the single `ProviderReference.providerId` FK are invalid Prisma; the doc's `kind` column and `[providerId, kind]` index already model the split |
| 2026-09-16 | (01) `User.agentConversations` is not in the baseline | `AgentConversation` is not on `main`; the doc's own "Kept unchanged" section excludes it |
| 2026-09-16 | (01) Launch-lead DDL in `0_init` reproduces the final state of the squashed chain, including `NOT VALID` on `ProviderLead_primarySubcategoryId_required` and `_fkey` and `LeadSubmissionEvent.outcome` as the last column | A restored production lead export lands in the same catalog it left; verified by a `pg_dump --schema-only` diff |
| 2026-09-16 | (01) One lead index is renamed: `LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_subcate` → `..._sub_key` | The old migration's 72-character name was truncated by Postgres and differed from Prisma's name, which was a latent drift (`migrate diff` wanted a rename). The new baseline has zero drift. Same columns, uniqueness and method |
| 2026-09-16 | (01) Three K-YOU level-3 slugs are prefixed with their parent: `maquillage_mariage`, `traiteur_mariage`, `peinture_decoration` | K-YOU reuses `mariage` and `decoration` in different branches; `Subcategory.slug` is globally unique. Every other K-YOU slug is kept verbatim |
| 2026-09-16 | (01) Reference lists use the 01 doc labels; K-YOU's differing labels are kept as aliases (`Chez le prestataire` on `En atelier`, `Par intervention` on `Par prestation`, `English` on `Anglais`) | The doc is the contract; aliases keep K-YOU wording searchable |
| 2026-09-16 | (01) SKILL references are every level-2 and level-3 taxonomy label, scoped to its category (194 items, slug `skill-<subcategory slug>`) | Mirrors K-YOU `reference-seed.mjs` |
| 2026-09-16 | (01) Place slugs are path-based (`cd`, `cd-province-kinshasa-city-kinshasa-commune-gombe`, `cg-city-brazzaville`); country labels are K-YOU's `RDC` and `Congo` with full names as aliases | Unique, readable and traceable to K-YOU's reference keys |
| 2026-09-16 | (01) Demo providers whose city is not a seeded place keep the nearest seeded ancestor plus a free `addressLine` (Pointe-Noire → country `Congo`, Lubumbashi communes → city), and a pending `PlaceSuggestion` for Pointe-Noire is seeded | K-YOU rule: no invented attachment; also gives the admin queue a suggestion to approve |
| 2026-09-16 | (01) `launch-leads.orphan-upgrade.spec.ts` rewritten for the baseline although it sits under `src/modules` | The 01 definition of done requires it green on the new baseline, and it hard-referenced deleted migration folders. It now checks that `migrate deploy` applies only `0_init`, preserves orphan snapshots, and enforces the lead FKs and CHECK constraints |

## Open Questions

- Should client-side geolocation sorting ("À proximité") stay available when no place filter is chosen, or should distance sorting require a chosen place?
- Should admins be able to set `premiumTier` and `premiumUntil` before any paid plan exists, or should the tier stay `FREE` for everyone until a purchase flow ships?
- Will a provider → client downgrade ever be needed? The UI offers none; the database allows an admin SQL change only.
- Do `html2canvas` and `jspdf` stay for the admin member CV export, or is a print stylesheet enough?
- When `feat/agent-concierge-phase-1` is rebased after this refactor, should the concierge be surfaced in the K-YOU navigation, and if so on which tab?
- Should the campaign form move from `KIN_COMMUNES` strings to Place ids once the closed-beta folder picks it up?
- (01) What are the public `contact_phone`, `contact_email` and `contact_website` values? The 01 doc says "current footer values", but the current footer has none, so they are seeded empty rather than invented.
- (01 → 05) `Category.image` is seeded empty. K-YOU's category photos are local generated assets for six categories only; 05 decides which photography ships and sets the paths.

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

Status: Done (2026-09-16). Branch `kyou-ux/01-schema` from `refactor/kyou-ux` (both created at `89f1324`), reviewed by the owner and merged into `refactor/kyou-ux` locally (not pushed).

#### Changed files

- `apps/backend/prisma/schema.prisma`: marketplace half rewritten to the 01 target; launch-lead block byte-identical to `main`.
- `apps/backend/prisma/migrations/0_init/migration.sql`: regenerated with `prisma migrate dev --name init --create-only` on an empty database, then three hand edits: lead constraints mirrored from the old chain, `LeadSubmissionEvent.outcome` moved last, and `booking_active_slot_unique` appended. The five `20260725*` folders are deleted; `migration_lock.toml` is unchanged.
- `apps/backend/src/modules/launch-leads/launch-leads.migration-integrity.spec.ts`: pins the `0_init` sha256 (`97a3f2b6…8dcd`) and asserts that the 50 launch-lead statements in the baseline (11 enums, 7 tables including the inline exactly-one-lead CHECK, 24 indexes, 1 CHECK and 7 FKs added by `ALTER TABLE`) match an exact expected list.
- `apps/backend/src/modules/launch-leads/launch-leads.orphan-upgrade.spec.ts`: rewritten for the baseline (see Decisions Log).
- `apps/backend/prisma/seed.ts`: new clear order (lead tables untouched, places deleted leaves first); runs places → categories → references → settings → demo → Supabase users; prints a count for every Prisma model via `Prisma.dmmf`. `assertSeedAllowed()` kept.
- `apps/backend/prisma/seed-categories.ts`: the K-YOU tree, with 19 categories, 106 level-2 and 88 level-3 nodes, Lucide icon names (`House` and `Ellipsis` for K-YOU's `Home` / `MoreHorizontal` aliases) and Tailwind colours.
- New `seed-places.ts` (89 places), `seed-references.ts` (18 list items + 194 skills), `seed-settings.ts` (21 keys).
- `apps/backend/prisma/seed-demo.ts`: 15 providers, 13 clients and 1 admin (same emails and phones as before), remapped. Details below.

#### Removed models and enums

Models: `JobRequest`, `JobRequestMatch`, `Quote`, `QuoteLineItem`, `FinalOffer`, `Payout`, `TrustScore`, `ProviderBadge`, `Dispute`, `DisputeEvidence`, `Favorite`, `VisibilitySettings`, `Subscription`, `Certification`, `CertificationDoc`, `PortfolioItem`, `PortfolioProject`, `PortfolioImage`, `Skill`, `ServiceZone`, `AvailabilitySchedule`, plus `ProviderCategory` and `ProviderSubcategory` (absent from the target: a provider has one deepest `subcategoryId`).

Enums: `JobRequestStatus`, `QuoteStatus`, `FinalOfferStatus`, `PayoutOperator`, `PayoutStatus`, `TrustLevel`, `BadgeType`, `DisputeStatus`, `DisputeSeverity`, `DisputeOrigin`, `VisibilityLevel`, `DocType`, `PortfolioImageType`, `ClientTrustLevel`, plus `PaymentRating` and `MessageType` (absent from the target).

Enum members: `BookingStatus.IN_PROGRESS`; `TransactionType.PAYOUT`, `REFUND`; `TransactionStatus.FAILED`; `NotificationType.BOOKING_STARTED`, `PAYMENT_RECEIVED`, `CERTIFICATION_VERIFIED`, `BADGE_EARNED`, `JOB_REQUEST_NEW`, `QUOTE_RECEIVED`, `QUOTE_ACCEPTED`, `QUOTE_DECLINED`, `FINAL_OFFER_RECEIVED`, `FINAL_OFFER_ACCEPTED`, `FINAL_OFFER_DECLINED`.

Fields on kept models: `User.city`, `address`, `latitude`, `longitude`, `isVerified`, `clientScore`, `clientTrustLevel`, `onboardingStep`, `onboardingDraft`; `Provider.profession`, `experience`, `hourlyRate`, `videoUrl`, `languages`, `totalReviews`, `totalJobs`, `responseTime`, `isPremium`, `premiumExpiry`, `onboardingCompleteAt`; the old `Booking`, `Review`, `ClientReview`, `Conversation`, `Message`, `Transaction`, `AvailabilityException` and `VerificationDoc` shapes are replaced by the target shapes (for example `Conversation.user1Id/user2Id` → `clientId/providerId`; `VerificationDoc.url/fileSize/mimeType/reviewedBy` → `storagePath/bytes/mime/reviewedById`, now `@@unique([providerId, kind])`).

#### Added models and enums

Models: `Place`, `PlaceSuggestion`, `ReferenceItem`, `ProviderSkill`, `ProviderReference`, `ProviderMedia`, `AvailabilityRule`, `Report`, `Block`, `ContactMessage`, `Address`. Rebuilt to the target shape: `User`, `Provider`, `Subcategory` (`parentId` tree), `AvailabilityException`, `Booking`, `Review`, `ClientReview`, `Transaction`, `Conversation`, `Message`, `VerificationDoc`.

Enums: `PremiumTier`, `PlaceKind`, `SuggestionStatus`, `ReferenceType`, `MediaKind`, `ReportTargetKind`, `ReportStatus`, `ContactStatus`, `AddressLabel`; `NotificationType` gains `VERIFICATION_UPDATED` and `PLACE_SUGGESTION_RESOLVED`.

Unchanged: all launch-lead models and enums, `Category` (plus `skills` back-relation, minus redundant indexes), `Notification`, `ActivityLog`, `SystemSetting`, `UserRole`, `VerificationStatus`, `VerificationDocKind`, `VerificationDecision`.

#### Demo data shape (for 02, 05–08 and the 10 smoke)

- Providers publish on the deepest node, with 2–3 category-scoped skills, free skills, languages and modes, indicative price (CDF, or XAF in Congo), 3 image media (picsum), Mon–Fri `08:00–12:00` and `13:00–17:00`, 60 min slots and 15 min buffer. Tiers: 2 ELITE, 2 BOOSTED, 2 VERIFIED, 9 FREE. Status: 13 VERIFIED, 2 PENDING. Provider 1 has a closed day in about 12 business days; provider 2 has an open Saturday exception `09:00–13:00`.
- 36 bookings: 6 PENDING (09:15 local), 5 CONFIRMED (14:15 local), 21 COMPLETED, 4 CANCELLED. All sit on real slots in the provider timezone, on weekdays, and never collide. There are 18 priced completions with matching EARNING transactions (paid → COMPLETED, unpaid → PENDING), plus 1 BONUS.
- 15 reviews (one per provider, 5 with a reply) and 8 client reviews. 6 completed bookings are left unreviewed for the `/avis` "À évaluer" list. `ratingAvg`, `ratingCount` and `completedJobs` are computed from the seeded rows.
- 8 conversations with consistent unread counters, 68 notifications carrying `{ bookingId | conversationId | reviewId }`, 1 OPEN report, 1 block (the pair shares no booking or conversation), 3 contact messages, 4 addresses, 1 pending place suggestion.

#### Commands and results

| Command | Result |
| --- | --- |
| `prisma validate`, `prisma format`, `prisma generate` | Pass. The generated client has 33 models and no removed identifier |
| `prisma migrate deploy` on an empty Postgres 16 (`kayu-postgres`) | `0_init` applied |
| `prisma migrate deploy` on an empty Postgres 18.6 (temporary `postgres:18-alpine` container) | `0_init` applied; `migrate status` up to date; `migrate diff` against the schema is empty |
| `pg_dump --schema-only` of the 7 lead tables and enum labels: old 6-migration chain vs new `0_init` | Identical except the one index rename logged above |
| `migrate diff` DB vs schema | Old chain: pending `RenameIndex` (latent drift). New baseline: empty |
| `node --test … launch-leads.migration-integrity.spec.ts` | 2/2 pass. A one-token edit to a lead column fails both tests; the restored file hashes back to the pin |
| `test:launch-leads:ci` with `LAUNCH_LEADS_TEST_DATABASE_URL` on a fresh `0_init` database | 1/1 pass |
| `test:launch-leads:orphan-upgrade:ci` with `…/kayu_test_launch_leads_orphan_upgrade` | 1/1 pass |
| Lead unit specs (contract, intake protection, service, funnel, integrity) + `prisma/seed.guard.spec.ts` | 28/28 pass |
| `pnpm db:deploy && pnpm db:seed` on an empty `kayu_kyou01_reset` database, then `pnpm db:seed` again on the populated database | Both pass and print counts for all 33 models. Consistency SQL checks: aggregates, leaf subcategories, skill scoping, reference kinds, block isolation, exception/booking collisions and earnings all return no mismatch. A duplicate CONFIRMED on an active slot is rejected by `booking_active_slot_unique`; a CANCELLED row on the same slot is accepted |
| `pnpm db:reset` (literal, `DATABASE_URL` → local disposable `kayu_kyou01_reset`, run with the owner's explicit consent) | Pass: `0_init` applied, "Database reset successful". The seed ran twice (once from `migrate reset`, once from `db:seed`) and both runs printed counts for all 33 models. `migrate status` is up to date; the 29 Supabase demo users were re-linked, none created |
| `tsc -p apps/backend/tsconfig.json --noEmit` | 951 errors, all in modules that 02 deletes or rewrites (dashboard 206, admin 164, providers 152, bookings 99, reviews 58, onboarding 51, quotes 46, job-requests 34, messaging 31, favorites 25, identity 23, verification/stats/earnings 16 each, categories 7, harness 4, settings 3). `launch-leads`: 0. Expected per README Iteration A |

#### Handover notes and risks

- **02:** `Booking.client`, `Booking.provider`, `Review.client/provider` and `ClientReview.client/provider` are `ON DELETE RESTRICT` (target has no `onDelete`), so `DELETE /me` must remove bookings and reviews before the user or provider row. `Place.parentId` is RESTRICT: merges and deletes must handle children first. `ReferenceItem.mergedIntoId`, `Provider.pricingCurrencyId/pricingUnitId`, `Report.targetId`, `PlaceSuggestion.resolvedPlaceId` and `Booking.cancelledById` have no FK (as specified), so services validate them. `backend test:launch` still lists deleted-module specs.
- **03:** `packages/schemas/src/{dto,enums,models,job-requests,quotes,verification}.ts` still contain removed domains. The "not in `packages/schemas`" acceptance line is 03's to close.
- **10, lead restore (blocker for runbook C):** every restored `ProviderLead.primarySubcategoryId`, `ProviderLeadAdditionalSubcategory` and `ClientWaitlistLeadSubcategory` row points at a pre-reset `Subcategory` id. The K-YOU reseed creates new ids, so a plain data restore fails on the FKs. The runbook needs an old→new subcategory mapping (export old `Subcategory` id/slug alongside the leads) and must record unmapped ids in `LeadTaxonomySnapshotOrphan`, which this baseline keeps for exactly that.
- **10, reference data on prod:** runbook C says "Do not seed prod", but `seed.ts` is the only source of places, taxonomy, references and settings, and the campaign form reads the taxonomy. Prod needs a non-destructive reference-only seed path (script owned by 02 / 10).
- **10:** `apps/backend/prisma/launch-leads-taxonomy-preflight-{capture,remediate}.sql` and the preflight section of `docs/DEPLOYMENT.md` target the squashed chain and are now unused. Remove or rewrite them with the runbook.
- **Local dev:** the existing `kayu` database carries the old migration history, so `migrate deploy` fails against it; run `pnpm db:reset` after switching to this branch. The generated Prisma client in `node_modules` now matches this schema; run `pnpm --filter @kayu/backend prisma:generate` after switching back to `main`. `apps/backend/.env` sets `SEED_SUPABASE_USERS=true`: the seed re-linked the 29 existing Supabase demo users and created none (all auth ids match the current `kayu` database).

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
