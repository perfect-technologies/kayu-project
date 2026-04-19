# 00 — Audit findings, gap matrix, cross-cutting patterns

## Goal

Map every v2 design screen to its current data source, backend endpoint state, and integration gap. This doc is the input for all 10 chunks.

## Gap matrix — one row per domain

Legend: ✅ wired · ⚠️ partial · ❌ missing / mocked

| Domain | Backend | `@kayu/schemas` | `@kayu/api` | Web | Mobile |
|---|---|---|---|---|---|
| Auth (phone OTP) | ✅ Supabase guard | ✅ | ✅ | ⚠️ OTP mocked, demo accounts fallback | ⚠️ OTP mocked, demo accounts |
| Identity / `/me` | ✅ | ✅ | ✅ | ✅ | ✅ (EditProfile) |
| Categories / Trades | ✅ | ✅ | ✅ | ✅ | ✅ |
| Provider search | ✅ | ✅ | ✅ | ✅ | ✅ |
| Provider profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Provider self-update | ✅ `PATCH /providers/me` | ✅ | ✅ | — | — (used only by onboarding + verification indirectly) |
| Booking create | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bookings list | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reviews | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favorites | ✅ | ✅ | ✅ | — | ✅ |
| Settings / visibility | ✅ | ✅ | ✅ | — | ✅ |
| Stats (public) | ✅ | ✅ | ✅ | ✅ | — |
| Geo (geocode + distance) | ✅ | ✅ | ✅ | — | — |
| Notifications | ✅ | ✅ | ✅ | ❌ no consumer yet | ❌ no consumer yet |
| **Messages** | ✅ | ✅ | ✅ | ❌ `DEMO_THREADS` fixtures | ❌ `DEMO_THREADS` fixtures |
| **Provider Dashboard** | ⚠️ `GET /dashboard/provider` exists but thin | ✅ generic response schema | ✅ | ❌ `TODAY_JOBS`, `NEW_REQUESTS`, `STATS` | ❌ same fixtures |
| **Job Requests** | ❌ no module | ❌ | ❌ | ❌ `INCOMING_REQUESTS`, `PRO_ACTIVE_JOBS` | ❌ same |
| **Quote / Devis** | ❌ no module, no model | ❌ | ❌ | ❌ presets + request lookup from fixtures | ❌ same |
| **Earnings** | ❌ no module, no models | ❌ | ❌ | ❌ `EARNINGS_WEEKLY`, `TRANSACTIONS`, `BALANCES` | ❌ same |
| **Provider Onboarding** | ⚠️ `POST /me/provider-onboarding` exists | ✅ | ✅ | ⚠️ localStorage draft, no backend save | ⚠️ same |
| **Verification / KYC docs** | ⚠️ CertificationDoc model exists for certs only; no general upload endpoint | ⚠️ partial | ⚠️ partial | ❌ state + docs fixtures | ❌ same |
| **Admin — users/providers/categories/reviews CRUD** | ✅ | ✅ | ✅ | ✅ (`/admin` dashboard wired) | — (no mobile admin) |
| **Admin — disputes** | ❌ no model, no endpoints | ❌ | ❌ | — (screen not implemented) | — |
| **Admin — payouts** | ❌ no model, no endpoints | ❌ | ❌ | — (screen not implemented) | — |

## Inventory of frontend fixtures

These are the exact constants declared inline in screen files. Track deletion via I10.

### Web (`apps/web`)
- `DEMO_THREADS` (messages)
- `TODAY_JOBS`, `NEW_REQUESTS`, `STATS` (pro dashboard)
- `INCOMING_REQUESTS`, `PRO_ACTIVE_JOBS` (job requests)
- `PRESET_LINE_ITEMS` + lookup helpers (quote compose) — note: presets are reasonable to keep as static catalog; the *request lookup* must go
- `EARNINGS_WEEKLY`, `TRANSACTIONS`, `BALANCES` (earnings)
- `INITIAL_DATA` (onboarding)
- Mock `VerifyState`, `PRO_DISPUTE` (verification)
- `DEMO_ACCOUNTS`, `COUNTRIES`, `SERVICE_OPTIONS` in auth — the DEMO_ACCOUNTS fallback must go; `COUNTRIES` is static config and stays

### Mobile (`apps/mobile`)
Same list, same names (fixtures are duplicated across web + mobile — both need removing).

## Cross-cutting patterns the chunks will use

### 1. Fixture → hook swap pattern

Before:
```tsx
const TODAY_JOBS = [{ id: "j1", ... }, ...]
// ...
return <ul>{TODAY_JOBS.map(...)}</ul>
```

After:
```tsx
import { useQuery } from "@tanstack/react-query"
import { apiClient, dashboardApi, queryKeys } from "@kayu/api"

const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.dashboard.provider,
  queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
})
if (isLoading) return <PageSkeleton kind="providerDashboard" />
if (error) return <ErrorState onRetry={() => refetch()} />
const todayJobs = data?.todayJobs ?? []
return <ul>{todayJobs.map(...)}</ul>
```

Every chunk follows this shape. The DS08 skeletons from the design plan v1 already exist in `@kayu/ui` — use them.

### 2. Zod-first contract

Every new response shape goes into `packages/schemas/src/responses.ts` (or a new module file) as a Zod schema. The backend `ZodValidationPipe` uses it. The API client function's return type is the inferred Zod type. Frontend consumers get full type safety with no manual typing.

**Rule:** no `unknown` return types in `@kayu/api`. If you see `Promise<{ success: boolean, booking: unknown }>` that's a lie — replace with the real Zod-inferred type.

### 3. Backend module shape

For each new module (quotes, earnings, job-requests, verification-docs):

```
apps/backend/src/modules/<domain>/
  <domain>.module.ts
  <domain>.controller.ts      // endpoints, ZodValidationPipe
  <domain>.service.ts         // business logic
  <domain>.repository.ts      // Prisma queries (optional, if complex)
  dto/                        // not needed — DTOs come from @kayu/schemas
```

All protected endpoints get `@UseGuards(SupabaseGuard, ActorGuard)` and `@Roles(...)` where appropriate.

### 4. Real-time vs polling

Messages + notifications + active booking progress are the only places real-time matters. For now, all three use TanStack Query polling (`refetchInterval: 15_000` on list views, `5_000` on active chat). Websockets are out of scope.

### 5. Mobile Money payout — the boundary

`I06` ships the Earnings UI + backend data model. The **payout action itself** (posting to a PSP) is stubbed at the backend: `POST /pro/payouts` records the request and marks it `pending`, but does not call any PSP. A future ticket will wire M-Pesa / Airtel / Orange / MTN. The UI already says "Délai : 2-5 minutes" — the backend will respect that contract once real wiring happens.

### 6. Auth-aware error surfaces

Every wired screen must handle three states:
- **Loading** → skeleton (from `@kayu/ui`)
- **Empty** → `<EmptyState/>` with tab-specific copy (already defined for bookings tabs in DS03, same pattern applies)
- **Error** → `<ErrorState/>` with retry. On 401, redirect to `/auth`.

### 7. What NOT to wire

The `PRESET_LINE_ITEMS` constant in QuoteCompose is a static catalog keyed by category. It can stay in code — it's not data that should come from the DB for MVP. **But** the currently-active request that a quote is being composed *against* must come from a real `GET /pro/requests/:id` call (I05 depends on I04).

## Domains requiring NEW Prisma models

Catalog for migrations in subsequent chunks.

### I04 — Job Requests
```
model JobRequest {
  id          String  @id @default(cuid())
  clientId    String
  categoryId  String?
  service     String
  description String
  address     String
  city        String
  commune     String?
  latitude    Float?
  longitude   Float?
  whenPref    String          // "asap" | "today" | "tomorrow" | ISO date
  estimatedHours Float?
  budget      Int?            // in FC
  photos      Int             @default(0)
  status      JobRequestStatus @default(OPEN)   // OPEN | MATCHED | EXPIRED | CANCELLED
  expiresAt   DateTime?
  competingCount Int          @default(0)       // set by matcher
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // matching relations
  matchedProviders JobRequestMatch[]
  quotes           Quote[]
}

model JobRequestMatch {
  id            String @id @default(cuid())
  jobRequestId  String
  providerId    String
  matchScore    Int       // 0-100
  notifiedAt    DateTime  @default(now())
  dismissedAt   DateTime?
  @@unique([jobRequestId, providerId])
}
```

### I05 — Quote / Devis
```
model Quote {
  id             String   @id @default(cuid())
  jobRequestId   String?  // nullable — pros can create standalone quotes
  providerId     String
  clientId       String
  message        String
  validityDays   Int      @default(7)
  startDateKind  String   // "today" | "tomorrow" | "this_week" | ISO
  discountPct    Int      @default(0)
  subtotal       Int
  total          Int
  commissionPct  Int      @default(10)
  commissionAmt  Int
  payoutAmt      Int
  status         QuoteStatus @default(DRAFT)    // DRAFT | SENT | ACCEPTED | DECLINED | EXPIRED
  sentAt         DateTime?
  acceptedAt     DateTime?
  expiresAt      DateTime?
  lines          QuoteLineItem[]
  booking        Booking? @relation("BookingFromQuote")  // created when accepted
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model QuoteLineItem {
  id         String @id @default(cuid())
  quoteId    String
  label      String
  qty        Float
  unit       String     // "Forfait" | "Heure" | "Pièce"
  unitPrice  Int        // FC
  order      Int
}
```

### I06 — Earnings / Payouts
```
model Transaction {
  id              String @id @default(cuid())
  providerId      String
  type            TransactionType   // EARNING | PAYOUT | BONUS | REFUND
  bookingId       String?
  amount          Int               // signed: positive for earnings, negative for payouts
  feeAmt          Int     @default(0)
  netAmt          Int
  paymentMethod   String?           // "cash" | "mpesa" | "airtel" | "orange" | "mtn"
  status          TransactionStatus // PENDING | COMPLETED | FAILED
  reference       String?           // PSP reference for payouts
  occurredAt      DateTime @default(now())
}

model Payout {
  id              String @id @default(cuid())
  providerId      String
  operator        String            // "mpesa" | "airtel" | "orange" | "mtn"
  phoneMasked     String            // "+243 810 *** 742"
  amount          Int
  feeAmt          Int
  netAmt          Int
  status          PayoutStatus      // READY | PENDING | COMPLETED | FAILED | ON_HOLD
  reference       String?           // PSP ref
  holdReason      String?
  requestedAt     DateTime @default(now())
  completedAt     DateTime?
  transaction     Transaction?      // linked earnings transaction
}
```

### I07 — Onboarding
No new model. Reuse `User` + `Provider` + `ProviderCategory` + `ProviderTrade`. Add:
- `User.onboardingStep Int?` (0-6, null when complete)
- `Provider.onboardingCompleteAt DateTime?`

Plus new endpoints: `GET /me/provider-draft`, `PATCH /me/provider-draft`, `POST /me/provider-publish`.

### I08 — Verification docs
```
model VerificationDoc {
  id          String @id @default(cuid())
  providerId  String
  kind        VerificationDocKind    // ID_FRONT | ID_BACK | SELFIE | ADDRESS | CERT_OPTIONAL
  url         String                 // cloud storage URL (placeholder: a signed URL)
  uploadedAt  DateTime @default(now())
  reviewedAt  DateTime?
  reviewedBy  String?                 // admin userId
  decision    VerificationDecision?   // APPROVED | REJECTED
  rejectionReason String?
}

model Dispute {
  id          String @id @default(cuid())
  bookingId   String
  openedById  String                 // client or pro
  reason      String
  clientStmt  String?
  proStmt     String?
  status      DisputeStatus @default(NEW)   // NEW | PENDING_PRO | INVESTIGATING | ESCALATED | RESOLVED
  severity    DisputeSeverity               // LOW | MEDIUM | HIGH
  resolution  String?
  resolvedAt  DateTime?
  evidences   DisputeEvidence[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Principal risks

1. **Schema drift between backend DTOs and frontend schemas.** Mitigation: always write the Zod schema in `@kayu/schemas` first, import it in the backend ZodValidationPipe and in the frontend API client.
2. **Race conditions on quote → booking conversion.** When a quote is accepted, a booking must be created atomically. Use a Prisma transaction.
3. **Mobile Money payout is NOT a real transaction yet.** The UI says "Délai : 2-5 minutes" but only records to DB. Document this as a known placeholder. Never ship the Earnings screen to production users without a real PSP gate behind it.
4. **Pro onboarding autosave performance.** Every keystroke can't PATCH. Debounce 600ms. Don't auto-save photos — explicit upload action.
5. **Dispute SLA enforcement.** If a pro doesn't respond in 24h, escalate automatically. Out of scope for this plan — note in I09.

## What this plan does NOT do

- WebSockets / SSE / Push notifications
- File storage / image upload to cloud (placeholder URLs only)
- PSP integration for Mobile Money (stub only)
- Multi-region backend or caching (single Prisma DB, single instance)
- Full admin surface (disputes + payouts are optional I09)
- Automated e2e tests (manual smoke per chunk)
- i18n / multi-language — French stays as-is

Anything in this list is a future ticket, tracked in PROGRESS as an open TODO after I10.
