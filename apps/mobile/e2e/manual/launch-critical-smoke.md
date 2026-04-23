# Launch Critical Smoke

Use this runbook against the seeded local environment before release candidates. The scenarios are ordered so later checks can reuse state created by earlier ones.

## 1. Auth Role Selection

Use a fresh phone/OTP identity or a clean test-auth identity. Do not use seeded demo accounts for this check.

1. Start signed out on `AuthScreen`.
2. Complete OTP verification for a new account.
3. On the role picker, choose `Je suis un pro`.
4. Assert the next route lands in the provider path: pro tabs or provider onboarding, never client tabs.
5. Repeat with a second fresh account and choose `Je cherche un pro`.
6. Assert the client path requires name capture, then lands in client tabs.
7. Sign out and sign back in with each identity.
8. Assert returning users keep their previously selected role.

## 2. Messaging Bootstrap From Provider Profile

1. Sign in as `Paul Kabasele` from the auth-screen demo shortcuts.
2. Open Search and find `Jean-Pierre Mukendi` or his provider card.
3. Open the provider profile.
4. Tap `Envoyer un message`.
5. Send a first message such as `Bonjour, êtes-vous disponible demain ?`.
6. Assert the message renders immediately in chat.
7. Go back to `Messages`.
8. Assert the conversation thread now exists in the inbox.

## 3. Client Direct Booking

1. Stay signed in as `Paul Kabasele`.
2. From the same provider profile, tap `Réserver`.
3. Choose a service and duration, then continue.
4. Pick a date/time and continue.
5. Fill address and note, then tap `Confirmer`.
6. Assert the success state can open booking detail.
7. Open the booking detail.
8. Assert the booking status is `PENDING`.
9. Assert `Laisser un avis` is not visible while the booking is still pending.

## 4. Provider Status Transitions

1. Sign out and sign in as `Jean-Pierre Mukendi`.
2. Open the new pending booking from dashboard or bookings.
3. Assert the primary action is `Confirmer la demande`.
4. Confirm the booking and assert the next primary action becomes `Démarrer l’intervention`.
5. Start the booking and assert the next primary action becomes `Marquer comme terminée`.
6. Complete the booking and assert the booking shows completed state.
7. If payment is still pending, optionally tap `Confirmer le paiement reçu` and verify the payment label changes to confirmed cash/offline copy.

## 5. Completed-Booking Review

1. Sign out and sign back in as `Paul Kabasele`.
2. Open the completed booking from `Bookings`.
3. Assert `Laisser un avis` is now visible exactly once.
4. Submit ratings plus a written comment of at least 10 characters.
5. Assert the success state appears.
6. Reopen the booking detail.
7. Assert the review CTA is gone and the booking is treated as reviewed.

## 6. Quote Acceptance

Run this only while the job-request and quote flow remains in launch scope.

1. As `Paul Kabasele`, open the client requests flow and create a job request.
2. Sign in as `Jean-Pierre Mukendi`, open provider requests, and send a quote.
3. Sign back in as `Paul Kabasele`, open the request detail, and review the received quote.
4. Tap `Accepter`.
5. Assert the app routes to `BookingDetail` for the created booking.
6. Assert the created booking is already `CONFIRMED`.
