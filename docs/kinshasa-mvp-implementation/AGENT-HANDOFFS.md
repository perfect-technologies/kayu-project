# KAYOU Kinshasa MVP - Agent Handoffs

## Reusable Prompt Template

```text
You are implementing workstream [XX] of the KAYOU Kinshasa MVP implementation plan.

Required reading before editing code:
1. /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
2. /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
3. /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/[XX-workstream-file].md

Working directory:
- /Users/alainmk/startups/kayu-project/

Reference context:
- Legacy app: /Users/alainmk/startups/kayu/frontend/
- Old migration plan: /Users/alainmk/startups/kayu-project/docs/implementation-plan/
- Launch audit: /Users/alainmk/startups/kayu-project/docs/launch-readiness-audit/2026-04-19/

Rules:
- Stay inside the workstream ownership unless a compile error forces a small shared contract change.
- Do not launch job requests or multi-provider quote competition.
- Do not add online payments, payouts, push, email, or SMS as launch dependencies.
- Keep the MVP direct: provider discovery, chat, direct booking, final offer, cash completion, review.
- Run relevant type-check/tests.
- Update PROGRESS.md with status, changed files, tests, and decisions.

When done, report:
- What changed.
- What commands passed/failed.
- Any remaining blocker.
```

## Ready-To-Send Prompts

### Workstream 01 - Feature Flags And Navigation Cleanup

```text
You are implementing workstream 01 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/01-feature-flags-navigation.md

Goal:
Hide job requests, provider request inbox, standalone devis/quote composer, and quote comparison from launch-facing web/mobile navigation. Preserve direct booking, messaging, bookings, reviews, favorites, and provider dashboards.

Update PROGRESS.md when done.
```

### Workstream 02 - Backend Final Offer And Booking Lifecycle

```text
You are implementing workstream 02 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/02-backend-final-offer-bookings.md

Goal:
Add the backend contract for a lightweight final offer after chat. A provider sends agreed terms to a client; the client accepts; the app creates or confirms a booking. Do not require job requests or quote competition.

Update PROGRESS.md when done.
```

### Workstream 03 - Web Direct Flow

```text
You are implementing workstream 03 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/03-web-direct-flow.md

Goal:
Make the web app launch around provider discovery, chat, direct booking, final offer, and cash completion. Remove visible request/quote competition paths.

Update PROGRESS.md when done.
```

### Workstream 04 - Mobile Direct Flow

```text
You are implementing workstream 04 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/04-mobile-direct-flow.md

Goal:
Make mobile launch around provider discovery, chat, direct booking, final offer, cash completion, and reviews. Hide client requests and provider request inbox.

Update PROGRESS.md when done.
```

### Workstream 05 - Discovery Filters And Provider Profile

```text
You are implementing workstream 05 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/05-discovery-provider-profile.md

Goal:
Fix discovery and provider profile launch issues: category/subcategory filters, visible filter truthfulness, profile CTAs, and fake map/distance/availability surfaces.

Update PROGRESS.md when done.
```

### Workstream 06 - Cash Payment And Copy Cleanup

```text
You are implementing workstream 06 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/06-cash-payment-copy.md

Goal:
Make payment and lifecycle copy match the cash-first MVP. Remove online payment, payout, secure payment, en route, and arrived claims from launch-facing UI.

Update PROGRESS.md when done.
```

### Workstream 07 - Provider Operations And Dashboards

```text
You are implementing workstream 07 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/07-provider-operations.md

Goal:
Make provider dashboards actionable for direct bookings, messages, final offers, completion, and cash history. Hide request/quote competition and payout claims.

Update PROGRESS.md when done.
```

### Workstream 08 - Launch QA And Smoke Tests

```text
You are implementing workstream 08 of the KAYOU Kinshasa MVP plan.

Read:
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/00-product-reset.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/PROGRESS.md
- /Users/alainmk/startups/kayu-project/docs/kinshasa-mvp-implementation/08-launch-qa-smoke-tests.md

Goal:
Create and run launch smoke tests for signup, discovery, chat, direct booking, final offer, cash completion, review, and launch-scope guards.

Update PROGRESS.md when done.
```
