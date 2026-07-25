# KAYOU Launch Activation & Closed Beta

## Purpose

This folder orchestrates the phase that turns KAYOU from a demo-data marketplace into a controlled, real Kinshasa launch.

The initial operational wedge is **home-related services**: existing building/construction, plumbing/sanitary, household electricity/climate, carpentry, locksmith/metalwork, and home-maintenance services defined in [`01-launch-scope-metrics-and-gates.md`](./01-launch-scope-metrics-and-gates.md). This is an operations priority, not a new public category. The campaign shows all active KAYOU categories and accepts provider/client leads for all of them.

The sequence is deliberate:

1. Run a campaign landing page.
2. Collect provider and client leads without creating marketplace accounts.
3. Qualify supply and demand through an admin-operated workflow.
4. Make production, privacy, support, and QA ready.
5. Explicitly open the closed-beta phase.
6. Invite approved leads to create real accounts and complete required onboarding.
7. Build to 200 verified and available providers in the home-services operational priority.
8. Then admit small client cohorts, operate matching, and decide what to improve next.

This phase builds on the marketplace behavior in [`../v1-launch-alignment/00-product-contract.md`](../v1-launch-alignment/00-product-contract.md). It does not replace that contract.

## Phase Contract In One Sentence

Campaign submissions are leads only; approved leads may create real authenticated marketplace accounts only after an operator explicitly opens the closed beta.

## Deliberate Non-Goals

- Online payments or card collection.
- Mobile money collection.
- Escrow, refunds, or payment guarantees.
- Provider payouts.
- Complex invoices or tax documents.
- Public job requests, competitive quotes, or quote comparison.
- A broad public marketplace launch.
- Automatic account creation from campaign data.
- Bulk-importing leads into Supabase Auth.
- Making mobile apps a prerequisite for the first closed-beta cohort.
- Automated outbound email, SMS, or WhatsApp as a beta prerequisite.

Cash remains handled directly between client and provider under the existing V1 contract.

## Workstreams And Order

| Workstream | Outcome | Depends on | Can begin |
| --- | --- | --- | --- |
| [`00`](./00-product-operational-contract.md) | Frozen product and operational truth | Existing V1 contract | Done before implementation |
| [`01`](./01-launch-scope-metrics-and-gates.md) | Scope, metric definitions, and launch gates | `00` | First |
| [`02`](./02-campaign-conversion-landing-and-lead-data.md) | French-first mobile conversion, practical acquisition, landing page, and lead-only intake | `00`, metric names from `01` | After contract freeze |
| [`03`](./03-provider-intake-qualification-admin.md) | Provider lead review, qualification, and audit workflow | Lead contract from `02` | Parallel with late `02` backend work |
| [`04`](./04-approved-lead-activation-and-auth.md) | Post-beta-open invitations and safe account claiming | `02`, `03`, beta opening gate from `06`/`07` | Design early; enable last |
| [`05`](./05-client-demand-waitlist.md) | Client demand capture, triage, cohorts, and invitations | Lead contract from `02` | Parallel with `03` |
| [`06`](./06-production-deployment-and-qa.md) | Production, security, migration, observability, and QA readiness | Contracts from `01`–`05` | Start early; finish before beta opens |
| [`07`](./07-closed-beta-operations-and-launch-gate.md) | Cohort operations, support, incident response, and gates | `01`–`06` | Operational design early; launch last |

### Recommended Iterations

**Iteration A — freeze contracts**

- Complete `00` and `01`.
- Confirm the existing taxonomy IDs behind the home-services priority configuration and choose pilot service communes.
- Confirm who owns campaign operations, provider qualification, privacy requests, and support.

**Iteration B — capture honest demand and supply**

- Implement `02`, beginning with phone-based copy/form validation and attributed direct outreach.
- Deploy the campaign experience with marketplace access closed.
- Begin `03` and `05` operations against real lead records.

**Iteration C — prepare a safe beta**

- Complete qualification tooling and operational runbooks.
- Implement `04` but keep invitation issuance disabled.
- Complete `06`; exercise migrations, access controls, backups, rate limits, smoke tests, and rollback.
- Rehearse `07` with staff/test data.

**Iteration D — open and activate**

- Record the beta-opening decision.
- Change the authoritative phase to `CLOSED_BETA`.
- Only then issue invitations to approved provider leads so they can create real accounts.
- Invite and activate providers first.
- Keep client marketplace invitations and matching disabled until 200 real providers in the home-services priority are activated, verified, available, and pass G4.
- Continue collecting provider and “J’ai besoin d’un service” client-demand leads publicly throughout this supply-building period.

**Iteration E — operate and learn**

- Admit cohorts gradually.
- Review safety, support, matching, booking, completion, and retention signals.
- Produce a closed-beta readout. Do not convert that decision into a broad public launch in this phase.

## Stage Gates

| Gate | Meaning | Account rule |
| --- | --- | --- |
| G0 — Contract frozen | Data, lifecycle, privacy, ownership, and metrics agreed | No campaign accounts |
| G1 — Campaign live | Public provider and client-demand landing/forms are production-safe from day one | No campaign accounts |
| G2 — Cohort ready | Enough qualified leads and operators are ready | No invites yet |
| G3 — Closed beta open | Authorized operator records the phase change after production/ops QA | Approved provider leads may now receive account invitations |
| G4 — 200-provider supply gate | At least 200 real providers in the home-services priority are activated, verified, available, and otherwise beta-ready | Approved client leads may receive marketplace invitations and client matching may be enabled |
| G5 — Cohort review | Beta evidence and incidents reviewed | No automatic public launch |

Detailed criteria are in [`01-launch-scope-metrics-and-gates.md`](./01-launch-scope-metrics-and-gates.md) and [`07-closed-beta-operations-and-launch-gate.md`](./07-closed-beta-operations-and-launch-gate.md).

## Ownership Boundaries

| Area | Primary owner | Boundary |
| --- | --- | --- |
| Shared DTOs and lifecycle enums | Contract/backend agent | Define in `packages/schemas` before consumers |
| Lead persistence and public endpoints | Backend agent | No Supabase Auth creation; no marketplace models |
| Campaign UI | Web agent | Consume typed lead endpoints; do not put secrets or qualification logic in the browser |
| Provider qualification | Admin/backend agent | Admin-only state changes and auditable notes |
| Account activation | Identity/backend agent | Runs only in `CLOSED_BETA`; never trusts client-supplied role or lead status |
| Client waitlist operations | Demand/admin agent | No premature auth or marketplace access |
| Deployment and release gates | Release agent/operator | Server-enforced phase and access controls; a public env flag is not authorization |
| Closed-beta operations | Launch operator | Cohorts, support, incident log, go/hold/stop decisions |

Any change to a shared model, lifecycle enum, route, or metric definition must be recorded in [`PROGRESS.md`](./PROGRESS.md) before another agent builds on it.

## Working Rules For Agents

1. Read this file, [`00-product-operational-contract.md`](./00-product-operational-contract.md), [`PROGRESS.md`](./PROGRESS.md), and the assigned workstream before editing.
2. Read the current code at the named integration seams; file maps are directional, not permission to assume code has not changed.
3. Preserve the V1 cash-first direct-service behavior.
4. Campaign leads must not create Supabase users, local `User` rows, `Provider` rows, sessions, or marketplace access.
5. Invitation and account-claim endpoints must hard-fail unless the authoritative server phase is `CLOSED_BETA`.
6. Keep qualification notes and decision fields out of public response payloads.
7. Use French for participant-facing copy and clear Kinshasa-first language; keep API and code identifiers in English.
8. Show all active KAYOU categories and accept leads/demand for all of them; do not invent a home-services umbrella or hide non-priority categories.
9. Use the home-services mapping only for operational prioritization, density gates, invitation sequencing, and early matching.
10. Minimize data collection, log no raw contact details, and never put secrets or raw invite tokens in analytics.
11. Add focused automated coverage plus a manual production-like smoke path for each workstream.
12. Update [`PROGRESS.md`](./PROGRESS.md) with status, files, migrations, commands, decisions, and remaining risks.
13. Do not re-enable payments, payouts, quote-marketplace, invoice, or broad-public-launch scope.

## Current Repository Seams

Agents must verify these at implementation time:

- Prisma schema: `apps/backend/prisma/schema.prisma`
- Public/backend module registration: `apps/backend/src/app.module.ts`
- Current identity creation/sync: `apps/backend/src/modules/identity/`
- Existing provider onboarding: `apps/backend/src/modules/onboarding/`
- Existing admin endpoints: `apps/backend/src/modules/admin/`
- Current web homepage: `apps/web/src/app/page.tsx` and `apps/web/src/app/HomePageClient.tsx`
- Current auth flow: `apps/web/src/app/auth/AuthFlow.tsx`
- Shared DTOs: `packages/schemas/src/`
- Typed client: `packages/api/src/endpoints.ts` and `packages/api/src/query-keys.ts`
- Web launch flags: `apps/web/src/lib/launch-flags.ts`
- Deployment topology: `render.yaml`, `.github/workflows/`, and [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
- Design direction: [`../design-direction/index.html`](../design-direction/index.html) and [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md)

## File Map

| File | Purpose |
| --- | --- |
| [`README.md`](./README.md) | Orchestration, order, boundaries, and gates |
| [`00-product-operational-contract.md`](./00-product-operational-contract.md) | Binding product, lifecycle, data, privacy, and non-goal contract |
| [`01-launch-scope-metrics-and-gates.md`](./01-launch-scope-metrics-and-gates.md) | Metrics, events, cohorts, targets, and gate definitions |
| [`02-campaign-conversion-landing-and-lead-data.md`](./02-campaign-conversion-landing-and-lead-data.md) | Campaign conversion, traction, UX, public APIs, and lead-only persistence |
| [`03-provider-intake-qualification-admin.md`](./03-provider-intake-qualification-admin.md) | Provider qualification and admin operations |
| [`04-approved-lead-activation-and-auth.md`](./04-approved-lead-activation-and-auth.md) | Post-beta invitation, auth claiming, and onboarding handoff |
| [`05-client-demand-waitlist.md`](./05-client-demand-waitlist.md) | Client demand intake, triage, cohorts, and activation |
| [`06-production-deployment-and-qa.md`](./06-production-deployment-and-qa.md) | Deployment, privacy/security, QA, rollout, and rollback |
| [`07-closed-beta-operations-and-launch-gate.md`](./07-closed-beta-operations-and-launch-gate.md) | Beta operations, support, incidents, and launch decisions |
| [`AGENT-HANDOFFS.md`](./AGENT-HANDOFFS.md) | Bounded prompts for independent implementation agents |
| [`PROGRESS.md`](./PROGRESS.md) | Live source of truth for execution status and decisions |
