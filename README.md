# KAYOU

KAYOU is a service-provider marketplace for DRC and Congo-Brazzaville. This monorepo contains the NestJS API, Next.js web app, the frozen Expo mobile app, and shared packages used by all clients.

## Architecture

```text
apps/backend  NestJS API + Prisma + PostgreSQL
apps/web      Next.js frontend, SSR public pages, /api/* proxied to the backend
apps/mobile   Expo React Native app (frozen since 2026-09-16, see apps/mobile/README.md)

packages/schemas  Shared Zod schemas and DTOs
packages/api      Typed API client and query keys
packages/ui       Shared design tokens
packages/utils    Shared formatting, phone, distance, and date helpers

Local     Docker Compose -> PostgreSQL on localhost:5433
Hosted    Railway (backend + web services) -> Supabase Postgres
Supabase  Auth sessions and JWTs, Storage buckets (all environments)
```

Hosting details, env tables and the release runbook are in `docs/DEPLOYMENT.md`.

## Prerequisites

- Node.js 22
- pnpm 10+
- Docker Desktop or a compatible Docker runtime
- Supabase project credentials for login flows

## Quickstart

```sh
pnpm run setup
pnpm dev:web
open http://localhost:3000
```

`pnpm run setup` installs dependencies, starts PostgreSQL, applies migrations, and seeds demo data. Use `pnpm run setup` rather than `pnpm setup`; `pnpm setup` is a pnpm environment command.

## Environment

Create local env files from the examples:

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

Backend:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, defaults to Docker on port `5433`; Supabase transaction pooler string in hosted environments |
| `DIRECT_URL` | Supabase session pooler string used by Prisma CLI; optional, defaults to `DATABASE_URL` |
| `SUPABASE_JWT_ISSUER` | Supabase JWKS URL used by the backend JWT guard |
| `SUPABASE_URL` | Supabase project URL, used for Storage and optional auth user seeding |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key, used for Storage signing and `SEED_SUPABASE_USERS=true` |
| `STORAGE_ENV_PREFIX` | Per-environment namespace inside the Storage buckets |
| `SEED_SUPABASE_USERS` | Creates Supabase Auth demo users during `pnpm db:seed` when set to `true` |
| `PORT` | Backend port, defaults to `3001` |
| `CORS_ORIGINS` | Comma-separated allowed web origins |
| `E2E_TEST_MODE`, `E2E_SEED_PASSWORD` | Test-only session hook for the Playwright suite; never set in hosted environments |

Web:

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Server-side API origin, `http://localhost:3001` locally, `http://backend.railway.internal:3001` on Railway |
| `NEXT_PUBLIC_APP_URL` | Web app origin |
| `KAYOU_PUBLIC_WEB_MODE` | `marketplace` or `campaign` (locks the public site to `/launch`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all app/package dev tasks through Turbo |
| `pnpm dev:web` | Run backend and web app |
| `pnpm dev:backend` | Run backend only |
| `pnpm build` | Build packages and apps (mobile excluded) |
| `pnpm type-check` | Type-check packages and apps (mobile excluded) |
| `pnpm test:launch` | Launch gate: shared packages, backend launch harness, type-checks, web unit tests |
| `pnpm test:e2e` | Playwright browser smoke for the web app (see preconditions in `docs/DEVELOPER_GUIDE.md`) |
| `pnpm lint` | Run configured lint tasks |
| `pnpm clean` | Remove build outputs |
| `pnpm db:up` | Start local PostgreSQL |
| `pnpm db:down` | Stop Compose services |
| `pnpm db:migrate` | Create a new Prisma migration (dev only) |
| `pnpm db:deploy` | Apply pending migrations to the local database |
| `pnpm db:seed` | Seed places, taxonomy, reference lists, site settings and demo data |
| `pnpm db:reset` | Reset database with Prisma and reseed |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm run setup` | Install, start database, apply migrations, seed data |

Optional pgAdmin:

```sh
docker compose --profile tools up -d pgadmin
open http://localhost:5050
```

Login: `admin@kayou.cd` / `admin`.

## Demo Accounts

`apps/backend/prisma/seed-demo.ts` creates 15 curated providers (`@kayou.cd`), 13 clients (`@email.cd`) and one admin, plus 11 generated providers per category (`seed-demo-generated.ts`, deterministic, no Supabase Auth accounts) so every category with subcategories has at least 11 profiles (« Autres services » has none and stays empty). The password is `Password123!` for all of them.

| Role | Email |
| --- | --- |
| Admin | `admin@kayou.cd` |
| Provider | `jeanpierre.mukendi@kayou.cd` |
| Provider | `grace.mwamba@kayou.cd` |
| Client | `paul.kabasele@email.cd` |
| Client | `michelle.kazadi@email.cd` |

These accounts are linked to Supabase Auth only when `SEED_SUPABASE_USERS=true` (with valid `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`) is set in `apps/backend/.env` before `pnpm db:seed`: the seed creates the missing Auth users and re-links existing ones by email. Without the flag the seed creates local database rows only, and the demo accounts cannot sign in.

In non-production builds the web login page shows a demo accounts panel that signs in with these credentials.

## Web Routes

Route slugs are French. The canonical screen map is `docs/kyou-ux-refactor/00-product-and-design-contract.md` §7.

| Route | Audience |
| --- | --- |
| `/`, `/rechercher`, `/services`, `/prestataire/[id]` | public |
| `/premium`, `/contact`, `/cgu`, `/confidentialite`, `/bienvenue` | public |
| `/login`, `/register` | public, outside the shell |
| `/prestataire/nouveau`, `/prestataire/[id]/modifier` | signed in, owner or admin |
| `/mon-espace`, `/revenus`, `/verification` | PROVIDER |
| `/mes-reservations`, `/avis`, `/adresses` | CLIENT |
| `/reservation/[id]`, `/messagerie`, `/notifications`, `/aide`, `/compte` | signed in |
| `/admin?tab=…` | ADMIN |
| `/launch`, `/launch/clients`, `/launch/providers`, `/launch/confidentialite` | campaign, public |

## Project Structure

```text
apps/
  backend/  NestJS API and Prisma schema/seeds
  web/      Next.js app
  mobile/   Expo app (frozen)
packages/
  api/      API client
  schemas/  Zod schemas and DTOs
  ui/       Design tokens
  utils/    Shared helpers
railway/    Railway config as code (backend.json, web.json)
docs/
  DEPLOYMENT.md
  DEVELOPER_GUIDE.md
  kyou-ux-refactor/   product contract, workstreams, handover docs
```

## Contributing

1. Add or update schemas in `packages/schemas` first when the API contract changes.
2. Implement backend behavior in `apps/backend/src/modules`.
3. Expose new endpoints in `packages/api`.
4. Consume the typed client from the web app.
5. Run `pnpm test:launch` before handing off.
