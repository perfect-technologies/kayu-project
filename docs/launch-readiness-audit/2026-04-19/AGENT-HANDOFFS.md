# KAYOU Launch Remediation Agent Handoffs

Use this file to assign focused implementation agents to the launch-readiness workstreams documented in this folder.

This is separate from `docs/implementation-plan/AGENT-HANDOFFS.md`, which tracks the earlier monorepo/migration implementation plan. Do not reuse the old progress tracker for this launch remediation phase.

## Required Reading For Every Agent

Before editing code, each agent must read:

1. `docs/launch-readiness-audit/2026-04-19/README.md`
2. `docs/launch-readiness-audit/2026-04-19/00-executive-summary.md`
3. `docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md`
4. `docs/launch-readiness-audit/2026-04-19/PROGRESS.md`
5. The relevant flow audit for the assigned workstream:
   - Client work: `03-client-flow-audit.md`
   - Provider work: `04-provider-flow-audit.md`
   - Admin/ops work: `05-admin-and-operations-audit.md`
   - Data/API work: `02-data-model-audit.md`
   - Testing work: `06-test-and-release-plan.md`
   - Web work: `08-web-flow-audit.md`

## Coordination Rules

- Assign one workstream per agent unless the workstream explicitly says it is safe to combine.
- Keep edits inside the assigned workstream unless a dependency is unavoidable.
- Do not rewrite unrelated UI, architecture, schema, or styling.
- Preserve existing user changes in the worktree.
- If schema changes are needed, update Prisma schema, migrations, DTOs/schemas, seed data if affected, and the mobile contract that consumes it.
- Add or update tests where the workstream changes behavior.
- Run the validation commands listed for the workstream before handing back.
- Update `PROGRESS.md` before finishing:
  - status
  - owner
  - files changed
  - validation run
  - blockers or follow-up work

## Recommended Assignment Order

Start with the P0 flows:

1. `WS-01` Auth Role And Profile Completion
2. `WS-02` Direct Booking Lifecycle
3. `WS-03` Messaging Bootstrap And Role Recipients
4. `WS-04` Client Job Request And Quote Acceptance, or explicitly hide the unfinished flow for launch

Then assign the P1 launch-hardening work:

5. `WS-06` Provider Onboarding And Publication Consistency
6. `WS-05` Provider Dashboard And Request Actions
7. `WS-08` Reviews And Client Reputation
8. `WS-07` Discovery, Map, And Filters
9. `WS-09` Verification And Admin Review
10. `WS-10` Admin / Ops MVP
11. `WS-11` Payments And Earnings Policy
12. `WS-12` Test Harness
13. `WS-13` Web Launch Parity And Route Hygiene, if web is launch-facing

`WS-12` can begin once the first P0 fix lands, but the agent should focus on reusable E2E/test infrastructure and avoid blocking feature agents.

## Validation Baseline

At minimum, agents should run the relevant commands:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
pnpm --filter @kayu/web type-check
```

When backend behavior changes, run or add backend tests for the touched module.

When mobile flows change, validate the affected client/provider route manually or with the mobile E2E harness if available.

## Reusable Agent Prompt

```text
You are implementing KAYOU launch-remediation workstream <WS-ID>: <TITLE>.

Required reading:
- docs/launch-readiness-audit/2026-04-19/README.md
- docs/launch-readiness-audit/2026-04-19/00-executive-summary.md
- docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md
- docs/launch-readiness-audit/2026-04-19/PROGRESS.md
- <relevant audit doc(s)>

Scope:
- Own only <WS-ID> from 07-agent-workstreams.md.
- Use the "Owns", "Tasks", and "Acceptance Criteria" sections as the contract.
- Do not make unrelated refactors or cosmetic rewrites.
- Preserve any existing user changes in the worktree.

Implementation expectations:
- Fix backend, shared package, mobile, and docs surfaces required for this workstream to work E2E.
- Add or update focused tests for changed behavior.
- Keep API response contracts explicit and update consumers together.
- Use existing project patterns.

Before finishing:
- Run relevant type checks/tests.
- Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md with status, files changed, validation, blockers, and follow-ups.
- Summarize what changed, what was validated, and what remains.
```

## Ready-To-Send Prompts

### WS-01 Auth Role And Profile Completion

```text
Implement WS-01 Auth Role And Profile Completion from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and focus on the P0 issue where provider signup can leave the local user as CLIENT because the mobile auth flow only calls setRole when userRole is absent. Make account creation/login deterministic for Client and Provider, ensure the local User row and Supabase session state agree, and ensure provider users land in the provider onboarding/pro app path.

Update tests or add focused coverage for identity role/profile behavior. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-02 Direct Booking Lifecycle

```text
Implement WS-02 Direct Booking Lifecycle from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and fix the direct booking E2E path. Address the mobile create-booking response mismatch, prevent navigation to review before completion, and give providers the required confirm/start/complete actions that match backend status transitions. Make cancellation behavior role-aware and keep BookingDetail/Bookings list state consistent after mutations.

Add or update backend/mobile tests where practical. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-03 Messaging Bootstrap And Role Recipients

```text
Implement WS-03 Messaging Bootstrap And Role Recipients from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and fix chat bootstrap and recipient selection. Starting a chat from provider profile without an existing conversation must create the conversation, display the first sent message reliably, and navigate/state-update to the real conversation id. Booking detail must message the provider when viewed by a client and the client when viewed by a provider.

Add focused tests or integration checks for messaging behavior if possible. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-04 Client Job Request And Quote Acceptance

```text
Implement WS-04 Client Job Request And Quote Acceptance from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and either finish the client job-request/quote acceptance flow for launch or explicitly hide the unfinished entry points. The preferred implementation is a client UI to create job requests, see provider quotes, accept/decline quotes, and land in a real booking created from the accepted quote. Keep provider quote creation compatible with the client flow.

Add or update tests for quote acceptance and booking creation. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing, including any decision to defer or hide the flow.
```

### WS-05 Provider Dashboard And Request Actions

```text
Implement WS-05 Provider Dashboard And Request Actions from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and make the provider dashboard/request surfaces show actionable real data with reliable empty/error states. Align request cards, quote actions, booking shortcuts, earnings snippets, and refresh behavior with backend state.

Run relevant type checks and any focused tests. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-06 Provider Onboarding And Publication Consistency

```text
Implement WS-06 Provider Onboarding And Publication Consistency from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and fix provider publication/search consistency. Provider onboarding should produce a provider profile that appears in discovery only when launch-ready fields are complete, with onboardingCompleteAt, trust score, profession/category, service areas, and verification defaults handled consistently for legacy and draft onboarding paths.

Add focused tests around onboarding publish/search visibility. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-07 Discovery, Map, And Filters

```text
Implement WS-07 Discovery, Map, And Filters from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and make discovery filters honest and useful. Remove or disable placeholder filters that do nothing, or wire them to backend-supported filters. Make map mode either real enough for launch or clearly unavailable. Keep provider cards consistent with available provider data.

Run relevant type checks and validate the search flow manually. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-08 Reviews And Client Reputation

```text
Implement WS-08 Reviews And Client Reputation from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and fix review state and client/provider reputation flows. Mobile should use backend review presence correctly, reviews should only be available for completed bookings, and provider review-of-client behavior should be visible where it matters.

Add focused tests for completed-booking review behavior. Run relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-09 Verification And Admin Review

```text
Implement WS-09 Verification And Admin Review from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and make verification launch-ready. Replace placeholder upload behavior with a real or explicitly stubbed storage policy, make document statuses visible, and ensure admin review changes provider verification state in a traceable way.

Run relevant type checks and backend tests if you touch admin/verification services. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-10 Admin / Ops MVP

```text
Implement WS-10 Admin / Ops MVP from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and make admin capabilities coherent for launch. Either provide a minimal admin surface or document/guard the backend-only admin workflow. Admin users must not fall through confusing client/provider mobile flows.

Run relevant type checks and any backend tests for admin endpoints. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-11 Payments And Earnings Policy

```text
Implement WS-11 Payments And Earnings Policy from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and make payment/earnings behavior explicit. If online payment is not launch scope, make the cash/offline policy visible in booking completion and earnings. If payment confirmation is required, add the missing state transition and prevent confusing unpaid earnings.

Run relevant type checks and focused backend tests if payment/transaction behavior changes. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-12 Test Harness

```text
Implement WS-12 Test Harness from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read the required launch audit docs and add a practical test harness for the launch-critical flows. Prioritize backend integration tests and mobile E2E/manual scripts for auth role selection, direct booking, booking status transitions, messaging bootstrap, quote acceptance if launch scope, and completed-booking reviews.

Do not block feature agents with broad refactors. Run the new tests and relevant type checks. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```

### WS-13 Web Launch Parity And Route Hygiene

```text
Implement WS-13 Web Launch Parity And Route Hygiene from docs/launch-readiness-audit/2026-04-19/07-agent-workstreams.md.

Read docs/launch-readiness-audit/2026-04-19/08-web-flow-audit.md in addition to the required launch audit docs. Treat apps/web as a launch-facing marketplace client. Bring web auth, direct booking, booking status transitions, messaging bootstrap, reviews, admin routing/access, discovery filters/map, quote entry points, verification placeholders, and dashboard navigation into parity with the shared backend/mobile launch fixes.

Do not make broad visual rewrites. Remove or hide unfinished web routes/controls if they are not launch scope. Run pnpm --filter @kayu/web type-check plus any shared package/backend checks required by your changes. Update docs/launch-readiness-audit/2026-04-19/PROGRESS.md before finishing.
```
