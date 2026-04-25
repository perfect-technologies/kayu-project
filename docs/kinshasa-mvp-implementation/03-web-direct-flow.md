# 03 - Web Direct Flow

## Objective

Make the web app launch around direct discovery, chat, booking, and final offer.

## Severity

P0 if web is launch-facing.

## Owns

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/services/*`
- `apps/web/src/app/categories/*`
- `apps/web/src/app/providers/[id]/*`
- `apps/web/src/app/book/[providerId]/*`
- `apps/web/src/app/bookings/*`
- `apps/web/src/app/messages/*`
- `apps/web/src/components/provider-profile/*`
- `apps/web/src/components/bookings/*`
- `apps/web/src/contexts/AuthContext.tsx` only if flow routing requires it
- Shared API/schema files only for final-offer endpoints from workstream 02

## In Scope

- Make provider profile CTAs simple:
  - Contact / message
  - Book / request reservation
  - Call if phone is available and allowed
- Add final-offer UI after backend support exists:
  - provider sends final offer,
  - client accepts/declines,
  - accepted offer opens booking detail.
- Fix direct booking success routing.
- Ensure client review requires completed booking.
- Ensure first message from provider profile opens or creates a usable conversation.
- Remove launch-facing quote/request marketplace links.
- Remove en route / arrived UI from visible web flows.

## Out Of Scope

- Building a customer job-request flow.
- Building quote comparison.
- Online payment.
- Rewriting the whole design system.

## Known Issues To Check

- `/services` may emit `subcategory` but not apply it.
- Direct booking calendar/time UI may be hardcoded.
- Some payment copy may mention secure payment even though launch is cash.
- Some standalone quote/devis routes may still be reachable.

## Acceptance Criteria

- Client can find a provider and message them.
- First message appears in `/messages`.
- Client can create a direct booking.
- Direct booking success routes to `/bookings/[id]` or `/bookings`.
- Provider can see and act on the booking.
- Provider can send final offer if backend support exists.
- Client can accept final offer and see confirmed booking.
- No visible web flow pushes clients to job requests or quote comparison.
- `pnpm --filter @kayu/web type-check` passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Type-check command and result.
- Manual routes checked.
- Screenshots are optional but useful for risky UI changes.
