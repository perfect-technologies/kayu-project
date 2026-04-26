# Kinshasa Launch Critical Smoke

Use this runbook against the seeded local environment before release candidates. The scenarios are ordered so later checks can reuse state created by earlier ones. Job requests, quote comparison, online payment, and en-route/arrived UI are out of launch scope and should remain hidden unless the launch flags are explicitly enabled for internal testing.

## 1. Client Signup And Discovery

Use a fresh phone/OTP identity or a clean test-auth identity for signup. Do not use seeded demo accounts for the signup portion.

1. Start signed out on `AuthScreen`.
2. Complete OTP verification for a new client account.
3. Choose `Je cherche un pro`.
4. Complete the required profile fields.
5. Assert the app lands in client tabs.
6. Open Search or Services.
7. Filter by `Plomberie` and `Kinshasa`.
8. Open `Jean-Pierre Mukendi` or another visible provider profile.
9. Assert profile actions include direct message/contact, optional call, and direct reservation.

## 2. Direct Contact

1. Sign in as `Paul Kabasele` from the auth-screen demo shortcuts.
2. Open Search and find `Jean-Pierre Mukendi` or his provider card.
3. Open the provider profile.
4. Tap `Envoyer un message`.
5. Send a first message such as `Bonjour, êtes-vous disponible demain ?`.
6. Assert the message renders immediately in chat.
7. Go back to `Messages`.
8. Assert the conversation thread now exists in the inbox.
9. Sign out and sign in as `Jean-Pierre Mukendi`.
10. Open `Messages`.
11. Assert the conversation is visible.
12. Reply to the client and assert the reply appears in the thread.

## 3. Client Direct Booking

1. Sign in as `Paul Kabasele`.
2. From the same provider profile, tap the direct reservation CTA.
3. Choose a service and duration, then continue.
4. Pick a date/time and continue.
5. Fill address and note, then tap `Confirmer`.
6. Assert the success state can open booking detail.
7. Open the booking detail.
8. Assert the booking status is `PENDING`.
9. Assert payment copy says `Paiement en espèces à la fin de la mission`.
10. Assert `Laisser un avis` is not visible while the booking is still pending.

## 4. Provider Booking Completion And Cash

1. Sign out and sign in as `Jean-Pierre Mukendi`.
2. Open the new pending booking from dashboard or bookings.
3. Assert the primary action is `Confirmer la demande`.
4. Confirm the booking.
5. Assert the visible next action is `Marquer comme terminée`; the hidden backend start transition should not appear as a separate launch workflow.
6. Complete the booking and assert the booking shows completed state.
7. Tap `Confirmer le paiement reçu` if visible.
8. Assert payment status changes to confirmed cash/offline copy.

## 5. Completed-Booking Review

1. Sign out and sign back in as `Paul Kabasele`.
2. Open the completed booking from `Bookings`.
3. Assert `Laisser un avis` is now visible exactly once.
4. Submit ratings plus a written comment of at least 10 characters.
5. Assert the success state appears.
6. Reopen the booking detail.
7. Assert the review CTA is gone and the booking is treated as reviewed.

## 6. Final Offer

1. Sign in as `Paul Kabasele` and create or reuse a conversation with `Jean-Pierre Mukendi`.
2. Sign in as `Jean-Pierre Mukendi`.
3. Open the conversation.
4. Send an `Offre finale` with service title, description, price, duration, schedule, address, and cash payment.
5. Sign back in as `Paul Kabasele`.
6. Open the conversation and accept the final offer.
7. Assert a confirmed booking exists in `Bookings`.
8. Repeat with a second final offer and decline it.
9. Assert the conversation remains usable and a follow-up message can be sent.

## 7. Launch Scope Guards

1. Client tabs do not expose job requests.
2. Provider tabs do not expose request inbox.
3. Quote comparison and quote acceptance are not visible in launch navigation.
4. Online payment, secure payment, invoice, payout, mobile-money, en-route, and arrived copy are not visible in launch-facing screens.
5. Cash copy is visible wherever payment is described.
