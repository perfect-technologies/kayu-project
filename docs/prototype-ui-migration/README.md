# KAYOU Prototype UI Migration Plan

## Purpose

This folder defines how to bring the new KAYOU prototype visual system into the current app without reverting the Kinshasa MVP product flow.

The prototype is a visual and interaction reference. It is not the business-flow source of truth.

## References

- Design system: `/Users/alainmk/Downloads/KAYOU Design System _standalone_.html`
- Prototype: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html`
- Current product reset: `docs/kinshasa-mvp-implementation/00-product-reset.md`
- Current progress tracker: `docs/kinshasa-mvp-implementation/PROGRESS.md`

## Product Flow Contract

Agents must preserve this launch flow:

1. Client discovers providers.
2. Client opens a provider profile.
3. Client starts a conversation.
4. Provider sends one lightweight final offer inside chat after discussion.
5. Client accepts or declines the final offer.
6. Accepted final offer creates or confirms a cash booking.
7. Job happens offline.
8. Payment is cash directly between client and provider.
9. Client can leave a review after completion.

## Do Not Reintroduce

- Client job-request marketplace
- Provider quote competition
- Standalone quote composer as a launch route
- Competing-pro counters
- Request expiry pressure
- Budget bidding
- Calendar reservation checkout as the primary path
- Protected payment or refund guarantee copy
- Mobile Money checkout
- Payout automation
- Disputes or reimbursement logic
- En-route / arrival code complexity

## Execution Order

1. [00 - Product Flow Contract](./00-product-flow-contract.md)
2. [01 - Canonical Design System](./01-canonical-design-system.md)
3. [02 - Shared UI Primitives](./02-shared-ui-primitives.md)
4. [03 - Home, Services, Categories](./03-home-services-categories.md)
5. [04 - Provider Profile](./04-provider-profile.md)
6. [05 - Messages And Final Offer](./05-messages-final-offer.md)
7. [06 - Auth And Provider Onboarding](./06-auth-onboarding.md)
8. [07 - Bookings And Provider Dashboard](./07-bookings-provider-dashboard.md)
9. [08 - Admin, Settings, Error States](./08-admin-settings-errors.md)
10. [09 - Mobile Responsive QA](./09-mobile-responsive-qa.md)

## Parallel Work Guidance

- `01` and `02` should run first or be reviewed before visual screen work merges.
- `03`, `04`, `05`, and `06` can run in parallel after reading `00`.
- `07` should coordinate with `05` because bookings are created by accepted final offers.
- `08` can run in parallel if it stays visual and does not add payout/dispute/payment logic.
- `09` should run after any screen-level workstream.

## Agent Rules

1. Read `00-product-flow-contract.md`, `PROGRESS.md`, and the chosen workstream before editing code.
2. Use prototype visuals, not prototype business logic.
3. Keep current API contracts unless the workstream explicitly says otherwise.
4. Use French UI copy.
5. Format money as `24 000 FC` using mono/tabular numerals.
6. Do not use raw `CDF`, `$`, or comma-separated money.
7. Keep launch payment wording cash-first.
8. Run relevant type-check/build commands.
9. Update `PROGRESS.md` with changed files, validation, and decisions.

