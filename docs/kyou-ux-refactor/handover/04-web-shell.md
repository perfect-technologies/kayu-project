# 04 → 05–09: web shell as implemented

Workstream 04 rebuilt `apps/web` on the K-YOU tokens and one chrome, on branch `kyou-ux/04-shell`. Decisions are logged in `PROGRESS.md` (rows prefixed "(04)"). This file is what 05–09 build on.

## Route layout

```
src/app/
  layout.tsx            fonts (Sora, Plus Jakarta Sans), metadata, <AppProviders>
  (shell)/layout.tsx    <Layout> — navbar, maintenance banner, screen transition, footer switch, dock
  (shell)/…             every route except the shell-less set; placeholders today
  (canvas)/layout.tsx   <AuthCanvas> — /login, /register, /premium
  bienvenue/page.tsx    <AuthCanvas topBar> (the one canvas with the "Passer" bar)
  launch/**             untouched (09)
  not-found.tsx         wraps <Layout> itself (root not-found renders outside route groups)
  (shell)/dev/tokens    dev-only token page; 404 in production (page `notFound()` + proxy)
```

Put new route folders **directly under `(shell)/`** (or `(canvas)/` for shell-less screens). Nested groups such as `(shell)/(public)/` are allowed but not required. Each placeholder is a `page.tsx` that renders `RoutePlaceholder` (or `CanvasPlaceholder`); delete it when the real screen lands. `src/components/placeholder/` goes with the last placeholder.

## Layout components (`src/components/layout/`)

| Export | Kind | Notes |
| --- | --- | --- |
| `Layout` | server | `.app-shell` › `Navbar` › `MaintenanceBanner` › `<main class="app-content flex-1"><ScreenTransition>` › `FooterSwitch(Footer)` › `MobileNav` |
| `Navbar` (+ `navbarLinks`, `isActivePath`) | client | Role matrix of 04 §B; bell → `/notifications` (or `/login`) with accent dot from `useUnreadNotifications()`; no hamburger |
| `MobileNav` (+ `dockTabs`) | client | 4/5 tabs by role, `layoutId="active-mobile-tab"`, spring 450/34, `duration: 0` under reduced motion. Do **not** reuse that `layoutId` |
| `Footer` | server | Compact footer. `FooterSwitch` shows it only on `/`, `/services`, `/contact`, `/cgu`, `/confidentialite` (`FOOTER_ROUTES`) |
| `Logo`, `LogoMark` | server | The K-YOU two-figure mark redrawn as SVG in `fill-primary` / `fill-accent` plus a Sora "KAYOU" wordmark. `size` 28 · 36 · 60, `withText`, `onDark` (white wordmark on emerald panels). `public/logo.svg` is the same drawing for `<img>` uses; `src/app/icon.svg` and `apple-icon.png` are the favicons |
| `AuthCanvas` | server | `<main class="auth-canvas"><section class="auth-card">`; `topBar` + `skipHref` for `/bienvenue` |
| `AdminRail` | client | `sections: { key, label, icon }[]`, `active`, optional `hrefFor(key)` (default `/admin?tab=key`). Wrap the page in `.admin-canvas` and `max-w-[1500px] lg:flex` as in `(shell)/admin/AdminPlaceholder.tsx` |
| `ScreenTransition`, `ScrollToTop`, `NetworkStatus`, `InteractionEffects`, `MaintenanceBanner` | client | Mounted by `Layout` / `MarketplaceProviders`; nothing to do |
| `SuspendedScreen`, `AcceptTermsScreen` | client | Rendered by `AuthGate` (providers) for every route |

`InteractionEffects` pulses on `button, a, [role='button']` (≤ 480 × 100 px, max 6 live, 450 ms, skipped under reduced motion and on disabled targets). Nothing else to wire.

## Auth (`src/contexts/AuthContext.tsx`, `src/components/guards/`)

`useAuth()` → `{ status, user, suspendedReason, isLoading, isAuthenticated, login, loginWithPhone, verifyOtp, acceptTerms, refreshUser, signOut }`.

- `status`: `loading | anonymous | needs-terms | suspended | ready`. `AuthUser` carries `role`, `country`, `profileComplete`, `termsAcceptedAt`, `suspendedReason`, `provider: { id, hidden, verificationStatus } | null`.
- `AuthProvider` always renders children (public pages SSR). `AuthGate` swaps in `SuspendedScreen` (403 `ACCOUNT_SUSPENDED` from `/me`, reason from the body) or `AcceptTermsScreen` (`termsAcceptedAt` null → gold action → `POST /me/accept-terms`).
- `signOut()` clears the token and pushes `/`.
- Guards are client wrappers around page content; the server still enforces everything:

| Guard | Behaviour |
| --- | --- |
| `ProtectedRoute` | `anonymous` → `router.replace('/login?returnTo=<path+search>')`; renders `AuthBootScreen` (32 px ring) until `ready` |
| `RequireRole role="CLIENT" \| "PROVIDER"` | Admins pass as CLIENT. Wrong role → `redirectTo` or `/mon-espace` / `/mes-reservations` |
| `RequireAdmin` | non-admin → `/` |
| `RequireOwnerOrAdmin providerId` | matches `user.provider.id` (no fetch); else → `/prestataire/[id]` |
| `RequireNotProvider` | `/prestataire/nouveau`: an existing provider → `/prestataire/[ownId]/modifier` |
| `GuestOnly` | `/login`, `/register`: signed-in → `postLoginDestination(user, returnTo)` |

`src/lib/auth-redirects.ts`: `safeReturnTo` (same-origin `/…`, never `//`), `loginPath`, `registerPath`, `currentLocation`, `returnToFromLocation`, `postLoginDestination` (returnTo → ADMIN `/admin` → PROVIDER without row `/prestataire/nouveau` → `/`), `roleHome`. 06 calls `postLoginDestination` after OTP.

Hooks: `useSiteSettings()` (`GET /settings/public`, 5 min stale, `SITE_SETTING_DEFAULTS` fallback) with `settingOr(value, fallback)`; `useUnreadNotifications()` (`GET /notifications?limit=1` every 60 s when `ready`).

## Copy

`src/copy/shell.ts` (`shellCopy`: nav, dock, footer, offline, maintenance, suspended, acceptTerms, canvas, sheet, screenTitles, admin, notFound, placeholders), `src/copy/errors.ts` (`errorCopy` for the 22 backend codes, `genericErrorCopy`, `errorMessage(error)` — use it in every `catch`), `src/copy/dev.ts` (token page only). Convention: `export const xCopy = { … } as const`, plain objects, only `(n: number) => string` functions. 05–08 add `home.ts`, `search.ts`, `provider.ts`, `auth.ts`, `spaces.ts`, `admin.ts`, `legal.ts`.

## Tokens and classes (`globals.css`)

Tailwind v4 `@theme` with conventional names: `bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `text-accent-foreground`, `text-destructive`, `border-border`, `border-input`, `ring-ring`; `font-heading` / `font-body`; `rounded-field` (14) `rounded-card` (16) `rounded-card-lg` (24) `rounded-hero` (32); `shadow-soft`, `shadow-soft-lg`, `shadow-brand`; `ease-[var(--ease-screen)]`; `animate-fade-up`, `animate-float`, `animate-blob`, `animate-loading-sheen`, `animate-accordion-*`.

Hand-written classes, exactly the 04 §A list: `.app-shell`, `.app-content`, `.mobile-page`, `.mobile-dock`, `.compact-footer`, `.auth-canvas` (+ `--bar`, `__bar`), `.auth-card`, `.mesh-bg`, `.gradient-text`, `.primary-action` (+ `--gold`), `.secondary-action` (+ `--danger`, **14 px radius per contract §9**), `.icon-button`, `.field` (+ `--icon`), `.empty-state`, `.metric-card` (+ `__icon`), `.loading-card`, `.skeleton-sheen`, `.provider-tile`, `.status-pill` (+ `--confirmed … --messages`), `.screen-enter`, `.touch-pulse`, `.admin-canvas`, `.admin-rail`, `.admin-nav` (+ `--active`). Every `--k-*` variable and `.k-*` class is gone except the `.k-campaign` reduced-motion block (09).

Reduced motion disables `.screen-enter`, the sheen, the pulse, tw-animate `animate-in/out`, every `:active` scale and the dock icon scale. Hover rules are gated on `(hover: hover) and (pointer: fine)`.

## UI primitives kept (`src/components/ui/`)

`button` (variants `default` pill · `gold` · `secondary` · `outline` · `ghost` · `destructive` · `link`; sizes `sm` 36 · `default` 44 · `lg` 54 · `icon`; `type="button"` default), `badge` (`default` · `accent` · `secondary` · `destructive` · `outline`), `card`, `avatar`, `dropdown-menu`, `sheet`, `alert-dialog`, `label`, `scroll-area`, `sonner` (`<Toaster>` mounted once; call `toast()` from `sonner`). New: `skeleton` (`Skeleton`, `SkeletonLines`, `LoadingCard`, `LoadingRow`), `bottom-sheet` (`BottomSheet` — spring 280/28, backdrop black/40, Escape, focus trap, body scroll lock), `wizard-steps` (`WizardSteps step={n}` — `mode="wait"`, x ±24, 0.28 s), `animated-list` (`AnimatedList items keyOf render`). `@kayu/ui/web` primitives (`Button`, `Input`, `Avatar`, `StarRating`, `EmptyState`, `ErrorState`, `InlineAlert`, `Shimmer`, `I`) are also available; mount `<ShimmerStyles />` if you use `Shimmer` (the CSS `.skeleton-sheen` needs nothing).

Removed dependencies: every unused `@radix-ui/*`, `@dnd-kit/*`, `@tanstack/react-table`, `recharts`, `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-day-picker`, `vaul`. Re-add `input-otp` in 06 if the OTP field wants it. `react-hook-form` + `@hookform/resolvers` stay (decided in 10). `playwright` is a web devDependency for `scripts/overflow-check.mjs`.

## Redirects

`next.config.ts` holds `legacyRedirects` (one `permanent(source, destination, has?)` per row of 04 §E). Add rows through a PROGRESS note; 04 applies them. `proxy.ts` keeps the campaign-mode redirects on the new public paths (`/rechercher`, `/prestataire`, `/services`; `/login` and `/register` for the auth interception) and 404s `/dev/*` in production.

## Verification

```sh
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
node --test apps/web/src/lib/*.test.mjs
# against a running dev server; PW_CHANNEL=chrome uses the installed Google Chrome
cd apps/web && PW_CHANNEL=chrome node scripts/overflow-check.mjs --urls / /rechercher /dev/tokens --widths 320 390 1440 [--shots dir] [--reduced-motion]
```
