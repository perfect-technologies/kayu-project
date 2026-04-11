# 08 — Backend: Admin & Platform Settings

## Goal

Migrate admin management endpoints (users, providers, categories, reviews), visibility settings, platform statistics, dashboard aggregation, geocode, and distance calculation from Next.js API routes to NestJS modules.

## Why It Matters

The admin dashboard is how the platform is managed — verifying providers, moderating reviews, managing categories, and monitoring statistics. Visibility settings give users control over their privacy. Utility endpoints (geocode, distance, stats) support the marketplace experience. Dashboard endpoints aggregate data for the provider and client dashboards.

## Scope

### In Scope
- `AdminModule` with controller and service
- `SettingsModule` with controller and service (visibility settings)
- `StatsModule` with controller and service
- `DashboardModule` with controller and service
- `GeoModule` with controller and service (geocode + distance)
- Endpoints:
  - `GET /api/admin/users` — list/search users with stats
  - `PUT /api/admin/users` — update user status (active, verified, role)
  - `GET /api/admin/providers` — list/search providers with verification status
  - `PUT /api/admin/providers` — update provider (verify, reject, toggle premium)
  - `GET /api/admin/categories` — list categories with stats
  - `POST /api/admin/categories` — create category
  - `PUT /api/admin/categories` — update category
  - `DELETE /api/admin/categories` — delete category
  - `GET /api/admin/reviews` — list reviews for moderation
  - `PUT /api/admin/reviews` — moderate review (hide/show, add reply)
  - `DELETE /api/admin/reviews` — delete review
  - `GET /api/settings/visibility` — get visibility settings
  - `PUT /api/settings/visibility` — update visibility settings
  - `GET /api/stats` — global platform statistics
  - `GET /api/dashboard/provider` — provider dashboard data
  - `GET /api/dashboard/client` — client dashboard data
  - `GET /api/geocode` — city/commune to coordinates
  - `GET /api/distance` — Haversine distance between two points

### Out Of Scope
- Admin authentication (admin is just a user role, auth is handled in chunk 04)
- Admin activity logging (the ActivityLog model exists but is not critical for MVP)
- Platform settings storage (maintenance mode, commission — currently static in the admin UI)

## Admin Endpoints

### Users Management

**`GET /api/admin/users`** — Auth: ADMIN only
- Query: `page`, `limit`, `role`, `status` (active/inactive/verified/unverified), `search`, `sortBy`, `sortOrder`
- Returns: users with stats (totalUsers, totalClients, totalProviders, totalAdmins, activeUsers, verifiedUsers, newUsersThisWeek, newUsersThisMonth)

**`PUT /api/admin/users`** — Auth: ADMIN only
- Body: `{ userId, isActive?, isVerified?, role? }`
- Prevents admin self-deactivation
- Creates activity log entry

### Providers Management

**`GET /api/admin/providers`** — Auth: ADMIN only
- Query: `page`, `limit`, `status` (premium/available/unavailable), `search`
- Returns: providers with verification status, trust scores, certification counts
- Stats: totalProviders, verifiedProviders, premiumProviders, pendingVerifications

**`PUT /api/admin/providers`** — Auth: ADMIN only
- Body: `{ providerId, verificationStatus?, isPremium?, isAvailable? }`
- Creates notification for provider on status change

### Categories Management

**`GET /api/admin/categories`** — Auth: ADMIN only
- Returns: all categories with subcategory counts, provider counts
- Stats: totalCategories, totalSubcategories, activeCategories

**`POST /api/admin/categories`** — Auth: ADMIN only
- Body: `{ name, slug, description?, icon?, color?, subcategories?: [...] }`
- Creates category with optional subcategories

**`PUT /api/admin/categories`** — Auth: ADMIN only
- Body: `{ categoryId, name?, slug?, description?, icon?, color?, isActive? }`

**`DELETE /api/admin/categories`** — Auth: ADMIN only
- Validates no providers are associated before deletion

### Reviews Moderation

**`GET /api/admin/reviews`** — Auth: ADMIN only
- Query: `page`, `limit`, `visibility` (public/hidden), `search`
- Returns: reviews with detailed ratings, client and provider info
- Stats: totalReviews, publicReviews, hiddenReviews, avgOverallScore, ratingDistribution

**`PUT /api/admin/reviews`** — Auth: ADMIN only
- Body: `{ reviewId, isPublic?, reply? }`

**`DELETE /api/admin/reviews`** — Auth: ADMIN only
- Deletes review, creates notification for review author

## Settings Endpoints

### `GET /api/settings/visibility`

**Auth required**

Returns current user's visibility settings. Creates default settings if none exist.

### `PUT /api/settings/visibility`

**Auth required**

**Body** (validated with `UpdateVisibilityDto`):
```
{
  profileVisible?: 'PUBLIC' | 'REGISTERED' | 'CLIENTS_ONLY' | 'PRIVATE'
  showEmail?: boolean
  showPhone?: boolean
  showExactLocation?: boolean
  showHourlyRate?: boolean
  showPastWork?: boolean
  showReviews?: boolean
  showAvailability?: boolean
  showCertifications?: boolean
  showClientHistory?: boolean
  showClientReviews?: boolean
  allowDirectContact?: boolean
  allowMessages?: boolean
  appearInSearch?: boolean
  appearInCategory?: boolean
}
```

## Stats & Dashboard Endpoints

### `GET /api/stats`

**Public (no auth)**

Returns global platform statistics:
```
{
  totalProviders, totalClients, totalCategories, totalBookings, totalReviews,
  verifiedProviders, premiumProviders, averageRating,
  providersByCity: [{ city, count }], // top 5
  topCategories: [{ name, count }]    // top 5
}
```

### `GET /api/dashboard/provider`

**Auth required (PROVIDER)**

Returns:
```
{
  stats: { totalBookings, completedBookings, pendingBookings, totalEarnings, rating, totalReviews, totalJobs },
  provider: { id, profession, verificationStatus, ... },
  recentBookings: BookingSchema[] (5),
  upcomingBookings: BookingSchema[] (3),
  recentReviews: ReviewSchema[] (3),
  notifications: NotificationSchema[] (5)
}
```

### `GET /api/dashboard/client`

**Auth required (CLIENT)**

Returns:
```
{
  stats: { totalBookings, completedBookings, pendingBookings, favoritesCount, reviewsCount },
  recentBookings: BookingSchema[] (5),
  favoriteProviders: ProviderSchema[] (4),
  notifications: NotificationSchema[] (5)
}
```

## Geo Endpoints

### `GET /api/geocode`

**Public**

**Query:** `city`, `commune?`, `country?`

Returns coordinates from a local database of DRC and Congo-Brazzaville cities:
- Kinshasa communes with precise centroids
- Brazzaville communes with precise centroids
- Major cities (Lubumbashi, Matadi, Pointe-Noire, etc.)
- Fallback to Nominatim (OpenStreetMap) API for unknown locations

### `GET /api/distance`

**Public**

**Query:** `lat`, `lng`, `providerLat`, `providerLng`

Returns Haversine distance:
```
{
  distance: number (km),
  formatted: string ("2.5 km"),
  status: 'close' | 'medium' | 'far'
}
```

## Module Structure

```
apps/backend/src/modules/
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
├── settings/
│   ├── settings.module.ts
│   ├── settings.controller.ts
│   └── settings.service.ts
├── stats/
│   ├── stats.module.ts
│   ├── stats.controller.ts
│   └── stats.service.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
└── geo/
    ├── geo.module.ts
    ├── geo.controller.ts
    └── geo.service.ts
```

## Dependencies

- **Depends on:** Chunk 02 (schemas), Chunk 03 (Prisma, guards), Chunk 04 (auth + roles)
- **Partially depends on:** Chunks 05-07 (admin manages entities created by those chunks)
- **Required by:** Chunk 09 (API client needs these endpoints), Chunk 10 (web admin/settings/dashboard)

## Acceptance Criteria

1. Admin user can list, search, and update users
2. Admin can verify/reject providers and toggle premium status
3. Admin can CRUD categories
4. Admin can moderate reviews (hide/delete)
5. Non-admin users get 403 on admin endpoints
6. Visibility settings can be read and updated
7. Default visibility settings created for new users
8. Global stats endpoint returns correct counts
9. Provider and client dashboard endpoints return aggregated data
10. Geocode returns coordinates for known DRC/Congo cities
11. Distance calculation returns correct Haversine distance

## Suggested Implementation Steps

1. Create `modules/settings/settings.service.ts` and controller (simple, good starting point)
2. Create `modules/geo/geo.service.ts` with coordinate database and Haversine formula
3. Create `modules/stats/stats.service.ts` with aggregate queries
4. Create `modules/dashboard/dashboard.service.ts` combining data from multiple tables
5. Create `modules/admin/admin.service.ts` with user/provider/category/review management
6. Create `modules/admin/admin.controller.ts` with all admin endpoints, all guarded by ADMIN role
7. Wire up all modules
8. Test admin endpoints with admin credentials
9. Test settings and dashboard endpoints with client and provider credentials

## QA / Validation Checklist

- [ ] `GET /api/admin/users` returns user list (ADMIN only)
- [ ] `PUT /api/admin/users` updates user status
- [ ] `PUT /api/admin/providers` verifies a provider
- [ ] `POST /api/admin/categories` creates a category
- [ ] `DELETE /api/admin/categories` rejects if providers exist
- [ ] `PUT /api/admin/reviews` hides a review
- [ ] Non-admin user gets 403 on all admin endpoints
- [ ] `GET /api/settings/visibility` returns settings (creates defaults)
- [ ] `PUT /api/settings/visibility` updates settings
- [ ] `GET /api/stats` returns platform statistics
- [ ] `GET /api/dashboard/provider` returns provider dashboard (PROVIDER only)
- [ ] `GET /api/dashboard/client` returns client dashboard (CLIENT only)
- [ ] `GET /api/geocode?city=Kinshasa` returns coordinates
- [ ] `GET /api/distance` returns correct distance
