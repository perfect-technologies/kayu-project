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
- Added privacy-safe events for landing, role selection, form start, validation failure, and completed submission. URL attribution uses a last-touch session model: a new explicit source replaces the complete prior touch, while source-less dependent UTM fields cannot fabricate a hybrid channel.
- Made campaign mode fail closed unless `KAYOU_PUBLIC_WEB_MODE=marketplace` is explicit. The server proxy and `/auth` page redirect all account-auth entry in campaign mode; the auth client additionally sets Supabase `shouldCreateUser` only for an explicit marketplace signup. No staff/invite bypass was added because the current web architecture has no server-authoritative exception contract.
- Moved `/` in campaign mode and every `/launch/*` route onto a minimal shell that does not mount the Supabase `AuthProvider`, React Query provider, or marketplace toaster; campaign visitors do not initialize marketplace session state.
- Aligned source/medium/campaign/content normalization with the strict shared lead DTO values from the backend workstream. Exported the backend’s exact canonical `normalizePlausibleDRCMobilePhone`/`isPlausibleDRCMobilePhone` implementation from `@kayu/utils`, used it at the web boundary, submitted `formStartedAt`, and preserved safe status/code/`Retry-After` details for distinct French validation, stale-notice, rate-limit, disabled-intake, server, and network states.
- Added a readable `/launch/confidentialite` notice whose displayed version comes from the same server config submitted with operational consent. Role switches remount a fresh form and clear every field plus operational and marketing consent.
- Wired keyed, once-per-page funnel events to the coordinated first-party `POST /api/launch/funnel-events` contract with schema version, timestamp, allowlisted route/device/role/validation/attribution dimensions, `credentials: "omit"`, and `keepalive`. A strict `{ accepted: true }` response confirms durable backend receipt; collection remains non-blocking for lead submission. `window.dataLayer` and the DOM event are optional diagnostics bridges only.
- Scoped both campaign surfaces with `k-campaign` and, under `prefers-reduced-motion`, forced global scroll behavior to auto, stopped the campaign submission spinner, and removed interactive control/icon transitions so neither role scrolling nor campaign loading/control feedback inherits motion.
- Added web environment examples for campaign mode, privacy-notice version, and the visible withdrawal/correction contact. No Prisma, backend endpoint, shared API/schema, Admin, marketplace session, invitation, activation, or matching implementation changed.

Verified:

- `pnpm --filter @kayu/utils test` — 2/2 pass for the canonical DRC mobile normalization representations plus non-mobile, foreign, length-boundary, sequential, repeated-digit, and zero-placeholder rejection.
- `node --test apps/web/src/lib/campaign-copy.test.mjs apps/web/src/lib/campaign-form-state.test.mjs apps/web/src/lib/campaign-phone-contract.test.mjs apps/web/src/lib/campaign-leads.test.mjs apps/web/src/lib/campaign-routing.test.mjs` — 28/28 pass (copy/notice linkage, fresh role state and consents, last-touch attribution reset, contact-shaped attribution rejection, web↔shared/backend phone fixtures, strict durable funnel DTO/receipt/once/no-PII behavior, `formStartedAt`, credential-free lead submission, safe API error semantics, fail-closed auth/public mode, minimal shell routing, and reduced-motion proof for scrolling, campaign loading, and interactive transitions).
- `pnpm --filter @kayu/web type-check` — pass.
- `BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key pnpm turbo run build --filter=@kayu/web...` — 5/5 workspace build tasks pass; runner warned that local Node 24 is outside the repository's Node 22 engine.
- Local mock-backed browser QA completed both provider and client submissions at 320px and reached their distinct French early-access confirmation states. A non-priority `Électricité automobile` client need submitted successfully.
- Responsive browser checks at 320, 360, 390, 430, 768, and 1440px reported no horizontal overflow. At 320px both role choices are visible before the form; focus order, native labels, select/radio/checkbox semantics, keyboard-size controls, and zero browser console errors were checked.
- The selector rendered all 15 current categories and 40 current subcategories from the existing taxonomy source, with no synthetic home-services category and no public priority styling/filter.
- Final 320px copy QA confirmed the site-wide “KAYOU arrive bientôt à Kinshasa” narrative, free pre-registration, audience-specific provider/client benefits, and no visible beta/test/waitlist jargon.
- Consolidated-review browser QA at 320px confirmed exactly two non-duplicated role CTAs, no overflow, role changes clearing previously entered client fields, the readable version-matched privacy notice, `/auth?mode=signup` redirecting to `/?utm_source=ig&utm_medium=cpc`, and zero browser warnings/errors. A provider submission reached confirmation once.
- The mock-observed provider request used plausible normalized number `+243998765432`, `source: "instagram"`, `medium: "paid_social"`, `campaign: "launch-kinshasa"`, the selected non-priority subcategory ID, the displayed privacy version, and an ISO `formStartedAt`; it contained no account/auth fields.
- Final 320px browser contract QA recorded durable first-party receipts for landing, role selection, and form start. A paid-Instagram visit followed by `utm_source=whatsapp` produced a WhatsApp-only form-start receipt with no inherited medium/campaign, no horizontal overflow (`scrollWidth=innerWidth=320`), an effective reduced-motion CSS override, and zero browser warnings/errors.

Data/phase checks:

- Campaign route/components contain no Supabase/auth import and send only lead DTO fields to `/api/launch/provider-leads` or `/api/launch/client-leads`; browser submissions were exercised only against a temporary no-persistence mock.
- Analytics payload construction and the owned collector DTO have no name, phone, email, summary, exact address, referrer path/query, auth/session identifier, raw token, or free-text field. The backend DTO is strict, and collector receipt does not gate form success.
- The redirect is explicitly presentation-only. No server phase, membership, marketplace entitlement, account creation, or seeded marketplace data is read by the campaign page.
- Production database/auth diff proof remains owned by the backend intake implementation because this scoped branch neither defines nor modifies persistence/endpoints.

Decisions:

- Binding copy decision: keep both paths action-first and non-text-heavy. Core messages use short French headings, compact supporting lines, icons/cards, and progressive disclosure; only required consent/privacy language remains denser.
- Public narrative decision: frame the entire campaign—not only the hero—as “KAYOU arrive bientôt à Kinshasa,” with free pre-registration and the benefit of being among the first providers or first people to seek a trusted provider. Public paths, CTAs, validation, confirmations, metadata, and microcopy avoid beta/test/waitlist jargon and do not promise access, work, income, or immediate provider availability.
- Load taxonomy on the server and submit stable active subcategory IDs. Do not fall back to seed slugs as IDs when the taxonomy API is unavailable; instead show a retryable unavailable state.
- Keep source attribution across validation/retry without storing form PII, and omit browser auth credentials from the public lead request.
- Treat only the exact `marketplace` public-mode value as permission to expose account auth; missing, blank, differently cased, or invalid configuration remains in campaign mode.
- Use the first-party durable funnel endpoint as the authoritative measurement path. Keep `dataLayer`/DOM events as optional diagnostics only; neither diagnostics nor collector availability may change lead acceptance.

Remaining:

- Integrate the backend workstream’s durable `CampaignFunnelEvent` migration, strict `CreateLaunchFunnelEventDto`, `launchLeadsApi.trackFunnelEvent`, abuse-protected controller/service, and canonical shared-phone export before campaign traffic. This isolated frontend branch mirrors the settled DTO while its baseline predates those shared symbols.
- Release must set `LAUNCH_FUNNEL_EVENTS_ENABLED=true` and the reviewed rate-limit/hash configuration; the backend collector and lead intake remain independently default-off.
- Implement and verify the remaining backend lead endpoint/idempotency/persistence/no-account evidence in the backend-owned workstream 02 half.
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
