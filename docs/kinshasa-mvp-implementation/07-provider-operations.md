# 07 - Provider Operations And Dashboards

## Objective

Make provider launch operations simple and actionable.

Providers should see pending work, talk to clients, confirm jobs, complete jobs, and understand cash earnings without dealing with request/quote competition.

## Severity

P0/P1

## Owns

- `apps/backend/src/modules/dashboard/*`
- `apps/backend/src/modules/bookings/*`
- `apps/backend/src/modules/earnings/*`
- `apps/web/src/app/pro/*`
- `apps/web/src/app/dashboard/*`
- `apps/mobile/src/screens/pro/*`
- `apps/mobile/src/screens/bookings/*`
- `packages/api/src/endpoints.ts`

## In Scope

- Provider dashboard shows direct pending bookings.
- Provider can confirm or cancel pending booking.
- Provider can complete confirmed booking.
- Provider can message client from booking detail.
- Provider can send final offer after discussion if workstream 02 is complete.
- Provider earnings/history reflect completed cash jobs clearly.
- Hide provider request inbox and quote competition.
- Hide payout claims if payout automation is not real.

## Out Of Scope

- Admin verification queue.
- Online payout automation.
- Complex job tracking.
- En route / arrived.

## Acceptance Criteria

- Provider dashboard has no dead primary buttons.
- Provider can handle a direct client booking from dashboard or booking detail.
- Provider can message correct client, not self.
- Provider sees completed cash jobs in history/earnings with clear wording.
- No provider launch flow requires job requests or quote competition.

## Test Evidence Required

Record in `PROGRESS.md`:

- Provider account used for manual test.
- Booking statuses tested.
- Commands run.
