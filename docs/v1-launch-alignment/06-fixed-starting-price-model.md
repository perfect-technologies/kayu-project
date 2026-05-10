# 06 - Fixed Starting Price Model

## Objective

Correct the v1 pricing interpretation: provider profile pricing is a fixed starting/base price per common service, not an hourly rate.

The launch UI should say `À partir de X FC` and never `À partir de X FC/h`, `/h`, `/heure`, or `Tarif horaire` on launch-facing provider pricing surfaces.

## Severity

P0

This corrects a product-contract mismatch introduced by earlier workstreams that treated starting-from pricing as hourly guidance.

## Owns

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/providers/*`
- `apps/backend/src/modules/onboarding/*`
- `apps/backend/src/modules/categories/*`
- `packages/schemas/src/*`
- `packages/api/src/endpoints.ts`
- `packages/ui/src/*`
- `apps/web/src/app/providers/*`
- `apps/web/src/app/book/*`
- `apps/web/src/app/pro/onboarding/*`
- `apps/web/src/app/services/*`
- `apps/web/src/app/categories/*`
- `apps/web/src/components/provider-profile/*`
- `apps/web/src/components/settings/*`
- `apps/mobile/src/components/providers/*`
- `apps/mobile/src/screens/search/*`
- `apps/mobile/src/screens/booking/*`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `apps/mobile/src/screens/pro/onboardingData.ts`

## Product Decision

Providers choose a starting price for their usual service package:

- Example: `À partir de 10 000 FC`.
- The value is not an hourly rate.
- Duration can still be collected for scheduling, but it must not multiply the starting price.
- The final agreed price is recorded through the provider-issued final offer.

## Current Gaps

- The database field is named `Provider.hourlyRate`.
- API schemas expose `hourlyRate`.
- Provider onboarding says `Tarif horaire`.
- Web and mobile provider profile/cards show `FC/h`, `/h`, or `/heure`.
- Direct booking flows compute estimates as `hourlyRate * duration`.
- Search sorting still uses `hourlyRate` as the implementation key.
- Shared UI card props are named `hourly`.
- Older docs allowed `A partir de X FC/h`.

## Recommended Implementation

### No Immediate DB Migration

For the immediate v1 correction, do not block on a physical database rename.

Preferred short-term approach:

- Keep the existing Prisma column for storage.
- Treat `Provider.hourlyRate` as the provider's starting price in service/business logic.
- Rename UI variables, adapters, props, labels, and docs to `startingPrice` or `basePrice` where feasible.
- Add comments or adapter mapping where backend field names must remain temporarily.

Later cleanup may rename the database field with Prisma `@map("hourlyRate")` or a real column rename, but that is not required for this P0.

### UI Copy

Use:

- `À partir de 10 000 FC`
- `Prix de départ`
- `Prix indicatif`
- `Le prix final est convenu avec le client avant l'intervention.`
- `Total estimé` only when the estimate is the fixed starting price or a clearly user-entered estimate.

Avoid:

- `FC/h`
- `/h`
- `/heure`
- `par heure`
- `Tarif horaire`
- `Prix horaire`
- `hourly` in launch-facing UI variable names where touched
- `starting price × duration`

## Direct Booking Policy

Direct booking request price should not be calculated as starting price multiplied by duration.

Acceptable v1 options:

1. Store the provider starting price as the initial estimated `Booking.price`.
2. Or omit `Booking.price` for direct requests and show `À confirmer`.

Prefer option 1 for minimal backend churn, but label it clearly as an estimate. The provider-issued final offer remains the source of truth for the agreed price.

## Search And Sort Policy

Price sorting can keep using the existing numeric field internally, but labels and query-facing copy should say:

- `Prix croissant`
- `Prix décroissant`

Do not expose or describe it as hourly-rate sorting.

## Acceptance Criteria

- No launch-facing web/mobile provider card or profile shows `FC/h`, `/h`, or `/heure`.
- Provider onboarding asks for a starting/base price, not an hourly rate.
- Direct booking estimate no longer multiplies starting price by duration.
- Booking flow duration remains scheduling context only.
- Final offer amount remains the agreed final price.
- Existing commission calculations continue to use agreed booking/final-offer price.
- Backend publish validation still requires a positive starting price, even if the stored field is temporarily named `hourlyRate`.
- Search/sort labels say price, not hourly rate.
- Docs no longer describe starting-from provider pricing as hourly.
- Type-check/tests pass for touched packages.

## Search Terms Required

Record results in `PROGRESS.md` for:

- `FC/h`
- `/h`
- `/heure`
- `par heure`
- `Tarif horaire`
- `Prix horaire`
- `hourlyRate`
- `hourly`
- `× duration`
- `* duration`

Some backend/internal `hourlyRate` occurrences may remain temporarily. Any remaining occurrences must be documented with a reason.

## Test Evidence Required

Record in `PROGRESS.md`:

- Whether a DB migration was skipped or performed.
- Changed files.
- Commands run.
- Remaining internal `hourlyRate` compatibility points.
- Manual route checks for provider cards/profile, onboarding, booking flow, and mobile equivalents.
