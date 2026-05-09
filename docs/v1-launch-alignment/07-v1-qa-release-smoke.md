# 07 - V1 QA And Release Smoke

## Objective

Create and run smoke tests for the revised v1 flow.

## Severity

P0 after implementation work starts.

## Owns

- Backend launch/smoke tests
- Web smoke tests if existing framework is present
- Mobile manual smoke checklist
- Seed/test fixtures
- `docs/v1-launch-alignment/PROGRESS.md`

## Required Smoke Scenarios

### Client Signup And Discovery

1. New client signs up with phone OTP/demo auth path.
2. Client completes profile.
3. Client opens services/search.
4. Client filters by category/city/price where implemented.
5. Client opens provider profile.
6. Provider profile shows starting-from price and cash disclaimer.

### Direct Contact

1. Client opens provider profile.
2. Client sends first message.
3. Message appears in chat.
4. Provider sees conversation.
5. Provider replies.

### Direct Booking

1. Client creates direct booking request.
2. Provider sees pending booking.
3. Provider can message client.
4. Provider can confirm or cancel booking.
5. Client sees confirmed/cancelled state.

### Auto-Confirmed Final Offer

1. Client and provider have a conversation.
2. Provider creates final offer/agreement.
3. No client accept/decline action appears.
4. Confirmed booking exists immediately for both users.
5. Booking terms match the final offer.
6. Provider can issue corrected terms before completion if required.

### Cash Completion And Review

1. Provider completes confirmed booking.
2. Cash payment confirmation uses v1 policy.
3. Internal earnings/commission are consistent with agreed price.
4. Client can review provider after completion.
5. Duplicate review is blocked cleanly.

### Launch Scope Guard

1. Client navigation does not expose job requests.
2. Provider navigation does not expose request inbox unless flags are explicitly enabled.
3. Quote comparison is not visible.
4. Client final-offer accept/decline is not visible.
5. Online payment copy is not visible.
6. Payout claims are not visible in client/provider launch UI.
7. En route / arrived states are not visible.

## Acceptance Criteria

- Backend tests pass.
- Web type-check passes if web touched.
- Mobile type-check passes if mobile touched.
- Manual mobile checklist is completed and recorded before release candidate.
- Any remaining blocker is listed as P0/P1 in `PROGRESS.md`.

## Test Evidence Required

Record in `PROGRESS.md`:

- Commands run.
- Accounts/seed data used.
- Pass/fail result per smoke scenario.
- Remaining risks.
