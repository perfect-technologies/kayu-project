# KAYOU Backend Integration Plan

> Wire the frontend screens to real backend data. Replace every fixture with a typed API call.

## What this plan is

The monorepo migration (`implementation-plan/`), the v1 design system (`design-plan/`), and the v2 design expansion (`design-plan-v2/`) all landed. As a result, KAYOU has 15+ screens on web + mobile, a NestJS backend with many endpoints, and shared packages (`@kayu/api`, `@kayu/schemas`). But several screens — especially the pro surface — still render inline fixtures. This plan closes that gap.

## The audit that produced this plan

See `./00-overview.md` for the full gap matrix. Short version:

### ✅ Already wired (9 screens)
- Auth (Supabase scaffold — OTP mocked; dev demo accounts as fallback)
- Home, Search, Provider Profile, Booking flow
- MyBookings, BookingDetail
- Write Review
- Favorites, Edit Profile, Settings (mobile only)
- Admin dashboard (web)

### ❌ Still on fixtures (web + mobile)
- Messages (DEMO_THREADS)
- Provider Dashboard (TODAY_JOBS, NEW_REQUESTS, STATS)
- Job Requests (INCOMING_REQUESTS, PRO_ACTIVE_JOBS)
- Quote Compose (presets + request lookup from fixtures)
- Earnings (EARNINGS_WEEKLY, TRANSACTIONS, BALANCES)
- Provider Onboarding (localStorage-only, no backend save)
- Verification (state + documents fixtures)

### Backend state
- **Has full coverage** for: identity, providers, categories, bookings, reviews, messaging, notifications, favorites, settings, dashboard (generic), stats, geo, admin CRUD.
- **Missing modules** for: Quotes/Devis, Earnings/Payouts, Job Requests (workflow differentiation from bookings), Verification documents (beyond cert docs), Onboarding draft persistence, Disputes.

## The plan at a glance

10 chunks. Start with "easy wins" where the backend already exists and only the frontend needs wiring; then build new backend modules for pro features; end with a cleanup sweep.

1. [I01 — Messages wiring (easy win)](./I01-messages-wiring.md)
2. [I02 — Auth OTP finalization](./I02-auth-otp-finalize.md)
3. [I03 — Provider Dashboard: backend data + wiring](./I03-provider-dashboard-data.md)
4. [I04 — Job Requests module](./I04-job-requests.md)
5. [I05 — Quote / Devis module](./I05-quote-devis.md)
6. [I06 — Earnings + Mobile Money payouts](./I06-earnings-payouts.md)
7. [I07 — Provider Onboarding draft + publish](./I07-onboarding-persist.md)
8. [I08 — Verification documents + KYC state](./I08-verification-docs.md)
9. [I09 — Admin disputes + payouts (deferred-optional)](./I09-admin-disputes-payouts.md)
10. [I10 — Fixture sweep + E2E audit](./I10-fixture-sweep-audit.md)

## How chunks are structured

Each chunk is **full-stack per domain** — one agent owns the end-to-end wiring of one domain. It includes:

1. **Backend** tasks (Prisma models, NestJS modules, endpoints with DTOs validated by Zod)
2. **Shared packages** tasks (add schemas to `@kayu/schemas`, add endpoint functions + query keys to `@kayu/api`)
3. **Frontend** tasks (web routes + mobile screens to wire, fixtures to delete)
4. **Testing** approach (smoke test via curl + manual UI walk-through)

This way you can hand an entire domain to one agent. They won't need to coordinate with 2 other agents to finish their work.

## Parallelization

- **I01** (Messages) is the easy win — backend already there, just wire. Can start immediately.
- **I02** (Auth OTP) is independent — Supabase-only change.
- **I03** (Dashboard) can run in parallel with I04/I05/I06 since dashboard data depends on those domains' backends existing.
- **I04 → I05** — Job Requests unblocks Quote Compose (a quote is created against a request).
- **I06** (Earnings) can run parallel to I04/I05.
- **I07** (Onboarding persist) and **I08** (Verification docs) are independent and run parallel.
- **I09** (Admin) can be deferred per your guidance.
- **I10** (cleanup) must run last.

Realistic sequencing:
```
Week 1:  I01 || I02 || I07
Week 2:  I03 || I04 || I06
Week 3:  I05 (after I04) || I08
Week 4:  I10 (after all others)
Week ?:  I09 (whenever admin surface is prioritized)
```

## How to use this plan

1. Read `00-overview.md` for the gap matrix and the cross-cutting patterns (how fixtures map to hooks, Supabase JWT propagation, error surfaces).
2. Check `PROGRESS.md`.
3. Pick the next chunk, open it, read it fully.
4. Use `AGENT-HANDOFFS.md` for ready-to-send prompts.
5. Keep the audit honest — when you delete a fixture, update the PROGRESS with what you replaced it with.

## Working agreement

1. **No new `apps/**` fixtures.** If a screen needs data, it goes through `@kayu/api` or is SSR-fetched in Next.js.
2. **Zod schemas in `@kayu/schemas` come first**, then backend DTOs reuse them via the ZodValidationPipe, then API client and hooks.
3. **Backend migrations land before frontend consumers** — the CI should fail if the frontend references a type that doesn't have a schema.
4. **Every wired screen gets loading, empty, and error states** from `@kayu/ui`. No `useState(data)` without error handling.
5. **Mobile Money payouts** are stubbed at the backend boundary until a real PSP is wired. The UI must look real.
6. **Don't delete fixtures until the wired version renders correctly** with the same provider IDs. Some fixtures are also used in the prototype; keep those there.
7. **Tests, at minimum:** a curl of each new endpoint + a manual UI walk-through. Automated e2e is out of scope for this plan.

## File map

| File | Purpose |
|---|---|
| `README.md` | This file |
| `00-overview.md` | Full audit findings + gap matrix + cross-cutting patterns |
| `PROGRESS.md` | Live status tracker |
| `AGENT-HANDOFFS.md` | Ready-to-send prompts per chunk |
| `I01-messages-wiring.md` | Swap DEMO_THREADS for real `/messages` calls |
| `I02-auth-otp-finalize.md` | Finalize Supabase SMS OTP; remove dev-only DEMO_ACCOUNTS |
| `I03-provider-dashboard-data.md` | Expand `/dashboard/provider` + wire the pro home |
| `I04-job-requests.md` | New JobRequest module: model + endpoints + schemas + UI wiring |
| `I05-quote-devis.md` | New Quote module: Quote + QuoteLineItem + line-item CRUD + send/accept |
| `I06-earnings-payouts.md` | New Earnings module: Transaction/Payout + summary/chart/list + Mobile Money stub |
| `I07-onboarding-persist.md` | Replace localStorage with backend draft persistence + publish |
| `I08-verification-docs.md` | New VerificationDoc module: upload + state transitions + dispute view (pro side) |
| `I09-admin-disputes-payouts.md` | Optional — admin disputes + payout queue |
| `I10-fixture-sweep-audit.md` | Delete residual fixtures, verify states, close PROGRESS |
