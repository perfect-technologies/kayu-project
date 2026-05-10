# KAYOU V1 Launch Alignment Plan

## Purpose

This folder defines the next implementation pass for the KAYOU v1 launch.

The current codebase already moved toward the Kinshasa MVP: direct provider discovery, chat, direct booking, final offers, cash payment, and reviews. This pass tightens that scope based on the latest product feedback:

- final offers are agreement records, not client approval requests,
- provider-created final offers immediately create or confirm bookings,
- pricing is shown as fixed starting-from guidance, not hourly pricing,
- the final price is agreed in chat and recorded by the provider,
- cash payment remains the only v1 payment mode,
- online payment, quote comparison, payouts, and complex invoices stay hidden.

## Product Decision

Launch with a simple local service flow:

1. Client searches for a provider.
2. Client opens the provider profile.
3. Client contacts the provider by chat or phone.
4. Client may create a direct booking request.
5. Client and provider agree details in chat or by phone.
6. Provider creates a final offer as the written agreement.
7. The final offer immediately creates or confirms the booking.
8. Provider completes the job.
9. Cash payment is handled directly between client and provider.
10. The platform records payment confirmation, internal commission, and review.

## V1 Policy

Keep for v1:

- Provider discovery
- Provider profiles
- Fixed starting-from base pricing
- Direct chat and phone contact
- Direct booking requests
- Provider-issued final agreement
- Auto-confirmed booking from final offer
- Cash payment wording and disclaimer
- Internal commission tracking
- Client/provider booking dashboards
- Reviews after completed work

Hide or defer for v1:

- Client accept/decline on final offers
- Multi-provider quote competition
- Public job request marketplace
- Standalone quote/devis composer
- Quote comparison
- Online payment
- Payout automation
- Client/provider-facing commission copy unless explicitly required
- Complex invoices
- En route / arrived tracking
- Push/email/SMS as launch dependencies

## Recommended Execution Order

1. [00 - Product Contract](./00-product-contract.md)
2. [01 - Auto-Confirmed Final Offers](./01-auto-confirmed-final-offers.md)
3. [02 - Pricing And Commission Policy](./02-pricing-commission-policy.md)
4. [03 - Web V1 Flow Alignment](./03-web-v1-flow-alignment.md)
5. [04 - Mobile V1 Flow Alignment](./04-mobile-v1-flow-alignment.md)
6. [05 - Provider Onboarding Tightening](./05-provider-onboarding-tightening.md)
7. [06 - Fixed Starting Price Model](./06-fixed-starting-price-model.md)
8. [07 - Discovery Map Distance And Reviews](./07-discovery-map-distance-reviews.md)
9. [08 - V1 QA And Release Smoke](./08-v1-qa-release-smoke.md)

## Priority Bands

P0:

- Final offers auto-confirm bookings.
- Remove client accept/decline from launch UI.
- Standardize fixed starting-from pricing and remove hourly-rate launch copy.
- Resolve commission policy and make final-offer/booking economics auditable.
- Keep online payment, quote marketplace, payouts, and invoice/devis comparison hidden.
- Add consistent cash payment disclaimer.

P1:

- Tighten provider onboarding requirements.
- Make verification copy and 24h review promise consistent.
- Replace fake upload/portfolio controls with real upload or honest deferred copy.
- Ensure provider profile update enforces the same max-three service category rule.

P2:

- Real map/distance/radius support.
- Mandatory post-completion review flow.
- Expo/EAS readiness for location/upload/map modules.

## Parallel Work Guidance

Agents can work in parallel if they stay within ownership boundaries:

- `01` should happen before final-offer UI updates in `03` and `04`.
- `02` should happen before earnings/dashboard copy is finalized.
- `03` and `04` can run in parallel after `01` and `02` contracts are clear.
- `05` can run in parallel unless it changes shared provider schemas.
- `06` is a P0 correction and should happen before final QA.
- `07` is P2 and should not block P0 launch cleanup unless map/distance is promoted.
- `08` should run after P0 work is complete.

## Working Rules For Agents

1. Read `00-product-contract.md`, `PROGRESS.md`, and the chosen workstream before editing code.
2. Stay inside the workstream ownership unless a shared contract change is required.
3. Do not re-enable job requests or quote competition for v1.
4. Do not add online payment, payout automation, push, email, or SMS as v1 dependencies.
5. Treat final offers as provider-issued agreement documents.
6. Do not show client accept/decline actions for final offers in launch-facing UI.
7. Use French UI copy and clear Kinshasa-first language.
8. Keep API field names and code identifiers in English.
9. Run relevant type-check/tests before marking done.
10. Update `PROGRESS.md` with status, changed files, commands, and decisions.

## File Map

| File | Purpose |
| --- | --- |
| `README.md` | Orchestration and execution order |
| `00-product-contract.md` | Product decision and v1 launch truth |
| `01-auto-confirmed-final-offers.md` | Backend and contract changes for auto-confirmed final offers |
| `02-pricing-commission-policy.md` | Starting-from pricing and internal commission tracking |
| `03-web-v1-flow-alignment.md` | Web UI changes for final offer, pricing, payment, and hidden scope |
| `04-mobile-v1-flow-alignment.md` | Mobile UI changes for final offer, pricing, payment, and hidden scope |
| `05-provider-onboarding-tightening.md` | Provider onboarding, verification, category limits, and portfolio |
| `06-fixed-starting-price-model.md` | P0 correction for fixed starting prices and no hourly-rate launch copy |
| `07-discovery-map-distance-reviews.md` | P2 map/distance and mandatory review work |
| `08-v1-qa-release-smoke.md` | Manual and automated v1 smoke tests |
| `AGENT-HANDOFFS.md` | Ready-to-send agent prompts |
| `PROGRESS.md` | Live execution tracker |
