# KAYOU Launch Activation & Closed Beta — Progress

## Status Summary

Created: 2026-07-25

Overall status: **Workstream 02 implementation integrated and verified locally; production activation remains gated**

The public campaign captures provider and “I need a service” client-demand leads together from day one, then operations qualify them and open a controlled beta. Campaign leads do not become Supabase Auth or marketplace accounts. Approved provider leads may be invited after G3; approved client leads may be invited for marketplace access only after G4.

## Workstream Status

| Workstream | Status | Owner | Dependencies / notes |
| --- | --- | --- | --- |
| 00 — Product And Operational Contract | Done | Planning | Binding phase truth documented |
| 01 — Launch Scope, Metrics, And Gates | Not started | TBD | All active categories visible; home-services operational priority mapping fixed; choose pilot communes |
| 02 — Campaign Conversion, Landing, And Lead Data | In review | Integration | Approved backend/data contract and public campaign UX are integrated and locally verified; production G1 evidence remains separate |
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

Status: **In review** (integrated backend/data contract and public campaign UX, locally verified)

Owner: Integration (backend/data contract + web public UX)

Date: 2026-07-25

Changed:

- Added `ProviderLead`, `ClientWaitlistLead`, privacy-safe `LeadSubmissionEvent` persistence, explicit created/review-required outcomes, and lifecycle/timing/contact enums in Prisma.
- Preserved the published checksum of `20260725120000_add_launch_leads`; added forward-only migrations for hardened lead records and funnel events, preserved orphaned taxonomy snapshots, and imported reviewed taxonomy preflight snapshots. The migration history is append-only and includes the capture/remediation runbooks needed before the supported upgrade path.
- Added strict shared Zod request/response contracts, lead lifecycle enums, controlled communes, bounded free text, explicit attribution source/medium allowlists, hostname-only referrers, and typed `launchLeadsApi` methods. `@kayu/utils` now exports the canonical plausible DRC mobile normalizer/validator used by backend intake and available to web.
- Added unauthenticated `POST /api/launch/provider-leads` and `POST /api/launch/client-leads` endpoints with the same generic response for new and duplicate submissions.
- Added unauthenticated `POST /api/launch/funnel-events` with a durable `CampaignFunnelEvent` row, strict allowlisted event/dimension/route/device/attribution DTO, event-time window, separate kill switch/rate bucket, and generic `{ accepted: true }` response. Unknown keys and PII/free-text/auth/session/cookie/account fields are rejected.
- Added active-taxonomy validation with no home-priority restriction, plausible RDC mobile-number validation, role-separated phone deduplication, consent/version timestamps, attribution/audit events, and form-duration buckets. The binding contract now explicitly defines anonymous duplicates as non-mutating review events; participant-field/consent refresh requires a future approved contact-control capability and phone knowledge or a browser cookie is insufficient.
- Made first-submission creation and created-vs-review analytics atomic with serializable transactions and bounded conflict retries. Campaign keys now encode fixed attribution field positions to prevent source/medium/campaign/content collisions.
- Added independent default-off lead/funnel kill switches, required privacy/hash configuration before enablement, body-size limits, honeypot handling, and separate lead-IP/contact/funnel-IP limits. Limiter keys use non-reversible HMAC buckets; an expiry min-heap removes only due entries without full-map scans, cardinality fails closed, and `429` responses include the remaining-window `Retry-After`.
- Integrated the public campaign UI described below. No auth/account creation, qualification/admin workflow, invitations, activation, payments, or beta operations were added.

Verified:

- `pnpm --filter @kayu/schemas type-check`
- `pnpm --filter @kayu/schemas build`
- `pnpm --filter @kayu/api type-check`
- `pnpm --filter @kayu/api build`
- `node --test packages/utils/test/phone.test.mjs` — 2/2 canonical phone normalization/plausibility tests passed; utils type-check/build and web consumer type-check passed.
- `pnpm --filter @kayu/backend test:launch` — 111/111 passed, including duplicate immutability/consent, heap-based limiter privacy/bounds/expiry/`Retry-After`, shared DRC phone consumption, strict funnel DTO/persistence, campaign-key collision, and taxonomy admin safety regressions.
- Focused launch-lead/config/admin unit suite — 51/51 passed.
- `LAUNCH_LEADS_TEST_DATABASE_URL=... pnpm --filter @kayu/backend test:launch-leads:ci` — mandatory CI mode 1/1 passed against disposable Postgres with two concurrent first submissions, atomic outcomes, restrictive taxonomy FK, durable funnel persistence, and zero `User`/`Provider` records. CI now provisions Postgres, deploys migrations, and fails instead of skipping when the database URL is absent.
- `pnpm --filter @kayu/backend type-check`
- `DATABASE_URL=postgresql://u:p@localhost:5432/db pnpm --filter @kayu/backend build`
- Final integration: `pnpm --filter @kayu/backend test:launch` — 112/112 passed, including protected migration checks and lead/funnel behavior.
- Final integration: fresh disposable Postgres applied all six migrations; the required serializable lead/funnel test passed and confirmed one lead/event with `User=0` and `Provider=0`.
- Final integration: the required orphan-snapshot supported-upgrade test passed, preserving historical snapshots and rejecting future invalid references.
- Final integration: real Nest HTTP submissions to provider-lead and funnel-event endpoints both returned accepted responses; the disposable database contained `ProviderLead=1`, `CampaignFunnelEvent=1`, `User=0`, and `Provider=0`.
- Production-like Nest smoke: the original and attacker duplicate both received the generic accepted response, while the duplicate left all lead fields and consent unchanged and recorded only a review-required event with marketing consent false. A third rate-limited request returned `429` with `Retry-After`; aggregate evidence was one lead, one created event, one safe duplicate event, `User=0`, and `Provider=0`.
- Funnel Nest smoke: an allowlisted event returned `201 { accepted: true }` and persisted one owned event; a payload containing `phone` returned `400`; the third same-IP event returned `429` with `Retry-After`; `User=0` and `Provider=0`.

Data/phase checks:

- Provider/client/funnel collection code depends only on Prisma lead/taxonomy/event models and configuration; it injects no identity, Supabase admin, session, user, provider, membership, invitation, or marketplace service.
- Public DTOs are strict and reject lifecycle state, admin notes, linked account IDs, unknown fields, unsafe attribution, PII funnel properties, inactive taxonomy IDs, and invalid communes.
- Every active category/subcategory remains available through the existing taxonomy interfaces; intake accepts any active subcategory, including non-priority categories.
- Lead and funnel collection default disabled. Lead intake requires the current privacy-notice version; either public collector requires a 32+ character hashing key.

Remaining:

- Production still requires the operational privacy version, hash/rate-limit configuration, collector enablement, retention/deletion procedure, and the release checks listed below.
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

### 02 — Campaign Conversion, Landing, And Lead Data

Status: In review (integrated with the approved backend/data contract and locally verified)
Owner: Integration (backend/data contract + web public UX)
Date: 2026-07-25

Changed:

- Added an honest French-first forthcoming-Kinshasa-launch campaign at `/launch` with direct `/launch/providers` and `/launch/clients` paths. `/` stays the marketplace landing page.
- Added two-step provider/client forms with only the required triage fields, collapsed optional details, native accessible controls, French validation/retry/confirmation states, the full server-provided active category/subcategory hierarchy, and all 24 Kinshasa communes.
- Added a thin unauthenticated web boundary for the documented provider/client lead endpoints. Requests use the documented field names, generic accepted response, bounded attribution, honeypot, `credentials: "omit"`, and no auth/account calls.
- Added privacy-safe events for landing, role selection, form start, validation failure, and completed submission. URL attribution uses a last-touch session model: a new explicit source replaces the complete prior touch, while source-less dependent UTM fields cannot fabricate a hybrid channel.
- Campaign mode is an explicit opt-in (`KAYOU_PUBLIC_WEB_MODE=campaign`); any other value keeps the marketplace open. The server proxy and `/auth` page redirect all account-auth entry to `/launch` in campaign mode; the auth client additionally sets Supabase `shouldCreateUser` only for an explicit marketplace signup. No staff/invite bypass was added because the current web architecture has no server-authoritative exception contract.
- Moved every `/launch*` route onto a minimal shell that does not mount the Supabase `AuthProvider`, React Query provider, or marketplace toaster; campaign visitors do not initialize marketplace session state.
- Consumes the shared `@kayu/schemas` lead/funnel DTO types and allowlisted validation dimensions, plus the canonical `@kayu/utils` `normalizePlausibleDRCMobilePhone`/`isPlausibleDRCMobilePhone` implementation. The web boundary submits `formStartedAt` and preserves safe status/code/`Retry-After` details for distinct French validation, stale-notice, rate-limit, disabled-intake, server, and network states.
- Added a readable `/launch/confidentialite` notice whose displayed version comes from the same server config submitted with operational consent. Role switches remount a fresh form and clear every field plus operational and marketing consent.
- Wired keyed, once-per-page funnel events to the coordinated first-party `POST /api/launch/funnel-events` contract with schema version, timestamp, allowlisted route/device/role/validation/attribution dimensions, `credentials: "omit"`, and `keepalive`. A strict `{ accepted: true }` response confirms durable backend receipt; collection remains non-blocking for lead submission. `window.dataLayer` and the DOM event are optional diagnostics bridges only.
- Scoped both campaign surfaces with `k-campaign` and, under `prefers-reduced-motion`, forced global scroll behavior to auto, stopped the campaign submission spinner, and removed interactive control/icon transitions so neither role scrolling nor campaign loading/control feedback inherits motion.
- Added web environment examples for campaign mode, privacy-notice version, and the visible withdrawal/correction contact. No Admin, marketplace session, invitation, activation, or matching implementation was added.

Verified:

- `node --test packages/utils/test/phone.test.mjs` — 2/2 pass for the canonical DRC mobile normalization representations plus non-mobile, foreign, length-boundary, sequential, repeated-digit, and zero-placeholder rejection.
- `node --test apps/web/src/lib/campaign-copy.test.mjs apps/web/src/lib/campaign-form-state.test.mjs apps/web/src/lib/campaign-phone-contract.test.mjs apps/web/src/lib/campaign-leads.test.mjs apps/web/src/lib/campaign-routing.test.mjs` — 28/28 pass (copy/notice linkage, fresh role state and consents, last-touch attribution reset, contact-shaped attribution rejection, web↔shared/backend phone fixtures, strict durable funnel DTO/receipt/once/no-PII behavior, `formStartedAt`, credential-free lead submission, safe API error semantics, fail-closed auth/public mode, minimal shell routing, and reduced-motion proof for scrolling, campaign loading, and interactive transitions).
- `pnpm --filter @kayu/web type-check` — pass.
- `BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key pnpm turbo run build --filter=@kayu/web...` — 5/5 workspace build tasks pass; runner warned that local Node 24 is outside the repository's Node 22 engine.
- Final integration: web type-check and production build passed against the shared DTO/API contract.
- Local mock-backed browser QA completed both provider and client submissions at 320px and reached their distinct French early-access confirmation states. A non-priority `Électricité automobile` client need submitted successfully.
- Responsive browser checks at 320, 360, 390, 430, 768, and 1440px reported no horizontal overflow. At 320px both role choices are visible before the form; focus order, native labels, select/radio/checkbox semantics, keyboard-size controls, and zero browser console errors were checked.
- The selector rendered all 15 current categories and 40 current subcategories from the existing taxonomy source, with no synthetic home-services category and no public priority styling/filter.
- Final 320px copy QA confirmed the site-wide “KAYOU arrive bientôt à Kinshasa” narrative, free pre-registration, audience-specific provider/client benefits, and no visible beta/test/waitlist jargon.
- Consolidated-review browser QA at 320px confirmed exactly two non-duplicated role CTAs, no overflow, role changes clearing previously entered client fields, the readable version-matched privacy notice, `/auth?mode=signup` redirecting to `/?utm_source=ig&utm_medium=cpc`, and zero browser warnings/errors. A provider submission reached confirmation once.
- The mock-observed provider request used plausible normalized number `+243998765432`, `source: "instagram"`, `medium: "paid_social"`, `campaign: "launch-kinshasa"`, the selected non-priority subcategory ID, the displayed privacy version, and an ISO `formStartedAt`; it contained no account/auth fields.
- Final 320px browser contract QA recorded durable first-party receipts for landing, role selection, and form start. A paid-Instagram visit followed by `utm_source=whatsapp` produced a WhatsApp-only form-start receipt with no inherited medium/campaign, no horizontal overflow (`scrollWidth=innerWidth=320`), an effective reduced-motion CSS override, and zero browser warnings/errors.

Data/phase checks:

- Campaign route/components contain no Supabase/auth import and send only shared lead DTO fields to `/api/launch/provider-leads` or `/api/launch/client-leads`; the final integration flow verified real backend persistence without account creation.
- Analytics payload construction and the owned collector DTO have no name, phone, email, summary, exact address, referrer path/query, auth/session identifier, raw token, or free-text field. The backend DTO is strict, and collector receipt does not gate form success.
- The redirect is explicitly presentation-only. No server phase, membership, marketplace entitlement, account creation, or seeded marketplace data is read by the campaign page.
- Backend persistence and database/auth-diff proof are integrated with this campaign surface; the final integration flow records the no-account evidence.

Decisions:

- Binding copy decision: keep both paths action-first and non-text-heavy. Core messages use short French headings, compact supporting lines, icons/cards, and progressive disclosure; only required consent/privacy language remains denser.
- Public narrative decision: frame the entire campaign—not only the hero—as “KAYOU arrive bientôt à Kinshasa,” with free pre-registration and the benefit of being among the first providers or first people to seek a trusted provider. Public paths, CTAs, validation, confirmations, metadata, and microcopy avoid beta/test/waitlist jargon and do not promise access, work, income, or immediate provider availability.
- Load taxonomy on the server and submit stable active subcategory IDs. Do not fall back to seed slugs as IDs when the taxonomy API is unavailable; instead show a retryable unavailable state.
- Keep source attribution across validation/retry without storing form PII, and omit browser auth credentials from the public lead request.
- Treat only the exact `marketplace` public-mode value as permission to expose account auth; missing, blank, differently cased, or invalid configuration remains in campaign mode.
- Use the first-party durable funnel endpoint as the authoritative measurement path. Keep `dataLayer`/DOM events as optional diagnostics only; neither diagnostics nor collector availability may change lead acceptance.

Remaining:

- Release must set `LAUNCH_FUNNEL_EVENTS_ENABLED=true` and the reviewed rate-limit/hash configuration; the backend collector and lead intake remain independently default-off.
- Confirm the production privacy notice value and `confidentialite@kayou.cd` withdrawal channel before G1; override the documented web environment values if privacy owners choose different approved values.
- Complete fluent Kinshasa French review and 5–8 target-user phone tests, real slow-network/retry testing, production mobile p75 Core Web Vitals, and the named/capped first acquisition experiment.

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
