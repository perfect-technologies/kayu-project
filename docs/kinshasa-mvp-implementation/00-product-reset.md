# 00 - Product Reset: Kinshasa MVP

## Goal

Reset the current implementation toward a simpler launch flow for Kinshasa.

The MVP should avoid over-engineering and match local behavior: people find a professional, talk directly, agree fast, and pay cash after work.

## What Changes

The platform currently supports two concepts:

1. Direct provider booking.
2. Client job request with provider quote competition.

For launch, keep direct provider booking and hide the job-request/quote competition path.

## Target Client Flow

1. Client lands on home, category page, or services page.
2. Client searches for a provider.
3. Client opens a provider profile.
4. Client can:
   - call provider if phone is available,
   - message provider,
   - request a booking directly.
5. Client and provider agree details in chat or by phone.
6. Provider sends a final offer only after discussion.
7. Client accepts the final offer.
8. The app creates or confirms the booking.
9. Provider completes the work.
10. Client confirms cash payment and reviews provider.

## Target Provider Flow

1. Provider receives a direct booking request or a message.
2. Provider discusses with client.
3. Provider confirms the booking or sends a final offer.
4. Provider completes the job.
5. Provider sees completed cash job in earnings/history.

## Final Offer Definition

A final offer is not a competitive quote and not an invoice.

It is a lightweight confirmation of what both sides already discussed:

- service title,
- description,
- agreed price,
- estimated duration,
- scheduled date/time,
- address,
- notes,
- payment method: cash.

Client actions:

- Accept
- Decline
- Continue discussion

On accept:

- Create a confirmed booking, or update an existing pending booking.
- Link the offer to the conversation and booking where possible.
- Notify both users in-app.

## Launch Booking Lifecycle

Use the simplest visible lifecycle:

- `PENDING`: client requested or provider sent final offer waiting for client.
- `CONFIRMED`: both sides agreed.
- `COMPLETED`: provider completed the work.
- `CANCELLED`: one side cancelled.

`IN_PROGRESS` may remain in backend if already used, but launch UI should not depend on en route or arrived states.

## Out Of Scope

- Multi-provider quote comparison.
- Standalone public job requests.
- Provider request inbox.
- En route / arrived tracking.
- Online payment.
- Payout automation.
- Push/email/SMS as required launch dependencies.

## Product Copy Principles

- Say "Paiement en espèces a la fin de la mission" where payment appears.
- Do not say "paiement sécurisé" unless online/mobile money payment exists.
- Use "Offre finale" only after client and provider have discussed.
- Use "Demander une réservation" for direct booking.
- Use "Contacter" or "Discuter" as the primary action on provider profiles.
