# KAYOU Launch Readiness Remediation Progress

Last updated: 2026-04-19

This file tracks remediation work from `docs/launch-readiness-audit/2026-04-19/`. It intentionally does not replace `docs/implementation-plan/PROGRESS.md`, which tracks the earlier implementation/migration plan.

## Current Phase

WS-02 complete. WS-01 complete. Next P0 launch remediation is WS-03 messaging bootstrap or WS-04 quote/request scope decision.

## Status Legend

- `not_started`: No implementation agent has started this workstream.
- `in_progress`: An agent is actively working on this workstream.
- `blocked`: Work cannot continue without a decision or dependency.
- `needs_review`: Implementation is ready for review/verification.
- `done`: Implementation, validation, and documentation updates are complete.
- `deferred`: Explicitly out of launch scope.

## Workstream Status

| ID | Priority | Launch Critical | Workstream | Depends On | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WS-01 | P0 | Yes | Auth Role And Profile Completion | None | done | Codex | Changed `apps/mobile/src/screens/auth/AuthScreen.tsx`, `apps/mobile/src/lib/auth.tsx`, `apps/mobile/src/navigation/AppNavigator.tsx`, `apps/backend/src/modules/identity/*`, `apps/backend/prisma/schema.prisma`, `packages/schemas/src/*`. |
| WS-02 | P0 | Yes | Direct Booking Lifecycle | WS-01 helpful | done | Codex | Changed `apps/mobile/src/screens/booking/BookingScreen.tsx`, `apps/mobile/src/screens/bookings/{BookingDetailScreen,ReviewScreen}.tsx`, `apps/mobile/src/components/bookings/*`, `apps/mobile/src/lib/bookingV2.ts`, `apps/backend/src/modules/bookings/*`, `packages/api/src/endpoints.ts`, `packages/schemas/src/models.ts`. |
| WS-03 | P0 | Yes | Messaging Bootstrap And Role Recipients | WS-01 helpful | not_started | | Conversation creation and correct client/provider recipients. |
| WS-04 | P0/P1 | Decision required | Client Job Request And Quote Acceptance | WS-01 | not_started | | Finish for launch or hide/defer. |
| WS-05 | P1 | Yes for provider launch | Provider Dashboard And Request Actions | WS-02/WS-04 | not_started | | Real provider action surfaces. |
| WS-06 | P1 | Yes | Provider Onboarding And Publication Consistency | WS-01 | not_started | | Search visibility and onboarding publish consistency. |
| WS-07 | P1 | Yes | Discovery, Map, And Filters | WS-06 | not_started | | Remove/wire placeholder filters and map mode. |
| WS-08 | P1 | Yes | Reviews And Client Reputation | WS-02 | not_started | | Completed-booking review state and client reviews. |
| WS-09 | P1 | Operational | Verification And Admin Review | WS-06/WS-10 | not_started | | Real upload/review policy or honest launch stub. |
| WS-10 | P1 | Operational | Admin / Ops MVP | WS-09 helpful | not_started | | Admin users and moderation workflow. |
| WS-11 | P1 | Business decision | Payments And Earnings Policy | WS-02 | not_started | | Cash/offline vs paid booking policy. |
| WS-12 | P1 | Yes | Test Harness | Can start after first P0 | not_started | | Regression coverage for launch-critical flows. |
| WS-13 | P0/P1 | Yes if web launches | Web Launch Parity And Route Hygiene | WS-01/WS-02/WS-03 helpful | not_started | | Bring `apps/web` into parity with launch backend/mobile flows or hide unfinished web surfaces. |

## Current P0 Blockers

| Area | Blocker | Source |
| --- | --- | --- |
| Web booking | Web booking success routes to review without a booking id; review can fake success without backend write. | `08-web-flow-audit.md` |
| Web booking | Web provider booking detail has no confirm/start actions for direct bookings. | `08-web-flow-audit.md` |
| Messaging | First message from provider profile can create a conversation without the UI binding to the new conversation. | `03-client-flow-audit.md` |
| Web messaging | Web first-contact dialog sends and closes without selecting or showing the created conversation. | `08-web-flow-audit.md` |
| Quotes | Client request/quote acceptance path is not available in mobile despite backend/provider quote support. | `03-client-flow-audit.md`, `04-provider-flow-audit.md` |
| Web auth/admin | Web auth/admin routing still has launch gaps, including `/admin` redirect and web role-selection parity. | `08-web-flow-audit.md` |

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-04-19 | Track launch remediation in this audit folder instead of `docs/implementation-plan/`. | The implementation plan is migration-oriented and already marked complete. Launch remediation needs its own status. |
| 2026-04-19 | Treat direct booking as the minimum launch-critical marketplace flow. | A client must be able to book a provider and a provider must be able to complete the booking reliably. |
| 2026-04-19 | Treat job request/quote as launch-critical only if the product intends to expose it at launch. | The backend/provider pieces exist, but client acceptance is missing. Half-exposed flows should be completed or hidden. |
| 2026-04-19 | Agents must update this file before handing back work. | Parallel remediation needs a single coordination surface. |
| 2026-04-19 | Add web as a launch surface if public at launch. | `apps/web` implements client, provider, booking, messages, quote, and admin routes; it cannot be treated as marketing-only. |

## Validation Evidence

Initial audit validation:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
pnpm --filter @kayu/web type-check
```

Result: passed during audit. These checks do not prove end-to-end flow correctness.

WS-01 validation:

```bash
pnpm --filter @kayu/backend prisma:generate
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:identity
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-19.

WS-02 validation:

```bash
pnpm --filter @kayu/backend test:bookings
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-19. Mobile type-check required rebuilding `@kayu/schemas` and `@kayu/api` because the mobile workspace consumes their generated declaration files.

## Update Rules For Agents

When starting a workstream:

1. Change the workstream status to `in_progress`.
2. Add your owner identifier.
3. Add a short note with branch/worktree context if relevant.

When handing back:

1. Set status to `needs_review`, `done`, `blocked`, or `deferred`.
2. List files changed in the notes field or in a short section below.
3. Record validation commands and results.
4. Add blockers or downstream decisions to the Decisions Log if needed.
5. Do not mark `done` unless tests/type checks relevant to the workstream have passed or the reason they could not run is documented.

## Completed Work Log

### 2026-04-19 — WS-01 Auth Role And Profile Completion

- Added explicit `User.roleSelectedAt` state so backend-created default `CLIENT` rows are distinguishable from deliberate client signup.
- Made `/me/role` idempotent for the same role and safe for fresh signup while rejecting role changes after explicit selection, completed profile, provider profile, or marketplace activity.
- Changed mobile OTP signup to persist the chosen role for both client and provider signup, even when `/me` initially returns default `CLIENT`.
- Added an authenticated client profile/name guard and a restored-session role picker for users whose role was not selected yet.
- Routed provider users without a provider profile directly into provider onboarding.
- Added focused identity regression tests in `apps/backend/src/modules/identity/identity.service.spec.ts`.

### 2026-04-19 — WS-02 Direct Booking Lifecycle

- Typed booking create/detail/update responses as `{ success, booking }` and fixed mobile create success to use `result.booking.id`.
- Changed post-create success actions to open the real booking detail or message the provider, never the review route.
- Added backend-reviewed metadata (`reviewed`, `myRating`) and cancellation role metadata (`cancelledByRole`) to booking responses so detail and list cards stay in sync.
- Added provider detail actions for `PENDING -> CONFIRMED`, `CONFIRMED -> IN_PROGRESS`, and `IN_PROGRESS -> COMPLETED`; invalid transitions are not offered in the mobile UI and still return backend errors if attempted.
- Changed cancellation from detail to use role-specific reasons through the status update endpoint.
- Fixed booking-detail message routing so clients message providers and providers message clients.
- Guarded the mobile review screen so it only opens for completed, unreviewed bookings.
- Removed fake direct-booking quote line items from booking detail and replaced them with the saved estimate.
- Added focused booking service tests in `apps/backend/src/modules/bookings/bookings.service.spec.ts`.
