# 04 - Provider Profile

## Status

Ready after reading `00`.

## Goal

Use the prototype profile visual hierarchy while preserving current provider visibility, contact, booking, and final-offer entry logic.

## Owns

- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- `apps/web/src/components/provider-profile/*`
- `apps/web/src/components/providers/ProviderCard.tsx` only for profile-entry consistency

## Keep Current Flow

- Profile data stays API-backed.
- Visibility/privacy gates stay intact.
- Primary launch action should guide toward conversation.
- Direct booking can remain if it matches current Kinshasa MVP, but copy must not imply checkout/payment protection.
- Final offer is not created on the profile; it is created from chat after discussion.

## Prototype Inputs

Borrow:

- Visual hero profile card
- Floating back/share/favorite buttons on mobile
- Overlapping avatar/stat treatment
- Trust chips and verification layering
- Structured tabs/sections for about, certifications, ratings, portfolio, reviews
- Sticky mobile bottom action bar

## Tasks

1. Make provider identity, trust, rating, location, response time, and price guidance immediately visible.
2. Make the contact/message CTA obvious.
3. Replace any `Paiement sécurisé`, refund, payout, or online payment copy.
4. Normalize portfolio/review cards to shared tokens.
5. Ensure profile works in mobile web without horizontal overflow.

## Do Not

- Do not copy prototype `/pros/jean-mubake` route.
- Do not add protected payment.
- Do not add quote request CTAs.
- Do not expose verification claims unless backed by current data.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
```

Manual routes:

- `/providers/[id]`
- profile with visible phone
- profile without visible phone
- mobile viewport 390px

