# 00 - Product Contract

## Goal

Freeze the v1 launch behavior before implementation starts.

KAYOU v1 should feel like a fast local service marketplace for Kinshasa: people find a provider, talk directly, agree on the work, and the provider records the agreement. The app should not ask the client to approve the same agreement again after the provider creates the final offer.

## Launch Truth

1. Provider profiles show fixed starting-from pricing only.
2. The actual final price is agreed in chat or by phone.
3. Final offer means `accord final`, not `devis a valider`.
4. Provider creates the final offer after both sides have already agreed.
5. Creating the final offer immediately creates or confirms the booking.
6. Client does not accept or decline final offers in v1.
7. Client can continue discussion if terms need correction.
8. Provider can issue an updated final offer when terms change.
9. Cash is paid directly between client and provider after the job.
10. KAYOU records payment/commission internally but does not promise online payment.

## Final Offer Definition

A final offer is an agreement document:

- service title,
- description,
- agreed price,
- estimated duration,
- scheduled date/time,
- address,
- notes,
- payment method: cash,
- internal commission data if required by the v1 commission policy.

It is not:

- a competitive quote,
- an invoice,
- a client approval request,
- an online payment request,
- a payout promise.

## Booking Lifecycle

Launch-facing lifecycle:

- `PENDING`: client requested a booking, or provider has not recorded final terms yet.
- `CONFIRMED`: provider confirmed the booking or created a final offer agreement.
- `COMPLETED`: provider completed the work.
- `CANCELLED`: one side cancelled.

Backend may keep `IN_PROGRESS` where already needed, but launch UI should not depend on route tracking, en route, arrived, or live status states.

## Pricing Policy

Provider listing/profile pricing is guidance only:

- use `A partir de ... FC`,
- do not show `/h`, `/heure`, `FC/h`, or hourly-rate language in launch-facing pricing,
- do not multiply the starting price by duration for direct booking estimates,
- do not present it as a guaranteed final price,
- always clarify that the final price is agreed with the provider.

Final offer pricing is the agreed price:

- store it on the final offer,
- store it on the resulting booking,
- use it for internal earnings/commission calculations.

## Payment Policy

V1 is cash-first:

- payment happens directly between client and provider,
- KAYOU is not responsible for in-person renegotiation,
- users should agree terms before service starts,
- no online payment, escrow, mobile money, refund guarantee, or payout automation is launch-facing.

Suggested copy:

- `Paiement en especes a la fin de la mission.`
- `Le prix final est convenu avec le prestataire avant l'intervention.`
- `KAYOU ne gere pas le paiement cash realise en personne.`
- `Gardez les termes convenus dans la conversation avant de commencer.`

Use accents where the target file already uses accented French.

## Commission Policy

The product notes mention a 10% example, such as `30 000 FC` client price and `27 000 FC` provider net.

For v1, commission should be internal unless explicitly approved for provider-facing display:

- store commission percentage,
- store gross agreed price,
- store commission amount,
- store provider net amount,
- use the final-offer/booking agreed price as the source of truth,
- avoid client-facing commission copy in launch flows.

## Out Of Scope

- Client final-offer accept/decline.
- Quote comparison.
- Public job request marketplace.
- Standalone quote/devis creation.
- Online payment.
- Mobile money collection.
- Payout automation.
- Invoice generation.
- Route tracking.
- Push/email/SMS as launch blockers.

## Acceptance Criteria

- No launch-facing final offer asks the client to accept or decline.
- Provider-created final offer immediately creates or confirms a booking.
- Booking and final-offer terms match.
- Starting-from pricing appears consistently across web/mobile.
- No launch-facing provider pricing is shown as hourly.
- Online payment and quote marketplace surfaces remain hidden.
- Cash disclaimer is visible where payment is mentioned.
- Internal commission tracking is consistent and test-covered.
