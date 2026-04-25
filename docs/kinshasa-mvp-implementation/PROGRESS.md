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
| 01 - Feature Flags And Navigation Cleanup | Done | Codex | Launch flags default off; request/quote marketplace hidden from web/mobile navigation |
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

## Workstream 01 Evidence

Completed: 2026-04-25

Changed files:

- `apps/web/src/lib/launch-flags.ts`
- `apps/web/.env.example`
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/dashboard/QuickActions.tsx`
- `apps/web/src/app/pro/ProviderDashboardClient.tsx`
- `apps/web/src/components/bookings/BookingDetail.tsx`
- `apps/web/src/app/pro/requests/page.tsx`
- `apps/web/src/app/pro/devis/new/page.tsx`
- `apps/web/src/app/quotes/[id]/page.tsx`
- `apps/mobile/src/lib/launchFlags.ts`
- `apps/mobile/.env.example`
- `apps/mobile/src/env.d.ts`
- `apps/mobile/src/navigation/AppNavigator.tsx`
- `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`

Commands run:

- `pnpm --filter @kayu/web type-check` - passed.
- `pnpm --filter @kayu/mobile type-check` - passed.
- `rg -n "(/pro/requests|/pro/devis|/quotes|Requests\" component|Requests' component|QuoteCompose\" component|QuoteCompose' component)" apps/web/src apps/mobile/src -g '!*.map'` - remaining request/quote routes are inside flag-gated navigation or disabled route components.

Routes and screens checked:

- Web provider shell no longer shows `/pro/requests` unless `NEXT_PUBLIC_ENABLE_JOB_REQUESTS=true`.
- Web provider dashboard hides request inbox CTAs and quote composer links unless job requests are enabled.
- Web `/pro/requests` redirects to `/pro` when job requests are disabled.
- Web `/pro/devis/new` redirects to `/pro` when quote marketplace is disabled.
- Web `/quotes/[id]` redirects to `/bookings` when quote marketplace is disabled.
- Web booking detail provider back action now returns to `/bookings`, not `/pro/requests`.
- Mobile client tabs omit `Requests` unless `EXPO_PUBLIC_ENABLE_JOB_REQUESTS=true`.
- Mobile provider tabs omit `Requests`, keep dashboard/messages/earnings/profile, and add `Bookings`.
- Mobile provider dashboard hides new job-request quote cards unless job requests are enabled; direct booking requests remain visible.

Hidden routes intentionally left in repo:

- Existing job request, provider inbox, quote composer, and quote detail code remains available behind flags for later internal reactivation.

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
