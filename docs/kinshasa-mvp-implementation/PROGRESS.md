# KAYOU Kinshasa MVP - Progress

## Status Summary

Created: 2026-04-25

The product decision is to launch with a simplified Kinshasa MVP:

- direct provider discovery,
- direct chat,
- direct booking,
- final offer after discussion,
- cash payment,
- simple completion and review.

Job requests and multi-provider quote competition are deferred for launch.

## Workstream Status

| Workstream | Status | Owner | Notes |
| --- | --- | --- | --- |
| 00 - Product Reset | Done | Planning | Product direction documented |
| 01 - Feature Flags And Navigation Cleanup | Not started | Unassigned | Hide launch-facing request/quote marketplace |
| 02 - Backend Final Offer And Booking Lifecycle | Not started | Unassigned | Define and implement final-offer contract |
| 03 - Web Direct Flow | Not started | Unassigned | Web discovery/chat/booking/final-offer launch flow |
| 04 - Mobile Direct Flow | Not started | Unassigned | Mobile discovery/chat/booking/final-offer launch flow |
| 05 - Discovery Filters And Provider Profile | Not started | Unassigned | Fix filters and provider profile truthfulness |
| 06 - Cash Payment And Copy Cleanup | Not started | Unassigned | Align all launch-facing copy with cash MVP |
| 07 - Provider Operations And Dashboards | Not started | Unassigned | Provider actions and direct booking operations |
| 08 - Launch QA And Smoke Tests | Not started | Unassigned | Final smoke scenarios and release evidence |

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-04-25 | Defer job requests and quote competition for launch | Too complex for Kinshasa MVP; direct conversation is more market-appropriate |
| 2026-04-25 | Keep cash as the only launch payment mode | Mobile money/online payment can come later; launch flow must be clear |
| 2026-04-25 | Remove en route / arrived from launch-facing UI | Not needed for MVP and not fully modeled in backend |
| 2026-04-25 | Add final offer after discussion | Gives both parties a simple agreement without quote competition |

## Open Questions

- Should final offer be a new first-class model, or should it reuse/update bookings?
- Should phone call be a primary CTA everywhere provider phone is visible and allowed?
- Should provider completion require client cash confirmation before review, or can review happen after provider marks completed?

## How To Update This File

When starting work:

- Set status to `In progress`.
- Add owner/agent name.
- Add start date and scope note.

When finishing work:

- Set status to `Done` or `Blocked`.
- List changed files.
- List commands run and result.
- Add any decisions to the Decisions Log.
- Add any remaining blockers to Open Questions or a new blocker section.
