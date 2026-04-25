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
| 04 - Mobile Direct Flow | Not started | Unassigned | Mobile discovery/chat/booking/final-offer launch flow |
| 05 - Discovery Filters And Provider Profile | Not started | Unassigned | Fix filters and provider profile truthfulness |
| 06 - Cash Payment And Copy Cleanup | Not started | Unassigned | Align all launch-facing copy with cash MVP |
| 07 - Provider Operations And Dashboards | Not started | Unassigned | Provider actions and direct booking operations |
| 08 - Launch QA And Smoke Tests | Not started | Unassigned | Final smoke scenarios and release evidence |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-04-25 | Defer job requests and quote competition for launch | Too complex for Kinshasa MVP; direct conversation is more market-appropriate |
| 2026-04-25 | Keep cash as the only launch payment mode | Mobile money/online payment can come later; launch flow must be clear |
| 2026-04-25 | Remove en route / arrived from launch-facing UI | Not needed for MVP and not fully modeled in backend |
| 2026-04-25 | Add final offer after discussion | Gives both parties a simple agreement without quote competition |
| 2026-04-25 | Model final offers as first-class backend records | Keeps the launch agreement flow independent from job requests and competitive quotes while still linking to conversations/bookings |

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
