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
| 02 — Campaign Conversion, Landing, And Lead Data | In review | Web public UX | Public campaign UX/client boundary implemented; backend lead persistence and production G1 evidence remain separate |
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

Status: In review (public web campaign-UX half complete; backend/persistence half not changed)
Owner: Web public UX
Date: 2026-07-25

Changed:

- Replaced `/` marketplace claims/data with an honest French-first forthcoming-Kinshasa-launch campaign and added direct `/launch/providers` and `/launch/clients` paths.
- Added two-step provider/client forms with only the required triage fields, collapsed optional details, native accessible controls, French validation/retry/confirmation states, the full server-provided active category/subcategory hierarchy, and all 24 Kinshasa communes.
- Added a thin unauthenticated web boundary for the documented provider/client lead endpoints. Requests use the documented field names, generic accepted response, bounded attribution, honeypot, `credentials: "omit"`, and no auth/account calls.
- Added privacy-safe events for landing, role selection, form start, validation failure, and completed submission. URL attribution persists through `sessionStorage`; only bounded source/medium/campaign/content and referrer hostname cross the client boundary.
- Added presentation-only campaign redirects for public discovery/category/provider/booking/review routes, defaulting `KAYOU_PUBLIC_WEB_MODE` to `campaign`. This does not authorize beta access or replace backend phase/membership enforcement.
- Added web environment examples for campaign mode, privacy-notice version, and the visible withdrawal/correction contact. No Prisma, backend endpoint, shared API/schema, Admin, auth, marketplace session, invitation, activation, or matching file changed.

Verified:

- `node --test apps/web/src/lib/campaign-copy.test.mjs apps/web/src/lib/campaign-leads.test.mjs apps/web/src/lib/campaign-routing.test.mjs` — 8/8 pass (forthcoming-launch narrative guard, attribution normalization/redaction, privacy-safe event payload, explicit credential-free client submission boundary, device/time buckets, and public-route gating).
- `pnpm --filter @kayu/web type-check` — pass.
- `BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key pnpm turbo run build --filter=@kayu/web...` — 5/5 workspace build tasks pass; runner warned that local Node 24 is outside the repository's Node 22 engine.
- Local mock-backed browser QA completed both provider and client submissions at 320px and reached their distinct French early-access confirmation states. A non-priority `Électricité automobile` client need submitted successfully.
- Responsive browser checks at 320, 360, 390, 430, 768, and 1440px reported no horizontal overflow. At 320px both role choices are visible before the form; focus order, native labels, select/radio/checkbox semantics, keyboard-size controls, and zero browser console errors were checked.
- The selector rendered all 15 current categories and 40 current subcategories from the existing taxonomy source, with no synthetic home-services category and no public priority styling/filter.
- Final 320px copy QA confirmed the site-wide “KAYOU arrive bientôt à Kinshasa” narrative, free pre-registration, audience-specific provider/client benefits, and no visible beta/test/waitlist jargon.

Data/phase checks:

- Campaign code contains no Supabase/auth import and sends only lead DTO fields to `/api/launch/provider-leads` or `/api/launch/client-leads`; browser submissions were exercised only against a temporary no-persistence mock.
- Analytics payload construction has no name, phone, email, summary, exact address, referrer path/query, auth metadata, or raw token field; analytics dispatch is best-effort and form success does not depend on it.
- The redirect is explicitly presentation-only. No server phase, membership, marketplace entitlement, account creation, or seeded marketplace data is read by the campaign page.
- Production database/auth diff proof remains owned by the backend intake implementation because this scoped branch neither defines nor modifies persistence/endpoints.

Decisions:

- Binding copy decision: keep both paths action-first and non-text-heavy. Core messages use short French headings, compact supporting lines, icons/cards, and progressive disclosure; only required consent/privacy language remains denser.
- Public narrative decision: frame the entire campaign—not only the hero—as “KAYOU arrive bientôt à Kinshasa,” with free pre-registration and the benefit of being among the first providers or first people to seek a trusted provider. Public paths, CTAs, validation, confirmations, metadata, and microcopy avoid beta/test/waitlist jargon and do not promise access, work, income, or immediate provider availability.
- Load taxonomy on the server and submit stable active subcategory IDs. Do not fall back to seed slugs as IDs when the taxonomy API is unavailable; instead show a retryable unavailable state.
- Keep source attribution across validation/retry without storing form PII, and omit browser auth credentials from the public lead request.

Remaining:

- Implement and verify the documented NestJS lead endpoints, abuse controls, idempotency, persistence, and no-auth/user/provider database diff in the backend-owned workstream 02 half.
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
