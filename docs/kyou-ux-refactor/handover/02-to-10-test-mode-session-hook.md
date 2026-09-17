# 02 → 10: test-mode session hook and backend test gate

Design agreed by workstream 02 for workstream 10 to implement. 02 owns `app.module.ts`; the single registration line below is the only change 10 makes there.

## Session hook

**Goal.** Playwright cannot complete Supabase phone OTP. In test mode only, the backend hands the browser a real Supabase session for a known user.

**Module.** `apps/backend/src/modules/test-session/` with `TestSessionModule`, `TestSessionController`, `TestSessionService`. Nothing from it is imported by any other module.

**Registration** (`apps/backend/src/app.module.ts`, after `...featureModules`):

```ts
...(process.env.E2E_TEST_MODE === "true" && process.env.NODE_ENV !== "production"
  ? [TestSessionModule]
  : []),
```

The decision is taken at import time from `process.env`, so the module and its route do not exist in any other mode. There is no runtime flag to flip.

**Environment** (`apps/backend/src/config/env.validation.ts`):

- `E2E_TEST_MODE: z.enum(["true", "false"]).default("false")`.
- `superRefine`: `E2E_TEST_MODE === "true"` with `NODE_ENV === "production"` is an error ("must never be enabled in production"). Render services run `NODE_ENV=production`, so the hook cannot boot there even if the variable is set by mistake.
- `E2E_SEED_PASSWORD` (string, required when `E2E_TEST_MODE === "true"`). The seeded demo users use `Password123!` locally.

**Route.** `POST /api/test/session`. No guards. Body, validated with Zod:

```ts
z.union([
  z.object({ email: z.string().email() }),                 // seeded demo user
  z.object({ phone: z.string().regex(/^\+[1-9]\d{6,14}$/) }), // fresh OTP-style user
])
```

- `email`: must end with `@kayou.cd` or `@email.cd` (the seeded demo domains) → `auth.signInWithPassword({ email, password: E2E_SEED_PASSWORD })`.
- `phone`: `auth.admin.createUser({ phone, phone_confirm: true, password: <random 32 bytes> })` (ignore "already registered" and reuse via `auth.admin.updateUserById` with a new random password), then `auth.signInWithPassword({ phone, password })`. This gives scenario 6 of the smoke ("new client publishes a provider") a user with no local `User` row, exactly like a first OTP sign-in.
- Use a dedicated Supabase client built from `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` with `{ auth: { persistSession: false, autoRefreshToken: false } }`; do not reuse the storage client instance, because `signInWithPassword` stores a session on the client.

Response 200:

```json
{
  "access_token": "eyJ…",
  "refresh_token": "…",
  "expires_at": 1789000000,
  "expires_in": 3600,
  "token_type": "bearer",
  "user": { "id": "<supabase auth id>", "email": "…", "phone": "…" }
}
```

**Browser side.** The e2e fixture writes the `@supabase/ssr` cookie `sb-<project-ref>-auth-token` with value `base64-` + base64url(JSON of the session object). `SupabaseGuard.extractCookieToken` already decodes that format, and the web app's Supabase SSR client reads the same cookie, so both the Next server components and direct API calls see the session. The first `GET /api/me` provisions the local `User` row.

**Tests for the hook** (10): the module is absent when `E2E_TEST_MODE` is unset (`POST /api/test/session` → 404), env validation rejects production, email outside the demo domains → 400.

## Backend gate for CI

`pnpm --filter @kayu/backend test:launch` runs the unit specs and the two database-backed specs. The database-backed specs skip locally when their URL is absent and fail when the `*_REQUIRE_*` flag is set without a URL, following the launch-lead pattern. CI steps to add in `.github/workflows/ci.yml` (10 owns the file):

| Step | Command | Env |
| --- | --- | --- |
| Booking slot race integration | `pnpm --filter @kayu/backend run test:bookings:ci` | `BOOKINGS_TEST_DATABASE_URL=postgresql://kayu_ci:kayu_ci@localhost:5432/kayu_ci_bookings?schema=public` |
| Launch harness smoke | `pnpm --filter @kayu/backend run test:launch:harness:ci` | `LAUNCH_HARNESS_DATABASE_URL=postgresql://kayu_ci:kayu_ci@localhost:5432/kayu_ci_launch_harness?schema=public` |

Both specs drop and recreate their dedicated database with `psql` (present on GitHub's Ubuntu runners) and run `prisma migrate deploy` themselves. Database names are allow-listed (`kayu_(ci|test)_bookings`, `kayu_(ci|test)_launch_harness`), so a mistyped URL cannot touch a real database.

## Supabase Storage buckets (runbook C)

The backend now signs uploads for four purposes. Create the two new buckets on the dev and prod Supabase projects before the first deploy of the branch:

| Purpose | Bucket | Visibility | File size limit | Status |
| --- | --- | --- | --- | --- |
| `avatar` | `avatars` | public | 8 MB | exists |
| `media` | `provider-media` | public | 25 MB | **new** |
| `attachments` | `message-attachments` | private | 8 MB | **new** |
| `verification` | `verification-docs` | private | 10 MB | exists |

The backend checks MIME type and declared size when it signs an upload, but only the bucket's file size limit stops a client from uploading a larger file to a signed URL. The old `portfolio` bucket is no longer used.
