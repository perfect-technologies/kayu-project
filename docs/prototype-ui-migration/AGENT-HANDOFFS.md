# Agent Handoffs

Copy one prompt to a worker agent. Every agent must read `00-product-flow-contract.md` first.

## Workstream 01 - Canonical Design System

Read `docs/prototype-ui-migration/00-product-flow-contract.md`, `01-canonical-design-system.md`, and `PROGRESS.md`. Align tokens/globals/design docs with the standalone design system. Do not change product flow. Run UI/web type-check/build commands and update `PROGRESS.md`.

## Workstream 02 - Shared UI Primitives

Read `00-product-flow-contract.md`, `02-shared-ui-primitives.md`, and `PROGRESS.md`. Make shared primitives and local shadcn wrappers render consistently with KAYOU. Do not redesign screens wholesale. Run relevant type-check/build commands and update `PROGRESS.md`.

## Workstream 03 - Home, Services, Categories

Read `00-product-flow-contract.md`, `03-home-services-categories.md`, and `PROGRESS.md`. Apply prototype visual polish to discovery while preserving current `/`, `/services`, and `/categories/[slug]` flows. Do not add quote/request marketplace behavior. Run web checks and update `PROGRESS.md`.

## Workstream 04 - Provider Profile

Read `00-product-flow-contract.md`, `04-provider-profile.md`, and `PROGRESS.md`. Apply prototype profile visual hierarchy while preserving current data, visibility gates, and chat-first final-offer flow. Run web checks and update `PROGRESS.md`.

## Workstream 05 - Messages And Final Offer

Read `00-product-flow-contract.md`, `05-messages-final-offer.md`, and `PROGRESS.md`. Make chat and final offer UI clear on web/mobile. Do not add line-item quote marketplace, commission, payout, or online payment. Run web/mobile checks and update `PROGRESS.md`.

## Workstream 06 - Auth And Provider Onboarding

Read `00-product-flow-contract.md`, `06-auth-onboarding.md`, and `PROGRESS.md`. Polish auth/onboarding visuals while keeping current backend/auth flow. Do not add required Mobile Money or heavy KYC. Run web/mobile checks and update `PROGRESS.md`.

## Workstream 07 - Bookings And Provider Dashboard

Read `00-product-flow-contract.md`, `07-bookings-provider-dashboard.md`, and `PROGRESS.md`. Polish bookings/detail/provider dashboard around accepted final offers and cash jobs. Do not add en-route/arrival code, online payments, payouts, or disputes. Run web/mobile checks and update `PROGRESS.md`.

## Workstream 08 - Admin, Settings, Error States

Read `00-product-flow-contract.md`, `08-admin-settings-errors.md`, and `PROGRESS.md`. Before editing code, inspect `/Users/alainmk/Downloads/KAYOU Prototype _standalone_.html` directly, plus `/Users/alainmk/Downloads/KAYOU Prototype _standalone_2.html` if present, and extract the relevant `AdminOps` and `SettingsAccount` UI from the prototype. Replace the current admin dashboard with the prototype Ops Admin dashboard, and replace `/dashboard/settings` with the prototype Settings UI for both client and provider variants. Keep admin operational sections admin-only. Settings controls that are not wired must be disabled, coming-later, or honestly represented. Do not merge client/provider settings into one generic page. Run web checks and update `PROGRESS.md` with the prototype screens/components inspected.

## Workstream 09 - Mobile Responsive QA

Read `00-product-flow-contract.md`, `09-mobile-responsive-qa.md`, and `PROGRESS.md`. Test migrated screens at required viewports. Fix small responsive issues only if scoped and safe. Record routes/viewports/evidence in `PROGRESS.md`.
