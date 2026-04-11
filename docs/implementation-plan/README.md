# KAYOU Monorepo Migration — Implementation Plan

## What This Package Is

A step-by-step plan for migrating the existing KAYOU Next.js monolith (at `/Users/alainmk/startups/kayu/frontend`) into a production-ready monorepo with a standalone NestJS backend, Next.js web app, Expo mobile app, and shared packages.

### Current State Assumptions

- KAYOU is a working Next.js 16 application with embedded API routes, Prisma + SQLite, and ~90 components
- All features are functional: auth, provider profiles, bookings, reviews, messaging, admin dashboard, visibility settings, categories/trades system
- No mobile app exists
- No separated backend exists
- Database is SQLite (not production-ready)

### Target State

```
kayu-project/
├── apps/
│   ├── backend/          # NestJS + Prisma + PostgreSQL
│   ├── web/              # Next.js 16 (SSR, no API routes)
│   └── mobile/           # Expo + React Native
├── packages/
│   ├── schemas/          # Zod — shared by backend + web + mobile
│   ├── api/              # ApiClient + typed endpoints + query keys
│   ├── ui/               # Design tokens
│   └── utils/            # Shared utilities
├── docs/
├── compose.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## How To Use This Plan

1. Read `00-overview.md` first for product decisions and architecture context
2. Check `PROGRESS.md` for current status and what to work on next
3. Open the chunk file for the next task (e.g., `01-monorepo-scaffold.md`)
4. Read the full chunk — scope, dependencies, acceptance criteria
5. Implement following the suggested steps
6. Update `PROGRESS.md` when the chunk is complete

---

## Recommended Execution Order

1. [01 — Monorepo Scaffold & Infrastructure](./01-monorepo-scaffold.md) — foundation everything else builds on
2. [02 — Shared Schemas Package](./02-shared-schemas.md) — type contract used by all apps
3. [03 — Backend Foundation & Database](./03-backend-foundation.md) — NestJS + Prisma + PostgreSQL
4. [04 — Backend: Authentication & Identity](./04-backend-auth.md) — Supabase JWT validation + identity module must exist before any protected endpoint
5. [05 — Backend: Categories & Provider Discovery](./05-backend-categories-providers.md) — core marketplace browsing
6. [06 — Backend: Bookings, Reviews & Trust](./06-backend-bookings-reviews.md) — core marketplace transactions
7. [07 — Backend: Messaging, Notifications & Social](./07-backend-messaging-social.md) — communication layer
8. [08 — Backend: Admin & Platform Settings](./08-backend-admin-settings.md) — management and configuration
9. [09 — Shared Packages: API Client, UI Tokens & Utilities](./09-shared-packages.md) — frontend integration layer
10. [10 — Web App: Next.js Migration](./10-web-app-migration.md) — migrate existing UI to use new backend
11. [11 — Mobile App: Foundation & Auth](./11-mobile-foundation.md) — Expo scaffold with auth flow
12. [12 — Mobile App: Core Features](./12-mobile-core-features.md) — full mobile marketplace experience
13. [13 — Seed Data, DevOps & Launch Readiness](./13-seed-devops-launch.md) — data, tooling, documentation

### Why This Order

The monorepo scaffold and shared schemas must come first because every other chunk depends on the project structure and type contract. Backend chunks (04-08) are ordered by dependency: auth enables everything, categories/providers enable bookings, bookings enable reviews. The shared API client (09) bridges backend and frontend. Web migration (10) comes before mobile (11-12) because the existing code is web — migrating it validates the backend before building something new. Seed data and DevOps (13) is last because it wraps everything together.

---

## Launch-Critical Chunks

All chunks 01-10 are required for the web app to be functional (parity with current monolith). Chunks 11-12 are required for mobile launch. Chunk 13 is required for any deployment.

## Can Be Deferred If Needed

None — all chunks are required for the target state. However, chunks 11-12 (mobile) can be deferred if web-first launch is acceptable.

---

## Working Agreement For Implementation Agents

1. Each chunk is self-contained. Read the full chunk before starting.
2. Never modify code outside the chunk's stated scope.
3. Run type-check (`turbo run type-check`) after every chunk.
4. Update `PROGRESS.md` when starting and finishing a chunk.
5. If a chunk surfaces a design decision that affects downstream chunks, record it in `PROGRESS.md` Decisions Log.
6. Use `workspace:*` protocol for all internal package dependencies.
7. All Zod schemas go in `@kayu/schemas` — never define request/response types inline.
8. Backend validation uses the Zod validation pipe with schemas from `@kayu/schemas`.
9. No class-validator, no class-transformer — Zod is the single validation library.
10. French is the primary UI language. API responses use English keys with French display values.

---

## File Map

| File | Purpose |
|------|---------|
| `README.md` | This file — plan overview and orchestration |
| `00-overview.md` | Product decisions, architecture, risks |
| `PROGRESS.md` | Live execution tracker |
| `AGENT-HANDOFFS.md` | Agent prompt templates |
| `01-monorepo-scaffold.md` | Project structure, Turborepo, pnpm, Docker |
| `02-shared-schemas.md` | @kayu/schemas — Zod schemas, enums, DTOs |
| `03-backend-foundation.md` | NestJS scaffold, Prisma, PostgreSQL |
| `04-backend-auth.md` | Identity module: Supabase JWT validation, /me, profile completion |
| `05-backend-categories-providers.md` | Categories, trades, provider search/profiles |
| `06-backend-bookings-reviews.md` | Booking lifecycle, reviews, trust system |
| `07-backend-messaging-social.md` | Messages, conversations, notifications, favorites |
| `08-backend-admin-settings.md` | Admin CRUD, visibility, stats, geocode, distance |
| `09-shared-packages.md` | @kayu/api, @kayu/ui, @kayu/utils |
| `10-web-app-migration.md` | Next.js migration to apps/web |
| `11-mobile-foundation.md` | Expo scaffold, navigation, auth |
| `12-mobile-core-features.md` | Mobile marketplace features |
| `13-seed-devops-launch.md` | Seeds, Docker, env, documentation |
