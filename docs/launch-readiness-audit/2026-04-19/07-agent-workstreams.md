# Agent Workstreams

These workstreams are intentionally scoped so parallel agents can implement and test them with limited conflicts.

Web note: the first audit pass focused on backend and mobile. `08-web-flow-audit.md` adds the Next.js web surface. If web is launch-facing, assign `WS-13` and make sure shared P0 fixes are reflected in `apps/web`.

## WS-01 Auth Role And Profile Completion

Severity: P0

Owns:

- `apps/mobile/src/screens/auth/AuthScreen.tsx`
- `apps/mobile/src/lib/auth.tsx`
- `apps/backend/src/modules/identity/*`
- shared schemas if needed

Tasks:

- Fix provider signup so selected role is always persisted.
- Clarify backend default role behavior or add explicit role-selected state.
- Add route/profile-completion guard for missing names.
- Add tests for new client and provider signup flows.

Acceptance:

- New provider OTP signup lands in pro tabs/onboarding.
- New client OTP signup lands in client tabs after name capture.
- Returning users keep their existing role.

## WS-02 Direct Booking Lifecycle

Severity: P0

Owns:

- `apps/mobile/src/screens/booking/BookingScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingsScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/mobile/src/components/bookings/*`
- `apps/backend/src/modules/bookings/*`
- `packages/api/src/endpoints.ts` booking response types
- `packages/schemas/src/dto.ts` booking response schema if needed

Tasks:

- Fix booking create response handling (`result.booking.id`).
- Replace post-booking review navigation with booking detail/list.
- Add provider actions for accept/start/complete.
- Add client/provider cancel reason handling.
- Add reviewed state to booking detail/list.
- Remove fake quote lines for direct bookings.

Acceptance:

- Client can create booking and see `PENDING`.
- Provider can confirm, start, complete.
- Client can review only after completion.
- Invalid status transitions show useful errors and are not offered in UI.

## WS-03 Messaging Bootstrap And Role Recipients

Severity: P0

Owns:

- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- `apps/mobile/src/screens/messages/ConversationsScreen.tsx`
- `apps/mobile/src/screens/search/ProviderProfileScreen.tsx`
- `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx`
- `apps/backend/src/modules/messaging/*`
- API response types for send message

Tasks:

- Make first message create/render conversation in chat UI.
- Return `conversationId` from send API or include it in mapped message and update route state.
- Fix booking detail recipient: client messages provider, provider messages client.
- Enforce `allowMessages` if visibility settings remain.
- Add tests for first-message flow and booking detail message for both roles.

Acceptance:

- Sending first message from provider profile displays the message immediately.
- Conversation appears in inbox for both users.
- Provider booking detail message opens chat with client, not self.

## WS-04 Client Job Request And Quote Acceptance

Severity: P0 if quote/request flow is in launch scope; otherwise hide features.

Owns:

- new client screens under `apps/mobile/src/screens/requests` or similar
- client navigation in `AppNavigator`
- `packages/api/src/endpoints.ts`
- `packages/schemas/src/job-requests.ts`, `quotes.ts`
- possibly backend `quotes.service.ts`

Tasks:

- Add client job request creation UI.
- Add client request list/detail.
- Add quote list/detail with accept/decline.
- After accept, navigate to created booking.
- Decline updates quote state.
- Handle expired quotes.

Acceptance:

- Client can create request.
- Matched provider can send quote.
- Client can accept quote and both users see confirmed booking.

## WS-05 Provider Dashboard And Request Actions

Severity: P1

Owns:

- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/pro/JobRequestsScreen.tsx`
- `apps/backend/src/modules/dashboard/dashboard.service.ts`

Tasks:

- Wire dashboard request card buttons to dismiss/quote.
- Add direct pending booking queue.
- Make today jobs/cards navigate to booking detail.
- Improve request timestamps and distance display.

Acceptance:

- Dashboard is actionable; no dead primary buttons.
- Provider can handle both job requests and direct booking requests from dashboard or clear routes.

## WS-06 Provider Onboarding And Publication Consistency

Severity: P1

Owns:

- `apps/backend/src/modules/onboarding/*`
- `apps/backend/src/modules/providers/*`
- `apps/mobile/src/screens/pro/ProviderOnboardingScreen.tsx`
- Prisma schema only if adding first-class fields

Tasks:

- Ensure provider publish creates trust score.
- Stop creating malformed provider rows or make drafts explicit.
- Map categories/subcategories/trades consistently.
- Replace placeholder avatar with real upload or remove avatar requirement.
- Retire/align legacy `/me/provider-onboarding`.

Acceptance:

- Draft providers never appear in search.
- Published providers always have required profile/trust data.
- No duplicate/malformed provider profile paths.

## WS-07 Discovery, Map, And Filters

Severity: P1

Owns:

- `apps/mobile/src/screens/search/*`
- `apps/backend/src/modules/providers/providers.service.ts`
- `apps/backend/src/modules/geo/*`
- `packages/utils/src/distance.ts`

Tasks:

- Wire search text, city, available, verified, price, rating filters to backend.
- Implement distance filtering and sorting or remove controls.
- Implement map view with provider pins or hide map toggle.
- Make backend pagination database-backed.

Acceptance:

- Filter UI changes backend results.
- Map is real if visible.
- Search result counts are accurate.

## WS-08 Reviews And Client Reputation

Severity: P1

Owns:

- `apps/backend/src/modules/reviews/*`
- `apps/mobile/src/screens/bookings/ReviewScreen.tsx`
- booking detail/list reviewed state
- new provider-to-client review screen/API

Tasks:

- Return reviewed state or use `review`.
- Store satisfaction tags structurally or remove tag UI.
- Remove review photo UI until upload exists.
- Add provider client-review endpoint/UI.
- Recompute client trust score.

Acceptance:

- Review CTA appears exactly once per completed booking.
- Provider profile ratings update.
- Providers can rate clients after completion if in launch scope.

## WS-09 Verification And Admin Review

Severity: P1

Owns:

- `apps/backend/src/modules/verification/*`
- `apps/backend/src/modules/admin/*`
- `apps/mobile/src/screens/pro/ProVerificationScreen.tsx`
- future admin UI

Tasks:

- Replace pretend upload URLs with real file upload/storage.
- Add admin verification queue and per-doc approval/rejection.
- Ensure provider rejection reason surfaces correctly.
- Decide verified-provider default search policy.

Acceptance:

- Provider can submit real docs.
- Admin can approve/reject docs and provider status.
- Provider sees accurate status/reasons.

## WS-10 Admin / Ops MVP

Severity: P1

Owns:

- new admin frontend or mobile admin navigator
- `apps/backend/src/modules/admin/*`
- `apps/backend/src/modules/dashboard/dashboard.service.ts`

Tasks:

- Create admin dashboard UI or document external ops tool.
- Add user/provider search and suspend/reactivate.
- Add review moderation UI.
- Add booking support lookup.
- Add basic dispute/support ticket workflow.

Acceptance:

- Admin can resolve launch-day abuse/support issues without database access.

## WS-11 Payments And Earnings Policy

Severity: P1/P2 depending on payment launch scope.

Owns:

- `apps/backend/src/modules/earnings/*`
- `apps/backend/src/modules/bookings/*`
- `apps/mobile/src/screens/pro/EarningsScreen.tsx`
- future client payment screens

Tasks:

- Define MVP payment mode: cash confirmation or mobile money.
- Add paid-state mutations with role/admin authorization.
- Reconcile transaction status with booking payment.
- Hide payout claims until PSP path is real or clearly label as pending/manual.

Acceptance:

- Provider earnings match completed paid jobs.
- Pending/completed balance rules are explainable and tested.

## WS-12 Test Harness

Severity: P0/P1

Owns:

- backend test setup
- mobile E2E setup
- seed/test fixtures
- CI scripts

Tasks:

- Add backend integration tests for identity, onboarding, bookings, messaging, reviews, quotes.
- Add mobile E2E smoke tests for client direct booking, provider completion, review, messaging.
- Add stable seed accounts/states.
- Run tests in CI.

Acceptance:

- CI catches the P0 bugs documented in this audit.
- A release branch cannot merge with broken direct booking or messaging flow.

## WS-13 Web Launch Parity And Route Hygiene

Severity: P0 if web is launch-facing; P1 if web is internal/deferred.

Owns:

- `apps/web/src/app/auth/AuthFlow.tsx`
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/components/provider-profile/BookingForm.tsx`
- `apps/web/src/app/bookings/*`
- `apps/web/src/components/bookings/*`
- `apps/web/src/app/messages/*`
- `apps/web/src/components/provider-profile/ContactDialog.tsx`
- `apps/web/src/app/review/[providerId]/*`
- `apps/web/src/app/pro/*`
- `apps/web/src/app/dashboard/*`
- `apps/web/src/app/services/ServicesPageContent.tsx`
- `apps/web/src/components/layout/AppShell.tsx`
- shared API/schema/backend files only where web needs a contract already being fixed by another workstream

Tasks:

- Make web signup use the explicit role-selection contract from WS-01 and route admins to `/dashboard/admin`.
- Fix direct booking success so the web stores the created booking id and routes to booking detail/list, not review.
- Add provider confirm/start/complete booking actions that match backend status transitions.
- Make the review screen require a completed booking id and remove fake success for missing `bookingId`.
- Make first contact from a provider profile bind to the created conversation and make `/messages` open that conversation.
- Remove, redirect, or implement web dashboard/sidebar links that currently point to missing routes.
- Add an admin role guard before enabling admin dashboard queries.
- Wire or hide web search sort, distance/top-rated/expert filters, and synthetic map behavior.
- Hide unsendable standalone quote composer entry points unless standalone quotes are implemented.
- Replace placeholder avatar/verification upload behavior or document and present it as a launch stub.
- Align payment, refund, and payout copy with the actual launch payment policy.

Acceptance:

- `pnpm --filter @kayu/web type-check` passes.
- New provider web signup lands in `/pro/onboarding`.
- New client web signup lands in a client-safe route after required profile capture.
- Web direct booking creates a real booking and routes to `/bookings/[id]` or `/bookings`.
- Provider can confirm, start, and complete a web-created direct booking.
- Client can review only after completion and the review persists.
- First provider-profile message is visible in `/messages`.
- Admin users land on `/dashboard/admin`; non-admin users cannot view admin UI.
- No visible web navigation item points to a 404.
- Visible web filters/map/payment/verification features match implemented backend behavior.
