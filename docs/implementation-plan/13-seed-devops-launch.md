# 13 — Seed Data, DevOps & Launch Readiness

## Goal

Migrate seed scripts to work with PostgreSQL, set up the complete Docker Compose orchestration, configure environment management, and write developer documentation. After this chunk, a new developer can clone the repo and have a fully working local environment.

## Why It Matters

Without seed data, the app looks empty and is impossible to demo or test. Without proper Docker setup, developers waste time on local configuration. Without documentation, onboarding a new developer (or your future self) takes hours instead of minutes.

## Scope

### In Scope
- Migrate seed scripts from SQLite to PostgreSQL
- `compose.yaml` with PostgreSQL (and optional pgAdmin)
- `.env.example` files for all apps
- Root-level development scripts
- `README.md` at project root (quickstart, architecture, scripts)
- Developer guide in `docs/`
- Verify end-to-end flow: fresh clone → docker compose up → seed → dev → working app

### Out Of Scope
- CI/CD pipeline (GitHub Actions, etc.)
- Production deployment (Dockerfile, cloud config)
- Monitoring, logging, observability
- Performance optimization
- SSL/TLS configuration

## Seed Scripts

### Location

```
apps/backend/prisma/
├── seed.ts                 # Main seed orchestrator
├── seed-categories.ts      # Categories, subcategories, trades
└── seed-demo.ts            # Demo users, providers, bookings, reviews
```

### What Gets Seeded

**Categories & Trades** (from existing `seed-categories.ts`):
- 15 categories: Bâtiment, Plomberie, Électricité, Menuiserie, Métallerie, Automobile, Beauté, Mode, Maison, Enfance, Santé, Informatique, Transport, Événementiel, Sécurité
- ~47 subcategories
- ~100+ trades with base prices and durations

**Users:**
- 1 admin: `admin@kayou.cd` / `Password123!`
- 15 providers across various categories in Kinshasa and Brazzaville
- 13 clients with varying trust levels
- All passwords: `Password123!`

**Provider Data:**
- Provider profiles with profession, experience, hourly rates
- Category assignments (1-3 categories per provider)
- Trade assignments (1-3 trades per provider, one primary)
- Skills (3-5 per provider)
- Service zones (city + commune)
- Trust scores with varying levels (NEWCOMER through TOP_RATED)
- Badges for top providers
- Certifications (some verified, some pending)
- Portfolio projects with before/after images (placeholder URLs)

**Transactions:**
- 25 bookings across various statuses (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- Reviews for completed bookings (with 5-category ratings)
- Client reviews for some completed bookings

**Other:**
- Visibility settings for some users
- Favorites (clients saving providers)
- Conversations and messages between clients and providers
- Notifications

### PostgreSQL Considerations

The existing seed scripts were written for SQLite. Changes needed:

1. Remove any `skipDuplicates` calls (not supported or handled differently)
2. Use `createMany` where appropriate (PostgreSQL supports it efficiently)
3. Handle `DateTime` fields correctly (ISO strings work in both)
4. Ensure `cuid()` IDs work (they do in both)
5. Use transactions for related records (`prisma.$transaction`)

### Seed Command

```json
// apps/backend/package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run: `pnpm --filter @kayu/backend run db:seed`

## Docker Compose

### `compose.yaml` (at project root)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: kayu-postgres
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: kayu
    volumes:
      - kayu-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin for database browsing
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: kayu-pgadmin
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@kayou.cd
      PGADMIN_DEFAULT_PASSWORD: admin
    profiles:
      - tools

volumes:
  kayu-postgres-data:
```

Port 5433 to avoid conflicts with any local PostgreSQL installations.

## Environment Management

### `apps/backend/.env.example`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/kayu?schema=public
JWT_SECRET=kayou-jwt-secret-change-in-production
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### `apps/web/.env.example`
```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `apps/mobile/.env.example`
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### `.env` files in `.gitignore`
```
.env
.env.local
!.env.example
```

## Root Scripts

### `package.json` (root)
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=@kayu/web --filter=@kayu/backend",
    "dev:mobile": "turbo run dev --filter=@kayu/mobile --filter=@kayu/backend",
    "dev:backend": "turbo run dev --filter=@kayu/backend",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose down",
    "db:push": "pnpm --filter @kayu/backend run prisma:push",
    "db:seed": "pnpm --filter @kayu/backend run db:seed",
    "db:reset": "pnpm --filter @kayu/backend run prisma:reset",
    "db:studio": "pnpm --filter @kayu/backend run db:studio",
    "setup": "pnpm install && pnpm db:up && sleep 3 && pnpm db:push && pnpm db:seed"
  }
}
```

The `setup` script is the one-command quickstart. Invoke it with `pnpm run setup`; `pnpm setup` is a pnpm environment command and does not run the project script.

## Documentation

### `README.md` (project root)

Content:
1. **What is KAYOU** — one-paragraph description
2. **Architecture** — diagram showing apps + packages + database
3. **Prerequisites** — Node.js 20+, pnpm 9+, Docker
4. **Quickstart** — 4 commands: clone, setup, dev, open browser
5. **Project structure** — directory tree with descriptions
6. **Available scripts** — table of all root scripts
7. **Environment variables** — table per app
8. **Test credentials** — admin, provider, client accounts
9. **Tech stack** — backend, web, mobile, shared packages
10. **Contributing** — how to add a feature, run type-check, etc.

### `docs/DEVELOPER_GUIDE.md`

Migrate and update the existing `DEVELOPER_GUIDE.md` for the new architecture:
1. Architecture overview (monorepo, backend/frontend separation)
2. Shared packages documentation
3. API endpoints reference (full list)
4. Database schema overview
5. Auth flow (web vs. mobile)
6. Adding a new feature (step-by-step)
7. Adding a new API endpoint
8. Adding a new shared schema
9. Running tests (when added)
10. Deployment notes

## Verification: End-to-End Flow

The final acceptance test is:

```bash
# 1. Clone and setup
git clone <repo>
cd kayu-project
pnpm run setup

# 2. Start development
pnpm dev:web    # starts backend + web

# 3. Open browser
open http://localhost:3000

# 4. Login as admin
# email: admin@kayou.cd
# password: Password123!

# 5. Browse providers, create booking, leave review
# All should work with seeded data
```

## Dependencies

- **Depends on:** All previous chunks (01-12) — this wraps everything together
- **Required by:** Nothing — this is the final chunk

## Acceptance Criteria

1. `pnpm run setup` completes without errors (install, docker, db push, seed)
2. Seed data creates all expected records (categories, users, providers, bookings, reviews)
3. `pnpm dev:web` starts backend and web app
4. `pnpm dev:mobile` starts backend and mobile app
5. Admin can log in with `admin@kayou.cd` / `Password123!`
6. Provider and client demo accounts work
7. All seeded data is visible in the app (categories, providers, bookings, reviews)
8. `README.md` has complete quickstart instructions
9. `DEVELOPER_GUIDE.md` documents the new architecture
10. `.env.example` files exist for all apps
11. `docker compose down && docker compose up -d` restarts cleanly

## Suggested Implementation Steps

1. Migrate `seed-categories.ts` to `apps/backend/prisma/seed-categories.ts` (adjust for PostgreSQL)
2. Migrate main seed script to `apps/backend/prisma/seed.ts`
3. Create demo seed with users, providers, bookings, reviews
4. Add `prisma` seed configuration to backend `package.json`
5. Test: `pnpm db:push && pnpm db:seed` with a fresh database
6. Finalize `compose.yaml` at project root
7. Create `.env.example` files for all apps
8. Write root `README.md`
9. Update `docs/DEVELOPER_GUIDE.md` for new architecture
10. Test the full quickstart flow from scratch (delete node_modules, database, start fresh)

## QA / Validation Checklist

- [ ] `docker compose up -d` starts PostgreSQL
- [ ] `pnpm db:push` creates all tables
- [ ] `pnpm db:seed` populates data without errors
- [ ] `pnpm db:seed` is idempotent (running twice doesn't fail)
- [ ] Admin login works with seeded credentials
- [ ] At least 5 providers visible on homepage
- [ ] At least 10 categories visible
- [ ] Bookings exist for demo accounts
- [ ] Reviews exist with rating data
- [ ] `pnpm dev:web` starts both backend and web
- [ ] `pnpm dev:mobile` starts both backend and mobile
- [ ] `pnpm run setup` works on a clean clone
- [ ] `README.md` exists and has quickstart
- [ ] `DEVELOPER_GUIDE.md` documents architecture
- [ ] `.env.example` files exist for backend, web, mobile
- [ ] `.gitignore` covers `.env`, `node_modules`, `.next`, `dist`, database files
