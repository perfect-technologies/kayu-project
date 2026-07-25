# 04 — Approved Lead Activation And Auth Migration

## Outcome

After the closed beta is explicitly open, let an approved lead securely initiate real account creation, link that account to the lead, and complete required marketplace information.

This is not a campaign signup flow. Implement it early if useful, but keep issuance and claim hard-disabled until `CLOSED_BETA`.

## Preconditions

All are required:

- Authoritative server phase is `CLOSED_BETA`.
- Lead is `QUALIFIED` (provider) or `ELIGIBLE` (client).
- Invitation operator is authorized.
- Lead is not withdrawn, rejected, already activated, or bound to another live invitation.
- Closed-beta cohort and invite expiry are present.
- Production auth environment and data-isolation decision passed the `06` gate.

For a client lead, G4 must also have passed and the client-invitation control must be enabled. G3 permits approved provider invitations so supply can be built; it does not permit client marketplace invitations below the 200-provider gate.

## Invitation Contract

Suggested `LeadActivationInvite` fields:

- `id`, `leadType`, `providerLeadId?`, `clientLeadId?`.
- `tokenDigest` unique; raw token is never persisted.
- `expectedPhoneE164` or a digest/reference sufficient for server matching.
- `cohortKey`.
- `status`: `CREATED`, `DELIVERED`, `CLAIMED`, `EXPIRED`, `REVOKED`.
- `createdByAdminUserId`, `createdAt`, `deliveredAt`, `expiresAt`.
- `claimedAt`, `claimedByUserId`.
- `revokedAt`, `revokedByAdminUserId`, `revokeReasonCode`.
- `attemptCount`, `lastAttemptAt`.

Rules:

- Generate at least 128 bits of cryptographic randomness.
- Persist only a strong digest.
- Default expiry: 7 days.
- Single use.
- Reissuing revokes the prior unclaimed invite.
- Delivery may be manual phone/WhatsApp by operations; building an outbound messaging platform is not required.
- Admin UI never redisplays a raw token after the creation response.
- Raw tokens, links, and contact details never enter analytics or ordinary logs.

## Provider Activation Sequence

```text
operator opens beta and issues provider invite
-> provider opens invite
-> server validates phase, token, lead state, expiry, revocation
-> provider verifies the expected phone through Supabase OTP
-> existing identity sync creates or finds local User
-> server performs conflict checks
-> server atomically claims invite + links lead + grants beta membership
-> server sets/authorizes PROVIDER role through a dedicated invite claim path
-> provider completes newly required authenticated onboarding
-> provider completes marketplace verification
-> provider is marked beta-ready
-> discovery eligibility is enabled
```

Critical rule: do not call Supabase admin APIs to pre-create the person. The invited provider creates/verifies their auth identity as part of accepting the invitation.

The current identity path creates a local user on the first authenticated `/me` request and defaults the role to `CLIENT`. The implementation must therefore provide an invite-authorized, transactional role/provider handoff. It must not rely on a client-supplied `PROVIDER` field and must not weaken the existing general role-lock rules.

## Client Activation Sequence

```text
operator opens beta, G4 passes, and operator issues client invite
-> client opens invite
-> server validates phase/token/lead
-> client verifies expected phone through Supabase OTP
-> local User is created/found
-> conflicts checked
-> invite claimed + lead linked + client beta membership granted atomically
-> client completes required name/commune/current terms
-> client enters the designated cohort
```

## Beta Membership

A valid Supabase account is not sufficient for beta access.

Use an explicit server-side entitlement such as `BetaMembership`:

- `userId` unique.
- `role`/participant type.
- `cohortKey`.
- `status`: `ACTIVE`, `PAUSED`, `REVOKED`, `COMPLETED`.
- `sourceInviteId`, `grantedAt`, `grantedBy`.
- `pausedAt`/`revokedAt` plus reason.

Backend guards must check membership for beta-restricted discovery/contact/booking routes. Public lead intake remains separate.

## Account Conflict Policy

### New auth identity

- OTP verifies the invite’s expected phone.
- Create/sync local user normally.
- Claim atomically.

### Existing empty/default client identity

- If the same verified phone owns a local user with no role selection, provider profile, bookings, messages, reviews, favorites, job requests, or other role-locking activity, the invite-authorized path may set the approved role.
- Record the decision in audit history.

### Existing active client or provider identity

- Never silently change role or link.
- Return a safe support-required result.
- Operations investigates ownership and intended role.
- This phase does not introduce multi-role accounts.

### Different phone requested

- Do not let the browser replace expected contact and claim.
- Admin may rebind an unclaimed qualified lead to a new verified number through a separately audited action after re-contact.
- Rebinding revokes any prior invitation.

### Duplicate/competing claims

- Database uniqueness and a transaction ensure only one user/lead/invite relationship wins.
- Return a generic already-used/invalid response.

## Required Information Timing

Campaign form data is intentionally incomplete.

At provider account stage, require/confirm:

- Current name and phone.
- Marketplace role and beta terms.
- Profession and up to three service subcategories.
- Experience.
- Service zones/communes.
- Fixed starting-from price.
- Profile description.
- Availability.
- Identity/verification evidence and any required portfolio/profile material.

At client account stage, require/confirm:

- Current name and phone.
- Commune and current beta terms.
- Any job-specific address/details only inside an authenticated booking/contact flow.

Do not blindly copy stale lead values into a public profile. Pre-fill for convenience where safe, require confirmation, and keep lead/admin notes private.

## Atomicity And Idempotency

Claim must atomically:

- Lock/validate invite and lead.
- Link authenticated user to invite and lead.
- Apply invite-authorized role handling.
- Grant beta membership.
- Mark invite `CLAIMED`.
- Mark lead `ACTIVATED`.
- Append audit event.

Retries return the already-claimed success only to the same authenticated owner. Partial failures must not leave membership without a claimed invite or a lead activated without a user.

## Security And Privacy

- Validate phase and entitlement server-side.
- Require recent OTP-authenticated session for claim.
- Bind invite to expected contact.
- Rate-limit token validation and claim.
- Avoid distinct responses that reveal whether a phone/lead/account exists.
- Protect against open redirects in invite return paths.
- Clear invite token from browser URL/history after exchange.
- Do not expose qualification notes to the account.
- Require current beta terms/privacy acceptance at claim/onboarding.

## Tests

- Issuance and claim denied in `CAMPAIGN`.
- Client issuance/claim denied before G4 even when phase is `CLOSED_BETA`; provider issuance may proceed after G3.
- Only correct lead statuses can be invited.
- New provider happy path after G3 and client happy path after G4.
- No auth identity exists before participant initiates OTP.
- Wrong phone, wrong role, expired, revoked, reused, malformed, and brute-force attempts.
- Existing empty user allowed only under explicit rules.
- Existing active account conflict requires support.
- Transaction rollback and idempotent retry.
- Membership guard denies authenticated non-members.
- Provider not discoverable until onboarding/verification/readiness passes.
- Raw tokens and PII absent from logs/analytics.

## Acceptance Criteria

- No campaign or qualification action creates a real account.
- No invite is issued or claimed before the beta phase opens.
- Client-demand leads remain lead-only until G4; client marketplace invitation/claim is denied below the 200-provider gate.
- Approved participants initiate their own account creation through real auth.
- Every activated account traces to one approved lead and one claimed invitation.
- Role assignment is server-authorized by the invite and does not weaken normal role locks.
- Conflict cases cannot link the wrong person or overwrite an active role.
- Required new data is collected after account creation in authenticated onboarding.
- Account activation alone does not make a provider visible.
- Beta membership is explicit, revocable, and backend-enforced.
