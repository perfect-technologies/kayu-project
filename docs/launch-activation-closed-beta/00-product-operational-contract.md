# 00 — Product And Operational Contract

## Goal

Freeze the truth for “Launch Activation & Closed Beta” before product code changes begin.

KAYOU is not ready to present seeded or empty supply as a real public marketplace. This phase first proves real Kinshasa supply and demand through lead capture and human qualification, then opens a controlled closed beta.

## Binding Phase Truth

1. The campaign landing page describes the upcoming Kinshasa beta honestly.
2. A campaign submission is a lead, not a registration.
3. Campaign submission creates no Supabase Auth user, local `User`, `Provider`, session, role, entitlement, or marketplace account.
4. Campaign leads cannot sign in, browse a supposedly live marketplace, receive bookings, or appear in provider discovery.
5. Provider and client leads are stored separately from marketplace users.
6. Provider qualification is a human/admin decision with an audit trail.
7. Qualification alone does not create an account and does not send an invitation.
8. An authorized operator must explicitly change the server-side phase from `CAMPAIGN` to `CLOSED_BETA`.
9. Only after that phase change may approved leads receive an invitation to create their real account.
10. Account creation is initiated by the invited person through the real auth flow; no bulk or background account creation is allowed.
11. Newly required profile, identity, service, and consent information may be completed during activation/onboarding rather than collected on the campaign form.
12. Closed-beta access is allowlisted and enforced by the backend, not just hidden in web navigation.
13. Activated providers must complete the required marketplace onboarding and verification before client matching is enabled.
14. The underlying marketplace remains cash-first and follows the existing V1 direct-service contract.
15. The end of this phase is an evidence-based closed-beta review, not an automatic broad public launch.
16. The campaign is French-first for the Kinshasa target market.
17. The landing experience is designed phone-first, remains fully responsive, and treats fast loading on variable mobile networks as a conversion requirement.
18. Provider/client paths and lead forms are exceptionally short and low-friction; richer information is progressively collected later.
19. Acquisition decisions optimize completed, valid, contactable, qualified/eligible leads by source rather than clicks or raw submissions.
20. The campaign shows all active existing KAYOU categories and may collect provider supply or client demand for every category.
21. Do not introduce or present a new public umbrella category for home services and do not hide non-priority categories.
22. Existing home-related categories/subcategories are the first operational priority for recruitment, qualification, invitations, provider-density gates, and early matching.
23. Operational priority does not change the public taxonomy and is not a reason to reject or discard a valid non-priority lead.
24. Provider and “I need a service” client-demand lead forms launch together at G1 and remain available while supply is built.
25. Client marketplace invitations and active client-to-provider matching remain disabled until at least 200 real providers in the configured home-services priority are activated, verified, available, and otherwise marketplace-ready.
26. The 200-provider target is a G4 client-invitation/matching gate, not a requirement for launching the public campaign or collecting client demand.

## Initial Operational Wedge

The priority is expressed as a configuration over existing taxonomy records, not as a public category:

- `Bâtiment & Construction`: all current subcategories.
- `Plomberie & Sanitaire`: all current subcategories.
- `Électricité`: `Électricité générale` and `Climatisation`.
- `Menuiserie & Ébénisterie`: all current subcategories.
- `Métallerie & Serrurerie`: all current subcategories.
- `Maison & Entretien`: `Nettoyage` and `Jardinage`.

`Électricité automobile` and `Déménagement` remain visible in the campaign and may collect leads/demand, but they do not count toward the initial home-services density gates. All other active KAYOU categories likewise remain visible and lead-capable but are not the first operational cohort priority.

The priority affects:

- Acquisition/outreach allocation.
- Queue ordering and first-review staffing.
- Qualification and invitation sequencing.
- Provider-density reporting.
- First closed-beta matching cohorts.

It does not affect:

- Whether an active category is shown.
- Whether a valid provider/client lead may submit.
- The underlying KAYOU taxonomy.
- Data-retention, consent, or lead-only rules.

Do not create duplicate category rows or infer priority through fuzzy text matching. Adding/removing a priority category or subcategory requires a dated product-contract decision.

## Authoritative Phase

The implementation must have one server-owned phase value:

- `CAMPAIGN`: public lead intake is allowed; invitation issuance, invitation claim, and beta membership creation are forbidden.
- `CLOSED_BETA`: lead intake may remain open; authorized operators may invite approved leads; valid invitees may create/claim accounts and receive beta access.

The phase must be checked on the backend for every invitation issuance, claim, and beta-restricted marketplace operation. A `NEXT_PUBLIC_*` flag may control presentation but is never the security boundary.

Changing the phase is a production operation that records who changed it, when, the prior value, the new value, and a gate-review reference.

## Lead Lifecycles

### Provider Lead

Allowed states:

```text
SUBMITTED
  -> IN_REVIEW
  -> NEEDS_INFO -> IN_REVIEW
  -> QUALIFIED
  -> REJECTED
  -> WITHDRAWN

QUALIFIED -- only in CLOSED_BETA --> INVITED
INVITED -> ACTIVATED
INVITED -> QUALIFIED  (expired/revoked invite; remains approved)
```

Rules:

- Public clients can create a submission or append a review-only re-submission event but cannot set status. Refreshing participant-owned fields requires a separately verified contact-control capability; anonymous knowledge of the phone number is insufficient.
- `QUALIFIED` means operationally suitable for the planned cohort; it is not marketplace verification.
- `INVITED` is forbidden while the phase is `CAMPAIGN`.
- `ACTIVATED` means a real account was created or safely claimed and linked to the lead. It does not by itself mean the provider is visible or ready to take work.
- Marketplace readiness remains represented by the existing provider onboarding and verification state.
- Rejection reason codes are admin-only. Participant-facing communication must be respectful and must not expose internal notes.

### Client Lead

Allowed states:

```text
SUBMITTED
  -> ELIGIBLE
  -> PAUSED
  -> DECLINED
  -> WITHDRAWN

ELIGIBLE -- only after CLOSED_BETA and G4 --> INVITED
INVITED -> ACTIVATED
INVITED -> ELIGIBLE  (expired/revoked invite)
```

`ELIGIBLE` means the client fits the current geography/category/cohort. It does not create access.

## Separation Between Lead And Marketplace Data

Campaign lead records may include:

- Contact details needed for follow-up.
- Coarse location such as commune.
- Requested/offered service categories.
- Timing, experience, availability, language, and acquisition attribution.
- Consent and privacy-notice versions.
- Qualification state and operational notes.

The public form collects only the minimum first-contact/triage subset defined in `02`. Operations or authenticated onboarding may add the rest later.

Campaign lead records must not include:

- Supabase Auth identifiers.
- Passwords, OTPs, sessions, or authentication secrets.
- Marketplace `User` or `Provider` rows.
- Government identity images or document numbers.
- Payment or mobile-money details.
- Bank or payout details.
- Exact residential address unless clearly necessary later and collected through authenticated onboarding.
- Public provider profile visibility.

After a valid post-beta invitation claim, a lead may reference the resulting local user ID and activation timestamp for audit/deduplication. Auth remains owned by Supabase; the lead table is not an identity provider.

## Provider Qualification Contract

Campaign-stage qualification establishes:

- The person can be contacted and consents to beta follow-up.
- They operate in selected Kinshasa service areas.
- Their claimed service and experience are plausible through an operator conversation.
- Their availability fits the intended cohort.
- They understand cash payment, platform conduct, and closed-beta expectations.
- They are willing to complete formal identity/profile requirements after invitation.

Campaign-stage qualification does not establish:

- Government-identity verification.
- Certification verification.
- A visible “verified” badge.
- Marketplace account ownership.
- Guaranteed work or earnings.

Formal marketplace verification occurs after invited account creation using the existing provider onboarding/verification domain, extended only where this phase requires it.

## Client Demand Contract

The client waitlist measures real demand and prepares cohorts. It must:

- Ask what service is needed, where, and roughly when.
- Avoid promising an immediately available provider.
- Avoid collecting payment or exact job-site details publicly.
- State that KAYOU will contact selected participants if a suitable closed-beta cohort opens.
- Require renewed/current terms acceptance during real account activation if policies changed.

## Closed-Beta Access Contract

- Access is explicit, revocable, and traceable to an approved invite.
- A valid Supabase session alone is insufficient; the backend also checks beta membership/entitlement.
- Existing demo accounts and seeded providers never count toward readiness metrics.
- Existing non-invited real accounts do not gain beta access accidentally.
- A provider is discoverable only after activation, required onboarding, verification approval, availability confirmation, and beta entitlement.
- Clients enter in bounded cohorts after usable provider coverage exists.
- Operators can pause new invitations, matching, or all beta activity without deleting lead or marketplace records.

## Marketplace Contract During Beta

The V1 contract remains authoritative:

- Direct provider discovery and contact.
- Direct booking.
- Provider-issued final agreement.
- Fixed starting-from pricing.
- Cash paid directly between client and provider.
- Reviews after completed work.

The following remain absent:

- Online payment.
- Mobile money.
- Escrow or payment guarantee.
- Payout automation.
- Complex invoices.
- Quote marketplace or public job marketplace.
- Broad public signup and launch.

## Initial Numeric Gates

These are operating defaults, not forecasts. Changes require a dated entry in [`PROGRESS.md`](./PROGRESS.md).

Before opening the closed beta (G3):

- At least 25 priority home-services provider leads are `QUALIFIED`.
- Each of the 6 configured priority service groups has at least 4 qualified provider leads.
- At least 60 client leads are `ELIGIBLE` across the campaign, including at least 8 in each priority service group.
- At least 90% of qualified/eligible leads have valid contact, commune, consent timestamp, and acquisition source.
- Median provider lead first review is at most 2 business days over the last 20 reviewed leads.
- All P0 production, privacy, authorization, migration, rollback, and support checks pass.
- Zero unresolved severity-1 safety or security issue.

Before issuing client marketplace invitations or enabling client matching (G4):

- At least 200 unique providers in the configured home-services priority are marketplace-ready.
- Every counted provider has a real activated account created from an approved post-beta invitation.
- Every counted provider has completed required onboarding, has `VERIFIED` marketplace verification, is currently available, holds active beta entitlement, and serves at least one selected pilot commune.
- Seed, demo, staff, test, duplicate, paused, revoked, unavailable, unverified, and non-priority providers do not count.
- Coverage across the six priority service groups and pilot communes is reported so an aggregate total cannot hide a critical service-area gap.
- Every activated account traces to one approved lead and one valid post-beta invitation.
- Support coverage and incident owner are named for the active cohort.

Because cohorts are small, rate metrics must always show numerator, denominator, and observation window.

## Data Protection And Privacy

- Collect the minimum fields needed at each stage.
- Show the current privacy notice before submission and store `consentVersion`, `consentAt`, and source.
- Separate marketing permission from required operational contact consent.
- Default marketing permission to false; no pre-checked checkbox.
- Normalize phone numbers to E.164 server-side; do not expose whether a number already exists.
- Encrypt in transit and rely on managed database encryption at rest.
- Restrict raw lead access to authorized operations/admin roles.
- Redact phone/email from ordinary logs, analytics, error monitoring, screenshots, fixtures, and support exports.
- Store invite-token digests, never raw tokens.
- Record admin state changes without copying full PII into audit metadata.
- Provide lookup, correction, withdrawal, and deletion/anonymization procedures.
- Define retention before launch: default proposal is delete or anonymize rejected/withdrawn/unresponsive lead PII 90 days after final contact; re-consent active waitlist leads after 12 months.
- Do not use lead data to train models or sell/share lists.

## Acceptance Criteria

- Campaign submission can be demonstrated without any new Supabase Auth, `User`, or `Provider` record.
- The same is true for provider and client campaign paths.
- No invitation can be issued or claimed while the server phase is `CAMPAIGN`.
- Qualification state is admin-only, auditable, and does not grant access.
- After `CLOSED_BETA` opens, an approved lead can use a valid invitation to initiate real account creation and complete required information.
- Invalid, expired, revoked, reused, wrong-contact, and wrong-phase invitations fail safely.
- Existing-account conflicts never silently overwrite role or link the wrong person.
- Beta access is enforced by backend authorization.
- Demo/seed data is excluded from launch metrics.
- Participant-facing copy does not promise immediate access, work, provider availability, payment protection, or public launch.
- Participant-facing campaign copy is concise French, both role paths work smoothly on phones, and required fields are limited to first-contact/triage needs.
- Completed-lead conversion and downstream lead quality are measurable by attributed source without placing PII in analytics.
- Public provider/client campaign choices show every active KAYOU category and introduce no new home-services umbrella.
- Lead validation accepts active taxonomy records across all categories.
- Reporting distinguishes all-category intake from the configured home-services operational priority.
- `Électricité automobile`, `Déménagement`, and non-priority categories remain visible and lead-capable but do not count toward initial priority density gates.
- Provider and client-demand forms accept leads from G1/day one across all active categories.
- G4 client marketplace invitations and matching remain off below 200 counted home-priority providers; this threshold does not block G1 public campaign lead collection.
- All numeric gates use production data and explicit denominators.
- All phase non-goals remain hidden or disabled.

## Change Control

The following require a contract decision entry before implementation:

- Adding a lead status or transition.
- Creating any account before `CLOSED_BETA`.
- Expanding geography outside selected Kinshasa pilot areas.
- Adding/removing a category or subcategory from the home-services operational priority.
- Changing the required launch gates.
- Collecting identity, payment, exact-address, or other sensitive data on campaign forms.
- Allowing access based only on a public flag or Supabase session.
- Re-enabling a deliberate non-goal.
