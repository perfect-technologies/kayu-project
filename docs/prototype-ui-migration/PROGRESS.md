# KAYOU Prototype UI Migration - Progress

Created: 2026-04-26

## Status Summary

This migration uses the new standalone prototype as the visual reference while preserving the Kinshasa MVP product flow.

Current launch truth:

- discovery,
- provider profile,
- chat,
- final offer in chat,
- client accept/decline,
- confirmed cash booking,
- completion,
- optional review.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Flow Contract | Ready | Planning | MVP flow guardrails documented |
| 01 - Canonical Design System | Complete | Codex | Standalone tokens, globals, docs, and `/design-system` route aligned |
| 02 - Shared UI Primitives | Complete | Codex | Shared primitives and local shadcn wrappers aligned to KAYOU |
| 03 - Home, Services, Categories | Ready | Unassigned | Discovery visual pass |
| 04 - Provider Profile | Ready | Unassigned | Profile visual pass |
| 05 - Messages And Final Offer | Ready | Unassigned | Chat/final-offer clarity pass |
| 06 - Auth And Provider Onboarding | Ready | Unassigned | Auth/onboarding polish |
| 07 - Bookings And Provider Dashboard | Ready | Unassigned | Accepted-offer/job surfaces |
| 08 - Admin, Settings, Error States | Ready | Unassigned | Secondary surfaces |
| 09 - Mobile Responsive QA | Ready | Unassigned | Viewport and launch UI QA |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-04-26 | Use prototype as visual reference only | Prototype includes old quote/request/payment flows that conflict with Kinshasa MVP |
| 2026-04-26 | Preserve chat final-offer flow as product truth | Matches current backend/web/mobile implementation and market simplicity |
| 2026-04-26 | Defer quote marketplace visuals as product flow | Useful UI pieces can be adapted into final offer composer later |
| 2026-04-26 | Keep cash-first payment language | Launch does not include online/mobile money payment |

## Audit Inputs

Prototype screens identified:

- Auth
- Home
- Search
- Provider profile
- Booking
- My bookings
- Messages
- Review
- Provider dashboard
- Pro requests
- Quote compose
- Earnings
- Provider onboarding
- Verification
- Admin ops
- Notifications
- Settings
- Error states

MVP classification:

- Keep: home, search, provider cards/profile, chat shell, auth, basic onboarding, review display.
- Adapt: quote composer to final-offer composer, booking detail to accepted-final-offer job detail, provider dashboard to chats/offers/jobs.
- Discard for launch: quote marketplace, request marketplace, competing providers, booking checkout, protected payment, payouts, disputes.
- Later: admin verification queue, payout support, rich notifications, advanced availability.

## How Agents Should Update This File

For each completed workstream, add:

```md
## Workstream NN Evidence

Completed: YYYY-MM-DD

Changed files:

- `path/to/file`

Behavior implemented:

- ...

Commands run:

- `pnpm ...` - passed/failed

Manual checks:

- Route/view checked
- Viewport/device checked

Notes / decisions:

- ...
```

## Workstream 01 Evidence

Completed: 2026-04-26

Changed files:

- `packages/ui/src/tokens.ts`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/WideProviderCard.tsx`
- `packages/ui/src/web/NearbyCard.tsx`
- `packages/ui/src/web/CardSkeletons.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/WideProviderCard.tsx`
- `packages/ui/src/mobile/NearbyCard.tsx`
- `packages/ui/src/mobile/CardSkeletons.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/design/page.tsx`
- `apps/web/src/app/design-system/page.tsx`
- `docs/DESIGN_SYSTEM.md`

Behavior implemented:

- Aligned canonical radius tokens to the standalone system: `sm=8`, `md=12`, `lg=20`, `xl=28`; kept `xxl=28` as a backward-compatible alias only.
- Updated web globals so Tailwind theme variables, `--k-*` variables, `.k-display-*`, `.k-body*`, `.k-price`, `.k-num`, `.k-btn`, `.k-input`, `.k-chip`, and `.k-card` follow the canonical token layer.
- Normalized shared UI card primitives and skeletons to use `radius.lg` for 20px content cards after `radius.xl` moved to 28px modal/sheet use.
- Fixed shimmer mismatch by defining global `kayu-shimmer` keyframes used by shared UI and by app skeleton utilities; the design route no longer imports local shimmer styles.
- Added `/design-system` as a reference route that renders the canonical design probe.
- Updated `docs/DESIGN_SYSTEM.md` so radius, shadow, surface, and Tailwind/globals guidance match the chosen standalone system.

Commands run:

- `pnpm --filter @kayu/ui type-check` - passed
- `pnpm --filter @kayu/ui build` - passed
- `pnpm --filter @kayu/web type-check` - passed
- `pnpm --filter @kayu/web build` - passed

Manual checks:

- `/design-system` present in the Next production build route list.
- Browser visual QA not run in this pass.

Notes / decisions:

- Product flow was not changed.
- `radius.xxl` remains exported for existing mobile/web consumers, but new code should use `radius.xl` for 28px sheet/modal corners.

## Workstream 02 Evidence

Completed: 2026-04-26

Changed files:

- `packages/ui/src/cards.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/web/Avatar.tsx`
- `packages/ui/src/web/EmptyState.tsx`
- `packages/ui/src/web/ErrorState.tsx`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/Input.tsx`
- `packages/ui/src/web/InlineAlert.tsx`
- `packages/ui/src/web/KayouMoment.tsx`
- `packages/ui/src/web/StatCard.tsx`
- `packages/ui/src/web/Toast.tsx`
- `packages/ui/src/web/index.ts`
- `packages/ui/src/mobile/Avatar.tsx`
- `packages/ui/src/mobile/EmptyState.tsx`
- `packages/ui/src/mobile/ErrorState.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/InlineAlert.tsx`
- `packages/ui/src/mobile/KayouMoment.tsx`
- `packages/ui/src/mobile/StatCard.tsx`
- `packages/ui/src/mobile/index.ts`
- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/components/ui/alert.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/skeleton.tsx`
- `apps/web/src/components/ui/textarea.tsx`

Behavior implemented:

- Added shared `formatMoneyFc` and switched shared provider-card price rendering plus chat final-offer price rendering to the shared FC formatter.
- Added exported `InlineAlert` primitives for web and mobile with KAYOU tinted surfaces, calm copy, icons, and optional action.
- Moved web empty/error/input/toast internals to the shared `I` icon layer where touched.
- Remapped local shadcn `Button`, `Card`, `Input`, `Badge`, `Skeleton`, `Alert`, and `Textarea` styles to KAYOU sizing, 12px control radius, 20px card radius, focus rings, token colors, and shimmer animation.
- Removed negative letter-spacing from shared web/mobile primitives touched in this pass.

Commands run:

- `pnpm --filter @kayu/ui type-check` - passed
- `pnpm --filter @kayu/ui build` - passed
- `pnpm --filter @kayu/web type-check` - passed

Manual checks:

- Code-level check that shared buttons retain icon slots and local shadcn buttons still size to 32/40/48px.
- Code-level check that shadcn skeleton now uses the global `animate-k-shimmer` helper.
- Browser visual QA not run in this pass.

Notes / decisions:

- Product flow was not changed.
- Existing Radix/shadcn wrappers remain in place; only their default visual mapping changed.
- Initial validation caught a mobile icon prop mismatch in the new inline alert and stale web declarations before the UI rebuild; both were fixed before the final passing runs above.
