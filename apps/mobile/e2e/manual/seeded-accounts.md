# Seeded Accounts And Preconditions

These accounts come from `apps/backend/prisma/seed-demo.ts` and are the stable manual-smoke identities for launch-critical flows.

## Accounts

- Client: `Paul Kabasele`
  - Email: `paul.kabasele@email.cd`
  - Password: `Password123!`
  - Use for direct booking, first-message bootstrap, quote acceptance, and completed-booking review.
- Provider: `Jean-Pierre Mukendi`
  - Email: `jeanpierre.mukendi@kayou.cd`
  - Password: `Password123!`
  - Use for booking confirmation/start/completion and quote creation.
- Admin: `Admin KAYOU`
  - Email: `admin@kayou.cd`
  - Password: `Password123!`
  - Not part of the WS-12 mobile harness, but kept here for launch-ops checks.

## Preconditions

- `pnpm db:seed` has completed successfully.
- The backend is running against that seeded database.
- Supabase demo users were seeded if you need real authentication outside the local dev shortcut.
- Start each scenario from a signed-out app unless the runbook says to switch roles in-place.

## Known Limits

- Auth role-selection coverage is manual because seeded demo accounts are already role-locked.
- The direct-booking, messaging, and review flows are designed to create their own fresh booking state during the smoke pass, so they do not depend on a specific seeded booking id.
- Quote acceptance should only be run if the request/quote flow remains visible in launch scope.
