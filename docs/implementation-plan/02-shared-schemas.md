# 02 — Shared Schemas Package

## Goal

Create `@kayu/schemas` — a single Zod-based package that defines all enums, domain model schemas, request/response DTOs, and inferred TypeScript types for the entire KAYOU platform. This package is imported by backend, web, and mobile.

## Why It Matters

The current monolith has types scattered across API routes, components, and contexts. By centralizing them in one package, we get:

- **One source of truth** — change a field once, both backend and frontend see it
- **Runtime validation** — Zod schemas validate at runtime (backend request bodies, frontend forms)
- **Type inference** — TypeScript types are derived from Zod, never manually defined
- **No class-validator** — the backend uses the same Zod schemas via a custom validation pipe

## Scope

### In Scope
- All enums from the Prisma schema as Zod enums
- Domain model schemas (User, Provider, Category, Booking, Review, etc.)
- Request DTOs (RegisterDto, LoginDto, CreateBookingDto, etc.)
- Response types (AuthResponse, PaginatedResponse, etc.)
- Inferred TypeScript types exported alongside schemas
- Package build configuration

### Out Of Scope
- API client code (chunk 09)
- React Query types (chunk 09)
- Prisma schema itself (chunk 03)
- Component-level types (stay in components)

## Package Structure

```
packages/schemas/
├── src/
│   ├── index.ts              # re-exports everything
│   ├── enums.ts              # all Zod enums
│   ├── models.ts             # domain model schemas
│   ├── dto.ts                # request/response DTOs
│   └── common.ts             # shared utilities (pagination, etc.)
├── package.json
└── tsconfig.json
```

## Enums to Define

Extract from the current Prisma schema (`prisma/schema.prisma`):

```typescript
// enums.ts
export const UserRole = z.enum(['CLIENT', 'PROVIDER', 'ADMIN'])
export const ClientTrustLevel = z.enum(['NEW_CLIENT', 'REGULAR', 'GOOD_CLIENT', 'VIP_CLIENT'])
export const TrustLevel = z.enum(['NEWCOMER', 'ESTABLISHED', 'TRUSTED', 'EXPERT', 'TOP_RATED'])
export const VerificationStatus = z.enum(['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'])
export const BadgeType = z.enum(['PUNCTUAL', 'QUALITY_WORK', 'FAST_RESPONSE', 'GREAT_COMMUNICATOR', 'ID_VERIFIED', 'CERTIFIED', 'INSURED', 'SUPER_PRO', 'CLIENT_FAVORITE', 'REPEAT_CLIENTS', 'TOP_EARNER'])
export const BookingStatus = z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const PaymentRating = z.enum(['PREPAID', 'ONTIME', 'LATE', 'PARTIAL', 'DISPUTED'])
export const MessageType = z.enum(['TEXT', 'IMAGE', 'FILE', 'LOCATION', 'BOOKING_REQUEST', 'QUOTE'])
export const NotificationType = z.enum(['BOOKING_NEW', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'BOOKING_STARTED', 'NEW_MESSAGE', 'NEW_REVIEW', 'NEW_CLIENT_REVIEW', 'PAYMENT_RECEIVED', 'CERTIFICATION_VERIFIED', 'BADGE_EARNED', 'SYSTEM'])
export const VisibilityLevel = z.enum(['PUBLIC', 'REGISTERED', 'CLIENTS_ONLY', 'PRIVATE'])
export const DocType = z.enum(['DIPLOMA', 'CERTIFICATE', 'LICENSE', 'INSURANCE', 'ID_DOCUMENT', 'WORK_PERMIT', 'OTHER'])
export const CertificationStatus = z.enum(['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'])
export const PortfolioImageType = z.enum(['BEFORE', 'DURING', 'AFTER', 'GENERAL', 'DETAIL', 'PLAN'])
export const SubscriptionPlan = z.enum(['BASIC', 'STANDARD', 'PREMIUM'])
```

Each enum also exports its inferred TypeScript type:
```typescript
export type UserRole = z.infer<typeof UserRole>
```

## Domain Model Schemas

Define Zod schemas for the main models. These represent API response shapes (not database rows):

- `UserSchema` — id, authUserId, email, phone, firstName, lastName, avatar, role, city, country, isVerified, isActive, clientTrustLevel (note: no password field — auth is handled by Supabase)
- `UserSummarySchema` — id, firstName, lastName, avatar (for nested references)
- `ProviderSchema` — id, userId, profession, description, experience, hourlyRate, rating, totalReviews, totalJobs, isPremium, isAvailable, verificationStatus, user (UserSummary)
- `ProviderDetailSchema` — extends Provider with categories, skills, serviceZones, trustScore, badges, certifications, portfolio
- `CategorySchema` — id, name, slug, description, icon, image, color, isActive, providerCount
- `SubcategorySchema` — id, categoryId, name, slug, description, icon, isActive
- `TradeSchema` — id, subcategoryId, name, slug, description, basePrice, duration, isActive
- `CategoryHierarchySchema` — category with subcategories, each with trades
- `BookingSchema` — id, clientId, providerId, title, description, status, address, city, scheduledDate, duration, price, with client/provider summaries
- `ReviewSchema` — id, bookingId, clientId, providerId, rating, punctuality, quality, communication, value, professionalism, overallScore, comment, reply, isPublic, createdAt, client (UserSummary)
- `ClientReviewSchema` — id, bookingId, clientId, providerId, rating, paymentRating, comment, tags
- `ConversationSchema` — id, user1, user2, lastMessage, lastMessageAt, unreadCount
- `MessageSchema` — id, conversationId, senderId, type, content, fileUrl, isRead, createdAt
- `NotificationSchema` — id, userId, type, title, message, data, isRead, createdAt
- `FavoriteSchema` — id, userId, providerId, provider (ProviderSchema)
- `TrustScoreSchema` — overallScore, reliability, quality, communication, professionalism, trustLevel, badges
- `CertificationSchema` — id, title, issuingOrg, status, issueDate, expiryDate, isLifetime, documents
- `PortfolioProjectSchema` — id, title, description, images, duration, price, viewCount, isFeatured
- `SkillSchema` — id, name, level
- `ServiceZoneSchema` — id, city, commune
- `VisibilitySettingsSchema` — all visibility fields
- `AvailabilityScheduleSchema` — dayOfWeek, startTime, endTime, isAvailable
- `SubscriptionSchema` — plan, startDate, endDate, isActive

## Request DTOs

- `CompleteProfileDto` — firstName, lastName, role, city, country, phone (used after Supabase signup to set profile data)
- `ProviderOnboardingDto` — profession, categoryIds, skills, serviceZones, tradeIds, primaryTradeId, experience, hourlyRate, description (used to set up provider profile after registration)
- `CreateBookingDto` — providerId, title, description, address, city, scheduledDate, duration, price, clientNotes
- `UpdateBookingDto` — status, cancelReason, providerNotes
- `CreateReviewDto` — bookingId, providerId, rating, punctuality, quality, communication, value, comment, isPublic
- `CreateMessageDto` — recipientId, content, type, fileUrl
- `UpdateVisibilityDto` — all visibility setting fields (all optional)
- `UpdateUserDto` — firstName, lastName, phone, city (admin user updates: isActive, isVerified, role)
- `AdminUpdateProviderDto` — verificationStatus, isPremium, isAvailable
- `CreateCategoryDto` — name, slug, description, icon, color
- `UpdateCategoryDto` — name, slug, description, icon, color, isActive
- `ProviderSearchParams` — q, category, subcategory, city, minRating, minPrice, maxPrice, available, verified, page, limit
- `PaginationParams` — page, limit, sortBy, sortOrder

## Response Types

- `MeResponse` — success, user (UserSchema with provider if applicable)
- `PaginatedResponse<T>` — data (T[]), pagination: { page, limit, total, totalPages }
- `ApiSuccessResponse<T>` — success: true, data: T, message?
- `ApiErrorResponse` — success: false, error: string, message: string
- `ProviderStatsResponse` — totalBookings, completedBookings, pendingBookings, totalEarnings, rating, totalReviews
- `AdminStatsResponse` — totalUsers, totalProviders, totalBookings, totalReviews, etc.
- `DashboardProviderResponse` — stats, recentBookings, upcomingBookings, recentReviews, notifications
- `DashboardClientResponse` — stats, recentBookings, favoriteProviders, notifications
- `DistanceResponse` — distance, formatted, status

## Common Utilities

```typescript
// common.ts
export const PaginationParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
```

## Dependencies

- **Depends on:** Chunk 01 (monorepo scaffold must exist)
- **Required by:** Chunks 03-13 (everything imports from this package)

## Acceptance Criteria

1. `@kayu/schemas` package builds without errors
2. All enums from the Prisma schema are represented as Zod enums
3. All API request shapes have corresponding Zod DTOs
4. All API response shapes have corresponding Zod schemas
5. TypeScript types are inferred and exported (no manual `interface` definitions)
6. `turbo run type-check` passes
7. Backend, web, and mobile can all add `@kayu/schemas` as a `workspace:*` dependency

## Suggested Implementation Steps

1. Set up `packages/schemas/package.json` with `zod` dependency and proper exports
2. Create `src/enums.ts` with all enums from the Prisma schema
3. Create `src/common.ts` with pagination and shared utility schemas
4. Create `src/models.ts` with all domain model schemas (reference the Prisma schema for field names and types)
5. Create `src/dto.ts` with all request/response DTOs (reference the existing API routes for shapes)
6. Create `src/index.ts` re-exporting everything
7. Verify `turbo run type-check` passes
8. Add `@kayu/schemas` as a dependency in `apps/backend/package.json`, `apps/web/package.json`, `apps/mobile/package.json`

## QA / Validation Checklist

- [ ] Every Prisma enum has a Zod equivalent in `enums.ts`
- [ ] Every API route's request body has a DTO in `dto.ts`
- [ ] Every API route's response shape has a schema in `models.ts`
- [ ] All exports are accessible via `import { X } from '@kayu/schemas'`
- [ ] No `class-validator` or `class-transformer` imports anywhere
- [ ] `turbo run type-check` passes
- [ ] Package can be imported by backend, web, and mobile without resolution errors
