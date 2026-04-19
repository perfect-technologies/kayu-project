# Data Model Audit

## Core Tables And Launch Relevance

| Model | Launch Use | Current Risk |
| --- | --- | --- |
| `User` | Auth actor, role, profile, location, client trust. | `role` defaults to `CLIENT`, which breaks explicit signup role handling unless mobile always calls `setRole`. |
| `Provider` | Public provider profile, availability, verification, stats. | Published state depends on `onboardingCompleteAt`, but not every provider creation path sets it. |
| `Category`, `Subcategory`, `Trade`, `ProviderCategory`, `ProviderTrade` | Discovery taxonomy and provider skills. | Mobile filters mostly by category; subcategory/trade discovery is not deeply wired. |
| `Booking` | Direct booking and quote-created booking lifecycle. | State machine is too coarse for real ops and mobile does not expose all legal transitions. |
| `Review`, `ClientReview` | Client-to-provider and provider-to-client reputation. | Provider-to-client review has no mobile/API controller path; client reviews exist only in backend schema/service logic. |
| `Conversation`, `Message` | Client/provider messaging. | Conversation creation response does not include conversation id in mobile flow; no attachment support in app. |
| `Notification` | Role event feed. | Notifications are created but not deeply surfaced/handled in mobile. |
| `Favorite` | Client saved providers. | Basic client favorite works. |
| `VisibilitySettings` | Profile privacy. | Search only honors `appearInSearch`/`appearInCategory`; messaging/contact settings are not enforced. |
| `JobRequest`, `JobRequestMatch`, `Quote`, `QuoteLineItem` | Thumbtack-style request/quote flow. | Backend exists; client mobile flow is missing. |
| `Transaction`, `Payout` | Provider earnings and payouts. | Payment source of truth is incomplete; payouts are PSP stubs. |
| `VerificationDoc` | Provider KYC docs. | Real storage/review pipeline missing. |
| `Dispute`, `DisputeEvidence` | Ops dispute management. | Provider response exists; client/admin dispute workflows are missing. |

## Booking Lifecycle Gaps

Current enum:

```text
PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED
PENDING/CONFIRMED -> CANCELLED
```

Minimum production lifecycle should distinguish:

- requested by client
- accepted by provider
- declined/rejected by provider
- reschedule requested
- en route/arrived, if shown in UI
- started
- completed by provider
- completion confirmed by client or auto-closed after timeout
- paid/settled
- disputed
- cancelled by client/provider/admin with reason and policy metadata

Current risks:

- No `DECLINED` booking status; provider cancellation is the only refusal mechanism.
- Client cannot confirm completion; provider unilaterally completes.
- `isPaid` is independent from completion and has no user-facing mutation.
- `cancelledBy` stores a user id, while mobile expects role-ish values in some card copy.
- No reschedule fields or availability conflict checks.
- Booking detail UI displays quote/invoice information even when no quote exists.

## Provider Publication And Search Visibility

Provider search filters require:

```ts
onboardingCompleteAt: { not: null }
```

This is good for preventing draft providers from appearing, but there are two creation paths:

- Legacy identity onboarding creates a provider profile with `trustScore` but does not set `onboardingCompleteAt`.
- New draft onboarding creates a provider row early with empty `profession`; publish later sets `onboardingCompleteAt`.

Recommended fix:

- Retire or update `/me/provider-onboarding` so it either becomes a draft endpoint or sets all launch-required publication fields.
- Make provider publication a single service method.
- Add a database invariant or service invariant: public providers must have `profession`, at least one category/trade, at least one service zone, rate/pricing, and `onboardingCompleteAt`.

## Trust Score And Badges

Issues:

- Draft onboarding creates a provider row without trust score.
- Publish for an existing draft provider updates only `profession` and `onboardingCompleteAt`; it does not create `trustScore`.
- Trust score/badges are recalculated on review creation, but new providers may have null trust state until first review.
- Admin verification can sync badges in admin service, but verification docs do not drive individual doc decisions.

Recommended fix:

- Always create `trustScore` when provider row is created or published.
- Add idempotent `ensureProviderTrustScore(providerId)`.
- Add tests for provider publish, admin verification, and review creation.

## Reviews And Reputation

Client-to-provider reviews:

- Backend correctly requires own completed booking.
- Backend prevents duplicate review per booking.
- Backend recalculates provider review count/trust score.

Gaps:

- Mobile does not use backend `review` object as reviewed state.
- Satisfaction tags are stored as JSON in schema but mobile app appends tags into comment text.
- Review photos are only counted in UI text; no storage/model relation.

Provider-to-client reviews:

- `ClientReview` model and DTO exist.
- No controller route was found for provider creating client review.
- No mobile provider UI after job completion asks the provider to rate the client.
- `clientScore`/`clientTrustLevel` are not recalculated from client reviews.

## Messaging And Contact Rules

The data model supports direct one-to-one conversations.

Missing production constraints:

- `VisibilitySettings.allowMessages` and `allowDirectContact` are not enforced before sending messages.
- No relation between conversation and booking/job request, so "active" message filters cannot know whether a thread belongs to an active booking.
- No attachment upload model; `fileUrl` exists but mobile has no storage flow.
- No message delivery/read receipts beyond server-side `isRead`.

## Job Request And Quote Model

Strengths:

- `JobRequest` supports category, subcategory, service, description, address, budget, urgency, matching count.
- `Quote` supports line items, discount, commission, payout amount, expiry, and accepted booking link.
- Accepting a quote creates a `CONFIRMED` booking.

Gaps:

- No client mobile UI for job request creation.
- No client mobile UI for quote list/detail/accept/decline.
- Accepting a quote marks `JobRequest` as `MATCHED`, but competing sent quotes remain sent unless declined/expired elsewhere.
- Quote-created booking has no payment capture.
- `computeScheduledDate("custom")` falls back to tomorrow unless a parseable ISO date is supplied; mobile custom date placeholder is `jj/mm/aaaa`, which JS parsing may not interpret reliably.

## Payment, Earnings, And Payouts

Observed behavior:

- Booking completion creates an `EARNING` transaction if booking price > 0.
- Transaction status is `COMPLETED` only if `booking.isPaid === true`; otherwise `PENDING`.
- Payout service is explicitly stubbed for future PSP calls.

Launch gaps:

- No client payment capture/confirmation.
- No admin payment reconciliation.
- No cash payment confirmation by provider/client.
- No refund/cancellation policy.
- No PSP webhooks.
- `phoneFull` is stored in payout table; needs security/privacy review.

## Data Quality And Seed Gaps

Seed data is useful for demos, but it can hide issues:

- Demo providers have rich profile data and verified statuses, so onboarding and verification gaps are less visible.
- Direct seeded bookings can populate dashboards even if live booking flow cannot.
- Supabase auth user seeding is optional; dev demo login fails unless `SEED_SUPABASE_USERS=true` and Supabase service keys are configured.

Recommended seed additions:

- One brand-new phone OTP client with no profile.
- One brand-new phone OTP provider with no provider profile.
- One pending direct booking.
- One confirmed booking ready to start.
- One in-progress booking ready to complete.
- One sent quote awaiting client acceptance.
- One provider with rejected verification docs.

