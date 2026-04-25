# 08 - Launch QA And Smoke Tests

## Objective

Create and run launch smoke tests for the simplified Kinshasa MVP.

## Severity

P0

## Owns

- Backend test setup
- Web smoke tests if existing framework is present
- Mobile smoke/manual test checklist
- Seed/test fixtures
- CI scripts only if already present or requested
- `docs/kinshasa-mvp-implementation/PROGRESS.md`

## In Scope

- Create repeatable smoke scenarios.
- Add automated tests where project structure already supports them.
- Document manual checks where automation would take too long.
- Verify no hidden launch blocker remains.

## Required Smoke Scenarios

### Client Signup And Discovery

1. New client signs up with phone OTP/demo auth path.
2. Client completes profile.
3. Client opens services/search.
4. Client filters by category/city.
5. Client opens provider profile.

### Direct Contact

1. Client opens provider profile.
2. Client sends first message.
3. Message appears in chat.
4. Provider sees conversation.
5. Provider replies.

### Direct Booking

1. Client creates direct booking.
2. Provider sees pending booking.
3. Provider confirms booking.
4. Client sees confirmed booking.
5. Provider completes booking.
6. Client confirms cash payment if required.
7. Client reviews provider.

### Final Offer

1. Client and provider have a conversation.
2. Provider sends final offer.
3. Client accepts.
4. Confirmed booking exists for both users.
5. Client can decline another final offer and continue discussion.

### Launch Scope Guard

1. Client navigation does not expose job requests.
2. Provider navigation does not expose request inbox.
3. Quote comparison is not visible.
4. Online payment copy is not visible.
5. En route / arrived states are not visible.

## Acceptance Criteria

- Backend type-check/test passes.
- Web type-check passes if web touched.
- Mobile type-check/lint passes if mobile touched.
- Manual smoke checklist is completed and recorded.
- Any remaining blocker is listed as P0/P1 in `PROGRESS.md`.

## Test Evidence Required

Record in `PROGRESS.md`:

- Commands run.
- Accounts/seed data used.
- Pass/fail result per smoke scenario.
- Remaining risks.
