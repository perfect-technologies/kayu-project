# @kayu/mobile (frozen)

**Frozen since 2026-09-16.** Do not build this app against `main` after the K-YOU refactor merge.

- It targets the pre-refactor API: the `@kayu/api` and `@kayu/schemas` contracts as they were before the K-YOU refactor. The routes, DTOs and models it consumes no longer exist on `main`.
- It is excluded from the root `build`, `type-check` and `test:launch` scripts (`--filter=!@kayu/mobile`) and from CI.
- The legacy v1 export block in `packages/ui/src/tokens.ts` is kept so the frozen app still compiles in isolation.
- The follow-up (rebuilding the app on the new contract) is planned in `docs/kyou-mobile-refactor/`, a folder created by that workstream.

Until then, the web app at `apps/web` is the mobile experience.
