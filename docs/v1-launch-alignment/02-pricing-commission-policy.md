# 02 - Pricing And Commission Policy

## Objective

Make v1 pricing and commission behavior coherent across backend, web, mobile, and docs.

Provider prices should be fixed starting-from guidance, not hourly pricing. Final offers/bookings should store the agreed price. Commission should be tracked internally from the agreed price.

## Severity

P0

## Owns

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/bookings/*`
- `apps/backend/src/modules/earnings/*`
- `packages/schemas/src/*`
- `packages/api/src/endpoints.ts`
- Web/mobile pricing display components
- Web/mobile earnings/dashboard surfaces if commission/net amounts are shown

## Current State

- Provider profile pricing is currently stored in `Provider.hourlyRate`, but v1 product semantics are fixed starting price.
- Booking and final-offer prices are stored as `Float`.
- Quotes store integer gross/commission/payout fields.
- Booking transactions compute 10% commission on completion.
- Some settings copy says KAYOU takes no commission on cash payment.

## Target V1 Policy

Display pricing:

- listings and profiles: `A partir de X FC`,
- booking request: estimate only, without multiplying by duration,
- final offer: agreed price,
- booking detail: agreed price,
- payment surfaces: cash payment direct to provider.

Internal economics:

- commission percentage: 10% by default,
- gross price: agreed final offer/booking price,
- commission amount: rounded from gross,
- provider net: gross minus commission,
- transaction should use the same economics as the linked final offer/booking.

## Data Contract

Recommended fields for final-offer/booking economics:

- `grossAmount` or existing `price`,
- `commissionPct`,
- `commissionAmt`,
- `providerNetAmt`.

If keeping `price` for v1, document that it means gross agreed client price.

Use integer CDF amounts where possible for new economic fields. Avoid adding new `Float` money fields.

## UI Copy

Use:

- `A partir de 15 000 FC`
- `Prix final convenu dans la conversation`
- `Prix convenu`
- `Paiement en especes a la fin de la mission`
- `Gain net estime` only if provider-facing commission visibility is approved.

Avoid:

- `paiement securise`,
- `paiement en ligne`,
- `Mobile Money`,
- `commission KAYOU` on client-facing surfaces,
- `devis` as the main v1 flow,
- `facture` unless a real invoice exists.
- `FC/h`, `/h`, `/heure`, or `Tarif horaire` on launch-facing provider pricing.

## Acceptance Criteria

- Web and mobile provider cards/profile use fixed starting-from pricing without hourly units.
- Direct booking estimates do not multiply starting price by duration.
- Final-offer form labels the amount as agreed price.
- Final-offer creation stores or derives commission economics.
- Booking transaction uses final agreed price and the same commission policy.
- No launch-facing copy claims no commission if backend still deducts 10%.
- No launch-facing copy claims online payment.
- Type-check/tests pass for touched packages.

## Test Evidence Required

Record in `PROGRESS.md`:

- Search terms checked.
- Type-check/test command results.
- Any schema migration/push commands.
- Decision on whether commission is provider-visible or internal-only.
