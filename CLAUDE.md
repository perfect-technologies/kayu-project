# KAYOU

Marketplace connecting clients to verified service providers in RDC and Congo-Brazzaville. Monorepo: NestJS backend, Next.js web, Expo mobile, shared `packages/{ui,api,schemas,utils}`.

## Required reading before frontend / design work

- **`docs/design-direction/index.html`** — current visual direction, card patterns, hard rules (no gradients, monochrome categories, plain text counts, photo-first), and a list of patterns we explicitly rejected. Open in a browser. Always consult before proposing any new homepage or marketplace UI.
- **`docs/DESIGN_SYSTEM.md`** — design system contract.
- **`packages/ui/src/tokens.ts`** — canonical tokens (colors, spacing, radii, fonts). Source of truth.

## Where things live

- Web app: `apps/web/` (Next.js App Router)
- Mobile app: `apps/mobile/` (Expo)
- Backend: `apps/backend/` (NestJS + Prisma + Postgres)
- Shared UI: `packages/ui/src/web/` and `packages/ui/src/mobile/`
- Shared DTOs: `packages/schemas/src/dto.ts` (Zod)
- Typed API client: `packages/api/src/endpoints.ts`

## Specs and plans

- Specs go in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plans go in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`

## Backend conventions

- Service logic tested via `node:test` + hand-rolled Prisma fakes (see `apps/backend/src/modules/admin/admin.service.spec.ts` and `.../stats/stats.service.spec.ts` as references).
- Run a single spec with `node --test -r ts-node/register apps/backend/src/modules/<module>/<file>.spec.ts` from `apps/backend/`.
- The backend is CJS while `@kayu/schemas` is ESM. Use dynamic `await import("@kayu/schemas")` for runtime values; re-declare types locally or derive them with `Awaited<ReturnType<...>>`.

## Workflow

- Brainstorm → spec → plan → implement. Use the `superpowers` skills when present.
- Default branch is `main`. Recent history is direct-to-main; create a feature branch only when explicitly asked.
