# 10 — Web App: Next.js Migration

## Goal

Migrate the existing KAYOU Next.js monolith into `apps/web` as a frontend-only application. Remove all API routes. Connect all data fetching to the NestJS backend via `@kayu/api`. Preserve SSR for public pages. Achieve full feature parity with the current monolith.

## Why It Matters

This is the largest chunk and the one that delivers visible value — the web app users interact with. After this chunk, the current monolith can be retired and the new architecture is fully functional for web users.

## Scope

### In Scope
- Set up Next.js 16 in `apps/web` with App Router, Tailwind CSS 4, shadcn/ui
- Migrate all pages from `/Users/alainmk/startups/kayu/frontend/src/app/`
- Migrate all components from `/Users/alainmk/startups/kayu/frontend/src/components/`
- Migrate all hooks from `/Users/alainmk/startups/kayu/frontend/src/hooks/`
- Migrate styles (`globals.css`)
- Rewrite `AuthContext` to use `@kayu/api` instead of calling `/api/auth/*` directly
- Rewrite all data fetching to use `@kayu/api` endpoints
- Set up TanStack Query provider with the shared query keys
- SSR for public pages (homepage, provider profiles, category pages) using server-side fetch to backend
- Client-side data fetching for authenticated pages (dashboard, settings, messaging)
- API proxy in `next.config.ts` (rewrites `/api/*` to backend URL)
- Import utilities from `@kayu/utils` (replace local implementations)
- Import design tokens from `@kayu/ui` (configure Tailwind)

### Out Of Scope
- New features not in the current monolith
- Mobile-specific UI
- Rewriting components (migrate as-is, refactor later)
- API routes (all removed — backend handles API)
- Direct Prisma access (removed — all through API)
- `src/lib/db.ts` and `src/lib/auth.ts` (replaced by `@kayu/api`)

## Pages to Migrate

| Current Path | New Path (in apps/web) | SSR | Auth Required |
|---|---|---|---|
| `app/page.tsx` | `app/page.tsx` | Yes (stats, categories) | No |
| `app/services/page.tsx` | `app/services/page.tsx` | Yes (providers list) | No |
| `app/categories/[slug]/page.tsx` | `app/categories/[slug]/page.tsx` | Yes (category data) | No |
| `app/providers/[id]/page.tsx` | `app/providers/[id]/page.tsx` | Yes (provider profile) | No |
| `app/dashboard/page.tsx` | `app/dashboard/page.tsx` | No | Yes |
| `app/dashboard/provider/page.tsx` | `app/dashboard/provider/page.tsx` | No | Yes (PROVIDER) |
| `app/dashboard/client/page.tsx` | `app/dashboard/client/page.tsx` | No | Yes (CLIENT) |
| `app/dashboard/admin/page.tsx` | `app/dashboard/admin/page.tsx` | No | Yes (ADMIN) |
| `app/dashboard/settings/page.tsx` | `app/dashboard/settings/page.tsx` | No | Yes |
| `app/layout.tsx` | `app/layout.tsx` | Yes | No |
| `app/dashboard/layout.tsx` | `app/dashboard/layout.tsx` | No | Yes |

## Components to Migrate (~90)

### By priority (migrate in this order):

**1. Layout (required for any page):**
- `layout/Layout.tsx`, `layout/Header.tsx`, `layout/Footer.tsx`

**2. Auth (required for login/register):**
- `auth/LoginDialog.tsx`, `auth/RegisterDialog.tsx`, `auth/ProviderOnboarding.tsx`, `auth/ProfessionSelection.tsx`

**3. Homepage components:**
- `search/EnhancedSearchBar.tsx`
- `GlassButton.tsx`, `GlassCard.tsx`, `GlowText.tsx`

**4. Provider browsing:**
- `providers/ProviderCard.tsx`
- `services/ServiceCard.tsx`

**5. Provider profile:**
- `provider-profile/ProviderHeader.tsx`, `ProviderAbout.tsx`, `ProviderSkills.tsx`, `ProviderCategories.tsx`
- `provider-profile/ProviderCertifications.tsx`, `ProviderDiplomas.tsx`, `ProviderPortfolio.tsx`, `ProviderReviews.tsx`
- `provider-profile/BookingForm.tsx`, `ContactDialog.tsx`

**6. Ratings:**
- `ratings/RatingDisplay.tsx`, `ratings/RatingInput.tsx`

**7. Dashboard:**
- `dashboard/DashboardStats.tsx`, `BookingCard.tsx`, `FavoriteCard.tsx`, `ReviewCard.tsx`
- `dashboard/EarningsChart.tsx`, `NotificationList.tsx`, `ProfileCompletion.tsx`, `QuickActions.tsx`, `PremiumUpsell.tsx`

**8. Map:**
- `map/ProvidersMap.tsx`, `map/MapContent.tsx`, `map/MiniMapContent.tsx`

**9. Other:**
- `distance/DistanceBadge.tsx`
- `settings/VisibilitySettings.tsx`
- `booking/BookingCalendar.tsx`
- `notifications/NotificationList.tsx`
- `profile/UserProfile.tsx`

**10. UI components (shadcn):**
- All 45 shadcn/ui components in `ui/` — copy as-is

## Data Fetching Changes

### Before (current monolith):
```typescript
// Server component directly accesses Prisma
const providers = await prisma.provider.findMany(...)
```

### After (new architecture):
```typescript
// SSR pages: fetch from backend API server-side
const res = await fetch(`${BACKEND_URL}/api/providers?category=${slug}`)
const data = await res.json()

// Client pages: use React Query via @kayu/api
const { data } = useQuery({
  queryKey: queryKeys.providers.search(params),
  queryFn: () => providersApi(apiClient).search(params),
})
```

### API Proxy Setup

In `next.config.ts`:
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/:path*`,
    },
  ]
}
```

This allows client-side code to call `/api/...` and have it proxied to the backend. Cookies pass through automatically.

### AuthContext Rewrite

The current `AuthContext` uses local JWT cookies. Replace with Supabase SDK:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { apiClient, identityApi } from '@kayu/api'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Login — Supabase handles credentials
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  apiClient.setAccessToken(data.session.access_token)
  const me = await identityApi(apiClient).me()
  setUser(me.user)
}

// Phone OTP login
const loginWithPhone = async (phone: string) => {
  await supabase.auth.signInWithOtp({ phone })
  // User enters OTP code...
}

const verifyOtp = async (phone: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
  if (error) throw error
  apiClient.setAccessToken(data.session.access_token)
  const me = await identityApi(apiClient).me()
  setUser(me.user)
}

// Register — Supabase handles signup, then complete profile via backend
const register = async (email: string, password: string, profileData: CompleteProfileDtoType) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  apiClient.setAccessToken(data.session.access_token)
  await identityApi(apiClient).completeProfile(profileData)
}

// Session persistence — listen to Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    apiClient.setAccessToken(session.access_token)
  } else {
    apiClient.setAccessToken(null)
  }
})
```

### SSR with Supabase

For server-side rendering, use `@supabase/ssr`:
- Create a server-side Supabase client that reads cookies
- Pass the access token to server-side API calls
- See Next.js + Supabase SSR documentation for the cookie-based pattern

## Environment Variables

```env
# apps/web/.env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Package Dependencies

```json
{
  "dependencies": {
    "@kayu/api": "workspace:*",
    "@kayu/schemas": "workspace:*",
    "@kayu/ui": "workspace:*",
    "@kayu/utils": "workspace:*",
    // ... existing deps (react, next, tailwind, shadcn, etc.)
  }
}
```

## New Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x"
}
```

## What Gets Deleted

From the current monolith, these are NOT migrated:
- `src/app/api/` — entire API routes directory (backend handles this)
- `src/lib/db.ts` — no direct database access
- `src/lib/auth.ts` — auth logic replaced by Supabase SDK + `@kayu/api`
- `prisma/` — Prisma schema lives in the backend

**Migrated (not deleted):**
- `public/` assets (logos, icons) — copy to `apps/web/public/`

## Dependencies

- **Depends on:** Chunk 01 (monorepo), Chunk 02 (schemas), Chunk 09 (API client, UI tokens, utils), Chunks 04-08 (backend must be running)
- **Required by:** Chunk 13 (launch readiness)

## Acceptance Criteria

1. All pages render correctly (visual parity with current monolith)
2. No `src/app/api/` directory exists — zero API routes
3. No direct Prisma imports in the web app
4. SSR works for homepage, provider profiles, and category pages
5. Authentication flow works (register, login, logout, session persistence)
6. Provider search and filtering works
7. Booking creation and management works
8. Review submission works
9. Messaging works
10. Admin dashboard works for admin users
11. Settings (visibility) works
12. `turbo run type-check --filter=@kayu/web` passes

## Suggested Implementation Steps

1. Set up Next.js in `apps/web` with Tailwind, shadcn/ui, and configure API proxy
2. Copy all shadcn/ui components to `components/ui/`
3. Copy `globals.css` and configure Tailwind with `@kayu/ui` tokens
4. Rewrite `AuthContext` to use Supabase SDK (`@supabase/ssr`) + `@kayu/api` for /me
5. Set up TanStack Query provider in root layout
6. Migrate layout components (Header, Footer, Layout)
7. Migrate homepage (`page.tsx`) — convert server-side Prisma calls to API fetch
8. Migrate category page — SSR with API fetch
9. Migrate provider profile page — SSR with API fetch
10. Migrate services page — client-side with React Query
11. Migrate dashboard pages (provider, client, admin) — client-side with React Query
12. Migrate settings page
13. Migrate all remaining components
14. Smoke test every page and user flow
15. Delete `src/lib/db.ts` and `src/lib/auth.ts`

## QA / Validation Checklist

- [ ] Homepage loads with stats, categories, and search bar
- [ ] Category page shows subcategories and providers
- [ ] Provider profile page shows full profile with reviews
- [ ] Services page filters providers by category, city, price, rating
- [ ] Login dialog works (email and phone)
- [ ] Registration works (client and provider flows)
- [ ] Provider dashboard shows stats, bookings, reviews
- [ ] Client dashboard shows bookings, favorites
- [ ] Admin dashboard shows all management sections
- [ ] Booking creation works
- [ ] Review submission works after completed booking
- [ ] Messaging: send and receive messages
- [ ] Favorites: add and remove
- [ ] Settings: visibility controls work
- [ ] No `/api/` routes exist in the web app
- [ ] No Prisma imports in the web app
- [ ] SSR works (view page source shows content for public pages)
- [ ] `turbo run type-check` passes
