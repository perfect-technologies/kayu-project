# 06 - Cash Payment And Copy Cleanup

## Objective

Make all launch-facing payment and lifecycle copy match the real MVP policy.

Launch payment policy: cash at the end of the mission.

## Severity

P0

## Owns

- `apps/web/src/**/*`
- `apps/mobile/src/**/*`
- `apps/backend/src/modules/bookings/*` only if API messages need cleanup
- `packages/utils/src/*` only if shared formatting/copy helpers exist

## In Scope

- Replace misleading "secure payment" wording.
- Use clear cash payment wording.
- Remove online payment, refund, payout, and escrow wording from client/provider UI unless explicitly marked internal or coming later.
- Remove en route / arrived copy from launch-facing UI.
- Keep completion and cash confirmation copy.
- Confirm currency formatting is correct for CDF.

## Suggested French Copy

- "Paiement en especes a la fin de la mission"
- "Le prix final est confirme avec le prestataire"
- "Confirmer le paiement en especes"
- "Offre finale"
- "Demander une reservation"
- "Discuter avec le prestataire"

Use proper accents if the edited file already uses them. Otherwise follow the file's existing style.

## Out Of Scope

- Implementing mobile money.
- Implementing Stripe or another PSP.
- Building payout automation.
- Rewriting backend accounting.

## Acceptance Criteria

- No launch-facing screen claims online/secure payment when the flow is cash.
- No launch-facing screen implies en route / arrived tracking.
- Booking detail, booking creation, provider profile, dashboard, and earnings screens use consistent payment copy.
- Relevant type-check passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Search terms checked.
- Commands run.
- Any copy intentionally left for internal/admin screens.
