# 01 — Launch Scope, Metrics, And Gates

## Outcome

Create one measurable definition of campaign health, cohort readiness, beta activation, and beta learning. This workstream owns definitions and reporting contracts, not campaign UI or operational qualification.

## Scope

- Resolve and verify the fixed home-services operational priority against active taxonomy IDs.
- Keep all active KAYOU categories visible and lead-capable in campaign forms and reporting.
- Select initial pilot communes/service areas in Kinshasa.
- Define campaign cohorts and attribution.
- Implement privacy-safe events and operational reports.
- Exclude seed/demo/test records from all launch reporting.
- Give operators an explicit go/hold/stop checklist.

## Metric Dictionary

| Metric | Definition | Source |
| --- | --- | --- |
| Provider lead submitted | Distinct normalized provider contact accepted by the production provider-lead endpoint | `ProviderLead` |
| Client lead submitted | Distinct normalized client contact accepted by the production client-lead endpoint | `ClientWaitlistLead` |
| Form completion | Completed lead submissions ÷ form starts, split by role/source/device | Privacy-safe events + lead receipt |
| Landing conversion | Completed lead submissions ÷ eligible landing views, split by role/source | Privacy-safe events + lead receipt |
| Valid lead rate | Leads with valid contact, commune, required service/category, consent version, and source ÷ submitted leads | Lead tables |
| Qualified provider leads | Provider leads currently `QUALIFIED`; not accounts and not verified providers | Provider lead status |
| Eligible client leads | Client leads currently `ELIGIBLE`; not accounts | Client lead status |
| Priority home-services lead | Lead whose selected subcategory belongs to the configured priority mapping below | Active taxonomy + priority config |
| First-review time | Business time from `submittedAt` to first admin transition out of `SUBMITTED` | Lead audit |
| Qualification yield | `QUALIFIED` provider leads ÷ provider leads that reached `IN_REVIEW` | Lead/audit |
| Cost per completed lead | Attributed channel spend ÷ completed leads | Campaign experiment log + leads |
| Cost per qualified/eligible lead | Attributed channel spend ÷ qualified providers or eligible clients | Experiment log + lead status |
| Invitation acceptance | Leads activated from valid invites ÷ invites delivered, by cohort and role | Invitation + activation |
| Provider readiness | Activated providers who completed required onboarding, verification, availability, and beta entitlement | Marketplace + membership |
| G4 counted provider | Unique non-test provider in the configured home-services priority with approved-lead activation trace, completed onboarding, `VERIFIED` status, current availability, active beta membership, and pilot-commune coverage | Lead + invite + `User` + `Provider` + membership |
| Client activation | Activated invited client accounts with beta entitlement | Marketplace + membership |
| Match attempt | A beta client attempts a supported contact/booking flow with a ready provider | Marketplace event |
| Successful match | Provider responds and both sides agree to continue within 24 hours of match attempt | Operational/booking state |
| Confirmed booking | A real beta booking reaches `CONFIRMED` under the V1 agreement contract | `Booking` |
| Completed service | A real beta booking reaches `COMPLETED` and is not a test/demo record | `Booking` |
| Support first response | Business time from support case creation to first human response | Support log |
| Safety incident | Report involving personal safety, fraud, harassment, identity misuse, or serious service harm | Incident log |

Every displayed rate includes numerator, denominator, window, environment, and cohort. Never show a percentage alone for a cohort under 100 observations.

## Category Visibility And Operational Priority

Campaign visibility is driven by the full active category hierarchy. All current active KAYOU categories/subcategories:

- Appear as selectable campaign options.
- May create provider and client lead records.
- Are included in all-category acquisition and demand reporting.
- Are not rejected merely because they are outside the initial operating wedge.

Do not add a synthetic public “home services” category.

The initial priority configuration is:

| Priority key | Existing category | Priority subcategories |
| --- | --- | --- |
| `building_construction` | `Bâtiment & Construction` (`batiment-construction`) | `maconnerie`, `platrerie`, `carrelage`, `peinture`, `toiture` |
| `plumbing_sanitary` | `Plomberie & Sanitaire` (`plomberie-sanitaire`) | `plomberie-generale`, `sanitaires` |
| `household_electricity_climate` | `Électricité` (`electricite`) | `electricite-generale`, `climatisation` |
| `carpentry_fittings` | `Menuiserie & Ébénisterie` (`menuiserie-ebenisterie`) | `menuiserie-bois`, `menuiserie-aluminium`, `agencement` |
| `locksmith_metalwork` | `Métallerie & Serrurerie` (`metallerie-serrurerie`) | `serrurerie`, `metallerie` |
| `home_maintenance` | `Maison & Entretien` (`maison-entretien`) | `nettoyage`, `jardinage` |

`electricite-automobile` and `demenagement` stay visible and lead-capable but are not priority subcategories for the first operational cohorts.

Store or configure:

- `priorityServiceGroups`: the six stable keys above resolved to reviewed active category/subcategory IDs.
- `pilotCommunes`: the initial service area.
- `clientMatchingProviderTarget`: fixed working initial value `200`.
- `providerActivationWaveSize`: bounded operational batch size chosen from support/onboarding capacity; it does not change the 200-provider gate.
- `clientCohortSize`: initial default 20 activated clients.
- `campaignStartAt`, `campaignEndAt`.
- Stable acquisition source values.

Slugs document intent; implementation should resolve and persist stable IDs from the active taxonomy. A missing/renamed priority record is a configuration error that blocks its density gate, not a reason to hide the rest of the taxonomy.

The launch operator must record the resolved priority IDs and chosen communes in [`PROGRESS.md`](./PROGRESS.md) before campaign production content is finalized.

## Campaign Funnel

Provider funnel:

```text
landing view
-> provider form started
-> provider lead submitted
-> first review
-> qualified
-> invited (only after beta opens and G4 passes)
-> activated
-> marketplace ready
```

Client funnel:

```text
landing view
-> client form started
-> client lead submitted
-> eligible
-> invited (only after beta opens)
-> activated
-> match attempted
-> booking confirmed
-> service completed
```

## Analytics Event Contract

Safe browser/server events:

- `launch_landing_viewed`
- `launch_role_selected` with `leadType`
- `launch_form_started` with `leadType`
- `launch_form_validation_failed` with field name/error code, never field value
- `launch_lead_submitted` with opaque lead receipt/cohort/source IDs
- `beta_invite_issued` server-side only
- `beta_invite_claimed` server-side only
- `beta_membership_granted` server-side only
- `beta_provider_ready` server-side only
- `beta_match_attempted`
- `beta_booking_confirmed`
- `beta_service_completed`
- `beta_support_case_opened`
- `beta_incident_opened` with severity/category but no narrative or PII

Forbidden analytics properties:

- Phone, email, name, free-text need/skills, exact address.
- Raw invite token.
- Government ID or document URL.
- Admin notes or rejection reason narrative.
- Supabase JWT/auth metadata.

## Gate Criteria

### G0 — Contract Frozen

- `00` is accepted as implementation truth.
- Priority-configuration and commune owner is named.
- Lead retention and privacy-request owner is named.
- Metric dictionary and demo/test exclusion are implemented in the reporting design.

### G1 — Campaign Live

- Both lead forms pass contract, accessibility, mobile, abuse, and privacy tests.
- Both forms show the complete active KAYOU taxonomy with no synthetic umbrella and accept valid leads from priority and non-priority categories.
- Production storage receives leads without creating auth or marketplace records.
- Attribution survives allowed campaign URLs without storing arbitrary unsafe input.
- Dashboard/report distinguishes provider vs client leads and campaign source.
- Operators can export the minimum working queue without exposing it broadly.
- Concise French copy and both lead paths are validated with target users on phones.
- Mobile form completion, completion time, lead quality, and source attribution are measurable.
- The first acquisition experiment has a named owner, channel/link, audience/message, time/spend cap, and review date.
- Provider and client-demand forms are both live from G1; no provider threshold can hide, delay, or disable client-demand collection.

### G2 — Cohort Ready

Use the numeric thresholds in `00`. In addition:

- All-category demand plus priority service-group/commune density gaps are visible.
- Qualification decisions have reason codes and audit history.
- Operators have attempted contact for leads counted as qualified/eligible.
- No qualified/eligible count includes seed, demo, staff, or duplicate leads.
- Invitation issuance remains disabled.

### G3 — Closed Beta Open

- Product, operations, privacy, release, and incident owners sign the gate record.
- `06` production checks pass against the release candidate.
- `07` support and incident rehearsal passes.
- The authoritative phase is changed through an auditable operator action.
- Only after the recorded phase change may approved provider account invitations be issued.
- Client-demand collection continues, but client marketplace invitations remain disabled until G4.

### G4 — Client Matching Enabled

- The reproducible G4 count is at least 200 unique verified and available providers in the configured home-services priority.
- Each counted provider satisfies the full definition in the metric dictionary; demo/test/staff/duplicate/unverified/unavailable/paused/revoked/non-priority providers are excluded.
- Priority-group and pilot-commune distribution is visible and the launch owner records any coverage risk.
- Activated providers completed required account-stage data and marketplace verification.
- Search/discovery shows only real, ready providers.
- No fake/seed provider is visible in the beta environment.
- A staff end-to-end cash-first booking smoke passes.

### G5 — Cohort Review

Initial diagnostic targets after at least 20 real match attempts:

- At least 60% (12/20) successful matches within 24 hours.
- At least 10 confirmed bookings.
- At least 5 completed services.
- Median support first response at most 4 business hours.
- Zero unresolved severity-1 incident.
- Provider-initiated cancellation/no-show below 20%, reported with numerator.

Missing a diagnostic target leads to a hold/improvement decision, not an automatic failure or public launch.

## Reporting Views

Minimum operator views:

1. Campaign acquisition by date, role, source, every active category, and priority/non-priority segment.
2. Provider qualification funnel and review aging.
3. Client demand by category, commune, urgency, and cohort.
4. Invitation delivery/expiry/claim without raw token display.
5. Provider readiness by category and commune.
   The view must show the G4 count against `200` plus exclusions and distribution across priority groups.
6. Closed-beta matching, bookings, completion, cancellation, and support.
7. Incident count by severity/status.
8. Privacy withdrawals/deletions and retention queue.

For the first phase, admin tables plus a documented CSV/report query are acceptable. A separate analytics warehouse is not required.

## Ownership

- Metric definitions and shared enums: analytics/contract owner.
- Production queries and exclusions: backend owner.
- Browser instrumentation: campaign web owner.
- Qualification timestamps/reasons: admin workflow owner.
- Booking metrics: existing marketplace/backend owner.
- Gate record and decision: launch operator.

## Acceptance Criteria

- Each metric has a single source, inclusion rule, exclusion rule, and time basis.
- Campaign lead counts do not imply registered users.
- Qualified leads do not imply activated or verified providers.
- All active categories remain visible/lead-capable while priority service groups are separately identifiable.
- Priority G2/G3/G4 reports use only the exact reviewed ID mapping above; non-priority leads remain in all-category reporting.
- The G4 provider count is reproducible, deduplicated, and cannot include a lead without a real account or a provider who is unverified/unavailable.
- Public provider/client-demand campaign launch remains independent of the 200-provider G4 target.
- Stage-gate report can be reproduced from production data.
- Test/demo/staff data is explicitly tagged and excluded.
- Event payload tests prove no direct PII or raw token reaches analytics.
- Small-cohort rates always display counts.
- Gate configuration changes are logged and reviewed.
