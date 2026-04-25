# 04 - Mobile Direct Flow

## Objective

Make the mobile app launch around provider discovery, chat, direct booking, final offer, and cash completion.

## Severity

P0 if mobile is launch-facing.

## Owns

- `apps/mobile/src/navigation/*`
- `apps/mobile/src/screens/home/*`
- `apps/mobile/src/screens/search/*`
- `apps/mobile/src/screens/booking/*`
- `apps/mobile/src/screens/bookings/*`
- `apps/mobile/src/screens/messages/*`
- `apps/mobile/src/screens/pro/*`
- `apps/mobile/src/components/*` used by these screens
- Shared API/schema files only for final-offer endpoints from workstream 02

## In Scope

- Hide customer request tab/screens for launch.
- Hide provider job request inbox for launch.
- Keep discovery, provider profile, favorite, chat, direct booking, bookings, and reviews.
- Replace hardcoded booking dates/slots with a safer launch behavior:
  - real availability if available, or
  - generic requested date/time picker with clear "requested time" copy.
- Add final-offer UI after backend support exists.
- Remove en route / arrived states from visible mobile flows.
- Keep provider confirm/complete actions simple.
- Make payment copy cash-only.

## Out Of Scope

- Mobile money integration.
- Push notifications.
- Job request creation/listing.
- Quote comparison.
- Complex availability engine.

## Acceptance Criteria

- Client can browse/search providers.
- Client can message a provider.
- Client can request a direct booking.
- Provider can confirm or cancel.
- Provider can complete.
- Client can confirm cash payment where applicable.
- Client can review completed booking.
- Final-offer flow works if backend support is available.
- No visible mobile navigation exposes request/quote competition.
- Relevant mobile type-check/lint command passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Commands run.
- Device/simulator/manual flow checked.
- Any route intentionally deferred.
