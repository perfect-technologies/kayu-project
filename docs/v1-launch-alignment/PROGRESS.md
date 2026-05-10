# KAYOU V1 Launch Alignment - Progress

## Status Summary

Created: 2026-05-09

This workstream aligns the existing Kinshasa MVP implementation with the latest v1 product feedback:

- final offers auto-confirm bookings,
- clients do not accept/decline final offers,
- pricing is fixed starting-from guidance, not hourly pricing,
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
| 05 - Provider Onboarding Tightening | Done | Claude | P1 onboarding tightened: max-3 categories enforced, experience required, deferred uploads, Kinshasa communes expanded, 24h verification copy aligned |
| 06 - Fixed Starting Price Model | Done | Claude | Hourly-rate launch semantics removed across web/mobile; direct booking estimate now uses provider starting price without × duration |
| 07 - Discovery Map Distance And Reviews | Not started | TBD | P2 unless promoted |
| 08 - V1 QA And Release Smoke | Not started | TBD | P0 after implementation |

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
| 2026-05-10 | Phone verification is required for the verified badge only, not for provider publish | Auth currently does not write `phoneVerifiedAt` automatically, so gating publish on it would block onboarding; the badge path through `/pro/verify` already exposes phone/identity verification to providers |
| 2026-05-10 | Years of experience is required for provider publish; at-least-one skill remains optional | Experience appears on profile cards and shapes the Trust score baseline; skills stay category-driven suggestions until product confirms a hard requirement |
| 2026-05-10 | Max 3 service categories is enforced both at draft validation and on `PATCH /providers/me` | Aligns the provider-facing UI limit with the backend, preventing drift via direct profile edits after onboarding |
| 2026-05-10 | `zoneRadiusKm` stays in the onboarding draft JSON for v1 | Discovery does not yet read it (workstream 07 is P2); promoting it to a Provider column would be hypothetical work |
| 2026-05-10 | Identity uploads and portfolio photos are surfaced as deferred panels (no fake toggles) in onboarding | Real upload happens in `/pro/verify` and the portfolio gallery is post-launch; pretending otherwise misleads providers about what is actually saved |
| 2026-05-10 | Starting-from provider pricing means fixed base price, not hourly rate | Product clarified providers set a usual starting price for the service (`À partir de 10 000 FC`); launch UI must not show `FC/h`, `/h`, `/heure`, or multiply by duration |
| 2026-05-10 | Direct booking estimate is sent as the provider starting price (option 1 of workstream 06) | Keeps `Booking.price` populated for downstream commission/economics math; still labelled as an estimate until the provider records the final-offer accord |
| 2026-05-10 | Backend Prisma column `Provider.hourlyRate` is kept; no immediate rename | Workstream 06 explicitly defers the DB rename to limit blast radius; comments at the schema/service boundary now document that the field semantically holds the starting price |

## Open Questions

- Should provider-facing commission visibility expand beyond existing provider-only booking and earnings surfaces?
- Should direct booking request remain useful, or should chat plus provider-issued final offer become the primary path?
- Should phone verification be required before provider publish, or only before verified badge?
- Should the 24h verification promise be explicit in product copy before the admin workflow is tested?
- Should mandatory review mean hard blocking future bookings, or persistent review reminders?
- Should map/distance be promoted from P2 to required v1 launch scope?
- Should the existing `Provider.hourlyRate` column be renamed after v1, or kept with adapter-level `startingPrice` naming?

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
- Provider cards and provider profile price surfaces now use starting-from copy. Note: the `FC/h` interpretation from this workstream was superseded by workstream 06; launch pricing must be fixed `À partir de ... FC`.
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
- `Search → ProviderProfile`: sticky rail shows starting-from pricing and rating chip. Note: workstream 06 must remove the remaining hourly unit.
- `Search → CreateBooking`: header pricing line, recap line, and total row keep `À partir de` / `Total estimé`; cash protected panel describes the pro confirming the prix final by enregistrant l'accord.
- `Pro tab → Requests` and `Client tab → Requests`: only mounted when `EXPO_PUBLIC_ENABLE_JOB_REQUESTS=true`; `QuoteCompose` only mounted when either job-requests or quote-marketplace flag is enabled.

Commands run:

- `pnpm --filter @kayu/mobile type-check` - passed.

Schema migration/push:

- Not run. Workstream 04 is mobile-only and depends on schema/API changes already shipped in workstreams 01–02.

Manual/seeded scenario:

- Not exercised on a device/simulator in this session. Behavior validated through TS type-check and code-level review of the cache invalidation, navigation, and copy paths described above. Device walkthrough is recommended as part of workstream 07 QA.

### 05 - Provider Onboarding Tightening

Status: Done on 2026-05-10 by Claude.

Changed files:

- `packages/schemas/src/dto.ts`
- `apps/backend/src/modules/providers/providers.service.ts`
- `apps/backend/src/modules/onboarding/onboarding.service.ts`
- `apps/backend/src/modules/onboarding/onboarding.service.spec.ts`
- `apps/web/src/app/pro/onboarding/types.ts`
- `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx`
- `apps/web/src/app/pro/verify/fixtures.ts`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `apps/mobile/src/screens/pro/onboardingData.ts`
- `apps/mobile/src/screens/pro/verifyData.ts`
- `docs/v1-launch-alignment/PROGRESS.md`

Implementation notes:

- Backend now enforces a max of 3 service categories on `PATCH /providers/me` (the onboarding draft already capped at 3 via `ProviderDraftDto`, and `UpdateProviderDto.categoryIds` now also has `.max(3)`).
- `OnboardingService.validateForPublish` now requires `yearsOfExperience` to be set, in addition to the existing first/last name, phone, profession, primary category, service zones and positive provider price checks. New regression test `provider publish requires explicit years of experience` covers this.
- Phone verification is not required for publish; `phoneVerifiedAt` continues to gate the verified badge through the existing `/pro/verify` flow only.
- Web onboarding step 1 replaces the recto/verso click toggles with a deferred-state panel that links the provider to the post-publish verification flow and states "L'équipe KAYOU revoit ton dossier sous 24h pour activer le badge « Vérifié »."
- Web onboarding step 5 portfolio replaces the fake "click-to-fill" tiles with a deferred panel ("La galerie photos sera activée prochainement"). The misleading green `Nouveau · Vérifié` preview chip on step 6 is now a neutral `Nouveau prestataire` chip and the preview price uses the starting-from convention with a cash disclaimer. Note: workstream 06 must remove any remaining hourly unit.
- Mobile onboarding step 1 mirrors the web change: the fake recto/verso tiles are replaced with the same deferred panel, and the step 1 validator no longer requires `id.front`/`id.back`.
- Mobile onboarding step 4 reminds providers that the final price is convenu avec le client. Step 5 portfolio is the same deferred panel as web. The publish preview shows `À partir de` with the cash disclaimer line. Note: workstream 06 must remove any remaining hourly unit.
- Both web and mobile commune lists collapse to Kinshasa only with the full official 24-commune list (Bandalungwa, Barumbu, Bumbu, Gombe, Kalamu, Kasa-Vubu, Kimbanseke, Kinshasa, Kintambo, Kisenso, Lemba, Limete, Lingwala, Makala, Maluku, Masina, Matete, Mont Ngafula, Ndjili, Ngaba, Ngaliema, Ngiri-Ngiri, Nsele, Selembao). Lubumbashi/Brazzaville/Pointe-Noire entries were removed for the v1 Kinshasa-only launch.
- Verification copy is aligned to "sous 24h" in both `apps/web/src/app/pro/verify/fixtures.ts` and `apps/mobile/src/screens/pro/verifyData.ts`, matching the onboarding publish-step promise.
- `zoneRadiusKm` continues to live in the onboarding draft JSON; discovery does not read it yet (workstream 07 is P2), so no Prisma schema change was made.

Search terms checked:

- `Pièce d'identité`, `Recto`, `Verso`, `idFrontUploaded`, `idBackUploaded` — fake upload toggles are gone from web/mobile onboarding; only the API-stored draft flags remain (always false).
- `moins de 2 heures` — no remaining instances; verification copy is uniformly `sous 24h`.
- `Nouveau · Vérifié` — chip removed; preview now shows `Nouveau prestataire`.
- `categoryIds`, `max(3)` — schema and service both enforce the max-3 cap on draft and update flows.
- `À partir de`, `Prix convenu` — present in onboarding step 4 hint, mobile preview, web preview, matching the workstream 02 starting-from convention.

Manual onboarding path checked (code-level, not on device):

- `/pro/onboarding` step 1 → ID block is read-only deferred copy, name + phone still required to continue.
- `/pro/onboarding` step 2 → up to 3 categories selectable, additional categories show the lock icon and don't add.
- `/pro/onboarding` step 3 → only Kinshasa is offered with the expanded commune list; the radius slider stays in JSON draft.
- `/pro/onboarding` step 4 → starting-from copy + cash disclaimer.
- `/pro/onboarding` step 5 → bio required, photo and portfolio panels are deferred.
- `/pro/onboarding` step 6 → preview shows neutral "Nouveau prestataire" chip and "Profil vérifié sous 24h" promise; publish requires `yearsOfExperience` server-side.

Commands run:

- `pnpm --filter @kayu/schemas type-check` — passed.
- `pnpm --filter @kayu/schemas build` — passed.
- `pnpm --filter @kayu/api type-check` — passed.
- `pnpm --filter @kayu/api build` — passed.
- `pnpm --filter @kayu/backend type-check` — passed.
- `pnpm --filter @kayu/backend test:onboarding` — passed (16 tests, including the new years-of-experience publish guard).
- `pnpm --filter @kayu/backend test:launch` — passed (64 tests).
- `pnpm --filter @kayu/web type-check` — passed.
- `pnpm --filter @kayu/mobile type-check` — passed.

Schema migration/push:

- Not run. No Prisma schema change was required for this workstream; `zoneRadiusKm` stays in the onboarding draft JSON until discovery uses it.

Manual/seeded scenario:

- Backend regression coverage in `apps/backend/src/modules/onboarding/onboarding.service.spec.ts`: provider publish now rejects drafts missing `yearsOfExperience` with a `BadRequestException` whose `missing` array contains `yearsOfExperience`, alongside the existing checks for `phone`, `serviceZones`, and `primaryCategoryId`.

### 06 - Fixed Starting Price Model

Status: Done on 2026-05-10 by Claude.

Changed files:

- `packages/ui/src/cards.ts`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/web/WideProviderCard.tsx`
- `packages/ui/src/web/ProviderShowcaseCard.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/WideProviderCard.tsx`
- `packages/schemas/src/dto.ts`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/providers/providers.service.ts`
- `apps/backend/src/modules/onboarding/onboarding.service.ts`
- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/components/provider-profile/BookingForm.tsx`
- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/web/src/components/settings/VisibilitySettings.tsx`
- `apps/mobile/src/components/providers/ProviderCard.tsx`
- `apps/mobile/src/screens/search/ProviderProfileScreen.tsx`
- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `docs/v1-launch-alignment/PROGRESS.md`

Implementation notes:

- No Prisma migration. `Provider.hourlyRate` is kept as the storage column for the provider starting price; the column comment now states it is a fixed base price (FC), not an hourly rate.
- Backend publish validation (`OnboardingService.validateForPublish`) still requires a positive `hourlyRate`; comment now documents that the value semantically represents the starting price.
- API/DTO surface keeps `hourlyRate` and `sortBy: "hourlyRate"` for wire compatibility; both have inline comments documenting that they represent the provider starting price (not an hourly rate). Sort labels in the web filter (`Prix croissant` / `Prix décroissant`) already say price.
- Shared UI card prop kept as `hourly` on `ProviderCardData` with an updated doc comment. `PriceLine` no longer displays a `/h` or `/heure` suffix on either web or mobile; suffix prop is now optional and unused. `ProviderShowcaseCard` no longer renders the trailing `/h`.
- Web provider profile (`ProviderProfileClient`) sticky rail and mobile bottom bar now show `À partir de … FC` with no `/h` suffix; `À convenir` fallback uses `Prix de départ` instead of `Tarif`.
- Web direct booking flow (`BookingFlowClient`) no longer computes `total = hourly × duration`. The recap line shows `Prix de départ` and `Prix indicatif: À partir de … FC`. `bookings.create({ price })` is sent as the provider starting price (option 1 of the workstream doc).
- Web provider booking modal (`BookingForm`) uses the same starting price as the estimated price and renders `Prix de départ` / `À partir de … FC` instead of `Prix estimé / × heure`.
- Web onboarding step 4 (`StepPricing`) field label is `Prix de départ`; hint and preview no longer mention `/heure`. The amber info card now reads `Prix de départ moyen à Kinshasa … par intervention`. Preview and FC suffix in the input dropped the trailing `/h`.
- Web settings: `Tarif horaire` switch label renamed to `Prix de départ`; dashboard settings `Tarif horaire de référence` card retitled `Prix de départ de référence`. The web services filter section title changed from `Prix horaire` to `Prix de départ`.
- Mobile provider card (`ProviderCard`) and provider profile sticky bar (`ProviderProfileScreen`) no longer render `/h`. Removed unused `priceSuffix` style.
- Mobile direct booking flow (`BookingScreen`) sends `price = provider.hourlyRate` and the recap displays `Prix de départ` / `Prix indicatif: À partir de … FC` with no `× duration` multiplication.
- Mobile onboarding step 4 (`StepPricing`) field label is `Prix de départ`; the input suffix is `FC`; the preview drops `/heure`; info card mirrors the web copy.
- Booking detail surfaces (`BookingDetail.tsx` web, `BookingDetailScreen.tsx` mobile, `bookingV2.priceLabelFor`) already used the workstream 02 `Prix convenu` / `Estimation` copy; no further changes were needed.
- Direct booking flows still capture `duration` for scheduling context only; the value is sent on the booking create payload but no longer multiplies the price.

Search terms checked (launch-facing app/package source):

- `FC/h` — only remaining hits are in `apps/web/src/app/design/page.tsx:221` and `apps/mobile/src/screens/DesignProbeScreen.tsx:186`, both of which are dev-only design-system probes used to demonstrate JetBrains Mono font rendering. No launch-facing pricing UI uses `FC/h`.
- `/h` — no remaining hits in launch-facing UI; the only matches are inside the two design probes above.
- `/heure` / `par heure` — no remaining hits anywhere under `apps/` or `packages/`.
- `Tarif horaire` / `Prix horaire` — no remaining hits anywhere under `apps/` or `packages/`.
- `× duration` / `* duration` — no remaining `hourlyRate × duration` or `hourly × duration` price multiplications.
- `hourlyRate` — still present internally as the database column, the API DTO field, the search/sort key, and within backend services. All retained occurrences semantically represent the provider starting price; the schema column comment, the providers/onboarding service comments, and the schemas DTO sort enum comment now document this. Renaming the column is deferred until a follow-up workstream.
- `hourly` — still present as the shared UI card prop name (`ProviderCardData.hourly`) and the helpers `formatHourly` / `formatHourlyCompact`. Field doc comment and helper comment now explicitly state the value is the provider starting price; renaming is deferred to avoid widespread call-site churn.

Remaining internal `hourlyRate` compatibility points (intentional, documented):

- `Provider.hourlyRate` Prisma column (storage). Comment in `apps/backend/prisma/schema.prisma` notes it is the starting price, not an hourly rate.
- Backend services (`providers.service.ts`, `onboarding.service.ts`, `dashboard.service.ts`, `favorites.service.ts`, `quotes.service.ts`, `admin.service.ts`, `identity.service.ts`, `categories.service.ts`, `bookings.service.ts`) and seed data continue to read/write the field under the legacy name; the public meaning has been clarified at the schema/service boundary.
- API DTOs (`packages/schemas/src/dto.ts`, `packages/api`) continue to expose `hourlyRate` and `sortBy: "hourlyRate"` for wire compatibility.
- Settings flag `showHourlyRate` retained for client/server compatibility; user-facing label is now `Prix de départ`.
- Web onboarding draft state (`ProviderOnboardingClient`, `OnboardingSteps`) and mobile onboarding state (`ProviderOnboardingScreen`, `onboardingData.ts`) keep the local `hourly` field name in form state to map to the existing API field.

Commands run:

- `pnpm --filter @kayu/ui type-check` — passed.
- `pnpm --filter @kayu/ui build` — passed.
- `pnpm --filter @kayu/schemas type-check` — passed.
- `pnpm --filter @kayu/schemas build` — passed.
- `pnpm --filter @kayu/backend type-check` — passed.
- `pnpm --filter @kayu/backend test:onboarding` — passed (16 tests).
- `pnpm --filter @kayu/backend test:bookings` — passed (19 tests).
- `pnpm --filter @kayu/backend test:launch` — passed (64 tests).
- `pnpm --filter @kayu/web type-check` — passed.
- `pnpm --filter @kayu/mobile type-check` — passed.

Schema migration/push:

- Skipped. The Prisma column `Provider.hourlyRate` is kept as-is per the workstream's "no immediate DB migration" guidance; only the column comment was updated. A follow-up workstream may rename the column with `@map("hourlyRate")` once API/UI naming churn is paid down.

Manual routes checked (code-level, not on device/browser):

- `/services` (web) — provider cards via shared UI no longer render `/h`; filter section title is `Prix de départ`.
- `/providers/:id` (web) — sticky booking rail and mobile bottom bar render `À partir de … FC` with no `/h`; `À convenir` fallback uses `Prix de départ`.
- `/book/:providerId` (web) — recap shows `Prix de départ` and `Prix indicatif: À partir de … FC`; cash disclaimer preserved; submitted `price` equals the provider starting price (no × duration).
- `/pro/onboarding` step 4 (web) — `Prix de départ` field label, FC suffix, info card and preview free of hourly wording; cash disclaimer preserved.
- `/dashboard/settings` (web) — `Prix de départ de référence` card and `Prix de départ` visibility toggle replace the prior `Tarif horaire` copy.
- Mobile `Search → ProviderProfile` — sticky rail shows `À partir de … FC` with no `/h`.
- Mobile `Search → CreateBooking` (`BookingScreen`) — header/footer caption shows `À partir de … FC`; recap totals show `Prix de départ` and `Prix indicatif: À partir de … FC`; submitted `price` equals the provider starting price (no × duration).
- Mobile `Pro tab → ProviderOnboarding` step 4 — `Prix de départ` field label, FC suffix, preview and info card mirror web copy.
