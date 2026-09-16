# KAYOU × K-YOU UX Refactor — Progress

## Status Summary

Created: 2026-09-16

Overall status: **Iteration A in progress (01, 02 and 03 done; 02 swaps to the shared packages; 04 next)**

KAYOU adopts the K-YOU product model and visual system across backend, shared packages and the Next.js web app. The brand stays KAYOU. The Expo app is frozen. Launch-lead data and endpoints are preserved through a full database baseline reset. Work happens on `refactor/kyou-ux` and merges to `main` only after workstream 10.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Design Contract | Done | Planning | Frozen 2026-09-16 |
| 01 — Domain And Schema Reset | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/01-schema` merged into `refactor/kyou-ux`; all acceptance commands pass (see evidence) |
| 02 — Backend Modules | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/02-backend` merged into `refactor/kyou-ux`; every doc endpoint implemented and exercised over HTTP on Postgres; contract handed over in `handover/02-backend-contract.md` |
| 03 — Shared Packages | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/03-packages` merged into `refactor/kyou-ux`; every package gate green; web type-check red until 04–08 as planned; contract handed over in `handover/03-shared-packages.md` |
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
| 2026-09-16 | (02) Request DTOs are drafted as Zod in `apps/backend/src/common/contract/` and wired through `contractPipe("Name")` | 02 may not edit `packages/schemas`; 03 copies the files under the same names, then `contractPipe` switches to a lazy `@kayu/schemas` import in one place |
| 2026-09-16 | (02) Response envelopes: none, except endpoints the doc marks unchanged (`GET /me`, `PATCH /me/profile`, `POST /me/accept-terms` → `{ success, user }`; `POST /me/avatar`; `GET /distance`; `/pro/verification/*`; `/admin/verification/*` keeps `{ success, submissions, pagination, stats }`). Mutations return the resource; deletes return `{ ok: true }`; action POSTs return 200 | One predictable rule for 03, without breaking the "unchanged" promises |
| 2026-09-16 | (02) `GET /notifications` follows the global list envelope `{ items, total, page, limit }` plus `unreadCount` | The doc's "every list endpoint" rule wins over "unchanged" |
| 2026-09-16 | (02) Business errors carry a machine `code` (`SLOT_TAKEN`, `BLOCKED`, `ACCOUNT_SUSPENDED`, `LAST_ADMIN`, … full table in the handover) | 03 surfaces `ApiError.code`; the web matches codes, not messages |
| 2026-09-16 | (02) `GET /me` also returns 403 `ACCOUNT_SUSPENDED` (with `suspendedReason`) for suspended users | Contract §2: every API call returns 403; the web renders the notice from the error body |
| 2026-09-16 | (02) Public endpoints that adapt to the viewer use a new `OptionalActorGuard`: a missing or invalid token means anonymous, a suspended account is still refused | Contact gating and block exclusion need the viewer without forcing sign-in |
| 2026-09-16 | (02) Hidden providers and suspended owners return 404 on profile, availability and public reviews, except to the owner and admins; blocked pairs still see the profile with `blocked: true` but are excluded from search | Owners must reach their own hidden profile to edit it; the doc only excludes blocked pairs from search |
| 2026-09-16 | (02) Contacts: owner and admins always; signed-in viewers unless `contacts_require_premium` is on and the effective tier is `FREE`; `feat_whatsapp` off nulls `contacts.whatsapp`. Effective tier treats a past `premiumUntil` as `FREE`; the recommended sort still orders by the stored tier | Server-side enforcement of the flags; expiry-aware sorting would need raw SQL for little gain |
| 2026-09-16 | (02) Booking address is optional: `addressId` or inline fields, never both | K-YOU bookings have no address; 03's plan said "exactly one" |
| 2026-09-16 | (02) Booking detail hides `commissionPct`, `commissionAmt`, `providerNetAmt` and `providerNotes` from clients | Commission is internal |
| 2026-09-16 | (02) Admin role changes are limited to CLIENT ⇄ ADMIN on users without a provider row; suspending hides the provider, unsuspending leaves it hidden until an admin unhides it | Contract §2 has no downgrade path; 08 needs the Client ⇄ Admin toggle |
| 2026-09-16 | (02) Contact form and report rate limits use a new in-memory `RateLimiterService` (5 per IP per 15 min; 10 per user per hour), not `LaunchIntakeProtectionService` | The launch bucket helper is private and gated by the launch flags, and launch-leads internals are out of bounds. Buckets are per process (one Render instance today) |
| 2026-09-16 | (02) Place suggestions are capped at 10 pending per user (409 `LIMIT_REACHED`) rather than rate limited; approving a duplicate links the existing place | A pending cap bounds the admin queue directly |
| 2026-09-16 | (02) Storage purposes `avatar`, `media`, `attachments`, `verification` map to buckets `avatars`, `provider-media` (new, public), `message-attachments` (new, private), `verification-docs`; private files are read through `GET /me/media/sign-read` (5-minute URLs) | Chat attachments and KYC files must not share a bucket or be public; bucket creation handed to 10 |
| 2026-09-16 | (02) Admin reads added beyond the doc's rows: `GET /admin/places/:id` (with chain), `GET /admin/references/:id`, `GET /admin/subcategories` (`{ items }`, flat) and `GET /admin/subcategories/:id` | The doc's `GET/POST/PATCH` shorthand implies them; 08's editors need single-item reads |
| 2026-09-16 | (02) `GET /geocode` takes `?q` or `?placeId` and returns 404 when nothing is found instead of defaulting to Kinshasa | A silent default puts pins in the wrong city |
| 2026-09-16 | (02) The launch harness runs the real modules over HTTP on a disposable Postgres database (`LAUNCH_HARNESS_DATABASE_URL`, name `kayu_(ci|test)_launch_harness`), faking only Supabase; it skips without the URL like the launch-lead integration specs | An in-memory Prisma fake cannot prove transactions, row locks, the partial slot index or JSON attachment queries; CI must set the URL (handed to 10) |
| 2026-09-16 | (02) Removed and rewritten module sources were moved out of the tree, not edited in place; account deletion also recomputes `completedJobs` for other affected providers | Clean rewrite on the new schema; K-YOU only recomputed ratings, which left job counts stale |
| 2026-09-16 | (03) The K-YOU palette is exported as `palette` (hex), `paletteHsl` (§9 HSL verbatim) and `themeCssVariables` (04's `@theme` entries), not as `colors` | `colors` is the frozen v1 alias that `apps/mobile/src/lib/theme.ts` imports; two exports cannot share the name |
| 2026-09-16 | (03) The legacy block in `tokens.ts` also keeps the v2 `tokens` object (with `portfolio`, `categoryTint`), `CategorySlug` and the photo-forward card helpers moved out of the deleted `cards.ts` | `apps/mobile` and `packages/ui/src/mobile` import them from `@kayu/ui`; the only mobile edits are three `../cards.js` → `../tokens.js` imports. Mobile type errors mentioning `@kayu/ui`: 0 |
| 2026-09-16 | (03) `elevation.brand` is `0 16px 40px -12px hsl(172 60% 32% / .5)` | §9 (primary glow) and 04 agree; the 03 doc's `rgba(21,89,76,.5)` is a different, darker colour |
| 2026-09-16 | (03) CSS variables use §9's HSL; `palette` keeps the 03 doc's hex values for inline styles; violet and blue status tones get a `-200` border like the other tones | The hexes are close approximations of the HSL, not exact conversions; one `{ bg, fg, border }` shape per tone |
| 2026-09-16 | (03) Request schemas are 02's drafted contract under the same names, including where they differ from the 03 doc (Admin-prefixed category DTOs, extra query schemas, `MediaInputSchema` with `id` keep, optional booking address, `q` on the verification queue) | 02 implemented and tested those; JSON Schema output is identical for all 110 schemas |
| 2026-09-16 | (03) `SCHEDULE_LIMITS`, `YOUTUBE_HOSTS`, `validateSchedule` and `parseYouTubeUrl` live in `@kayu/utils` and are re-exported by `@kayu/schemas`, whose `ScheduleInputSchema` calls `validateSchedule`; `@kayu/schemas` now depends on `@kayu/utils` | One implementation for the backend pipe, the backend services and the web schedule editor; utils is the lowest layer |
| 2026-09-16 | (03) `localSlotToInstant` returns an ISO string | 03 doc signature; 02 wraps it in `new Date()` when it swaps (noted in the handover) |
| 2026-09-16 | (03) A DTO or params name used as a type is `Wire<typeof Schema>` (optional when the schema accepts it missing, parsed value type); `…Input` / `…Query` stay 02's parsed types | `z.input` types every coerced field (`page`, `lat`, boolean flags) as `unknown`, which would leave the typed client untyped |
| 2026-09-16 | (03) The lead DTOs keep a file-local `IdSchema = z.string().min(1)`; marketplace `IdSchema` adopts 02's `trim().min(1).max(64)` | The lead contract stays byte-for-byte and behaviour-identical |
| 2026-09-16 | (03) `KIN_COMMUNES`, `KIN_COMMUNES_TUPLE` and `KinCommune` stay exported from `launch-leads.ts` | The 03 doc moves them there and the campaign form imports them; the acceptance grep's `KIN_COMMUNES` term therefore matches that file only |
| 2026-09-16 | (03) `ApiErrorResponseSchema` is the real error body (`statusCode?`, `code?`, `message`, `error?`, `errors?` plus extras) and `API_ERROR_CODES` lists 02's 22 codes; `ApiError.code` is typed with them | The old `{ success: false, error }` shape was never returned |
| 2026-09-16 | (03) `@kayu/api` adds `adminApi.place`, `reference`, `subcategories`, `subcategory`, and `referencesApi.list` takes an optional `params` third argument | 02's extra admin reads; reference lists need `q` and paging |
| 2026-09-16 | (03) Web primitives drop the presets with inline French copy (`NoBookingsEmpty`…, `NetworkErrorState`…, `FormErrorBanner`); `EmptyState` / `ErrorState` take `description` and an `action` node; `Input.label` is required (`hideLabel` for search bars); `Button` defaults to `type="button"`; `I.badgeCheck` is `I.verified` (Lucide's `Verified` alias) | Contract §12 keeps copy in `apps/web/src/copy`; §11 rule 8 requires visible labels; the old icon name tripped the removed-domain grep |
| 2026-09-16 | (03) Button radii follow §9: primary and gold are pills, secondary, ghost and danger use the 14 px field radius | 04 describes `.secondary-action` as a pill; flagged below |
| 2026-09-16 | (03) The root `package.json` comment about the mobile freeze is a top-level `"//"` key | JSON has no comments; `"//"` is the npm convention |

## Open Questions

- Should client-side geolocation sorting ("À proximité") stay available when no place filter is chosen, or should distance sorting require a chosen place?
- Should admins be able to set `premiumTier` and `premiumUntil` before any paid plan exists, or should the tier stay `FREE` for everyone until a purchase flow ships?
- Will a provider → client downgrade ever be needed? The UI offers none; the database allows an admin SQL change only.
- Do `html2canvas` and `jspdf` stay for the admin member CV export, or is a print stylesheet enough?
- When `feat/agent-concierge-phase-1` is rebased after this refactor, should the concierge be surfaced in the K-YOU navigation, and if so on which tab?
- Should the campaign form move from `KIN_COMMUNES` strings to Place ids once the closed-beta folder picks it up?
- (01) What are the public `contact_phone`, `contact_email` and `contact_website` values? The 01 doc says "current footer values", but the current footer has none, so they are seeded empty rather than invented.
- (01 → 05) `Category.image` is seeded empty. K-YOU's category photos are local generated assets for six categories only; 05 decides which photography ships and sets the paths.
- (02 → 10) The 01 handover asked for a non-destructive reference-only seed for prod (places, taxonomy, references, settings). 02 did not add it: the seed files are 01's. It is still needed before the prod reset.
- (02) Should unsuspending a user also unhide their provider automatically? Today the admin unhides explicitly.
- (02) Should the recommended search sort ignore expired premium tiers? It currently orders by the stored tier.
- (02 → 08) Deactivating a category or level-2 node does not cascade `isActive` to its children in the admin tree (the public tree hides them anyway). Confirm this is the wanted admin view.
- (03 → 02) Swap `contractPipe` to `@kayu/schemas` and move `providers/schedule.ts` / `youtube.ts` to `@kayu/utils` (steps and the `localSlotToInstant` ISO change in `handover/03-shared-packages.md`).
- (03 → 04) Secondary actions: §9 says 14 px radius, 04 §A says a bordered pill. The `@kayu/ui` Button follows §9; 04 decides and either side adjusts.
- (03 → 04) Primitives read `var(--font-heading)` / `var(--font-body)` before the token font stacks; `next/font` family names are hashed, so 04's `@theme` must keep defining those two variables.
- (03 → 10) `pnpm test:launch` and the CI "Type-check" and "Web production build" steps stay red at `@kayu/web` until 04–08 replace the old API calls (387 web type errors after 03, expected per README Iteration A).
- (03) `packages/ui/package.json` still lists `@kayu/schemas` although no UI file imports it any more; left alone because the file is outside 03's owned paths.

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

Status: Done (2026-09-16). Branch `kyou-ux/02-backend` from `refactor/kyou-ux` at `0af393b`, reviewed by the owner and merged into `refactor/kyou-ux` locally (not pushed).

#### What changed

- **Removed modules**: `job-requests`, `quotes`, `favorites`, the final-offers controller, recent addresses, provider strength, trending stats, visibility settings, dispute routes. `grep -r "FinalOffer\|JobRequest\|Quote\|Payout\|TrustScore\|Dispute\|Favorite\|VisibilitySettings" apps/backend/src` returns nothing.
- **Rewritten on the 01 schema**: `providers`, `onboarding`, `bookings`, `reviews`, `earnings`, `dashboard`, `messaging`, `identity` (plus `account.service.ts` for `DELETE /me`), `categories`, `stats`, `settings`, `geo`, `storage` (four purposes, signed reads, best-effort deletion), `notifications` (trimmed types, list envelope), `verification` (new doc columns, no disputes), `admin` (six section controllers/services).
- **New modules**: `places`, `references`, `safety` (reports, blocks, `SafetyService`), `contact`, `addresses`, `activity` (`ActivityLogService`), `supabase` (the `SUPABASE_CLIENT` provider, so the harness can swap it).
- **Common**: `common/contract/*` (local Zod DTOs + `contractPipe`), `common/http/{errors,pagination}.ts` (coded errors, list envelope), `common/util/{db,people}.ts` (row locks, unique-violation check, names, slugs), `common/rate-limit/RateLimiterService`, `OptionalActorGuard`, `ActorGuard` 403 body with `suspendedReason`, `AllExceptionsFilter` sets `Retry-After`.
- **Composition**: `src/app.modules.ts` lists every feature module once for `AppModule` and the harness; `app.module.ts` imports `SupabaseModule` + `CommonModule` + that list.
- **Shared domain logic ported from K-YOU**: `providers/schedule.ts` (slots, local slot ↔ instant, summaries) and `providers/youtube.ts` (deceptive-host-safe parser). Both are pure and ready for 03 to move into `@kayu/utils`.
- **Tests**: 34 unit spec files written for 02 (service specs with hand-rolled fakes), `bookings.concurrency.spec.ts` and a rewritten `src/test/launch/launch-critical.harness.spec.ts`, both on real Postgres.
- **Scripts** (`apps/backend/package.json`): `test:launch` spec list rewritten; `test:providers`, `test:bookings`, `test:bookings:ci`, `test:reviews`, `test:messaging`, `test:admin`, `test:launch:harness`, `test:launch:harness:ci` added; `test:job-requests`, `test:quotes`, `test:onboarding` removed.
- **Docs**: `handover/02-backend-contract.md`, `handover/02-example-responses.json`, `handover/02-to-10-test-mode-session-hook.md`.

#### Endpoint contract

All 111 marketplace routes, with access and success status generated from the Nest metadata, are in `handover/02-backend-contract.md`. Every row of the 02 doc exists. The harness calls every one of them over HTTP (success and the main error cases), so each route's guards, validation pipe and status code are proven against Postgres, not only against fakes.

#### Launch harness smoke (13 tests, real Postgres)

OTP user provisioned → accepts terms → signs a media upload → publishes a provider (schedule, image, YouTube video, references, pricing) → a second user completes their profile, reads settings, the category tree, places, references and stats, searches by category, place and distance → anonymous profile has locked contacts, signed-in profile shows them → messages the provider, with an image attachment readable by the participant through a signed URL (stranger 403) and unread counters on both sides → books the first real slot (anonymous 401, provider 403, second client 409 `SLOT_TAKEN`, invalid body 400) → provider confirms (client 403, early complete 409) → completes with 50 000 CDF paid (commission 5 000, net 45 000, earnings summary, EARNING row, dashboard) → client reviews (duplicate 409), provider replies, rating aggregates update, provider rates the client, notifications list the events → blocks stop messaging and booking both ways and hide search results → report, contact form, admin overview/bookings/reports, report resolved, hero title edited and served by `/settings/public`, audit journal and health → KYC: four documents uploaded, optional one removed, submitted, admin approves each through the queue, provider verified → place suggestion approved and notified, address book with default demotion, message soft delete tombstone, catalog reads, referenced subcategory delete 409 → every remaining admin and self-service write (schedule, media replace with storage removal, availability pause, avatar, geocode, notes, client and admin cancels, review hide/delete, conversation and message moderation, contacts, category/subcategory/place/reference CRUD and merges, suggestion reject) → suspension returns 403 `ACCOUNT_SUSPENDED` with the reason, hides the provider (self-action 400) → account deletion removes provider, bookings, conversations, storage objects and the Supabase auth user; the same token then provisions a fresh CLIENT; an admin gets 409.

#### Commands and results (2026-09-16, local Postgres 16 on 5433)

| Command (from `apps/backend`) | Result |
| --- | --- |
| `pnpm type-check` | Pass |
| `pnpm build` (`prisma generate && nest build`) | Pass |
| `pnpm test:launch` | 221 tests: 220 pass, 0 fail, 1 skipped (booking race without its database URL; the harness suite also skips without its URL) |
| `pnpm test` (every spec) | 231 tests: 228 pass, 0 fail, 3 skipped (the three database-backed specs) |
| `LAUNCH_HARNESS_DATABASE_URL=…/kayu_test_launch_harness pnpm test:launch:harness:ci` | 13/13 pass; the disposable database is created, migrated with `0_init` and dropped |
| `BOOKINGS_TEST_DATABASE_URL=…/kayu_test_bookings pnpm test:bookings:ci` | 1/1 pass: two concurrent creates → one PENDING, one 409 `SLOT_TAKEN`; a cancelled booking frees the slot |
| `pnpm test:launch:harness:ci` with no URL | Fails (exit 1), as a CI gate must |
| `LAUNCH_LEADS_TEST_DATABASE_URL=…/kayu_test_launch_leads pnpm test:launch-leads:ci` | 1/1 pass |
| `LAUNCH_LEADS_ORPHAN_UPGRADE_TEST_DATABASE_URL=…/kayu_test_launch_leads_orphan_upgrade pnpm test:launch-leads:orphan-upgrade:ci` | 1/1 pass |
| Removed-domain grep (acceptance criterion) | No match |
| `git diff refactor/kyou-ux -- apps/backend/src/modules/launch-leads apps/backend/prisma packages apps/mobile` | Empty |

#### Handover

- **03**: `handover/02-backend-contract.md` (conventions, error codes, route table, Zod schema list and name differences from 03's plan, response shapes, behaviour notes) and `handover/02-example-responses.json` (real bodies for every route). After 03 publishes the schemas, 02 swaps `contractPipe` to `@kayu/schemas` and deletes `src/common/contract`. `providers/schedule.ts` and `providers/youtube.ts` are ready to move into `@kayu/utils`.
- **10**: `handover/02-to-10-test-mode-session-hook.md` (session hook design, CI steps for `test:bookings:ci` and `test:launch:harness:ci` with their database URLs, two new Supabase buckets). `test:launch` spec list: the `test:launch` script in `apps/backend/package.json`.

#### Risks and follow-ups

- **Web and mobile do not compile** against this backend or the current `@kayu/api`; expected in Iteration A until 03–08 land.
- **Buckets**: `provider-media` and `message-attachments` must exist on Supabase dev and prod with file size limits before this branch is deployed; uploads to them fail until then.
- **Rate limits are in memory**: they reset on restart and are per instance. Fine for one Render instance; revisit before scaling out.
- **Local `dist/`** was rebuilt from this branch by `pnpm build`. Rebuild on `main` before running a compiled backend from there.
- **Prod seed**: the reference-only seed path noted in 01's handover is still open (see Open Questions).

### 03 — Shared Packages

Status: Done (2026-09-16). Branch `kyou-ux/03-packages` from `refactor/kyou-ux` at `18aafba`, reviewed by the owner and merged into `refactor/kyou-ux` locally (not pushed). Contract hand-over: [`handover/03-shared-packages.md`](./handover/03-shared-packages.md).

#### What changed

- **`@kayu/utils`**: new `schedule.ts` (port of 02's `providers/schedule.ts` plus `validateSchedule` and `SCHEDULE_LIMITS`) and `youtube.ts` (`parseYouTubeUrl`, `YOUTUBE_HOSTS`); `toE164`, `formatMoney`, `formatRelativeFr`, `formatSlotLocal`; `getDistanceStatus` / `getDistanceColor` deleted. Tests: `schedule.test.mjs` (the seven K-YOU cases, the seeded demo provider against K-YOU `availableSlots` output, validation), `youtube.test.mjs`, `date.test.mjs`, `toE164` cases in `phone.test.mjs`.
- **`@kayu/schemas`**: `job-requests.ts`, `quotes.ts`, `tasks.ts`, `communes.ts` deleted; `common.ts`, `enums.ts`, `models.ts`, `dto.ts`, `verification.ts` rewritten; `schedule.ts`, `media.ts`, `taxonomy.ts`, `launch-leads.ts` added; depends on `@kayu/utils`.
- **`@kayu/api`**: `endpoints.ts` and `query-keys.ts` rewritten (21 groups, one method per 02 route); `ApiError.code`; query arrays joined with commas.
- **`@kayu/ui`**: `tokens.ts` rewritten (§9/§10 values above a fenced legacy block); `cards.ts` and 22 web components deleted; `Button`, `Input`, `Avatar`, `Icon`, `StarRating`, `Shimmer`, `EmptyState`, `ErrorState`, `InlineAlert`, `Toast` restyled; `index.ts` re-exports tokens only; three `src/mobile` imports re-pointed.
- **Gate**: root `test:launch` per the 03 doc (utils, schemas, api, ui, backend, web; no mobile) with a `"//"` note; CI type-check step commented.
- `pnpm-lock.yaml`: the `@kayu/utils` workspace link for `@kayu/schemas`.

#### Commands and results (2026-09-16)

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/utils test` | 20/20 pass |
| `pnpm --filter @kayu/{utils,schemas,api,ui} type-check` and `build` (from deleted `dist`) | Pass |
| `pnpm test:launch` | Every step passes (utils, schemas, api, ui, backend `test:launch` 221 tests: 220 pass, 0 fail, 1 skipped; backend type-check), then stops at `@kayu/web type-check` with 387 errors on removed API methods and components, expected until 04–08 |
| All 173 bodies of `02-example-responses.json` through the response schemas | 173/173 parse; no returned field is stripped |
| The 110 Zod schemas of `apps/backend/src/common/contract` vs `@kayu/schemas` (`z.toJSONSchema`, input and output) | 220/220 identical, 0 missing; limits and site-setting constants deep-equal |
| `ScheduleInputSchema` refinement on 13 payloads vs 02's draft | Identical on valid and rule-breaking payloads; on the two payloads with a bad time or date format, 03 no longer adds the overlap or duplicate issue computed from the bad value |
| Every `@kayu/api` method called against a recording `fetch`, compared with the 02 route table | 111/111 routes covered, 0 extra, 0 duplicates (`GET /places` serves `list` and `byIds`) |
| `LAUNCH_LEADS_TEST_DATABASE_URL=…/kayu_test_launch_leads_03 pnpm --filter @kayu/backend test:launch-leads:ci` (disposable database, `0_init` applied, dropped afterwards) | 1/1 pass |
| `node --test … launch-leads.contract.spec.ts` | 5/5 pass |
| Lead DTO block, lead types, communes and lead enums vs `main` | Byte-identical |
| `TaxonomySeedSchema` on K-YOU `shared/taxonomy.json` | Valid: 19 roots, 213 nodes |
| Removed-domain grep of the 03 doc over `packages/schemas/src packages/api/src packages/ui/src/web packages/ui/src/tokens.ts` | Only `KIN_COMMUNES*` in `launch-leads.ts` (see Decisions Log) |
| `grep -nE "Inter\|JetBrains\|#0EA5E9\|#FB7185" packages/ui/src/tokens.ts` above the legacy banner | None |
| `git diff main --stat -- apps/mobile` | Empty |
| `pnpm --filter @kayu/mobile type-check` | Before 03: 6 errors. After: 181, none mentioning `@kayu/ui`; the 175 new ones are removed `@kayu/api` / `@kayu/schemas` names (accepted by the mobile freeze) |

#### Risks and follow-ups

- **Web does not compile** against the new packages until 04–08; `test:launch` and CI stay red at the web step until then.
- **02 still validates with its local contract copy** until it swaps `contractPipe`; the parity checks above show no behaviour change on valid or rule-breaking input.
- **`Wire` types** mirror the schemas; a new coerced or defaulted field needs no manual type, but a schema with a top-level `.default({})` (`CompleteBookingDto`, `CancelBookingDto`) types as an object, so the client methods default the argument to `{}`.

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
