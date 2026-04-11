# 03 — Backend Foundation & Database

## Goal

Set up the NestJS backend application with Prisma ORM connected to PostgreSQL, the common module (Zod validation pipe, auth guard, role guard, decorators), and the database module. No business logic — just the infrastructure that all backend modules will use.

## Why It Matters

Every backend module (auth, providers, bookings, etc.) depends on the Prisma service, Zod validation pipe, and auth guards. Building this foundation first means subsequent chunks can focus purely on business logic.

## Scope

### In Scope
- NestJS application scaffold with `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- Prisma ORM setup with PostgreSQL provider
- Migrate existing Prisma schema from SQLite syntax to PostgreSQL
- Add `authUserId` (unique) to User model, remove `password` field — auth is managed by Supabase
- Database module with `PrismaService` (global)
- Common module:
  - `ZodValidationPipe` — custom pipe that validates request bodies with Zod schemas
  - `SupabaseJwtService` — verifies Supabase JWTs using `jose` library with remote JWKS endpoint
  - `SupabaseGuard` — extracts Bearer token from Authorization header, verifies JWT, sets `req.user = { authUserId, phone, email }`
  - `ActorGuard` — resolves `authUserId` to internal User record (auto-creates if missing), sets `req.actor`
  - `RolesGuard` — role-based access control guard checking `req.actor.role`
  - `@CurrentUser()` decorator — injects `AuthContextUser` (authUserId + claims from JWT)
  - `@CurrentActor()` decorator — injects full internal User (after ActorGuard resolution)
  - `@Roles()` decorator — marks required roles on endpoints
- CORS configuration (allow web and mobile origins)
- Global validation settings
- `.env` and `.env.example` for backend (includes Supabase JWKS URL)
- NestJS CLI configuration (`nest-cli.json`)

### Out Of Scope
- Any business module (auth, providers, bookings — those are chunks 04-08)
- Seed scripts (chunk 13)
- Prisma migrations (just `db push` for now)
- API endpoints

## Backend Structure

```
apps/backend/
├── src/
│   ├── main.ts                    # Bootstrap, CORS, global pipes
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   ├── common.module.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   ├── auth/
│   │   │   ├── supabase-jwt.service.ts   # JWT verification via jose + JWKS
│   │   │   └── types.ts                  # AuthContextUser, Actor types
│   │   ├── guards/
│   │   │   ├── supabase.guard.ts         # Extracts + verifies Supabase JWT
│   │   │   ├── actor.guard.ts            # Resolves authUserId → internal User
│   │   │   └── roles.guard.ts            # Checks @Roles() metadata
│   │   └── decorators/
│   │       ├── current-user.decorator.ts # Extracts req.user (AuthContextUser)
│   │       ├── current-actor.decorator.ts # Extracts req.actor (internal User)
│   │       └── roles.decorator.ts
│   └── database/
│       ├── database.module.ts
│       └── prisma.service.ts
├── prisma/
│   └── schema.prisma              # migrated from SQLite to PostgreSQL
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .env
└── .env.example
```

## Prisma Schema Migration

The existing schema at `/Users/alainmk/startups/kayu/frontend/prisma/schema.prisma` uses SQLite. Changes needed:

1. **Provider**: `sqlite` → `postgresql`
2. **URL**: `file:./db/custom.db` → `postgresql://postgres:postgres@localhost:5433/kayu?schema=public`
3. **Default IDs**: `@default(cuid())` works in both — no change needed
4. **DateTime**: SQLite stores as text, PostgreSQL as native timestamps — Prisma handles this automatically
5. **JSON fields**: SQLite stores JSON as text, PostgreSQL has native JSON — use `Json` type in Prisma
6. **Boolean defaults**: Both support `@default(true/false)` — no change
7. **Unique constraints**: Verify composite unique constraints work the same

Model changes for Supabase auth:
- **Add** `authUserId String @unique` to User (maps to Supabase JWT `sub` claim)
- **Remove** `password` field from User (Supabase manages credentials)
- **Remove** `resetToken` and `resetTokenExpiry` from User (Supabase handles password reset)
- **Remove** the `Session` model entirely (Supabase manages sessions)
- **Remove** `sessions Session[]` relation from User
- **Make** `email` optional (`String?`) — phone-only users possible via OTP

## Zod Validation Pipe

```typescript
// common/pipes/zod-validation.pipe.ts
// A custom NestJS pipe that:
// 1. Accepts a Zod schema as constructor argument
// 2. Calls schema.parse(value) on the request body
// 3. Returns the parsed/transformed value on success
// 4. Throws BadRequestException with Zod error details on failure
```

Usage in controllers:
```typescript
@Post()
create(@Body(new ZodValidationPipe(CreateBookingDto)) body: CreateBookingDtoType) {
  // body is validated and typed
}
```

## Supabase JWT Verification

```typescript
// common/auth/supabase-jwt.service.ts
// Uses jose library (NOT the Supabase SDK) to verify JWTs:
// 1. createRemoteJWKSet(new URL(SUPABASE_JWT_ISSUER)) — loads public keys from Supabase
// 2. jwtVerify(token, jwks) — verifies signature and expiry
// 3. Returns decoded claims: sub (authUserId), email, phone
// Reference: /Users/alainmk/ibt-car/backend/libs/common/src/auth/supabase-jwt.service.ts
```

## Guard Chain

```typescript
// Three stackable guards, applied per-endpoint:

// 1. SupabaseGuard — extracts Bearer token, verifies JWT, sets req.user
//    req.user = { authUserId: string, email?: string, phone?: string }

// 2. ActorGuard — resolves authUserId to internal User (auto-creates if missing)
//    req.actor = { id, authUserId, role, status, firstName, ... }
//    Throws 403 if user is suspended/deleted

// 3. RolesGuard — checks @Roles() metadata against req.actor.role
//    Throws 403 if role not allowed

// Usage:
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

## Auto-Creation Pattern

When a user authenticates for the first time (valid Supabase JWT but no local DB record), the `ActorGuard` auto-creates the user:

1. `SupabaseGuard` extracts `authUserId` from JWT `sub` claim
2. `ActorGuard` calls `IdentityService.resolve({ authUserId, email, phone })`
3. Service queries User by `authUserId` — not found
4. Creates User with: `authUserId`, `email`, `phone`, default role `CLIENT`, default status `ACTIVE`
5. Subsequent requests find the existing user

This means **registration is handled entirely by Supabase on the frontend**. The backend just validates the JWT and auto-syncs the user record.

## Environment Variables

```env
# .env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/kayu?schema=public
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

Note: Backend runs on port 3001. Web app (Next.js) runs on port 3000. Mobile dev server on 8081.

## CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

## Supabase Project Setup (Manual Prerequisite)

Before starting this chunk, create a Supabase project at https://supabase.com/dashboard:

1. Create a new project (name: `kayu`, region: closest to DRC)
2. Note the **Project URL** → `SUPABASE_URL`
3. Note the **anon/public key** → used by frontend apps
4. Note the **service_role key** → `SUPABASE_SERVICE_KEY` (backend only, optional)
5. Construct the JWKS URL: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` → `SUPABASE_JWT_ISSUER`
6. In Auth settings: enable Email provider and Phone provider (for OTP)
7. In Auth settings: configure Site URL to `http://localhost:3000`

## Dependencies

- **Depends on:** Chunk 01 (monorepo must exist), Chunk 02 (`@kayu/schemas` for guard types)
- **Required by:** Chunks 04-08 (all backend modules)

## Acceptance Criteria

1. `pnpm --filter @kayu/backend run start:dev` starts the NestJS application without errors
2. Prisma connects to PostgreSQL (via Docker Compose from chunk 01)
3. `pnpm --filter @kayu/backend run prisma:push` creates all tables in PostgreSQL
4. `ZodValidationPipe` correctly validates and rejects invalid payloads
5. `AuthGuard` reads JWT from both cookie and Authorization header
6. `RolesGuard` restricts access based on `@Roles()` decorator
7. `@CurrentUser()` decorator injects the user object
8. `turbo run type-check` passes

## Suggested Implementation Steps

1. Install NestJS dependencies in `apps/backend`: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `prisma`, `@prisma/client`, `jose` (for JWT verification), `@supabase/supabase-js` (optional, for admin operations)
2. Copy the Prisma schema from the existing project, change provider to `postgresql`, update URL, add `authUserId` (unique) to User model, remove `password` field
3. Create `database/prisma.service.ts` as a global NestJS service
4. Create `database/database.module.ts` as a global module
5. Create `common/pipes/zod-validation.pipe.ts`
6. Create `common/auth/supabase-jwt.service.ts` (jose + remote JWKS, reference ibt-car implementation)
7. Create `common/guards/supabase.guard.ts` (extracts Bearer token, verifies, sets req.user)
8. Create `common/guards/actor.guard.ts` (resolves authUserId → internal User, auto-creates)
9. Create `common/guards/roles.guard.ts`
10. Create `common/decorators/current-user.decorator.ts`, `current-actor.decorator.ts`, and `roles.decorator.ts`
9. Create `main.ts` with CORS, cookie-parser, global prefix `/api`
10. Create `app.module.ts` importing DatabaseModule and CommonModule
11. Write `.env` and `.env.example`
12. Run `docker compose up -d` (PostgreSQL) then `prisma db push` to create tables
13. Verify the app starts and connects to the database

## QA / Validation Checklist

- [ ] NestJS starts without errors on port 3001
- [ ] Prisma connects to PostgreSQL
- [ ] All tables created by `prisma db push`
- [ ] GET `/api` returns a health check response
- [ ] `ZodValidationPipe` rejects invalid JSON body with descriptive error
- [ ] `SupabaseGuard` returns 401 when no token provided
- [ ] `SupabaseGuard` returns 401 when token has invalid signature
- [ ] `ActorGuard` auto-creates user on first valid JWT
- [ ] `ActorGuard` resolves existing user on subsequent requests
- [ ] `turbo run type-check` passes
- [ ] `.env.example` documents all required variables
