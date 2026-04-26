# KAYOU Prototype UI Migration Plan

## Purpose

This folder defines how to bring the new KAYOU prototype visual system into the current app without reverting the Kinshasa MVP client/provider product flow.

The prototype is a visual and interaction reference for the public marketplace flow. For Ops Admin and Settings, the prototype is the replacement target for the current dashboards.

## References

- Design system: `/Users/alainmk/Downloads/KAYOU Design System _standalone_.html`
- Primary prototype: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html`
- Prototype copy, if present: `/Users/alainmk/Downloads/KAYOU Prototype _standalone_2.html`
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

- Client job-request marketplace in public client/provider navigation
- Provider quote competition in public client/provider navigation
- Standalone quote composer as a public launch route
- Competing-pro counters in public client/provider UI
- Request expiry pressure in public client/provider UI
- Budget bidding in public client/provider UI
- Calendar reservation checkout as the primary public path
- Protected payment or refund guarantee copy in public client/provider UI
- Mobile Money checkout in public client/provider UI
- Payout automation in public client/provider UI
- Disputes or reimbursement logic in public client/provider UI
- En-route / arrival code complexity in public client/provider UI

Dashboard exceptions:

- `/dashboard/admin` should adopt the prototype Ops Admin dashboard. Admin-only queues for verification, moderation, payments, disputes, refunds, payouts, support, and operations are allowed if they remain internal and do not change the public MVP flow.
- `/dashboard/settings` should adopt the prototype Settings UI for both client and provider variants. Settings sections can appear even when some controls are not wired yet, but unsupported controls must be disabled, marked as coming later, or backed by honest placeholder states.

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
- `08` can run in parallel as a full Ops Admin and Settings replacement. It may add admin-only operational sections from the prototype, but must not expose those flows to clients/providers.
- `09` should run after any screen-level workstream.

## Agent Rules

1. Read `00-product-flow-contract.md`, `PROGRESS.md`, and the chosen workstream before editing code.
2. Open the prototype HTML directly before implementing any prototype-driven UI.
3. Extract layout, component structure, spacing, copy style, states, and responsive behavior from the HTML, not from memory or this summary alone.
4. Use prototype visuals, not prototype business logic, except where a workstream explicitly says the prototype is the target product surface.
5. Keep current API contracts unless the workstream explicitly says otherwise.
6. Use French UI copy.
7. Format money as `24 000 FC` using mono/tabular numerals.
8. Do not use raw `CDF`, `$`, or comma-separated money.
9. Keep launch payment wording cash-first.
10. Run relevant type-check/build commands.
11. Respect role-specific UI where the prototype has separate client and provider versions.
12. Update `PROGRESS.md` with changed files, validation, and decisions.
