# KAYOU × K-YOU UX Refactor — Progress

## Status Summary

Created: 2026-09-16

Overall status: **Iteration C in progress (01–09 done; 10 next)**

KAYOU adopts the K-YOU product model and visual system across backend, shared packages and the Next.js web app. The brand stays KAYOU. The Expo app is frozen. Launch-lead data and endpoints are preserved through a full database baseline reset. Work happens on `refactor/kyou-ux` and merges to `main` only after workstream 10.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Design Contract | Done | Planning | Frozen 2026-09-16 |
| 01 — Domain And Schema Reset | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/01-schema` merged into `refactor/kyou-ux`; all acceptance commands pass (see evidence) |
| 02 — Backend Modules | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/02-backend` merged into `refactor/kyou-ux`; every doc endpoint implemented and exercised over HTTP on Postgres; contract handed over in `handover/02-backend-contract.md` |
| 03 — Shared Packages | Done | Claude (agent), 2026-09-16 | Owner-reviewed; `kyou-ux/03-packages` merged into `refactor/kyou-ux`; every package gate green; web type-check red until 04–08 as planned; contract handed over in `handover/03-shared-packages.md` |
| 04 — Web Shell And Design System | Done | Claude (agent), 2026-09-16 | Branch `kyou-ux/04-shell`, uncommitted pending owner review; type-check, build, redirects, overflow, reduced-motion and keyboard checks green; contract handed over in `handover/04-web-shell.md` |
| 05 — Web Public Screens | Done | Claude (agent), 2026-09-16 | Branch `kyou-ux/05-public`, uncommitted pending owner review; type-check, build, SSR, overflow (30/30), 22 browser interaction checks and the signed-in API paths green; contract handed over in `handover/05-web-public-screens.md` |
| 06 — Web Auth And Provider Onboarding | Done | Claude (agent), 2026-09-16 | Branch `kyou-ux/06-auth-onboarding`, uncommitted pending owner review; type-check, production build, redirects, 76 browser checks (320/390/1440, reduced motion) and an end-to-end wizard publish green; contract handed over in `handover/06-web-auth-and-onboarding.md` |
| 07 — Web Client And Provider Spaces | Done | Claude (agent), 2026-09-17 | Branch `kyou-ux/07-spaces`, uncommitted pending owner review; type-check, production build, 75/76 browser checks (the one failure is the missing `message-attachments` bucket) and 48/48 reduced-motion renders green; contract handed over in `handover/07-web-client-and-provider-spaces.md` |
| 08 — Web Admin Console | Done | Claude (agent), 2026-09-17 | Uncommitted on `refactor/kyou-ux` pending owner review; type-check, production build, 64/64 browser checks and 42/42 reduced-motion renders green; contract handed over in `handover/08-web-admin-console.md` |
| 09 — Launch Campaign Restyle | Done | Claude (agent), 2026-09-17 | Uncommitted on `refactor/kyou-ux` pending owner review; five campaign test files 28/28, type-check, production build; DOM id/name inventory, tab order and funnel events identical across 17 form states; 43/43 campaign-mode browser checks; smoke evidence handed over in `handover/09-launch-campaign.md` |
| 10 — QA, Hosting Move And Release | Not started | TBD | Rewritten 2026-09-17 for Railway + Supabase; finish last |

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
| 2026-09-16 | (04) Every pre-refactor route folder (`admin`, `auth`, `book`, `bookings`, `categories`, `dashboard`, `design`, `design-system`, `home`, `messages`, `pro`, `providers`, `quotes`, `review`, `services`, `HomePageClient`) and the component folders `booking`, `bookings`, `dashboard`, `distance`, `layout` (old), `map`, `notifications`, `pro`, `profile`, `provider-profile`, `ratings`, `services`, `settings` are deleted now, not "when the replacement lands" | All 387 web type errors after 03 sat in those files; the 04 definition of done needs a green type-check and build with placeholder pages. Every K-YOU screen is rebuilt anyway; the old code stays in git at `36cc284` for 05–08 to consult |
| 2026-09-16 | (04) Placeholder pages exist for every route in the navigation matrix and redirect table (`RoutePlaceholder` / `CanvasPlaceholder`, guarded like the real screens), plus a placeholder Home that exercises the shell | Dock and navbar links must resolve and the three viewports must render Home; 05–08 delete each placeholder as they land |
| 2026-09-16 | (04) Route groups are `(shell)/` (renders `Layout`) and `(canvas)/` (renders `AuthCanvas`); `/bienvenue` sits outside both because it is the one canvas with the top bar; `app/not-found.tsx` wraps `Layout` itself | Root `not-found` renders outside route groups; a group for one route is noise. 05–08 place folders directly under `(shell)/` |
| 2026-09-16 | (04) `AuthProvider` always renders children; `AuthGate` swaps in `SuspendedScreen` / `AcceptTermsScreen`; the 32 px boot ring is shown only by guards while `status === "loading"` | A provider-level loading screen would kill SSR for `/` and `/prestataire/[id]` (05 requires SSR); contract §11 rule 9 still holds (one full-page loader, auth bootstrap only) |
| 2026-09-16 | (04) The unread bell count comes from `GET /notifications?limit=1` (`unreadCount`, polled every 60 s), not from `/me`; `AuthUser` has no `unreadNotifications` | `/me` does not return a counter (02 contract). 02 may add one later; then `useUnreadNotifications` reads it instead |
| 2026-09-16 | (04) `RequireOwnerOrAdmin` takes `providerId` and matches `me.provider.id` | No extra fetch; the 04 doc's `providerOwnerId` would need the provider row first |
| 2026-09-16 | (04) Secondary actions use the 14 px field radius (`.secondary-action`, `Button variant="secondary"`); primary and gold actions are pills | Contract §9 wins over the 04 §A table; closes the 03 → 04 open question. Navbar "Connexion / Déconnexion" stay pills as in K-YOU |
| 2026-09-16 | (04) `tw-animate-css` stays imported; `@theme` also defines `--color-popover*`, `--color-card-foreground`, `--color-secondary-foreground`, `--color-destructive-foreground` and `--font-sans` | The kept radix primitives (`sheet`, `dropdown-menu`, `alert-dialog`) use `animate-in/out` and `bg-popover`; reduced motion disables `animate-in/out` too |
| 2026-09-16 | (04) `components/ui` keeps `button`, `badge`, `card`, `avatar`, `dropdown-menu`, `sheet`, `alert-dialog`, `label`, `scroll-area`, `sonner`; the radix `toast`/`toaster` pair, `hooks/use-toast.ts` and `next-themes` are removed | Toasts go through sonner (`<Toaster>` mounted once in `MarketplaceProviders`); the radix toast was a second, unused toast system |
| 2026-09-16 | (04) Deleted dependencies: unused `@radix-ui/*`, `@dnd-kit/*`, `@tanstack/react-table`, `recharts`, `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-day-picker`, `vaul`; added devDependency `playwright` | Nothing imported them after the ui prune; `scripts/overflow-check.mjs` needs Playwright (Chrome via `PW_CHANNEL=chrome`, no browser download) |
| 2026-09-16 | (04) Campaign-mode routing (`src/lib/campaign-routing.ts`) intercepts the new public paths `/rechercher`, `/prestataire`, `/services` and the auth pages `/login`, `/register`; `campaign-routing.test.mjs` updated to the same 9 tests; `launch/campaign-data.ts` calls `categoriesApi.getTree()` and maps level-2 `children` to `subcategories` | The old prefixes now 308 before the proxy runs, so campaign mode would have leaked the marketplace; `getHierarchy` no longer exists after 03. 09 verifies the tree mapping; the five campaign test files still pass (28/28) |
| 2026-09-16 | (04) The K-YOU two-figure mark is ported as a hand-drawn SVG in the token colours (`public/logo.svg`, inline `LogoMark`, `src/app/icon.svg`, `src/app/apple-icon.png`) with a Sora "KAYOU" wordmark; the six blue `kayou-logo*.png` files are deleted | Owner asked for the K-YOU logo and the removal of the blue one; a vector redraw in `primary` / `accent` scales to every size and follows the tokens instead of copying the generated PNG. `/launch*` already loads `/logo.svg`, so the campaign pages pick up the mark without a 09 edit |
| 2026-09-16 | (04) Copy modules seeded: `copy/shell.ts` (04's `common.ts` in the handoff), `copy/errors.ts` (22 backend codes + `errorMessage()`), `copy/dev.ts` | Doc F names the file `shell.ts`; `errors.ts` is shared by every screen so it ships with the shell |
| 2026-09-16 | (05) `/premium` stays under `(canvas)/` outside the shell, as 04 placed it | Contract §8 (frozen) lists `/premium` on the auth canvas; the 05 doc's "inside Layout" note contradicts it. Moving it is a two-line change if the owner prefers the doc |
| 2026-09-16 | (05) No second `MaintenanceBanner` on the home page | 04's `Layout` already renders the banner above every route's content; a page-level card would show twice |
| 2026-09-16 | (05) Category photography for the bento ships as six local JPEGs under `public/images/home/` (plus `hero.jpg`), used when `Category.image` is empty | Closes the 01 → 05 open note; the K-YOU generated images are assets, not code, and `Category.image` from the admin overrides them when set |
| 2026-09-16 | (05) Site settings are fetched on the server for `/` and passed as props; the profile and contact pages read `useSiteSettings()` | The doc's `SiteContentProvider` does not exist (04 ships a client query); server props avoid a hero-copy flash on the one page that must SSR its overrides |
| 2026-09-16 | (05) Category colour classes are duplicated in `apps/web/src/lib/dto/categoryColors.ts` (mirror of `@kayu/ui` `categoryColors`) | Tailwind v4 scans `apps/web` only; the class strings in `packages/ui` never reach the CSS, so every medallion rendered blank until the map lived inside the app |
| 2026-09-16 | (05) The provider page fetches the tree once on the server to resolve the root category's icon and colour; search cards resolve it from the client tree query | `ProviderCard`/`ProviderPublic` carry only `categoryChain[{id,slug,name}]`, so icon and colour need the tree |
| 2026-09-16 | (05) Providers (role PROVIDER) see muted notices instead of the message button, booking form and review form; the owner sees an edit link and no contact block | `POST /bookings`, `/conversations`, `/reviews` are CLIENT-only in 02 (providers get 403); the owner would hit `SELF_ACTION` |
| 2026-09-16 | (05) Review eligibility is derived client-side from `GET /bookings?status=COMPLETED&limit=100` (side `client`, same provider, `hasReview` false) | `BookingsQueryParams` has no `providerId` filter; the doc's `bookingsApi.mine({ providerId })` does not exist |
| 2026-09-16 | (05) Framer sections keep `initial`/`animate` under reduced motion and use `transition: { duration: 0 }` (or `animate` instead of `whileInView`) rather than dropping the props | Dropping the props left the server-rendered `opacity: 0` in place (React does not patch attribute mismatches), so every animated block stayed invisible for reduced-motion users |
| 2026-09-16 | (05) Reference pickers (`LocationFields`, `Choice`, `MultipleChoices`, `PricingFields`, `SuggestPlaceForm`, `useReferences`) and `PhoneField` are built in 05 under `components/reference/` and `components/ui/` | The filter sheet and booking form need them now; 06 (wizard, address book) and 07 reuse them instead of forking |
| 2026-09-16 | (05) The CGU print rule is an inline `<style>` on `/cgu` hiding the navbar, dock and footer | `globals.css` is 04's; 04 can move the rule when it next touches the file (open note below) |
| 2026-09-16 | (06) `AuthGate` no longer swaps in `AcceptTermsScreen` on `/login` and `/register` (a three-line edit to 04's file) | Those screens collect the name and the terms as inline OTP steps; without the exemption the gate replaced the flow the moment `/me` returned `termsAcceptedAt: null` |
| 2026-09-16 | (06) The post-auth matrix lives in `lib/auth-return-to.ts` (`postAuthDestination`, `roleLanding`, `usableReturnTo`, the `kayou.signupIntent` helpers); 04's `postLoginDestination` delegates to it and `GuestOnly` keeps working | One table for both screens and the guards; the 06 fallback is `/rechercher` (K-YOU `Register.jsx`), not 04's `/`; an already signed-in visitor of `/login` goes to `returnTo` or the role home |
| 2026-09-16 | (06) `AuthContext` sign-in methods resolve with the provisioned user and an explicit sync joins the in-flight `/me` fetch started by `onAuthStateChange`; `updateProfile` added | Supabase notifies subscribers before `verifyOtp` resolves, so the explicit sync used to find "the same token" and return nothing; the screens route synchronously on the returned user |
| 2026-09-16 | (06) `/prestataire/nouveau` uses `ProtectedRoute` plus an in-client provider check instead of `RequireNotProvider` | The guard redirected to the editor the instant `/me` refetched after publish, killing the success screen; `RequireNotProvider` stays exported |
| 2026-09-16 | (06) `LocationFields` gains a `stopAt?: PlaceKind` prop (05's file, three lines) | The name step needs country › city only; RDC cities sit under provinces so "stop at CITY" is the honest rule, not "two levels" |
| 2026-09-16 | (06) `lib/upload.ts` is replaced by `lib/media-upload.ts` (`uploadFile(purpose, file, { onProgress, signal })`, XHR PUT to the signed URL, public URL for `avatar` / `media`); `AttachmentBar` import re-pointed (one line in 05's file) | The doc's progress support; the same helper serves the wizard, the editor, KYC and chat |
| 2026-09-16 | (06) `@dnd-kit/{core,sortable,utilities}` re-added to `apps/web` (04 had pruned them as unused) | The doc's drag-to-reorder for video tiles; keyboard reorder comes with the sortable keyboard sensor |
| 2026-09-16 | (06) The OTP boxes are hand-rolled (six inputs, auto-advance, paste, backspace); `input-otp` stays out | 60 lines, no dependency, and the shake animation needed the wrapper anyway |
| 2026-09-16 | (06) Visiting `/bienvenue` sets `kayou_onboarded` on mount, not only on finish | The "Passer" link is 04's `AuthCanvas topBar` (a server link), so the flag cannot be set on click without forking the canvas; "first visit only" still holds |
| 2026-09-16 | (06) No second `Logo` bar on the wizard page | The page renders inside `Layout`, whose navbar already carries the mark; a second logo 60 px under it is noise (K-YOU's `BecomeProvider.jsx` had no navbar logo at that width) |
| 2026-09-16 | (06) The register account-type choice is stored in `sessionStorage` (`kayou.signupIntent`), read once by the matrix and cleared; `/register?as=provider` pre-selects it | Doc rule: a routing hint, never a role; the query form lets `/premium` and the "Devenir prestataire" links deep-link the provider intent |
| 2026-09-16 | (06) Admins editing another provider get a "Modération" tab (`hidden`, `premiumTier`, `verificationStatus`, `rejectionReason` → `PATCH /admin/providers/:id`) and every content tab wrapped in a disabled `fieldset` | One write path per field, as the doc requires; the disabled fieldset covers uploads, drag handles and selects without threading a prop through every step |
| 2026-09-16 | (06) Wizard draft key `kayou.providerDraft`, envelope `{ v: 1, savedAt, draft }`, includes the current step and the uploaded media paths | Reload on the same tab restores the step, the tiles and the accepted terms; a version bump discards stale drafts |
| 2026-09-16 | (06) The redirect row `/pro/profile/:rest*` → `/prestataire/me/modifier` replaces 04's `→ /compte`; the editor page resolves `me` server-side through the Supabase cookie (`/me` → own id, or the wizard, or `/login?returnTo=`) | The 06 doc's row; `/pro/profile/*` were provider content pages, not account settings |
| 2026-09-17 | (07) `PageHeader`, `StatusPill`, `MetricCard`, `ConfirmSheet`, `ErrorCard`, `SkeletonCard`, `MiniAvatar` and `EmptyState` live in `apps/web/src/components/ui/` | The 07 doc credits them to 04, but 04 never built them; `components/ui/` is where 05 put its app-level composites and 08 can reuse them from there |
| 2026-09-17 | (07) Copy is one module per screen (`copy/{bookings,espace,revenus,avis,notifications,aide,adresses,compte,messagerie}.ts`) plus `copy/spaces.ts` for the shared blocks, not a single `spaces.ts` | Matches the 07 doc's file list and the 05/06 convention of one module per route group |
| 2026-09-17 | (07) Provider dashboard pieces live in `components/espace/` (the doc's name), not `components/dashboard/` (the handoff map's name) | The doc is the contract; nothing else references `dashboard/` |
| 2026-09-17 | (07) New guard `RequireClientOnly` sends admins to `/admin` on `/mes-reservations`, `/avis`, `/adresses` | 04's `RequireRole CLIENT` lets admins through as clients, but `/dashboard/client`, `/reviews/mine` and `/addresses` answer 403 for ADMIN, so the doc's guard matrix (ADMIN → `/admin`) is the only working rule |
| 2026-09-17 | (07) Messaging safety is `ThreadSafety` (report `targetKind: "CONVERSATION"`, block the counterpart user id, stay on the thread) rather than 05's `SafetyActions` | `SafetyActions` needs a provider id and redirects to `/rechercher`; a provider viewer's counterpart is a plain user, and a blocked thread must stay visible with its notice |
| 2026-09-17 | (07) The pending-request accordion and the booking detail fetch `GET /bookings/:id` for the client phone and notes; `BookingCard` shows notes only when the caller passes them | The `BookingCard` DTO carries neither `clientPhone` nor `clientNotes`; only the detail does |
| 2026-09-17 | (07) The messaging thread hides the dock through `body[data-dock="hidden"]` (two rules in `globals.css`) instead of a `MobileNav` prop | 07 may not edit the layout; a body attribute is the smallest hook and reverts on unmount |
| 2026-09-17 | (07) Account deletion signs out through the Supabase client and hard-reloads on `/` instead of calling `useAuth().signOut()` | The context sets `anonymous` before its own `router.push("/")`, so `ProtectedRoute` on `/compte` won the race and landed on `/login?returnTo=/compte` |
| 2026-09-17 | (07) `VoiceRecorder` is extracted from 05's `AttachmentBar` (2-minute cap, timer pill, cancel/confirm); `AttachmentBar` keeps its props so 05's `MessageComposer` is untouched | The 07 doc lists both files; one recorder serves the profile composer and the thread composer |
| 2026-09-17 | (07) `/avis` "Évaluer" links to `/prestataire/[id]?review=[bookingId]` although the 05 profile page ignores the parameter | 05's `ReviewForm` picks the latest eligible booking itself, so the link works; the parameter stays for when the form reads it |
| 2026-09-17 | (08) The console lives in `app/(shell)/admin/` (04's route-group rule), not `app/admin/`; the server guard `layout.tsx` returns its children because `(shell)/layout.tsx` already renders `Layout` | One chrome, no double shell |
| 2026-09-17 | (08) `print.css` is a global stylesheet imported by the admin layout with every rule inside `@media print`, not a `<link media="print">` | The App Router bundles CSS; the effect is the same and the file stays in the owned folder |
| 2026-09-17 | (08) `AdminConsole` renders an empty canvas until `status === "ready"` and the role is ADMIN instead of wrapping in `RequireAdmin` | `RequireAdmin` shows the full-page ring; the server layout already redirected anonymous and non-admin visitors, so the client only needs to avoid a flash |
| 2026-09-17 | (08) Three redirect rows added to `next.config.ts` (04's file): `/dashboard/admin?tab=moderation|disputes|payouts` → `/admin?tab=users|reports|overview`; every other `?tab=` passes through Next's query forwarding, and `sections.ts` maps the same legacy keys client-side | The 08 doc asks for the three renamed tabs; the generic row already forwards the rest |
| 2026-09-17 | (08) The System section shows `KAYOU_PUBLIC_WEB_MODE` and the Node version of the **web** server (page props), because `GET /admin/health` reports neither | The doc says "reported by the API"; adding fields is 02's call (open note) |
| 2026-09-17 | (08) "Retirer la vérification" sets `verificationStatus: PENDING`; `REJECTED` stays a KYC-queue decision with a reason | The provider card is a switch; document-level refusal belongs to the Vérification section |
| 2026-09-17 | (08) Approving a suggestion with edits calls `POST …/approve` then `PATCH /admin/places/:resolvedPlaceId` with the edited fields | The approve route takes no body |
| 2026-09-17 | (08) The category editor uses a numeric `order` field instead of the old dnd-kit drag list | There is no bulk reorder endpoint; one PATCH per drop would spam the journal |
| 2026-09-17 | (08) The old `dashboard/admin/categories/_components` were rewritten under the same names (`AdminCategoriesList`, `LucideIconPicker`, `LucideIconView`, `NewCategoryModal`, `slugify`) plus a new `SubcategoryForm`, not moved | They used removed primitives (`Popover`, `Dialog`), `--k-*` variables and pre-refactor API shapes |
| 2026-09-17 | (08) Only `q`, `page`, `id` and `sub` live in the URL; the select filters (role, status, tier, kind, type) are local state | Deep links and back navigation need the search and the open item; filters reset with the tab |
| 2026-09-17 | (08) Admin error toasts show the backend's French `message` (plus the `REFERENCED` counts and `DOCS_MISSING` kinds) and the first `errors[]` entry on a validation 400, falling back to `errorCopy` | The doc asks for the server message; the admin is internal and the backend's messages are already French |
| 2026-09-17 | (08) The member sheet opens in the kept Radix `Sheet` (right side, full width under `sm`) with its own header; `window.print()` prints `#member-sheet` alone | Focus trap, Escape and scroll lock for free; no `html2canvas` / `jspdf` |
| 2026-09-17 | (09) Labels, field errors, selects, the textarea, checkbox rows, role cards and the success block stay local markup styled with 04's classes (`.field`, `.primary-action`, `.secondary-action`, `.status-pill`, `.gradient-text`) instead of shared components | The 09 doc's `Field`, `Select`, `Textarea`, `CheckRow`, `SuccessCard`, `ChoiceCard` and chip were never built by 04. The nearest ones change attributes the doc freezes: 06's `Field` / `SelectField` / `TextAreaField` render the error without an `id` and drop `aria-describedby` (and cannot show the phone hint and error together); `AccountTypeSelector` uses `role="radio"` / `aria-checked` where the campaign uses `aria-pressed` |
| 2026-09-17 | (09) Shared pieces that fit 1:1 are used: 04's `Logo` (in `components/layout`, `@kayu/ui/web` has none) inside a local `CampaignHeader`, 07's `EmptyState` for the no-role placeholder (wrapped in the existing `div#interest-form[role=status]`), 06's `FormError` for the submission alert and 06's `Spinner` as the submit spinner | Same look as the rest of the site; the inventory diff shows no id, name, aria, role or tab-order change |
| 2026-09-17 | (09) The submit spinner is a ring in the button ink (deep green on the gold pill), not a gold ring | The final submit is gold (09 doc); a gold ring on it is invisible. It keeps `k-campaign-spinner` for the reduced-motion test |
| 2026-09-17 | (09) No `EmptyState` for the categories-unavailable retry: the reload button stays under the disabled service select (now a secondary pill) and the landing notice stays a `role="status"` paragraph | `EmptyState` needs a title and neither state has copy of its own; inventing it is new copy, which the doc puts out of scope |
| 2026-09-17 | (09) Campaign copy stays inline in the campaign files, not in `src/copy/*` | `campaign-copy.test.mjs` reads those source files and must pass unchanged; the one exception to contract §12 |
| 2026-09-17 | (09) Secondary actions on the campaign (Retour, the cross-role switch, the reload) are pills (`secondary-action rounded-full`) | The 09 doc asks for pills; same override as 06's `WizardFooter` for a two-step wizard |
| 2026-09-17 | (09) `.k-campaign` carries the auth-canvas radial wash in `globals.css` instead of reusing `.auth-canvas`; the wash stays on mobile | `.auth-canvas` is a centred grid with unlayered mobile padding that would break the header / main / footer column. The auth canvas flattens on mobile because its card turns transparent; the campaign keeps a white card |
| 2026-09-17 | (09) Campaign inputs keep 16 px text inside `.field` (14 px elsewhere) | iOS Safari zooms on focus below 16 px; the campaign already used 16 px |
| 2026-09-17 | (09) Input, select and textarea focus comes from `.field:focus-within` (deep-green border and halo) instead of a separate `ring-ring/40`; radios, checkboxes, links, buttons and summaries keep the 3 px gold outline | Same focus treatment as every 05/06 form; checked on every tab stop in 17 states |
| 2026-09-17 | (09) The gold submit wraps (`whitespace-normal`) and the form card keeps `p-4` below `sm` | "Être parmi les premiers pros" needs 275 px unwrapped; the card has 248 px at 320 |
| 2026-09-17 | (09) `campaign-data.ts` is unchanged | 04's `getTree()` mapping already yields level 2 only: the roots' `children` become `subcategories` and their nested level-3 `children` are dropped because only `id`, `name`, `slug` are copied. The tree node has no `parentId`, so the filter is structural. Verified: 19 optgroups, 106 options, equal to active `Subcategory` rows with `parentId IS NULL` |
| 2026-09-17 | (09) `apps/web/scripts/campaign-smoke.mjs` added outside the owned paths | Like 07's and 08's smoke scripts: the before/after inventory, event and browser evidence needs a repeatable tool; handed to 10 |
| 2026-09-17 | Hosting moves from Render to Railway (backend + web, one environment) and Supabase Postgres in the existing Supabase project; Render is deleted at the end of workstream 10 | Render cost ~$35/month for four flat-rate services and a DB that never served users; Railway bills usage and Supabase already hosts auth and storage; NestJS stays as is (Cloudflare Workers rejected because NestJS is unsupported there and the API keeps in-memory rate limits and caches) |

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
- (04 → 02) Should `GET /me` return `unreadNotifications` so the navbar bell stops polling `GET /notifications?limit=1`?
- (04 → 09) Resolved by 09: `/launch*` no longer reads any `var(--k-*)` variable.
- (04 → 06) `input-otp` was removed with the unused primitive; re-add it if the OTP field wants segmented input.
- (03) `packages/ui/package.json` still lists `@kayu/schemas` although no UI file imports it any more; left alone because the file is outside 03's owned paths.

- (05 → owner) `copy/legal.ts` names the editor "KAYOU — Kinshasa, République démocratique du Congo" as a placeholder; the registered legal entity, seat and registry number must be confirmed before launch.
- (05 → 04) Two redirect rows need a hash suffix per the 05 doc: `/book/:id` → `/prestataire/:id#reserver` and `/review/:id` → `/prestataire/:id#avis` (today both land on the profile top).
- (05 → 04) Move the `/cgu` print rule (`@media print` hiding `.app-shell > header`, `.mobile-dock`, `.compact-footer`, `.legal-print-hide`) into `globals.css`; `shellCopy.homePlaceholder` in `copy/shell.ts` is now unused and can go.
- (05 → 10) Local dev database: the `kayu` database on port 5433 is still on the pre-refactor schema. A verification copy `kayu_05_verify` (new baseline, seeded with `SEED_SUPABASE_USERS=false`, one demo client linked to Supabase by hand) was created for 05; the compiled backend on 3001 was restarted against it. 10's dev reset replaces both.
- (06 → 10) The Supabase buckets `provider-media` and `verification-docs` do not exist in the shared project (only `avatars` does): `POST /me/uploads/sign` returns 500 "The related resource does not exist" for `media` and `verification`, so wizard gallery/video uploads and KYC uploads fail with the retry tile until 10 creates them (02 handed bucket creation to 10). The XHR upload path was proven against `avatars`.
- (06 → 10) `kayu_05_verify` now has four demo accounts linked to their real Supabase auth ids by hand (Paul from 05; Jean-Pierre, Michelle, Joseph and admin from 06) so every role can be exercised through the dev panel; 10's dev reset should seed those links (`SEED_SUPABASE_USERS`) instead.
- (06 → owner) The real SMS path (Supabase `signInWithOtp` → `verifyOtp`) was not exercised end to end: no test OTP is configured on the project and sending real SMS to invented numbers was not attempted. The phone step, error mapping and the post-OTP name/terms/matrix logic are covered by code paths shared with the password demo login.
- (06 → 04) `shellCopy.screenTitles.{welcome,login,register,becomeProvider,editProvider,verification}` are no longer read by any page (each route owns its metadata copy); 04 can prune them with the `homePlaceholder` block.
- (06 → 07) `/compte` should not duplicate the provider fields; the doc moved `services`, `availability` and `zones` into the editor tabs.
- (07 → 02, 10) After `DELETE /me` the Supabase user is removed but the caller's access token stays valid until expiry, and a later `GET /me` with it provisions a brand-new `User` row (observed on `kayu_05_verify`: new id, `auth/v1/admin/users/:id` → 404). The web never does this (it signs out and reloads), but a script or a stale tab can; provisioning should refuse a subject whose Supabase user is gone, or deletion should revoke sessions first.
- (07 → 10) The `message-attachments` bucket is also missing on the shared Supabase project: `POST /me/uploads/sign?purpose=attachments` → 500, so image and voice attachments cannot be uploaded until 10 creates it. The composer shows the inline error; the signed-read rendering path (`GET /me/media/sign-read`) is implemented but was not exercised end to end.
- (07 → 05) The profile page could read `?review=[bookingId]` to preselect the booking in `ReviewForm`; today it picks the latest eligible booking.
- (07 → 04) `useUnreadNotifications()` polls every 60 s and the notifications screen invalidates `["notifications"]` on every mark-read; if 02 adds `unreadNotifications` to `GET /me` (open note from 04) both should switch to it.
- (08 → 02) `GET /admin/health` could report the public web mode and the Node version; today the System section shows the web server's own values.
- (08 → 02) `GET /admin/places` and `/admin/references` rows carry only `mergedIntoId`; the list shows the target label when it is on the same page and an id prefix otherwise. A `mergedIntoLabel` would remove the fallback.
- (08 → 10) The seed has no `UNDER_REVIEW` KYC submission, so the Vérification detail (thumbnails through `GET /me/media/sign-read`, approve / reject) was verified by type-check and code review, not in the browser; the `verification-docs` bucket is still missing (06's note). `scripts/admin-smoke.mjs` is handed to 10.
- (08 → 10) `LAST_ADMIN` cannot be triggered with one seeded admin (self edits hit `SELF_ACTION` first); the smoke records it and should seed a second admin when 10 owns the demo data.
- (08 → 10) The smoke creates and deactivates throwaway rows (`Smoke service …` level-3 node, `Smoke Q …` quartiers under Gombe) and flips one contact `NEW → READ → NEW`; the journal keeps those actions.
- (05 → owner) During verification a seed run mis-targeted the old `kayu` dev database (the intended `kayu_05_verify` URL rewrite failed silently) and its `clearDatabase()` step emptied the old-schema `Message`, `Conversation`, `Transaction`, `Review`, `ClientReview`, `Booking` and `Notification` tables before failing on the missing `Report` table. Users, providers and every launch-lead table are untouched. That data was on the schema the refactor discards, but it was not backed up first.
- (09 → 10) `scripts/overflow-check.mjs` compares `scrollWidth` with `window.innerWidth`. With Playwright `isMobile: true`, Chrome widens the layout viewport to fit overflowing content, so a real 11 px overflow on the campaign step 2 at 320 px read as `331 === 331` and passed (fixed in 09). The 320/390 overflow evidence of 04–08 used that script and could hide overflows the same way; 10 should compare against the requested width (as `campaign-smoke.mjs` does) and re-run.
- (09 → 10) Campaign mode does not redirect `/`: it answers 200 with the marketplace home, as on `main` since `a590c20`. The 09 doc's manual step 1 lists `/`. If the campaign domain must not expose the marketplace home, `/` needs adding to `campaign-routing.ts` and its test (outside 09).
- (09 → closed beta) The campaign form still sends `KIN_COMMUNES` strings (`homeCommune`, `commune`) because the lead DTO stores a controlled string. Moving it to `Place` references belongs to the closed-beta folder together with the lead DTO change.
- (09 → owner) Existing behaviour, not changed: `launch_form_started` goes out without attribution if focus enters a form in the same frame it mounts (seen when the success card's cross-role button remounts the form and focus lands in it at once). `CampaignForm` sets `attribution` in an effect after mount. Real users are very unlikely to hit it; the smoke waits one frame.
- (09 → 10) The disposable database `kayu_09_campaign` (port 5433) still holds the smoke's 1 provider lead, 1 client lead, 3 submission events and 59 funnel events; drop it once 10 has what it needs.

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

Status: Done (2026-09-16). Branch `kyou-ux/04-shell` from `refactor/kyou-ux` at `36cc284`; changes left uncommitted for the owner's diff review. Handover: `handover/04-web-shell.md`.

#### Changed files

- `apps/web/src/app/globals.css`: rewritten — Tailwind v4 `@theme` (K-YOU HSL colours, Sora / Plus Jakarta Sans, radii, shadows, `--ease-screen`, `--animate-*` keyframes), base layer (gold 3 px / 4 px focus ring, `color-scheme: light`), the §A component classes, admin rail classes, reduced-motion and fine-pointer blocks. Every `--k-*` variable and `.k-*` class removed except the `.k-campaign` reduced-motion rules (09).
- `apps/web/src/app/layout.tsx`: Sora + Plus Jakarta Sans via `next/font/google`, French metadata, `theme-color #0A3D36`, `viewport-fit: cover`.
- `apps/web/src/app/(shell)/layout.tsx`, `(canvas)/layout.tsx`, `bienvenue/page.tsx`, `not-found.tsx`, 25 placeholder pages, `(shell)/admin/AdminPlaceholder.tsx`, `(shell)/dev/tokens/{page,TokensShowcase}.tsx`.
- `apps/web/src/components/layout/`: `Layout`, `Navbar`, `MobileNav`, `Footer`, `FooterSwitch`, `Logo`, `AuthCanvas`, `AdminRail`, `ScreenTransition`, `ScrollToTop`, `NetworkStatus`, `InteractionEffects`, `SuspendedScreen`, `AcceptTermsScreen`, `MaintenanceBanner`. Old `AppShell`, `Header`, `Footer`, `Layout` deleted.
- `apps/web/src/components/guards/`: `ProtectedRoute`, `RequireRole`, `RequireAdmin`, `RequireOwnerOrAdmin`, `RequireNotProvider`, `GuestOnly`, `AuthBootScreen`.
- `apps/web/src/components/providers/`: `AppProviders` (unchanged), `MarketplaceProviders` (query, auth, gate, network banner, pulse, scroll, sonner), `AuthGate`, `QueryProvider`.
- `apps/web/src/contexts/AuthContext.tsx`: `status` machine, `AuthUser` with terms / suspension / provider, suspended detection on 403 `ACCOUNT_SUSPENDED`, `acceptTerms`, `signOut` → `/`, token-deduped `/me` sync.
- `apps/web/src/lib/auth-redirects.ts`, `src/hooks/useSiteSettings.ts`, `src/hooks/useUnreadNotifications.ts`, `src/lib/upload.ts` (new `UploadPurpose`, `bytes`).
- `apps/web/src/components/ui/`: pruned to the keep list; `button`, `badge`, `card`, `sonner` restyled on the tokens; new `skeleton`, `bottom-sheet`, `wizard-steps`, `animated-list`.
- `apps/web/src/copy/{shell,errors,dev}.ts`; `apps/web/src/components/placeholder/{RoutePlaceholder,CanvasPlaceholder}.tsx`.
- Brand: `apps/web/public/logo.svg` (the ported K-YOU mark), `src/app/icon.svg`, `src/app/apple-icon.png`; `Logo` / `LogoMark` in `components/layout/Logo.tsx`. Deleted `public/kayou-logo*.png` (6 files).
- `apps/web/next.config.ts` (`legacyRedirects`, 26 rows), `src/proxy.ts` (new public paths, `/dev/*` 404 in production), `src/lib/campaign-routing.ts` + test, `src/app/launch/campaign-data.ts` (`getTree`).
- `apps/web/package.json` (dependencies pruned, `playwright`, `check:overflow` script), `apps/web/scripts/overflow-check.mjs`, `pnpm-lock.yaml`.
- Deleted: 219 files (old routes, chromes, dead component folders, `lib/booking-v2.ts`, `lib/launch-flags.ts`, `lib/provider-card.ts`, `hooks/use-mobile.ts`, `hooks/use-toast.ts`, 38 shadcn primitives).
- Screenshots: `screenshots/04/{home,rechercher,login,bienvenue,admin,dev-tokens}-{320,390,1440}.png`.

#### Commands and results

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors (387 before) |
| `pnpm --filter @kayu/web build` (`.env`: `BACKEND_URL`, Supabase keys) | Pass; 31 routes, proxy compiled |
| `node --test apps/web/src/lib/*.test.mjs` | 28/28 pass (the five campaign files) |
| `curl -sI` on the 26 rows of 04 §E against the dev server | Every row 308 to the expected destination; `/services` without a query stays 200; `/auth?mode=signup` → `/register?mode=signup` (query forwarded, harmless) |
| `PW_CHANNEL=chrome node scripts/overflow-check.mjs --urls / /rechercher /dev/tokens /login /bienvenue /admin --widths 320 390 1440` | 18/18 `scrollWidth === innerWidth` |
| Playwright checks (Chrome, dev server) | Reduced motion: `.screen-enter` and `.skeleton-sheen::after` `animation-name: none`, no `.touch-pulse` on pointer-down. Normal: `screen-arrive` plays, one pulse per pointer-down, removed after 450 ms. Dock visible and navbar pills hidden below `lg`, inverse at 1440. Footer on exactly `/`, `/services`, `/contact`, `/cgu`, `/confidentialite`. Tab reaches all 6 navbar links and all 4 dock links; focus ring `3px solid rgb(232,174,41)`, offset 4 px. Anonymous on `/mon-espace`, `/mes-reservations`, `/compte`, `/admin`, `/prestataire/nouveau` → `/login?returnTo=<path>` |
| `next start -p 3005` | `/dev/tokens` and `/dev` → 404; `/` → 200 |
| Acceptance greps (`AppShell|k-display|k-body|--k-|from "@kayu/ui"` in layout files; `Inter|JetBrains` in `src`; `components/map|FinalOfferDialog|launch-flags|booking-v2`) | All empty; `var(--k-` remains only in `src/app/launch/**` (09) |

#### Remaining risks

- Role-based navbar and dock, the suspended and terms screens, and `RequireRole` redirects were exercised with anonymous sessions and by code review only; the seeded demo accounts (`Password123!`) can drive the signed-in paths once 06 restyles login.
- `/launch*` is visually broken on the integration branch until 09 (expected per the 04 doc).

### 05 — Web Public Screens

Status: Done (2026-09-16). Branch `kyou-ux/05-public` from `refactor/kyou-ux` at `9e32a1b`; changes left uncommitted for the owner's diff review. Handover: `handover/05-web-public-screens.md`.

#### Changed files

- Routes (all under `(shell)/` except premium): `page.tsx` (home, SSR `force-dynamic`, `Promise.all` over stats / tree / settings with per-call fallbacks), `rechercher/{page,SearchClient}.tsx`, `prestataire/[id]/{page,ProviderProfileClient}.tsx` (SSR through the Supabase cookie, `generateMetadata`, `notFound()` on 404), `services/{page,ServicesClient}.tsx`, `contact/{page,ContactClient}.tsx`, `cgu/{page,PrintButton}.tsx`, `confidentialite/{page,PrivacyArticle}.tsx`, `delete-account/page.tsx`, `(canvas)/premium/{page,PremiumCard}.tsx`, `app/not-found.tsx` + `app/NotFoundContent.tsx`.
- `components/home/`: `Hero`, `StatsBar`, `CategoryGrid`, `CategoryFeatured`, `CategoryMedallion`, `HowItWorks`, `PremiumTeaser`.
- `components/search/`: `search-state.ts` (URL ⇄ state, `toApiParams`, counters), `SearchBar`, `NearMeButton`, `FilterChips`, `FiltersSheet` (on 04's `BottomSheet`, draft applied on "Appliquer", centred modal from `sm`), `ResultsHeader`, `ViewToggle`, `SearchMapView` (react-leaflet, photo pins, fit bounds, dynamic `ssr: false`), `ProviderCardSkeleton`.
- `components/provider/`: `ProviderCard`, `ProviderAvatar`, `ProviderHeaderCard`, `TierBadge`, `SafetyActions`, `ContactBlock`, `ContactsLocked`, `DistanceEstimator`, `Gallery` + `Lightbox`, `SocialEmbeds`, `ProviderChoices`, `SkillsList`, `ReviewsList`, `ReviewForm`, `ScheduleSummary`, `AddressCard`.
- Shared for 06/07: `components/auth/LoginWall.tsx`, `components/booking/BookingForm.tsx`, `components/messaging/{MessageComposer,AttachmentBar}.tsx`, `components/reference/{LocationFields,Choice,MultipleChoices,PricingFields,SuggestPlaceForm,useReferences}.ts(x)`, `components/geo/AddressAutocomplete.tsx`, `components/media/VideoGallery.tsx`, `components/ui/{SectionHeading,StarRating,ExpandableText,PhoneField}.tsx`.
- `copy/{home,search,provider,services,contact,premium,legal,notFound}.ts`; `hooks/useCategoryTree.ts`; `lib/dto/{provider,category,categoryColors,icons}.ts`; `lib/geo.ts`.
- `public/images/home/` (hero + six category JPEGs); `docs/kyou-ux-refactor/screenshots/05/` (nine routes × 320/390/1440, map view, signed-in profile, booking form, composer).
- Placeholders deleted for the nine routes; `components/placeholder/` stays for 06–08.

#### Commands and results

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors |
| `pnpm --filter @kayu/web build` | Pass; 34 routes, `/`, `/prestataire/[id]`, `/services` dynamic |
| `curl -s localhost:3000/prestataire/<seeded-id> \| grep -c "+243"` (no cookie) | 0; the login wall and metadata title render; signed-in HTML (Supabase cookie) shows Appeler / WhatsApp / e-mail |
| `curl -sI localhost:3000/providers/<id>` and `/book/<id>` | 308 → `/prestataire/<id>` (04's rows; hash suffix noted above) |
| `PW_CHANNEL=chrome node scripts/overflow-check.mjs --urls / /rechercher "/rechercher?category=batiment_construction&view=map" /prestataire/<id> /services /contact /cgu /confidentialite /premium /missing --widths 320 390 1440` | 30/30 `scrollWidth === innerWidth` (normal and `--reduced-motion`) |
| Playwright interaction script (Chrome, 390 px) | 22/22: cards render; filter sheet is `role="dialog"`, focus moves in, Tab wraps, Escape closes, focus restored to the Filtres pill, body scroll locked; "Vérifiés uniquement" lands in the URL and survives reload (badge 1); map toggle renders Leaflet with 13 photo pins and `view=map` in the URL; hero search pushes `/rechercher?q=`; `#reserver` / `#avis` anchors; lightbox opens and Escape closes; services 12 → 19 toggle and empty state; contact shows 4 `aria-invalid` fields with inline errors; reduced motion removes `screen-enter`; 0 console errors |
| Console sweep (anon + signed-in, home / search / services / profile) | 0 errors or warnings after fixing a search render loop and the reduced-motion hydration mismatch |
| API paths with a demo client token (`kayu_05_verify`) | `GET /providers/:id` returns contacts; `POST /bookings` 201 then 409 `SLOT_TAKEN` on the same slot, and the slot disappears from `/availability`; `POST /reviews` on a reviewed booking → 409 `ALREADY_EXISTS`; the profile shows "Vous avez déjà noté ce prestataire." for that client |
| Acceptance greps | No `'` literal in the owned route files; no removed `@kayu/ui` component imported under the owned paths; no emoji in copy or components |

#### Remaining risks

- The signed-in browser paths were driven with a hand-built Supabase cookie (06 has not restyled login yet); the booking submit, composer send, report and block were exercised over the API and by code review, not clicked in the browser.
- Instagram/TikTok/Facebook embeds are URL-pattern based; a profile link (not a post) renders the outbound tile. Seed data has no social links, so embeds were not rendered against real content.
- `SearchMapView` loads OpenStreetMap tiles directly; offline the map shows the mint background with pins only.

### 06 — Web Auth And Provider Onboarding

Status: Done (2026-09-16). Branch `kyou-ux/06-auth-onboarding` from `refactor/kyou-ux` at `ddd7937`; changes left uncommitted for the owner's diff review. Handover: `handover/06-web-auth-and-onboarding.md`.

#### Changed files

- Routes: `(canvas)/login/{page,LoginClient}.tsx`, `(canvas)/register/{page,RegisterClient}.tsx` (`?returnTo`, `?as=provider|client`), `bienvenue/{page,WelcomeClient}.tsx`, `(shell)/prestataire/nouveau/{page,WizardClient}.tsx`, `(shell)/prestataire/[id]/modifier/{page,EditorClient}.tsx` (server resolves `me`, `GET /providers/:id` through the cookie, 403/404 → `notFound()`), `(shell)/verification/{page,VerificationClient}.tsx`. The six placeholders are gone; `components/placeholder/` stays for 07–08.
- `components/auth/`: `useAuthFlow.ts` (the shared phone → code → name → terms machine), `OtpFlow`, `PhoneStep`, `CountrySelect`, `OtpStep`, `NameStep`, `TermsStep` (+ `TermsCheckbox` reused by the wizard), `AuthStepDots`, `AccountTypeSelector`, `AuthCardHeader`, `AuthCardMotion`, `DemoAccountsPanel` (dev only), `WelcomeSlide`, `WelcomeGate` (mounted in 05's `(shell)/page.tsx`, one line), `supabase-errors.ts`.
- `components/onboarding/`: `wizard-state.ts` (`WizardDraft`, `useWizardDraft` over `lib/onboarding-draft.ts`), `wizard-validation.ts` (step rules, `toPublishPayload`, `validatePayload` through `PublishProviderDto`, `mapIssues` for client and server 400 paths), `CategoryCascade` (+ `selectionForNode`), `WizardHero`, `ProgressRail`, `StepInfos`, `StepServices`, `StepLocation`, `StepPublic`, `PublicProfileFields`, `PreviewCard`, `BenefitsCard`, `WizardFooter`.
- `components/schedule/`: `ScheduleEditor` (+ `defaultSchedule`, `scheduleIssues` over `validateSchedule`), `RangeRow`, `ExceptionRow`.
- `components/media/`: `media-draft.ts` (`MediaDraftItem`, `toMediaInput`, `fromProviderMedia`), `PhotoDropzone` (single avatar / `multiple` gallery, immediate upload with progress, retry tile), `VideoEditor` (YouTube host check via `parseYouTubeUrl`, MP4/MOV/WebM ≤ 25 MB with XHR progress, 12 tiles, dnd-kit reorder, confirm on remove), `UploadProgress`.
- `components/verification/`: `VerifyWizard`, `VerifyStatus`, `UploadTarget`, `DocStatusRow`. `components/forms/Field.tsx` (`Field`, `TextAreaField`, `SelectField`, `FormError`, `Spinner` on 04's `.field`).
- `contexts/AuthContext.tsx` (sign-ins resolve with the user, in-flight join, `updateProfile`), `lib/auth-return-to.ts`, `lib/media-upload.ts`, `lib/onboarding-draft.ts`; `lib/auth-redirects.ts` delegates; `lib/upload.ts` deleted.
- `copy/{auth,onboarding,verification}.ts`. Edits outside the owned paths, each logged above: `components/providers/AuthGate.tsx`, `components/reference/LocationFields.tsx` (`stopAt`), `components/messaging/AttachmentBar.tsx` (import), `(shell)/page.tsx` (`WelcomeGate`), `next.config.ts` (one redirect row), `package.json` (dnd-kit).
- Assets: `public/welcome/slide-{1..4}.png`, `public/images/wizard-hero.png` (K-YOU generated illustrations). Screenshots: `docs/kyou-ux-refactor/screenshots/06/` (30 files: bienvenue / login / register × 320/390/1440, wizard steps 1–4 at 390 and 1440, step 4 filled, success, editor tabs, admin moderation, verification × 320/390/1440).

#### Commands and results

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors |
| `NODE_ENV=production pnpm --filter @kayu/web build` | Pass; `grep -r Password123 .next/static .next/server/app` → no match (the demo panel is compiled out) |
| `curl -sI` on `/auth?mode=signup`, `/auth`, `/pro/onboarding`, `/pro/verify`, `/pro/profile/photo` | 308 → `/register?mode=signup`, `/login`, `/prestataire/nouveau`, `/verification`, `/prestataire/me/modifier`; `/prestataire/me/modifier` anonymous → 307 `/login?returnTo=…` |
| `PW_CHANNEL=chrome node scripts/overflow-check.mjs --urls /bienvenue /login /register --widths 320 390 1440 --reduced-motion` | 9/9 `scrollWidth === innerWidth` |
| Playwright suite (Chrome; anonymous, client, provider, admin) | 76/76: no overflow on `/bienvenue`, `/login`, `/register`, the wizard (steps 1 and 4), the editor and `/verification` at 320/390/1440; no brand column on `/login`; invalid phone → `role="alert"`; welcome gate fires once on a fresh 390 px profile, never at 1440, never with `returnTo`, never signed in, and finishing lands on `/login`; client demo login → `/rechercher`, signed-in visitor of `/login` → `/mes-reservations`, `returnTo=/services` honoured, `//evil.com` ignored; wizard "Continuer" disabled until name+phone, deepest taxonomy node, city, CGU; draft survives reload on step 2 and step 4; schedule caps Monday at four ranges and flags an overlap before any request; `youtube.com.evil.io` rejected, `youtu.be` accepted; provider demo login → `/mon-espace`, `/prestataire/me/modifier` resolves to the own id, save disabled when clean, enabled when dirty, toast on save, dirty guard on tab switch; provider on `/prestataire/nouveau` → own editor; client on `/verification` → `/mes-reservations`; admin login → `/admin`, admin sees the Modération tab with content fields disabled |
| Playwright publish flow (Chrome, demo client Joseph on `kayu_05_verify`) | 10/10: phone prefilled from `/me`; YouTube tile added, duplicate rejected; gallery upload shows the retry tile (bucket missing, see open note); draft with the video survives reload; `POST /me/provider` → 201; success screen; redirect to `/prestataire/<id>`; draft cleared; `/prestataire/nouveau` then redirects to the editor (role `PROVIDER`). The test rows were deleted afterwards |
| XHR signed-upload probe against the existing `avatars` bucket | sign 200 → PUT 200 with progress → public URL 200 |
| KYC upload as the demo provider | `POST /me/uploads/sign` (purpose `verification`) → 500 upstream (missing bucket); the screen shows the inline error and the retry action |

#### Remaining risks

- SMS OTP itself was not sent or verified against Supabase (see open note); every step after the code is shared with the password demo path and was exercised.
- Gallery, video and KYC uploads cannot complete until 10 creates the two buckets; the UI paths (progress, retry, removal, publish without media) are verified.
- The wizard's browser-geolocation fallback runs only at publish time when the autocomplete gave no coordinates; Playwright had no geolocation grant, so the publish went through with `latitude: null`.
- The editor's Planning tab saves through `PUT /providers/me/schedule` and Vidéos through `PUT /providers/me/media`; both were exercised by code review and the shared payload builders, not by a browser save (the media save needs the buckets).

### 07 — Web Client And Provider Spaces

Status: Done (2026-09-17). Branch `kyou-ux/07-spaces` from `refactor/kyou-ux` at `3fec1a3`; changes left uncommitted for the owner's diff review. Handover: `handover/07-web-client-and-provider-spaces.md`.

#### Changed files

- Routes (placeholders replaced): `(shell)/mes-reservations/{page,MesReservationsClient}.tsx`, `(shell)/reservation/[id]/{page,ReservationDetailClient}.tsx`, `(shell)/mon-espace/{page,MonEspaceClient}.tsx`, `(shell)/revenus/{page,RevenusClient}.tsx`, `(shell)/avis/{page,AvisClient}.tsx`, `(shell)/notifications/{page,NotificationsClient}.tsx` + `notification-links.ts`, `(shell)/aide/{page,AideClient}.tsx`, `(shell)/adresses/{page,AdressesClient}.tsx`, `(shell)/compte/{page,CompteClient}.tsx`, `(shell)/messagerie/{page,MessagerieClient}.tsx`. Only 08's admin placeholder remains; `components/placeholder/` goes with it.
- `components/ui/`: `PageHeader`, `StatusPill`, `MetricCard`, `ConfirmSheet`, `ErrorCard`, `SkeletonCard` (+ `SkeletonList`), `MiniAvatar`, `EmptyState`.
- `components/bookings/`: `BookingCard`, `BookingActions` (+ `invalidateBookingQueries`), `ClientRatingForm`, `format.ts`.
- `components/espace/`: `Greeting`, `StatusBanner`, `MetricsRow`, `RequestAccordion`, `ProfileRow`, `HistoryList`, `WeekBars`.
- `components/messaging/`: `ConversationList`, `ConversationRow`, `Thread`, `ThreadHeader`, `ThreadSafety`, `MessageBubble`, `MessageAttachments`, `Composer`, `VoiceRecorder`, `thread-cache.ts`, `useConversationPolling.ts`, `useSignedAttachment.ts`; `AttachmentBar` rewired to `VoiceRecorder` (same props).
- `components/account/`: `ProfileHeaderCard`, `ProfilePhotoUploader`, `PremiumStatusCard`, `QuickAccessGrid`, `ProfileForm`, `AccountSecurityCard`. `components/addresses/`: `AddressRow`, `AddressSheet`.
- `copy/{spaces,bookings,espace,revenus,avis,notifications,aide,adresses,compte,messagerie}.ts`.
- Edits outside the owned paths, each logged above: `components/guards/RequireClientOnly.tsx` (+ one export line in `guards/index.ts`), two `body[data-dock="hidden"]` rules in `globals.css`. `scripts/spaces-smoke.mjs` is the Playwright pass handed to 10.
- Screenshots: `docs/kyou-ux-refactor/screenshots/07/` (48 files: every route × client/provider × 320/390/1440, the booking detail for both sides, the messaging thread).
- Nothing deleted beyond the ten placeholders: the old routes, `components/dashboard`, `components/settings`, `lib/booking-v2.ts` and the `.k-messages-*` rules were already removed by 04, and the redirect rows already exist in `next.config.ts`. `/compte` carries no provider fields (06's note).

#### Commands and results

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors |
| `NODE_ENV=production pnpm --filter @kayu/web build` | Pass; the ten routes appear in the route table |
| Line / token audit over the owned folders | No file over 203 lines; no inline hex colour; no French literal outside `copy/*` |
| `PW_CHANNEL=chrome node scripts/spaces-smoke.mjs --shots …/screenshots/07` (Chrome; client, provider, admin, anonymous, throwaway phone user) | 75/76: every route renders with the expected H1 and no horizontal overflow at 320/390/1440 for both roles, `/reservation/[id]` for both sides, the thread hides the dock on mobile; redirect matrix (anonymous → `/login?returnTo=`, provider → `/mon-espace`, client → `/mes-reservations`, admin → `/admin`) and the seven 308 rows; tabs filter to the right pills; mark-read drops `unreadCount` by one; availability toggle flips `isAvailable` on the API and back; `/revenus` shows the ledger total (77 500 FC) and links rows to `/reservation/[id]`; profile save round-trips `bio` through `PATCH /me/profile`; address create then delete; message send persists, the open thread refetches within 16.5 s on a visible tab, own message deleted through the sheet; admin `DELETE /me` → 409 `ADMIN_ACCOUNT`; a throwaway user deletes its account from `/compte`, lands on `/bienvenue` (welcome gate for a fresh phone-sized visitor) and is gone from Supabase Auth. The one failure is `POST /me/uploads/sign?purpose=attachments` → 500 (missing bucket, see open note) |
| `REDUCED=1 … --only render` | 48/48 renders without overflow under `prefers-reduced-motion: reduce` |

#### Remaining risks

- Image and voice attachments were not uploaded or rendered through signed URLs end to end: the bucket is missing (open note). The recorder, lightbox and `useSignedAttachment` are verified by code review and type-check only.
- Provider confirm/complete/cancel and the client cancel were exercised through `BookingActions` sheets by code review; the smoke did not mutate the seeded bookings (it would consume the demo data). Each path is a single `bookingsApi` call followed by `invalidateBookingQueries`.
- The deleted-user token re-provisioning (open note) is a backend behaviour outside 07.

### 08 — Web Admin Console

Status: Done (2026-09-17). Work on `refactor/kyou-ux` from `473dd32`; changes left uncommitted for the owner's diff review. Handover: `handover/08-web-admin-console.md`.

#### Changed files

- Route: `(shell)/admin/{layout,page}.tsx` (server guard, metadata), `AdminConsole.tsx` (client orchestrator: no-flash auth wait, `?tab=` → section, `motion.div` swap), `sections.ts` (the 14 entries and the legacy tab map), `print.css`.
- `_components/`: `AdminHeader`, `AdminTable` (+ default stacked card), `Pagination`, `SearchBox`, `FilterSelect`, `AdminStatusPill`, `ConfirmAction`, `ToggleRow`, `SplitPane`, `CommandHero`, `QueryState`, `SectionTitle`, `useAdminParams`, `useAdminMutation`, `admin-errors.ts`, `format.ts`; `_components/categories/`: `AdminCategoriesList`, `LucideIcon`, `LucideIconPicker`, `NewCategoryModal`, `SubcategoryForm`, `slug.ts`.
- `_sections/`: `Overview`, `Users` + `UserSheet` + `MemberSheet`, `Providers` + `ProviderCard`, `Verification` + `VerificationDetail`, `Bookings`, `Reviews`, `Conversations` + `ConversationThread`, `Contacts`, `Reports`, `Content`, `Categories`, `References` + `Places` + `PlaceForm` + `Lists` + `ReferenceForm` + `MergeControl`, `Audit`, `System`.
- `copy/admin.ts`. `scripts/admin-smoke.mjs` (Playwright pass handed to 10). Screenshots in `docs/kyou-ux-refactor/screenshots/08/` (29 files: every tab at 390 and 1440, the member sheet).
- Edits outside the owned paths, logged above: three query-conditional rows in `next.config.ts`.
- Deleted: `(shell)/admin/AdminPlaceholder.tsx` and `components/placeholder/` (the last placeholder). The 2437-line `dashboard/admin/page.tsx`, its layout and `categories/[id]` were already removed by 04; `html2canvas` / `jspdf` were never added.

#### Commands and results

| Command | Result |
| --- | --- |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors |
| `NODE_ENV=production pnpm --filter @kayu/web build` | Pass; `/admin` is dynamic (server guard) |
| Line / token audit over `app/(shell)/admin/` | Longest file 167 lines (limit 400); no inline hex colour; no French literal outside `copy/admin.ts` |
| `PW_CHANNEL=chrome node scripts/admin-smoke.mjs --shots …/screenshots/08` | 64/64: anonymous `/admin` → 307 `/login?returnTo=%2Fadmin`; client → `/`; the six 308 rows (`/dashboard/admin`, `?tab=moderation|disputes|payouts|categories`, `/dashboard/admin/categories/x`); all 14 tabs render with the greeting, the right rail item active and no horizontal overflow at 320/390/1440; users search mirrors `?q=`; the self row has both toggles disabled; `PATCH /admin/users/:self` → 400 `SELF_ACTION`; the member sheet opens from `?id=` and under `print` media only `#member-sheet` stays visible; verifying a PENDING provider without documents surfaces the API message with the missing kinds; a level-3 service is created from the form (slug auto-derived) then deleted; deleting a referenced category shows "Références : 4 prestataires, 14 réservations…"; a throwaway quartier is merged through the UI and disappears from the public `GET /places?parentId=`; opening a NEW contact flips it to READ; the journal lists the mutations; the System cards read "Opérationnel" |
| `REDUCED=1 … --only render` | 42/42 renders without overflow under `prefers-reduced-motion: reduce` |

#### Remaining risks

- The KYC detail (signed thumbnails, approve / reject) and the conversation attachment links could not be exercised end to end: no submission is under review in the seed and the private buckets are missing.
- `LAST_ADMIN` (409) is reflected in the UI only through the generic toast path; it was not triggered (single admin).
- The merge candidates for places come from `GET /admin/places?kind&parentId&active=true` (100 max); a parent with more than 100 active children would truncate the picker.

### 09 — Launch Campaign Restyle

Status: Done (2026-09-17). Work on `refactor/kyou-ux` from `79a2fdd`; changes left uncommitted for the owner's diff review. Handover: `handover/09-launch-campaign.md`.

#### Changed files

- `apps/web/src/app/launch/CampaignLanding.tsx`: K-YOU classes on the header, hero (`gradient-text` on « Kinshasa »), role cards, reassurance rows, planned-services panel, mint « Jamais demandé ici » card and footer; `CampaignHeader`; `EmptyState` for the no-role placeholder.
- `apps/web/src/app/launch/CampaignForm.tsx`: `.field` inputs, selects and textarea; radio tiles, checkbox rows and consent card on the tokens; `rounded-3xl bg-white shadow-soft` step and success cards; deep-green `primary-action` for Continuer, gold for the final submit, pill `secondary-action` for Retour, the cross-role switch and the reload; `FormError` and `Spinner` from 06.
- `apps/web/src/app/launch/confidentialite/page.tsx`: same header, eyebrow, page H1, white notice cards with mint icon tiles, mint choices card, `primary-action` back link.
- `apps/web/src/app/launch/CampaignHeader.tsx` (new). `apps/web/src/app/globals.css`: one `.k-campaign` background rule (09's block; the reduced-motion rules are untouched).
- `apps/web/scripts/campaign-smoke.mjs` (new, handed to 10). `docs/kyou-ux-refactor/handover/09-launch-campaign.md`, `09-campaign-inventory-before.json`, `09-campaign-inventory-after.json`.
- Screenshots in `docs/kyou-ux-refactor/screenshots/09/` (22 files): `launch`, `launch-clients`, `launch-providers`, `launch-confidentialite` at 320/390/1440, step 2 of both forms at 320/390/1440, the accepted state at 390 and 1440, categories unavailable at 390, the stale-privacy alert at 390.
- Unchanged: `page.tsx`, `clients/page.tsx`, `providers/page.tsx`, `campaign-data.ts`. No diff under `src/lib/campaign-*`, `proxy.ts`, `AppProviders.tsx`, `apps/backend` or `packages`.

#### Commands and results

| Command | Result |
| --- | --- |
| `node --test` on the five campaign test files | 28/28 pass, test files unchanged |
| `pnpm --filter @kayu/web type-check` | Pass, 0 errors |
| `NODE_ENV=production pnpm --filter @kayu/web build` | Pass; `/launch`, `/launch/clients`, `/launch/providers` dynamic, `/launch/confidentialite` static |
| Setup | Disposable database `kayu_09_campaign` (`migrate deploy` + taxonomy copied from `kayu_05_verify`); compiled backend on 3011 with `LAUNCH_PUBLIC_INTAKE_ENABLED=true`, `LAUNCH_FUNNEL_EVENTS_ENABLED=true`, notice `campaign-2026-07-25`; `next start` in campaign mode on 3009 and, with an unreachable `BACKEND_URL`, on 3019 |
| `campaign-smoke.mjs` on the pre-restyle build, twice | Two recordings identical (the tool is deterministic); kept as `09-campaign-inventory-before.json` |
| `campaign-smoke.mjs --checks` on the restyled build | 43/43: focus indicator on every tab stop in 17 states; privacy notice shows `campaign-2026-07-25` and `mailto:confidentialite@kayou.cd`; « Retour » keeps step-one values; categories unavailable disables the select and Continuer; no overflow at 320/390/1440 on the four routes and on step 2 of the three form routes; under reduced motion no transition or animation inside `.k-campaign` on step 2 and `html` scroll-behavior `auto` |
| `campaign-smoke.mjs --compare` before / after | `[id],[name]` inventory, tab order, dataLayer events and collector events identical in all 17 states and 3 journeys; the only aria/role/data difference is the removed `<img data-nimg>` of the old logo (now an inline `aria-hidden` SVG) |
| Database after the final run (lead tables truncated first) | 1 `ProviderLead` (`+243897812345`, WhatsApp, marketing consent, `STARTING`), 1 `ClientWaitlistLead` (`WITHIN_7_DAYS`, `WHATSAPP`), 3 `LeadSubmissionEvent` (`PROVIDER CREATED`, `CLIENT CREATED`, `PROVIDER DUPLICATE_REVIEW_REQUIRED` for the same phone), 59 `CampaignFunnelEvent`, 0 `User`, 0 `Provider`; the duplicate showed the same accepted state |
| `curl -sL` in campaign mode | `/services`, `/rechercher`, `/prestataire/abc`, `/login`, `/register` → `/launch` in one hop; `/providers/x?utm_source=fb&utm_campaign=k` and `/auth?utm_source=fb` → `/launch?…` in two hops with the query kept; `/` 200 (see open note); identical on the pre-restyle build |
| Stale privacy (Playwright, mocked 400 `PRIVACY_NOTICE_VERSION_MISMATCH`, 390 px) | `FormError` alert with the stale-notice copy, consent unchecked, submit enabled again, no overflow |

#### Remaining risks

- Chrome emulation only; iOS Safari and Android Chrome were not tried on devices. Inputs keep 16 px text to avoid the iOS focus zoom.
- The rate-limited, intake-disabled and network error states share the stale-privacy `FormError` path; only stale privacy was exercised.
- The overflow blind spot in 04's `overflow-check.mjs` (open note) means earlier 320 px evidence outside `/launch*` may need a re-run.

### 10 — QA, Hosting Move And Release

Status: Not started
