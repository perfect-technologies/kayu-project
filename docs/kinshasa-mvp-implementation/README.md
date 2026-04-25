# KAYOU Kinshasa MVP Implementation Plan

## Purpose

This folder defines the product reset for the Kinshasa launch MVP.

The current platform added a job-request and multi-quote marketplace flow. That flow may be useful later, but it is too complex for the first launch in Kinshasa. The launch MVP should match how people actually close service jobs locally: find a provider, talk directly, agree quickly, then confirm the work.

## Product Decision

Launch with a simple direct-provider flow:

1. Client searches by service, category, city, availability, rating, or price.
2. Client opens a provider profile.
3. Client contacts the provider by chat or phone.
4. Client can create a direct booking request.
5. Provider can confirm or cancel the booking.
6. Client and provider can agree details in chat.
7. Provider can send a lightweight final offer after discussion.
8. Client accepts the final offer.
9. Accepted final offer becomes a confirmed booking.
10. Provider completes the job.
11. Client confirms cash payment and leaves a review.

## Launch Policy

Keep for launch:

- Provider discovery
- Provider profile
- Hourly price as guidance
- Direct chat
- Direct booking
- Final offer after discussion
- Favorites
- Reviews
- Cash payment wording
- Client and provider dashboards
- Simple booking lifecycle

Hide or defer for launch:

- Client job request marketplace
- Provider request inbox
- Multi-provider quote competition
- Standalone quote composer
- Quote comparison
- En route and arrived states
- Online payment wording
- Payout claims in customer/provider UI
- Push/email/SMS notification dependencies

## Recommended Execution Order

1. [00 - Product Reset](./00-product-reset.md)
2. [01 - Feature Flags And Navigation Cleanup](./01-feature-flags-navigation.md)
3. [02 - Backend Final Offer And Booking Lifecycle](./02-backend-final-offer-bookings.md)
4. [03 - Web Direct Flow](./03-web-direct-flow.md)
5. [04 - Mobile Direct Flow](./04-mobile-direct-flow.md)
6. [05 - Discovery Filters And Provider Profiles](./05-discovery-provider-profile.md)
7. [06 - Cash Payment And Copy Cleanup](./06-cash-payment-copy.md)
8. [07 - Provider Operations And Dashboards](./07-provider-operations.md)
9. [08 - Launch QA And Smoke Tests](./08-launch-qa-smoke-tests.md)

## Parallel Work Guidance

Agents can work in parallel if they stay within ownership boundaries:

- `01` can run first and independently.
- `02` should happen before final-offer UI work in `03` and `04`.
- `03` and `04` can run in parallel after reading `02`.
- `05` can run in parallel with most workstreams.
- `06` can run in parallel after `01`.
- `07` should coordinate with `02` for booking status actions.
- `08` should run after at least one client/provider flow is implemented.

## Working Rules For Agents

1. Read `00-product-reset.md`, `PROGRESS.md`, and the chosen workstream before editing code.
2. Stay inside the workstream's stated ownership unless the file explicitly says otherwise.
3. Do not re-enable job requests or quote competition for launch.
4. Do not add online payment, payout, push, email, or SMS dependencies in this MVP.
5. Use French UI copy and clear Kinshasa-first language.
6. Keep API field names and code identifiers in English.
7. Run the relevant type-check/test command before marking done.
8. Update `PROGRESS.md` with status, changed files, test evidence, and decisions.

## File Map

| File | Purpose |
| --- | --- |
| `README.md` | Orchestration and execution order |
| `00-product-reset.md` | Product decision and target launch flow |
| `01-feature-flags-navigation.md` | Hide/defer quote marketplace surfaces |
| `02-backend-final-offer-bookings.md` | Backend booking/final-offer contract |
| `03-web-direct-flow.md` | Web client flow, chat, booking, final offer |
| `04-mobile-direct-flow.md` | Mobile client flow, chat, booking, final offer |
| `05-discovery-provider-profile.md` | Search filters, category/subcategory, profile CTA cleanup |
| `06-cash-payment-copy.md` | Cash-first payment wording and UI cleanup |
| `07-provider-operations.md` | Provider dashboard, booking actions, completion |
| `08-launch-qa-smoke-tests.md` | Manual and automated launch smoke tests |
| `AGENT-HANDOFFS.md` | Ready-to-send agent prompts |
| `PROGRESS.md` | Live execution tracker |
