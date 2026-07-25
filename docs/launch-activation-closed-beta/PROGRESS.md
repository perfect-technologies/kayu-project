# KAYOU Launch Activation & Closed Beta — Progress

## Status Summary

Created: 2026-07-25

Overall status: **Plan ready; implementation not started**

The public campaign captures provider and “I need a service” client-demand leads together from day one, then operations qualify them and open a controlled beta. Campaign leads do not become Supabase Auth or marketplace accounts. Approved provider leads may be invited after G3; approved client leads may be invited for marketplace access only after G4.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Operational Contract | Done | Planning | Binding phase truth documented |
| 01 — Launch Scope, Metrics, And Gates | Not started | TBD | All active categories visible; home-services operational priority mapping fixed; choose pilot communes |
| 02 — Campaign Conversion, Landing, And Lead Data | In progress | Backend/data contract | Backend lead-only persistence and public intake are in review; campaign web UI remains unstarted |
| 03 — Provider Intake, Qualification, Admin | Not started | TBD | Depends on `02` provider lead schema |
| 04 — Approved Lead Activation And Auth | Not started | TBD | May be built dormant; issuance/claim forbidden before G3 |
| 05 — Client Demand Waitlist | Not started | TBD | Depends on `02` client lead schema; can parallelize with `03` |
| 06 — Production, Deployment, And QA | Not started | TBD | Start early; must finish before G3 |
| 07 — Closed-Beta Operations And Launch Gate | Not started | TBD | Rehearse before G3; operate after G3/G4 |

Status values:

- `Not started`
- `In progress`
- `Blocked`
- `In review`
- `Done`

Only mark `Done` when acceptance criteria and documented verification pass.

### 02 — Backend/Data Contract

Status: **In review** (backend/data-contract half only)

Owner: Backend/data contract

Date: 2026-07-25

Changed:

- Added `ProviderLead`, `ClientWaitlistLead`, privacy-safe `LeadSubmissionEvent` persistence, explicit created/review-required outcomes, and lifecycle/timing/contact enums in Prisma.
- Preserved the committed checksum of `20260725120000_add_launch_leads`; added forward corrective migration `20260725130000_harden_launch_leads` for outcome backfill, restrictive primary-subcategory and lead-taxonomy junction foreign keys, and immutable taxonomy snapshot backfill. Added `20260725140000_add_campaign_funnel_events` for first-party durable conversion events.
- Added strict shared Zod request/response contracts, lead lifecycle enums, controlled communes, bounded free text, explicit attribution source/medium allowlists, hostname-only referrers, and typed `launchLeadsApi` methods. `@kayu/utils` now exports the canonical plausible DRC mobile normalizer/validator used by backend intake and available to web.
- Added unauthenticated `POST /api/launch/provider-leads` and `POST /api/launch/client-leads` endpoints with the same generic response for new and duplicate submissions.
- Added unauthenticated `POST /api/launch/funnel-events` with a durable `CampaignFunnelEvent` row, strict allowlisted event/dimension/route/device/attribution DTO, event-time window, separate kill switch/rate bucket, and generic `{ accepted: true }` response. Unknown keys and PII/free-text/auth/session/cookie/account fields are rejected.
- Added active-taxonomy validation with no home-priority restriction, plausible RDC mobile-number validation, role-separated phone deduplication, consent/version timestamps, attribution/audit events, and form-duration buckets. The binding contract now explicitly defines anonymous duplicates as non-mutating review events; participant-field/consent refresh requires a future approved contact-control capability and phone knowledge or a browser cookie is insufficient.
- Made first-submission creation and created-vs-review analytics atomic with serializable transactions and bounded conflict retries. Campaign keys now encode fixed attribution field positions to prevent source/medium/campaign/content collisions.
- Added independent default-off lead/funnel kill switches, required privacy/hash configuration before enablement, body-size limits, honeypot handling, and separate lead-IP/contact/funnel-IP limits. Limiter keys use non-reversible HMAC buckets; an expiry min-heap removes only due entries without full-map scans, cardinality fails closed, and `429` responses include the remaining-window `Retry-After`.
- No campaign UI, auth/account creation, qualification/admin workflow, invitations, activation, payments, or beta operations were added.

Verified:

- `pnpm --filter @kayu/schemas type-check`
- `pnpm --filter @kayu/schemas build`
- `pnpm --filter @kayu/api type-check`
- `pnpm --filter @kayu/api build`
- `pnpm --filter @kayu/utils test` — 2/2 canonical phone normalization/plausibility tests passed; utils type-check/build and web consumer type-check passed.
- `pnpm --filter @kayu/backend test:launch` — 111/111 passed, including duplicate immutability/consent, heap-based limiter privacy/bounds/expiry/`Retry-After`, shared DRC phone consumption, strict funnel DTO/persistence, campaign-key collision, and taxonomy admin safety regressions.
- Focused launch-lead/config/admin unit suite — 51/51 passed.
- `LAUNCH_LEADS_TEST_DATABASE_URL=... pnpm --filter @kayu/backend test:launch-leads:ci` — mandatory CI mode 1/1 passed against disposable Postgres with two concurrent first submissions, atomic outcomes, restrictive taxonomy FK, durable funnel persistence, and zero `User`/`Provider` records. CI now provisions Postgres, deploys migrations, and fails instead of skipping when the database URL is absent.
- `pnpm --filter @kayu/backend type-check`
- `DATABASE_URL=postgresql://u:p@localhost:5432/db pnpm --filter @kayu/backend build`
- Fresh temporary Postgres: `prisma migrate deploy` applied all four migrations and `prisma migrate diff --exit-code` reported `No difference detected`.
- Seeded upgrade stopped after the original `20260725120000_add_launch_leads`: corrective deploy backfilled one created event, one duplicate-review event, one provider taxonomy junction, and two client taxonomy junctions; final schema diff reported `No difference detected`.
- Production-like Nest smoke: the original and attacker duplicate both received the generic accepted response, while the duplicate left all lead fields and consent unchanged and recorded only a review-required event with marketing consent false. A third rate-limited request returned `429` with `Retry-After`; aggregate evidence was one lead, one created event, one safe duplicate event, `User=0`, and `Provider=0`.
- Funnel Nest smoke: an allowlisted event returned `201 { accepted: true }` and persisted one owned event; a payload containing `phone` returned `400`; the third same-IP event returned `429` with `Retry-After`; `User=0` and `Provider=0`.

Data/phase checks:

- Provider/client/funnel collection code depends only on Prisma lead/taxonomy/event models and configuration; it injects no identity, Supabase admin, session, user, provider, membership, invitation, or marketplace service.
- Public DTOs are strict and reject lifecycle state, admin notes, linked account IDs, unknown fields, unsafe attribution, PII funnel properties, inactive taxonomy IDs, and invalid communes.
- Every active category/subcategory remains available through the existing taxonomy interfaces; intake accepts any active subcategory, including non-priority categories.
- Lead and funnel collection default disabled. Lead intake requires the current privacy-notice version; either public collector requires a 32+ character hashing key.

Remaining:

- Campaign landing/forms, browser event emission, responsive/accessibility/performance/user testing, and campaign route gating are intentionally outside this backend-only change.
- Operations/privacy must set the real privacy-notice version and rate-limit hash key, then explicitly enable `LAUNCH_PUBLIC_INTAKE_ENABLED` and/or `LAUNCH_FUNNEL_EVENTS_ENABLED`. Define the funnel-row retention/deletion job before production enablement.
- The bounded limiter remains process-local because the current repository has no shared rate-limit store. Its limits are per replica; introduce a shared privacy-safe store before running multiple backend replicas.
- Pilot-commune selection and the reviewed home-priority taxonomy-ID configuration remain workstream `01`/operator decisions; neither blocks all-active-category lead capture.

## Current Gates

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| G0 — Contract frozen | Planning complete | Implementation owners, priority taxonomy IDs, and focus geography still to be assigned |
| G1 — Campaign live | Not started | `02` + campaign portion of `06` |
| G2 — Cohort ready | Not started | Real production lead/qualification counts required |
| G3 — Closed beta open | Not started | Requires G2, production/ops readiness, and recorded GO |
| G4 — Client matching enabled | Not started | Requires 200 counted verified and available home-priority providers after G3 |
| G5 — Cohort review | Not started | Requires real beta evidence |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-25 | Create a new phase folder instead of rewriting V1 alignment docs | The activation/beta phase builds on, but does not change, the V1 marketplace contract |
| 2026-07-25 | Campaign submissions are dedicated lead records only | Campaign interest must not create fake or premature marketplace users/providers |
| 2026-07-25 | No Supabase/local account before closed beta opens and an approved lead accepts an invite | Keeps campaign and qualification separate from real identity/account creation |
| 2026-07-25 | Account creation is participant-initiated through real auth | Avoids bulk/pre-created auth accounts and confirms contact ownership |
| 2026-07-25 | Beta opening (G3) precedes provider invitations; provider readiness (G4) precedes client matching | Resolves lifecycle order while protecting supply quality |
| 2026-07-25 | Backend phase and beta membership are authorization boundaries | Public web flags/navigation are not security controls |
| 2026-07-25 | Campaign can proceed before the production Supabase isolation decision | Campaign lead capture does not use Supabase Auth |
| 2026-07-25 | Payments, mobile money, payouts, escrow, complex invoices, quotes, and broad public launch remain excluded | Maintains a focused cash-first controlled beta |
| 2026-07-25 | Campaign is French-first, phone-first, fully responsive, and uses minimal progressively disclosed fields | Most target users arrive on phones and campaign interest should be exceptionally easy to submit |
| 2026-07-25 | Acquisition is judged by completed, valid, contactable, qualified/eligible leads per source | Gives a non-marketing team a practical traction loop and avoids vanity optimization |
| 2026-07-25 | Campaign shows all active existing KAYOU categories; no new home-services umbrella is introduced | Home-related services are an operational priority, not a public taxonomy restriction |
| 2026-07-25 | Home-related existing categories/subcategories receive first priority for recruitment, qualification, invitations, density reporting, and early matching | Establishes the initial operational wedge while preserving all-category lead capture |
| 2026-07-25 | Provider and client-demand forms launch together from G1/day one | Provider readiness gates client marketplace invitation/matching, never demand collection |
| 2026-07-25 | Working G4 client-matching threshold is 200 real, activated, verified, available providers in the home-services priority | This latest working target supersedes the earlier provisional count and does not gate public campaign launch or client-demand intake |

## Open Decisions

These do not block documentation; resolve by the stated gate:

| Decision | Owner | Due |
| --- | --- | --- |
| Resolve the documented home-services priority slugs to reviewed active taxonomy IDs | Product/backend owner | Before G1 |
| Select pilot Kinshasa communes/service areas | Operations owner | Before G1 |
| Confirm remaining numeric defaults other than the fixed working G4 target | Product + operations | Before G1 |
| Name qualification, support, incident, privacy, and release owners | Launch owner | Before G1; backups before G3 |
| Separate production Supabase or explicitly accept/mitigate shared-auth risk | Release/privacy owner | Before first invitation/G3 |
| Confirm privacy/terms versions, withdrawal channel, and retention procedure | Privacy owner | Before G1 |
| Choose support channel/hours | Operations owner | Before G3 |

## Shared Contract Changes

Agents append entries before merging a change another workstream consumes.

| Date | Area | Change | Consumers | Owner |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Agent Update Template

```text
### [XX — Workstream]

Status:
Owner:
Date:

Changed:
- files, migrations, routes, schemas

Verified:
- exact commands and manual scenarios

Data/phase checks:
- proof campaign action created no Supabase/local marketplace account
- phase/membership behavior where relevant
- PII/log/analytics review

Decisions:
- contract changes and rationale

Remaining:
- blockers, follow-ups, operator actions
```

## Final Release Evidence Checklist

- [ ] Home-services priority taxonomy IDs and pilot communes recorded; all active categories remain visible.
- [ ] Production lead intake creates no auth/user/provider records.
- [ ] Qualification and client eligibility audit passes.
- [ ] Campaign content contains no fake marketplace evidence.
- [ ] Abuse, privacy, retention, withdrawal, and admin-access controls pass.
- [ ] Phase defaults to `CAMPAIGN`; invites and matching default off.
- [ ] Auth isolation/risk decision recorded.
- [ ] Backup restore and migration rehearsal recorded.
- [ ] Support/incident rehearsal passes.
- [ ] G3 GO recorded before any invite.
- [ ] Provider activation/onboarding/verification produces 200 counted home-priority providers for G4.
- [ ] Client-demand intake was live from G1; client marketplace invitations remain off until G4.
- [ ] G4 GO recorded before client matching/cohort invites.
- [ ] Cash-first marketplace smoke passes.
- [ ] Deferred-feature guard checks pass.
- [ ] G5 readout and bounded decision recorded.
