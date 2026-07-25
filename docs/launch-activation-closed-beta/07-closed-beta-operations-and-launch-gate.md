# 07 — Closed-Beta Operations, Support, And Launch Gate

## Outcome

Operate the first real Kinshasa cohorts safely, support participants, respond to incidents, and make explicit go/hold/stop decisions without drifting into a broad public launch.

## Roles Required Before G3

Name one person for each role; one person may cover several roles for a small beta:

- Launch decision owner.
- Provider qualification/activation owner.
- Client cohort owner.
- Support duty owner and backup.
- Safety/incident owner.
- Release/rollback owner.
- Privacy request/retention owner.
- Metrics/readout owner.

Record names or team aliases in a private operational system; `PROGRESS.md` may record role ownership without unnecessary personal contact details.

## G3 — Open Closed Beta

Required evidence:

- G2 numeric lead thresholds pass.
- Campaign forms and queues are stable.
- Provider and client invitation paths exist in code but remain disabled; G3 enables only approved provider invitations, while client invitations wait for G4.
- Public provider and client-demand lead collection is already live and does not depend on either invitation path.
- Production/security/privacy/backup/rollback checks from `06` pass.
- Support and incident rehearsal passes.
- Participant beta terms, privacy notice, code of conduct, and cash disclaimer are current.
- Auth environment risk decision is recorded.
- No unresolved P0/P1 release defect or severity-1 incident.
- Release owner confirms seed/demo providers cannot appear.

Decision record:

- Timestamp.
- Approvers/owners.
- Evidence links/query timestamps.
- Known risks.
- `GO`, `HOLD`, or `STOP`.
- If `GO`, the exact phase change and which controls remain disabled.

After `GO`, set `CLOSED_BETA`. This permits invitations; it does not automatically enable matching.

## Supply-First Activation

1. Invite a small provider wave from `QUALIFIED`.
2. Help providers create their own real account and complete new authenticated onboarding data.
3. Complete marketplace verification and availability checks.
4. Validate real discovery/profile/contact behavior.
5. Measure category/commune coverage.
6. Repeat home-priority provider waves until the reproducible G4 count reaches at least 200.

All active categories remain visible in provider/client campaign lead capture. Provider operations prioritize the configured home-related subcategories; non-priority leads remain valid records and do not count toward the initial 200-provider gate.

No provider is made visible merely because the campaign lead was qualified or the invite was claimed.

## G4 — Enable Client Matching

Required:

- At least 200 unique activated, verified, available, otherwise beta-ready providers in the configured home-services priority, counted under `01`.
- Demo/test/staff/duplicate/unverified/unavailable/paused/revoked/non-priority providers are excluded.
- Distribution across priority groups and pilot communes is reviewed so the aggregate does not conceal an operational gap.
- At least one staff/test end-to-end direct booking completed in the beta environment without seed providers.
- Support is staffed for cohort hours.
- Matching and invitation pause controls tested.
- Each visible provider has current availability and support contact instructions.
- Client cohort of at most 20 selected against actual coverage.

Then:

- Enable matching for entitled beta users.
- Issue client invitations in a bounded wave.
- Confirm activation/contact rather than sending the entire list at once.

## Participant Operations

### Provider check-in

- Activation/onboarding help.
- Availability confirmation.
- Reminder of response expectations and cash-first terms.
- Clear report/block/cancel/support route.
- Weekly short feedback during active cohort.

### Client check-in

- Explain limited provider coverage.
- Encourage in-app record of agreed terms.
- Reinforce that cash is handled directly.
- Confirm support route and safety guidance.
- Ask for feedback after match/completion.

### Manual operations are acceptable

For the first cohort, a documented admin queue and support log are preferable to premature automation. Manual actions must still be access-controlled and auditable.

## Support Contract

Channels may be chosen operationally; document:

- Supported hours and timezone (`Africa/Kinshasa`, UTC+1).
- Primary channel and backup.
- First-response target: at most 4 business hours.
- Ownership transfer/escalation method.
- Link from authenticated beta surfaces.
- What support can pause, revoke, or correct.

Do not promise 24/7 support unless it is staffed.

## Incident Severity

### Severity 1 — immediate stop/containment

- Credible threat to personal safety.
- Account takeover or identity misbinding.
- Exposure of lead/auth PII or invite tokens.
- Unauthorized broad marketplace access.
- Payment/escrow claim materially misleads participants.
- Destructive production data issue.

Actions: pause invitations and matching, assign incident owner, preserve evidence securely, contact affected participants where appropriate, and require explicit restart approval.

### Severity 2 — cohort hold

- Repeated provider no-show/fraud concern.
- Major booking/contact failure for multiple participants.
- Support backlog beyond capacity.
- Category coverage collapses.
- Activation failure affects a meaningful part of cohort.

Actions: stop next cohort/invite wave, mitigate, verify, then make a hold/resume decision.

### Severity 3 — normal defect

- Isolated UI/copy issue or recoverable workflow friction without safety/data impact.

Track and prioritize; does not automatically stop the beta.

Incident narratives and evidence belong in a permissioned incident system, not analytics or public repo docs.

## Daily And Weekly Cadence

During an active cohort:

Daily:

- New activations and readiness.
- Unanswered match attempts.
- Booking/cancellation issues.
- Open support and incidents.
- Provider availability changes.

Weekly:

- Funnel counts with denominators.
- Category/commune supply-demand gaps.
- Provider/client qualitative themes.
- Support response time.
- Decision on next provider/client wave.
- Product defects and contract changes.

## Stop/Hold Conditions

Immediate stop:

- Any unresolved severity-1 incident.
- Auth/lead/account mislinking.
- Beta access bypass.
- Raw PII/token leakage.
- Inability to pause matching or contact participants.

Hold new cohorts:

- Support first response exceeds one business day.
- More than 20% provider no-show/cancellation over at least 10 scheduled/confirmed jobs.
- The counted home-priority supply falls below 200 after matching opened; hold new client cohorts and review coverage before resuming expansion.
- Repeated match failure below 40% over at least 20 attempts.
- Production reliability makes participant follow-up unreliable.

Small samples require judgment and raw counts; a single event should be investigated without pretending it proves a stable rate.

## G5 — Cohort Review

Use the targets in `01`, plus:

- What participants tried to do.
- Where activation or matching failed.
- Which categories/communes have real density.
- Provider quality/availability themes.
- Client trust/safety concerns.
- Support load and recurring issues.
- Product changes required before another cohort.
- Data-retention/privacy tasks due.

Allowed decisions:

- Continue same-size closed beta.
- Expand one bounded category/commune/cohort.
- Hold and fix.
- Stop and safely wind down.

Not allowed as an automatic outcome:

- Broad public launch.
- Online payment/mobile money/payout/escrow work.
- Quote marketplace.

Those require a new product contract and plan.

## Acceptance Criteria

- All owners, support hours, escalation, and pause controls are documented.
- G3 occurs before any provider account invitation is issued.
- Provider activation precedes client matching.
- G4 reaches 200 counted providers before the first client cohort is invited for marketplace use.
- Client-demand collection was available from G1 and was never delayed by the G4 provider threshold.
- Every participant is traceable to an approved lead and claimed invite.
- No seed/fake provider appears.
- Support and incident response are exercised before real cohort activity.
- Stop/hold actions work without deleting history.
- Weekly readout includes counts, qualitative evidence, incidents, and decisions.
- G5 produces a bounded next-step decision, never an implicit public launch.
