# 03 - Web V1 Flow Alignment

## Objective

Align the web app with the v1 contract:

- final offers are provider-issued agreements,
- final offers auto-confirm bookings,
- clients do not accept/decline final offers,
- pricing is starting-from guidance,
- online payment and quote-marketplace surfaces stay hidden.

## Severity

P0 if web is launch-facing.

## Owns

- `apps/web/src/app/messages/*`
- `apps/web/src/app/book/[providerId]/*`
- `apps/web/src/app/bookings/*`
- `apps/web/src/app/providers/[id]/*`
- `apps/web/src/app/services/*`
- `apps/web/src/components/bookings/*`
- `apps/web/src/components/provider-profile/*`
- `apps/web/src/lib/booking-v2.ts`
- Shared API/schema files only if required by workstreams 01/02

## In Scope

- Remove final-offer accept/decline CTAs from client web chat.
- After provider sends final offer, show it as `Accord confirme` or equivalent.
- Route/open the confirmed booking after provider creates final offer where useful.
- Ensure booking detail displays agreed price and cash disclaimer.
- Standardize provider card/profile pricing as starting-from guidance.
- Hide quote/devis marketplace routes from visible navigation.
- Remove online payment, payout, invoice, and secure-payment claims from launch-facing web UI.

## Out Of Scope

- Building online payment.
- Building quote comparison.
- Building a public job-request marketplace.
- Redesigning the whole web app.

## Acceptance Criteria

- Client web chat never shows final-offer accept/decline in v1 mode.
- Provider final-offer creation produces a confirmed booking.
- Client can see the agreement and booking without another decision action.
- Provider profile pricing says starting-from.
- Booking/payment surfaces include cash disclaimer.
- Hidden quote routes remain unavailable unless launch flags explicitly enable them.
- `pnpm --filter @kayu/web type-check` passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Web type-check result.
- Manual routes checked.
- Search terms checked for hidden/deferred copy.
