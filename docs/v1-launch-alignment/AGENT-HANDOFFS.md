# KAYOU V1 Launch Alignment - Agent Handoffs

## Reusable Prompt Template

```text
You are implementing workstream [XX] of the KAYOU v1 launch alignment plan.

Required reading before editing code:
1. /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
2. /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/[XX-workstream-file].md

Working directory:
- /Users/alainmk/startups/kayu-project/

Reference context:
- Prior Kinshasa MVP reset: /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/
- Prototype UI migration contract: /Users/alainmk/startups/kayu-project/docs/prototype-ui-migration/00-product-flow-contract.md
- Launch readiness audit: /Users/alainmk/startups/kayu-project/docs/launch-readiness-audit/2026-04-19/

Rules:
- Stay inside the workstream ownership unless a compile error forces a small shared contract change.
- Final offers are provider-issued agreement records.
- Do not show client accept/decline for final offers in v1.
- Provider-created final offer should immediately create or confirm a booking.
- Do not launch job requests, quote comparison, standalone devis, online payment, payouts, invoices, route tracking, push, email, or SMS.
- Keep pricing as starting-from guidance until final offer.
- Keep payment copy cash-first.
- Run relevant type-check/tests.
- Update PROGRESS.md with status, changed files, tests, and decisions.

When done, report:
- What changed.
- What commands passed/failed.
- Any remaining blocker.
```

## Ready-To-Send Prompts

### Workstream 01 - Auto-Confirmed Final Offers

```text
You are implementing workstream 01 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/01-auto-confirmed-final-offers.md

Goal:
Change final offers from client-approved proposals into provider-issued agreement records. POST /final-offers should immediately create or confirm a booking. Keep accept/decline endpoints only for backwards compatibility if needed; v1 clients must not depend on them.

Update PROGRESS.md when done.
```

### Workstream 02 - Pricing And Commission Policy

```text
You are implementing workstream 02 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/02-pricing-commission-policy.md

Goal:
Standardize starting-from pricing and make internal 10% commission tracking consistent for final offers, bookings, earnings, and provider-facing surfaces where approved.

Update PROGRESS.md when done.
```

### Workstream 03 - Web V1 Flow Alignment

```text
You are implementing workstream 03 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/03-web-v1-flow-alignment.md

Goal:
Align web with v1: remove client final-offer accept/decline, show provider-issued final offers as confirmed agreements, standardize starting-from pricing, keep cash disclaimer visible, and keep deferred quote/payment/payout surfaces hidden.

Update PROGRESS.md when done.
```

### Workstream 04 - Mobile V1 Flow Alignment

```text
You are implementing workstream 04 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/04-mobile-v1-flow-alignment.md

Goal:
Align mobile with v1: remove client final-offer accept/decline, show provider-issued final offers as confirmed agreements, standardize starting-from pricing, keep cash disclaimer visible, and keep deferred quote/payment/payout surfaces hidden.

Update PROGRESS.md when done.
```

### Workstream 05 - Provider Onboarding Tightening

```text
You are implementing workstream 05 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/05-provider-onboarding-tightening.md

Goal:
Tighten provider onboarding around phone/identity state, max 3 service categories, experience, skills, Kinshasa communes, radius, starting-from pricing, portfolio behavior, and 24h verification copy.

Update PROGRESS.md when done.
```

### Workstream 06 - Discovery Map Distance And Reviews

```text
You are implementing workstream 06 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/06-discovery-map-distance-reviews.md

Goal:
Handle P2 discovery and review improvements: real map/distance/radius if promoted, mandatory review behavior, and Expo readiness for native location/upload/map capabilities if required.

Update PROGRESS.md when done.
```

### Workstream 07 - V1 QA And Release Smoke

```text
You are implementing workstream 07 of the KAYOU v1 launch alignment plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/00-product-contract.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/v1-launch-alignment/07-v1-qa-release-smoke.md

Goal:
Create/run smoke tests for signup, discovery, direct contact, direct booking, auto-confirmed final offers, cash completion, review, and launch-scope guards.

Update PROGRESS.md when done.
```
