# Deployment Runbook

Operator reference for deploying Kayou to Render. See the spec at
`docs/superpowers/specs/2026-05-17-production-readiness-design.md` for the
rationale behind these decisions.

---

## 1. Overview

**Topology**

| Resource | Name | Notes |
|---|---|---|
| Render web service | `kayou-backend-dev` | NestJS API, dev env |
| Render web service | `kayou-web-dev` | Next.js, dev env |
| Render web service | `kayou-backend-prod` | NestJS API, prod env |
| Render web service | `kayou-web-prod` | Next.js, prod env |
| Render Postgres | `kayou-db-dev` | free (90-day expiry), frankfurt |
| Render Postgres | `kayou-db-prod` | basic-256mb, frankfurt |
| Supabase | `kayou-supabase-shared` | ONE shared project for both envs |

**Locked decisions**

- **Shared Supabase, split databases.** Auth (`auth.users`) and the storage
  bucket are shared between dev and prod. Each env gets its own Render Postgres
  for application data. Storage objects are isolated by `STORAGE_ENV_PREFIX`
  (`dev` in dev services, `prod` in prod services).
- **Native Node runtime.** All four services use `runtime: node` in
  `render.yaml` (no Docker).
- **Blueprint deploys.** The repo's `render.yaml` is the single source of
  truth for service configuration.
- **`autoDeploy: false` everywhere.** Render never deploys on git push.
  Deploys are triggered exclusively by the GitHub Actions deploy hooks after
  the CI gate passes.
- **Prisma migrations via `migrate deploy`.** The `preDeployCommand` on both
  backend services runs `pnpm --filter @kayu/backend exec prisma migrate deploy`
  before each release.
- **Deploy flow:** `main` push → `ci` workflow → on success `deploy-dev`
  fires. Prod: push a `v*` tag → `deploy-prod` re-runs the full gate, then
  fires prod hooks.
- **v1 URLs** are `*.onrender.com` (no custom domain required for launch).

---

## 2. One-time Render setup

### 2a. Create the Blueprint

1. In the Render dashboard → **Blueprints** → **New Blueprint Instance**.
2. Connect the GitHub repo and select `render.yaml` at the repo root.
3. Render creates all six resources (four services + two databases). The
   databases are provisioned first; the services start deploying once they exist.

> **Note:** On the first Blueprint apply, `kayou-web-dev` and `kayou-web-prod`
> may fail their initial build because `BACKEND_URL` is auto-wired from the
> backend service via `fromService … property: hostport` and the referenced
> backend service may not exist yet at that moment. This is expected and
> self-healing: the Next.js build intentionally throws when `BACKEND_URL` is
> unset (a web app that cannot reach the backend should not boot), so the
> failure is loud and immediate. Once the backend services are live, redeploy
> the web services (Render dashboard → service → **Manual Deploy** / "Clear
> build cache & deploy") and the build succeeds. Subsequent deploys are
> unaffected.

### 2b. Fill the `kayou-supabase-shared` env-var group

All four services pull from this group. Go to Render dashboard →
**Env Groups** → `kayou-supabase-shared` and set the following five keys from
your single Supabase project:

| Key | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_JWT_ISSUER` | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key |
| `NEXT_PUBLIC_SUPABASE_URL` | Same value as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |

These are all marked `sync: false` in `render.yaml`, meaning Render will never
overwrite them from the Blueprint — you fill them once in the dashboard.

### 2c. Set per-service `sync: false` env vars

These are also `sync: false` and must be set manually in each service's
environment settings in the Render dashboard.

**`kayou-backend-dev`**
```
CORS_ORIGINS=https://kayou-web-dev.onrender.com
```

**`kayou-web-dev`**
```
NEXT_PUBLIC_APP_URL=https://kayou-web-dev.onrender.com
```

**`kayou-backend-prod`**
```
CORS_ORIGINS=https://kayou-web-prod.onrender.com
```

**`kayou-web-prod`**
```
NEXT_PUBLIC_APP_URL=https://kayou-web-prod.onrender.com
```

### 2d. `DATABASE_URL` and connection pooling

`render.yaml` wires `DATABASE_URL` for both backend services via
`fromDatabase.property: connectionString`. Render injects the base connection
string automatically — no manual entry needed.

If you need to cap the connection pool on a lower-tier plan, append query
parameters to the resolved `DATABASE_URL` in each backend service's environment
settings:

```
postgresql://<user>:<password>@<host>/<db>?connection_limit=5&pool_timeout=20
```

Tune `connection_limit` to your plan's Postgres connection limit.

### 2e. `BACKEND_URL` is auto-wired (do not set it manually)

`render.yaml` sets `BACKEND_URL` on each web service via
`fromService.property: hostport` pointing at the same-env backend service.
Render resolves this to the backend's internal host:port (e.g.
`kayou-backend-dev:10000`). The Next.js server uses it to proxy `/api/*`
requests to the backend. Do not add `BACKEND_URL` manually — it would shadow
the auto-wired value.

---

## 3. GitHub secrets

The deploy workflows trigger Render via Deploy Hook URLs. Add these four
repository secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret name | Value |
|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND_DEV` | Deploy Hook URL for `kayou-backend-dev` |
| `RENDER_DEPLOY_HOOK_WEB_DEV` | Deploy Hook URL for `kayou-web-dev` |
| `RENDER_DEPLOY_HOOK_BACKEND_PROD` | Deploy Hook URL for `kayou-backend-prod` |
| `RENDER_DEPLOY_HOOK_WEB_PROD` | Deploy Hook URL for `kayou-web-prod` |

To get a Deploy Hook URL: Render dashboard → service → **Settings** →
**Deploy Hook** → copy the URL.

Because `autoDeploy: false` is set for every service in `render.yaml`, these
hooks are the **only** way deploys are triggered. Render will not deploy on
direct git pushes.

---

## 4. Deploy flow

### Dev (automatic after CI)

```
git push origin main
```

1. GitHub Actions runs the `ci` workflow: builds shared packages, runs the full
   backend test suite, type-checks backend/web/shared packages (mobile excluded),
   runs the web production build.
2. If `ci` succeeds, `deploy-dev` (`workflow_run` trigger) fires:
   - `curl -fsS -X POST $RENDER_DEPLOY_HOOK_BACKEND_DEV`
   - `curl -fsS -X POST $RENDER_DEPLOY_HOOK_WEB_DEV`
3. Render runs `preDeployCommand` on `kayou-backend-dev` (`prisma migrate deploy`),
   then starts the new revision. Health check at `/api/health` must pass.

### Prod (tag-triggered)

```bash
git tag v1.0.0
git push origin v1.0.0
```

1. The `deploy-prod` workflow fires on any `v*` tag push.
2. It re-runs the full CI gate (same steps as `ci`).
3. If the gate passes, it fires:
   - `curl -fsS -X POST $RENDER_DEPLOY_HOOK_BACKEND_PROD`
   - `curl -fsS -X POST $RENDER_DEPLOY_HOOK_WEB_PROD`
4. Render runs `preDeployCommand` on `kayou-backend-prod` (`prisma migrate deploy`),
   then starts the new revision.

You can also cut a GitHub Release on a `v*` tag — this also triggers the
`deploy-prod` workflow (the push of the tag fires the `push: tags: v*` trigger).

---

## 5. Database runbook

### Creating a new migration (local)

```bash
pnpm db:migrate
# prompts for a migration name, generates apps/backend/prisma/migrations/<timestamp>_<name>/
```

Commit the entire new `apps/backend/prisma/migrations/<timestamp>_<name>/`
directory. The migration runs automatically on the next deploy via
`preDeployCommand`.

### Applying migrations (CI / Render)

```bash
pnpm db:deploy
# runs: pnpm --filter @kayu/backend run prisma:migrate:deploy
# which runs: prisma migrate deploy
```

Render calls the equivalent command (`pnpm --filter @kayu/backend exec prisma migrate deploy`)
automatically as the `preDeployCommand` before each backend service start.

### Baseline for an existing database previously managed by `prisma db push`

A fresh Render Postgres (provisioned by the Blueprint) has no migration
history — `migrate deploy` will apply `0_init` and build the schema from
scratch. No extra steps needed for those.

If you are pointing at an **existing** database that was previously managed
by `prisma db push` (e.g. a database that already has the schema applied
without migration records), you must baseline it once:

```bash
# Run with that environment's DATABASE_URL set
cd apps/backend
npx prisma migrate resolve --applied 0_init
```

This records `0_init` as already applied without re-executing it. Subsequent
`migrate deploy` calls will only apply new migrations.

Before baselining, confirm the dev DB is in sync with the schema:

```bash
npx prisma migrate status
```

If it reports drift, reconcile the dev DB first (e.g. `pnpm db:reset` locally)
before baselining.

### Free dev database (90-day expiry)

`kayou-db-dev` uses Render's free Postgres plan, which Render deletes
automatically ~90 days after creation. When it expires, recreate it (Render
dashboard → New → Postgres with the name `kayou-db-dev`, or re-sync the
Blueprint) and the next `deploy-dev` run rebuilds the schema from `0_init`
via the backend `preDeployCommand` (`prisma migrate deploy`). The dev DB holds
no data worth keeping — it is rebuilt from migrations. Production
(`kayou-db-prod`, Basic-256mb) is a paid plan and is unaffected; upgrade it
later (Render dashboard → database → plan) as usage grows.

### Rollback

Prisma migrations are forward-only. To roll back:

1. Redeploy the previous tag in the Render dashboard (manual rollback).
2. If the schema must change, add a **new corrective migration** — never edit
   or delete an already-applied migration file.

### Seeding

```bash
pnpm db:seed
```

The seed script refuses to run when `NODE_ENV=production`. Never run it against
a prod database. Keep `SEED_SUPABASE_USERS=false` in all non-local environments.

---

## 6. Shared Supabase caveats

Dev and prod share one Supabase project. Consequences:

- `auth.users` is shared: a user who signs up in the dev app is also a valid
  user in the prod app. This is the accepted tradeoff for v1.
- Storage objects in the shared bucket are namespaced by `STORAGE_ENV_PREFIX`:
  `dev/` on `kayou-backend-dev`, `prod/` on `kayou-backend-prod`. Objects from
  one env are not accessible in the other.
- Supabase Auth JWT settings (issuer, JWT secret) are the same for both envs.
  Both backend services validate tokens against the same JWKS endpoint.

---

## 7. Secret hygiene

- `.env*` files are gitignored. Only `.env.example` files are tracked.
- The `SUPABASE_SERVICE_KEY` (service-role key) in `apps/backend/.env` was
  never committed.
- If your local dev machine is compromised or untrusted, rotate the
  service-role key in Supabase (Project Settings → API → Regenerate). Update
  the `kayou-supabase-shared` env-var group in Render with the new value.
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public (it's the anon
  key, row-level security protects the data). No rotation needed if leaked.

---

## 8. Custom domain (later)

To move off `*.onrender.com` — no code changes are required, URLs are
fully env-driven:

1. Update `CORS_ORIGINS` on the backend service to the custom domain.
2. Update `NEXT_PUBLIC_APP_URL` on the web service to the custom domain.
3. Add the custom domain in Render (service → Settings → Custom Domains).
4. Add the custom domain to Supabase Auth's allowed redirect URLs and site URL
   (Supabase → Authentication → URL Configuration).

For prod, also update the two Render env vars and Supabase config with the
production custom domain.
