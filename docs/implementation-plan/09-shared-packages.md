# 09 — Shared Packages: API Client, UI Tokens & Utilities

## Goal

Create the three remaining shared packages — `@kayu/api` (HTTP client, typed endpoint functions, React Query keys), `@kayu/ui` (design tokens), and `@kayu/utils` (phone, currency, distance, date helpers) — that bridge the backend and frontend apps.

## Why It Matters

The web and mobile apps both consume the same backend API. Without a shared API client, each app would duplicate HTTP calls, error handling, and type definitions. The design tokens ensure visual consistency between web and mobile. Shared utilities prevent duplicating formatting logic (currency, phone numbers, distances).

## Scope

### In Scope
- `@kayu/api` package:
  - `ApiClient` class (fetch-based HTTP client)
  - `ApiError` class for error handling
  - Typed endpoint functions for every backend route
  - React Query key factory
- `@kayu/ui` package:
  - Color palette (KAYOU brand colors)
  - Typography scale (font sizes, weights, family)
  - Spacing scale
  - Border radius scale
  - Shadow definitions
  - Brand constants (APP_NAME, APP_TAGLINE)
- `@kayu/utils` package:
  - Phone number normalization (DRC +243, Congo +242)
  - Currency formatting (CDF — Congolese Franc)
  - Distance calculation (Haversine) and formatting
  - Date/time formatting helpers
  - General utilities (cn for class merging, truncateId, getInitials)

### Out Of Scope
- React components (those stay in apps)
- Shared React hooks (app-specific)
- Backend-only utilities
- i18n / translations

## Package: @kayu/api

### Structure

```
packages/api/
├── src/
│   ├── index.ts           # re-exports
│   ├── client.ts          # ApiClient class
│   ├── error.ts           # ApiError class
│   ├── endpoints.ts       # all endpoint functions grouped by domain
│   └── query-keys.ts      # React Query key factory
├── package.json
└── tsconfig.json
```

### ApiClient

```typescript
class ApiClient {
  private baseUrl: string
  private accessToken: string | null  // Supabase JWT

  constructor(baseUrl: string)
  setAccessToken(token: string | null): void
  getAccessToken(): string | null

  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string, body?: unknown): Promise<T>
}
```

- Uses native `fetch` (works in browser, Node, and React Native)
- Sends `Authorization: Bearer <supabase-jwt>` header on every request
- The Supabase JWT is obtained from the Supabase client session on the frontend
- Parses JSON responses, throws `ApiError` on non-2xx

### Endpoint Functions

Factory functions that accept an `ApiClient` and return typed methods:

```typescript
// Identity (auth is handled by Supabase SDK on frontend, not via API)
export const identityApi = (client: ApiClient) => ({
  me: () => client.get<MeResponseType>('/me'),
  completeProfile: (data: CompleteProfileDtoType) => client.patch<MeResponseType>('/me/profile', data),
  setRole: (data: { role: string }) => client.patch<MeResponseType>('/me/role', data),
  providerOnboarding: (data: ProviderOnboardingDtoType) => client.post<...>('/me/provider-onboarding', data),
})

// Categories
export const categoriesApi = (client: ApiClient) => ({
  getAll: (params?) => client.get<...>('/categories', params),
  getHierarchy: () => client.get<...>('/categories/hierarchy'),
})

// Providers
export const providersApi = (client: ApiClient) => ({
  search: (params: ProviderSearchParamsType) => client.get<...>('/providers', params),
  getById: (id: string) => client.get<...>(`/providers/${id}`),
})

// Bookings
export const bookingsApi = (client: ApiClient) => ({
  getAll: (params?) => client.get<...>('/bookings', params),
  create: (data: CreateBookingDtoType) => client.post<...>('/bookings', data),
  getById: (id: string) => client.get<...>(`/bookings/${id}`),
  update: (id: string, data: UpdateBookingDtoType) => client.patch<...>(`/bookings/${id}`, data),
  cancel: (id: string) => client.delete<...>(`/bookings/${id}`),
})

// Reviews
export const reviewsApi = (client: ApiClient) => ({
  getByProvider: (providerId: string, params?) => client.get<...>('/reviews', { providerId, ...params }),
  create: (data: CreateReviewDtoType) => client.post<...>('/reviews', data),
})

// Messages
export const messagesApi = (client: ApiClient) => ({
  send: (data: CreateMessageDtoType) => client.post<...>('/messages', data),
  getConversations: (params?) => client.get<...>('/messages', params),
  getMessages: (conversationId: string, params?) => client.get<...>('/messages', { conversationId, ...params }),
})

// Notifications
export const notificationsApi = (client: ApiClient) => ({
  getAll: (params?) => client.get<...>('/notifications', params),
  markRead: (id: string) => client.patch<...>(`/notifications/${id}/read`),
  markAllRead: () => client.patch<...>('/notifications/read-all'),
})

// Favorites
export const favoritesApi = (client: ApiClient) => ({
  getAll: () => client.get<...>('/favorites'),
  check: (providerId: string) => client.get<...>('/favorites', { providerId }),
  add: (providerId: string) => client.post<...>('/favorites', { providerId }),
  remove: (providerId: string) => client.delete<...>('/favorites', { providerId }),
})

// Settings
export const settingsApi = (client: ApiClient) => ({
  getVisibility: () => client.get<...>('/settings/visibility'),
  updateVisibility: (data) => client.put<...>('/settings/visibility', data),
})

// Dashboard
export const dashboardApi = (client: ApiClient) => ({
  getProviderDashboard: () => client.get<...>('/dashboard/provider'),
  getClientDashboard: () => client.get<...>('/dashboard/client'),
})

// Stats
export const statsApi = (client: ApiClient) => ({
  getGlobal: () => client.get<...>('/stats'),
})

// Geo
export const geoApi = (client: ApiClient) => ({
  geocode: (params) => client.get<...>('/geocode', params),
  distance: (params) => client.get<...>('/distance', params),
})

// Admin
export const adminApi = (client: ApiClient) => ({
  getUsers: (params?) => client.get<...>('/admin/users', params),
  updateUser: (data) => client.put<...>('/admin/users', data),
  getProviders: (params?) => client.get<...>('/admin/providers', params),
  updateProvider: (data) => client.put<...>('/admin/providers', data),
  getCategories: () => client.get<...>('/admin/categories'),
  createCategory: (data) => client.post<...>('/admin/categories', data),
  updateCategory: (data) => client.put<...>('/admin/categories', data),
  deleteCategory: (id: string) => client.delete<...>(`/admin/categories/${id}`),
  getReviews: (params?) => client.get<...>('/admin/reviews', params),
  updateReview: (data) => client.put<...>('/admin/reviews', data),
  deleteReview: (id: string) => client.delete<...>(`/admin/reviews/${id}`),
})
```

### React Query Keys

```typescript
export const queryKeys = {
  identity: {
    me: ['identity', 'me'] as const,
  },
  categories: {
    all: ['categories'] as const,
    hierarchy: ['categories', 'hierarchy'] as const,
  },
  providers: {
    search: (params: ProviderSearchParamsType) => ['providers', 'search', params] as const,
    detail: (id: string) => ['providers', 'detail', id] as const,
  },
  bookings: {
    all: (params?) => ['bookings', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  reviews: {
    byProvider: (providerId: string) => ['reviews', 'provider', providerId] as const,
  },
  messages: {
    conversations: ['messages', 'conversations'] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    check: (providerId: string) => ['favorites', 'check', providerId] as const,
  },
  dashboard: {
    provider: ['dashboard', 'provider'] as const,
    client: ['dashboard', 'client'] as const,
  },
  stats: {
    global: ['stats'] as const,
  },
}
```

## Package: @kayu/ui

### Structure

```
packages/ui/
├── src/
│   ├── index.ts
│   └── tokens.ts
├── package.json
└── tsconfig.json
```

### Design Tokens

```typescript
export const colors = {
  primary: {
    DEFAULT: '#1E3A8A',  // Royal Blue (KAYOU brand)
    light: '#3B82F6',
    dark: '#1E40AF',
    50: '#EFF6FF',
    100: '#DBEAFE',
    // ... full scale
  },
  neutral: { 50-900 grayscale },
  success: { DEFAULT, light, dark },
  warning: { DEFAULT, light, dark },
  error: { DEFAULT, light, dark },
  info: { DEFAULT, light, dark },
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }

export const borderRadius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 }

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
}

export const shadows = { sm, md, lg }

export const brand = {
  APP_NAME: 'KAYOU',
  APP_TAGLINE: 'Trouvez le prestataire idéal',
}
```

## Package: @kayu/utils

### Structure

```
packages/utils/
├── src/
│   ├── index.ts
│   ├── phone.ts         # phone normalization
│   ├── currency.ts      # CDF formatting
│   ├── distance.ts      # Haversine + formatting
│   ├── date.ts          # date/time formatting
│   └── helpers.ts       # cn, truncateId, getInitials
├── package.json
└── tsconfig.json
```

### Phone Normalization

```typescript
// DRC: +243 9XX XXX XXX
export function normalizeDRCPhone(input: string): string
// Congo-Brazzaville: +242 06X XXX XXX
export function normalizeCongoPhone(input: string): string
// Validate phone format
export function isValidPhone(phone: string, country: 'RDC' | 'Congo'): boolean
// Format for display
export function formatPhone(phone: string): string
```

### Currency

```typescript
// Format as CDF
export function formatCDF(amount: number): string  // "25 000 FC"
// Format as number with spaces
export function formatNumber(amount: number): string
```

### Distance

```typescript
// Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number
// Format distance
export function formatDistance(km: number): string  // "2.5 km" or "500 m"
// Distance category
export function getDistanceStatus(km: number): 'close' | 'medium' | 'far'
// Distance color for UI
export function getDistanceColor(status: string): string
```

### Date

```typescript
export function formatDate(isoDate: string): string          // "11 Avr 2026"
export function formatDateTime(isoDate: string): string       // "11 Avr 2026 à 14:30"
export function formatRelativeTime(isoDate: string): string   // "Il y a 5 min"
```

### Helpers

```typescript
export function cn(...inputs: ClassValue[]): string  // clsx + twMerge
export function truncateId(id: string, length?: number): string
export function getInitials(name: string): string  // "Jean Dupont" → "JD"
```

## Dependencies

- **@kayu/api** depends on: `@kayu/schemas` (types for endpoints)
- **@kayu/utils** depends on: `clsx`, `tailwind-merge` (for cn helper)
- **@kayu/ui** has no internal dependencies
- **Chunk depends on:** Chunks 02 (schemas must be defined), 04-08 (all backend endpoints must exist to type the API client)
- **Required by:** Chunk 10 (web), Chunk 11-12 (mobile)

## Acceptance Criteria

1. `@kayu/api` — ApiClient can make GET/POST/PUT/PATCH/DELETE requests
2. All backend endpoints have typed wrapper functions
3. React Query keys cover all data-fetching scenarios
4. `@kayu/ui` — tokens export correctly and can be used in Tailwind config
5. `@kayu/utils` — phone normalization handles DRC and Congo formats
6. Currency formatting outputs CDF amounts correctly
7. Distance calculation matches the existing implementation
8. All three packages pass type-check
9. Web and mobile can import from all packages

## Suggested Implementation Steps

1. Create `@kayu/api`: client.ts → error.ts → endpoints.ts → query-keys.ts → index.ts
2. Create `@kayu/ui`: tokens.ts → index.ts
3. Create `@kayu/utils`: phone.ts → currency.ts → distance.ts → date.ts → helpers.ts → index.ts
4. Add `workspace:*` dependencies in `apps/web` and `apps/mobile`
5. Verify all packages pass type-check
6. Test ApiClient against running backend (manual)

## QA / Validation Checklist

- [ ] `ApiClient.get()` returns typed response
- [ ] `ApiClient` sends `Authorization: Bearer <supabase-jwt>` header
- [ ] `ApiClient.setAccessToken()` updates the token used in requests
- [ ] `ApiError` has status, message, and error properties
- [ ] Every backend endpoint has a corresponding typed function
- [ ] `queryKeys` covers auth, categories, providers, bookings, reviews, messages, notifications, favorites, dashboard, stats
- [ ] `colors.primary.DEFAULT` is `#1E3A8A`
- [ ] `formatCDF(25000)` returns `"25 000 FC"`
- [ ] `normalizeDRCPhone('0998765432')` returns `'+243998765432'`
- [ ] `calculateDistance()` returns correct km
- [ ] `formatRelativeTime()` returns French relative time
- [ ] `turbo run type-check` passes for all three packages
