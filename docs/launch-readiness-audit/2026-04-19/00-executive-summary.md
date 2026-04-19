# Executive Summary

KAYOU is not launch-ready yet. The backend has a broad marketplace schema and many modules, and the mobile and web apps have substantial UI coverage, but multiple core paths do not work end to end. The biggest issue is not lack of code; it is mismatch between intended marketplace behavior, backend state machines, frontend navigation, and what users can actually complete.

## Launch Recommendation

Do not launch publicly until all P0s and the high-impact P1s below are fixed and covered by E2E tests using seeded client and provider accounts.

The MVP should be narrowed to one reliable path:

1. Client signs up/logs in.
2. Client discovers a published provider.
3. Client creates a booking request.
4. Provider confirms, starts, and completes the booking.
5. Client can message provider throughout.
6. Client leaves one review after completion.
7. Provider sees booking/earnings state accurately.
8. Admin can suspend users/providers and approve/reject provider verification.

The current implementation partially supports this path but has several blockers.

Web note: `apps/web` is a full launch surface, not just marketing. It includes auth, booking, messages, quotes, provider dashboard, verification, earnings, and admin routes. If web is public at launch, it must be fixed alongside mobile. See `08-web-flow-audit.md`.

## P0 Findings

| Area | Finding | Impact | Evidence |
| --- | --- | --- | --- |
| Auth/signup | Provider signup via OTP likely never sets provider role because `/me` creates a new local user with default `CLIENT`, then mobile only calls `setRole` when `!userRole`. | New providers can be routed as clients and never reach provider onboarding. | `apps/mobile/src/screens/auth/AuthScreen.tsx:286-316`; `apps/backend/prisma/schema.prisma` `User.role @default(CLIENT)`. |
| Booking create success | Booking creation reads `result.id`, but API returns `{ success, booking }`. `createdBookingId` remains empty. | First booking success screen can navigate to review with an empty booking id. | `apps/mobile/src/screens/booking/BookingScreen.tsx:93-105`, `:147-165`; API endpoint returns `{ booking }`. |
| Booking flow | After creating a booking, the UI sends the client directly to review, but backend only allows reviews for `COMPLETED` bookings. | Happy path immediately fails after booking creation. | `apps/mobile/src/screens/booking/BookingScreen.tsx:147-165`; `apps/backend/src/modules/reviews/reviews.service.ts` requires `booking.status === "COMPLETED"`. |
| Provider booking execution | Provider UI only exposes "Marquer comme terminee" for `IN_PROGRESS`, but there is no UI action to confirm a `PENDING` booking or start a `CONFIRMED` booking. Backend requires `PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED`. | Providers cannot complete direct bookings through the mobile app. | `apps/backend/src/modules/bookings/bookings.service.ts:236-312`; `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx:506-580`. |
| Messaging | Starting chat without an existing `conversationId` sends to backend but does not render the first sent message or switch to the created conversation. | Direct message from provider profile appears broken. | `apps/mobile/src/screens/messages/ChatScreen.tsx:68-120`. |
| Messaging wrong recipient | Booking detail always uses `booking.provider.userId` for message target. Providers viewing a client booking attempt to message themselves instead of the client. | Provider cannot message client from booking detail; self-message is rejected by backend. | `apps/mobile/src/screens/bookings/BookingDetailScreen.tsx:224-233`; backend rejects self-message. |
| Quotes | Provider can send quotes, but client has no mobile UI to view, accept, or decline quotes. | Quote marketplace path cannot complete in app. | `packages/api/src/endpoints.ts` exposes client quote APIs; `rg` shows no mobile usage outside pro screens. |
| Client job requests | Backend supports broad job requests, provider inbox, and quote responses, but mobile has no client screen to create/manage job requests. | Thumbtack-style request flow is absent for clients. | `apps/backend/src/modules/job-requests/*`; `rg` shows mobile only uses pro-side job request APIs. |
| Web launch parity | Web direct booking routes to review before completion, review can fake success without a booking id, provider booking actions skip confirm/start, and admin auth routes to `/admin` even though the real route is `/dashboard/admin`. | Web users can hit the same launch blockers plus web-specific 404/prototype paths. | `docs/launch-readiness-audit/2026-04-19/08-web-flow-audit.md`. |

## High-Impact P1 Findings

| Area | Finding | Impact |
| --- | --- | --- |
| Provider discovery | Search filters for expert and distance are placeholders; map view is a placeholder. | "Map-based discovery" is not implemented. |
| Provider publication | Search only returns providers with `onboardingCompleteAt != null`; legacy provider onboarding endpoint creates provider profiles without setting that field. | Some provider creation paths produce invisible providers. |
| Provider onboarding | Draft onboarding creates provider row early with empty profession and no trust score; publish path does not create a trust score for already-created providers. | Dashboard/profile assumptions can break or display incomplete trust state. |
| Reviews | Mobile checks `booking.reviewed`, but backend returns `review`, not `reviewed`; completed bookings may keep showing "leave review" after review exists. | Duplicate review attempts produce backend conflicts instead of clean UI state. |
| Booking details | Booking detail shows hardcoded fake quote lines when no quote exists. | Misleads clients/providers on pricing and invoice details. |
| Payment/earnings | Completing a booking creates pending earnings if `isPaid` is false, but there is no mobile payment confirmation flow. | Provider earnings and balance can look wrong or remain pending indefinitely. |
| Admin UI | Backend has admin APIs and dashboard, but mobile routes admins into client tabs; there is no admin dashboard UI. | Admin role cannot operate from app. |
| Verification | Verification upload uses placeholder URLs, no real file picker/camera/storage, and admin provider verification does not review individual `VerificationDoc` decisions. | Trust/verification cannot be production-grade. |

## What Is Implemented

- Supabase-authenticated NestJS API with local `User` actors.
- Prisma schema for users, providers, categories, trades, bookings, reviews, messages, notifications, favorites, visibility, job requests, quotes, earnings, verification docs, and disputes.
- Mobile client tabs for home, search, bookings, messages, and profile.
- Mobile provider tabs for dashboard, requests, messages, earnings, and profile.
- Backend status transitions for direct bookings.
- Backend quote acceptance that creates a confirmed booking.
- Backend review/trust-score recalculation.
- Backend admin endpoints for users, providers, categories, and reviews.
- Demo seed data and demo email login for development.

## Minimum Work Before Launch

1. Fix auth role selection and provider onboarding route.
2. Fix direct booking creation, success navigation, provider status actions, and review gating.
3. Fix messaging creation from profile/booking detail for both roles.
4. Either implement client job-request/quote acceptance flow or hide provider quote/request surfaces from MVP.
5. Implement real map/distance or remove map claims.
6. Add E2E coverage for direct booking and quote-created booking.
7. Add admin/ops path for verification and account moderation.
8. If web is public, complete `WS-13` so web auth, booking, messaging, reviews, admin, discovery, and verification match the launch backend/mobile behavior.
