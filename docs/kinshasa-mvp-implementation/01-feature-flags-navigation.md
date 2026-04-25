# 01 - Feature Flags And Navigation Cleanup

## Objective

Hide the job-request and multi-quote marketplace surfaces from launch navigation while preserving the code for later.

This is the fastest way to remove product complexity without risky schema deletion.

## Severity

P0

## Owns

- `apps/web/src/app/*`
- `apps/web/src/components/layout/*`
- `apps/web/src/app/pro/*`
- `apps/mobile/src/navigation/*`
- `apps/mobile/src/screens/requests/*`
- `apps/mobile/src/screens/pro/*`
- `packages/api/src/endpoints.ts` only if UI imports require cleanup
- Shared route constants if they exist

## In Scope

- Remove or hide customer job-request entry points.
- Remove or hide provider request inbox entry points.
- Remove or hide standalone quote/devis composer entry points.
- Keep quote/job-request backend code untouched unless needed for type errors.
- Add a simple feature flag pattern if one does not already exist.
- Ensure no visible navigation item points to a disabled route.
- Ensure disabled routes either redirect to safe pages or render a clear "not available for launch" state for internal users only.

## Out Of Scope

- Deleting Prisma models.
- Deleting backend modules.
- Replacing the final-offer flow.
- Adding online payments.

## Suggested Approach

1. Search for visible links to:
   - `/requests`
   - `/pro/requests`
   - `/pro/devis`
   - `/quotes`
   - job request screens in mobile navigation.
2. Add launch flags in the smallest appropriate place, for example:
   - `ENABLE_JOB_REQUESTS=false`
   - `ENABLE_QUOTE_MARKETPLACE=false`
3. Hide nav items and CTA buttons when disabled.
4. Keep direct booking, messages, bookings, reviews, favorites, and provider dashboard links visible.
5. Add redirects for disabled routes if users can still reach them directly.

## Acceptance Criteria

- Client web navigation has no job-request CTA.
- Provider web navigation has no request inbox or standalone devis CTA.
- Mobile tabs/stacks do not expose client requests or provider request inbox for launch.
- Direct booking still works.
- Messaging still works.
- Existing quote/job-request code can remain in the repo but is not launch-facing.
- Relevant type-check passes.

## Test Evidence Required

Record in `PROGRESS.md`:

- Commands run.
- Screens/routes manually checked.
- Any hidden routes left intentionally reachable for admin/internal testing.
