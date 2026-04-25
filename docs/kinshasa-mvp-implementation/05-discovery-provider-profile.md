# 05 - Discovery Filters And Provider Profile

## Objective

Make provider discovery reliable and simple for launch.

Clients should quickly find providers by service/category/city and understand how to contact them.

## Severity

P0/P1

## Owns

- `apps/backend/src/modules/providers/*`
- `apps/backend/src/modules/categories/*`
- `apps/web/src/app/services/*`
- `apps/web/src/app/categories/*`
- `apps/web/src/app/providers/[id]/*`
- `apps/mobile/src/screens/search/*`
- `apps/mobile/src/screens/home/*`
- `packages/api/src/endpoints.ts`
- `packages/schemas/src/*` only if filter contracts change

## In Scope

- Verify category and subcategory filters end-to-end.
- Fix `/services` subcategory handling.
- Make visible filters correspond to real backend filtering.
- Hide map/distance controls if they are not real.
- Ensure provider profile shows:
  - category/trade,
  - city/service zone,
  - hourly price guidance,
  - rating/reviews,
  - verification/trust indicators if real,
  - message/book/call actions.
- Remove or hide fake availability claims.

## Out Of Scope

- New map implementation unless already nearly complete.
- Complex ranking algorithm.
- Paid provider boosts.
- SEO rewrite beyond preserving existing public pages.

## Acceptance Criteria

- Category links produce expected provider results.
- Subcategory links produce expected provider results.
- Search text, city, rating, price, available, and verified filters either work or are hidden.
- Provider profile CTAs are clear and launch-aligned.
- No fake map/distance/availability feature is visible.
- Web and mobile behavior are consistent enough for launch.

## Test Evidence Required

Record in `PROGRESS.md`:

- Example URLs/filters tested.
- Backend query behavior verified.
- Commands run.
