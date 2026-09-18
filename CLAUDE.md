# KAYOU

Marketplace connecting clients to verified service providers in RDC and Congo-Brazzaville. Monorepo: NestJS backend, Next.js web, Expo mobile, shared `packages/{ui,api,schemas,utils}`.

## Required reading before frontend / design work

- **`docs/kyou-ux-refactor/00-product-and-design-contract.md`** — the product and design contract (screen map, tokens, motion, hard rules). `docs/DESIGN_SYSTEM.md` and `docs/design-direction/index.html` are superseded history.
- **`packages/ui/src/tokens.ts`** — canonical tokens (colors, spacing, radii, fonts). Source of truth.
- Route slugs are French, see the screen map in the contract (§7).

## Where things live

- Web app: `apps/web/` (Next.js App Router)
- Mobile app: `apps/mobile/` (Expo) — frozen since 2026-09-16 against the pre-refactor API; excluded from `build`, `type-check`, `test:launch` and CI. See `apps/mobile/README.md`.
- Backend: `apps/backend/` (NestJS + Prisma + Postgres)
- Shared UI: `packages/ui/src/web/` and `packages/ui/src/mobile/`
- Shared DTOs: `packages/schemas/src/dto.ts` (Zod)
- Typed API client: `packages/api/src/endpoints.ts`
- Hosted on Railway + Supabase, see `docs/DEPLOYMENT.md`.

## Backend conventions

- Service logic tested via `node:test` + hand-rolled Prisma fakes (see `apps/backend/src/modules/admin/admin.service.spec.ts` and `.../stats/stats.service.spec.ts` as references).
- Run a single spec with `node --test -r ts-node/register apps/backend/src/modules/<module>/<file>.spec.ts` from `apps/backend/`.
- The backend is CJS while `@kayu/schemas` is ESM. Use dynamic `await import("@kayu/schemas")` for runtime values; re-declare types locally or derive them with `Awaited<ReturnType<...>>`.
