# KAYOU Kinshasa MVP - Progress

## Status Summary

Created: 2026-04-25

The product decision is to launch with a simplified Kinshasa MVP:

- direct provider discovery,
- direct chat,
- direct booking,
- final offer after discussion,
- cash payment,
- simple completion and review.

Job requests and multi-provider quote competition are deferred for launch.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Reset | Done | Planning | Product direction documented |
| 01 - Feature Flags And Navigation Cleanup | Done | Codex | Launch flags default off; request/quote marketplace hidden from web/mobile navigation |
| 02 - Backend Final Offer And Booking Lifecycle | Done | Codex | First-class final-offer API creates/confirms cash bookings without job requests |
| 03 - Web Direct Flow | Done | Codex | Web direct discovery/chat/booking/final-offer launch flow completed |
| 04 - Mobile Direct Flow | Done | Codex | Mobile direct discovery/chat/booking/final-offer launch flow completed |
| 05 - Discovery Filters And Provider Profile | Done | Codex | Discovery filters/profile surfaces are launch-truthful; fake map/distance/availability claims removed |
| 06 - Cash Payment And Copy Cleanup | Done | Codex | Launch-facing payment/lifecycle copy aligned to cash-first MVP; payout/mobile-money/en-route/arrived claims removed |
| 07 - Provider Operations And Dashboards | Done | Codex | Provider dashboards now handle direct bookings, messages, completion, and cash history |
| 08 - Launch QA And Smoke Tests | Not started | Unassigned | Final smoke scenarios and release evidence |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-04-25 | Defer job requests and quote competition for launch | Too complex for Kinshasa MVP; direct conversation is more market-appropriate |
| 2026-04-25 | Keep cash as the only launch payment mode | Mobile money/online payment can come later; launch flow must be clear |
| 2026-04-25 | Remove en route / arrived from launch-facing UI | Not needed for MVP and not fully modeled in backend |
| 2026-04-25 | Add final offer after discussion | Gives both parties a simple agreement without quote competition |
| 2026-04-25 | Model final offers as first-class backend records | Keeps the launch agreement flow independent from job requests and competitive quotes while still linking to conversations/bookings |
| 2026-04-25 | Mobile cash completion can be confirmed from completed booking detail | Launch payment is cash; the UI exposes the existing booking paid flag without introducing mobile money or invoices |

## Open Questions

- Should phone call be a primary CTA everywhere provider phone is visible and allowed?
- Should provider completion require client cash confirmation before review, or can review happen after provider marks completed?

## Workstream 01 Evidence

Completed: 2026-04-25

Changed files:

- `apps/web/src/lib/launch-flags.ts`
- `apps/web/.env.example`
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/dashboard/QuickActions.tsx`
- `apps/web/src/app/pro/ProviderDashboardClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/app/pro/requests/page.tsx`
- `apps/web/src/app/pro/devis/new/page.tsx`
- `apps/web/src/app/quotes/[id]/page.tsx`
- `apps/mobile/src/lib/launchFlags.ts`
- `apps/mobile/.env.example`
- `apps/mobile/src/env.d.ts`
- `apps/mobile/src/navigation/AppNavigator.tsx`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`

Commands run:

- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed.
- `rg -n "(/pro/requests|/pro/devis|/quotes|Requests\" component|Requests' component|QuoteCompose\" component|QuoteCompose' component)" apps/web/src apps/mobile/src -g '!*.map'` - remaining request/quote routes are inside flag-gated navigation or disabled route components.

Routes and screens checked:

- Web provider shell no longer shows `/pro/requests` unless `NEXT_PUBLIC_ENABLE_JOB_REQUESTS=true`.
- Web provider dashboard hides request inbox CTAs and quote composer links unless job requests are enabled.
- Web `/pro/requests` redirects to `/pro` when job requests are disabled.
- Web `/pro/devis/new` redirects to `/pro` when quote marketplace is disabled.
- Web `/quotes/[id]` redirects to `/bookings` when quote marketplace is disabled.
- Web booking detail provider back action now returns to `/bookings`, not `/pro/requests`.
- Mobile client tabs omit `Requests` unless `EXPO_PUBLIC_ENABLE_JOB_REQUESTS=true`.
- Mobile provider tabs omit `Requests`, keep dashboard/messages/earnings/profile, and add `Bookings`.
- Mobile provider dashboard hides new job-request quote cards unless job requests are enabled; direct booking requests remain visible.

Hidden routes intentionally left in repo:

- Existing job request, provider inbox, quote composer, and quote detail code remains available behind flags for later internal reactivation.

## Workstream 02 Evidence

Completed: 2026-04-25

Changed files:

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/bookings/bookings.module.ts`
- `apps/backend/src/modules/bookings/bookings.service.ts`
- `apps/backend/src/modules/bookings/bookings.service.spec.ts`
- `apps/backend/src/modules/bookings/final-offers.controller.ts`
- `apps/backend/src/test/launch/launch-critical.harness.spec.ts`
- `packages/schemas/src/enums.ts`
- `packages/schemas/src/models.ts`
- `packages/schemas/src/dto.ts`
- `packages/api/src/endpoints.ts`
- `packages/api/src/index.ts`
- `packages/api/src/query-keys.ts`

Backend/API contract added:

- `GET /final-offers`
- `POST /final-offers`
- `GET /final-offers/:id`
- `POST /final-offers/:id/accept`
- `POST /final-offers/:id/decline`

Behavior implemented:

- Provider can send a cash-only final offer to a client with optional `conversationId` and optional pending `bookingId`.
- Final offers can only target users with the `CLIENT` role.
- Client can accept a pending final offer.
- Accepting creates a confirmed booking when no booking exists.
- Accepting updates an attached pending booking to confirmed when `bookingId` exists.
- Expired final offers are persisted as `EXPIRED` before acceptance rejects.
- Client can decline a pending final offer and continue discussion.
- Final-offer notifications are created for sent, accepted, and declined events.
- Authorization rejects providers sending offers for another provider and rejects non-target clients accepting/declining.
- Quote/job-request flow is not required and is not mutated by final-offer acceptance.

Commands run:

- `pnpm --filter @kayu/backend prisma:generate` - passed.
- `pnpm --filter @kayu/backend prisma:push` - passed; synced local PostgreSQL database `kayu` on `localhost:5433`.
- `pnpm --filter @kayu/schemas build` - passed.
- `pnpm --filter @kayu/schemas type-check` - passed.
- `pnpm --filter @kayu/api type-check` - passed.
- `pnpm --filter @kayu/backend exec prisma format` - passed.
- `pnpm --filter @kayu/backend exec prisma validate` - passed.
- `pnpm --filter @kayu/backend type-check` - passed.
- `pnpm --filter @kayu/backend test:bookings` - passed, 16 tests.
- `pnpm --filter @kayu/backend test:launch` - passed, 58 tests.

Seeded API scenario used:

- `apps/backend/src/test/launch/launch-critical.harness.spec.ts` includes `final offer route lets provider send terms and client accept into booking`.
- Seeded provider posts `/final-offers` for seeded client with cash terms.
- Seeded client posts `/final-offers/:id/accept`.
- Test verifies the final offer becomes `ACCEPTED`, returned booking is `CONFIRMED`, payment method is `cash`, and existing quote state is unchanged.

Review follow-up:

- Added validation that `clientId` must resolve to a `CLIENT` user before creating a final offer.
- Moved expired-offer persistence outside the throwing accept transaction so `EXPIRED` is not rolled back.
- Added regression coverage for non-client targets and expired-offer persistence.

Schema migration:

- Added Prisma `FinalOfferStatus`, `FinalOffer` model, final-offer relations, and final-offer notification types.
- No migration directory exists in the current backend; no migration file was added.
- Applied the schema through the project’s existing Prisma push workflow to local PostgreSQL database `kayu` on `localhost:5433`.

## Workstream 03 Evidence

Completed: 2026-04-25

Changed files:

- `apps/web/src/app/HomePageClient.tsx`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/app/messages/page.tsx`
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/app/pro/ProviderDashboardClient.tsx`
- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- `apps/web/src/app/review/[providerId]/WriteReviewClient.tsx`
- `apps/web/src/app/review/[providerId]/page.tsx`
- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/components/pro/JobCard.tsx`
- `apps/web/src/components/pro/types.ts`
- `apps/web/src/components/provider-profile/BookingForm.tsx`
- `apps/web/src/components/provider-profile/ContactDialog.tsx`
- `apps/web/src/components/providers/ProviderCard.tsx`
- `apps/web/src/lib/booking-v2.ts`

Behavior implemented:

- Web home copy now describes provider discovery, direct discussion, direct reservation, final offer, and cash payment.
- Provider profile primary actions are direct contact/message, optional phone call, and `Demander une réservation`; secure-payment/devis copy was removed from launch-facing profile surfaces.
- Services discovery now preserves and applies `subcategory` URL filters from category subcategory links.
- Direct booking uses future dates instead of hardcoded April dates, removes online-style service fee display, and routes successful bookings to `/bookings/[id]`.
- Booking detail uses the launch lifecycle in visible UI: pending, confirmed, completed, cancelled; en-route/arrived/start steps are not shown in visible booking/pro dashboard flows.
- Provider can send an `Offre finale` from an existing client conversation.
- Client can accept or decline a pending final offer in chat; accept routes to the confirmed booking detail.
- Final-offer duration display now preserves partial hours such as `1h30`, and the final-offer form shows an inline validation error for invalid duration values.
- Review page now blocks review submission unless the attached booking exists, belongs to the provider, and is `COMPLETED`.
- Category provider card message icon no longer links to unsupported `/messages?to=...`; it opens the provider profile where message creation is supported.
- `AppShell` now Suspense-wraps the admin-tab search-param reader so `/bookings` can prerender during production build.

Commands run:

- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/web build` - passed.
- `rg -n "Devis|devis|paiement sécurisé|Paiement sécurisé|secure payment|En route|Arrivé|arrived|Démarrer|demandes qualifiées" apps/web/src/app/page.tsx apps/web/src/app/HomePageClient.tsx apps/web/src/app/services apps/web/src/app/categories apps/web/src/app/providers apps/web/src/app/book apps/web/src/app/bookings apps/web/src/app/messages apps/web/src/components/provider-profile apps/web/src/components/bookings apps/web/src/components/providers apps/web/src/lib -g '!*.map'` - no launch-facing matches.
- `pnpm --filter @kayu/web exec next dev -p 3002` - blocked by an existing Next dev server for `apps/web` already running at `http://localhost:3000` (PID 23159).

Routes and flows checked:

- `/` copy points to finding a provider, direct discussion, final offer, and cash payment.
- `/services?category=...&subcategory=...` now carries both filters into provider search.
- `/providers/[id]` launch CTAs are contact/message, optional call, and direct booking.
- `/book/[providerId]` creates a direct booking with cash completion copy and redirects to booking detail.
- `/messages` supports first-message conversations via provider profile and final-offer send/accept/decline.
- `/bookings/[id]` shows launch lifecycle, chat, completion, cash confirmation, and completed-only review entry.
- `/review/[providerId]?bookingId=...` rejects non-completed or mismatched bookings before submit.

Hidden launch-deferred routes intentionally left in repo:

- Existing job-request inbox, quote composer, and quote detail routes remain behind the launch flags from workstream 01.

## Workstream 04 Evidence

Completed: 2026-04-25

Changed files:

- `apps/mobile/src/components/bookings/BookingStatusBadge.tsx`
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/lib/bookingV2.ts`
- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingsScreen.tsx`
- `apps/mobile/src/screens/bookings/ReviewScreen.tsx`
- `apps/mobile/src/screens/home/HomeScreen.tsx`
- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/search/ProviderProfileScreen.tsx`

Behavior implemented:

- Mobile home copy now points to finding a pro, direct discussion, direct reservation, and cash payment.
- Provider profile keeps discovery/favorites/reviews and exposes direct message, optional phone call, and a direct reservation request CTA.
- Direct booking no longer uses a hardcoded April calendar; clients choose a future requested day/time and the UI explains the pro confirms it in chat or by final offer.
- Direct booking and booking detail use cash-only launch copy: `Paiement en espèces à la fin de la mission`.
- Mobile chat now reads and writes final offers through `finalOffersApi`.
- Provider can create an `Offre finale` from a conversation after discussion.
- Client can accept, decline, or continue discussion on a pending final offer in chat; accepting routes to the created/confirmed booking.
- Booking detail launch lifecycle shows pending/confirmed/completed/cancelled only; visible en-route/start/facture/devis language was removed from launch-facing mobile booking surfaces.
- Provider can confirm/cancel direct booking requests and mark confirmed work completed.
- Client and provider can confirm cash payment on completed bookings where applicable.
- Client review remains gated to completed bookings.
- Existing client request tab and provider request inbox remain hidden unless launch flags re-enable job requests.

Review follow-up:

- Fixed mobile provider completion to keep one visible `Marquer comme terminée` action while sending the backend-required hidden transition `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`.
- Removed client-side cash confirmation from completed booking detail because the backend only allows providers/admins to confirm payment.
- Verified final-offer backend validation already rejects non-client targets and has regression coverage in `bookings.service.spec.ts`.

Commands run:

- `pnpm --filter @kayu/mobile type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed after review follow-up.
- `pnpm --filter @kayu/mobile lint` - passed; script reports `no linter configured`.
- `git diff --check` - passed.
- `rg -n "Devis|devis|paiement protégé|Paiement protégé|Paie protégé|Remboursement|En route|Arrivé|arrivé|arrived|Démarrer|Suivre|Facture|demandes qualifiées" apps/mobile/src/screens/home apps/mobile/src/screens/search apps/mobile/src/screens/booking apps/mobile/src/screens/bookings apps/mobile/src/screens/messages apps/mobile/src/components/bookings apps/mobile/src/components/providers apps/mobile/src/lib -g '!*.map'` - no launch-facing matches.
- `rg -n "MainTab.Screen name=\"Requests\"|QuoteCompose|JobRequestsScreen|ClientRequestsNavigator|enableJobRequests|enableQuoteMarketplace" apps/mobile/src/navigation/AppNavigator.tsx apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx` - request/quote routes remain flag-gated.
- `rg -n "Confirmer le paiement espèces|Paiement effectué|updateMutation\\.mutate\\(\\{ status: 'COMPLETED'|status: 'COMPLETED' \\}\\)|status: 'IN_PROGRESS'|Final offers can only be sent to clients|provider cannot send a final offer to a non-client" apps/mobile/src/screens/bookings/BookingDetailScreen.tsx apps/backend/src/modules/bookings/bookings.service.ts apps/backend/src/modules/bookings/bookings.service.spec.ts` - confirmed hidden mobile completion transition is used, client payment copy is gone, and backend non-client final-offer validation exists.

Device/simulator/manual flow checked:

- Static mobile route walkthrough checked for Home -> Search -> ProviderProfile -> CreateBooking -> BookingDetail.
- Static mobile route walkthrough checked for Messages -> Chat -> provider final-offer form -> client accept/decline actions.
- Static provider route walkthrough checked for ProviderDashboard direct booking cards -> BookingDetail confirm/cancel/complete/payment.
- No device simulator was launched in this pass; verification was limited to type-check, lint script, and static route/copy inspection.

Routes intentionally deferred:

- Client job request creation/listing remains present in the repo but hidden behind `EXPO_PUBLIC_ENABLE_JOB_REQUESTS`.
- Provider job-request inbox and quote composer remain present in the repo but hidden behind `EXPO_PUBLIC_ENABLE_JOB_REQUESTS` / `EXPO_PUBLIC_ENABLE_QUOTE_MARKETPLACE`.

## Workstream 05 Evidence

Completed: 2026-04-25

Changed files:

- `apps/backend/src/modules/categories/categories.service.ts`
- `apps/backend/src/modules/providers/providers.service.ts`
- `apps/backend/src/modules/providers/providers.service.spec.ts`
- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/app/providers/[id]/page.tsx`
- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- `apps/web/src/components/provider-profile/ProviderAbout.tsx`
- `apps/web/src/components/provider-profile/ProviderHeader.tsx`
- `apps/web/src/lib/provider-card.ts`
- `apps/mobile/src/lib/providerAdapter.ts`
- `apps/mobile/src/screens/home/HomeScreen.tsx`
- `apps/mobile/src/screens/search/SearchScreen.tsx`
- `apps/mobile/src/screens/search/CategoryDetailScreen.tsx`
- `apps/mobile/src/screens/search/ProviderProfileScreen.tsx`
- `apps/mobile/src/screens/search/components/MobileFilterSheet.tsx`
- `packages/schemas/src/dto.ts`
- `packages/schemas/src/models.ts`
- `packages/ui/src/web/FeaturedProviderCard.tsx`
- `packages/ui/src/mobile/FeaturedProviderCard.tsx`

Behavior implemented:

- Backend provider search now returns provider trades in summary results so cards/profile surfaces can show real trade/category context.
- Backend category hierarchy and subcategory responses now expose launch-ready provider counts using the same discoverability requirements as provider search.
- Provider search regression coverage verifies `category=plomberie` and `subcategory=robinetterie` produce category and subcategory Prisma filters.
- Web `/services` keeps category/subcategory URL filters, exposes real search/city/rating/min-price/max-price/availability/verified filters, and removes the fake map column.
- Web `/services` availability copy now says `Accepte les demandes` instead of implying immediate availability.
- Web provider cards only show a verified badge for real provider/user verification, not unrelated certifications.
- Web provider profile removes synthetic response-rate and static date/duration claims; it shows real response time when present, otherwise `À confirmer`.
- Web provider profile shows real trades in the about section, category/service-zone cards, hourly guidance, ratings/reviews, and launch CTAs: message, optional call, direct booking.
- Mobile search removes the map unavailable surface, uses `Accepte les demandes`, and keeps filters mapped to backend search params.
- Mobile home renamed the fake nearby `Carte` affordance to `Tout voir` until a real map exists.
- Mobile category detail now keeps the selected category and applies selected subcategory through the backend `subcategory` filter instead of replacing the category with the subcategory id.
- Mobile provider profile no longer labels generic certification as insurance and no longer shows `~—` for missing response time.
- Mobile provider cards now accept the actual provider summary shape instead of requiring the full provider-detail schema.
- Web provider cards/profile verification indicators now match the backend `verified=true` filter by using provider `verificationStatus === VERIFIED`.
- Shared web/mobile provider cards display `Délai de réponse à confirmer` when the backend has no response-time value instead of invented response estimates.

Example URLs/filters verified:

- `/services?category=plomberie`
- `/services?category=plomberie&subcategory=robinetterie`
- `/services?q=plombier&city=Kinshasa&minRating=4&minPrice=10000&maxPrice=50000&available=true&verified=true`
- Mobile category detail now calls provider search with `{ category: params.categoryId, subcategory: selectedSubcategory }`.

Commands run:

- `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/providers/providers.service.spec.ts` - passed, 4 tests.
- `pnpm --filter @kayu/backend test:launch` - passed, 59 tests.
- `pnpm --filter @kayu/schemas build` - passed.
- `pnpm --filter @kayu/schemas type-check` - passed.
- `pnpm --filter @kayu/api type-check` - passed.
- `pnpm --filter @kayu/backend type-check` - passed.
- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed.
- `pnpm --filter @kayu/web build` - passed.
- `git diff --check` - passed.
- `rg -n "Disponible maintenant|Vue carte|mis à jour il y a quelques instants|Taux de réponse|Réponse \{fast|~15 min|Assurance RC Pro|DistanceBadge|Voir distance" apps/web/src/app/services apps/web/src/app/providers apps/web/src/components/provider-profile apps/mobile/src/screens/search apps/mobile/src/lib/providerAdapter.ts -g '!*.map'` - no launch-facing matches in scoped files.

## Workstream 06 Evidence

Completed: 2026-04-25

Changed files:

- `apps/web/src/lib/booking-v2.ts`
- `apps/web/src/app/bookings/MyBookingsClient.tsx`
- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/app/pro/earnings/EarningsClient.tsx`
- `apps/web/src/app/pro/earnings/TransactionRow.tsx`
- `apps/web/src/app/pro/earnings/page.tsx`
- `apps/web/src/app/pro/earnings/PayoutSheet.tsx` - deleted
- `apps/web/src/app/pro/earnings/fixtures.ts` - deleted
- `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx`
- `apps/web/src/app/pro/onboarding/types.ts`
- `apps/web/src/app/pro/verify/DisputeView.tsx`
- `apps/web/src/app/pro/devis/new/QuoteComposeClient.tsx`
- `apps/web/src/app/pro/devis/new/page.tsx`
- `apps/web/src/app/quotes/[id]/QuoteDetailClient.tsx`
- `apps/web/src/app/review/[providerId]/WriteReviewClient.tsx`
- `apps/web/src/components/booking/BookingCalendar.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/components/bookings/BookingStatusChip.tsx`
- `apps/web/src/components/dashboard/BookingCard.tsx`
- `apps/web/src/components/notifications/NotificationList.tsx`
- `apps/web/src/components/pro/ActiveJobsCard.tsx`
- `apps/web/src/components/pro/types.ts`
- `apps/web/src/components/profile/UserProfile.tsx`
- `apps/mobile/src/components/bookings/BookingStatusChip.tsx`
- `apps/mobile/src/screens/auth/AuthScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/screens/messages/ConversationsScreen.tsx`
- `apps/mobile/src/screens/pro/EarningsScreen.tsx`
- `apps/mobile/src/screens/pro/JobRequestsScreen.tsx`
- `apps/mobile/src/screens/pro/ProVerificationScreen.tsx`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- `apps/mobile/src/screens/pro/QuoteComposeScreen.tsx`
- `apps/mobile/src/screens/pro/fixtures.ts`
- `apps/mobile/src/screens/pro/onboardingData.ts`

Behavior implemented:

- Web and mobile earnings now describe confirmed cash earnings and pending cash confirmations instead of available balance, payout, withdrawal, PSP, or Mobile Money flows.
- Deleted the launch-facing web payout sheet and its Mobile Money operator fixture.
- Provider onboarding no longer asks for a Mobile Money payment method in the visible launch flow.
- Booking cards/detail chips treat backend `IN_PROGRESS` as confirmed launch copy instead of exposing an in-progress/en-route-style lifecycle.
- Removed en-route/arrived/sur-place copy from active-job request surfaces that remain deferred behind launch flags.
- Replaced provider-facing `payout` labels with `Gain net` / `Gain net estimé`; code identifiers for existing transaction/request models remain unchanged.
- Replaced refund wording on provider dispute response surfaces with `geste commercial`; admin-only dispute configuration still contains refund wording.
- Removed online-card copy from the legacy profile card section; launch copy now states cash payment with the provider at mission end.
- CDF amounts remain displayed as `FC`/`CDF` with French locale grouping. This matches the existing Kinshasa UI convention for Congolese francs; no currency rail or online payment claim is attached.
- Review follow-up: removed the dead web `/bookings` `Confirmées` tab after `IN_PROGRESS`/`CONFIRMED` were intentionally folded into the launch `À venir` grouping.

Search terms checked:

- `M-Pesa|Mobile Money|Mes Cartes|Ajouter une carte|payez-vous|Demander un retrait|retrait manuel|Solde disponible|Solde retirable|En route|Sur place|arrived|Arrivé|arrivé|remboursement|Remboursement|refund|escrow|Votre payout|Payout estimé|paiement sécurisé|Paiement sécurisé|secure payment|online payment`
- `payout|Payout|pay[ée]|Pay[ée]|Paiement|paiement|payer|paid|en route|arrived|arrivé|Arrivé|Sur place|Mobile Money|retrait|remboursement|Remboursement|secure|sécurisé|protégé|escrow|refund|online`
- `Paiement en espèces à la fin de la mission|Paiement en especes|Gains confirmés|paiement en especes|cash`

Intentional remaining matches:

- `apps/web/src/app/dashboard/admin/page.tsx` still has `Remboursement ou geste (%)`; this is an admin/internal dispute-control surface, not launch-facing client/provider UI.
- Existing `PAYOUT` enum/type identifiers and transaction/request model fields remain in code because backend accounting still uses them; launch-facing labels now say `Ajustements`, `Gains confirmés`, or `Gain net`.
- Hidden job-request/quote routes still exist behind launch flags, but their visible payment/lifecycle labels were also cleaned where they were easy to align.

Commands run:

- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed.
- `pnpm --filter @kayu/web type-check` - passed after review follow-up.
- `git diff --check` - passed.
- `rg -n "M-Pesa|Mobile Money|Mes Cartes|Ajouter une carte|payez-vous|Demander un retrait|retrait manuel|Solde disponible|Solde retirable|En route|Sur place|arrived|Arrivé|arrivé|remboursement|Remboursement|refund|escrow|Votre payout|Payout estimé|paiement sécurisé|Paiement sécurisé|secure payment|online payment" apps/web/src apps/mobile/src -g '!*.map'` - only admin/internal refund copy remains.
- `rg -n "Paiement en espèces à la fin de la mission|Paiement en especes|Gains confirmés|paiement en especes|cash" apps/web/src apps/mobile/src -g '!*.map'` - confirmed cash-first copy is present on booking, profile, messages, home, and earnings surfaces.

## Workstream 07 Evidence

Completed: 2026-04-26

Changed files:

- `apps/backend/src/modules/earnings/earnings.service.ts`
- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/web/src/app/pro/ProviderDashboardClient.tsx`
- `apps/web/src/app/pro/earnings/EarningsClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/screens/pro/EarningsScreen.tsx`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`

Behavior implemented:

- Web provider dashboard now shows direct pending booking requests with open-detail, message-client, accept, and decline actions.
- Web provider dashboard removed the dead `Modifier zone` button; primary dashboard actions now route or mutate real data.
- Web booking detail opens `/messages` with the booking counterparty user id, so providers message the client rather than landing in a generic inbox.
- Web messages now supports `recipientId` deep links and creates a pending one-to-one thread until the first message creates the backend conversation.
- Mobile direct booking request cards now include a message-client action in addition to detail, accept, and decline.
- Mobile booking detail removed the dead phone icon and wires the counterparty message icon to the correct client/provider chat target.
- Earnings summaries no longer subtract payout rows from provider cash earnings; confirmed cash jobs are shown as the provider's confirmed earnings.
- Earnings history defaults to cash earnings/bonus rows and hides payout/disbursement rows from launch-facing `Tout` history.
- Web and mobile earnings filters no longer expose a payout/adjustment tab.
- Existing provider request inbox and quote composer surfaces remain hidden behind launch flags; no launch-facing provider path requires job requests or quote competition.

Provider account used for manual-smoke target:

- Provider: `Jean-Pierre Mukendi` (`jeanpierre.mukendi@kayou.cd`) from `apps/mobile/e2e/manual/seeded-accounts.md`.
- Client counterpart: `Paul Kabasele` (`paul.kabasele@email.cd`) from the same seeded account set.
- Full browser/device manual smoke was not run in this pass; the seeded account is recorded for the Workstream 08 launch QA run.

Booking statuses tested:

- `PENDING` -> provider confirm to `CONFIRMED`.
- `PENDING` -> provider decline/cancel to `CANCELLED`.
- `CONFIRMED` -> provider hidden backend start transition to `IN_PROGRESS`.
- `IN_PROGRESS` -> provider complete to `COMPLETED`.
- `COMPLETED` -> provider cash payment confirmation updates earnings from pending to confirmed.
- Final-offer accept path creates or confirms a `CONFIRMED` cash booking.

Commands run:

- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed after fixing the dashboard booking client-id fallback.
- `pnpm --filter @kayu/backend type-check` - passed.
- `pnpm --filter @kayu/backend test:bookings` - passed, 16 tests.
- `pnpm --filter @kayu/backend test:launch` - passed, 59 tests.
- `git diff --check` - passed.
- `rg -n "(/pro/requests|/pro/devis|Envoyer un devis|Nouveau devis|Virement|Mobile Money|retrait|payout|PAYOUT|demande qualifiée|paiement sécurisé|En route|Arrivé)" apps/web/src/app/pro apps/web/src/components/bookings apps/mobile/src/screens/pro apps/mobile/src/screens/bookings apps/backend/src/modules/earnings -g '!*.map'` - remaining request/quote matches are hidden flag-gated routes/components; remaining payout/mobile-money matches are backend/API code identifiers and hidden payout endpoints, not launch-facing provider UI.

## How To Update This File

When starting work:

- Set status to `In progress`.
- Add owner/agent name.
- Add start date and scope note.

When finishing work:

- Set status to `Done` or `Blocked`.
- List changed files.
- List commands run and result.
- Add any decisions to the Decisions Log.
- Add any remaining blockers to Open Questions or a new blocker section.
