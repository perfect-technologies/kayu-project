# Deployment Runbook

Operator reference for hosting KAYOU on **Railway** (compute) and **Supabase** (Postgres, Auth, Storage). Written for the K-YOU refactor release; the decisions come from `docs/kyou-ux-refactor/10-qa-migration-and-release.md` section C.

Nothing on the previous host ever served real users. There is no data migration: the Supabase database is provisioned empty and the backend applies the single `0_init` migration on its first deploy.

---

## 1. Topology

| Piece | Where | Notes |
| --- | --- | --- |
| Auth, Storage, **Postgres** | Supabase project `kayou-supabase-shared` (existing) | One project. Database and buckets are namespaced by `STORAGE_ENV_PREFIX`. |
| API (`@kayu/backend`) | Railway service `backend` | Node, built from the repo root with config as code. |
| Web (`@kayu/web`) | Railway service `web` | Next.js standalone start. Proxies `/api/*` to the backend over Railway private networking. |
| Environments | One Railway environment `production` | Used for QA now and for the closed beta later. A `staging` environment is added only when real users exist. |

Local development does not touch any of this. It keeps the Docker Compose Postgres from `compose.yaml` on `localhost:5433`. CI uses a disposable Postgres service. Both work with `DATABASE_URL` alone: `DIRECT_URL` is optional there, and when it is absent the backend env loader sets it equal to `DATABASE_URL`.

**Locked decisions**

- **One Supabase project.** Auth, Storage and Postgres live in `kayou-supabase-shared`. No second project until the closed beta needs a staging environment.
- **Config as code.** `railway/backend.json` and `railway/web.json` are the source of truth for build and deploy settings. The Railway dashboard holds only environment variables, the domain and the branch/CI settings.
- **Deploys follow `main` and wait for CI.** Railway watches `main` with "Wait for CI" enabled, so a deploy starts only after the GitHub `ci` check suite passes. There are no deploy workflows in `.github/workflows/`; `ci.yml` is the only gate.
- **Prisma migrations via `migrate deploy`.** The backend `preDeployCommand` runs `pnpm --filter @kayu/backend exec prisma migrate deploy` before each release, through `DIRECT_URL`.
- **No public domain on the backend.** The web service reaches it at `http://backend.railway.internal:3001`. The backend binds `::` so that Railway private networking (IPv6) reaches it.
- **Seeding never runs in a deploy.** Demo data is seeded once from a developer machine (section 5).

---

## 2. Supabase Postgres and buckets

### 2a. Connection strings

1. In the Supabase dashboard, Project Settings → Database → Connection string. Copy two strings:
   - **Transaction pooler** (Supavisor, port `6543`) → `DATABASE_URL`, with `?pgbouncer=true&connection_limit=10` appended. Prisma Client uses this at runtime. `pgbouncer=true` disables prepared statements, which transaction mode requires.
   - **Session pooler** (Supavisor, port `5432`) → `DIRECT_URL`. Prisma CLI (`migrate deploy`) uses this. The session pooler is IPv4-reachable; the raw direct connection is IPv6-only and Railway egress cannot be assumed to reach it.
2. Percent-encode the database password in both strings.

Shape of the two values:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<encoded-password>@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=10
DIRECT_URL=postgresql://postgres.<project-ref>:<encoded-password>@<pooler-host>:5432/postgres
```

The Prisma datasource in `apps/backend/prisma/schema.prisma` declares both: `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`.

### 2b. Storage buckets

Storage → create the four buckets the backend's `BUCKETS` map (`apps/backend/src/modules/storage/storage.service.ts`) expects, if missing:

| Bucket | Visibility | File size limit |
| --- | --- | --- |
| `avatars` | public | 8 MB |
| `provider-media` | public | 25 MB |
| `message-attachments` | **private** | 8 MB |
| `verification-docs` | **private** | 10 MB |

No RLS policies are needed; the backend uses the service key and signs uploads and reads. Objects are namespaced by `STORAGE_ENV_PREFIX` (`prod` on Railway).

### 2c. Backups

On the Supabase free tier there are none. Before the closed beta opens, either upgrade to Pro (daily backups, 7-day retention) or schedule a weekly `pg_dump` through `DIRECT_URL` from a GitHub Actions cron into a private artifact. Record the choice in `docs/kyou-ux-refactor/PROGRESS.md`.

---

## 3. Railway project

### 3a. Create the project and services

1. Create project `kayou`, environment `production`. Connect the GitHub repo.
2. Create service **backend** from the repo, root directory `/`. Point the service's "Config file path" setting at `railway/backend.json`:

   ```json
   {
     "$schema": "https://railway.com/railway.schema.json",
     "build": {
       "builder": "RAILPACK",
       "buildCommand": "pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/backend",
       "watchPatterns": ["apps/backend/**", "packages/**", "pnpm-lock.yaml", "railway/backend.json"]
     },
     "deploy": {
       "preDeployCommand": ["pnpm --filter @kayu/backend exec prisma migrate deploy"],
       "startCommand": "node apps/backend/dist/main.js",
       "healthcheckPath": "/api/health",
       "healthcheckTimeout": 120,
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 5
     }
   }
   ```

3. Create service **web** the same way, "Config file path" at `railway/web.json`:

   ```json
   {
     "$schema": "https://railway.com/railway.schema.json",
     "build": {
       "builder": "RAILPACK",
       "buildCommand": "pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/web",
       "watchPatterns": ["apps/web/**", "packages/**", "pnpm-lock.yaml", "railway/web.json"]
     },
     "deploy": {
       "startCommand": "pnpm --filter @kayu/web start",
       "healthcheckPath": "/",
       "healthcheckTimeout": 120,
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 5
     }
   }
   ```

4. Generate a public domain for **web** only. The backend needs no public domain; it is reached over private networking. If the mobile app or an external client ever needs the API directly, add a domain then.
5. Service settings for both: branch `main`, **Wait for CI** enabled so a deploy starts only after the `ci` check suite passes. During QA before the merge, set the branch to `refactor/kyou-ux` temporarily.

### 3b. Environment variables

Backend:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | Supabase transaction pooler string (2a) |
| `DIRECT_URL` | Supabase session pooler string (2a) |
| `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_KEY` | from the Supabase project |
| `STORAGE_ENV_PREFIX` | `prod` |
| `CORS_ORIGINS` | the web public URL, exactly |
| `SEED_SUPABASE_USERS` | `false` |
| `LAUNCH_PUBLIC_INTAKE_ENABLED`, `LAUNCH_FUNNEL_EVENTS_ENABLED` | `false` until the campaign is re-enabled after smoke |
| `LAUNCH_PRIVACY_NOTICE_VERSION`, `LAUNCH_RATE_LIMIT_HASH_KEY`, `LAUNCH_*` limits | copied from the Render backend-prod service before it is deleted |
| `E2E_TEST_MODE` | **absent** |

Web:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `BACKEND_URL` | `http://backend.railway.internal:3001` |
| `NEXT_PUBLIC_APP_URL` | the web public URL |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from the Supabase project |
| `KAYOU_PUBLIC_WEB_MODE` | `marketplace` for QA; whatever the campaign plan says afterwards |
| `NEXT_PUBLIC_CAMPAIGN_PRIVACY_NOTICE_VERSION`, `NEXT_PUBLIC_CAMPAIGN_PRIVACY_CONTACT` | copied from Render web-prod |

Notes:

- `BACKEND_URL` is read at build time by `apps/web/next.config.ts`, so it must be set before the first web build. The build hard-fails when it is unset.
- `E2E_TEST_MODE` must be absent in production. The backend env validator rejects `E2E_TEST_MODE=true` together with `NODE_ENV=production`, so a stray value fails the deploy at boot rather than exposing the test session hook.
- Where to find the Supabase values: `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are the Project URL; `SUPABASE_JWT_ISSUER` is `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`; `SUPABASE_SERVICE_KEY` is the service-role key; `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key. All under Project Settings → API.

### 3c. First deploy

Order: **backend, then web**.

1. Deploy the backend. The `preDeployCommand` applies `0_init` to the empty Supabase database through `DIRECT_URL`, then the service starts and Railway checks `/api/health`.
2. Deploy the web service.
3. Confirm `GET https://<web>/api/health` returns `ok` through the proxy:

   ```sh
   curl -fsS https://<web-domain>/api/health
   ```

---

## 4. Deploy flow

```
git push origin main
```

1. GitHub Actions runs the `ci` workflow (install, shared package builds, Prisma generate, migrations on a disposable Postgres, integration and unit suites, type-check, web unit tests, web production build, web e2e smoke). See `docs/DEVELOPER_GUIDE.md` for the step list.
2. Railway sees the push on `main` and, because "Wait for CI" is on, holds the deploy until the `ci` check suite is green. A red suite means no deploy.
3. Each service rebuilds only when a path in its `watchPatterns` changed. The backend runs `prisma migrate deploy` before starting.

There is no separate dev or prod pipeline and no tag-triggered deploy. One environment, one branch.

---

## 5. Data for QA

### 5a. Seed once from a developer machine

Never seed from the service. The seed starts with a destructive `clearDatabase()` and refuses to run when `NODE_ENV=production`.

```sh
DATABASE_URL="<DIRECT_URL value>" DIRECT_URL="<DIRECT_URL value>" NODE_ENV=development SEED_SUPABASE_USERS=true pnpm --filter @kayu/backend run db:seed
```

`assertSeedAllowed()` passes because `NODE_ENV` is not `production` on the developer machine. `SEED_SUPABASE_USERS=true` is required: the demo rows are written with a `seed:<email>` placeholder id, and only that step links them to their Supabase Auth users (it re-links by email when the Auth user already exists and creates the missing ones). Without it the demo accounts cannot sign in.

### 5b. Create the operator admin

1. Sign in once with the operator phone on the deployed web so the `User` row exists.
2. In the Supabase SQL editor:

   ```sql
   UPDATE "User" SET role = 'ADMIN', "roleSelectedAt" = now() WHERE "authUserId" = '<sub>';
   ```

   `<sub>` is the Supabase Auth user id of the operator account.

### 5c. Beta clean slate

Before the closed beta opens, wipe the demo data from a developer machine, then recreate the admin (5b):

```sh
DATABASE_URL="<DIRECT_URL value>" DIRECT_URL="<DIRECT_URL value>" pnpm --filter @kayu/backend exec prisma migrate reset --force --skip-seed
```

Prisma CLI reads `directUrl`, so `DIRECT_URL` must be set wherever `prisma migrate` runs by hand.

This is logged as the "beta clean slate" step in `docs/kyou-ux-refactor/PROGRESS.md`.

---

## 6. Database runbook

### Creating a new migration (local)

```sh
pnpm db:migrate
```

Prisma prompts for a name and writes `apps/backend/prisma/migrations/<timestamp>_<name>/`. Commit the whole directory. The migration runs on the next backend deploy through the `preDeployCommand`.

### Applying migrations

```sh
pnpm db:deploy
```

Locally and in CI this applies pending migrations to the database in `DATABASE_URL`. On Railway the equivalent command runs automatically before each backend start, through `DIRECT_URL`.

The migration history is a single `0_init` baseline. Do not edit an applied migration; add a later forward migration instead. `launch-leads.migration-integrity.spec.ts` pins the baseline checksum and fails `test:launch` if it changes.

### Backups

See 2c. Until the backup choice is made and recorded, treat the hosted database as disposable: it holds seed and QA data only.

---

## 7. Rollback

- **Before the merge**, tag `main` as `pre-kyou-ux`.
- **Code.** Railway keeps deployment history per service; "Redeploy" on a previous deployment restores it. Because both services build from `main`, a durable rollback is a revert commit plus redeploy.
- **Database.** No rollback is needed for this refactor: the Supabase database starts empty on the new baseline. After the closed beta opens, the backup choice in 2c is the rollback path. Rehearse a restore into a scratch Supabase project once before opening the beta.
- **Schema.** Prisma migrations are forward-only. If the schema must change back, add a new corrective migration; never edit or delete an applied one.

---

## 8. Secret hygiene

- `.env*` files are gitignored. Only `.env.example` files are tracked.
- The `SUPABASE_SERVICE_KEY` (service-role key) is set only on the Railway backend service and in local `apps/backend/.env`. It was never committed.
- If a developer machine is compromised, rotate the service-role key in Supabase (Project Settings → API) and update the Railway backend variable.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public. No rotation needed if leaked.
- The database password is part of both connection strings. Rotating it in Supabase means updating `DATABASE_URL` and `DIRECT_URL` on the backend service.

---

## 9. Later

- **Custom domain.** URLs are env-driven, no code change: add the domain on the Railway web service, then update `CORS_ORIGINS` (backend), `NEXT_PUBLIC_APP_URL` (web) and the Supabase Auth site URL and redirect URLs (Authentication → URL Configuration).
- **Staging environment.** Add a second Railway environment and a second Supabase project only when real users exist on `production`. Until then, QA runs on the single environment against seed data.
