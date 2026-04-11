# 04 — Backend: Authentication & Identity

## Goal

Create the identity module that syncs Supabase-authenticated users with the local database, and the `/me` endpoint for profile retrieval and completion. Authentication (register, login, OTP) is handled entirely by Supabase on the frontend — the backend only validates JWTs and manages the local user record.

## Why It Matters

This is a fundamentally different auth model from the original monolith. Instead of the backend managing passwords and JWTs, Supabase handles all credential management. The backend's job is to:

1. **Verify** that the incoming JWT is valid (via Supabase JWKS)
2. **Sync** the Supabase user to a local User record (auto-create on first request)
3. **Enrich** the user with app-specific data (role, profile, provider info)

This pattern was proven in the ibt-car project (`/Users/alainmk/ibt-car/backend`) and is being replicated here.

## Scope

### In Scope
- `IdentityModule` with controller, service, and repository
- Endpoints:
  - `GET /api/me` — current user profile (requires SupabaseGuard only)
  - `PATCH /api/me/profile` — complete/update profile (firstName, lastName, city, country, phone)
  - `PATCH /api/me/role` — set user role (CLIENT or PROVIDER, one-time)
  - `POST /api/me/provider-onboarding` — complete provider setup (profession, categories, trades, skills, service zones)
- Auto-creation of User record on first authenticated request (in ActorGuard)
- Phone/email sync from Supabase JWT claims to local User record
- User status checks (active, suspended, deleted)

### Out Of Scope
- Supabase project setup (done manually in Supabase dashboard)
- Frontend auth UI (chunks 10, 11)
- Password hashing / local JWT generation (Supabase handles this)
- Email verification (Supabase handles this)
- Phone OTP verification (Supabase handles this)
- OAuth / social login (Supabase handles this, can be enabled later)

## Auth Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Web or Mobile)                                        │
│                                                                 │
│ 1. User registers via Supabase SDK                              │
│    supabase.auth.signUp({ email, password })                    │
│    or supabase.auth.signInWithOtp({ phone })                    │
│                                                                 │
│ 2. User logs in → gets Supabase session with JWT                │
│    supabase.auth.signInWithPassword({ email, password })        │
│                                                                 │
│ 3. Frontend sends requests to backend with JWT                  │
│    Authorization: Bearer <supabase-jwt>                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (NestJS)                                                │
│                                                                 │
│ 4. SupabaseGuard verifies JWT via JWKS                          │
│    → req.user = { authUserId, email, phone }                    │
│                                                                 │
│ 5. ActorGuard resolves authUserId → internal User               │
│    → If user doesn't exist: auto-create with defaults           │
│    → If email/phone changed: sync from JWT                      │
│    → req.actor = { id, role, status, ... }                      │
│                                                                 │
│ 6. RolesGuard checks role (if @Roles decorator present)         │
│                                                                 │
│ 7. Controller handler executes with @CurrentActor()             │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### `GET /api/me`

**Guards:** `SupabaseGuard` only (minimal — works even before profile completion)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "cuid",
    "authUserId": "supabase-uuid",
    "email": "user@example.com",
    "phone": "+243998765432",
    "firstName": "Jean",
    "lastName": "Dupont",
    "avatar": null,
    "role": "CLIENT",
    "city": "Kinshasa",
    "country": "RDC",
    "isVerified": true,
    "isActive": true,
    "clientTrustLevel": "NEW_CLIENT",
    "profileComplete": false,
    "provider": null
  }
}
```

**Logic:**
1. Extract `authUserId` from JWT via `@CurrentUser()`
2. Find or create user in local DB
3. If user has provider profile, include it
4. Calculate `profileComplete` (has firstName, lastName, role set)

### `PATCH /api/me/profile`

**Guards:** `SupabaseGuard`, `ActorGuard`

**Request body** (validated with `CompleteProfileDto`):
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "city": "Kinshasa",
  "country": "RDC",
  "phone": "+243998765432"
}
```

**Logic:** Update user record. This is called after Supabase signup to set the user's profile data that Supabase doesn't manage.

### `PATCH /api/me/role`

**Guards:** `SupabaseGuard`, `ActorGuard`

**Request body:**
```json
{ "role": "PROVIDER" }
```

**Logic:**
1. Only allowed if role is still the default (prevent role switching later)
2. If setting to PROVIDER, no provider profile is created yet (that's the onboarding step)
3. Update user role

### `POST /api/me/provider-onboarding`

**Guards:** `SupabaseGuard`, `ActorGuard`, `RolesGuard`
**Roles:** `PROVIDER`

**Request body** (validated with `ProviderOnboardingDto`):
```json
{
  "profession": "Plombier",
  "description": "Expert en plomberie...",
  "experience": 5,
  "hourlyRate": 15000,
  "categoryIds": ["cat-1", "cat-2"],
  "skills": ["Soudure", "Tuyauterie"],
  "serviceZones": [{ "city": "Kinshasa", "commune": "Gombe" }],
  "tradeIds": ["trade-1", "trade-2"],
  "primaryTradeId": "trade-1"
}
```

**Logic:**
1. Validate user has role PROVIDER
2. Validate tradeIds (max 3)
3. Create Provider + ProviderCategories + Skills + ServiceZones + ProviderTrades in a transaction
4. Return completed provider profile

## User Model Changes

The Prisma User model needs these changes from the current schema:

```diff
model User {
  id            String   @id @default(cuid())
+ authUserId    String   @unique    // Supabase user ID (JWT sub claim)
  email         String?  @unique    // Now optional — phone-only users possible
  phone         String?  @unique
- password      String              // REMOVED — Supabase handles passwords
  firstName     String?
  lastName      String?
  avatar        String?
  role          UserRole @default(CLIENT)
  // ... rest unchanged
}
```

Key changes:
- `authUserId` added (unique, maps to Supabase `sub`)
- `password` removed
- `email` becomes optional (to support phone-only registration via OTP)
- `resetToken` and `resetTokenExpiry` removed (Supabase handles password reset)

## Module Structure

```
apps/backend/src/modules/
└── identity/
    ├── identity.module.ts
    ├── identity.controller.ts
    ├── identity.service.ts      # getMe, completeProfile, setRole, providerOnboarding
    └── identity.repository.ts   # findByAuthUserId, createUser, updateProfile
```

The `IdentityService` also implements the `IActorResolver` interface used by `ActorGuard`:

```typescript
interface IActorResolver {
  resolve(authUser: AuthContextUser): Promise<Actor>
}
```

This interface is injected via DI token so the guard doesn't depend directly on the identity module.

## Security Considerations

- Backend never sees or stores passwords — Supabase manages all credentials
- JWTs are verified using public keys from Supabase JWKS endpoint (asymmetric, no shared secret needed)
- `jose` library handles key rotation automatically (JWKS is fetched remotely)
- User status (ACTIVE/SUSPENDED/DELETED) is enforced at the guard level — suspended users can't access any protected endpoint
- Email/phone sync: if a Supabase user changes their email/phone, it's updated locally on next request

## Dependencies

- **Depends on:** Chunk 02 (`CompleteProfileDto`, `ProviderOnboardingDto` from `@kayu/schemas`), Chunk 03 (Prisma service, SupabaseGuard, ActorGuard, ZodValidationPipe)
- **Required by:** Chunks 05-08 (all need auth), Chunk 09 (API client needs /me endpoint)
- **Reference:** `/Users/alainmk/ibt-car/backend/apps/api/src/modules/identity/` (same pattern)

## Acceptance Criteria

1. First request with a valid Supabase JWT auto-creates a User record
2. Subsequent requests with the same JWT find the existing user
3. `GET /api/me` returns the user profile (with provider info if applicable)
4. `PATCH /api/me/profile` updates user profile fields
5. `PATCH /api/me/role` sets the user role (one-time)
6. `POST /api/me/provider-onboarding` creates the full provider profile with categories, trades, skills, service zones
7. Invalid or expired Supabase JWTs return 401
8. Suspended users get 403 on ActorGuard-protected endpoints
9. All request bodies validated with Zod schemas from `@kayu/schemas`

## Suggested Implementation Steps

1. Create `modules/identity/identity.repository.ts` with `findByAuthUserId`, `createUser`, `updateProfile`, `setRole`, `createProviderProfile` methods
2. Create `modules/identity/identity.service.ts` implementing `IActorResolver` + business methods
3. Create `modules/identity/identity.controller.ts` with 4 endpoints
4. Create `modules/identity/identity.module.ts`
5. Register the `IActorResolver` DI token pointing to `IdentityService`
6. Register `IdentityModule` in `AppModule`
7. Test: send a request with a valid Supabase JWT → user auto-created
8. Test: `GET /api/me` returns the auto-created user
9. Test: `PATCH /api/me/profile` completes the profile
10. Test: `POST /api/me/provider-onboarding` creates provider with all relations

## QA / Validation Checklist

- [ ] Valid Supabase JWT → user auto-created in database
- [ ] Same JWT again → existing user returned (no duplicate)
- [ ] `GET /api/me` returns user with `authUserId` matching JWT sub
- [ ] `GET /api/me` returns `provider: null` for client users
- [ ] `GET /api/me` returns `provider: {...}` for provider users
- [ ] `PATCH /api/me/profile` updates firstName, lastName, city
- [ ] `PATCH /api/me/role` sets role to PROVIDER
- [ ] `PATCH /api/me/role` rejects if role already set (not default)
- [ ] `POST /api/me/provider-onboarding` creates Provider + Categories + Trades + Skills + ServiceZones
- [ ] `POST /api/me/provider-onboarding` rejects if user is not PROVIDER role
- [ ] `POST /api/me/provider-onboarding` rejects > 3 trades
- [ ] Invalid JWT → 401 Unauthorized
- [ ] Expired JWT → 401 Unauthorized
- [ ] No Authorization header → 401 Unauthorized
- [ ] Phone change in Supabase JWT → synced to local User on next request
