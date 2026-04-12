# KAYOU Monorepo Migration — Progress Tracker

## Overall Project Status

- **Project:** KAYOU Monorepo Migration
- **Current phase:** Backend Complete
- **Overall status:** in_progress
- **Launch target:** Web parity + Mobile MVP
- **Current focus:** Chunk 07 — Backend: Messaging & Social
- **Next recommended chunk:** 07 — Backend: Messaging & Social
- **Last updated:** 2026-04-12

---

## Status Legend

- `not_started` — Work has not begun
- `in_progress` — Actively being worked on
- `blocked` — Cannot proceed, waiting on dependency or decision
- `in_review` — Implementation complete, needs validation
- `done` — Fully implemented, tested, and accepted
- `deferred` — Removed from current scope

---

## Feature Status Table

| ID | Chunk | Priority | Launch Critical | Depends On | Status | Owner | Notes |
|----|-------|----------|-----------------|------------|--------|-------|-------|
| 01 | Monorepo Scaffold & Infrastructure | P0 | Yes | — | done | Codex | Scaffold created; `pnpm install`, `pnpm type-check`, and Docker Postgres `SELECT 1` passed |
| 02 | Shared Schemas Package | P0 | Yes | 01 | done | Codex | `@kayu/schemas` implemented with Zod enums, model schemas, DTOs, and response schemas; `pnpm --filter @kayu/schemas build` and `pnpm type-check` passed |
| 03 | Backend Foundation & Database | P0 | Yes | 01 | done | Codex | NestJS backend foundation, Prisma PostgreSQL schema, common guards/decorators/pipes, `prisma db push`, backend build/start, and `pnpm type-check` passed |
| 04 | Backend: Authentication & Identity | P0 | Yes | 02, 03 | done | Codex | Identity module implemented with Supabase JWT validation, actor resolution, `/me` endpoints, and provider onboarding; `pnpm type-check`, backend build/start, unauthenticated 401, invalid token 401, and valid Supabase JWT `/api/me` auto-create smoke checks passed |
| 05 | Backend: Categories & Providers | P0 | Yes | 04 | done | Codex | Categories hierarchy, provider discovery/detail, visibility gating, and provider self-update implemented; `pnpm --filter @kayu/schemas build`, `pnpm --filter @kayu/schemas type-check`, `pnpm --filter @kayu/backend type-check`, `pnpm --filter @kayu/backend build`, live `curl` smoke tests for `/api/categories`, `/api/categories/hierarchy`, `/api/providers`, `/api/providers/:id`, and direct Nest app-context smoke tests for `ProvidersService.updateMe` passed |
| 06 | Backend: Bookings & Reviews | P0 | Yes | 05 | done | Codex | Bookings/reviews modules implemented with lifecycle rules, notifications, trust score + badge recalculation; `pnpm --filter @kayu/schemas build`, `pnpm --filter @kayu/backend type-check`, `pnpm --filter @kayu/backend build`, and temp-fixture service smoke test for create/list/update/cancel/review/duplicate-review flows passed |
| 07 | Backend: Messaging & Social | P1 | Yes | 04 | not_started | — | Communication |
| 08 | Backend: Admin & Settings | P1 | Yes | 04 | not_started | — | Management |
| 09 | Shared Packages (API, UI, Utils) | P0 | Yes | 04-08 | not_started | — | Frontend integration |
| 10 | Web App: Next.js Migration | P0 | Yes | 09 | not_started | — | Web parity |
| 11 | Mobile App: Foundation & Auth | P1 | Mobile only | 09 | not_started | — | Expo scaffold |
| 12 | Mobile App: Core Features | P1 | Mobile only | 11 | not_started | — | Mobile marketplace |
| 13 | Seed Data, DevOps & Launch | P0 | Yes | 10 | not_started | — | Launch readiness |

---

## Milestone View

### Milestone A: Foundation (Chunks 01-03)
**Exit condition:** `turbo run type-check` passes, backend starts and connects to PostgreSQL.
**Status:** done

### Milestone B: Backend Complete (Chunks 04-08)
**Exit condition:** All API endpoints migrated, seed data works, manual API testing passes.
**Status:** in_progress

### Milestone C: Frontend Integration (Chunks 09-10)
**Exit condition:** Web app runs with full feature parity, no Next.js API routes remain.
**Status:** not_started

### Milestone D: Mobile App (Chunks 11-12)
**Exit condition:** Mobile app can register, browse, book, review, message.
**Status:** not_started

### Milestone E: Launch Ready (Chunk 13)
**Exit condition:** New developer can clone, `docker compose up` + `pnpm dev`, working environment.
**Status:** not_started

---

## Dependency Notes

- Chunks 04-08 (all backend modules) depend on 02 (schemas) and 03 (backend foundation). Within the backend, auth (04) must come first since all other modules use auth guards.
- Chunks 05-08 can partially parallelize: 05 (categories/providers) and 07 (messaging) are independent once 04 is done. But 06 (bookings/reviews) depends on 05 (needs providers and categories to exist).
- Chunk 09 (shared packages) depends on all backend chunks being done — the API client needs to know the full endpoint surface.
- Chunks 11-12 (mobile) are independent of chunk 10 (web migration) — they can run in parallel once chunk 09 is done.

---

## Current Blockers

| Date | Chunk | Blocker | Owner | Next Action |
|------|-------|---------|-------|-------------|
| — | — | — | — | — |

---

## Decisions Log

| Date | Decision | Affects | Reason | Follow-up |
|------|----------|---------|--------|-----------|
| 2026-04-11 | Use Zod everywhere, no class-validator | 02, 03, 04-08 | Single source of truth for validation, eliminates schema duplication | Build custom Zod validation pipe in chunk 03 |
| 2026-04-11 | Keep Next.js for web (not Vite) | 10 | SSR needed for SEO on marketplace pages | Web app has no API routes, just frontend |
| 2026-04-11 | Flat monorepo (apps/ + packages/ at root) | 01 | Schemas shared by backend and frontend — nesting packages inside frontend would be incorrect | pnpm workspace at root level |
| 2026-04-11 | PostgreSQL via Docker Compose | 03, 13 | SQLite not production-ready, Prisma supports both | compose.yaml at project root |
| 2026-04-11 | Supabase for authentication | 02, 03, 04, 09, 10, 11 | No local password management; supports email+password and phone+OTP; backend only validates JWT via JWKS | Same pattern as ibt-car project; User model gets authUserId, loses password field |
| 2026-04-12 | Local user profile names are nullable until profile completion | 03, 04 | Supabase JWTs can create local users before firstName/lastName are collected | Chunk 04 `/me/profile` completes these fields |
| 2026-04-12 | Compute provider ratings from `Review.overallScore` and certification state from verified certifications | 05, 09, 10, 12 | Prisma `Provider` no longer stores legacy `rating`/`isCertified` fields directly, but shared/API responses still need them | Shared schemas extended in chunk 05; future API client/frontend work should treat these fields as derived |
| 2026-04-12 | Treat `ProviderBadge.providerId` as the trust-score record ID, not the provider ID, when syncing badges | 06, 08, 10, 12 | Prisma relation is keyed to `TrustScore.id` despite the field name; writing badges against the provider ID fails foreign-key validation | Reuse trust-score-aware badge writes/queries anywhere provider badges are managed |

---

## Current Focus

**Objective:** Start chunk 07 messaging and social APIs now that bookings, reviews, and provider trust flows are complete.

**Definition of done:** Conversations, messages, favorites, and related notification flows are implemented on top of auth and provider discovery.

---

## Next Recommended Chunk

`07-backend-messaging-social.md` — Start messaging, conversations, and favorites APIs.

---

## Launch-Critical Checklist

- [x] Monorepo structure with Turborepo + pnpm
- [x] Shared Zod schemas package
- [x] NestJS backend with PostgreSQL
- [x] Supabase auth + identity module (/me, profile, provider onboarding)
- [x] Categories, trades, provider discovery
- [x] Bookings and reviews
- [ ] Messaging and notifications
- [ ] Admin dashboard API
- [ ] Shared API client with React Query keys
- [ ] Web app migrated (feature parity)
- [ ] Seed data and Docker Compose
- [ ] Developer documentation

---

## Update Rules

1. Update this file whenever a chunk status changes
2. Log all cross-chunk decisions in the Decisions Log
3. Record blockers immediately when discovered
4. Include test/validation evidence when marking a chunk as `done`
