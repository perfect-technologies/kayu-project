# 11 — Mobile App: Foundation & Auth

## Goal

Create the Expo React Native mobile app with navigation structure, auth flow (register + login), and home screen. This is the scaffold that chunk 12 builds features on top of.

## Why It Matters

The mobile app is new development — not migration. It must share business logic with the web app via `@kayu/schemas`, `@kayu/api`, and `@kayu/utils`, but has its own navigation, UI components (React Native, not web), and auth persistence (SecureStore, not cookies).

## Scope

### In Scope
- Expo project setup in `apps/mobile`
- React Navigation (native stack + bottom tabs)
- Auth flow: login screen, register screen, phone login
- Auth persistence with `expo-secure-store`
- Auth context/provider for mobile
- Home screen (categories, search, featured providers)
- TanStack Query provider
- API client initialization (pointing to backend URL)
- Basic theme setup using `@kayu/ui` tokens
- Splash screen and app icon configuration

### Out Of Scope
- Provider browsing/search (chunk 12)
- Booking creation (chunk 12)
- Messaging (chunk 12)
- Reviews (chunk 12)
- Dashboard (chunk 12)
- Settings (chunk 12)
- Push notifications
- Deep linking (future)

## App Structure

```
apps/mobile/
├── App.tsx                        # Root with providers
├── app.json                       # Expo config
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Stack + Tab navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   └── placeholder/           # placeholder screens for tab nav
│   │       ├── SearchScreen.tsx
│   │       ├── BookingsScreen.tsx
│   │       ├── MessagesScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   └── home/
│   │       ├── CategoryGrid.tsx
│   │       └── FeaturedProviders.tsx
│   ├── lib/
│   │   ├── api.ts                 # ApiClient instance
│   │   ├── auth.tsx               # AuthContext with SecureStore
│   │   └── theme.ts               # RN StyleSheet helpers from @kayu/ui
│   └── assets/
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── package.json
└── tsconfig.json
```

## Navigation Structure

```
AppNavigator
├── (not authenticated)
│   └── AuthStack
│       ├── LoginScreen
│       └── RegisterScreen
│
└── (authenticated)
    └── MainTabs
        ├── HomeTab → HomeScreen
        ├── SearchTab → SearchScreen (placeholder)
        ├── BookingsTab → BookingsScreen (placeholder)
        ├── MessagesTab → MessagesScreen (placeholder)
        └── ProfileTab → ProfileScreen (placeholder)
```

- Tab icons: Home (House), Search (Search), Bookings (Calendar), Messages (MessageCircle), Profile (User)
- Tab bar uses KAYOU brand colors from `@kayu/ui`

## Auth Flow (Mobile-Specific)

### Supabase on React Native

Use `@supabase/supabase-js` with a custom storage adapter backed by `expo-secure-store`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
  },
})
```

This stores the Supabase session (including refresh token) in the native keychain — encrypted and secure.

### Token Flow

1. User signs up/logs in via Supabase SDK → gets session with `access_token`
2. Token set on `ApiClient` via `apiClient.setAccessToken(session.access_token)`
3. All backend requests include `Authorization: Bearer <access_token>`
4. Supabase SDK auto-refreshes expired tokens using the stored refresh token
5. On app launch, `supabase.auth.getSession()` restores session from SecureStore
6. Listen to `onAuthStateChange` to keep ApiClient token in sync

### AuthContext (Mobile)

```typescript
interface AuthContextType {
  user: UserType | null
  isLoading: boolean
  isAuthenticated: boolean
  supabase: SupabaseClient
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  verifyOtp: (phone: string, code: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

### Login Screen

- Email input
- Password input
- "Se connecter" button
- "Connexion par téléphone" toggle
- Phone input + OTP code input (shown when toggle active)
- "Pas de compte? S'inscrire" link
- KAYOU logo at top
- Loading state on submit

### Register Screen

- Email + password (Supabase signUp)
- After signup: profile completion screen
  - First name, Last name
  - Phone (with DRC/Congo format validation from `@kayu/utils`)
  - City, Country dropdowns
  - Role selection (Client / Prestataire)
- Calls `PATCH /api/me/profile` and `PATCH /api/me/role` via `@kayu/api`
- If PROVIDER: additional onboarding via `POST /api/me/provider-onboarding`

## Home Screen

- KAYOU logo + greeting ("Bonjour, {firstName}")
- Search bar (navigates to SearchScreen)
- Category grid (2 columns, icons + names)
- Featured providers horizontal scroll (top-rated, nearby)
- Stats banner (provider count, client count)

Data fetching:
```typescript
const { data: categories } = useQuery({
  queryKey: queryKeys.categories.all,
  queryFn: () => categoriesApi(apiClient).getAll(),
})

const { data: stats } = useQuery({
  queryKey: queryKeys.stats.global,
  queryFn: () => statsApi(apiClient).getGlobal(),
})
```

## Key Dependencies

```json
{
  "@kayu/api": "workspace:*",
  "@kayu/schemas": "workspace:*",
  "@kayu/ui": "workspace:*",
  "@kayu/utils": "workspace:*",
  "expo": "~54.0.0",
  "react-native": "~0.81.0",
  "@react-navigation/native": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "@react-navigation/bottom-tabs": "^7.x",
  "@tanstack/react-query": "^5.x",
  "expo-secure-store": "~14.x",
  "expo-font": "~13.x",
  "expo-splash-screen": "~0.29.x",
  "expo-status-bar": "~2.x",
  "@expo/vector-icons": "^14.x"
}
```

## Environment

```env
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Note: For physical device testing, replace `localhost` with the machine's IP address.

## Dependencies

- **Depends on:** Chunk 01 (monorepo), Chunk 02 (schemas), Chunk 09 (API client, UI tokens, utils), Chunk 04 (auth backend)
- **Required by:** Chunk 12 (mobile features built on this foundation)

## Acceptance Criteria

1. `pnpm --filter @kayu/mobile run dev` starts the Expo dev server
2. App loads on iOS simulator / Android emulator / Expo Go
3. Login screen displays and accepts credentials
4. Successful login stores token and navigates to home
5. Register screen creates account (client flow works)
6. App persists auth state across restart (SecureStore)
7. Home screen shows categories and stats from backend
8. Tab navigation works (even if other tabs are placeholders)
9. Logout clears stored token and returns to login screen
10. `turbo run type-check --filter=@kayu/mobile` passes

## Suggested Implementation Steps

1. Initialize Expo project in `apps/mobile` with TypeScript template
2. Install dependencies (React Navigation, TanStack Query, expo-secure-store, shared packages)
3. Create `lib/supabase.ts` — Supabase client with SecureStore adapter
4. Create `lib/api.ts` — initialize ApiClient with `EXPO_PUBLIC_API_URL`
5. Create `lib/auth.tsx` — AuthContext using Supabase SDK + ApiClient
5. Create `lib/theme.ts` — map `@kayu/ui` tokens to React Native styles
6. Create `navigation/AppNavigator.tsx` — auth stack + main tabs
7. Create `screens/auth/LoginScreen.tsx`
8. Create `screens/auth/RegisterScreen.tsx`
9. Create `screens/home/HomeScreen.tsx` with categories and stats
10. Create placeholder screens for other tabs
11. Create common components (Button, Input, Card, Badge)
12. Wire up `App.tsx` with providers (QueryClient, AuthProvider, NavigationContainer)
13. Test auth flow end-to-end
14. Configure app.json (name, icon, splash screen)

## QA / Validation Checklist

- [ ] Expo dev server starts without errors
- [ ] App renders on simulator/emulator
- [ ] Login with valid credentials → home screen
- [ ] Login with invalid credentials → error message
- [ ] Register as client → account created → home screen
- [ ] Close and reopen app → still logged in
- [ ] Logout → login screen, token cleared
- [ ] Home screen shows categories from backend
- [ ] Home screen shows platform stats
- [ ] Tab bar shows 5 tabs with correct icons
- [ ] Tapping tabs navigates to respective screens
- [ ] Phone input validates DRC/Congo format
