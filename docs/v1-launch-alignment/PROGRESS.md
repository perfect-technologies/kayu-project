# KAYOU V1 Launch Alignment - Progress

## Status Summary

Created: 2026-05-09

This workstream aligns the existing Kinshasa MVP implementation with the latest v1 product feedback:

- final offers auto-confirm bookings,
- clients do not accept/decline final offers,
- pricing is starting-from guidance,
- final-offer price is the agreed price,
- cash remains the only v1 payment mode,
- commission tracking is internal and consistent,
- online payment, quote marketplace, payouts, and invoice/devis comparison stay hidden.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Contract | Done | Planning | Revised v1 launch truth documented |
| 01 - Auto-Confirmed Final Offers | Done | Codex | POST /final-offers now records provider agreement and returns confirmed booking |
| 02 - Pricing And Commission Policy | Done | Codex | Starting-from pricing and 10% internal economics aligned |
| 03 - Web V1 Flow Alignment | Done | Claude | Client final-offer accept/decline removed; offers shown as confirmed agreements |
| 04 - Mobile V1 Flow Alignment | Done | Claude | Client final-offer accept/decline removed; offers shown as confirmed agreements |
| 05 - Provider Onboarding Tightening | Not started | TBD | P1 onboarding and verification cleanup |
| 06 - Discovery Map Distance And Reviews | Not started | TBD | P2 unless promoted |
| 07 - V1 QA And Release Smoke | Not started | TBD | P0 after implementation |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-05-09 | Final offers are agreement records, not client approval requests | Client and provider have already agreed before provider records the final offer |
| 2026-05-09 | Provider-created final offer should immediately create or confirm booking | Removes duplicate client action and matches local workflow |
| 2026-05-09 | Client accept/decline final-offer UI is removed from v1 | Avoids asking the client to re-approve agreed terms |
| 2026-05-09 | Starting-from pricing stays as provider discovery guidance | Final price is negotiated in chat/phone and recorded in final offer |
| 2026-05-09 | Cash remains the only v1 payment mode | Online/mobile money payment comes later |
| 2026-05-09 | Quote marketplace, public job requests, payouts, and invoices stay hidden | Too complex for v1 launch |
| 2026-05-09 | 10% commission is treated as internal policy until display is approved | Product note references 10% example, but client launch flow should stay simple |
| 2026-05-09 | `POST /final-offers` stores agreement records as accepted and confirms or creates bookings immediately | Keeps the existing enum while removing client approval from the v1 path |
| 2026-05-09 | `POST /final-offers/:id/accept` remains idempotent for already-confirmed agreement records | Preserves backwards compatibility for older clients that still call accept |
| 2026-05-09 | `Booking.price` and `FinalOffer.price` remain the gross agreed client price, with integer `commissionPct`, `commissionAmt`, and `providerNetAmt` stored alongside it | Keeps the existing API shape while making the 10% economics explicit and consistent |
| 2026-05-09 | Provider-facing commission/net copy remains limited to existing provider-only booking and earnings surfaces; client-facing surfaces hide commission | Matches the internal-first commission policy without removing provider operational context already present |

## Open Questions

- Should provider-facing commission visibility expand beyond existing provider-only booking and earnings surfaces?
- Should direct booking request remain useful, or should chat plus provider-issued final offer become the primary path?
- Should phone verification be required before provider publish, or only before verified badge?
- Should the 24h verification promise be explicit in product copy before the admin workflow is tested?
- Should mandatory review mean hard blocking future bookings, or persistent review reminders?
- Should map/distance be promoted from P2 to required v1 launch scope?

## Known Starting Point

Docs already show the prior Kinshasa MVP reset as completed through workstreams 01-07, with QA in review:

- `docs/kinshasa-mvp-implementation/PROGRESS.md`

Current implementation characteristics:

- Final offers exist but currently support client accept/decline.
- Job requests and quote marketplace are hidden by launch flags by default.
- Booking and final-offer prices exist, but money representation is mixed between floats and integers.
- Booking earnings compute a hardcoded 10% fee.
- Provider onboarding collects most required fields, but identity/portfolio upload is placeholder behavior.
- Map/distance is not implemented as real provider search.

## How To Update This File

When starting work:

- Set the workstream status to `In progress`.
- Add owner/agent name.
- Add start date and scope note.

When finishing work:

- Set status to `Done` or `Blocked`.
- List changed files.
- List commands run and result.
- Add decisions to the Decisions Log.
- Add blockers or follow-ups to Open Questions or a new blocker section.

## Workstream Evidence

Add implementation evidence below as each workstream completes.

### 01 - Auto-Confirmed Final Offers

Status: Done on 2026-05-09 by Codex.

Changed files:

- `apps/backend/src/modules/bookings/bookings.service.ts`
- `apps/backend/src/modules/bookings/bookings.service.spec.ts`
- `apps/backend/src/test/launch/launch-critical.harness.spec.ts`
- `packages/api/src/endpoints.ts`
- `docs/v1-launch-alignment/PROGRESS.md`

Implementation notes:

- `POST /final-offers` now creates the final offer with status `ACCEPTED`, sets `acceptedAt`, creates a new `CONFIRMED` booking or updates the attached non-completed/non-cancelled booking, links the final offer to that booking, and returns both `finalOffer` and `booking`.
- Previous open final offers for the same booking are marked `CANCELLED` when corrected terms are recorded.
- Legacy pending final offers without a booking are marked `CANCELLED` within the same conversation, but accepted agreement history for other bookings is preserved.
- Existing pending bookings attached to a final offer are confirmed and updated with the final-offer title, description, scheduled date, address, duration, price, provider notes, and cash payment method.
- Existing confirmed or in-progress bookings can receive corrected final-offer terms without reverting their status.
- When no `bookingId` is supplied, a new confirmed booking is created even if the same conversation has older accepted, completed, or cancelled agreements.
- Completed and cancelled bookings reject new final offers.
- Both client and provider receive notifications when an agreement is recorded.
- `POST /final-offers/:id/accept` remains for backwards compatibility and returns the existing confirmed booking when the final offer is already accepted.
- `POST /final-offers/:id/decline` remains limited to legacy pending final offers; v1-created agreement records cannot be declined by the client.

Commands run:

- `pnpm --filter @kayu/backend test:bookings` - passed, 19 tests.
- `pnpm --filter @kayu/backend test:launch` - passed, 63 tests.
- `pnpm --filter @kayu/backend type-check` - passed.
- `pnpm --filter @kayu/api type-check` - passed.
- `pnpm --filter @kayu/schemas type-check` - passed.

Schema migration/push:

- Not run. No Prisma schema change was required for this workstream.

Manual/seeded scenario:

- Covered through `apps/backend/src/test/launch/launch-critical.harness.spec.ts`: provider `POST /final-offers` returns an `ACCEPTED` final offer and `CONFIRMED` cash booking; a legacy follow-up accept call remains successful and returns the same confirmed-booking contract.

### 02 - Pricing And Commission Policy

Status: Done on 2026-05-09 by Codex.

Changed files:

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/bookings/bookings.service.ts`
- `apps/backend/src/modules/bookings/bookings.service.spec.ts`
- `packages/schemas/src/models.ts`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/NearbyCard.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/NearbyCard.tsx`
- `apps/web/src/lib/booking-v2.ts`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/components/provider-profile/BookingForm.tsx`
- `apps/web/src/components/services/ServiceCard.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/mobile/src/lib/bookingV2.ts`
- `apps/mobile/src/components/providers/ProviderCard.tsx`
- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/screens/search/ProviderProfileScreen.tsx`

Implementation notes:

- Added integer `commissionPct`, `commissionAmt`, and `providerNetAmt` fields to `Booking` and `FinalOffer`; `price` remains the gross agreed client price.
- Final-offer creation stores 10% economics from the agreed price, and confirmed/created bookings copy the same economics from the final offer.
- Direct booking requests also store economics when an estimated price exists, so completion transactions have a consistent fallback if no final offer is recorded.
- Booking completion transactions now use stored booking economics for `amount`, `feeAmt`, and `netAmt` instead of re-deriving hardcoded math inline.
- Shared schemas expose the new economics fields for bookings and final offers.
- Provider cards and provider profile price surfaces now use starting-from copy (`À partir de ... FC` or `À partir de ... FC/h`).
- Booking request totals stay labeled as estimates; confirmed/in-progress booking labels now read `Prix convenu`.
- Removed the launch-facing settings claim that KAYOU takes no commission on cash payment.
- Existing provider-only booking detail and earnings surfaces continue to show commission/net values, now based on backend economics fields where available.

Search terms checked:

- `ne prend pas de commission`
- `commission KAYOU`
- `paiement securise`
- `paiement sécurisé`
- `paiement en ligne`
- `Mobile Money`
- `mobile money`
- `A partir de`
- `À partir de`
- `Prix convenu`
- `Prix estimé`
- `Total estimé`

Commands run:

- `pnpm --filter @kayu/backend exec prisma format` - passed.
- `pnpm --filter @kayu/backend exec prisma validate` - passed.
- `pnpm --filter @kayu/backend exec prisma generate` - passed.
- `pnpm --filter @kayu/backend run prisma:push` - passed; local PostgreSQL schema synced and Prisma Client regenerated.
- `pnpm --filter @kayu/backend test:bookings` - passed, 19 tests.
- `pnpm --filter @kayu/schemas type-check` - passed.
- `pnpm --filter @kayu/api type-check` - passed.
- `pnpm --filter @kayu/backend type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed.
- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/ui type-check` - passed.
- `pnpm --filter @kayu/backend test:launch` - passed, 63 tests.

Schema migration/push:

- No migration files exist in this repo. Ran `pnpm --filter @kayu/backend run prisma:push`; local database is in sync with the updated Prisma schema.

Manual/seeded scenario:

- Covered by backend unit and launch harness tests: provider-created final offers store `commissionPct: 10`, gross price, commission amount, provider net, and pass those economics to the confirmed booking and earning transaction.

### 03 - Web V1 Flow Alignment

Status: Done on 2026-05-10 by Claude.

Changed files:

- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `docs/v1-launch-alignment/PROGRESS.md`

Implementation notes:

- Removed client final-offer accept/decline UI from the chat thread: `acceptOffer`/`declineOffer` mutations and props are gone, and the `FinalOfferCard` no longer renders Accepter/Décliner buttons.
- `FinalOfferCard` now presents the agreement as a confirmed accord. Status labels read `Accord enregistré`, `Accord confirmé`, `Accord remplacé`, `Accord annulé`, `Accord expiré`, with a success-style chip for live agreements and a muted chip for cancelled ones.
- When the agreement has a linked booking, the card exposes a `Voir la réservation` action that routes to `/bookings/:id`. Provider create-offer mutation now invalidates booking list/detail caches alongside the existing message and final-offer caches.
- Provider-side dialog renamed to `Enregistrer l'accord final` with copy stating the booking is confirmed immediately. Header CTA reads `Enregistrer l'accord` (mobile: `Accord`).
- Booking detail `Accord` card subtitle updated from `Offre finale acceptée` to `Accord final confirmé`. Quote breakdown footer now shows `Prix convenu` instead of `Estimation` once the booking is past `PENDING`, and the empty-state copy distinguishes pending estimations from already-agreed bookings.
- Cash disclaimer remains visible on the offer card, the booking detail sidebar, the provider profile booking rail, and the booking flow recap.
- Pricing across web (`ProviderProfileClient`, booking flow recap, `BookingForm`, `ServiceCard`, mobile bottom bar) already follows the starting-from convention from workstream 02; no additional changes were required.
- Quote/devis (`/quotes/[id]`, `/pro/devis/new`) and job-request (`/pro/requests`, dashboard quick action, AppShell nav, provider dashboard inbox) routes remain gated behind `launchFlags.enableQuoteMarketplace` / `launchFlags.enableJobRequests` and stay hidden by default.
- Settings still surfaces Mobile Money & paiement en ligne with a `ComingLaterChip` so it is not presented as a launch-facing capability; admin payouts UI is internal and out of launch scope.

Search terms checked (web src, launch-facing surfaces):

- `Accepter` / `Décliner` / `Refuser` — no remaining final-offer accept/decline CTAs in `messages` flow.
- `Offre finale` — replaced with `Accord final` / `Accord` in chat surfaces.
- `paiement en ligne` / `paiement sécuris` / `Mobile Money` / `mpesa` / `airtel` / `orange money` / `escrow` / `stripe` — only present in Settings ("Coming later"), provider onboarding payout config, and admin/internal surfaces.
- `À partir de` / `A partir de` — present on provider rail, provider mobile bar, booking flow recap, BookingForm, ServiceCard, PremiumUpsell.
- `Prix convenu` — added to booking detail footer for non-pending bookings; preserved from workstream 02 for booking detail price label.
- `payout` / `Payouts` — only inside admin internal section (out of launch scope).

Manual routes checked:

- `/messages` — chat shows agreements without accept/decline; provider button labelled `Enregistrer l'accord`.
- `/bookings/:id` — `Accord final confirmé` subtitle; cash disclaimer visible; price label `Prix convenu` once confirmed/in-progress/completed.
- `/providers/:id` — sticky rail uses `À partir de` and cash disclaimer; mobile bottom bar mirrors copy.
- `/book/:providerId` — recap uses `À partir de … FC × Nh`, `Total estimé`, cash disclaimer.
- `/services` — provider cards inherit shared `À partir de` UI (workstream 02).
- `/quotes/:id`, `/pro/devis/new`, `/pro/requests` — return 404 unless `NEXT_PUBLIC_ENABLE_QUOTE_MARKETPLACE` / `NEXT_PUBLIC_ENABLE_JOB_REQUESTS` flags are set.

Commands run:

- `pnpm --filter @kayu/schemas build` - passed (refreshed dist after workstream 02 schema additions).
- `pnpm --filter @kayu/api build` - passed (refreshed dist so `finalOffersApi.create` returns the v1 `{ finalOffer, booking }` shape).
- `pnpm --filter @kayu/web type-check` - passed.

### 04 - Mobile V1 Flow Alignment

Status: Done on 2026-05-10 by Claude.

Changed files:

- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `docs/v1-launch-alignment/PROGRESS.md`

Implementation notes:

- Removed client final-offer accept/decline from the mobile chat: `acceptOfferMutation` and `declineOfferMutation` are gone, and `FinalOfferCard` no longer renders Accepter/Décliner/Discuter buttons. The card now exposes a single `Voir la réservation` action when a booking is linked and the agreement is live.
- `FinalOfferCard` status labels read `Accord enregistré`, `Accord confirmé`, `Accord remplacé`, `Accord annulé`, `Accord expiré`, with a success-style chip for live agreements and a muted chip for cancelled/expired records. Header overline reads `Accord final`.
- Provider create-offer mutation now warms the booking detail cache, invalidates booking list/detail queries, and surfaces an `Accord final enregistré : ...` system message. Error toasts and validation copy updated to "Accord final".
- Provider chat CTA renamed from `Envoyer une offre finale` to `Enregistrer l'accord final`. Inline form header reads `Enregistrer l'accord` with a sub-line confirming the booking is created immediately. Submit button reads `Enregistrer l'accord` (busy: `Enregistrement...`).
- Suggested chat reply updated from `Pouvez-vous m'envoyer une offre finale ?` to `Pouvez-vous enregistrer l'accord final ?`.
- Booking detail accord section subtitle now reads `Accord final confirmé` when a quote exists, `Estimation` only while pending, and `Demande directe` once the booking is past `PENDING` without a stored quote. Non-pending direct bookings show `Prix convenu` / `Durée convenue` instead of the estimated labels.
- Booking flow recap and date hint copy updated: replaced references to `offre finale` with `accord final` and clarified that the pro can confirm the price by enregistrant l'accord.
- Pricing across mobile (`ProviderProfileScreen` sticky bar, `ProviderCard`, booking flow header/footer/recap, booking detail price label via `bookingV2.priceLabelFor`) already follows the starting-from convention from workstream 02; no additional changes were required.
- Cash payment copy remains visible on the agreement card, the inline final-offer form, the booking detail help/footer block, and the booking-flow recap protected panel.
- Job request and quote marketplace screens (`JobRequestsScreen`, `ClientRequestsScreen`, `QuoteComposeScreen`) and their nav entries remain gated behind `launchFlags.enableJobRequests` / `launchFlags.enableQuoteMarketplace` and stay hidden by default. No mobile-facing online-payment, mobile-money, escrow, payout, or invoice copy was introduced.

Search terms checked (mobile src):

- `Accepter` / `Décliner` / `Refuser` — only remaining usages are the provider booking-request accept/decline (PENDING booking flow) and the flag-gated job-requests/quotes screens; no final-offer accept/decline UI remains.
- `Offre finale` / `offre finale` — replaced with `Accord final` / `accord final` in chat, booking flow, and recap copy.
- `paiement en ligne` / `paiement sécuris` / `Mobile Money` / `mpesa` / `airtel` / `orange money` / `escrow` / `stripe` — only present inside flag-gated provider screens (`EarningsScreen`, `JobRequestsScreen`, `QuoteComposeScreen`, `ProviderOnboardingScreen` payment method enum); no client launch-facing usage.
- `À partir de` / `A partir de` — present on `ProviderCard`, `ProviderProfileScreen` sticky bar, `BookingScreen` header/footer/recap.
- `Prix convenu` — added to booking detail for non-pending direct bookings; preserved from workstream 02 inside `bookingV2.priceLabelFor`.
- `payout` / `Payouts` — only inside flag-gated job-request/quote screens.

Manual routes checked:

- `Messages → Chat` (client perspective): chat shows agreements without accept/decline; provider CTA labelled `Enregistrer l'accord final`; suggested reply prompts updated agreement copy.
- `Messages → Chat` (provider perspective): inline form opens with v1 copy and creates a confirmed booking; agreement card surfaces `Voir la réservation` once the booking exists.
- `Bookings → BookingDetail`: `Accord` section subtitle reads `Accord final confirmé` once the agreement is recorded; `Estimation` only on PENDING; `Demande directe` for direct bookings without quote; cash disclaimer block visible.
- `Search → ProviderProfile`: sticky rail shows `À partir de … FC /h` and rating chip.
- `Search → CreateBooking`: header pricing line, recap line, and total row keep `À partir de` / `Total estimé`; cash protected panel describes the pro confirming the prix final by enregistrant l'accord.
- `Pro tab → Requests` and `Client tab → Requests`: only mounted when `EXPO_PUBLIC_ENABLE_JOB_REQUESTS=true`; `QuoteCompose` only mounted when either job-requests or quote-marketplace flag is enabled.

Commands run:

- `pnpm --filter @kayu/mobile type-check` - passed.

Schema migration/push:

- Not run. Workstream 04 is mobile-only and depends on schema/API changes already shipped in workstreams 01–02.

Manual/seeded scenario:

- Not exercised on a device/simulator in this session. Behavior validated through TS type-check and code-level review of the cache invalidation, navigation, and copy paths described above. Device walkthrough is recommended as part of workstream 07 QA.
