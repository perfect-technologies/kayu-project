# KAYOU Developer Guide

## Architecture Overview

KAYOU is split into deployable apps and shared packages:

- `apps/backend`: NestJS 11 REST API with Prisma and PostgreSQL.
- `apps/web`: Next.js App Router frontend. Public pages are SSR and data comes from the NestJS API through the `/api/*` proxy configured in `next.config.ts`.
- `apps/mobile`: Expo React Native app. **Frozen since 2026-09-16** (see below).
- `packages/schemas`: Zod schemas, DTOs, enums, and response contracts.
- `packages/api`: `ApiClient`, endpoint methods, `ApiError`, and query keys.
- `packages/ui`: shared tokens for colors, spacing, typography, radii, and brand.
- `packages/utils`: phone normalization, currency, distance, date, and class-name helpers.

Authentication is handled by Supabase on the clients. The backend validates Supabase JWTs through the JWKS URL in `SUPABASE_JWT_ISSUER`, then creates or syncs a local `User` row on the first authenticated request (`GET /me`).

Route slugs on the web are French. The screen map in `docs/kyou-ux-refactor/00-product-and-design-contract.md` §7 is the canonical list.

### Mobile freeze

`apps/mobile` is frozen since 2026-09-16. It targets the pre-refactor API (`@kayu/api` and `@kayu/schemas` before the K-YOU refactor) and does not build against `main` after the merge. It is excluded from the root `build`, `type-check` and `test:launch` scripts and from CI. The follow-up lives in `docs/kyou-mobile-refactor/`. See `apps/mobile/README.md`.

## Local Setup

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
pnpm run setup
pnpm dev:web
```

PostgreSQL runs through Docker Compose (`compose.yaml`) on `localhost:5433`. Prisma uses:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/kayu?schema=public
```

`DIRECT_URL` is optional locally and in CI. When it is absent the backend env loader sets it equal to `DATABASE_URL`. Hosted environments set both (see `docs/DEPLOYMENT.md`).

## Seed Data

Seed files live in `apps/backend/prisma`. `seed.ts` runs them in this order after a destructive `clearDatabase()` (launch-lead tables are never cleared):

- `seed-places.ts`: RDC + 26 provinces + their capitals, Kinshasa's 24 communes, Gombe's 10 quartiers, Congo + Brazzaville. Slugs are built from the parent chain (`cd-province-kinshasa-city-kinshasa-commune-gombe`).
- `seed-categories.ts`: the K-YOU taxonomy tree (19 categories, level-2 and level-3 subcategories) with K-YOU slugs, Lucide icons and Tailwind colour classes.
- `seed-references.ts`: reference lists (languages, intervention modes, currencies, price units) and one `SKILL` item per subcategory scoped to its category.
- `seed-settings.ts`: the 21 site settings keys (16 strings, 5 booleans) read by `GET /settings/public` and edited in `/admin`.
- `seed-demo.ts`: 15 curated providers and 13 clients with places, schedules (two ranges per weekday, 60 min slots, 15 min buffer), media, bookings in every status with snapshots, reviews, client reviews, transactions, conversations, notifications, one open report, one block, one pending place suggestion and three contact messages. Plus the `admin@kayou.cd` admin.
- `seed-demo-generated.ts`: 11 generated providers per category (198 in total; « Autres services » has no subcategory, so no provider can attach to it) from a seeded random generator: names, localities across Kinshasa communes, provincial capitals and Brazzaville, per-category descriptions, pricing and modes, all or half of the category's subcategories and services as skills, a past booking history with reviews so ratings are real, and a few open requests. They have no Supabase Auth account (`authUserId` prefix `seed-generated:`) and produce no notifications, so the curated demo inboxes stay readable.
- `seed.ts`: orchestrator, cleanup, optional Supabase Auth user creation, model counts at the end.

Run:

```sh
pnpm db:seed
```

The seed refuses to run when `NODE_ENV=production`.

To create Supabase Auth users for the demo credentials, set this in `apps/backend/.env`:

```env
SEED_SUPABASE_USERS=true
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
```

Then rerun `pnpm db:seed`. Demo password: `Password123!`. When the Auth user already exists, the seed re-links the local `User` row to it by email.

The web login page shows a dev-only demo accounts panel (`apps/web/src/components/auth/DemoAccountsPanel.tsx`, compiled out in production). It signs in with email and password through the normal Supabase path, so it requires the Supabase Auth users above, not just local database rows.

## API Endpoints

All paths are under `/api`. Auth is `Authorization: Bearer <supabase access token>` or the Supabase SSR cookie. The full contract, error codes and response shapes are in `docs/kyou-ux-refactor/handover/02-backend-contract.md`; real captured responses are in `handover/02-example-responses.json`.

Conventions:

- **Access**: `pub` = no auth; `pub (optional auth)` = anonymous allowed, response adapts to a signed-in viewer; `auth` = any signed-in active user, ownership checked in the service (404 when not visible); a role name = route-level `@Roles`.
- Suspended users get `403 { code: "ACCOUNT_SUSPENDED" }` on every authenticated route, including `GET /me`.
- Lists return `{ items, total, page, limit }`. `GET /notifications` adds `unreadCount`, `GET /conversations` adds `unreadTotal`.
- Mutations return the updated resource; deletes and fire-and-forget actions return `{ ok: true }`. Creating POSTs return 201; action POSTs return 200.
- Business errors are `{ statusCode, code, message, ...extra }`. Validation errors are `400 { message: "Validation failed", errors: [{ path, message, code }] }`. `ApiError.code` in `@kayu/api` surfaces `code`.
- Dates are ISO strings. Money is integer CDF. Times of day are `"HH:mm"`, local dates `"YYYY-MM-DD"` in the provider timezone.

Public:

- `GET /health`, `GET /stats`, `GET /settings/public`
- `GET /categories/tree`
- `GET /places`, `GET /places/:id/ancestors`, `GET /references`
- `GET /providers`, `GET /providers/:id`, `GET /providers/:id/availability`, `GET /providers/:id/reviews` (optional auth)
- `POST /contact`
- `GET /geocode`, `GET /distance`

Signed in (any role):

- `GET /me`, `PATCH /me/profile`, `POST /me/accept-terms`, `POST /me/avatar`, `DELETE /me`
- `POST /me/uploads/sign`, `GET /me/media/sign-read`
- `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel`
- `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `DELETE /conversations/:id/messages/:messageId`
- `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`
- `GET /blocks`, `POST /blocks`, `DELETE /blocks/:userId`, `POST /reports`
- `POST /places/suggestions`

CLIENT:

- `POST /me/provider` (publish a provider profile)
- `POST /bookings`
- `POST /conversations`
- `POST /reviews`, `GET /reviews/mine`
- `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id`
- `GET /dashboard/client`

PROVIDER:

- `PATCH /providers/me`, `PATCH /providers/me/availability`, `PUT /providers/me/schedule`, `PUT /providers/me/media`
- `POST /bookings/:id/confirm`, `POST /bookings/:id/complete`, `PATCH /bookings/:id/notes`
- `POST /reviews/:id/reply`, `POST /reviews/clients`, `GET /reviews/clients/:clientId/summary` (also ADMIN)
- `GET /pro/earnings/summary`, `GET /pro/earnings/transactions`
- `GET /pro/verification/state`, `POST /pro/verification/documents`, `DELETE /pro/verification/documents/:id`, `POST /pro/verification/submit`
- `GET /dashboard/provider`

ADMIN (all under `/admin`):

- `GET /overview`, `GET /health`, `GET /audit`
- `GET /users`, `PATCH /users/:id`, `GET /users/:id/cv`
- `GET /providers`, `PATCH /providers/:id`
- `GET /verification/submissions`, `PUT /verification/documents`
- `GET /bookings`, `POST /bookings/:id/cancel`
- `GET /reviews`, `PATCH /reviews/:id`, `DELETE /reviews/:id`
- `GET /conversations`, `DELETE /conversations/:id`, `GET /conversations/:id/messages`, `DELETE /messages/:id`
- `GET /reports`, `PATCH /reports/:id`
- `GET /contacts`, `PATCH /contacts/:id`, `DELETE /contacts/:id`
- `GET /categories`, `POST /categories`, `GET /categories/:id`, `PATCH /categories/:id`, `DELETE /categories/:id`
- `GET /subcategories`, `POST /subcategories`, `GET /subcategories/:id`, `PATCH /subcategories/:id`, `DELETE /subcategories/:id`
- `GET /places`, `POST /places`, `GET /places/:id`, `PATCH /places/:id`, `POST /places/merge`
- `GET /places/suggestions`, `POST /places/suggestions/:id/approve`, `POST /places/suggestions/:id/reject`
- `GET /references`, `POST /references`, `GET /references/:id`, `PATCH /references/:id`, `POST /references/merge`
- `GET /settings`, `PUT /settings`

Launch-lead routes (`/launch/*`) are unchanged from the campaign work and documented under `docs/launch-activation-closed-beta/`.

Test-only: `POST /test/session` exists only when `E2E_TEST_MODE=true` and `NODE_ENV !== production`. See "Testing And Verification".

## Database Overview

The schema is `apps/backend/prisma/schema.prisma`, shipped as a single `0_init` baseline migration. The design rationale is in `docs/kyou-ux-refactor/01-domain-and-schema-reset.md`. Money is integer CDF, times of day are `"HH:mm"` strings, dates are `timestamptz`.

Identity and providers:

- `User`: local profile keyed by Supabase `authUserId`. `role` is `CLIENT | PROVIDER | ADMIN`; `isActive = false` means suspended (`suspendedAt`, `suspendedReason`). Optional `placeId`.
- `Provider`: one-to-one with `User`. Deepest taxonomy node in `subcategoryId`, deepest place in `placeId`, pricing (`pricingAmount` + `ReferenceItem` currency and unit), timezone and slot settings, social links, `isAvailable`, `hidden` (admin unpublish), `verificationStatus` (`PENDING | UNDER_REVIEW | VERIFIED | REJECTED`), `premiumTier` (`FREE | VERIFIED | BOOSTED | ELITE`) with `premiumUntil`, and denormalised `ratingAvg`, `ratingCount`, `completedJobs`.
- `ProviderSkill`, `ProviderReference`: join tables to `ReferenceItem` for skills, languages and intervention modes. Free-text skills live in `Provider.freeSkills`.
- `ProviderMedia`: images, uploaded videos and YouTube videos (`kind`, `url`, `storagePath`, `youtubeId`, `order`).
- `AvailabilityRule` (up to 4 ranges per weekday) and `AvailabilityException` (closed day or custom range on a date).
- `VerificationDoc`: KYC uploads, unique per `(providerId, kind)`, with admin decision fields.

Taxonomy, places and reference lists:

- `Category` and `Subcategory`: three levels. `Subcategory.parentId` nests level 3 under level 2. Slugs are globally unique and match K-YOU.
- `Place`: tree of `COUNTRY | PROVINCE | CITY | TERRITORY | COMMUNE | SECTOR | CHIEFDOM | QUARTIER | VILLAGE` with aliases, source and merge support (`mergedIntoId`). `PlaceSuggestion` holds user-proposed places for admin approval.
- `ReferenceItem`: `LANGUAGE | INTERVENTION_MODE | CURRENCY | PRICE_UNIT | SKILL` items; `SKILL` items are scoped to a `Category`.

Bookings, reviews and ledger:

- `Booking`: `PENDING | CONFIRMED | COMPLETED | CANCELLED` with snapshots of `durationMin`, `bufferMin` and `timezone`, an optional place or inline address, `agreedPrice` set at completion, and commission fields. A partial unique index `booking_active_slot_unique` on `(providerId, scheduledAt)` for active statuses enforces one booking per slot.
- `Review` (client rates provider, one per booking, with provider `reply`) and `ClientReview` (provider rates client).
- `Transaction`: provider ledger, `EARNING | BONUS`, `PENDING | COMPLETED`.

Messaging, safety and misc:

- `Conversation` (unique per client and provider, with per-side unread counters) and `Message` (`body`, JSON `attachments`, soft delete via `deletedAt`).
- `Report` (`USER | PROVIDER | REVIEW | MESSAGE | CONVERSATION` targets, `OPEN | RESOLVED`) and `Block` (blocker, blocked).
- `ContactMessage`: public contact form inbox with `NEW | READ | REPLIED | CLOSED`.
- `Address`: client saved addresses (`HOME | WORK | OTHER`).
- `Notification`, `ActivityLog`, `SystemSetting`: alerts, admin audit trail, and the site settings keys.

Kept unchanged from the campaign work: `ProviderLead`, `ClientWaitlistLead`, `LeadSubmissionEvent`, `CampaignFunnelEvent`, `LeadTaxonomySnapshotOrphan` and their join tables. Deleting a taxonomy node still referenced by a lead fails on purpose.

## Adding A Feature

1. Add or update Zod DTOs and response schemas in `packages/schemas`.
2. Implement the backend module/controller/service in `apps/backend/src/modules`.
3. Validate request bodies and queries with `contractPipe("<SchemaName>")` from `apps/backend/src/common/contract`, which lazy-loads the schema from `@kayu/schemas`.
4. Add typed API client methods in `packages/api/src/endpoints.ts` and query keys in `packages/api/src/query-keys.ts`.
5. Wire the web UI through `@kayu/api`.
6. Add focused seed data if the feature needs demo records.
7. Add a `node:test` spec next to the service (see `apps/backend/src/modules/admin/admin-users.service.spec.ts` for the Prisma-fake pattern) and register it in the backend `test:launch` script if it is launch-critical.
8. Run `pnpm type-check`.

## Adding An API Endpoint

1. Define the DTO in `packages/schemas/src/dto.ts`.
2. Add the controller route in the relevant Nest module.
3. Use `SupabaseGuard`, `ActorGuard`, `OptionalActorGuard` and `RolesGuard` from `apps/backend/src/common/guards` as required.
4. Return the response shape expected by `@kayu/schemas`.
5. Add the method in `packages/api/src/endpoints.ts`.
6. Add or update query keys in `packages/api/src/query-keys.ts`.

## Adding A Shared Schema

1. Add enums to `packages/schemas/src/enums.ts` when needed.
2. Add model shapes to `packages/schemas/src/models.ts`.
3. Add request/response DTOs to `packages/schemas/src/dto.ts`.
4. Export from `packages/schemas/src/index.ts` if a new file is introduced.
5. Run `pnpm --filter @kayu/schemas type-check`.

The backend is CJS while `@kayu/schemas` is ESM. Use dynamic `await import("@kayu/schemas")` for runtime values; re-declare types locally or derive them with `Awaited<ReturnType<...>>`.

## Testing And Verification

Local gate before handing off:

```sh
pnpm db:up
pnpm db:reset
pnpm test:launch
pnpm type-check
```

`pnpm test:launch` is the launch chain: `@kayu/utils` tests and type-check, `@kayu/schemas`, `@kayu/api` and `@kayu/ui` type-check and build, the backend launch harness (`@kayu/backend test:launch`), backend and web type-check, then the web unit tests (`pnpm --filter @kayu/web test`, which runs `node --test src/lib/*.test.mjs`). Mobile is excluded everywhere.

The backend launch harness combines focused service specs (identity, storage, settings, places, references, categories, providers, bookings, reviews, earnings, dashboard, messaging, safety, contact, addresses, admin, verification, launch leads) with a Nest HTTP integration harness (`src/test/launch/launch-critical.harness.spec.ts`) that drives real controllers, guards, roles and validation pipes. Database-backed specs skip without a database locally and are forced in CI through the `*:ci` scripts.

Run a single spec from `apps/backend/`:

```sh
node --test -r ts-node/register src/modules/<module>/<file>.spec.ts
```

### Browser smoke (Playwright)

```sh
pnpm test:e2e            # pnpm --filter @kayu/web e2e -> playwright test
```

Config `apps/web/playwright.config.ts`, spec `apps/web/e2e/smoke.spec.ts`, projects `mobile-320`, `mobile-390`, `desktop-1440` and `reduced-motion`. Preconditions:

- backend on `:3001` started with `E2E_TEST_MODE=true` and `E2E_SEED_PASSWORD=Password123!` on a `pnpm db:reset` database
- web on `:3000` with `KAYOU_PUBLIC_WEB_MODE=marketplace`

Phone OTP cannot complete headlessly, so the suite signs in through the test-only session hook `POST /api/test/session` (module `apps/backend/src/modules/test-session/`). It is registered only when `E2E_TEST_MODE=true` and `NODE_ENV !== production`; the env validator rejects `E2E_TEST_MODE=true` with `NODE_ENV=production`. Body: `{ email }` for a seeded demo account (`@kayou.cd` or `@email.cd`, signed in with `E2E_SEED_PASSWORD`) or `{ phone }` to create or reuse a confirmed phone user. Never set `E2E_TEST_MODE` on a hosted environment.

### CI

`.github/workflows/ci.yml` runs on every push and pull request: install, build shared packages, Prisma generate, apply migrations to a disposable Postgres, launch-lead race integration, launch-lead orphan-upgrade integration, booking slot race integration (`test:bookings:ci`), launch harness smoke (`test:launch:harness:ci`), backend full test suite, type-check (mobile excluded), web unit tests, web production build, and the web e2e smoke (Chromium only, backend started in CI on the seeded disposable database with `E2E_TEST_MODE=true`).

There are no deploy workflows. Railway deploys from `main` with "Wait for CI", so `ci` is the only gate.

## Deployment

Hosted environments run on Railway (backend and web services) with Supabase Postgres, Auth and Storage. The runbook, env tables, seeding, admin creation and rollback are in `docs/DEPLOYMENT.md`.
