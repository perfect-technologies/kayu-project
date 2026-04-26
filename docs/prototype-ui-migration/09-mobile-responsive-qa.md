# 09 - Mobile Responsive QA

## Status

Ready after each screen workstream.

## Goal

Verify that migrated UI actually works for Kinshasa launch users on small phones and slower networks.

## Owns

- QA only unless small fixes are needed.
- Any touched screen files must be listed in `PROGRESS.md`.

## Viewports

Check at minimum:

- 320px wide
- 390px wide
- 480px wide
- 768px wide
- 1280px wide

## Critical Web Routes

- `/`
- `/services`
- `/categories/plomberie`
- `/providers/[id]`
- `/messages`
- `/bookings`
- `/bookings/[id]`
- `/auth`
- `/pro`
- `/pro/onboarding`

## Checks

1. No horizontal scrolling.
2. Hit targets are at least 44px where practical.
3. Text does not overflow buttons/cards.
4. Primary action is visible and unambiguous.
5. Icons are visible.
6. Header/composer/bottom bars do not overlap content.
7. Money is formatted `24 000 FC`.
8. No protected-payment or quote-marketplace copy appears.
9. Skeletons animate.
10. Empty/error states have action copy.

## Recommended Commands

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm --filter @kayu/mobile type-check
```

If a dev server is needed:

```bash
pnpm --filter @kayu/web dev
```

## Evidence To Record

Update `PROGRESS.md` with:

- routes checked,
- viewports checked,
- browser/device/simulator used,
- screenshots if useful,
- issues found,
- fixes made,
- commands run.

