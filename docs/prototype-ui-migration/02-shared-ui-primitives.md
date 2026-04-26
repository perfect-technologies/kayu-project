# 02 - Shared UI Primitives

## Status

Ready after or alongside `01`.

## Goal

Stop visual drift by making shared primitives and local shadcn wrappers render as KAYOU components.

## Owns

- `packages/ui/src/web/*`
- `packages/ui/src/mobile/*` only when a primitive has a direct mobile equivalent
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/skeleton.tsx`
- other `apps/web/src/components/ui/*` only if needed for consistency

## Prototype Inputs

Import these patterns:

- Provider card anatomy: avatar, online dot, verified badge, rating, profession/location, response time, trust chip, price, favorite.
- Dashboard stat card: overline, large mono/tabular number, small trend.
- Inline alert: icon, tinted surface, calm copy, action.
- Error/empty state: title, explanation, action, no bare “Aucun résultat”.
- Inputs: 44px, radius 12, primary focus ring.
- Buttons: 40px default, 48px large, 32px small, primary once per screen.

## Tasks

1. Audit `@kayu/ui/web` primitives against the standalone design system.
2. Update shared primitives before screen-level work duplicates styles.
3. Make local shadcn wrappers map to KAYOU sizing/radius/shadow where possible.
4. Add a shared `formatMoneyFc` helper if one does not already exist.
5. Add or expose shared empty/error/alert primitives if current app lacks them.
6. Prefer `@kayu/ui/web` `I` icons over direct `lucide-react` in new code.

## Do Not

- Do not mass-rewrite all screens in this workstream.
- Do not remove shadcn primitives if other Radix integrations still depend on them; map their styling instead.
- Do not change API behavior.

## Validation

Run:

```bash
pnpm --filter @kayu/ui type-check
pnpm --filter @kayu/ui build
pnpm --filter @kayu/web type-check
```

Manual checks:

- Shared buttons have visible icons.
- Shimmer skeletons animate in normal app routes.
- Local shadcn `Button`/`Card` no longer look like generic defaults.

