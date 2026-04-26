# 08 - Admin, Settings, Error States

## Status

Ready after reading `00`.

## Goal

Improve secondary surfaces visually while keeping launch scope small.

## Owns

- `apps/web/src/app/dashboard/admin/page.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/web/src/components/notifications/*`
- shared empty/error/alert components
- `apps/web/src/components/layout/AppShell.tsx` only for shell polish

## Keep Current Flow

- Existing admin route remains `/dashboard/admin`.
- `/admin` may remain redirect-only.
- Settings remain account/profile basics first.
- Notification center is not required for launch unless already wired.

## Prototype Inputs

Borrow:

- Ops Admin visual hierarchy: KPI cards, tabs, queues, activity feed.
- Error-state gallery philosophy: every state has title, explanation, action.
- Settings IA: profile, language, notifications, privacy, security, support.
- Dense admin can be desktop-first, but still use KAYOU tokens.

## Tasks

1. Remove generic admin visual language where easy:
   - raw blue/violet/red Tailwind ramps,
   - generic shadcn card feel,
   - `CDF` money formatting.
2. Use KAYOU cards, chips, mono numbers, and calm copy.
3. Add or normalize reusable empty/error states.
4. Keep admin payout/dispute/payment automation out of launch unless already functional and required.
5. Polish AppShell premium/admin panels to avoid off-system gradients.

## Do Not

- Do not implement payout queues.
- Do not implement dispute workflows.
- Do not implement payment refund tools.
- Do not make admin mobile-critical for MVP.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual routes:

- `/dashboard/admin`
- `/dashboard/settings`
- common empty/error states where reachable

