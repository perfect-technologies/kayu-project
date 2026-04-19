# System Map

## Monorepo Shape

- `apps/backend`: NestJS API with Prisma/Postgres.
- `apps/mobile`: Expo React Native app.
- `packages/api`: typed API client wrappers.
- `packages/schemas`: shared Zod DTOs and response schemas.
- `packages/ui`: shared mobile/web UI components and design tokens.
- `packages/utils`: formatting/distance/date helpers.

## Backend Modules Observed

| Module | Routes | Current Purpose |
| --- | --- | --- |
| Identity | `/api/me`, `/api/me/profile`, `/api/me/role`, `/api/me/provider-onboarding` | Local actor creation, profile completion, role changes, legacy provider profile creation. |
| Onboarding | `/api/me/provider-draft`, `/api/me/provider-publish` | Provider draft save/publish flow used by mobile provider onboarding. |
| Providers | `/api/providers`, `/api/providers/:id`, `/api/providers/me`, `/api/providers/me/availability` | Public discovery/profile, provider self edits, availability. |
| Bookings | `/api/bookings`, `/api/bookings/:id` | Direct booking create/list/detail/status/cancel. |
| Reviews | `/api/reviews` | Public provider reviews and client review creation after completed booking. |
| Messaging | `/api/messages` | Conversation list, messages list, send message. |
| Favorites | `/api/favorites` | Client saved providers. |
| Settings | `/api/settings/visibility` | Profile visibility toggles. |
| Dashboard | `/api/dashboard/provider`, `/client`, `/admin` | Role-specific dashboard payloads. |
| Job Requests | `/api/job-requests`, `/api/pro/requests` | Client broad requests and provider inbox. |
| Quotes | `/api/pro/quotes`, `/api/job-requests/:id/quotes`, `/api/quotes/:id/*` | Provider quote lifecycle and client accept/decline APIs. |
| Earnings | `/api/pro/earnings/*` | Provider earnings, transactions, payout request stubs. |
| Verification | `/api/pro/verification/*` | Provider KYC document state, upload metadata, dispute response. |
| Admin | `/api/admin/*` | User, provider, category, and review moderation. |

## Mobile Screens Observed

| Role | Screens |
| --- | --- |
| Auth | `AuthScreen` with OTP signup/login and dev demo login. |
| Client | `HomeScreen`, `SearchScreen`, `CategoryDetailScreen`, `ProviderProfileScreen`, `BookingScreen`, `BookingsScreen`, `BookingDetailScreen`, `ReviewScreen`, `ConversationsScreen`, `ChatScreen`, profile/favorites/settings. |
| Provider | `ProviderDashboardScreen`, `ProviderOnboardingScreen`, `ProVerificationScreen`, `JobRequestsScreen`, `QuoteComposeScreen`, `EarningsScreen`, messages/profile. |
| Admin | No admin mobile navigator; admins currently fall through to client tabs. |

## Expected MVP Flow - Direct Booking

1. User signs up as client or logs in.
2. Client completes first/last name, phone, city.
3. Client searches providers by category/city/availability.
4. Client opens provider profile and creates booking request with service, date/time, address, price estimate, and note.
5. Booking is `PENDING`.
6. Provider sees pending booking/request and can accept (`CONFIRMED`) or decline/cancel.
7. Client/provider can message each other.
8. Provider starts job (`IN_PROGRESS`).
9. Provider marks job complete (`COMPLETED`).
10. Client leaves one review.
11. Provider receives updated review/trust/earnings data.

Current state: steps 1-4 partly work; step 4 success handling is broken; steps 6-9 are not fully exposed in provider UI; step 10 is reachable too early and not properly gated.

## Expected MVP Flow - Job Request / Quote

1. Client creates a job request with category, service, description, address, when, budget, photos.
2. Matching providers receive request.
3. Provider reviews request and sends quote.
4. Client views quote list, accepts or declines.
5. Accepted quote creates `CONFIRMED` booking.
6. Booking execution follows the same direct-booking lifecycle.

Current state: backend supports most of this, provider mobile can receive/send quotes, but client mobile cannot create job requests or accept/decline quotes. This flow is not launchable unless completed or hidden.

## Expected MVP Flow - Provider Onboarding

1. User signs up as provider.
2. User lands in pro tabs with onboarding banner.
3. Provider completes identity, craft/category, zones, pricing, profile, terms.
4. Provider publishes profile.
5. Provider appears in search after publish.
6. Provider submits verification docs separately.
7. Admin approves verification.

Current state: mobile onboarding exists and writes draft/publish data, but provider signup role routing is broken, onboarding stores some important fields only in JSON, and publication can miss trust score creation for draft-created provider rows.

## Current API Contract Risks

- Several API client methods return typed `unknown` for booking create/detail/update, causing mobile to cast and miss response shape errors.
- Some response schemas include fields the backend does not return (`reviewed`, `quote` on booking detail).
- Some mobile code relies on placeholder fields (`progress`, `cancelledBy` as role string, fake quote lines).
- Type-check passes because many app screens use local ad hoc interfaces or casts.

