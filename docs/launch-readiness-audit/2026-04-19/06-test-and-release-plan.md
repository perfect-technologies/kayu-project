# Test And Release Plan

## Current Validation Result

Compile checks passed:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/mobile type-check
```

There are no meaningful automated E2E tests observed for the marketplace flows. Passing type checks currently misses the main defects because the mobile app uses casts, local interfaces, placeholder UI, and runtime navigation flows.

## Required Test Environments

1. Local API with Postgres seeded.
2. Supabase test project with seeded auth users, or a mock auth strategy for E2E.
3. Expo mobile test target.
4. Stable demo accounts:
   - Client with no profile.
   - Client with completed profile.
   - Provider with no provider profile.
   - Provider with draft onboarding.
   - Published unverified provider.
   - Published verified provider.
   - Admin.

## Backend Integration Tests

Add tests around service/controller behavior first. Recommended priority:

### Identity/Auth

- `/me` creates user from Supabase claims.
- New user default role does not override explicit signup role.
- `setRole(CLIENT)` works for fresh user.
- `setRole(PROVIDER)` works for fresh user.
- Unsafe role changes after activity are rejected.
- inactive user is blocked by `ActorGuard`.

### Provider Onboarding

- `patchDraft` saves user fields and provider fields.
- `patchDraft` does not publish provider.
- `publish` requires required fields.
- `publish` sets role provider, `onboardingCompleteAt`, category, service zones, skills, trust score.
- Published provider appears in `/providers`.
- Draft provider does not appear in `/providers`.

### Provider Search

- category id and category slug filters work.
- city/service zone filters work.
- availability/verified/min price/max price filters work.
- hidden provider does not appear.
- pagination returns stable total and pages.

### Direct Booking

- client creates pending booking.
- provider cannot book self.
- unavailable provider cannot be booked.
- provider can transition pending to confirmed.
- provider can transition confirmed to in-progress.
- provider can transition in-progress to completed.
- client cannot perform provider-only transitions.
- cancel allowed for pending/confirmed only.
- completion creates one earning transaction only once.

### Messaging

- send first message creates conversation.
- response includes enough data for client to open/render conversation.
- self-message rejected.
- non-participant cannot read conversation.
- unread count updates when recipient reads.
- messaging respects `allowMessages` if product keeps that setting.

### Reviews

- review only completed own booking.
- duplicate review rejected.
- provider rating/trust score updates.
- reviewed booking response includes `review` or `reviewed`.
- provider-to-client review endpoint once added.

### Job Requests / Quotes

- client creates job request and matches verified providers.
- provider inbox shows only matched open requests.
- provider can send quote.
- client can list quotes.
- client can accept quote and booking is created.
- job request becomes matched.
- quote expiration works.
- custom start date parses predictably.

### Admin

- admin can deactivate user.
- admin cannot deactivate self.
- admin can verify/reject provider.
- admin verification writes provider and doc states consistently.
- admin review moderation hides review from public endpoint.

## Mobile E2E Scenarios

Use Detox or Maestro. Start with high-value smoke tests:

### Client Direct Booking Happy Path

1. Login as client.
2. Open search.
3. Select category.
4. Open provider profile.
5. Tap book.
6. Fill service/date/address.
7. Confirm booking.
8. Assert app lands on booking detail/list with `PENDING`.
9. Assert review CTA is not visible.

### Provider Direct Booking Completion

1. Login as provider.
2. Open bookings/requests.
3. Open pending booking.
4. Accept.
5. Start job.
6. Complete job.
7. Assert booking is completed.
8. Assert earnings pending/completed state matches payment policy.

### Client Review After Completion

1. Login as client with completed unreviewed booking.
2. Open booking detail.
3. Tap review.
4. Complete dimensions/comment.
5. Submit.
6. Assert review CTA disappears.
7. Open provider profile and assert review appears.

### Messaging From Provider Profile

1. Login as client.
2. Open provider profile.
3. Tap message.
4. Send first message.
5. Assert message appears immediately.
6. Back to conversations and assert thread exists.
7. Login as provider and assert unread conversation exists.

### Provider Quote Flow

Only after client quote UI exists:

1. Client creates job request.
2. Provider receives request.
3. Provider sends quote.
4. Client accepts quote.
5. Both users see confirmed booking.

## Manual Launch Checklist

Before any public pilot:

- New client signup works on real phone OTP.
- New provider signup works on real phone OTP.
- Provider can publish and appears in search.
- Client can create booking and provider sees it.
- Provider can accept/start/complete.
- Client can review only after completion.
- Messaging works from profile and booking detail for both roles.
- Verified/unverified provider labels are accurate.
- Admin can deactivate abusive user/provider.
- Admin can approve/reject provider verification.
- No placeholder "coming soon" primary launch features are visible.
- All copy is consistent: KAYOU vs KAYU naming, country names, payment promises.

## Release Strategy

Recommended:

1. Internal dogfood with direct booking only.
2. Close quote/job-request features behind a feature flag until client flow is complete.
3. Pilot in one city, likely Kinshasa, with verified providers only.
4. Add support/admin workflow before paid acquisition.
5. Add push notifications before scaling provider matching.
