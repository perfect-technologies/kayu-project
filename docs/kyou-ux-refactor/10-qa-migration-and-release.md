# 10 - QA, Hosting Move and Release

Rewritten 2026-09-17: hosting moves from Render to **Railway** (compute) and **Supabase Postgres** (database). The Render project is deleted at the end of this workstream. Nothing on Render ever served real users, so there is no data migration, only fresh provisioning.

## Objective

Prove the refactored product end to end, stand it up on Railway + Supabase, freeze mobile cleanly, update the documentation, delete Render, and merge `refactor/kyou-ux` into `main` without regressing the campaign pages.

## Severity

P0. Nothing merges to `main` before this workstream is Done.

## Owns

- `.github/workflows/ci.yml`; **delete** `.github/workflows/deploy-dev.yml` and `deploy-prod.yml`
- **delete** `render.yaml`
- `railway/backend.json`, `railway/web.json` (new, config as code)
- `apps/backend/prisma/schema.prisma` datasource block only (`directUrl`)
- `apps/backend/src/config/env.validation.ts` (`DIRECT_URL`, optional)
- `apps/backend/src/main.ts` listen host only (`::` for Railway private networking)
- `apps/backend/.env.example`, `apps/web/.env.example`
- `package.json` root scripts (`test:launch`, mobile filter)
- `apps/web/e2e/**` (new), `apps/web/playwright.config.ts` (new), `apps/web/package.json` (Playwright dev dependency)
- `docs/DEPLOYMENT.md` (full rewrite)
- `docs/DEVELOPER_GUIDE.md`, `README.md`, `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/design-direction/index.html` (banners and rewrites in G)
- `apps/mobile/README.md` (new, freeze banner)
- `docs/kyou-ux-refactor/PROGRESS.md` sign-off

## Out of scope

- Fixing defects found. They go back to the owning workstream.
- Load testing. Custom domain. A second Railway environment (added when the closed beta opens).
- Anything mobile beyond the freeze notice.

## A. Automated gate

Root `test:launch` is already the post-refactor chain (utils, schemas, api, ui, backend `test:launch`, backend type-check, web type-check). Mobile is excluded. Add at the end:

```sh
pnpm --filter @kayu/web test        # node --test src/lib/*.test.mjs
```

CI (`ci.yml`) changes:

| Step | Change |
| --- | --- |
| Apply migrations to disposable Postgres | Unchanged command; applies the single `0_init`. Add `DIRECT_URL` equal to `DATABASE_URL` in the step env. |
| Launch lead race + orphan-upgrade integrations | Unchanged. |
| **New** Booking slot race integration | `pnpm --filter @kayu/backend run test:bookings:ci` with `BOOKINGS_TEST_DATABASE_URL`; two concurrent `POST /bookings` for the same slot yield exactly one PENDING booking and one 409. Fails, never skips, when the URL is absent. |
| Backend full test suite, type-check, web build | Unchanged. |
| **New** Web unit tests | `pnpm --filter @kayu/web test`. |
| **New** Web e2e smoke | Playwright suite from B against a backend started in CI on the seeded disposable database, Chromium only, `E2E_TEST_MODE=true`. |

`deploy-dev.yml` and `deploy-prod.yml` are deleted. Railway deploys from GitHub directly (C3) and waits for the `ci` check suite, so the CI workflow is the only gate.

## B. Browser smoke plan

Add `@playwright/test` as a dev dependency of `@kayu/web`, `apps/web/playwright.config.ts` with projects `mobile-320`, `mobile-390`, `desktop-1440` and a `reduced-motion` variant of `mobile-390` (`reducedMotion: "reduce"`), and `apps/web/e2e/smoke.spec.ts`. The existing `apps/web/scripts/*-smoke.mjs` from workstreams 05–09 are folded into it or deleted once it covers them.

Preconditions: backend on `:3001` with `pnpm db:reset` data, web on `:3000`, `KAYOU_PUBLIC_WEB_MODE=marketplace`, `E2E_TEST_MODE=true`.

Authentication: phone OTP cannot complete headlessly. Use the test-only session hook from `handover/02-to-10-test-mode-session-hook.md` (`POST /api/test/session`, registered only when `E2E_TEST_MODE=true` and `NODE_ENV !== "production"`; the env validator rejects the combination in production).

Scenarios:

1. Public routes render at all three viewports with no horizontal overflow: `/`, `/rechercher`, `/services`, `/premium`, `/contact`, `/cgu`, `/confidentialite`, `/bienvenue`, `/login`, `/register`, `/prestataire/<seeded id>`, `/launch`. Assertion: `document.documentElement.scrollWidth <= window.innerWidth` after fonts load.
2. Anonymous profile shows the login wall on contacts, booking and review blocks.
3. Client: search by category and place, open a profile, send a message with one image attachment, book the first available slot, see it pending in `/mes-reservations`, cancel it, book another.
4. Provider: `/mon-espace` shows the pending request; confirm; complete with an agreed price; `/revenus` shows the transaction; rate the client.
5. Client: `/avis` lists the booking under "À évaluer"; submit a 5-star review with a 500-character comment (counter enforced); the profile shows it with the updated average.
6. New client: publish a provider through `/prestataire/nouveau` with one YouTube video and a schedule; the profile is searchable; role is PROVIDER; client-only routes redirect to `/mon-espace`.
7. Safety: block a user, confirm messaging and booking return 403, file a report.
8. Admin: every `/admin?tab=` section renders; suspend a user and confirm 403 on their next request and their provider gone from search; resolve the report; edit the hero title and see it on `/`; approve a place suggestion.
9. Notifications page lists the events above; read-all clears the badge.
10. `/compte`: update bio and place; delete the new provider account; signing in again yields a fresh CLIENT.
11. Reduced-motion project: repeat 1 and 3; no `transition-duration` above `0s` on the dock indicator and screen-enter wrapper.
12. Old paths redirect: `/services?q=x` → `/rechercher?q=x`, `/providers/<id>` → `/prestataire/<id>`, `/bookings` → `/mes-reservations`, `/messages` → `/messagerie`, `/pro` → `/mon-espace`, `/auth` → `/login`, `/dashboard/admin` → `/admin`.

Screenshots at each viewport for `/`, `/rechercher`, `/prestataire/<id>`, `/mon-espace`, `/mes-reservations`, `/messagerie`, `/admin` go into `docs/kyou-ux-refactor/screenshots/10/`.

## C. Hosting: Railway + Supabase

Topology after this workstream:

| Piece | Where | Notes |
| --- | --- | --- |
| Auth, Storage, **Postgres** | Supabase project `kayou-supabase-shared` (existing) | One project. Database and buckets are namespaced by `STORAGE_ENV_PREFIX`. |
| API (`@kayu/backend`) | Railway service `backend` | Node, built from the repo root with config as code. |
| Web (`@kayu/web`) | Railway service `web` | Next.js standalone start. Proxies `/api/*` to the backend over Railway private networking. |
| Environments | One Railway environment `production` | Used for QA now and for the closed beta later. A `staging` environment is added only when real users exist. |

### C1. Supabase Postgres and buckets

1. In the Supabase dashboard, Project Settings → Database → Connection string. Copy two strings:
   - **Transaction pooler** (Supavisor, port `6543`) → `DATABASE_URL`, with `?pgbouncer=true&connection_limit=10` appended. Prisma Client uses this at runtime; `pgbouncer=true` disables prepared statements, which transaction mode requires.
   - **Session pooler** (Supavisor, port `5432`) → `DIRECT_URL`. Prisma CLI (`migrate deploy`) uses this. The session pooler is IPv4-reachable; the raw direct connection is IPv6-only and Railway egress cannot be assumed to reach it.
2. Percent-encode the database password in both strings.
3. Storage → create the four buckets the backend's `BUCKETS` map expects, if missing: `avatars` (public), `provider-media` (public), `message-attachments` (**private**), `verification-docs` (**private**). `message-attachments` is the one workstream 07 found absent. Set per-bucket file size limits: 8 MB for avatars and attachments, 25 MB for provider-media, 10 MB for verification-docs. No RLS policies are needed; the backend uses the service key and signs uploads and reads.
4. Backups: on the Supabase free tier there are none. Before the closed beta opens, either upgrade to Pro (daily backups, 7-day retention) or schedule a weekly `pg_dump` through `DIRECT_URL` from a GitHub Actions cron into a private artifact. Record the choice in `PROGRESS.md`.

### C2. Prisma and env changes (code, small)

- `apps/backend/prisma/schema.prisma`:

  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```

- `apps/backend/src/config/env.validation.ts`: `DIRECT_URL` optional; when absent the loader sets it to `DATABASE_URL` so local Docker Postgres and CI keep working with one variable.
- `apps/backend/src/main.ts`: listen on host `::` instead of `0.0.0.0`. Railway private networking is IPv6; the web service reaches the backend at `http://backend.railway.internal:3001` only if the backend binds IPv6.
- `.env.example` files: replace the Render comment on `DATABASE_URL`, add `DIRECT_URL`, add the Railway notes below.

### C3. Railway project

1. Create project `kayou`, environment `production`. Connect the GitHub repo.
2. Create service **backend** from the repo, root directory `/`. Config as code at `railway/backend.json`:

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

   Point the service's "Config file path" setting at `railway/backend.json`.

3. Create service **web** the same way with `railway/web.json`:

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

4. Generate a public domain for **web** only. The backend needs no public domain; it is reached over private networking. (If the mobile app or an external client ever needs the API directly, add a domain then.)
5. Service settings for both: branch `main`, **Wait for CI** enabled so a deploy starts only after the `ci` check suite passes. During QA before the merge, set the branch to `refactor/kyou-ux` temporarily.
6. Environment variables.

   Backend:

   | Variable | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | Supabase transaction pooler string (C1) |
   | `DIRECT_URL` | Supabase session pooler string (C1) |
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

   `BACKEND_URL` is read at build time by `next.config.ts`, so it must be set before the first build.

7. First deploy: backend, then web. The backend `preDeployCommand` applies `0_init` to the empty Supabase database. Confirm `GET https://<web>/api/health` returns `ok` through the proxy.

### C4. Data for QA

- Seed once from a developer machine, never from the service: `DATABASE_URL=<DIRECT_URL> NODE_ENV=development pnpm --filter @kayu/backend run db:seed`. `assertSeedAllowed()` passes because `NODE_ENV` is not `production` locally. Do not set `SEED_SUPABASE_USERS=true`; the seeded demo accounts already exist in Supabase Auth from earlier local runs, and the seed re-links by email.
- Create the operator admin: sign in once with the operator phone on the deployed web so the `User` row exists, then in the Supabase SQL editor: `UPDATE "User" SET role = 'ADMIN', "roleSelectedAt" = now() WHERE "authUserId" = '<sub>';`
- Before the closed beta opens, wipe demo data with `pnpm --filter @kayu/backend exec prisma migrate reset --skip-seed` against `DIRECT_URL` from a developer machine, then recreate the admin. This is logged as the "beta clean slate" step in `PROGRESS.md`.

### C5. Delete Render

Only after B passes on Railway:

1. Copy any env values still needed from the four Render services (launch keys, notice version).
2. Take a `pg_dump` of `kayou-db-prod` for the record (expected: seed and test data only) and store it outside Render.
3. Delete the four services and the two databases. Delete the `kayou-supabase-shared` env group on Render.
4. Remove the `RENDER_DEPLOY_HOOK_*` secrets from the GitHub repository.
5. Delete `render.yaml`, `deploy-dev.yml`, `deploy-prod.yml` in the same PR as the Railway config.

## D. Mobile freeze

- Root `build` and `type-check` scripts get `--filter=!@kayu/mobile`. `test:launch` already excludes mobile; CI already excludes it.
- Add `apps/mobile/README.md`: frozen since 2026-09-16, targets the pre-refactor API, do not build against `main` after the merge, follow-up in `docs/kyou-mobile-refactor/`.
- Add the same one-line note under "Where things live" in `CLAUDE.md`.
- Keep the legacy v1 export block in `packages/ui/src/tokens.ts` so the frozen app still compiles in isolation.

## E. Rollback

- Tag `main` before the merge as `pre-kyou-ux`.
- Code: Railway keeps deployment history per service; "Redeploy" on a previous deployment restores it. Because both services build from `main`, a code rollback is a revert commit plus redeploy.
- Database: no rollback is needed for this refactor because the Supabase database starts empty on the new baseline. After the closed beta opens, the backup choice in C1 step 4 is the rollback path. Rehearse a restore into a scratch Supabase project once before opening the beta.

## F. Launch gate checklist

The closed-beta gates in `docs/launch-activation-closed-beta/README.md` remain in force. Before merging to `main`:

- [ ] Automated gate A green on `refactor/kyou-ux`.
- [ ] Browser smoke B green locally on the three viewports and reduced motion, screenshots attached.
- [ ] Railway `backend` and `web` deployed from `refactor/kyou-ux`; `/api/health` ok through the web proxy; smoke scenarios 1, 2, 6 and 12 green against the Railway URL.
- [ ] Campaign pages functional on Railway in campaign mode (`KAYOU_PUBLIC_WEB_MODE=campaign`, intake flags on) with one test lead submitted and visible in the database, then flags returned to the agreed state.
- [ ] Launch-lead specs green; `test:launch-leads:ci` green on the new baseline.
- [ ] No route from the removed list responds with anything but a redirect or 404.
- [ ] `grep` for removed domains returns nothing in `apps/backend/src`, `apps/web/src`, `packages/*/src` (mobile excluded).
- [ ] Admin created on Railway and can reach every `/admin` section.
- [ ] Render deleted (C5) and Render secrets removed.
- [ ] `PROGRESS.md` shows every workstream `Done` with evidence, plus the backup decision from C1 step 4.

## G. Documentation updates

| File | Change |
| --- | --- |
| `docs/DEPLOYMENT.md` | **Full rewrite** for Railway + Supabase: topology table, C1–C4 as the runbook, env tables, "Wait for CI" flow, seeding and admin creation, beta clean slate, backups, rollback, custom domain later. Remove every Render section. |
| `docs/DESIGN_SYSTEM.md` | Banner at the top: superseded on 2026-09-16 by `docs/kyou-ux-refactor/00-product-and-design-contract.md` §9–§11; kept as history. |
| `docs/design-direction/index.html` | Same banner as a visible block above the fold. |
| `docs/DEVELOPER_GUIDE.md` | Rewrite "API Endpoints" from `handover/02-backend-contract.md`; rewrite "Database Overview" from `01-domain-and-schema-reset.md`; update the seed list; add the mobile freeze note; update "Testing And Verification" with the new gate; replace the Render deployment notes with a pointer to `DEPLOYMENT.md`. |
| `README.md` | Architecture block (Railway + Supabase Postgres instead of Docker Compose Postgres for hosted environments; Compose stays for local), scripts table (mobile filter, e2e script), demo accounts, `/admin` entry. |
| `CLAUDE.md` | Replace the two "Required reading" bullets with `docs/kyou-ux-refactor/00-product-and-design-contract.md` and `packages/ui/src/tokens.ts`; add the mobile freeze line; add "Route slugs are French, see the screen map"; add "Hosted on Railway + Supabase, see docs/DEPLOYMENT.md". |
| `apps/backend/.env.example`, `apps/web/.env.example` | `DIRECT_URL`, Railway private URL example for `BACKEND_URL`, Render comments removed. |

## Acceptance criteria

- CI green on `refactor/kyou-ux` with the new steps, `deploy-*.yml` and `render.yaml` gone.
- Both Railway services healthy from the branch, then from `main` after the merge; evidence (URLs, deploy ids, health output) in `PROGRESS.md`.
- Supabase database on `0_init` with the four buckets present; `message-attachments` upload works end to end in scenario 3.
- All items in F ticked with links to evidence.
- Render project deleted; documentation changes in G merged in the same PR as the branch merge.

## Verification commands

```sh
pnpm test:launch
pnpm --filter @kayu/web exec playwright test
curl -fsS https://<web-domain>/api/health
railway status            # after `railway link`, both services Active
```
