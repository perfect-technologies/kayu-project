# KAYOU Launch Readiness Remediation Progress

Last updated: 2026-04-22

This file tracks remediation work from `docs/launch-readiness-audit/2026-04-19/`. It intentionally does not replace `docs/implementation-plan/PROGRESS.md`, which tracks the earlier implementation/migration plan.

## Current Phase

WS-08 complete. WS-07 complete. WS-06 complete. WS-05 complete. WS-04 complete. WS-03 complete. WS-02 complete. WS-01 complete. Next P0 launch remediation is WS-13 web launch parity if web is public at launch.

## Status Legend

- `not_started`: No implementation agent has started this workstream.
- `in_progress`: An agent is actively working on this workstream.
- `blocked`: Work cannot continue without a decision or dependency.
- `needs_review`: Implementation is ready for review/verification.
- `done`: Implementation, validation, and documentation updates are complete.
- `deferred`: Explicitly out of launch scope.

## Workstream Status

| ID | Priority | Launch Critical | Workstream | Depends On | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WS-01 | P0 | Yes | Auth Role And Profile Completion | None | done | Codex | Changed `apps/mobile/src/screens/auth/AuthScreen.tsx`, `apps/mobile/src/lib/auth.tsx`, `apps/mobile/src/navigation/AppNavigator.tsx`, `apps/backend/src/modules/identity/*`, `apps/backend/prisma/schema.prisma`, `packages/schemas/src/*`. |
| WS-02 | P0 | Yes | Direct Booking Lifecycle | WS-01 helpful | done | Codex | Changed `apps/mobile/src/screens/booking/BookingScreen.tsx`, `apps/mobile/src/screens/bookings/{BookingDetailScreen,ReviewScreen}.tsx`, `apps/mobile/src/components/bookings/*`, `apps/mobile/src/lib/bookingV2.ts`, `apps/backend/src/modules/bookings/*`, `packages/api/src/endpoints.ts`, `packages/schemas/src/models.ts`. |
| WS-03 | P0 | Yes | Messaging Bootstrap And Role Recipients | WS-01 helpful | done | Codex | Changed `apps/mobile/src/screens/messages/ChatScreen.tsx`, `apps/backend/src/modules/messaging/*`, `packages/api/src/endpoints.ts`, `packages/schemas/src/dto.ts`; verified existing booking detail role recipient routing. |
| WS-04 | P0/P1 | Yes if exposed | Client Job Request And Quote Acceptance | WS-01 | done | Codex | Implemented client request creation, request detail, quote list, accept/decline, accepted-quote booking navigation; tightened backend quote acceptance and matched-provider quote creation. |
| WS-05 | P1 | Yes for provider launch | Provider Dashboard And Request Actions | WS-02/WS-04 | done | Codex | Changed provider dashboard/request mobile screens, provider navigation, dashboard/job-request backend services and tests, and shared dashboard/request schemas. |
| WS-06 | P1 | Yes | Provider Onboarding And Publication Consistency | WS-01 | done | Codex | Changed provider onboarding/identity/provider search services, mobile onboarding draft mapping, shared draft schema, and focused backend tests. |
| WS-07 | P1 | Yes | Discovery, Map, And Filters | WS-06 | done | Codex | Changed mobile discovery filters/sort/map messaging, provider search pagination/filtering, provider card mapping, and provider-search regression tests. |
| WS-08 | P1 | Yes | Reviews And Client Reputation | WS-02 | done | Codex | Changed backend/mobile review flows, booking review state, provider client-review path, shared review schemas/API, and focused backend review tests. |
| WS-09 | P1 | Operational | Verification And Admin Review | WS-06/WS-10 | done | Codex | Added explicit launch storage stub, per-document admin review queue, provider-visible doc decisions, and focused backend verification/admin tests. |
| WS-10 | P1 | Operational | Admin / Ops MVP | WS-09 helpful | not_started | | Admin users and moderation workflow. |
| WS-11 | P1 | Business decision | Payments And Earnings Policy | WS-02 | not_started | | Cash/offline vs paid booking policy. |
| WS-12 | P1 | Yes | Test Harness | Can start after first P0 | not_started | | Regression coverage for launch-critical flows. |
| WS-13 | P0/P1 | Yes if web launches | Web Launch Parity And Route Hygiene | WS-01/WS-02/WS-03 helpful | not_started | | Bring `apps/web` into parity with launch backend/mobile flows or hide unfinished web surfaces. |

## Current P0 Blockers

| Area | Blocker | Source |
| --- | --- | --- |
| Web booking | Web booking success routes to review without a booking id; review can fake success without backend write. | `08-web-flow-audit.md` |
| Web booking | Web provider booking detail has no confirm/start actions for direct bookings. | `08-web-flow-audit.md` |
| Web messaging | Web first-contact dialog sends and closes without selecting or showing the created conversation. | `08-web-flow-audit.md` |
| Web auth/admin | Web auth/admin routing still has launch gaps, including `/admin` redirect and web role-selection parity. | `08-web-flow-audit.md` |

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-04-19 | Track launch remediation in this audit folder instead of `docs/implementation-plan/`. | The implementation plan is migration-oriented and already marked complete. Launch remediation needs its own status. |
| 2026-04-19 | Treat direct booking as the minimum launch-critical marketplace flow. | A client must be able to book a provider and a provider must be able to complete the booking reliably. |
| 2026-04-19 | Treat job request/quote as launch-critical only if the product intends to expose it at launch. | The backend/provider pieces exist, but client acceptance is missing. Half-exposed flows should be completed or hidden. |
| 2026-04-19 | Agents must update this file before handing back work. | Parallel remediation needs a single coordination surface. |
| 2026-04-19 | Add web as a launch surface if public at launch. | `apps/web` implements client, provider, booking, messages, quote, and admin routes; it cannot be treated as marketing-only. |
| 2026-04-20 | Keep the job request/quote flow exposed for launch and complete the client path instead of hiding provider quote entry points. | Mobile clients can now create requests, view quotes, accept/decline, and open the confirmed booking created from an accepted quote. |
| 2026-04-21 | Hide mobile discovery map mode for launch instead of shipping a placeholder toggle. | Provider search results do not have reliable per-result map coordinates yet; the launch UI should not imply geographic precision that the backend cannot provide. |

## Validation Evidence

Initial audit validation:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
pnpm --filter @kayu/web type-check
```

Result: passed during audit. These checks do not prove end-to-end flow correctness.

WS-01 validation:

```bash
pnpm --filter @kayu/backend prisma:generate
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:identity
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-19.

WS-02 validation:

```bash
pnpm --filter @kayu/backend test:bookings
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-19. Mobile type-check required rebuilding `@kayu/schemas` and `@kayu/api` because the mobile workspace consumes their generated declaration files.

WS-03 validation:

```bash
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:messaging
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
pnpm --filter @kayu/web type-check
```

Result: passed on 2026-04-20. Mobile type-check required rebuilding `@kayu/schemas` and `@kayu/api` because the mobile workspace consumes their generated declaration files.

WS-04 validation:

```bash
pnpm --filter @kayu/backend test:quotes
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-20.

WS-05 validation:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:job-requests
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-20. Mobile type-check required rebuilding `@kayu/schemas` and `@kayu/api` because the mobile workspace consumes their generated declaration files.

WS-06 validation:

```bash
pnpm --filter @kayu/backend test:onboarding
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/api build
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-20. Mobile type-check required rebuilding `@kayu/schemas` and `@kayu/api` because the mobile workspace consumes their generated declaration files.

WS-07 validation:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:onboarding
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

Result: passed on 2026-04-21.

Manual search validation on 2026-04-21 against `http://127.0.0.1:3001/api/providers`:

- Base search returned 15 providers.
- `q=coiff` narrowed results to 1 provider.
- `city=Kinshasa` narrowed results to 9 providers.
- `minRating=4` narrowed results to 8 providers.
- `minPrice=10000&maxPrice=12000` narrowed results to 3 providers.
- `sortBy=hourlyRate&sortOrder=asc|desc` changed the leading hourly rates from `8000 -> 10000 -> 12000` to `30000 -> 25000 -> 25000`.

WS-08 validation:

```bash
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend test:reviews
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
pnpm --filter @kayu/web type-check
```

Result: passed on 2026-04-22.

## Update Rules For Agents

When starting a workstream:

1. Change the workstream status to `in_progress`.
2. Add your owner identifier.
3. Add a short note with branch/worktree context if relevant.

When handing back:

1. Set status to `needs_review`, `done`, `blocked`, or `deferred`.
2. List files changed in the notes field or in a short section below.
3. Record validation commands and results.
4. Add blockers or downstream decisions to the Decisions Log if needed.
5. Do not mark `done` unless tests/type checks relevant to the workstream have passed or the reason they could not run is documented.

## Completed Work Log

### 2026-04-19 — WS-01 Auth Role And Profile Completion

- Added explicit `User.roleSelectedAt` state so backend-created default `CLIENT` rows are distinguishable from deliberate client signup.
- Made `/me/role` idempotent for the same role and safe for fresh signup while rejecting role changes after explicit selection, completed profile, provider profile, or marketplace activity.
- Changed mobile OTP signup to persist the chosen role for both client and provider signup, even when `/me` initially returns default `CLIENT`.
- Added an authenticated client profile/name guard and a restored-session role picker for users whose role was not selected yet.
- Routed provider users without a provider profile directly into provider onboarding.
- Added focused identity regression tests in `apps/backend/src/modules/identity/identity.service.spec.ts`.

### 2026-04-19 — WS-02 Direct Booking Lifecycle

- Typed booking create/detail/update responses as `{ success, booking }` and fixed mobile create success to use `result.booking.id`.
- Changed post-create success actions to open the real booking detail or message the provider, never the review route.
- Added backend-reviewed metadata (`reviewed`, `myRating`) and cancellation role metadata (`cancelledByRole`) to booking responses so detail and list cards stay in sync.
- Added provider detail actions for `PENDING -> CONFIRMED`, `CONFIRMED -> IN_PROGRESS`, and `IN_PROGRESS -> COMPLETED`; invalid transitions are not offered in the mobile UI and still return backend errors if attempted.
- Changed cancellation from detail to use role-specific reasons through the status update endpoint.
- Fixed booking-detail message routing so clients message providers and providers message clients.
- Guarded the mobile review screen so it only opens for completed, unreviewed bookings.
- Removed fake direct-booking quote line items from booking detail and replaced them with the saved estimate.
- Added focused booking service tests in `apps/backend/src/modules/bookings/bookings.service.spec.ts`.

### 2026-04-20 — WS-03 Messaging Bootstrap And Role Recipients

- Changed `/api/messages` send response to return `conversationId` plus the mapped message so clients can bind first-contact sends to the real conversation.
- Enforced recipient `VisibilitySettings.allowMessages === false` before conversation/message creation.
- Updated mobile chat to keep local route state in sync with the returned conversation id, seed the returned first message into the conversation cache, and invalidate the inbox.
- Revalidated the mobile booking-detail message action uses provider user id for clients and client user id for providers.
- Added focused messaging service tests for first-message conversation bootstrap, disabled-recipient messaging, and self-message rejection in `apps/backend/src/modules/messaging/messaging.service.spec.ts`.

### 2026-04-20 — WS-04 Client Job Request And Quote Acceptance

- Added a client `Requests` tab with request creation, own request list, request detail, quote list, and quote accept/decline actions in `apps/mobile/src/screens/requests/ClientRequestsScreen.tsx`.
- Wired accepted quotes to navigate into the real `BookingDetail` screen for the confirmed booking returned by `/api/quotes/:id/accept`.
- Kept provider quote creation compatible with the client flow by requiring a matched open job request before a provider can create a quote.
- Changed quote acceptance to mark the request `MATCHED` and decline competing sent quotes for the same request.
- Added predictable French and ISO custom-date parsing for quote-created booking dates, and prevented provider quote submission with an empty custom date.
- Hardened quote updates so draft quotes cannot be reassigned to another job request after creation.
- Added focused quote service tests in `apps/backend/src/modules/quotes/quotes.service.spec.ts`.

### 2026-04-20 — WS-05 Provider Dashboard And Request Actions

- Added provider dashboard `bookingRequests` for direct `PENDING` bookings and surfaced them as actionable accept/refuse cards.
- Wired dashboard request cards to dismiss matched requests or open quote compose, with dashboard/request invalidation after actions.
- Made dashboard planning, direct booking, inbox, calendar, and earnings shortcuts navigate to real routes instead of dead controls.
- Added pull-to-refresh and polling for dashboard/request state, plus reliable empty/error snippets for bookings, requests, and earnings.
- Returned and displayed real request/job distances when coordinates are available, with clear fallback copy when they are not.
- Filtered provider request inbox/dashboard matches so already sent/accepted provider quotes are not shown as fresh actionable requests.
- Added focused job request service coverage in `apps/backend/src/modules/job-requests/job-requests.service.spec.ts`.

### 2026-04-20 — WS-06 Provider Onboarding And Publication Consistency

- Added a first-class draft `profession` field and fixed mobile onboarding so the métier title maps to provider profession while profile bio maps to public description.
- Removed the fake `placeholder://avatar` publication dependency; backend publish strips legacy placeholder avatars and mobile no longer requires a pretend photo.
- Made draft publish materialize category, service zones, skills, subcategory/trade mappings, `onboardingCompleteAt`, provider role selection, `PENDING` verification default, and an idempotent trust score in one transaction.
- Aligned legacy `/me/provider-onboarding` so it rejects incomplete launch profiles, normalizes zones/fields, sets `onboardingCompleteAt`, and creates providers with the same verification/trust defaults.
- Tightened provider search to only query launch-ready public providers with publish timestamp, non-empty profession, positive hourly rate, active category, service zone, trust score, active user, and search visibility enabled.
- Added focused onboarding/search regression tests in `apps/backend/src/modules/onboarding/onboarding.service.spec.ts`, `apps/backend/src/modules/providers/providers.service.spec.ts`, and `apps/backend/src/modules/identity/identity.service.spec.ts`.
- Follow-up validation on 2026-04-21 tightened publish itself to reject inactive categories, service zones that normalize to nothing, and malformed phone values before setting `onboardingCompleteAt`; revalidated with `pnpm --filter @kayu/backend test:onboarding` and `pnpm --filter @kayu/backend type-check`.

### 2026-04-21 — WS-07 Discovery, Map, And Filters

- Replaced mobile discovery placeholder controls with real backend-backed search text, city, minimum rating, price range, availability, verification, and sort filters in `apps/mobile/src/screens/search/{SearchScreen.tsx,components/MobileFilterSheet.tsx}`.
- Removed the fake list/map toggle and replaced it with explicit launch copy that map view is unavailable until provider pin geometry exists.
- Changed provider search to paginate in the database via `count` + `findMany(skip/take/orderBy)` and to apply minimum-rating filtering before pagination in `apps/backend/src/modules/providers/providers.service.ts`.
- Added backend sort support for recommended/newest/price ordering and shared search-param typing for `sortBy`/`sortOrder`.
- Tightened provider card mapping in `apps/mobile/src/lib/providerAdapter.ts` so search cards use real provider verification state, sane response-time fallback text, and a more stable displayed location.
- Added focused provider-search regression coverage for launch-ready gating plus rating-filter/database-pagination behavior in `apps/backend/src/modules/providers/providers.service.spec.ts`.

### 2026-04-22 — WS-08 Reviews And Client Reputation

- Kept client review entry strictly tied to completed bookings and reused backend review presence for booking detail/list state so review CTAs disappear once a review exists.
- Stored client-to-provider satisfaction tags structurally in the backend review record and removed the pretend mobile photo-upload path from the launch review flow.
- Added provider-to-client review creation at `/api/reviews/clients`, recomputed `User.clientScore` plus `clientTrustLevel`, and surfaced provider client-review state where providers act on completed bookings.
- Extended booking responses with provider-to-client review metadata (`clientReviewed`, `clientRating`, `clientReview`) so mobile can render completed-booking reputation state without guessing.
- Added focused backend review service coverage in `apps/backend/src/modules/reviews/reviews.service.spec.ts` and revalidated backend/mobile/web type safety after the shared schema changes.

### 2026-04-22 — WS-09 Verification And Admin Review

- Replaced pretend verification upload URLs with an explicit launch storage stub: backend now generates auditable `launch-stub://verification/...` references, returns storage-policy metadata in verification state, and stops trusting arbitrary client-supplied URLs.
- Exposed per-document verification status, review timestamps, and rejection reasons through shared schemas plus the mobile/web provider verification screens so providers can see exactly which document is pending, approved, or rejected.
- Added admin verification queue APIs and a dashboard review surface that lists verification submissions, lets ops approve/reject individual documents, and shows provider-level verification counts.
- Made admin document review derive provider `verificationStatus` from actual `VerificationDoc` decisions, update the provider’s public `isVerified` state and trust artifacts in lockstep, and log review activity for traceability.
- Fixed manual admin rejection/verification overrides so they write back to `VerificationDoc` instead of unrelated certifications, and added focused backend coverage in `apps/backend/src/modules/{admin,verification}/*.spec.ts`.
- Revalidated with `pnpm --filter @kayu/schemas build`, `pnpm --filter @kayu/api build`, `pnpm --filter @kayu/{schemas,api,backend,web,mobile} type-check`, and `node --test -r ts-node/register src/modules/verification/verification.service.spec.ts src/modules/admin/admin.service.spec.ts` from `apps/backend`.
