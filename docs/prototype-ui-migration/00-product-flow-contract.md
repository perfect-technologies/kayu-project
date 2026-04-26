# 00 - Product Flow Contract

## Status

Ready for all agents.

## Goal

Freeze the business flow before visual migration work starts.

The new prototype contains useful UI, but it also contains old product assumptions: provider request inboxes, quote competition, protected payments, payouts, disputes, and ops-heavy admin. Those are not launch truth for Kinshasa MVP.

## Launch Truth

The app should feel like a fast local service marketplace:

1. Find a provider.
2. Check trust signals and price guidance.
3. Start a conversation.
4. Agree in chat.
5. Provider sends a final offer.
6. Client accepts.
7. Work happens.
8. Client pays cash directly to provider.
9. Review after completion.

## Flow Ownership

Current source of truth:

- Web final offer flow: `apps/web/src/app/messages/MessagesClient.tsx`
- Backend final offer API: `apps/backend/src/modules/bookings/final-offers.controller.ts`
- API client: `packages/api/src/endpoints.ts`
- Shared models: `packages/schemas/src/models.ts`
- Product reset docs: `docs/kinshasa-mvp-implementation/`

## Copy Rules

Use:

- `Envoyer une offre finale`
- `Offre finale`
- `Prix convenu`
- `Paiement en espèces à la fin de la mission.`
- `Discuter avec le prestataire`
- `Contacter le client`

Avoid for launch:

- `Devis` as the main user-facing flow
- `Demande envoyée à plusieurs pros`
- `Paiement sécurisé`
- `Remboursement garanti`
- `Mobile Money`
- `Commission KAYOU`
- `Payout`
- `En route`
- `Arrivé`

## Acceptance Criteria

- No launch-facing UI asks clients to compare provider quotes.
- No launch-facing UI suggests online payment is available.
- Final offer is created from chat, not from a request marketplace route.
- Cash wording is visible wherever payment is mentioned.
- Deferred routes remain behind launch flags or out of navigation.

