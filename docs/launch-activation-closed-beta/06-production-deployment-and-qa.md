# 06 — Production, Deployment, And QA Readiness

## Outcome

Make campaign intake and closed-beta activation safe to operate on the existing Render/Next.js/NestJS/Postgres/Supabase stack, with tested migrations, access controls, observability, backups, rollout, and rollback.

Start from [`../DEPLOYMENT.md`](../DEPLOYMENT.md), `render.yaml`, and `.github/workflows/`; do not replace the existing runbook with a second deployment truth.

## Current Baseline To Preserve

- Render Blueprint with separate dev/prod Postgres.
- CI-gated dev and tagged production deploys.
- Forward-only Prisma migrations.
- Backend `/api/health`.
- Production seed guard.
- Shared Supabase project and environment-prefixed storage as currently documented.
- Feature-flagged quote/job-request surfaces remain disabled.

## New Required Controls

### Phase and access control

- Add authoritative server phase: `CAMPAIGN` or `CLOSED_BETA`.
- Separate public lead-intake enable/disable control.
- Separate invitation issuance pause and beta matching pause.
- Enforce beta membership in the backend.
- Never depend on `NEXT_PUBLIC_*` values for authorization.
- Record phase/mode changes and operator identity.

### Public endpoint protection

- Focused IP/contact rate limits for lead intake and invite claim.
- Body-size/free-text limits, honeypot, validation, and safe error responses.
- CORS and origin review for production campaign URL.
- No request-body logging.
- Alert on abuse/error spikes.

### Database

- Forward-only migrations for leads, audits, invites, and memberships.
- Index normalized contact, status/age, category/commune, invite digest/expiry, and membership user/status.
- Uniqueness and foreign keys enforce one activation path.
- Migration tested against an empty DB and representative existing schema/data.
- Backward-compatible deploy order: schema/backend before web depends on it.
- Rollback uses corrective migration; never edit an applied migration.

### Auth environment decision

The existing topology shares Supabase Auth between dev and prod. Before the first real beta invitation, the release owner must do one of:

1. Provision separate production Supabase Auth/storage and update deployment documentation, or
2. Record explicit risk acceptance with controls proving dev cannot invite, activate, expose, overwrite, or message production beta participants and that demo-user seeding remains disabled.

Separate production auth is recommended for real participant data. This decision does not block campaign lead collection because campaign leads do not use Supabase Auth.

### Backup and recovery

- Confirm production Postgres backup/restore capability and retention with the actual Render plan.
- Perform and record a restore rehearsal before G3.
- Document recovery point/time expectations.
- Exporting PII to ad hoc local files is not the backup strategy.
- Add retention/anonymization job/runbook for expired lead data and revoked invites.

### Observability

Monitor without PII:

- Lead endpoint success/error/rate-limit counts.
- Queue age and database health.
- Invitation created/claimed/expired/revoked counts.
- Claim failure categories without tokens/contact.
- Membership authorization denials.
- Provider-ready and booking funnel events.
- Support/incident counts and unresolved severity.

Define named dashboards/queries and alert destinations. Do not ship raw contact or free text to logs/error trackers.

## Release Configuration

Expected configuration concepts; exact names are owned by implementation:

- `LAUNCH_PHASE=CAMPAIGN|CLOSED_BETA` (server-side).
- `LEAD_INTAKE_ENABLED=true|false`.
- `BETA_INVITES_ENABLED=true|false` (must still require `CLOSED_BETA`).
- `BETA_MATCHING_ENABLED=true|false` (must still require active membership/readiness).
- Current privacy/terms version.
- Invite expiry.
- Rate-limit thresholds.
- Allowed pilot communes/focus taxonomy through reviewed config/data.

Set safe defaults: campaign phase, invitation disabled, matching disabled.

## QA Matrix

### Campaign

- Provider/client new and duplicate submissions.
- No auth/user/provider side effects.
- Validation, consent, privacy, attribution, spam, and rate-limit paths.
- Marketplace routes do not expose fake/seed supply.
- Intake kill switch preserves clear participant response.

### Admin qualification

- Admin role and PII controls.
- Valid/invalid transitions, concurrency, audit, export.
- No qualification-to-account side effect.

### Activation

- Every phase/status/token/contact/account conflict path in `04`.
- No Supabase user before the participant initiates real OTP auth.
- Atomic claim and retry behavior.
- Membership enforcement across API, web SSR, and client navigation.

### Marketplace beta

- Real provider onboarding and verification.
- Real provider discovery; no seed/test provider.
- Client contact/chat/direct booking/final agreement/completion/review.
- Cash disclaimer.
- Deferred feature guards.
- Pause/revoke access behavior.

### Non-functional

- 320–430px mobile web, common low/mid-range Android browser, tablet, and desktop.
- Campaign Core Web Vitals and 90-second completion target from `02`, measured before scaling paid acquisition.
- Slow network and retry.
- Keyboard/focus/screen-reader labels and contrast.
- Load appropriate to campaign expectations with burst testing on public submit.
- Security review of IDOR, enumeration, token handling, role escalation, open redirect, and log leakage.

## Required Commands

Agents must update this list if scripts change:

```sh
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend test
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm type-check
```

Also run migration deploy against an empty disposable DB and a representative upgraded DB. Do not run destructive seed/reset commands against production.

## Rollout

1. Deploy schema/backend with phase `CAMPAIGN`, invites/matching disabled.
2. Deploy campaign web and admin queue.
3. Submit marked production smoke leads; verify no auth/marketplace side effects; remove/anonymize smoke records.
4. Open public intake gradually and monitor.
5. Qualify real leads.
6. Deploy dormant activation/membership code with issuance disabled.
7. Complete backup restore, security, privacy, support, and end-to-end rehearsals.
8. Record G3 decision and set `CLOSED_BETA`.
9. Enable invitation issuance; invite providers first.
10. Continue bounded provider activation waves until the reproducible G4 count reaches 200 verified and available home-priority providers.
11. After G4, enable matching and invite the first client cohort.

## Rollback And Pause

Operators must be able to:

- Disable lead intake while leaving the landing page informative.
- Disable new invites without invalidating already activated accounts.
- Revoke an unclaimed invite.
- Pause a beta membership.
- Disable matching/booking initiation while retaining support/history access.
- Revert web/backend release independently where schema compatibility permits.
- Apply a corrective forward migration.

Rollback must not delete lead/audit/account history or re-enable fake marketplace content.

## Acceptance Criteria

- CI and all focused tests pass.
- Production migration/rollback plan is rehearsed.
- Public endpoints have tested abuse controls.
- Server-side phase and membership authorization are verified.
- Safe defaults make premature invite/account creation impossible.
- Production backup restore is demonstrated.
- Auth environment decision is recorded before first invite.
- Logs, analytics, monitoring, and fixtures contain no raw lead PII or invite tokens.
- Campaign deploy proves no account side effects.
- Full real-account beta smoke passes only after `CLOSED_BETA`.
- Client-demand intake remains live from G1; client marketplace invitations and matching remain disabled until the reviewed G4 query counts at least 200 eligible home-priority providers.
- Operator can pause intake, invitations, matching, and membership safely.
