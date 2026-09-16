# KAYOU × K-YOU UX Refactor — Agent Handoffs

## Reusable Prompt

```text
You are implementing workstream [XX] in docs/kyou-ux-refactor/.

Required reading:
1. CLAUDE.md
2. docs/kyou-ux-refactor/README.md
3. docs/kyou-ux-refactor/00-product-and-design-contract.md
4. docs/kyou-ux-refactor/PROGRESS.md
5. docs/kyou-ux-refactor/[workstream file]
6. The K-YOU reference at /Users/alainmk/perfect-tech/kyou-launch for the screens
   named by the workstream (screenshots/ui-refresh/*.png, src/pages/*.jsx,
   src/index.css). Read for layout and behaviour. Never copy code from it.

Binding rules:
- The product is the contact-first K-YOU flow. No quotes, job requests, final
  offers, payouts, trust scores, disputes, favorites or visibility settings.
- KAYOU stays the brand. K-YOU supplies the visual system, screens and flows.
- Launch-lead tables, endpoints, DTOs and tests are untouched.
- Supabase phone OTP stays the only sign-in.
- French only. Copy lives in apps/web/src/copy/*, never inline.
- Every role and ownership check is enforced on the server.

Working rules:
- Work on a branch from refactor/kyou-ux named kyou-ux/0N-short-name.
- Stay inside the workstream's owned paths. A shared-contract change
  (packages/schemas, packages/api, globals.css tokens, next.config.ts redirects,
  app.module.ts) is recorded in PROGRESS.md before consumers merge.
- No per-task commits. One commit per workstream unless the workstream doc says
  otherwise; PR title prefix [kyou-ux 0N].
- Backend logic is TDD'd with node:test and hand-rolled Prisma fakes.
- Run the workstream's verification commands and a manual check at 320, 390 and
  1440 px for any screen touched. Skeletons, never spinners, on content.
- Update PROGRESS.md with files, commands, decisions and remaining risks.

Report:
- What changed.
- Acceptance criteria demonstrated.
- Commands and manual checks passed/failed.
- Screenshots added under docs/kyou-ux-refactor/screenshots/0N/.
- Any blocker or contract decision needed.
```

## Branch and PR naming

- Integration branch: `refactor/kyou-ux`, created from `main` at `6bb6dca`.
- Workstream branches: `kyou-ux/01-schema`, `kyou-ux/02-backend`, `kyou-ux/03-packages`, `kyou-ux/04-shell`, `kyou-ux/05-public`, `kyou-ux/06-auth-onboarding`, `kyou-ux/07-spaces`, `kyou-ux/08-admin`, `kyou-ux/09-campaign`, `kyou-ux/10-release`.
- PR titles: `[kyou-ux 0N] <outcome>`; PRs target `refactor/kyou-ux`. Only workstream 10 opens the PR from `refactor/kyou-ux` into `main`.
- Tag `main` as `pre-kyou-ux` before that final merge.

## Parallelism map

```
Wave 1   01 ──▶ 02 ──▶ 03
                        │
Wave 2                  ├──▶ 04 ──▶ 09
                        │
Wave 3                  └──▶ 05 ─┐
                             06 ─┤   (all four need 02 + 03 + 04 merged)
                             07 ─┤
                             08 ─┘
Wave 4                            └──▶ 10
```

- 01 must merge before 02 starts. 02 can start its service specs against the schema draft as soon as `schema.prisma` is committed, even before seeds land.
- 03 can start once 02's endpoint contract is fixed in `02-backend-modules.md`; it does not wait for every 02 endpoint to be implemented, but it waits for 02 to merge before its own PR.
- 04 needs 03's tokens and primitives. 09 needs only 04.
- 05, 06, 07 and 08 run in parallel. Each owns a disjoint route group and component folder. They share `packages/api` read-only.
- 10 starts its Playwright scaffold and CI edits during Wave 3 and finishes after everything is merged.

## Conflict hotspots

Files several workstreams want to edit. Rule: the listed owner edits; everyone else opens a note in `PROGRESS.md` and the owner applies it in a small PR within a day.

| File | Owner | Who else wants it |
| --- | --- | --- |
| `packages/schemas/src/dto.ts`, `models.ts`, `enums.ts` | 03 | 02 (needs the DTOs while implementing), 05–08 (find gaps) |
| `packages/api/src/endpoints.ts`, `query-keys.ts` | 03 | 05–08 |
| `apps/web/src/app/globals.css` | 04 | 05–09 (scoped classes go in component files, not here) |
| `packages/ui/src/tokens.ts` | 03 | 04 |
| `apps/web/next.config.ts` (redirect table) | 04 | 05–08 add rows via PROGRESS note |
| `apps/web/src/components/layout/*` | 04 | 05–08 (props requests only) |
| `apps/web/src/copy/*.ts` | The workstream owning the route group; `common.ts` is 04's | — |
| `apps/backend/src/app.module.ts` | 02 | 10 (test-mode module registration) |
| `apps/backend/package.json` scripts | 02 | 10 |
| `.github/workflows/ci.yml` | 10 | 01 (migration step), 02 (new CI spec) via PROGRESS note |
| `README.md`, `CLAUDE.md`, `docs/DEVELOPER_GUIDE.md` | 10 | none; other workstreams leave notes |

## Workstream 01 — Domain And Schema Reset

```text
Implement docs/kyou-ux-refactor/01-domain-and-schema-reset.md.

Owner: TBD
Owns: apps/backend/prisma/schema.prisma; apps/backend/prisma/migrations/**;
      apps/backend/prisma/seed*.ts; launch-leads.migration-integrity.spec.ts.
Must not touch: any file under apps/backend/src/modules except the integrity
      spec; packages/*; apps/web.
Inputs: 00 contract. Nothing else.
Hands over to 02: a committed schema.prisma, the 0_init baseline, working seeds,
      a green prisma validate / migrate deploy / db:reset, and a PROGRESS entry
      listing every removed and added model.
Definition of done: acceptance criteria in the doc; test:launch-leads:ci and
      the orphan-upgrade spec green on the new baseline.
```

## Workstream 02 — Backend Modules

```text
Implement docs/kyou-ux-refactor/02-backend-modules.md.

Owner: TBD
Owns: apps/backend/src/modules/**; apps/backend/src/common/**;
      apps/backend/src/app.module.ts; src/test/launch/*; backend package.json
      scripts.
Must not touch: prisma/schema.prisma (ask 01); packages/schemas (ask 03, but
      you may draft DTOs locally and hand them over); apps/web; launch-leads
      module internals beyond re-pointing imports.
Inputs from 01: schema, seeds. From 00: roles, lifecycle, contact rules.
Hands over to 03: the endpoint contract as implemented (any deviation from the
      doc is logged in PROGRESS before 03 merges), example responses for each
      DTO, and the list of Zod schemas the controllers expect.
Hands over to 10: the test:launch spec list and the test-mode session hook
      design.
Definition of done: every endpoint in the doc exists with role and status codes;
      no removed-domain identifier remains; test:launch, type-check and build
      green; the harness smoke runs the full contact-first journey.
```

## Workstream 03 — Shared Packages

```text
Implement docs/kyou-ux-refactor/03-shared-packages.md.

Owner: TBD
Owns: packages/schemas/src/**; packages/api/src/**; packages/ui/src/tokens.ts
      and packages/ui/src/web/** primitives that 04 will consume; packages/utils
      (YouTube parsing, schedule helpers ported from K-YOU shared/*.mjs).
Must not touch: apps/*; packages/ui legacy v1 export block (mobile freeze).
Inputs from 02: endpoint contract and DTO shapes. From 00: tokens (§9).
Hands over to 04–09: typed client methods per endpoint, query keys, Zod DTOs,
      the redefined --k-* token values and the primitive list with props.
Definition of done: packages type-check and build; @kayu/api covers every
      endpoint in 02; no DTO or endpoint for removed domains; tokens match §9
      exactly; mobile still compiles in isolation against the legacy block.
```

## Workstream 04 — Web Shell And Design System

```text
Implement docs/kyou-ux-refactor/04-web-shell-and-design-system.md.

Owner: TBD
Owns: apps/web/src/app/layout.tsx, globals.css, fonts; src/components/layout/**
      (single Layout, Navbar, MobileNav, Footer, AuthCanvas, AdminRail);
      src/components/ui/** (prune to what is used); src/components/providers/**;
      src/copy/common.ts; next.config.ts redirect table; src/proxy.ts only if a
      redirect must be dynamic; deletion of the dead code listed in the doc.
Must not touch: route folders owned by 05–09 except to delete removed routes
      (/book, /quotes, /pro/requests, /pro/devis, /design, /design-system,
      /dashboard, /dashboard/provider); apps/web/src/app/launch/**.
Inputs from 03: tokens, primitives, typed client.
Hands over to 05–09: Layout with role-aware Navbar and dock, AuthCanvas,
      AdminRail, motion utilities (screen-enter, touch pulse, press feedback,
      sheet, wizard transitions), skeleton primitives, redirect table format.
Definition of done: one chrome; AppShell and the admin ops bar deleted; the
      three viewports render Home with no overflow; reduced motion honoured;
      web type-check and build green with placeholder pages for routes owned by
      later workstreams.
```

## Workstream 05 — Web Public Screens

```text
Implement docs/kyou-ux-refactor/05-web-public-screens.md.

Owner: TBD
Owns: apps/web/src/app/(public)/** for /, /rechercher, /prestataire/[id],
      /services, /premium, /contact, /cgu, /confidentialite, /delete-account,
      not-found; src/components/home/**, search/**, provider-profile/**;
      src/copy/public.ts.
Must not touch: layout components (ask 04); packages/*; auth or signed-in
      routes.
Inputs from 02: /providers search and profile, /categories/tree, /places,
      /references, /settings/public, /stats, /contact. From 04: shell.
Hands over to 07: the BookingForm, MessageComposer, ReviewForm and LoginWall
      components embedded on the profile page (07 reuses them in spaces).
Definition of done: every public screen matches the K-YOU disposition in
      00 §7 and the inventory; SSR on /, /prestataire/[id]; filters sheet with
      focus trap and Escape; map/list toggle; skeleton cards; 320 px clean.
```

## Workstream 06 — Web Auth And Provider Onboarding

```text
Implement docs/kyou-ux-refactor/06-web-auth-and-provider-onboarding.md.

Owner: TBD
Owns: apps/web/src/app/(auth)/** for /bienvenue, /login, /register;
      /prestataire/nouveau; /prestataire/[id]/modifier; /verification;
      src/components/auth/**, onboarding/**, provider-editor/** (wizard steps,
      ScheduleEditor, VideoEditor, ReferenceFields, PhotoUploader);
      src/contexts/AuthContext.tsx; src/copy/auth.ts, onboarding.ts.
Must not touch: layout; public routes; admin.
Inputs from 02: /me, /me/accept-terms, /me/provider, /providers/me*,
      /me/uploads/sign, /places, /references, verification endpoints.
      From 04: AuthCanvas, wizard transitions.
Hands over to 07 and 08: ReferenceFields (cascading place and list pickers)
      and ScheduleEditor, reused by the address book and admin references.
Definition of done: OTP flow restyled with the account-type picker; wizard
      publishes a provider in four steps with sessionStorage draft; editor
      updates every profile field; verification screens restyled; role
      redirects match 00 §2.
```

## Workstream 07 — Web Client And Provider Spaces

```text
Implement docs/kyou-ux-refactor/07-web-client-and-provider-spaces.md.

Owner: TBD
Owns: /mes-reservations, /reservation/[id], /mon-espace, /revenus, /avis,
      /notifications, /aide, /adresses, /compte, /messagerie route folders;
      src/components/bookings/**, dashboard/**, messaging/**, account/**;
      src/copy/spaces.ts.
Must not touch: layout; public and auth routes; admin.
Inputs from 02: bookings, reviews, conversations, notifications, addresses,
      dashboard/client, dashboard/provider, earnings, DELETE /me.
      From 05: BookingActions, ReviewForm, LoginWall. From 06: ReferenceFields.
Hands over to 10: the list of deep links used by notifications so the smoke
      can assert them.
Definition of done: every signed-in screen matches the inventory; messaging
      polls every 15 s on a visible tab; attachments upload to the private
      bucket and resolve through sign-read; earnings show real transactions;
      account deletion works end to end.
```

## Workstream 08 — Web Admin Console

```text
Implement docs/kyou-ux-refactor/08-web-admin-console.md.

Owner: TBD
Owns: /admin route folder; src/components/admin/**; src/copy/admin.ts;
      the printable CV export.
Must not touch: layout beyond AdminRail props; any non-admin route.
Inputs from 02: every /admin/* endpoint. From 04: AdminRail. From 06:
      ReferenceFields for the places and references editors.
Hands over to 10: the list of sections and the actions the smoke exercises.
Definition of done: the 13 K-YOU sections plus the KYC queue render inside the
      shell; last-admin protection and self-action locks reflected in the UI;
      every mutation shows in the Journal; 2437-line admin page replaced by
      one component per section.
```

## Workstream 09 — Launch Campaign Restyle

```text
Implement docs/kyou-ux-refactor/09-launch-campaign-restyle.md.

Owner: TBD
Owns: apps/web/src/app/launch/**; the .k-campaign block in globals.css.
Must not touch: src/lib/campaign-*; proxy.ts; AppProviders.tsx; backend.
Inputs from 04: tokens and primitives. From 02: /categories/tree shape.
Hands over to 10: the campaign-mode smoke evidence.
Definition of done: five campaign test files pass unchanged; DOM id/name
      inventory identical; manual campaign-mode smoke recorded.
```

## Workstream 10 — QA, Migration And Release

```text
Implement docs/kyou-ux-refactor/10-qa-migration-and-release.md.

Owner: TBD
Owns: .github/workflows/ci.yml; root package.json scripts; apps/web/e2e/**;
      apps/web/playwright.config.ts; apps/mobile/README.md; docs banners and
      rewrites listed in the doc; the merge PR into main.
Must not touch: product code except the test-mode session hook agreed with 02.
Inputs: every other workstream Done in PROGRESS.md with evidence.
Hands over: a tagged pre-kyou-ux main, a merged main, reset dev and prod
      databases, and the closing PROGRESS entry.
Definition of done: launch gate checklist F fully ticked with evidence.
```
