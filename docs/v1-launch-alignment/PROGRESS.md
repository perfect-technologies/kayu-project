# KAYOU V1 Launch Alignment - Progress

## Status Summary

Created: 2026-05-09

This workstream aligns the existing Kinshasa MVP implementation with the latest v1 product feedback:

- final offers auto-confirm bookings,
- clients do not accept/decline final offers,
- pricing is starting-from guidance,
- final-offer price is the agreed price,
- cash remains the only v1 payment mode,
- commission tracking is internal and consistent,
- online payment, quote marketplace, payouts, and invoice/devis comparison stay hidden.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Contract | Done | Planning | Revised v1 launch truth documented |
| 01 - Auto-Confirmed Final Offers | Not started | TBD | P0 backend/API contract change |
| 02 - Pricing And Commission Policy | Not started | TBD | P0 pricing/cash/commission consistency |
| 03 - Web V1 Flow Alignment | Not started | TBD | P0 if web launch-facing |
| 04 - Mobile V1 Flow Alignment | Not started | TBD | P0 if mobile launch-facing |
| 05 - Provider Onboarding Tightening | Not started | TBD | P1 onboarding and verification cleanup |
| 06 - Discovery Map Distance And Reviews | Not started | TBD | P2 unless promoted |
| 07 - V1 QA And Release Smoke | Not started | TBD | P0 after implementation |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-05-09 | Final offers are agreement records, not client approval requests | Client and provider have already agreed before provider records the final offer |
| 2026-05-09 | Provider-created final offer should immediately create or confirm booking | Removes duplicate client action and matches local workflow |
| 2026-05-09 | Client accept/decline final-offer UI is removed from v1 | Avoids asking the client to re-approve agreed terms |
| 2026-05-09 | Starting-from pricing stays as provider discovery guidance | Final price is negotiated in chat/phone and recorded in final offer |
| 2026-05-09 | Cash remains the only v1 payment mode | Online/mobile money payment comes later |
| 2026-05-09 | Quote marketplace, public job requests, payouts, and invoices stay hidden | Too complex for v1 launch |
| 2026-05-09 | 10% commission is treated as internal policy until display is approved | Product note references 10% example, but client launch flow should stay simple |

## Open Questions

- Should commission be visible to providers as `Gain net estime`, or remain admin/internal only for v1?
- Should direct booking request remain useful, or should chat plus provider-issued final offer become the primary path?
- Should phone verification be required before provider publish, or only before verified badge?
- Should the 24h verification promise be explicit in product copy before the admin workflow is tested?
- Should mandatory review mean hard blocking future bookings, or persistent review reminders?
- Should map/distance be promoted from P2 to required v1 launch scope?

## Known Starting Point

Docs already show the prior Kinshasa MVP reset as completed through workstreams 01-07, with QA in review:

- `docs/kinshasa-mvp-implementation/PROGRESS.md`

Current implementation characteristics:

- Final offers exist but currently support client accept/decline.
- Job requests and quote marketplace are hidden by launch flags by default.
- Booking and final-offer prices exist, but money representation is mixed between floats and integers.
- Booking earnings compute a hardcoded 10% fee.
- Provider onboarding collects most required fields, but identity/portfolio upload is placeholder behavior.
- Map/distance is not implemented as real provider search.

## How To Update This File

When starting work:

- Set the workstream status to `In progress`.
- Add owner/agent name.
- Add start date and scope note.

When finishing work:

- Set status to `Done` or `Blocked`.
- List changed files.
- List commands run and result.
- Add decisions to the Decisions Log.
- Add blockers or follow-ups to Open Questions or a new blocker section.

## Workstream Evidence

Add implementation evidence below as each workstream completes.
