# 00 — Overview: KAYOU Monorepo Migration

## Goal

Migrate the existing KAYOU Next.js monolith into a clean monorepo architecture with a standalone NestJS backend, a Next.js web frontend (SSR, no API routes), an Expo React Native mobile app, and shared packages for schemas, API client, UI tokens, and utilities — enabling web and mobile to share business logic while the backend evolves independently.

## Why This Matters

KAYOU is a service provider marketplace for DRC and Congo-Brazzaville. The current implementation is a Next.js monolith where API routes, database access, and frontend are tightly coupled. This blocks:

1. **Mobile app** — React Native cannot consume Next.js API routes without a standalone server
2. **Independent scaling** — backend and frontend cannot be deployed or scaled separately
3. **Production database** — SQLite cannot handle concurrent users at scale
4. **Team parallelism** — multiple developers cannot work on backend vs. frontend vs. mobile independently
5. **Code reuse** — Zod schemas, API types, and utilities are duplicated or embedded in components

The migration preserves all existing features while establishing a foundation for mobile, payment integration, and multi-language support.

## Product Decisions This Plan Assumes

1. **Keep Next.js for web** — SSR is important for SEO (provider profiles, category pages must be crawlable by Google). The web app will be a Next.js frontend-only app consuming the NestJS API.

2. **NestJS for backend** — Modular, TypeScript-native, well-suited for REST APIs with Prisma. Same choice as the Trustway project for consistency across the portfolio.

3. **Shared Zod schemas (no class-validator)** — One `@kayu/schemas` package is the single source of truth for all validation. Backend uses a custom Zod validation pipe instead of NestJS class-validator. This eliminates schema duplication between backend and frontend.

4. **PostgreSQL for production** — Replace SQLite with PostgreSQL via Docker Compose. Prisma schema stays the same, only the provider changes.

5. **Expo for mobile** — React Native with Expo for faster development. Shares `@kayu/schemas`, `@kayu/api`, `@kayu/utils`, and `@kayu/ui` with the web app.

6. **Supabase for authentication** — Registration, login (email+password, phone+OTP), and session management are handled by Supabase on the frontend. The backend only validates Supabase JWTs using the `jose` library with remote JWKS. Users are auto-created in the local database on first authenticated request. Same pattern as the ibt-car project (`/Users/alainmk/ibt-car/backend`).

## Domain Summary

KAYOU connects clients with service providers (plumbers, electricians, hairdressers, etc.) in DRC and Congo-Brazzaville. The domain includes:

- **Users** with three roles: CLIENT, PROVIDER, ADMIN
- **Providers** with professional profiles, certifications, diplomas, portfolio, trust scores, badges
- **Categories** with subcategories and trades (professions)
- **Bookings** with lifecycle management (pending → confirmed → in-progress → completed)
- **Reviews** — bidirectional (client reviews provider, provider reviews client)
- **Messaging** — conversations between clients and providers
- **Favorites** — clients can bookmark providers
- **Visibility settings** — privacy controls for profiles
- **Admin dashboard** — user/provider/category/review management with statistics

## Expected Architecture

### Backend (`apps/backend`)
- NestJS 11 with modular architecture
- Prisma ORM with PostgreSQL
- Custom Zod validation pipe (no class-validator)
- Supabase JWT verification via `jose` library + remote JWKS (no Passport, no local JWT)
- Three-level guard chain: `SupabaseGuard` → `ActorGuard` → `RolesGuard`
- REST API serving both web and mobile
- Modules: identity, providers, categories, bookings, reviews, messaging, notifications, favorites, admin, settings, geo

### Web App (`apps/web`)
- Next.js 16 with App Router
- SSR for public pages (homepage, provider profiles, category pages)
- No API routes — all data from NestJS backend
- Tailwind CSS 4 + shadcn/ui
- React Hook Form + Zod (from `@kayu/schemas`)
- TanStack Query for data fetching

### Mobile App (`apps/mobile`)
- Expo + React Native
- React Navigation (native stack + bottom tabs)
- Same business logic as web via shared packages
- Expo SecureStore for auth tokens
- Platform-specific UI (React Native components, not web)

### Shared Packages
- `@kayu/schemas` — Zod schemas, enums, inferred TypeScript types, DTOs
- `@kayu/api` — ApiClient class, typed endpoint functions, React Query keys
- `@kayu/ui` — Design tokens (colors, spacing, typography, shadows, brand)
- `@kayu/utils` — Phone normalization (DRC/Congo formats), currency formatting (CDF), distance calculations, date helpers

## MVP vs. Later

### In Scope (This Migration)
- Full monorepo structure with all apps and packages
- Complete backend with all existing API functionality
- Web app with feature parity to current monolith
- Mobile app with core features (browse, book, review, message, profile)
- PostgreSQL database with seed data
- Docker Compose for local development
- Developer documentation

### Out Of Scope (Future Work)
- Push notifications (requires FCM/APNs setup)
- Real-time messaging via WebSockets (current polling is acceptable for MVP)
- Payment integration (Mobile Money — Orange, Airtel, M-Pesa)
- Multi-language support (i18n)
- CI/CD pipeline
- Production deployment configuration
- OAuth / social login (Supabase supports it, can be enabled later without backend changes)
- Image upload to cloud storage (Supabase Storage is an option)

## Recommended Milestones

### Milestone A: Foundation (Chunks 01-03)
Monorepo structure exists, shared schemas defined, NestJS backend connects to PostgreSQL.
**Exit condition:** `turbo run type-check` passes across all packages, backend starts and connects to database.

### Milestone B: Backend Complete (Chunks 04-08)
All API endpoints migrated from Next.js routes to NestJS modules with Zod validation.
**Exit condition:** Every existing API route has a NestJS equivalent, all return the same response shapes, seed data works.

### Milestone C: Frontend Integration (Chunks 09-10)
Shared packages built, web app migrated to consume NestJS backend.
**Exit condition:** Web app runs with full feature parity, no Next.js API routes remain.

### Milestone D: Mobile App (Chunks 11-12)
Expo app with core marketplace features using shared packages.
**Exit condition:** Mobile app can register, browse providers, book services, leave reviews, send messages.

### Milestone E: Launch Ready (Chunk 13)
Seed data, Docker orchestration, env management, developer docs complete.
**Exit condition:** A new developer can clone the repo, run `docker compose up` + `pnpm dev`, and have a working local environment.

## Cross-Cutting Requirements

1. **Type safety end-to-end** — Zod schemas define the API contract. Backend validates with them. Frontend validates forms with them. TypeScript types are inferred from them.
2. **French UI, English API** — UI strings are in French. API field names, error codes, and enum values are in English.
3. **Mobile-first responsive** — Web app maintains current mobile-first design. Mobile app uses native components.
4. **Role-based access** — Every protected endpoint checks user role. Guards are consistent across modules.
5. **Schema evolution** — The Prisma schema migrates from SQLite to PostgreSQL with auth-related changes: `password` removed, `authUserId` added, `Session` model removed (Supabase handles sessions).

## Principal Risks

1. **Prisma schema compatibility** — SQLite and PostgreSQL have subtle differences (e.g., `DateTime` defaults, JSON fields). The schema may need adjustments during migration.
2. **SSR data fetching** — Next.js server components currently access Prisma directly. After migration, they need to fetch from the NestJS API, which adds latency. Consider internal network calls or server-side fetch caching.
3. **Supabase session management** — Both web and mobile use Supabase SDK for auth. Web uses `@supabase/ssr` with cookie-based sessions for SSR. Mobile uses `@supabase/supabase-js` with SecureStore adapter. Both send the Supabase JWT as `Authorization: Bearer` header to the backend.
4. **Component volume** — ~90 components need to be migrated. Some may have implicit dependencies on Next.js API routes or server-side data that need refactoring.
5. **Seed data complexity** — The existing seed scripts create deeply nested data (providers with certifications, trades, reviews, trust scores). These must work with PostgreSQL.
6. **Scope creep** — The mobile app is new development, not migration. Chunks 11-12 must be scoped tightly to avoid feature creep.

## Open Planning Questions

- **Image storage:** Current app stores avatar URLs in the database. Where do uploaded images go in the new setup? (Deferred — use placeholder URLs for now, plan cloud storage separately)
- **WebSocket readiness:** Should the NestJS backend be structured to add WebSocket gateways later for real-time messaging? (Yes — use a separate messaging module that can be extended)
- **API versioning:** Should endpoints be versioned (e.g., `/api/v1/providers`)? (No — not needed for MVP, can add later with NestJS versioning)
