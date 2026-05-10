# 07 - Discovery Map Distance And Reviews

## Objective

Track P2 launch improvements that may become P1/P0 if product decides they are required before public launch:

- map/radius/distance discovery,
- mandatory post-service reviews,
- Expo readiness for location/upload/map modules.

## Severity

P2 by default.

Promote to P1/P0 only if launch positioning explicitly promises map-based discovery or mandatory reviews.

## Owns

- `apps/backend/src/modules/providers/*`
- `apps/backend/src/modules/geo/*`
- `packages/schemas/src/*`
- `packages/api/src/endpoints.ts`
- `apps/web/src/app/services/*`
- `apps/mobile/src/screens/search/*`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- Review/booking screens in web/mobile

## Map And Distance Scope

If implemented, provider search should support:

- client latitude/longitude,
- provider latitude/longitude or service-zone centroid,
- radius in kilometers,
- sorted distance,
- distance display on cards/profile,
- honest fallback when location is unavailable.

Do not show fake map/distance claims.

## Mandatory Review Scope

Current backend already requires completed booking for review and prevents duplicates. Mandatory review requires product behavior:

- completed booking with no review should show a persistent review CTA,
- user should not be silently routed away from the review opportunity,
- decide whether to block new bookings, show reminders, or only prioritize the CTA.

For v1, prefer persistent CTA/reminder over hard blocking unless product explicitly chooses blocking.

## Expo Readiness Scope

If location/upload/map become launch requirements:

- add required Expo modules,
- configure app permissions,
- document local/simulator testing,
- add EAS config only if release build work starts.

## Acceptance Criteria

- No map/distance UI is visible unless data is real.
- Radius/distance search has backend and UI support if promoted.
- Completed unreviewed bookings produce clear review prompts.
- Mobile permissions are configured if native capabilities are added.
- Type-check/tests pass.

## Test Evidence Required

Record in `PROGRESS.md`:

- Decision whether this stayed P2 or was promoted.
- Commands run.
- Manual/device testing results if native mobile modules are used.
