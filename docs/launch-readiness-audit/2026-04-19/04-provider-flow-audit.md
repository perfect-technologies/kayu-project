# Provider Flow Audit

## Provider Signup

Expected:

1. User selects "Je suis un pro".
2. User verifies phone OTP.
3. Backend records role `PROVIDER`.
4. App lands in pro tabs with onboarding banner.

Current blocker:

- Backend local `User.role` defaults to `CLIENT`.
- Mobile only calls `setRole` during signup when `!userRole`.
- New users returned by `/me` therefore already have `CLIENT`, so provider signup can skip provider role selection and land in client tabs.

Fix:

- During signup, always call `setRole({ role: chosenRole })` after OTP, regardless of current default role, unless account already has meaningful role selection.
- Backend should allow default `CLIENT -> PROVIDER` only during onboarding/signup and reject unsafe role changes after provider/client activity begins.

## Provider Onboarding

Expected:

1. Draft is saved safely across steps.
2. Provider profile is not public until publish.
3. Publish writes all required public profile fields.
4. Published provider appears in search.
5. Provider can later edit profile, zones, pricing, portfolio, availability.

Current issues:

- Draft patch creates a provider row early with empty `profession`.
- Several important fields live only in `User.onboardingDraft` JSON: ID upload flags, primary category, subcategory ids, zone radius, visit fee, bio, languages.
- `subcategoryIds` are accepted in draft but not applied to `ProviderTrade`.
- Publish updates existing draft provider with `profession` and `onboardingCompleteAt`, but does not create missing `trustScore`.
- Avatar uses `placeholder://avatar`, not a real image upload.
- ID uploads are booleans in onboarding, separate from real verification docs.
- Onboarding controller has no provider role guard; it can convert a client into provider on publish. That may be intended, but should be explicit and safe.

Fixes:

- Decide whether signup role or onboarding publish is the source of provider role truth; implement one coherent flow.
- Add `ensureProviderTrustScore` on provider creation/publish.
- Map selected subcategory/trade data into `ProviderTrade`.
- Replace avatar/ID booleans with real upload URLs or remove upload claims.
- Add provider edit screens for portfolio, services/trades, zones, and rates.

## Provider Dashboard

Expected:

1. Provider sees onboarding/verification status.
2. Provider sees pending bookings requiring action.
3. Provider sees today's confirmed/in-progress jobs.
4. Provider can toggle availability.
5. Provider can navigate to each request/booking.

Current issues:

- Dashboard "Nouvelles demandes" cards have Decliner/Envoyer un devis buttons without handlers in the dashboard card component. The dedicated Requests tab works, but the dashboard cards are dead.
- Provider pending direct bookings are not surfaced as an action queue; dashboard "today" only includes `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`.
- Planning card `JobCard` accepts `onPress`, but dashboard map does not pass it.
- Availability toggle works against API.
- Dashboard assumes provider role; if provider signup is broken, it is unreachable.

Fixes:

- Add dashboard navigation/actions for request quote/decline.
- Add "booking requests" section for direct `PENDING` bookings.
- Make every dashboard job/request card navigate to detail.

## Provider Requests And Quotes

Expected:

1. Provider sees matched client job requests.
2. Provider can dismiss or quote.
3. Quote sends notification to client.
4. Client can accept/decline.
5. Provider sees quote status and accepted booking.

Current state:

- Requests tab loads `/pro/requests`.
- Dismiss works.
- Quote compose creates then sends a quote.
- Client accept/decline UI is missing, so provider quote flow dead-ends after send.
- Dashboard request cards are not wired, while Requests tab cards are wired.
- Provider quote history exists in API but no mobile quote history/list screen was found.

Fixes:

- Implement client quote inbox first or hide quote features.
- Add provider quote history/status screen.
- On quote send success, show status and link to quote detail/request.
- On quote accepted notification, route provider to created booking detail.

## Provider Direct Booking Execution

Expected:

1. Provider sees new direct booking as `PENDING`.
2. Provider confirms or declines.
3. Provider starts the job.
4. Provider completes the job.
5. Provider can message client throughout.
6. Provider sees earnings after payment/settlement.

Current blockers:

- Booking detail only exposes cancel for upcoming bookings.
- The only provider status CTA is "Marquer comme terminee" for active bookings.
- Backend requires `PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED`.
- No UI action exists for `PENDING -> CONFIRMED`.
- No UI action exists for `CONFIRMED -> IN_PROGRESS`.
- Message action targets provider user id even when the provider is viewing the booking, causing self-message rejection.

Fixes:

- Add role/status action matrix:

| Status | Client Actions | Provider Actions |
| --- | --- | --- |
| `PENDING` | cancel, message | accept, decline/cancel, message |
| `CONFIRMED` | cancel within policy, message | start job, cancel with reason, message |
| `IN_PROGRESS` | message/support | complete, message/support |
| `COMPLETED` | review, receipt/support | view payout, optionally review client |
| `CANCELLED` | support/message | support/message |

- Fix message recipient selection by role.
- Add tests for every valid and invalid booking transition.

## Provider Reviews Of Clients

Expected:

1. After completing a booking, provider can rate the client.
2. Client score/trust level update.
3. Future providers can see client reliability where privacy allows.

Current state:

- Data model and DTO exist.
- No controller route or mobile UI was found.
- `clientScore` and `clientTrustLevel` are not actively recalculated.

Fix:

- Add provider client-review endpoint and post-completion provider UI.
- Recompute `User.clientScore` and `clientTrustLevel`.
- Add visibility controls for client history.

## Provider Earnings

Expected:

1. Completed/paid jobs produce available or pending balance.
2. Provider can request payout through mobile money.
3. Provider can see fees, pending payout, completed payout.

Current issues:

- Booking completion creates a transaction, but payment state is not controlled by a real payment flow.
- If `booking.isPaid` is false, earnings remain pending.
- Payout PSP call is a stub.
- No admin reconciliation screen.

Launch choice:

- For MVP, support cash/offline payment explicitly: provider marks cash received, client confirms, transaction becomes completed.
- Or integrate mobile money before exposing payout claims.

## Provider Verification

Expected:

1. Provider uploads real KYC docs.
2. Admin reviews each doc and approves/rejects.
3. Provider status becomes verified or rejected with reason.
4. Public profile badge reflects verification.

Current issues:

- Mobile verification uses `pretendUploadUrl`.
- Upload simply stores supplied URL metadata.
- Admin provider verification changes provider status but does not review individual `VerificationDoc` decisions.
- Onboarding ID booleans and verification docs are separate systems.

Fixes:

- Integrate real file picker/camera and storage.
- Add admin verification review UI/API for individual docs.
- Merge or clearly separate onboarding identity collection and KYC verification.

