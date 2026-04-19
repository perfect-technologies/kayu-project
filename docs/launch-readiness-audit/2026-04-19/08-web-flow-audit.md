# Web Flow Audit

This pass covers `apps/web`, the Next.js client. The original audit focused on backend and mobile because the request emphasized the mobile app and the shared marketplace lifecycle. That is not enough if the web app is launch-facing.

Validation run:

```bash
pnpm --filter @kayu/web type-check
```

Result: passed on 2026-04-19.

Passing type checks do not mean the web app is launch-ready. The main risks are route/contract mismatches, prototype screens that skip backend writes, and web screens that expose flows the backend/mobile audit already flagged as incomplete.

## Web Surface Map

Public and discovery:

- `/`
- `/services`
- `/categories/[slug]`
- `/providers/[id]`

Auth:

- `/auth`

Client marketplace:

- `/book/[providerId]`
- `/bookings`
- `/bookings/[id]`
- `/messages`
- `/quotes/[id]`
- `/review/[providerId]`
- `/dashboard/client`
- `/dashboard/settings`

Provider:

- `/pro`
- `/pro/onboarding`
- `/pro/requests`
- `/pro/devis/new`
- `/pro/earnings`
- `/pro/verify`

Admin:

- `/dashboard/admin`

The web app is therefore not just a landing page. It is a full second marketplace client with client, provider, and admin functionality.

## Launch Position

If the web app is visible to users at launch, it must be fixed before launch together with mobile. If launch is mobile-only, the web app should be clearly treated as deferred/internal and should not expose broken marketplace routes publicly.

Recommended approach:

1. Keep the backend/mobile P0 workstreams as the shared lifecycle baseline.
2. Add one web-focused agent workstream to bring `apps/web` into parity with those fixes.
3. Do not let web keep prototype behavior after backend/mobile is fixed.

## P0 Web Findings

### Web Signup Can Still Miss Explicit Role Selection

Files:

- `apps/web/src/app/auth/AuthFlow.tsx:252`
- `apps/web/src/app/auth/AuthFlow.tsx:257`

The web OTP signup flow reads `me.user.role` and only calls `setRole` when `!userRole`. If the backend returns a default `CLIENT` role for a new user, provider signup will not persist the chosen provider role.

This mirrors the original mobile P0. The backend/mobile WS-01 fix added explicit role-selection semantics, but the web client still needs to consume that contract and persist the selected role for both client and provider signup.

Expected:

- Signup mode must persist the chosen role even if the local user row initially has default `CLIENT`.
- Provider signup must route to `/pro/onboarding`.
- Client signup must collect required profile fields before entering the client dashboard.
- Admin routing must use the real admin route.

### Admin Login Routes To A Nonexistent Page

Files:

- `apps/web/src/app/auth/AuthFlow.tsx:296`

Auth redirects admin users to `/admin`, but the implemented admin route is `/dashboard/admin`. Demo admin login also uses `/admin`. This creates an immediate 404 path for admin testing.

Expected:

- Admin login routes to `/dashboard/admin`.
- Any legacy `/admin` route either redirects or is removed from all entry points.

### Direct Booking Sends Users To Review Before Completion

Files:

- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx:54`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx:57`
- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx:109`
- `apps/web/src/app/review/[providerId]/WriteReviewClient.tsx:176`

The web booking flow creates a booking, shows a success moment, then routes to `/review/[providerId]?fromBooking=1` without a `bookingId`. The review screen explicitly skips the backend write when `bookingId` is absent and shows client-side success.

This is launch-blocking because a user can believe they reviewed a provider for a booking that is still pending and no review was stored.

Expected:

- Booking create success must retain `booking.id`.
- Success CTA should route to `/bookings/[id]` or `/bookings`, not review.
- Review route must require a completed booking id.
- Review screen must never fake success for missing booking id.

### Provider Cannot Run The Direct Booking Lifecycle

Files:

- `apps/web/src/components/bookings/BookingDetail.tsx:136`
- `apps/web/src/components/bookings/BookingDetail.tsx:299`
- `apps/web/src/components/bookings/BookingDetail.tsx:822`
- `apps/web/src/components/bookings/BookingDetail.tsx:844`

The web booking detail can cancel upcoming bookings and complete active bookings, but it does not offer provider actions for:

- `PENDING -> CONFIRMED`
- `CONFIRMED -> IN_PROGRESS`

It only calls `update(..., { status: "COMPLETED" })` from the active UI. This matches the mobile P0: the backend requires intermediate transitions, but the UI does not expose them.

Expected:

- Providers can confirm pending direct bookings.
- Providers can start confirmed bookings.
- Providers can complete only in-progress bookings.
- Clients cannot execute provider-only transitions.
- UI labels should match backend status, not only collapsed visual states like `upcoming`.

### Web Messaging Does Not Bind First Contact To Conversation UI

Files:

- `apps/web/src/components/provider-profile/ContactDialog.tsx:51`
- `apps/web/src/components/provider-profile/ContactDialog.tsx:58`
- `apps/web/src/app/messages/MessagesClient.tsx:123`
- `apps/web/src/app/messages/MessagesClient.tsx:133`

The provider profile contact dialog sends the first message, closes, and does not navigate to or bind the user to the created conversation. `/messages` can send only inside the currently selected conversation and has no route/query parameter for opening a specific newly created conversation.

Expected:

- Send-message API response should expose the conversation id.
- First contact should either navigate to `/messages?conversationId=...` or update local conversation state.
- `/messages` should select the requested conversation if provided.
- Users should see the first sent message after sending it.

## P1 Web Findings

### Dashboard Sidebar Links Point To Missing Routes

Files:

- `apps/web/src/components/layout/AppShell.tsx:52`
- `apps/web/src/components/layout/AppShell.tsx:60`
- `apps/web/src/components/layout/AppShell.tsx:74`

The sidebar links include routes that do not exist:

- `/dashboard/client/favorites`
- `/dashboard/provider/profile`
- `/dashboard/provider/services`
- `/dashboard/provider/reviews`
- `/dashboard/provider/stats`
- `/dashboard/admin/users`
- `/dashboard/admin/providers`
- `/dashboard/admin/categories`
- `/dashboard/admin/stats`

Some of these functions exist as tabs inside `/dashboard/admin`, while others are not implemented. Clicking them will 404.

Expected:

- Remove missing links, redirect them, or create the routes.
- Admin tab links should either use query/hash state on `/dashboard/admin` or real nested routes.
- Provider links should point to existing pages or be hidden.

### Admin Page Has No Client-Side Role Guard

Files:

- `apps/web/src/app/dashboard/admin/page.tsx:97`
- `apps/web/src/app/dashboard/admin/page.tsx:132`

The admin dashboard queries admin APIs for any authenticated user. Backend guards should reject non-admin users, but the web page has no explicit role guard or redirect. Non-admin users can land on an admin shell with errors.

Expected:

- Only `ADMIN` users can remain on `/dashboard/admin`.
- Non-admin users get a clear redirect or access denied state before admin API queries are enabled.

### Discovery Sort, Pills, And Map Are Partly Prototype

Files:

- `apps/web/src/app/services/ServicesPageContent.tsx:386`
- `apps/web/src/app/services/ServicesPageContent.tsx:425`
- `apps/web/src/app/services/ServicesPageContent.tsx:923`
- `apps/web/src/app/services/ServicesPageContent.tsx:980`

The sort dropdown changes local state only; it is not included in backend search params. The `< 20 km`, `Top rated`, and `Expert` pills are rendered without state or query behavior. The map is a synthetic SVG with fixed labels and pins based on array index, not provider coordinates.

Expected:

- Sort options should affect backend results or be removed.
- Filter pills should either update query params and backend results or be hidden.
- Map should use real provider coordinates/service zones or be labeled/hidden as a non-launch preview.

### Provider Quote CTA Can Open An Unsendable Quote Composer

Files:

- `apps/web/src/app/pro/ProviderDashboardClient.tsx:270`
- `apps/web/src/app/pro/devis/new/QuoteComposeClient.tsx:176`
- `apps/web/src/app/pro/devis/new/QuoteComposeClient.tsx:635`

The provider dashboard has a "Create quote" CTA that opens `/pro/devis/new` without a request id. The quote composer disables submission when there is no `requestId` and tells the user a request is required.

Expected:

- Hide the dashboard create-quote CTA unless a request is selected.
- Or support standalone quotes if that is a real product flow.

### Client Request And Quote Inbox Is Still Incomplete On Web

Files:

- `apps/web/src/app/quotes/[id]/QuoteDetailClient.tsx`
- `apps/web/src/app/pro/requests/JobRequestsClient.tsx`
- `apps/web/src/app/pro/devis/new/QuoteComposeClient.tsx`

Web has client quote detail/accept/decline and provider quote creation, but there is no clear client UI to create job requests or list received quotes. This is better than mobile, but still incomplete for a client-driven quote/request marketplace flow.

Expected:

- If request/quote is launch scope, add client request creation and request/quote inbox.
- If not launch scope, hide provider/client quote entry points that depend on missing client request creation.

### Verification And Onboarding Still Use Placeholder Uploads

Files:

- `apps/web/src/app/pro/onboarding/ProviderOnboardingClient.tsx:736`
- `apps/web/src/app/pro/verify/VerifyWizard.tsx:71`

Provider onboarding uses `placeholder://avatar`. Verification upload uses a generated placeholder URL. This matches the mobile verification gap.

Expected:

- Wire real upload storage, or make the launch policy explicit and remove fake file implications.
- Admin review should show exactly what was submitted.

### Payment And Guarantee Copy Overpromises Current Backend Reality

Files:

- `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/app/pro/earnings/EarningsClient.tsx`

The web booking and detail pages mention protected payment, refunds, and fast Mobile Money payout. The backend currently does not support a complete online payment, escrow, refund, or production payout lifecycle.

Expected:

- If launch is cash/offline, copy should say that plainly.
- If KAYOU-held payment is launch scope, payment confirmation, refund, and payout states must be implemented end to end.

## Recommended Web Workstream

Add a web-specific implementation workstream after the shared backend/mobile P0s:

- First fix shared backend contracts and mobile direct booking/messaging status transitions.
- Then run a web parity agent to apply those contracts to `apps/web`.
- If web is launch-facing, do not consider launch-ready until the web parity workstream passes manual E2E on auth, direct booking, booking status transitions, messaging, reviews, and admin access.

## Minimum Web Launch Checklist

- Provider signup on web persists `PROVIDER` and reaches `/pro/onboarding`.
- Client signup on web persists `CLIENT`, captures profile fields, and reaches client dashboard/search.
- Client can create a direct booking and is routed to a real booking detail.
- Provider can confirm, start, and complete that booking.
- Client can review only after completion and review is persisted.
- First provider-profile message appears in `/messages`.
- Admin login routes to `/dashboard/admin` and non-admin users cannot view admin UI.
- No visible web navigation item routes to a 404.
- Search filters and map are either real or hidden.
- Payment/guarantee/payout copy matches implemented backend behavior.

