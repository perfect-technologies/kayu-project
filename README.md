# KAYOU

KAYOU is a service-provider marketplace for DRC and Congo-Brazzaville. This monorepo contains the NestJS API, Next.js web app, Expo mobile app, and shared packages used by all clients.

## Architecture

```text
apps/backend  NestJS API + Prisma + PostgreSQL
apps/web      Next.js frontend, SSR public pages, no API routes
apps/mobile   Expo React Native app

packages/schemas  Shared Zod schemas and DTOs
packages/api      Typed API client and query keys
packages/ui       Shared design tokens
packages/utils    Shared formatting, phone, distance, and date helpers

Docker Compose -> PostgreSQL on localhost:5433
Supabase       -> Auth sessions and JWTs for web/mobile
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop or a compatible Docker runtime
- Supabase project credentials for login flows

## Quickstart

```sh
pnpm run setup
pnpm dev:web
open http://localhost:3000
```

`pnpm run setup` installs dependencies, starts PostgreSQL, pushes the Prisma schema, and seeds demo data. Use `pnpm run setup` rather than `pnpm setup`; `pnpm setup` is a pnpm environment command.

For mobile development:

```sh
pnpm run setup
pnpm dev:mobile
```

## Environment

Create local env files from the examples:

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Backend:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, defaults to Docker on port `5433` |
| `SUPABASE_JWT_ISSUER` | Supabase JWKS URL used by the backend JWT guard |
| `SUPABASE_URL` | Supabase project URL, used by optional auth user seeding |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key, used only when `SEED_SUPABASE_USERS=true` |
| `SEED_SUPABASE_USERS` | Creates Supabase Auth demo users during `pnpm db:seed` when set to `true` |
| `PORT` | Backend port, defaults to `3001` |
| `CORS_ORIGINS` | Comma-separated allowed web/mobile origins |

Web:

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Server-side API origin, usually `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Web app origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Mobile:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL, usually `http://localhost:3001/api` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all app/package dev tasks through Turbo |
| `pnpm dev:web` | Run backend and web app |
| `pnpm dev:mobile` | Run backend and Expo app |
| `pnpm dev:backend` | Run backend only |
| `pnpm build` | Build all packages/apps |
| `pnpm type-check` | Type-check all packages/apps |
| `pnpm lint` | Run configured lint tasks |
| `pnpm clean` | Remove build outputs |
| `pnpm db:up` | Start local PostgreSQL |
| `pnpm db:down` | Stop Compose services |
| `pnpm db:push` | Push Prisma schema to PostgreSQL |
| `pnpm db:seed` | Seed categories, trades, demo users, providers, bookings, reviews, messages |
| `pnpm db:reset` | Reset database with Prisma and reseed |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm run setup` | Install, start database, push schema, seed data |

Optional pgAdmin:

```sh
docker compose --profile tools up -d pgadmin
open http://localhost:5050
```

Login: `admin@kayou.cd` / `admin`.

## Demo Accounts

Seeded local users use `Password123!` when Supabase Auth seeding is enabled.

| Role | Email |
| --- | --- |
| Admin | `admin@kayou.cd` |
| Provider | `jeanpierre.mukendi@kayou.cd` |
| Provider | `grace.mwamba@kayou.cd` |
| Client | `paul.kabasele@email.cd` |
| Client | `michelle.kazadi@email.cd` |

To make these work in the web/mobile login UI, set `SEED_SUPABASE_USERS=true` plus valid `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `apps/backend/.env`, then run `pnpm db:seed`. Without that flag, the seed creates local database users only.

In non-production builds, the web login dialog and mobile login screen show quick login cards for the client, provider, and admin demo accounts.

## Project Structure

```text
apps/
  backend/  NestJS API and Prisma schema/seeds
  web/      Next.js app
  mobile/   Expo app
packages/
  api/      API client
  schemas/  Zod schemas and DTOs
  ui/       Design tokens
  utils/    Shared helpers
docs/
  implementation-plan/
  DEVELOPER_GUIDE.md
```

## Contributing

1. Add or update schemas in `packages/schemas` first when the API contract changes.
2. Implement backend behavior in `apps/backend/src/modules`.
3. Expose new endpoints in `packages/api`.
4. Consume the typed client from web/mobile.
5. Run `pnpm type-check` before handing off.
