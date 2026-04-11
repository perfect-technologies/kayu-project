# 05 — Backend: Categories & Provider Discovery

## Goal

Migrate the categories hierarchy (categories, subcategories, trades) and provider discovery (search, filtering, profiles) from Next.js API routes to NestJS modules.

## Why It Matters

Categories and providers are the core of the marketplace. Users browse categories to find providers, and providers are listed based on category, location, availability, and rating. This is the most-visited functionality and must support both the web app (with SSR) and the mobile app.

## Scope

### In Scope
- `CategoriesModule` with controller and service
- `ProvidersModule` with controller and service
- Endpoints:
  - `GET /api/categories` — list categories with optional subcategories and provider counts
  - `GET /api/categories/hierarchy` — full hierarchy (categories → subcategories → trades)
  - `GET /api/providers` — search/filter providers with pagination
  - `GET /api/providers/:id` — provider detail with full profile data
- Category filtering with provider counts
- Provider search: text search, category/subcategory filter, city, rating range, price range, availability, verification status
- Provider ordering: premium first, then by rating, then by review count
- Visibility settings integration (respect `appearInSearch`, `appearInCategory`)
- Provider self-update endpoint (`PATCH /api/providers/me`) for editing own profile

### Out Of Scope
- Category CRUD (admin — chunk 08)
- Provider admin management: verify/reject, toggle premium (admin — chunk 08)
- Booking creation (chunk 06)

## API Endpoints

### `GET /api/categories`

**Query params:**
- `withSubcategories` — boolean, include subcategories in response
- `categoryId` — filter by specific category ID
- `categorySlug` — filter by category slug

**Response:**
```
{
  success: true,
  categories: CategorySchema[] (with providerCount)
}
```

**Logic:**
1. Fetch categories (active only)
2. If `withSubcategories`, include subcategories
3. Count providers per category via `providerCategory` relation
4. Order by `order` field

### `GET /api/categories/hierarchy`

**Response:**
```
{
  success: true,
  categories: CategoryHierarchySchema[]
  // Each category includes subcategories, each subcategory includes trades
}
```

**Logic:**
1. Fetch all active categories with subcategories and trades
2. Include `basePrice` and `duration` for each trade
3. Order everything by `order` field

### `GET /api/providers`

**Query params** (validated with `ProviderSearchParams` from `@kayu/schemas`):
- `q` — text search (matches provider profession, description, user firstName/lastName)
- `category` — category slug filter
- `subcategory` — subcategory slug filter
- `city` — city filter
- `minRating` — minimum rating filter
- `minPrice` / `maxPrice` — hourly rate range
- `available` — boolean, only available providers
- `verified` — boolean, only verified providers
- `page` / `limit` — pagination (default page=1, limit=10)

**Response:**
```
{
  success: true,
  providers: ProviderSchema[],
  pagination: { page, limit, total, totalPages }
}
```

**Logic:**
1. Build Prisma where clause from query params
2. Filter by visibility settings (`appearInSearch` = true, `appearInCategory` if category filter active)
3. Include: user (firstName, lastName, avatar, city), categories, serviceZones
4. Order: `isPremium` DESC, `rating` DESC, `totalReviews` DESC
5. Apply pagination

### `PATCH /api/providers/me`

**Auth required (PROVIDER)** — Guards: `SupabaseGuard`, `ActorGuard`, `RolesGuard` with `@Roles(PROVIDER)`

**Request body** (validated with `UpdateProviderDto` from `@kayu/schemas`):
```
{
  profession?: string
  description?: string
  experience?: number
  hourlyRate?: number
  isAvailable?: boolean
  categoryIds?: string[]        // replaces existing categories
  skills?: { name: string, level?: number }[]
  serviceZones?: { city: string, commune: string }[]
  tradeIds?: string[]           // max 3
  primaryTradeId?: string
}
```

**Response:** `{ success: true, provider: ProviderDetailSchema }`

**Logic:**
1. Find provider belonging to current user
2. Update provider fields
3. If `categoryIds` provided: delete existing ProviderCategory records, create new ones
4. If `skills` provided: delete existing Skills, create new ones
5. If `serviceZones` provided: delete existing ServiceZones, create new ones
6. If `tradeIds` provided: validate max 3, delete existing ProviderTrades, create new ones
7. Run in a transaction
8. Return updated provider

Note: This endpoint is **new** — the original monolith had no provider self-update. Only admin could modify providers.

### `GET /api/providers/:id`

**Response:**
```
{
  success: true,
  provider: ProviderDetailSchema
  // Includes: user, categories, skills, serviceZones, trustScore, badges,
  //           certifications, portfolioProjects, recentReviews (5),
  //           stats: { totalReviews, totalBookings, ratingBreakdown, ratingAverages }
}
```

**Logic:**
1. Fetch provider with all relations
2. Calculate rating breakdown (count per star) from reviews
3. Calculate rating averages per category (punctuality, quality, communication, value, professionalism)
4. Fetch 5 most recent reviews with client info
5. Count total bookings
6. Check visibility settings and return appropriate data

## Module Structure

```
apps/backend/src/modules/
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   └── categories.service.ts
└── providers/
    ├── providers.module.ts
    ├── providers.controller.ts
    └── providers.service.ts
```

## Data Relationships

The category system is hierarchical:
```
Category → Subcategory → Trade
              ↓
         ProviderCategory (many-to-many: Provider ↔ Category)
         ProviderTrade (many-to-many: Provider ↔ Trade, max 3, one isPrimary)
```

Provider search must join through these relationships when filtering by category or subcategory.

## Visibility Integration

When listing providers:
- Exclude providers where `visibilitySettings.appearInSearch` is false
- When filtering by category, also check `visibilitySettings.appearInCategory`
- Use `OR` conditions: include providers with no visibility settings (defaults to visible)

When viewing a provider profile:
- Respect all visibility settings (showEmail, showPhone, showHourlyRate, etc.)
- Access level check: PUBLIC, REGISTERED, CLIENTS_ONLY, PRIVATE
- Return `hasAccess` and `accessDeniedReason` alongside provider data

## Dependencies

- **Depends on:** Chunk 02 (schemas), Chunk 03 (Prisma, common module), Chunk 04 (auth guard for protected provider detail features)
- **Required by:** Chunk 06 (bookings reference providers), Chunk 10 (web app provider pages), Chunk 12 (mobile provider browsing)

## Acceptance Criteria

1. `GET /api/categories` returns all active categories with provider counts
2. `GET /api/categories/hierarchy` returns full tree (categories → subcategories → trades)
3. `GET /api/providers` returns paginated providers
4. Provider search filters work: text search, category, city, rating, price, availability, verification
5. Provider listing respects visibility settings
6. `GET /api/providers/:id` returns full provider profile with stats
7. Premium providers appear first in listings
8. `PATCH /api/providers/me` allows provider to update their own profile
9. All responses match schemas from `@kayu/schemas`

## Suggested Implementation Steps

1. Create `modules/categories/categories.service.ts` with `findAll`, `findHierarchy`, `findBySlug` methods
2. Create `modules/categories/categories.controller.ts` with GET endpoints
3. Create `modules/providers/providers.service.ts` with `search`, `findById`, `calculateStats` methods
4. Create `modules/providers/providers.controller.ts` with GET endpoints
5. Wire up modules in `app.module.ts`
6. Test category listing and hierarchy with seeded data
7. Test provider search with various filter combinations
8. Test provider detail with visibility settings

## QA / Validation Checklist

- [ ] `GET /api/categories` returns categories with correct provider counts
- [ ] `GET /api/categories?withSubcategories=true` includes subcategories
- [ ] `GET /api/categories/hierarchy` returns full tree with trades
- [ ] `GET /api/providers` returns paginated results
- [ ] `GET /api/providers?q=plombier` filters by text search
- [ ] `GET /api/providers?category=plomberie` filters by category
- [ ] `GET /api/providers?city=Kinshasa` filters by city
- [ ] `GET /api/providers?available=true` filters available providers
- [ ] `GET /api/providers?minRating=4` filters by rating
- [ ] Provider with `appearInSearch=false` is excluded from listings
- [ ] `GET /api/providers/:id` returns full profile with stats
- [ ] Provider with `profileVisible=PRIVATE` shows access denied to non-owner
- [ ] `PATCH /api/providers/me` updates description, hourly rate, etc.
- [ ] `PATCH /api/providers/me` replaces categories when categoryIds provided
- [ ] `PATCH /api/providers/me` rejects > 3 trades
- [ ] `PATCH /api/providers/me` returns 403 for non-provider users
