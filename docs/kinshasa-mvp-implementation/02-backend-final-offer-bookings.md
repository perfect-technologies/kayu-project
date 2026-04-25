# 02 - Backend Final Offer And Booking Lifecycle

## Objective

Support a simple final-offer agreement after chat without launching the full quote marketplace.

The backend should let a provider send agreed terms to a client and let the client accept them into a confirmed booking.

## Severity

P0

## Owns

- `apps/backend/src/modules/bookings/*`
- `apps/backend/src/modules/messaging/*` if final offers are attached to conversations
- `apps/backend/prisma/schema.prisma` only if a new model/fields are needed
- `packages/schemas/src/*`
- `packages/api/src/endpoints.ts`
- Backend tests for bookings/final offers

## Product Contract

The final offer is lightweight:

- `providerId`
- `clientId`
- optional `conversationId`
- optional `bookingId`
- `title`
- `description`
- `price`
- `duration`
- `scheduledDate`
- `address`
- `city`
- `notes`
- `status`: `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`, `EXPIRED`
- `paymentMethod`: cash

## Preferred Implementation

Prefer reusing bookings if it keeps the code simpler:

- Provider can update a pending booking with final agreed terms.
- Or provider can create a final-offer record that becomes a confirmed booking on client accept.

Choose the lower-risk implementation after reading the existing booking and quote services.

Do not reuse the multi-quote marketplace UI/semantics if it forces client job requests or provider competition.

## In Scope

- API for provider to send final offer.
- API for client to accept final offer.
- API for client to decline final offer.
- Booking creation/update on accept.
- In-app notification for final offer sent/accepted/declined.
- Authorization:
  - only the provider can send their own final offer,
  - only the target client can accept/decline,
  - both users can read relevant booking/offer detail.
- Cash-only payment method.
- Tests for status transitions.

## Out Of Scope

- Multi-provider quote competition.
- Job request matching.
- Online payment.
- Invoice generation.
- Provider payout automation.

## Acceptance Criteria

- Provider can send final agreed terms to a client after discussion.
- Client can accept and get a confirmed booking.
- Client can decline and continue chat.
- No job request is required.
- No quote comparison is required.
- Invalid users cannot accept or mutate someone else's offer.
- Existing direct booking lifecycle still works.

## Test Evidence Required

Record in `PROGRESS.md`:

- Backend test command and result.
- Manual API scenario or seeded scenario used.
- Any schema migration added.
