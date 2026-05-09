# 01 - Auto-Confirmed Final Offers

## Objective

Change final offers from client-approved proposals into provider-issued agreement records.

When a provider creates a final offer, the app should immediately create or confirm the booking. The client should not accept or decline the final offer in v1.

## Severity

P0

## Owns

- `apps/backend/src/modules/bookings/*`
- `apps/backend/prisma/schema.prisma` if status/economic fields are added
- `packages/schemas/src/*`
- `packages/api/src/endpoints.ts`
- `packages/api/src/query-keys.ts` if final-offer cache behavior changes
- Backend tests for bookings/final offers

## Current State

Current final offers support:

- `POST /final-offers`
- `POST /final-offers/:id/accept`
- `POST /final-offers/:id/decline`

The current backend waits for client acceptance before creating or confirming the booking.

## Target Contract

`POST /final-offers` should:

1. Authorize the provider.
2. Validate target client and optional conversation.
3. Validate optional pending booking.
4. Cancel or supersede previous open final offers for the same booking/conversation where appropriate.
5. Create the final-offer agreement record.
6. Immediately create a `CONFIRMED` booking, or update the attached `PENDING` booking to `CONFIRMED`.
7. Link the final offer to the booking.
8. Notify both users that the agreement has been recorded.
9. Return both `finalOffer` and `booking`.

Client accept/decline endpoints can remain temporarily for backwards compatibility, but v1 clients must not call or show them.

## Status Model Options

Preferred low-risk option:

- keep existing `FinalOfferStatus`,
- save provider-created final offers as `ACCEPTED`,
- set `acceptedAt` to creation time or add `confirmedAt` only if a schema change is already needed.

Cleaner future option:

- add `ISSUED` or `CONFIRMED` final-offer status,
- migrate UI/API language away from accepted/declined semantics.

Choose the lower-risk option for v1 unless schema migration work is already required for commission fields.

## Updated Offer Behavior

If terms change after provider issued a final offer:

- provider creates a new final offer,
- previous agreement should be marked `CANCELLED` or superseded,
- linked booking should update to the new terms if still not completed/cancelled.

Do not allow final-offer updates to mutate completed or cancelled bookings.

## Out Of Scope

- Client accept/decline UI.
- Online payment.
- Multi-provider quotes.
- Invoice generation.

## Acceptance Criteria

- Provider creates a final offer and receives a confirmed booking in the same response.
- Existing pending booking becomes confirmed when a final offer is attached.
- No client acceptance call is required.
- Client can see the final offer as an agreement record.
- Provider can issue corrected terms before completion.
- Invalid participants cannot create final offers.
- Expired/pending client decision semantics are not visible in v1.
- Backend final-offer tests pass.

## Test Evidence Required

Record in `PROGRESS.md`:

- Backend test command and result.
- Any schema migration/push command and result.
- Seeded/manual API scenario used.
- Backwards compatibility notes for old accept/decline endpoints.
