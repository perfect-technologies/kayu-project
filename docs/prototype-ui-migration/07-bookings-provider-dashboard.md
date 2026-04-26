# 07 - Bookings And Provider Dashboard

## Status

Ready after reading `00` and `05`.

## Goal

Make accepted final offers and provider operations feel polished without adding old booking/payment operational complexity.

## Owns

- `apps/web/src/app/bookings/MyBookingsClient.tsx`
- `apps/web/src/app/bookings/[id]/BookingDetailPageClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/app/pro/ProviderDashboardClient.tsx`
- `apps/web/src/components/pro/*`
- mobile booking/provider dashboard screens if matching changes are needed

## Keep Current Flow

- Bookings can come from direct booking or accepted final offer.
- Provider can manage direct bookings/jobs through current backend-supported statuses.
- Cash payment wording remains.
- Reviews happen after completion.

## Prototype Inputs

Borrow:

- Booking card layout with service icon tile, provider/client avatar, date, address, status chip, price.
- Detail page sections: timeline, address, agreed terms, conversation preview, counterparty card.
- Provider dashboard cards: greeting, availability, KPI cards, today jobs, active jobs.
- Dashboard stat card typography and sparkline style.

## Tasks

1. Normalize booking cards to KAYOU card patterns.
2. Make final-offer-origin bookings clear with `Offre finale acceptée`.
3. Remove or hide unsupported `en route`, `arrived`, code, protected payment, refund, payout copy.
4. Keep payment language cash-first.
5. Simplify provider dashboard around:
   - messages,
   - direct bookings,
   - accepted jobs,
   - completion,
   - cash history if already supported.

## Do Not

- Do not add route tracking.
- Do not add arrival code.
- Do not add Mobile Money payment state.
- Do not add payout automation.
- Do not add disputes/refunds.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm --filter @kayu/mobile type-check
```

Manual routes:

- `/bookings`
- `/bookings/[id]`
- `/pro`
- mobile viewport 390px

