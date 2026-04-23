# Mobile Launch Smoke Harness

This folder is the practical mobile harness for WS-12.

It is manual-first because the repo does not yet ship a dedicated Detox or Maestro runtime. The backend launch-critical regressions are enforced in CI through `pnpm test:launch`; the mobile side is documented here so client/provider launch flows can be exercised against the seeded environment without guessing.

## Setup

1. `pnpm db:up`
2. `pnpm db:push`
3. `pnpm db:seed`
3. Optional but recommended for real login: set `SEED_SUPABASE_USERS=true` in `apps/backend/.env` before seeding so the demo accounts exist in Supabase Auth too.
4. Start the API: `pnpm dev:backend`
5. Start the app: `pnpm dev:mobile`

## Stable Accounts

Use the seeded demo shortcuts from the auth screen for returning-user flows:

- Client: `Paul Kabasele` / `paul.kabasele@email.cd` / `Password123!`
- Provider: `Jean-Pierre Mukendi` / `jeanpierre.mukendi@kayou.cd` / `Password123!`
- Admin: `Admin KAYOU` / `admin@kayou.cd` / `Password123!`

The role-selection smoke test must use a fresh phone/OTP identity or a clean test-auth identity. Demo accounts already have persisted roles.

## Runbooks

- [Launch Critical Smoke](./manual/launch-critical-smoke.md)
- [Seeded Accounts And Preconditions](./manual/seeded-accounts.md)
