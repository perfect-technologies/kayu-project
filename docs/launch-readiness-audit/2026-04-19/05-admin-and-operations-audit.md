# Admin And Operations Audit

## Admin Access

Backend admin endpoints exist and are protected by `ADMIN` role:

- `/api/admin/users`
- `/api/admin/providers`
- `/api/admin/categories`
- `/api/admin/reviews`
- `/api/dashboard/admin`

Mobile admin UI does not exist. In `AppNavigator`, only `PROVIDER` gets pro tabs; `CLIENT` and `ADMIN` use client tabs.

Launch implication:

- If admins are expected to operate from mobile, this is a blocker.
- If admins will operate via a future web dashboard or direct API, document that and remove admin claims from mobile launch scope.

## Moderation Coverage

Implemented:

- User active/verified/role updates.
- Provider verification/premium/availability updates.
- Category CRUD.
- Review public/reply/edited moderation.
- Activity logs for admin mutations.

Missing or incomplete:

- No admin UI.
- No verification document review workflow.
- No dispute creation/resolution workflow for clients/admins.
- No booking intervention tools: refund, force cancel, reassign provider, mark paid, resolve payment.
- No message moderation/reporting.
- No provider portfolio/certification moderation beyond certification table and provider status.
- No audit export or compliance retention policy.

## Verification Operations

Current flow:

- Provider uploads verification docs through `/pro/verification/documents`.
- Provider submits docs; provider status becomes `UNDER_REVIEW`.
- Admin provider update can set provider `verificationStatus` to `VERIFIED` or `REJECTED`.

Problems:

- Admin approval does not mark docs as `APPROVED`.
- Admin rejection reason is written to pending `Certification`, not `VerificationDoc`.
- Provider verification screen displays first rejected doc reason, but admin status rejection may not populate doc rejection reason.
- There is no queue for `UNDER_REVIEW` verification docs.

Minimum launch fix:

- Add admin endpoint/screen to list provider verification submissions.
- Add approve/reject per document and approve/reject provider.
- Ensure rejection reason shown to provider comes from the same path admin writes.

## Disputes

Schema includes `Dispute` and provider can respond to active disputes through verification service routes, but:

- No client UI to open a dispute.
- No admin UI to triage/resolve dispute.
- No booking detail support CTA creates dispute.
- No evidence upload storage.
- No payment/refund connection.

Recommendation:

- For MVP, implement a simple support ticket/dispute path from booking detail.
- Admin must be able to mark status, resolution, refund percentage, and notes.
- Keep provider response flow, but move dispute routes out of verification module into a dedicated dispute module.

## Notifications

Backend creates notifications for:

- Booking new/confirmed/started/completed/cancelled.
- New message.
- New review.
- Badge earned.
- Job request new.
- Quote received/accepted/declined.
- Verification/certification events.

Gaps:

- Mobile does not have a full notification center.
- Notification taps are not routed to target screens.
- There are no push notification tokens or push delivery service.
- No read/unread UX beyond API.

Recommendation:

- Add notification center after core flows.
- For launch, at least route in-app dashboard badges to relevant lists.
- Push notifications are important for marketplace response time; plan immediately after MVP.

## Safety, Fraud, And Trust

Missing launch safeguards:

- No provider identity verification enforcement before appearing in search; search allows any published provider unless `verified` filter is applied.
- No phone verification model syncing from Supabase OTP to `phoneVerifiedAt`.
- No abuse reports on messages/reviews/providers.
- No blocked users.
- No cancellation policy or strike system.
- No duplicate account detection.
- No moderation queue for provider profile changes.

Recommended launch policy:

- Providers can draft profile before verification.
- Only verified providers appear in default search for launch, or unverified providers are clearly labeled and ranked lower.
- Require verified phone for both roles.
- Add basic report/block endpoints before public launch.

## Observability And Support

Missing:

- No structured request logging beyond Nest defaults.
- No error tracking.
- No analytics events for funnel drop-off.
- No admin support search by booking id/conversation/user.
- No health checks beyond default app route.

Minimum:

- Add `/api/health`.
- Add server error logging with request id.
- Add client-side error boundary/reporting.
- Track funnel events for auth, profile, search, booking create, provider accept, completion, review.

