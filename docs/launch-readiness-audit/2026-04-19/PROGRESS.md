# KAYOU Launch Readiness Remediation Progress

Last updated: 2026-04-19

This file tracks remediation work from `docs/launch-readiness-audit/2026-04-19/`. It intentionally does not replace `docs/implementation-plan/PROGRESS.md`, which tracks the earlier implementation/migration plan.

## Current Phase

Audit complete. Remediation not started.

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
| WS-01 | P0 | Yes | Auth Role And Profile Completion | None | not_started | | Provider signup/login role consistency. |
| WS-02 | P0 | Yes | Direct Booking Lifecycle | WS-01 helpful | not_started | | Create response, review gating, provider confirm/start/complete. |
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

## Current P0 Blockers

| Area | Blocker | Source |
| --- | --- | --- |
| Auth | Provider signup can leave local user role as `CLIENT`, breaking provider onboarding and pro routing. | `03-client-flow-audit.md`, `04-provider-flow-audit.md` |
| Booking | Mobile direct booking reads `result.id`, but backend returns `{ success, booking }`. | `03-client-flow-audit.md` |
| Booking | Direct booking success navigates to review before booking is complete. | `03-client-flow-audit.md` |
| Booking | Provider has no UI path to confirm/start direct bookings before completing them. | `04-provider-flow-audit.md` |
| Messaging | First message from provider profile can create a conversation without the UI binding to the new conversation. | `03-client-flow-audit.md` |
| Messaging | Booking detail uses provider recipient even for provider users, causing providers to message themselves. | `04-provider-flow-audit.md` |
| Quotes | Client request/quote acceptance path is not available in mobile despite backend/provider quote support. | `03-client-flow-audit.md`, `04-provider-flow-audit.md` |

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-04-19 | Track launch remediation in this audit folder instead of `docs/implementation-plan/`. | The implementation plan is migration-oriented and already marked complete. Launch remediation needs its own status. |
| 2026-04-19 | Treat direct booking as the minimum launch-critical marketplace flow. | A client must be able to book a provider and a provider must be able to complete the booking reliably. |
| 2026-04-19 | Treat job request/quote as launch-critical only if the product intends to expose it at launch. | The backend/provider pieces exist, but client acceptance is missing. Half-exposed flows should be completed or hidden. |
| 2026-04-19 | Agents must update this file before handing back work. | Parallel remediation needs a single coordination surface. |

## Validation Evidence

Initial audit validation:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed during audit. These checks do not prove end-to-end flow correctness.

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

No remediation work completed yet.

