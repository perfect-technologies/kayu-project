# KAYOU Monorepo Migration — Agent Handoffs

## Purpose

This file contains reusable prompt templates for handing off implementation chunks to agents. Each prompt ensures the agent reads the right context, stays within scope, and updates progress tracking.

---

## Reusable Prompt Template

```
You are implementing chunk [XX] of the KAYOU monorepo migration plan.

1. Read these files first (do not skip any):
   - /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
   - /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
   - /Users/alainmk/startups/kayu-project/docs/implementation-plan/[XX-chunk-file].md

2. Read the existing KAYOU source code as needed:
   - Source: /Users/alainmk/startups/kayu/frontend/
   - Reference the original implementation when migrating features

3. Work in: /Users/alainmk/startups/kayu-project/

4. Rules:
   - Stay within the chunk's stated scope (In Scope / Out Of Scope)
   - All Zod schemas go in packages/schemas — never define types inline
   - Backend validation uses the Zod pipe — no class-validator
   - Run type-check after implementation
   - Update PROGRESS.md when done (status, notes, decisions if any)
   - If you discover something that affects a downstream chunk, log it in the Decisions Log
```

---

## Stricter Prompt Template

```
You are implementing chunk [XX] of the KAYOU monorepo migration.

REQUIRED READING (do all three before writing any code):
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/[XX-chunk-file].md

REFERENCE CODE (read as needed during implementation):
- Original monolith: /Users/alainmk/startups/kayu/frontend/
- Trustway reference: /Users/alainmk/trustway-v0/ (for structural patterns)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

HARD CONSTRAINTS:
- Do NOT modify files outside this chunk's scope
- Do NOT add features not listed in the chunk's In Scope section
- Do NOT use class-validator or class-transformer — Zod only
- Do NOT create Next.js API routes — all API is in apps/backend
- All shared types/schemas MUST be in packages/schemas
- Run `pnpm turbo run type-check` before declaring done
- Update PROGRESS.md with: status change, any decisions made, test evidence

WHEN DONE:
- List what you implemented
- List any deviations from the plan and why
- List any decisions that affect downstream chunks
```

---

## Ready-To-Send Prompts

### Chunk 01 — Monorepo Scaffold & Infrastructure
```
You are implementing chunk 01 of the KAYOU monorepo migration.

REQUIRED READING (do all three before writing any code):
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/01-monorepo-scaffold.md

REFERENCE (for structural patterns):
- /Users/alainmk/trustway-v0/ (monorepo structure)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates the project foundation: pnpm workspace, Turborepo, TypeScript configs, Docker Compose, and empty app/package scaffolds. No business logic yet.
```

### Chunk 02 — Shared Schemas Package
```
You are implementing chunk 02 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/02-shared-schemas.md

REFERENCE CODE (extract schemas from here):
- /Users/alainmk/startups/kayu/frontend/prisma/schema.prisma (all models and enums)
- /Users/alainmk/startups/kayu/frontend/src/app/api/ (request/response shapes)
- /Users/alainmk/startups/kayu/frontend/src/contexts/AuthContext.tsx (auth types)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates @kayu/schemas with all Zod schemas, enums, DTOs, and inferred types.
```

### Chunk 03 — Backend Foundation & Database
```
You are implementing chunk 03 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/03-backend-foundation.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/prisma/schema.prisma (migrate this schema)
- /Users/alainmk/startups/kayu/frontend/src/lib/db.ts (Prisma client pattern)
- /Users/alainmk/trustway-v0/backend/ (NestJS structure reference)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates the NestJS backend with Prisma + PostgreSQL, common module (Zod pipe, Supabase JWT service, SupabaseGuard, ActorGuard, RolesGuard, decorators), and database module. Reference ibt-car for the Supabase guard pattern.
```

### Chunk 04 — Backend: Authentication & Identity
```
You are implementing chunk 04 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/04-backend-auth.md

REFERENCE CODE (Supabase auth guard pattern):
- /Users/alainmk/ibt-car/backend/libs/common/src/auth/ (SupabaseJwtService)
- /Users/alainmk/ibt-car/backend/libs/common/src/guards/ (SupabaseGuard, ActorGuard)
- /Users/alainmk/ibt-car/backend/apps/api/src/modules/identity/ (IdentityService, auto-creation)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates the identity module with Supabase JWT validation and /me endpoints. Auth (register, login) is handled by Supabase on the frontend — the backend only validates JWTs and manages local user records. Follow the ibt-car pattern.
```

### Chunk 05 — Backend: Categories & Provider Discovery
```
You are implementing chunk 05 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/05-backend-categories-providers.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/src/app/api/providers/ (provider routes)
- /Users/alainmk/startups/kayu/frontend/src/app/api/categories/ (category routes)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk migrates categories hierarchy (categories, subcategories, trades) and provider discovery (search, filtering, profiles).
```

### Chunk 06 — Backend: Bookings, Reviews & Trust
```
You are implementing chunk 06 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/06-backend-bookings-reviews.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/src/app/api/bookings/ (booking routes)
- /Users/alainmk/startups/kayu/frontend/src/app/api/reviews/ (review routes)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk migrates booking lifecycle, review system (bidirectional), and trust scores/badges.
```

### Chunk 07 — Backend: Messaging, Notifications & Social
```
You are implementing chunk 07 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/07-backend-messaging-social.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/src/app/api/messages/ (messaging routes)
- /Users/alainmk/startups/kayu/frontend/src/app/api/favorites/ (favorites routes)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk migrates messaging (conversations, messages), notifications, and favorites.
```

### Chunk 08 — Backend: Admin & Platform Settings
```
You are implementing chunk 08 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/08-backend-admin-settings.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/src/app/api/admin/ (admin routes)
- /Users/alainmk/startups/kayu/frontend/src/app/api/settings/ (settings routes)
- /Users/alainmk/startups/kayu/frontend/src/app/api/distance/ (distance route)
- /Users/alainmk/startups/kayu/frontend/src/app/api/geocode/ (geocode route)
- /Users/alainmk/startups/kayu/frontend/src/app/api/stats/ (stats route)
- /Users/alainmk/startups/kayu/frontend/src/app/api/dashboard/ (dashboard routes)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk migrates admin management, visibility settings, stats, geocode, distance, and dashboard aggregation endpoints.
```

### Chunk 09 — Shared Packages: API Client, UI Tokens & Utilities
```
You are implementing chunk 09 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/09-shared-packages.md

REFERENCE CODE:
- /Users/alainmk/trustway-v0/frontend/packages/api/ (ApiClient pattern)
- /Users/alainmk/trustway-v0/frontend/packages/ui/ (design tokens pattern)
- /Users/alainmk/trustway-v0/frontend/packages/utils/ (utilities pattern)
- /Users/alainmk/startups/kayu/frontend/src/hooks/useGeolocation.ts (distance utils)
- /Users/alainmk/startups/kayu/frontend/src/app/page.tsx (KAYOU brand colors)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates @kayu/api (ApiClient, typed endpoints, query keys), @kayu/ui (design tokens), and @kayu/utils (phone, currency, distance).
```

### Chunk 10 — Web App: Next.js Migration
```
You are implementing chunk 10 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/10-web-app-migration.md

REFERENCE CODE (migrate from here):
- /Users/alainmk/startups/kayu/frontend/src/ (entire frontend source)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This is the largest chunk. Migrate all pages, components, hooks, and styles from the current monolith to apps/web. Remove all API routes. Connect to the NestJS backend via @kayu/api. Preserve SSR for public pages.
```

### Chunk 11 — Mobile App: Foundation & Auth
```
You are implementing chunk 11 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/11-mobile-foundation.md

REFERENCE CODE:
- /Users/alainmk/trustway-v0/frontend/apps/mobile/ (Expo app structure)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk creates the Expo app with navigation, auth flow (register + login), and home screen.
```

### Chunk 12 — Mobile App: Core Features
```
You are implementing chunk 12 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/12-mobile-core-features.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk implements the full mobile marketplace: provider browsing, booking, reviews, messaging, profile, settings.
```

### Chunk 13 — Seed Data, DevOps & Launch Readiness
```
You are implementing chunk 13 of the KAYOU monorepo migration.

REQUIRED READING:
1. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/00-overview.md
2. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/PROGRESS.md
3. Read /Users/alainmk/startups/kayu-project/docs/implementation-plan/13-seed-devops-launch.md

REFERENCE CODE:
- /Users/alainmk/startups/kayu/frontend/prisma/seed.ts (existing seeds)
- /Users/alainmk/startups/kayu/frontend/prisma/seed-categories.ts (category seeds)
- /Users/alainmk/trustway-v0/compose.yaml (Docker pattern)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk migrates seed scripts, sets up Docker Compose, configures environment management, and writes developer documentation.
```

---

## Recommended Usage

1. Copy the prompt for the chunk you want to implement
2. Paste it into a new agent session
3. Let the agent read the required files before starting
4. Review the agent's output against the chunk's acceptance criteria
5. Update PROGRESS.md with the result
