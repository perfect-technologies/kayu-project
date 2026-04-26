# 01 - Canonical Design System

## Status

Ready.

## Goal

Make the app's token layer match the standalone design system and prototype enough that later screen work does not fight inconsistent styles.

## Owns

- `packages/ui/src/tokens.ts`
- `apps/web/src/app/globals.css`
- `docs/DESIGN_SYSTEM.md`
- `apps/web/src/app/design/page.tsx` or a new `/design-system` route

## Prototype Inputs

Use the standalone design system as canonical:

- `--k-bg #FAFAF9`
- `--k-surface #FFFFFF`
- `--k-primary #0EA5E9`
- `--k-primary-hover #0284C7`
- `--k-accent #FB7185`
- `--k-text-primary #0F172A`
- `--k-text-body #334155`
- `--k-text-muted #64748B`
- `--k-border #E2E8F0`
- `--k-r-sm 8px`
- `--k-r-md 12px`
- `--k-r-lg 20px`
- `--k-r-xl 28px`
- Lucide icons inherit color, stroke `1.75`
- Money uses JetBrains Mono tabular numerals

## Tasks

1. Reconcile `packages/ui/src/tokens.ts` with the standalone design system.
2. Reconcile duplicate token definitions in `apps/web/src/app/globals.css`.
3. Decide how to handle current `xxl` radius:
   - Either alias it to `xl`,
   - or keep it only as a backward-compatible token.
4. Ensure `.k-display-*`, `.k-body*`, `.k-price`, `.k-num`, `.k-btn`, `.k-input`, `.k-chip`, and `.k-card` match the standalone design system.
5. Fix shimmer mismatch:
   - shared UI `Shimmer` currently uses `kayu-shimmer`;
   - globals define `kShimmer`;
   - make normal app skeletons animate without importing design-page-only styles.
6. Put the standalone design system into the app as a useful reference route:
   - preferred: `/design-system`
   - acceptable: improve existing `/design`
7. Update `docs/DESIGN_SYSTEM.md` so it does not contradict the chosen standalone system.

## Do Not

- Do not change product flow.
- Do not add new screen redesigns in this workstream.
- Do not introduce a dark mode.
- Do not make shadcn defaults the design source of truth.

## Validation

Run:

```bash
pnpm --filter @kayu/ui type-check
pnpm --filter @kayu/ui build
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual checks:

- `/design-system` or `/design` shows the canonical tokens.
- Icons are visible.
- Buttons, inputs, chips, cards, skeletons visually match the standalone file.

