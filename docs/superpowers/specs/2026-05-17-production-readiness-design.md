# Production Readiness — Design Spec

**Date:** 2026-05-17
**Scope:** Backend (NestJS), Web (Next.js), DB/Prisma, environment variables, CI/CD, Render deployment.
**Out of scope:** Mobile (Expo) deployment — deferred to a later effort.

## 1. Goal

Take the Kayou monorepo from "almost ready" to production-deployable on Render with two
environments (dev and prod), CI-gated deploys, reproducible database migrations, and a
hardened backend/web surface.

## 2. Locked decisions

These were decided during brainstorming and are not open for re-litigation in the plan:

| Decision | Choice |
|---|---|
| Environment isolation | **Shared Supabase project** (auth/storage/JWT issuer) across dev+prod; **separate Render Postgres** per env |
| Render setup | **`render.yaml` Blueprint, native Node runtime** (no Docker) |
| Deploy trigger | **CI-gated via GitHub Actions** (deploys fire only after CI is green) |
| Migration strategy | **Adopt Prisma migrations** — baseline from current schema, `migrate deploy` as release command |
| Branch → env | **`main` → dev auto** (CI-gated); **production deploys only on git tag / GitHub Release** (CI-gated) |
| CI scope | Fix failing harness spec, run **full backend suite (all 18 specs)**, add web `next build` + `type-check`, build shared packages. **No ESLint.** |
| Domain | **`*.onrender.com` for v1.** OG/app URL + CORS fully env-driven so a custom domain is a later config change. |
| Render deploy mechanism | **Deploy hooks** (not Render API) — one secret per service, no API key to manage |
| Shared-storage mitigation | Namespace Supabase storage object paths by env prefix (`dev/…` vs `prod/…`) |
| Rate limiting | Deferred to fast-follow (not in this scope) |

## 3. Audit findings (baseline state)

**Correction to an earlier alarm:** `apps/backend/.env` is **not** committed — only `.env.example`
files are tracked and `.env*` is correctly gitignored. The Supabase service key exists only in
the local dev `.env`. No git leak. Rotation is advisory (untrusted machine only).

### 🔴 Blockers
- No `prisma/migrations/` — project uses `prisma db push`. No reproducible/automated schema deploy.
- No `render.yaml`, no build/start strategy for extracting a single app from the pnpm+Turbo monorepo.
- Backend `main.ts`: `app.listen(port)` doesn't bind `0.0.0.0`; no `enableShutdownHooks()`; no trust proxy. `build` script does not run `prisma generate` → runtime crash.
- `next.config.ts` `BACKEND_URL` falls back to `http://localhost:3001` — prod silently breaks if unset.
- `prisma/seed.ts` calls `clearDatabase()` with no `NODE_ENV=production` guard — can wipe prod.
- `launch-critical.harness.spec.ts` suite currently fails — CI cannot be a real gate until green.

### 🟡 Important
- No env-var validation at startup (backend, web).
- No structured logging; no global exception filter (5xx stack-trace leakage).
- No `helmet` on backend.
- Health endpoint at `/api` does not check DB connectivity; Render needs a real health path.
- No connection-limit tuning on `DATABASE_URL` for managed Postgres.
- CI runs only a backend subset; no web `build`/`type-check`; lint scripts are `echo 'no linter configured'`.
- Node version mismatch: workflow says 22, README says 20+, no `.nvmrc`/`engines`.
- OG metadata URL hardcoded (`kayou.cd`); OpenStreetMap tile domain missing from `next.config` image allowlist (maps break in prod).

### 🟢 Already solid
pnpm + Turbo workspaces; Next.js `output: standalone`; NestJS build; `.env.example` for all apps;
`.env*` gitignored; Supabase SSR auth; working backend test infra (`node:test`).

## 4. Target architecture

### 4.1 Topology

One committed `render.yaml` defining four web services + two databases:

| Service | Deploy trigger | DB |
|---|---|---|
| `kayou-backend-dev` | push to `main` (CI-gated) | `kayou-db-dev` |
| `kayou-web-dev` | push to `main` (CI-gated) | — |
| `kayou-backend-prod` | git tag `v*` / GitHub Release (CI-gated) | `kayou-db-prod` |
| `kayou-web-prod` | git tag `v*` / GitHub Release (CI-gated) | — |

`autoDeploy: false` on all services. Render cannot deploy on tags and we require CI gating, so
**GitHub Actions triggers every deploy via per-service Render deploy hooks**.

**Shared-Supabase consequences (accepted):** dev and prod share `auth.users`, storage bucket,
and JWT issuer. Mitigation: storage object paths are env-prefixed (`dev/…`, `prod/…`). Seeding
never runs in any deploy path and never touches Supabase going forward.

### 4.2 Database & migrations

- Generate an initial Prisma migration from the current `schema.prisma`; commit
  `prisma/migrations/**` + `migration_lock.toml`.
- Existing dev DB (created via `db push`): baseline with `prisma migrate resolve --applied <init>`.
- Fresh prod DB: `prisma migrate deploy` builds it from zero.
- Backend service `preDeployCommand`: `prisma migrate deploy` (runs with the env's `DATABASE_URL`
  before the new version goes live).
- `prisma/seed.ts`: hard-refuse when `NODE_ENV=production`; remove `clearDatabase()` and
  Supabase-user seeding from any non-interactive/deploy path. Seeding is manual + local only.
- `DATABASE_URL` per env gets `?connection_limit=<n>&pool_timeout=<s>` sized to the Render plan.
  No `directUrl`/PgBouncer.

### 4.3 Backend hardening (`apps/backend`)

- `main.ts`: `app.listen(port, '0.0.0.0')`; `app.enableShutdownHooks()`; trust proxy; `helmet()`;
  keep env-driven CORS.
- Zod env-validation schema wired into `ConfigModule` — fails fast at boot on missing
  `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_KEY`.
- `GET /api/health`: runs `SELECT 1`, returns 503 on DB failure. Used as Render health check path.
- Global exception filter: sanitizes 5xx responses in production (no stack traces).
- Structured logging: JSON in production, configurable level.
- `build` script runs `prisma generate` before `nest build`.
- `engines.node` pinned; `.nvmrc` added.

### 4.4 Web fixes (`apps/web`)

- `next.config.ts`: require `BACKEND_URL` (no localhost fallback); fail build if absent.
- OpenGraph/app URL reads `NEXT_PUBLIC_APP_URL` instead of hardcoded `kayou.cd`.
- Add `tile.openstreetmap.org` to `next.config` image `remotePatterns`.
- Validate required `NEXT_PUBLIC_*` at build.
- `engines.node` pinned.

### 4.5 render.yaml Blueprint

Native runtime, repo-root build via Turbo filters:

- **Backend:** build `pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayou/backend...`;
  start `node apps/backend/dist/main.js`; preDeploy `prisma migrate deploy`;
  health check path `/api/health`.
- **Web:** build `pnpm turbo run build --filter=@kayou/web...`; start `pnpm --filter @kayou/web start`.
- **Env groups:** one shared group (Supabase URL / anon key / service key / JWT issuer) attached to
  all four services; per-service vars for `DATABASE_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_APP_URL`,
  `BACKEND_URL`, `NODE_ENV`, feature flags.

### 4.6 CI/CD workflows

- **`ci.yml`** (PR + push to `main`): install (pnpm cached) → build packages →
  full backend suite (all 18 specs; `launch-critical.harness.spec.ts` fixed first) →
  web `next build` + `type-check` → repo-wide `type-check`. No ESLint.
- **`deploy-dev.yml`**: on push to `main`, `needs` CI green → curl backend-dev + web-dev deploy hooks.
- **`deploy-prod.yml`**: on GitHub Release / `v*` tag → run CI → curl backend-prod + web-prod deploy hooks.
- **GitHub secrets:** 4 Render deploy-hook URLs.
- Node standardized on **22** across workflow + `.nvmrc` + `engines`; README updated.

### 4.7 Secrets & docs

- `.env.example` files completed and annotated (secret / public / optional) for backend + web.
- `docs/DEPLOYMENT.md`: Render setup, env groups, tag-based prod release procedure,
  migration/seed runbook, advisory note on rotating the local Supabase service key.

## 5. Sequencing (independently shippable)

1. **Fix CI gate** — failing spec, full backend suite, web build/type-check. Unblocks everything.
2. **Backend hardening + web fixes** — code only, no infra.
3. **Prisma migration baseline** — repo changes.
4. **render.yaml + env groups** — infra (needs Render account).
5. **Deploy workflows + docs** — ties it together (needs Render account).

Steps 1–3 are pure repo changes reviewable/mergeable before any Render work. 4–5 require the
Render account and its deploy-hook URLs.

## 6. Acceptance criteria

- `pnpm` CI workflow runs full backend suite, web build, and type-check, all green, on PR and `main`.
- Pushing to `main` deploys dev only after CI passes; tagging `v*` deploys prod only after CI passes.
- `prisma migrate deploy` runs automatically as the backend preDeploy on each env with the correct DB.
- Backend boots binding `0.0.0.0`, fails fast on missing required env, exposes a DB-checking
  `/api/health`, returns sanitized 5xx in production, and emits JSON logs in production.
- Web build fails if `BACKEND_URL` is unset; OG/app URL and CORS are env-driven; maps render in prod.
- Seed cannot run with `NODE_ENV=production` and is absent from all deploy paths.
- `render.yaml`, completed `.env.example`s, and `docs/DEPLOYMENT.md` are committed.

## 7. Risks & notes

- **Shared auth pool:** a dev signup is also a prod user. Accepted; revisit if it causes confusion.
- **Deploy-hook trigger** gives no deploy-status feedback in Actions. Acceptable for v1; revisit if
  prod releases need gating on Render build success.
- **Migration baseline** must mark the existing dev DB as `--applied` to avoid a destructive replay.
- Rate limiting intentionally deferred — track as fast-follow.
