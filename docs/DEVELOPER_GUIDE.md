# KAYOU Developer Guide

## Architecture Overview

KAYOU is split into deployable apps and shared packages:

- `apps/backend`: NestJS 11 REST API with Prisma and PostgreSQL.
- `apps/web`: Next.js 16 App Router frontend. Public pages are SSR and data comes from the NestJS API.
- `apps/mobile`: Expo React Native app using the same API client and schemas.
- `packages/schemas`: Zod schemas, DTOs, enums, and response contracts.
- `packages/api`: `ApiClient`, endpoint methods, and query keys.
- `packages/ui`: shared tokens for colors, spacing, typography, shadows, and brand.
- `packages/utils`: phone normalization, currency, distance, date, and class-name helpers.

Authentication is handled by Supabase on the clients. The backend validates Supabase JWTs through the JWKS URL in `SUPABASE_JWT_ISSUER`, then creates or syncs a local `User` row on first authenticated request.

## Local Setup

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
pnpm run setup
pnpm dev:web
```

PostgreSQL runs through Docker Compose on `localhost:5433`. Prisma uses:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/kayu?schema=public
```

## Seed Data

Seed files live in `apps/backend/prisma`:

- `seed.ts`: orchestrator, cleanup, optional Supabase Auth user creation.
- `seed-categories.ts`: 15 categories and 40 subcategories migrated from the legacy app.
- `seed-demo.ts`: demo users, providers, subcategory assignments, bookings, reviews, favorites, conversations, notifications, visibility settings, and system settings.

Run:

```sh
pnpm db:seed
```

To create Supabase Auth users for the demo credentials, set this in `apps/backend/.env`:

```env
SEED_SUPABASE_USERS=true
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
```

Then rerun `pnpm db:seed`. Demo password: `Password123!`.

The web login dialog and mobile login screen include quick login cards in non-production builds. Those cards call the normal Supabase email/password login path, so they require the Supabase Auth users above, not just local database rows.

## API Endpoints

All endpoints are under `/api`.

Public:

- `GET /`
- `GET /stats`
- `GET /categories`
- `GET /categories/hierarchy`
- `GET /providers`
- `GET /providers/:id`
- `GET /reviews`
- `GET /geocode`
- `GET /distance`

Authenticated user:

- `GET /me`
- `PATCH /me/profile`
- `PATCH /me/role`
- `POST /me/provider-onboarding`
- `GET /bookings`
- `POST /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id`
- `DELETE /bookings/:id`
- `POST /reviews`
- `GET /messages`
- `POST /messages`
- `GET /notifications`
- `PATCH /notifications/read-all`
- `PATCH /notifications/:id/read`
- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites`
- `GET /settings/visibility`
- `PUT /settings/visibility`
- `GET /dashboard/provider`
- `GET /dashboard/client`
- `PATCH /providers/me`

Admin:

- `GET /admin/users`
- `PUT /admin/users`
- `GET /admin/providers`
- `PUT /admin/providers`
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories`
- `DELETE /admin/categories`
- `GET /admin/reviews`
- `PUT /admin/reviews`
- `DELETE /admin/reviews`
- `GET /dashboard/admin`

## Database Overview

Core models:

- `User`: local profile keyed by Supabase `authUserId`.
- `Provider`: professional profile linked one-to-one to `User`.
- `Category`, `Subcategory`, `ProviderSubcategory`, `Skill`: marketplace taxonomy and provider skills.
- `Booking`: client/provider service request lifecycle.
- `Review`, `ClientReview`: bidirectional reputation.
- `TrustScore`, `ProviderBadge`, `Certification`: provider trust system.
- `Conversation`, `Message`, `Notification`: messaging and alerts.
- `Favorite`, `VisibilitySettings`, `SystemSetting`: personalization and admin configuration.

When writing provider badges, use `TrustScore.id` in `ProviderBadge.providerId`. The field name is legacy, but the relation points to `TrustScore`.

## Adding A Feature

1. Add or update Zod DTOs and response schemas in `packages/schemas`.
2. Implement the backend module/controller/service in `apps/backend/src/modules`.
3. Validate request bodies with the shared Zod schemas.
4. Add typed API client methods and query keys in `packages/api`.
5. Wire web and mobile UI through `@kayu/api`.
6. Add focused seed data if the feature needs demo records.
7. Run `pnpm type-check`.

## Adding An API Endpoint

1. Define the DTO in `packages/schemas/src/dto.ts`.
2. Add the controller route in the relevant Nest module.
3. Use `SupabaseGuard`, `ActorGuard`, and `RolesGuard` as required.
4. Return the response shape expected by `@kayu/schemas`.
5. Add the method in `packages/api/src/client.ts`.
6. Add or update query keys in `packages/api`.

## Adding A Shared Schema

1. Add enums to `packages/schemas/src/enums.ts` when needed.
2. Add model shapes to `packages/schemas/src/models.ts`.
3. Add request/response DTOs to `packages/schemas/src/dto.ts`.
4. Export from `packages/schemas/src/index.ts` if a new file is introduced.
5. Run `pnpm --filter @kayu/schemas type-check`.

## Testing And Verification

Current launch checks:

```sh
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm test:launch
pnpm type-check
```

Launch-critical automated coverage now lives in `pnpm test:launch`. That command rebuilds shared packages, runs the backend launch harness (`@kayu/backend test:launch`), then runs the backend and mobile type checks used by the launch audit.

The backend launch harness now combines:

- focused service specs for identity, onboarding/providers, bookings, messaging, quotes, reviews, admin, and verification
- a Nest HTTP integration harness that drives real controllers, guards, roles, and Zod validation pipes for launch-critical auth, booking, messaging, quote, and review flows

Mobile smoke coverage is documented under `apps/mobile/e2e/manual/` and should be run against the seeded environment before release candidates.

## Deployment Notes

Production deployment is out of scope for this migration chunk. Expected future work:

- Use managed PostgreSQL and a production `DATABASE_URL`.
- Configure Supabase Auth project URLs and JWKS for each environment.
- Add CI/CD and deployment Dockerfiles.
- Add object storage for uploaded portfolio/certification images.
- Add monitoring, logging, and backups.
