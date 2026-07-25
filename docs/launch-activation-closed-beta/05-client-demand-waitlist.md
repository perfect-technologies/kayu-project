# 05 — Client Demand Waitlist

## Outcome

Capture real Kinshasa service demand, understand category/commune/timing gaps, and prepare bounded client cohorts without creating campaign-stage accounts or promising immediate supply.

The client-demand form launches with the provider form at G1/day one. The supply threshold gates client marketplace invitations and active matching, never demand collection.

## Ownership

This workstream owns:

- Client lead operational view and eligibility workflow.
- Demand aggregation by category, commune, timing, and campaign source.
- Client cohort selection and manual contact history.
- Handoff to the post-beta activation system in `04`.

Public client DTO/persistence foundations belong to `02`.

## Demand Intake Principles

- Ask for no more than one to three needed service subcategories.
- Capture coarse commune, not exact job-site address.
- Capture timing bands rather than a promised appointment.
- Keep free text optional and short.
- Explain that KAYOU will contact selected participants if matching supply exists.
- Do not collect payment, mobile-money, budget account details, ID documents, or passwords.
- Do not create a Supabase/local account.

## Eligibility Workflow

```text
SUBMITTED
-> ELIGIBLE
-> PAUSED
-> DECLINED
-> WITHDRAWN

ELIGIBLE -- only after CLOSED_BETA and G4 --> INVITED
INVITED -> ACTIVATED
INVITED -> ELIGIBLE  (expired/revoked)
```

Eligibility criteria:

- Valid, confirmed contact.
- Demand in an active KAYOU category.
- Home-services demand receives first operational priority; non-priority demand remains valid and may be paused until suitable supply exists.
- Commune can be served by the planned provider cohort.
- Timing can be handled without making false urgency promises.
- Participant understands closed-beta terms and cash-first marketplace behavior.
- Participant is willing to provide job-specific information after authenticated activation.

`PAUSED` is appropriate when demand is real but supply coverage is not yet adequate. `DECLINED` is for invalid/out-of-scope/safety/duplicate cases. Use controlled reason codes.

## Demand Operations View

Minimum list/detail capability:

- Submission age, category, commune, timing, source, status, cohort.
- Contact masked by default.
- Last contact attempt/result.
- Supply coverage indicator using real ready-provider counts only.
- Eligibility and pause reason codes.
- Invitation/activation state after beta opens.

Minimum aggregate view:

- Submitted/eligible demand by category.
- Demand by commune.
- Demand by timing band.
- Supply gap: eligible demand versus qualified leads during campaign, and versus ready providers during beta, split by home-priority group and all other active categories.
- Aging: unreviewed and eligible-but-uninvited.

Do not expose client free-text needs or contact details in aggregate analytics.

## Cohort Selection

Select cohorts using:

- Available ready-provider coverage.
- The first matching cohort is not invited until G4 has at least 200 counted verified and available home-priority providers.
- Category and commune balance.
- Timing still relevant.
- Campaign-source diversity.
- Support capacity.
- Small enough size to pause safely.

Initial default: invite at most 20 clients in the first cohort, after G4 supply readiness passes. Later cohorts require a review of the preceding cohort’s response, matching, support, and incident signals.

Avoid cherry-picking only the easiest jobs when it would invalidate learning; record cohort selection criteria.

## Participant Communication

Campaign acknowledgment:

- Interest received.
- No account created.
- No guaranteed beta place or provider.

Qualification contact:

- Confirm broad need and timing.
- Do not request exact address or payment.

Post-beta invitation:

- State limited cohort and expiry.
- Link to participant-initiated account creation.
- Restate cash-first terms and support route.

No automated outbound messaging system is required. Manual, logged communication is acceptable for the first cohort.

## Privacy

- Operational contact consent is required.
- Marketing consent is separate.
- Withdrawal stops campaign/beta recruitment contact and triggers retention handling.
- Exact job details belong in authenticated marketplace flows.
- Admin notes remain private and minimal.
- Exports mask contact by default and are access/audit controlled.

## Tests

- Client status transition matrix and reason requirements.
- Invite transition denied before `CLOSED_BETA` and G4.
- No eligibility action creates an account.
- Aggregate demand excludes withdrawn/rejected/test/demo duplicates.
- Supply indicator uses ready real providers, not leads or seed providers.
- PII absent from aggregate payloads and analytics.
- Cohort cap and repeat-invite protections.

## Acceptance Criteria

- Real demand can be segmented by service, commune, timing, and source.
- Client-demand collection is available from G1/day one and remains independent of the provider-readiness count.
- Campaign acknowledgments clearly say no account was created.
- Client leads stay separate from marketplace `User` records until a valid post-beta invitation is claimed.
- Eligibility does not grant marketplace access.
- Clients are invited to create marketplace accounts only after G4 reaches 200 counted providers and support capacity exists.
- All active categories may collect client demand; home-services demand receives first matching priority without hiding or discarding other categories.
- Exact address/payment information is not requested publicly.
- Cohort selection and contact history are reproducible and auditable.
