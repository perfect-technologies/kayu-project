# 04 - Mobile V1 Flow Alignment

## Objective

Align the Expo mobile app with the v1 contract:

- final offers are provider-issued agreements,
- final offers auto-confirm bookings,
- clients do not accept/decline final offers,
- pricing is starting-from guidance,
- online payment and quote-marketplace surfaces stay hidden.

## Severity

P0 if mobile is launch-facing.

## Owns

- `apps/mobile/src/screens/messages/*`
- `apps/mobile/src/screens/booking/*`
- `apps/mobile/src/screens/bookings/*`
- `apps/mobile/src/screens/search/*`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/pro/EarningsScreen.tsx`
- `apps/mobile/src/components/bookings/*`
- `apps/mobile/src/components/providers/*`
- `apps/mobile/src/lib/bookingV2.ts`
- Shared API/schema files only if required by workstreams 01/02

## In Scope

- Remove final-offer accept/decline buttons from client mobile chat.
- Show provider-created final offers as agreement records.
- Route/open confirmed booking after provider creates final offer where useful.
- Standardize provider cards/profile pricing as starting-from guidance.
- Keep cash payment copy on booking and completed job surfaces.
- Hide job request and quote marketplace routes from launch navigation.
- Remove online payment, payout, invoice, secure-payment, en route, and arrived claims.

## Out Of Scope

- EAS build setup unless required by QA.
- Native map/location/upload modules unless promoted from P2.
- Online payment or mobile money.

## Acceptance Criteria

- Client mobile chat never shows final-offer accept/decline in v1 mode.
- Provider final-offer creation produces a confirmed booking.
- Client can view agreement and booking without another decision action.
- Mobile search/profile pricing says starting-from.
- Booking/payment surfaces include cash disclaimer.
- Request/quote routes remain flag-gated.
- `pnpm --filter @kayu/mobile type-check` passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Mobile type-check result.
- Manual route walkthrough.
- Any device/simulator result if run.
- Search terms checked for hidden/deferred copy.
