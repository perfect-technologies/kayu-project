# 10 - QA, Migration and Release

## Objective

Prove the refactored product end to end, reset the Render databases onto the squashed baseline, freeze mobile cleanly, update the documentation, and merge `refactor/kyou-ux` into `main` without regressing the live campaign.

## Severity

P0. Nothing merges to `main` before this workstream is Done.

## Owns

- `.github/workflows/ci.yml`
- `package.json` root scripts (`test:launch`)
- `apps/web/e2e/**` (new), `apps/web/playwright.config.ts` (new)
- `apps/web/package.json` (Playwright dev dependency)
- `docs/DEPLOYMENT.md` (append the reset runbook section)
- `docs/DEVELOPER_GUIDE.md`, `README.md`, `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`, `docs/design-direction/index.html` (banners and rewrites listed below)
- `apps/mobile/README.md` (new, freeze banner)
- `docs/kyou-ux-refactor/PROGRESS.md` sign-off

## Out of scope

- Fixing defects found. They go back to the owning workstream.
- Load testing.
- Store submission or anything mobile beyond the freeze notice.

## A. Automated gate

Root `test:launch` after the removals:

```sh
pnpm --filter @kayu/utils test
pnpm --filter @kayu/utils type-check
pnpm --filter @kayu/schemas type-check && pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check && pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:launch
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/web type-check
```

`pnpm --filter @kayu/mobile type-check` is removed from the chain (see D).

Backend `test:launch` spec list is the one in `02-backend-modules.md` §Tests. Specs deleted with their modules: `job-requests.service.spec.ts`, `quotes.service.spec.ts`, `dashboard.service.*.spec.ts` (rewritten), `admin.service.spec.ts` (rewritten).

CI (`ci.yml`) changes:

| Step | Change |
| --- | --- |
| Apply migrations to disposable Postgres | Unchanged command; now applies the single `0_init`. |
| Launch lead serializable race integration | Unchanged. |
| Launch lead orphan-snapshot upgrade integration | Keep, re-pinned to the new baseline by workstream 01. |
| **New** Booking slot race integration | `pnpm --filter @kayu/backend run test:bookings:ci` with `BOOKINGS_TEST_DATABASE_URL`; two concurrent `POST /bookings` for the same slot must yield exactly one PENDING booking and one 409. Fails, never skips, when the URL is absent. |
| Backend full test suite | Unchanged. |
| Type-check | Filter list unchanged (mobile was already excluded in CI). |
| Web production build | Unchanged env. |
| **New** Web unit tests | `node --test apps/web/src/lib/*.test.mjs` (campaign tests plus any added by 04–08). |
| **New** Web e2e smoke | Runs the Playwright suite from B against a backend started in CI with the seeded disposable database. Chromium only. |

## B. Browser smoke plan

Playwright is **not** a dependency of `apps/web` today. Add `@playwright/test` as a dev dependency of `@kayu/web`, a `playwright.config.ts` with three projects (`mobile-320`, `mobile-390`, `desktop-1440`) and a `reduced-motion` variant of `mobile-390` using `reducedMotion: "reduce"`, and `apps/web/e2e/smoke.spec.ts`.

Preconditions: backend on `:3001` with `pnpm db:reset` data, web on `:3000`, `KAYOU_PUBLIC_WEB_MODE=marketplace`, `E2E_TEST_MODE=true`.

Authentication in tests: Supabase phone OTP cannot be completed headlessly. Add a test-only hook in the backend, enabled only when `E2E_TEST_MODE=true` and `NODE_ENV !== "production"`: `POST /api/test/session { authUserId }` returns a Supabase session for a seeded auth user via the service key (`auth.admin.generateLink` or `signInWithPassword` on the seeded `Password123!` users). The web test sets the returned cookies. The hook module is not registered outside test mode; the env validator rejects `E2E_TEST_MODE=true` in production.

Scenario list, mirroring K-YOU `scripts/browser-smoke.mjs`:

1. Public routes render at all three viewports with no horizontal overflow: `/`, `/rechercher`, `/services`, `/premium`, `/contact`, `/cgu`, `/confidentialite`, `/bienvenue`, `/login`, `/register`, `/prestataire/<seeded id>`, `/launch`. Overflow assertion: `document.documentElement.scrollWidth <= window.innerWidth` on every page after fonts load.
2. Anonymous profile shows the login wall on contacts, booking and review blocks.
3. Client session: search by category and place, open a profile, send a message with one image attachment, book the first available slot, see it in `/mes-reservations` as pending, cancel it, book another.
4. Provider session: `/mon-espace` shows the pending request, confirm, complete with an agreed price, `/revenus` shows the transaction, rate the client.
5. Client session: `/avis` shows the booking under "À évaluer", submit a 5-star review with a 500-character comment (counter enforced), review appears on the profile with updated average.
6. New client session: publish a provider through the 4-step wizard (`/prestataire/nouveau`) with one YouTube video and a schedule; the profile is searchable; role is PROVIDER; client-only routes redirect to `/mon-espace`.
7. Safety: block a user, confirm messaging and booking return 403; file a report.
8. Admin session: every `/admin?tab=` section renders; suspend a user and confirm their next request is 403 and their provider disappears from search; resolve the report; edit the hero title and see it on `/`; approve a place suggestion.
9. Notifications page lists the events produced above; read-all clears the badge.
10. `/compte`: update bio and place; delete the new provider account with confirmation; sign-in with that account yields a fresh CLIENT user.
11. Reduced-motion project: repeat 1 and 3; assert no `transition-duration` above `0s` on the dock indicator and screen-enter wrapper.
12. Old paths redirect: `/services?q=x` → `/rechercher?q=x`, `/providers/<id>` → `/prestataire/<id>`, `/bookings` → `/mes-reservations`, `/messages` → `/messagerie`, `/pro` → `/mon-espace`, `/auth` → `/login`, `/dashboard/admin` → `/admin`.

Screenshots from the run go into `docs/kyou-ux-refactor/screenshots/10/` at each viewport for `/`, `/rechercher`, `/prestataire/<id>`, `/mon-espace`, `/mes-reservations`, `/messagerie`, `/admin`.

## C. Database reset runbook (Render)

The baseline squash means `prisma migrate deploy` fails against any database that carries the old migration history. Reset dev first, then prod. Do prod only after the dev soak and the launch gate in F.

Dev:

1. Announce the window. Campaign intake is off during the reset: set `LAUNCH_PUBLIC_INTAKE_ENABLED=false` and `LAUNCH_FUNNEL_EVENTS_ENABLED=false` on `kayou-backend-dev`, redeploy.
2. Export the lead tables if any real leads exist on dev (`pg_dump -t '"ProviderLead"' -t '"ClientWaitlistLead"' -t '"LeadSubmissionEvent"' -t '"CampaignFunnelEvent"' -t '"LeadTaxonomySnapshotOrphan"' -t '"ProviderLeadAdditionalSubcategory"' -t '"ClientWaitlistLeadSubcategory"'`). Dev normally has none.
3. In the Render dashboard delete `kayou-db-dev` and create it again with the same name and plan, or run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` through the external connection. Deleting and recreating rotates the connection string; `render.yaml` re-links it via `fromDatabase`.
4. Switch `kayou-backend-dev` and `kayou-web-dev` to `branch: refactor/kyou-ux` in the dashboard (do not edit `render.yaml` for this).
5. Set new env vars on `kayou-backend-dev`: `STORAGE_ENV_PREFIX=dev` (unchanged), plus any keys introduced by 02 (`E2E_TEST_MODE` must be absent).
6. Manual deploy of `kayou-backend-dev`. `preDeployCommand` runs `prisma migrate deploy` and applies `0_init`.
7. Run the seed once from a Render shell: `pnpm --filter @kayu/backend run db:seed`. `assertSeedAllowed()` allows it because `NODE_ENV` on the dev service is `production`; **temporarily** set `SEED_ALLOW_PRODUCTION=true` for this one shell session only if the guard blocks, then unset it. Record which path was used.
8. Restore exported leads if step 2 produced a dump.
9. Create the operator admin: sign in once with the operator phone so the `User` row exists, then `UPDATE "User" SET role = 'ADMIN', "roleSelectedAt" = now() WHERE "authUserId" = '<sub>'`. No admin is created by seeds on Render.
10. Deploy `kayou-web-dev`, run the smoke from B against dev, re-enable the launch flags.

Prod:

1. Same window announcement. Flags off. Export the lead tables (**mandatory**; prod leads are real).
2. Take a full `pg_dump` of `kayou-db-prod` and store it outside Render.
3. Recreate `kayou-db-prod` as in dev step 3.
4. Point `kayou-backend-prod` and `kayou-web-prod` at `main` (after the merge) and deploy the backend. `0_init` applies.
5. Restore the lead tables from the export. Verify counts match the export.
6. **Do not seed prod.**
7. Create the admin as in dev step 9.
8. Deploy the web service, run scenarios 1, 2 and 12 from B against prod, then re-enable the launch flags.

Supabase Auth is not touched at any point. Existing auth users keep their identities; their local `User` rows are recreated on the first authenticated request with role CLIENT, so any provider or admin on prod must be recreated through the wizard or the SQL above. Before the closed beta opens there are no real providers on prod, so this is acceptable and is logged as a decision.

## D. Mobile freeze

- Remove `pnpm --filter @kayu/mobile type-check` from root `test:launch`. CI already excludes mobile.
- Add `apps/mobile/README.md` with a banner: frozen since 2026-09-16, targets the pre-refactor API, do not build against `main` after the merge, follow-up in `docs/kyou-mobile-refactor/`.
- Add the same one-line note under "Where things live" in `CLAUDE.md`.
- Keep the legacy v1 export block in `packages/ui/src/tokens.ts` with its "do NOT add new usages" comment so the frozen app still compiles in isolation.
- Turbo: exclude `@kayu/mobile` from `pnpm build` and `pnpm type-check` via `--filter=!@kayu/mobile` in the root scripts, so a developer running the full pipeline is not blocked.

## E. Rollback

- `main` before the merge is tagged `pre-kyou-ux`. Render keeps the last successful deploy of each service; "Rollback" in the dashboard restores the previous image.
- A rollback of code without a rollback of the database is not possible after C. The prod `pg_dump` from C step 2 is the database rollback. Restore it into a recreated `kayou-db-prod`, then roll back both services.
- Rehearse the restore once on dev before doing prod.

## F. Launch gate checklist

The closed-beta gates in `docs/launch-activation-closed-beta/README.md` remain in force. This refactor must not regress G1. Before merging to `main`:

- [ ] Campaign pages live and functional in campaign mode on dev (workstream 09 evidence).
- [ ] Lead and funnel endpoints unchanged: `launch-leads` specs green, `test:launch-leads:ci` green on the new baseline.
- [ ] Prod lead export taken and restore rehearsed on dev with matching row counts.
- [ ] Automated gate A green on the integration branch.
- [ ] Browser smoke B green on the three viewports and reduced motion, screenshots attached.
- [ ] No route from the removed list responds with anything but a redirect or 404.
- [ ] `grep` for removed domains returns nothing in `apps/backend/src`, `apps/web/src`, `packages/*/src` (mobile excluded).
- [ ] Admin created on dev and can reach every section.
- [ ] `PROGRESS.md` shows every workstream `Done` with evidence.
- [ ] Named operator GO recorded in `PROGRESS.md` for the prod reset.

## G. Documentation updates

| File | Change |
| --- | --- |
| `docs/DESIGN_SYSTEM.md` | Banner at the top: superseded on 2026-09-16 by `docs/kyou-ux-refactor/00-product-and-design-contract.md` §9–§11; kept as history. |
| `docs/design-direction/index.html` | Same banner as a visible block above the fold. |
| `docs/DEVELOPER_GUIDE.md` | Rewrite "API Endpoints" from `02-backend-modules.md`; rewrite "Database Overview" from `01-domain-and-schema-reset.md`; update the seed list; add the mobile freeze note; update "Testing And Verification" with the new gate. |
| `README.md` | Scripts table (mobile filter, e2e script), demo accounts (unchanged emails, new roles), remove pgAdmin mention if dropped, add `/admin` entry. |
| `CLAUDE.md` | Replace the two "Required reading" bullets with `docs/kyou-ux-refactor/00-product-and-design-contract.md` and `packages/ui/src/tokens.ts`; add the mobile freeze line; add "Route slugs are French, see the screen map". |
| `docs/DEPLOYMENT.md` | Append section C as "Baseline reset (2026-09)". |

## Acceptance criteria

- CI green on `refactor/kyou-ux` with the new steps.
- Dev reset completed and smoke B passed on dev; evidence in `PROGRESS.md`.
- Prod reset completed with lead counts verified; evidence in `PROGRESS.md`.
- All items in F ticked with links to evidence.
- Documentation changes in G merged in the same PR as the branch merge.
