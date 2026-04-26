# 05 - Messages And Final Offer

## Status

Ready after reading `00`.

## Goal

Make chat the obvious place where work gets agreed and final offers are sent, accepted, or declined.

## Owns

- `apps/web/src/app/messages/MessagesClient.tsx`
- `apps/mobile/src/screens/messages/ChatScreen.tsx`
- shared final-offer card/composer components if extracted
- `packages/api/src/endpoints.ts` only if UI needs existing API typing improvements
- `packages/schemas/src/*` only if displaying existing fields needs type exports

## Keep Current Flow

- Provider sends final offer from conversation.
- Client accepts or declines in conversation.
- Accepting confirms or creates a cash booking.
- Chat remains usable after decline.
- No standalone quote route for launch.

## Prototype Inputs

Borrow:

- Split desktop layout
- Mobile list-first/thread-after-selection behavior
- Thread list status chips and unread count
- Sender/receiver bubble shape and spacing
- Centered system event pills
- Offer/summary card anatomy
- Composer clarity

## Tasks

1. Make provider final-offer CTA obvious without hiding icons.
2. Replace old `devis` language in chat suggestions/statuses with final-offer language.
3. Improve final-offer card hierarchy:
   - title,
   - price,
   - date/time,
   - duration,
   - address,
   - cash payment note,
   - accept/decline for clients.
4. Improve final-offer composer so it feels like a simple agreement, not a formal quote/invoice.
5. Ensure header and composer stay fixed while message history scrolls.
6. Ensure mobile chat has a visible provider CTA for `Envoyer une offre finale`.

## Do Not

- Do not add line-item quote builder for launch.
- Do not show KAYOU commission.
- Do not show provider payout.
- Do not show request expiry or competing providers.
- Do not add online payment.

## Validation

Run:

```bash
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/mobile type-check
```

Manual checks:

- Client conversation with no final offer.
- Provider conversation with final-offer CTA.
- Pending final offer.
- Accepted final offer.
- Declined final offer.
- Desktop and 390px mobile web.

