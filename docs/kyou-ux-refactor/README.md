# KAYOU × K-YOU UX Refactor

## Purpose

This folder plans the refactor that makes the K-YOU reference application (`/Users/alainmk/perfect-tech/kyou-launch`) the product and visual truth for KAYOU, while keeping the KAYOU monorepo, backend architecture and engineering practices.

K-YOU is a standalone Vite/React SPA with a small Fastify API. It is used here as a **design and product reference only**. No K-YOU code is imported. Every screen is rebuilt in `apps/web` (Next.js), every feature is rebuilt in `apps/backend` (NestJS + Prisma), and the shared packages are updated to match.

The Expo mobile app is **frozen** during this refactor (see Mobile freeze below) and gets its own workstream folder later.

## Decisions taken before this plan (2026-09-16)

| Decision | Choice |
| --- | --- |
| Brand | Stay **KAYOU** (name, legal identity, domain). Adopt the K-YOU visual system: ivory canvas, deep green primary, gold accent, mint surfaces, Sora + Plus Jakarta Sans, pill actions, bottom dock on mobile. |
| Product model | K-YOU's contact-first flow: search → profile → message / call / WhatsApp → book a time slot → provider confirms → provider completes → review. Cash outside the platform. No online payment. |
| Domains removed | Job requests + quotes marketplace; final offers (price folded into Booking); payouts + mobile-money stub; trust scores, badges, disputes; favorites; visibility settings; portfolio projects; certifications. |
| Domains kept | Supabase phone-OTP auth; KYC verification documents (admin-reviewed); Transaction ledger for provider earnings and internal 10% commission; Notification table; SystemSetting; ActivityLog; launch leads and funnel events. |
| Domains added from K-YOU | Hierarchical Place references with admin curation and user suggestions; flat reference lists (languages, intervention modes, price units, skills); provider media gallery (images + YouTube/uploaded videos); multi-range weekly schedule with slot duration, buffer, timezone and exceptions; user Reports and Blocks; contact inbox; site content and feature flags; client address book; audit journal screen. |
| Auth | Keep phone OTP via Supabase. Restyle only. No passwords, no email verification screens. |
| Places | Adopt K-YOU place references (country › province › city › commune › quartier). |
| Taxonomy | DB-managed, three levels, reseeded with K-YOU's 19 categories. Admin CRUD kept. |
| Language | French only. Copy is centralised so a locale layer can be added later. |
| Campaign | `/launch` pages are restyled in this refactor (workstream 09). Lead endpoints and data are untouched. |
| Agent concierge | Lives on the branch `feat/agent-concierge-phase-1` (commit `6bb6dca`), **not on `main`**. Excluded from this refactor. It is rebased onto the new contract in its own later workstream; its `ProvidersService.search` tool binding will need the new search signature at that time. |
| Data policy | **Full reset allowed.** Migrations are squashed into a new baseline. Dev and prod databases are reset on deploy (workstream 10). |
| Routes | French route slugs from K-YOU become canonical (`/rechercher`, `/prestataire/:id`, `/mes-reservations`, `/mon-espace`, `/messagerie`, `/compte`, `/admin` …). Old English paths get permanent redirects for one release. |

## Non-goals

- Online or mobile-money payment, payouts, invoices.
- Push notifications, WebSockets. Messaging keeps polling.
- Multi-provider quote competition or public job requests.
- English or any second language.
- A React Native / Expo rewrite. Mobile is frozen (see below).
- Importing K-YOU source code, its Capacitor projects, or its Fastify backend.
- Dark mode.

## Workstreams and order

| # | Doc | Outcome | Depends on | Size |
| --- | --- | --- | --- | --- |
| 00 | [`00-product-and-design-contract.md`](./00-product-and-design-contract.md) | Frozen product rules, role model, screen map K-YOU → KAYOU, design tokens and hard rules | Decisions above | done |
| 01 | [`01-domain-and-schema-reset.md`](./01-domain-and-schema-reset.md) | Target Prisma schema, removed models, baseline migration, seed strategy | 00 | L |
| 02 | [`02-backend-modules.md`](./02-backend-modules.md) | Module-by-module backend changes: remove, modify, add. Endpoint contract. | 01 | XL |
| 03 | [`03-shared-packages.md`](./03-shared-packages.md) | `@kayu/schemas`, `@kayu/api`, `@kayu/ui` tokens, `@kayu/utils` | 01, 02 | M |
| 04 | [`04-web-shell-and-design-system.md`](./04-web-shell-and-design-system.md) | One chrome (Navbar, MobileNav dock, compact Footer, auth canvas), tokens, motion, dead-code removal | 03 | L |
| 05 | [`05-web-public-screens.md`](./05-web-public-screens.md) | Home, search, provider profile, services grid, premium, contact, legal, 404 | 02, 04 | XL |
| 06 | [`06-web-auth-and-provider-onboarding.md`](./06-web-auth-and-provider-onboarding.md) | Welcome carousel, login/register restyle on OTP, 4-step provider wizard, profile editor | 02, 04 | L |
| 07 | [`07-web-client-and-provider-spaces.md`](./07-web-client-and-provider-spaces.md) | Bookings, provider dashboard, earnings, reviews, notifications, help, addresses, account, messaging | 02, 04 | XL |
| 08 | [`08-web-admin-console.md`](./08-web-admin-console.md) | Admin rail with the 13 K-YOU sections plus KYC verification queue | 02, 04 | L |
| 09 | [`09-launch-campaign-restyle.md`](./09-launch-campaign-restyle.md) | `/launch*` pages on the new tokens, behaviour unchanged | 04 | S |
| 10 | [`10-qa-migration-and-release.md`](./10-qa-migration-and-release.md) | Test suite updates, browser smoke, database reset runbook, mobile freeze, launch gate | all | M |

Sizes: S under 2 days, M 2–4 days, L 1–2 weeks, XL 2–3 weeks for one engineer or one agent stream. Workstreams 05, 06, 07 and 08 can run in parallel once 02, 03 and 04 are merged.

## Recommended iterations

**Iteration A — foundation (01, 02, 03).** Branch, squash schema, rebuild backend modules and shared packages. At the end of A the backend passes `pnpm --filter @kayu/backend test:launch` against the new schema and the web app does not compile. This is expected.

**Iteration B — shell (04, 09).** New tokens, one Layout chrome, bottom dock, auth canvas, motion rules. Delete the three competing chromes and the dead components. Campaign pages restyled because they share tokens.

**Iteration C — screens (05, 06, 07, 08 in parallel).** Each workstream owns a route group and the components under it. Merge into the integration branch as each passes its checklist.

**Iteration D — release (10).** End-to-end smoke at 320 / 390 / 1440 px, database reset on Render dev, then prod, mobile freeze notice, `PROGRESS.md` sign-off.

## Branch and merge policy

- Integration branch: `refactor/kyou-ux` from `main` at the commit that adds this folder (the first commit after `3b74f38`). `feat/agent-concierge-phase-1` stays a separate branch and is not merged during this refactor.
- Each workstream lands as one or more PRs into `refactor/kyou-ux`. Commit per workstream, not per task, following the existing repo habit.
- `main` stays deployable for the campaign in the meantime. Point `kayou-backend-dev` and `kayou-web-dev` at `refactor/kyou-ux` once Iteration A is merged so QA happens on Render dev.
- `refactor/kyou-ux` merges into `main` only when workstream 10 is Done.

## Mobile freeze

`apps/mobile` consumes `@kayu/api` and `@kayu/schemas`, both of which change in workstream 03. To keep the gate green:

- Remove `pnpm --filter @kayu/mobile type-check` from `test:launch` and from `.github/workflows/ci.yml` for the life of the integration branch.
- Do not touch `apps/mobile`. It will be rebuilt against the new contract in a later `docs/kyou-mobile-refactor/` workstream.
- `packages/ui` keeps its legacy v1 export block for mobile consumers until that workstream.

## Files

- `AGENT-HANDOFFS.md` — ownership map, file boundaries, and hand-off protocol per workstream.
- `PROGRESS.md` — status, decisions log, evidence.
- Reference material lives in the K-YOU folder: `screenshots/ui-refresh/*.png`, `src/pages/*.jsx`, `src/index.css`, `tailwind.config.js`, `MOTION.md`, `UI-REFRESH.md`, `STRUCTURED-FORMS.md`. Read screens there, do not copy code.
