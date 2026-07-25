# KAYOU Launch Activation & Closed Beta — Agent Handoffs

## Reusable Prompt

```text
You are implementing workstream [XX] in docs/launch-activation-closed-beta/.

Required reading:
1. CLAUDE.md
2. docs/launch-activation-closed-beta/README.md
3. docs/launch-activation-closed-beta/00-product-operational-contract.md
4. docs/launch-activation-closed-beta/PROGRESS.md
5. docs/launch-activation-closed-beta/[workstream file]
6. Relevant existing code and deployment/design documents named by the workstream

Binding rule:
Campaign submissions and qualification remain leads only. They create no Supabase
Auth user, local User, Provider, session, role, beta membership, or marketplace
access. Only after the authoritative phase is CLOSED_BETA may an approved lead be
invited to initiate real account creation.

Working rules:
- Stay within the workstream boundary unless a shared contract change is required.
- Record shared schema/route/enum/metric changes in PROGRESS.md before consumers merge.
- Preserve the V1 cash-first direct-service contract.
- Keep payments, mobile money, escrow, payouts, complex invoices, quote marketplace,
  and broad public launch out of scope.
- Protect PII and raw invite tokens from logs, analytics, fixtures, and exports.
- Use server-side phase/membership authorization; public flags are presentation only.
- Run focused tests, type-check/build as relevant, and manual production-like smoke.
- Update PROGRESS.md with files, migration, commands, decisions, and remaining risks.

Report:
- What changed.
- Acceptance criteria demonstrated.
- Commands and manual checks passed/failed.
- Data/phase/privacy evidence.
- Any blocker or contract decision needed.
```

## Parallel Execution Waves

Wave 1:

- `01` owns metric/config contract.
- `02` owns shared lead DTO/persistence/public intake.
- `06` may begin deployment/security design and test harness work that does not assume unfinished schemas.

Wave 2:

- `03` and `05` can run in parallel after `02` lead contracts stabilize.
- `04` can implement invitations/membership after shared lifecycle models stabilize, but must ship disabled.
- `06` integrates phase/access/migration/release checks.

Wave 3:

- `07` rehearses operations against the release candidate.
- G3 is an operator decision, not an agent-inferred state.
- Provider activation happens before G4/client matching.

## Workstream 01 — Scope, Metrics, And Gates

```text
Implement docs/launch-activation-closed-beta/01-launch-scope-metrics-and-gates.md.

Goal:
Create stable metric definitions, cohort/focus configuration, privacy-safe events,
demo/test exclusions, operational queries/views, and reproducible G0–G5 evidence.

Boundary:
Do not own campaign form UI, qualification mutations, or invite claim. Do not count
leads as accounts, qualified leads as verified providers, or seed/demo data as launch
supply. Keep all active categories visible/lead-capable, use home services only as the
documented operational priority, and make the 200-provider G4 count reproducible.
```

## Workstream 02 — Campaign Conversion, Landing, And Lead Data

```text
Implement docs/launch-activation-closed-beta/02-campaign-conversion-landing-and-lead-data.md.

Goal:
Make production campaign mode concise French-first, phone-first, fully responsive, and
exceptionally low-friction. Validate minimal progressively disclosed provider/client
forms, mobile speed, funnel/quality measurement, and a practical attributed acquisition
experiment loop. Implement typed lead-only persistence, consent, idempotency, abuse
controls, and safe responses.

Critical proof:
Automated/integration evidence must show provider and client submissions create no
Supabase Auth, local User, Provider, session, role, or beta membership.
Report mobile form completion/time, source attribution, valid/contactable yield, and
the target-user usability/performance checks.
The form must show all active KAYOU categories and no synthetic home-services umbrella.

Boundary:
Do not implement qualification, invitations, account activation, or marketplace
access. Do not expose seeded marketplace content in campaign mode.
```

## Workstream 03 — Provider Qualification Admin

```text
Implement docs/launch-activation-closed-beta/03-provider-intake-qualification-admin.md.

Goal:
Build the admin-only provider lead queue, contact history, assignments, rubric,
controlled state transitions, coverage view, PII protection, concurrency, and audit.

Critical proof:
QUALIFIED remains a lead-only state. INVITED is impossible in CAMPAIGN, and no admin
qualification action creates an auth or marketplace account.

Boundary:
Do not collect government ID/payment data in campaign operations. Leave invite claim
and real onboarding to workstream 04.
```

## Workstream 04 — Approved Lead Activation And Auth

```text
Implement docs/launch-activation-closed-beta/04-approved-lead-activation-and-auth.md.

Goal:
Implement dormant-by-default invitation issuance/claim, participant-initiated Supabase
OTP account creation, safe lead linking, invite-authorized role handling, beta
membership, conflict handling, and onboarding handoff.

Critical proof:
Issuance and claim hard-fail unless the authoritative server phase is CLOSED_BETA.
No account is pre-created. Every activated account traces atomically to one approved
lead and claimed invite.

Boundary:
Do not weaken general role locks or make activation equal provider readiness. Do not
build automated outbound messaging.
```

## Workstream 05 — Client Demand Waitlist

```text
Implement docs/launch-activation-closed-beta/05-client-demand-waitlist.md.

Goal:
Build client eligibility operations, demand aggregation, supply-gap views, cohort
selection, contact history, PII protection, and the handoff to 04.

Critical proof:
Client waitlist and ELIGIBLE state create no account or access. Invitation is impossible
before CLOSED_BETA/G4 and client cohorts are not invited before 200-provider coverage.
Client-demand collection itself is public from G1/day one and is never gated by provider count.

Boundary:
Do not collect exact public addresses or payment data. Do not count qualified provider
leads or seed providers as ready supply.
```

## Workstream 06 — Production, Deployment, And QA

```text
Implement docs/launch-activation-closed-beta/06-production-deployment-and-qa.md.

Goal:
Add safe phase/access controls, migration and release sequencing, focused public rate
limits, monitoring without PII, backup/restore rehearsal, QA coverage, kill switches,
and deployment runbook updates on top of the existing Render setup.

Critical proof:
Safe production defaults are CAMPAIGN + invites off + matching off. Backend authorization
blocks premature activation/access. Campaign smoke creates no auth/account records.

Boundary:
Do not replace the existing deployment runbook or run destructive seed/reset commands
against production. Surface the shared-Supabase decision before G3.
```

## Workstream 07 — Closed-Beta Operations

```text
Implement/rehearse docs/launch-activation-closed-beta/07-closed-beta-operations-and-launch-gate.md.

Goal:
Prepare owners, support hours, incident severity/runbook, provider-first waves, cohort
cadence, stop/hold controls, and G3/G4/G5 decision records.

Critical proof:
No invite precedes G3. No client matching/cohort precedes G4 real-provider readiness.
G4 requires at least 200 counted verified and available home-priority providers.
Support and incident pause/recovery are rehearsed.

Boundary:
Do not flip production phase or issue real invitations without the named operator GO.
Do not turn G5 into a broad public-launch decision.
```
