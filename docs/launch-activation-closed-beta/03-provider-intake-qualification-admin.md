# 03 — Provider Intake, Qualification, And Admin Workflow

## Outcome

Give a small authorized operations team a reliable queue to contact, assess, qualify, pause, reject, and later invite provider leads without creating premature accounts.

## Ownership

This workstream owns:

- Provider lead list/detail/admin API.
- Qualification rubric and status transitions.
- Assignment, contact attempts, decision codes, private notes, and audit events.
- Cohort/category/commune coverage views.

It does not own:

- Public provider form schema (`02`).
- Invitation claim or auth (`04`).
- Marketplace onboarding/verification internals except the documented handoff.
- Client waitlist (`05`).

## Admin Workflow

1. Lead arrives as `SUBMITTED`.
2. Operator claims/assigns it and moves it to `IN_REVIEW`.
3. Operator attempts contact and records outcome without putting full conversation content in logs.
4. Operator checks the campaign-stage rubric.
5. Missing information moves the lead to `NEEDS_INFO`.
6. Suitable leads move to `QUALIFIED`.
7. Unsuitable leads move to `REJECTED` with a controlled reason code.
8. A withdrawal request moves the lead to `WITHDRAWN` and triggers the privacy workflow.
9. `QUALIFIED` leads remain lead-only while the phase is `CAMPAIGN`.
10. Only in `CLOSED_BETA` may an authorized operator issue an invitation, which moves the lead to `INVITED`.

No admin action in this workflow creates a Supabase user, local user, or provider profile.

## Campaign-Stage Qualification Rubric

Required for `QUALIFIED`:

- Contact successfully confirmed by phone/WhatsApp.
- First name and offered service confirmed; last name may be collected during qualification or authenticated onboarding if needed.
- Primary service maps to an active KAYOU taxonomy record.
- Home-services priority group is derived from the reviewed mapping; a non-priority active service is not rejected solely for being non-priority.
- Service area overlaps the selected pilot communes.
- Experience band and example work can be described plausibly.
- Availability for the intended cohort confirmed.
- Smartphone/contact capability is sufficient for the beta flow.
- Provider understands cash payment is direct with the client.
- Provider accepts code of conduct, support escalation, and beta feedback expectations.
- Provider agrees to complete account-stage onboarding and identity/profile requirements after invitation.

Useful but not campaign-blocking:

- Portfolio assets.
- Certification documents.
- Exact working schedule.
- Full public description.
- Exact starting price.
- Government ID.

Those should be collected through authenticated onboarding/verification after a post-beta invitation, not through the public campaign form or admin notes.

## Decision Codes

Use stable codes rather than free text for reporting:

Qualified examples:

- `FOCUS_CATEGORY_FIT`
- `PILOT_AREA_FIT`
- `COHORT_AVAILABILITY_CONFIRMED`

Needs-info examples:

- `CONTACT_UNREACHABLE`
- `SERVICE_UNCLEAR`
- `AREA_UNCLEAR`
- `AVAILABILITY_UNCLEAR`

Rejected examples:

- `OUTSIDE_PILOT_SCOPE`
- `UNSUPPORTED_SERVICE`
- `DUPLICATE_OR_FRAUD_RISK`
- `CONDUCT_OR_SAFETY_CONCERN`
- `DOES_NOT_WANT_BETA_TERMS`

Participant communication should not echo fraud/safety internals. Free-text private notes are optional, length-limited, access-controlled, and never returned in list endpoints.

## Admin API And UI

Suggested admin API:

- `GET /api/admin/launch/provider-leads`
- `GET /api/admin/launch/provider-leads/:id`
- `PUT /api/admin/launch/provider-leads/:id/assignment`
- `POST /api/admin/launch/provider-leads/:id/contact-attempts`
- `POST /api/admin/launch/provider-leads/:id/transitions`
- `GET /api/admin/launch/provider-coverage`

Invitation issuance belongs to `04` even if surfaced from the same detail page.

Minimum list columns:

- Submitted date/age.
- Name with contact masked by default.
- Primary category.
- Home/service communes.
- Status.
- Assigned operator.
- Last contact/result.
- Campaign source.

Minimum filters:

- Status, age, assignee, category, home-priority group/flag, commune, source, unreviewed, uncontacted.

Minimum detail:

- Participant-submitted fields.
- Consent/notice version.
- Contact-attempt history.
- State-transition history.
- Controlled decision action.
- Private notes with clear warning.
- Post-beta invitation/activation state read-only until `04` is available.

Build inside the existing admin domain and role guards. Do not create a parallel unauthenticated admin tool.

## Concurrency And Audit

- Every mutation requires admin actor identity.
- Append an audit event containing lead ID, action, from/to state, reason code, actor ID, and timestamp.
- Use optimistic concurrency (`updatedAt`/version) so two operators cannot silently overwrite status or assignment.
- Reject invalid transitions server-side.
- Mask PII in list views and reveal only on a permissioned detail action if practical.
- Export is permissioned, scoped, timestamped, and excludes private notes by default.
- Audit events must not contain raw phone, email, free-text summary, or full notes.

## Handoff To Activation

`QUALIFIED` is the only provider status eligible for invitation.

Before invitation issuance:

- Authoritative phase is `CLOSED_BETA`.
- Lead is not withdrawn/rejected/already activated.
- Contact has been confirmed.
- Required consent is current or renewal is included in invite claim.
- Cohort and expiry are selected.

The lead remains the qualification record. Real account data is created only by the provider accepting the invitation through `04`.

## Tests

- Roles/guards deny non-admin access.
- Valid and invalid status transition matrix.
- `INVITED` transition denied in `CAMPAIGN`.
- Qualification requires rubric fields and reason code.
- Contact/assignment/audit history.
- Optimistic concurrency conflict.
- PII masking and export scope.
- No admin qualification action creates auth/user/provider records.
- Coverage report excludes demo/test/duplicate/rejected/withdrawn leads.

## Acceptance Criteria

- Operators can work the queue without Prisma Studio or direct database writes.
- Every status change has actor, timestamp, prior/new state, and reason.
- Qualified provider counts are reproducible across every category and separately by home-priority group and commune.
- Queue ordering can prioritize home-related services without hiding, rejecting, or deleting other active-category leads.
- Sensitive details are not present in list payloads, logs, or analytics.
- Campaign-stage qualification collects no government ID/payment data.
- `QUALIFIED` remains a lead-only state.
- Invitation controls are disabled and backend-denied before `CLOSED_BETA`.
- No qualification path creates an account or makes a provider discoverable.
