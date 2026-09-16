# 04 - Web Shell and Design System

## Objective

Give `apps/web` one visual system and one chrome: the K-YOU tokens, fonts, motion and utility classes; a single `Layout` with desktop navbar, mobile bottom dock and compact footer; the auth canvas for shell-less pages; and the auth bootstrap that every route group relies on. Delete the competing chromes and dead code so workstreams 05–09 build on a clean base.

## Severity

P0. Every screen workstream renders inside this shell.

## Owns

- `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/next.config.ts`, `apps/web/postcss.config.*`, `apps/web/package.json`
- `apps/web/src/components/layout/**` (rewritten)
- `apps/web/src/components/providers/**` (`AppProviders`, `MarketplaceProviders`, `QueryProvider`)
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/components/guards/**` (new)
- `apps/web/src/copy/**` (new convention, seeded with shell copy)
- `apps/web/src/app/dev/tokens/page.tsx` (new, dev-only)
- Deletions listed in section D

## In scope

- Tokens, fonts, utility classes, motion primitives.
- `Layout`, `Navbar`, `MobileNav`, `Footer`, `AuthCanvas`, `SuspendedScreen`, `NetworkStatus`, `ScreenTransition`, `InteractionEffects`, `ScrollToTop`.
- `AuthContext` changes, `RequireRole`, `RequireAdmin`, `ProtectedRoute`, redirect matrix.
- Old-route redirects.
- Copy module convention.

## Out of scope

- Any page content (05–09). The shell ships with placeholder pages only where a route must exist for the dock links to resolve.
- `packages/ui` token values (03). This workstream consumes them.
- Campaign pages (09) beyond inheriting `globals.css`.

---

## A. Tokens, fonts and utility classes

### `globals.css`

Replace the 47 `--k-*` variables and the `.k-*` component layer. The file becomes:

1. `@import "tailwindcss";`
2. `@theme` block mapping Tailwind v4 colour names to K-YOU HSL variables (from contract §9). Tailwind class names stay conventional (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-accent`, `rounded-3xl`) so screens read like the K-YOU reference.

```css
@theme {
  --color-background: hsl(48 20% 97%);
  --color-foreground: hsl(172 60% 12%);
  --color-card: hsl(0 0% 100%);
  --color-primary: hsl(165 74% 14%);
  --color-primary-foreground: hsl(60 14% 97%);
  --color-secondary: hsl(150 14% 95%);
  --color-muted: hsl(150 14% 94%);
  --color-muted-foreground: hsl(165 10% 40%);
  --color-accent: hsl(43 100% 57%);
  --color-accent-foreground: hsl(165 74% 14%);
  --color-destructive: hsl(0 72% 45%);
  --color-border: hsl(155 21% 88%);
  --color-input: hsl(150 14% 92%);
  --color-ring: hsl(165 74% 14%);
  --font-heading: var(--font-sora), system-ui, sans-serif;
  --font-body: var(--font-plus-jakarta), system-ui, sans-serif;
  --radius-field: 14px; --radius-card: 16px; --radius-card-lg: 24px; --radius-hero: 32px;
  --shadow-soft: 0 4px 24px -8px rgb(15 23 42 / .12);
  --shadow-soft-lg: 0 16px 48px -12px rgb(15 23 42 / .18);
  --shadow-brand: 0 16px 40px -12px hsl(172 60% 32% / .5);
  --ease-screen: cubic-bezier(.2,.75,.3,1);
}
```

3. Base layer: `body { @apply bg-background text-foreground font-body text-sm antialiased; }`, `h1–h4 { @apply font-heading; }`, `:focus-visible` gold outline (3 px `#E8AE29`, 4 px offset), `html { color-scheme: light; }`.

4. Component layer — the only hand-written classes allowed, named after K-YOU's so the reference screens map one-to-one:

| Class | Meaning |
| --- | --- |
| `.auth-canvas` | `min-h-dvh` mint + cream radial gradients on `#F8FAF7`; on `< 640px` background `#F8F8F3` flat. |
| `.auth-card` | `max-w-md mx-auto bg-white border rounded-[30px] p-6 sm:p-8 shadow-[0_24px_90px_-50px_#0a3d3650]`; on `< 640px` no border, no shadow, transparent background. |
| `.primary-action` | Full-width pill, `min-h-[54px] rounded-full bg-primary text-primary-foreground font-bold`, soft brand shadow, `:active` scale .975, `disabled` 55% opacity. Variant `.primary-action--gold` uses `bg-accent text-accent-foreground`. |
| `.secondary-action` | Bordered pill, `min-h-[44px] rounded-full border bg-white`, same press feedback. `.secondary-action--danger` red text. |
| `.icon-button` | 44 × 44 circle, `bg-white border`, centred icon. |
| `.field` | Input shell: `h-12 rounded-[14px] border border-input bg-white px-4`, `focus-within` ring; `.field--icon` adds `pl-12` for a leading Lucide icon. |
| `.mobile-page` | Container padding, `h1 { font-size: clamp(22px, 4.7vw, 28px) }`, bottom padding for the dock. |
| `.app-shell` | Flex column, `min-h-dvh`, `pb-20 lg:pb-0`, under 640 px `padding-bottom: calc(80px + env(safe-area-inset-bottom))`. |
| `.screen-enter` | 240 ms `--ease-screen`, opacity .45→1, translateY 7px→0. |
| `.loading-card` + `.skeleton-sheen` | Skeleton card and 1.4 s sheen keyframe. |
| `.empty-state` | `rounded-3xl border-2 border-dashed border-border bg-white/60 p-8 text-center`. |
| `.metric-card` | `rounded-[22px] bg-secondary/60 p-4` with a white icon square, `shadow-[0_8px_25px_-23px_#194b32]`. |
| `.mesh-bg` | The marketing/auth radial mesh (the only sanctioned decorative gradient). |
| `.gradient-text` | Emerald→teal clip, hero headline only. |
| `.touch-pulse` | 38 px gold ring, 420 ms scale .35→1.6 fade. |
| `.mobile-dock` | `fixed inset-x-0 bottom-0 z-50 border-t bg-white/90 backdrop-blur-xl`, shadow `0 -8px 30px -20px #183d3438`. |
| `.status-pill` | Base pill; modifiers `--confirmed`, `--pending`, `--cancelled`, `--completed`, `--elite`, `--messages` map to the contract's semantic colours. |

5. `@media (prefers-reduced-motion: reduce)` block disabling `.screen-enter`, `.skeleton-sheen`, `.touch-pulse`, all `:active` scale transitions and the dock icon scale.

6. `@media (hover: hover) and (pointer: fine)` hover rules for `.primary-action` shadow deepening and `.provider-tile img` scale 1.035.

Every other `.k-*` class is deleted. Inline `style={{ … var(--k-*) }}` usages across the app are removed as each route is rebuilt (05–09); this workstream deletes the variables, so the old routes stop compiling visually but still type-check. That is accepted for the integration branch.

### Fonts (`layout.tsx`)

```ts
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap" });
```

Remove `Inter` and `JetBrains_Mono`. `<html lang="fr" className={`${sora.variable} ${jakarta.variable}`}>`. `theme-color` meta `#0A3D36`. Metadata title "KAYOU — Trouvez le bon professionnel près de chez vous".

### Tailwind plugins

Keep `@tailwindcss/postcss`. Add nothing; keyframes (`fade-up`, `float`, `blob`, `loading-sheen`, `accordion-down/up`) are declared in `globals.css` under `@theme` as `--animate-*`.

---

## B. The single `Layout`

`apps/web/src/components/layout/` after the rewrite:

| File | Responsibility |
| --- | --- |
| `Layout.tsx` | Server component. `<div class="app-shell"><Navbar/><main class="app-content flex-1"><ScreenTransition>{children}</ScreenTransition></main>{footerAllowed && <Footer/>}<MobileNav/></div>`. Footer allow-list: `/`, `/services`, `/contact`, `/cgu`, `/confidentialite`. Used by every route except the shell-less set. |
| `Navbar.tsx` | Client. Sticky `top-0 z-40 bg-white/85 backdrop-blur-xl border-b`, `h-16 max-w-7xl`. Left `Logo`. Centre (`hidden lg:flex`) pill links from the role matrix below. Right (`hidden lg:flex`): avatar link → `/compte`, Connexion/Déconnexion pill. Right (`lg:hidden`): bell icon-button → `/notifications` (or `/login`) with an accent dot when `unreadCount > 0`, then avatar or compact Connexion pill. No hamburger, no drawer. |
| `MobileNav.tsx` | Client. `.mobile-dock lg:hidden`, `max-w-2xl` row, `pb-[env(safe-area-inset-bottom)]`. Tabs by role (table below). Active tab: `text-primary`, icon stroke 2.4, gold underline pill `h-1 w-9 rounded-full bg-accent` animated with `motion.span layoutId="active-mobile-tab"` (spring 450/34; `duration: 0` under `useReducedMotion`). Icons scale .87 on press. |
| `Footer.tsx` | Server. `.compact-footer`: hairline top border, brand block (28 px logo + © year) left, three links right: Contact, Confidentialité, Conditions. Under 640 px: column, brand hidden, 36 px touch rows. |
| `Logo.tsx` | Server. `/kayou-logo-transparent.png` mark + wordmark, `withText` prop, sizes 28/36/60. |
| `AuthCanvas.tsx` | Server. `<main class="auth-canvas"><section class="auth-card">{children}</section></main>` plus optional top bar (logo left, "Passer" right) for `/bienvenue`. |
| `ScreenTransition.tsx` | Client. Wraps children in `<div key={pathname} class="screen-enter">`. |
| `ScrollToTop.tsx` | Client. `useEffect` on `pathname` → `window.scrollTo(0, 0)` unless the navigation carries `#hash`. |
| `NetworkStatus.tsx` | Client. Listens to `online`/`offline`; renders a fixed top banner "Vous êtes hors ligne" in amber; hides after 1 s once back online. |
| `InteractionEffects.tsx` | Client, returns `null`. One `pointerdown` listener on `document`: appends a `.touch-pulse` span at the pointer position, removes it after 450 ms. Skips when reduced motion, non-primary button, target `disabled`/`aria-disabled`, target rect wider than 480 px or taller than 100 px, or 6 pulses already live. No React state, no re-render. Direct port of the K-YOU behaviour in `src/components/InteractionEffects.tsx` (read for reference, do not copy). |
| `SuspendedScreen.tsx` | Client. Full-page card, red accent, reason from `/me`, Déconnexion button. Rendered by `AuthContext` gate on every route. |
| `MaintenanceBanner.tsx` | Client. Amber banner when `settings.maintenance_mode`. Rendered inside `Layout` above `main`. |

### Framer Motion decision

**Keep `framer-motion`** (already a dependency, v12). Use it for exactly four things: the dock indicator (`layoutId`), bottom sheets (`AnimatePresence` + spring), wizard step swaps (`mode="wait"`), and list `layout` animation on filter changes. Everything else (screen enter, press, pulse, skeleton sheen, hover) is CSS.

Rejected: CSS View Transitions for the dock indicator. The API is not implemented in Firefox stable or in the iOS 17 WebView and would need a JS fallback that is heavier than `layoutId`. Rejected: removing framer-motion entirely. A hand-rolled spring for the indicator and sheets costs more than the ~30 kB it saves.

### Navigation matrix

Desktop navbar pills:

| Audience | Links |
| --- | --- |
| Always | Accueil `/`, Rechercher `/rechercher`, Tous les services `/services` |
| Anonymous | + Premium `/premium`, Devenir prestataire `/prestataire/nouveau` (redirects through login) |
| CLIENT | + Messages `/messagerie`, Mes réservations `/mes-reservations`, Devenir prestataire `/prestataire/nouveau`, Premium |
| PROVIDER | + Messages, Mon espace `/mon-espace`, Premium |
| ADMIN | + Admin `/admin` (admins also see the CLIENT set) |

Mobile dock:

| Audience | Tabs |
| --- | --- |
| Anonymous | Accueil `/` · Explorer `/rechercher` · Services `/services` · Connexion `/login` |
| CLIENT | Accueil · Explorer `/rechercher` · Commandes `/mes-reservations` · Messages `/messagerie` · Profil `/compte` |
| PROVIDER | Accueil · Demandes `/mon-espace` · Messages `/messagerie` · Revenus `/revenus` · Profil `/compte` |
| ADMIN | Same as CLIENT; the Admin entry lives on `/compte` and in the navbar. |

Labels are shown under icons (contract §8 overrides the old "no labels" rule).

### Shell-less routes

`/login`, `/register`, `/bienvenue`, `/premium` (auth canvas, no navbar/dock/footer), `/launch*` (own chrome, workstream 09). There is no `/agents` route on `main`; the concierge branch adds its own page later. Everything else renders inside `Layout`. Route groups in `app/`: `(shell)/` with `layout.tsx` rendering `<Layout>`, `(canvas)/` rendering `<AuthCanvas>`, `launch/` untouched.

---

## C. Auth bootstrap and guards

### `AuthContext`

Keep the Supabase session → `apiClient.setAccessToken` → `GET /me` flow. Changes:

- `AuthUser` gains `termsAcceptedAt`, `suspendedReason`, `provider: { id, hidden, verificationStatus } | null`, `unreadNotifications` (from `/me`).
- Expose `status: "loading" | "anonymous" | "needs-terms" | "suspended" | "ready"`.
- `needs-terms`: `/me` succeeded but `termsAcceptedAt` is null → render `AcceptTermsScreen` (auth canvas, CGU + confidentialité links, one gold action calling `identityApi.acceptTerms()`), then continue. This replaces K-YOU's register-time checkbox for OTP sign-ups.
- `suspended`: `/me` returned 403 with `suspendedReason` → render `SuspendedScreen` on every route, including public ones (matches K-YOU).
- Full-page loading is allowed **only** in `loading` (the one exception in contract §11 rule 9). It renders a centred 32 px ring on the ivory background, no text.
- `signOut()` clears the token and pushes `/`.
- `returnTo` support: `LoginWall` and guards append `?returnTo=<path>`; after OTP, `safeReturnTo()` accepts only same-origin relative paths starting with `/` and not `//`.

### Guards (`apps/web/src/components/guards/`)

| Component | Behaviour |
| --- | --- |
| `ProtectedRoute` | `anonymous` → `router.replace('/login?returnTo=…')`; renders children when `ready`. |
| `RequireRole role="CLIENT" \| "PROVIDER"` | Wrong role → `router.replace(redirectTo)` with defaults `/mon-espace` for providers landing on client pages and `/mes-reservations` for clients landing on provider pages. |
| `RequireAdmin` | `role !== "ADMIN"` → `/`. |
| `RequireOwnerOrAdmin providerOwnerId` | For `/prestataire/[id]/modifier`. |

Guards are client components wrapping page content; the server still enforces every rule.

### Redirect matrix (contract §2)

| Situation | Result |
| --- | --- |
| Anonymous opens a protected route | `/login?returnTo=` |
| Signed-in user opens `/login` or `/register` | `/` (or `returnTo`) |
| CLIENT opens `/mon-espace`, `/revenus`, `/verification` | `/mes-reservations` |
| PROVIDER opens `/mes-reservations`, `/avis`, `/adresses` | `/mon-espace` |
| PROVIDER opens `/prestataire/nouveau` | `/prestataire/[ownId]/modifier` |
| Non-admin opens `/admin` | `/` |
| Suspended user opens anything | `SuspendedScreen` |
| First-time OTP user without terms | `AcceptTermsScreen` then intended route |
| After login, `role === ADMIN` and no `returnTo` | `/admin` |
| After login, PROVIDER without a provider row | `/prestataire/nouveau` |

---

## D. Deletions

Delete in this workstream (nothing else may import them afterwards):

**Routes**: `src/app/design/`, `src/app/design-system/`, `src/app/admin/page.tsx` (shim), `src/app/dashboard/page.tsx` and `src/app/dashboard/provider/`, `src/app/pro/onboarding/layout.tsx`, `src/app/quotes/`, `src/app/pro/requests/`, `src/app/pro/devis/`. The remaining `src/app/dashboard/*`, `src/app/pro/*`, `src/app/book/*`, `src/app/review/*`, `src/app/providers/*`, `src/app/services/*`, `src/app/categories/*`, `src/app/bookings/*`, `src/app/messages/*`, `src/app/auth/*` are deleted by their owning workstream (05–08) when the replacement route lands, so the branch never has two homes for one screen.

**Chromes**: `components/layout/AppShell.tsx`, old `Header.tsx`, old `Footer.tsx`, `src/app/dashboard/admin/layout.tsx` (ops bar), `src/app/dashboard/layout.tsx`, `src/app/bookings/layout.tsx`, `src/app/messages/layout.tsx`, `src/app/pro/layout.tsx`, `components/booking/BookingShell.tsx`.

**Dead component folders**: `components/dashboard/*.tsx` + `index.ts` (legacy barrel; `DashboardStats` moves into `components/dashboard/provider/` if still needed by 07), `components/distance/`, `components/notifications/`, `components/profile/`, `components/services/`, `components/ratings/`, `components/search/` (empty), `components/pro/earnings/` (empty), `components/pro/*` (job-request cards, quote fixtures), `components/bookings/FinalOfferDialog.tsx`, `src/app/pro/verify/fixtures.ts` and `DebugStateSwitch`, `src/lib/booking-v2.ts`, `src/lib/launch-flags.ts` (both flags are gone), `src/app/home/HardcodedTestimonials.ts`.

**shadcn primitives** (`components/ui/`): keep `dropdown-menu`, `avatar`, `button`, `badge`, `scroll-area`, `sheet`, `card`, `alert-dialog`, `label`, `toast`/`toaster` (sonner stays for toasts). Delete the other ~38 files and the matching `@radix-ui/*` dependencies. Remove `@dnd-kit/*`, `@tanstack/react-table`, `recharts` (earnings chart becomes the 7-bar CSS chart from K-YOU), `@hookform/resolvers` only if no remaining form uses it after 05–08 (decide in 10).

**Leaflet stays.** K-YOU's search has a list/map toggle with photo pins. `components/map/` is deleted here as dead code and **rebuilt in workstream 05** as `components/search/SearchMapView.tsx` on `react-leaflet` v5. The OpenStreetMap `remotePatterns` in `next.config.ts` stay.

**Old variables**: every `--k-*` variable, `.k-*` class, `tokens` v2 import in `apps/web`. `grep -rn "var(--k-" apps/web/src` must be empty by the end of workstream 08; this workstream removes the definitions and the shell usages.

---

## E. Redirects (`next.config.ts`)

Add `redirects()` with `permanent: true`:

| Source | Destination |
| --- | --- |
| `/services` (with `?q`, `?city`, `?category`) | `/rechercher` (query preserved; `/services` itself becomes the K-YOU category grid, so this redirect applies **only** when a query string is present — implement with `has: [{ type: "query", key: "q" }]` etc.) |
| `/categories/:slug` | `/rechercher?category=:slug` |
| `/providers/:id` | `/prestataire/:id` |
| `/book/:id` | `/prestataire/:id` |
| `/review/:id` | `/prestataire/:id` |
| `/auth` | `/login`; `/auth?mode=signup` → `/register` (query `has`) |
| `/pro/onboarding` | `/prestataire/nouveau` |
| `/pro`, `/dashboard/provider` | `/mon-espace` |
| `/pro/earnings` | `/revenus` |
| `/pro/verify` | `/verification` |
| `/pro/profile/:rest*` | `/compte` |
| `/dashboard`, `/dashboard/client`, `/bookings` | `/mes-reservations` |
| `/bookings/:id` | `/reservation/:id` |
| `/messages` | `/messagerie` |
| `/dashboard/settings` | `/compte` |
| `/dashboard/admin`, `/dashboard/admin/:rest*` | `/admin` |
| `/quotes/:rest*`, `/pro/requests`, `/pro/devis/:rest*` | `/mes-reservations` |

`proxy.ts` keeps only the campaign-mode redirects, updated to the new public paths (`/rechercher`, `/prestataire`, `/services`, `/login`, `/register`).

---

## F. Copy modules

`apps/web/src/copy/` holds every user-visible string:

```
copy/shell.ts       nav labels, dock labels, footer, offline banner, suspended, accept-terms
copy/auth.ts        login, register, bienvenue slides
copy/home.ts        hero, stats bar, how it works, premium teaser (defaults overridden by /settings/public)
copy/search.ts      filters, empty states, map toggle
copy/provider.ts    profile, booking form, review form, wizard steps, editor
copy/spaces.ts      bookings, dashboard, earnings, reviews, notifications, help, addresses, account
copy/admin.ts       tabs, tables, actions
copy/legal.ts       CGU sections, privacy sections, contact details fallback
copy/errors.ts      API error code → French sentence map (SLOT_TAKEN, BLOCKED, SUSPENDED, …)
```

Rules: `export const shellCopy = { … } as const;` plain objects, no JSX, no functions except `(n: number) => string` pluralisers. Components import the module and never inline French. This is the seam for a later locale layer; nothing else about i18n is built now.

---

## G. Dev token page

`src/app/dev/tokens/page.tsx` replaces `/design`. It renders the palette, type scale, radii, shadows, every utility class in section A, the four framer primitives, and the status pills. The route file starts with `if (process.env.NODE_ENV === "production") notFound();` and `proxy.ts` additionally 404s `/dev/*` in production. It is deleted at the end of workstream 10.

---

## Acceptance criteria

- `pnpm --filter @kayu/web type-check` and `BACKEND_URL=http://localhost:3001 pnpm --filter @kayu/web build` pass with only placeholder pages for routes owned by 05–08.
- `grep -rn "AppShell\|k-display\|k-body\|--k-\|from \"@kayu/ui\"" apps/web/src/components/layout apps/web/src/app/layout.tsx apps/web/src/app/globals.css` returns nothing (except `tokens` if `globals.css` is generated from them).
- `grep -rln "Inter\|JetBrains" apps/web/src` returns nothing.
- Every deleted path in section D is absent; `git grep -l "components/map\|FinalOfferDialog\|launch-flags\|booking-v2" apps/web/src` is empty.
- Manual check in the dev token page at 320, 390 and 1440 px: no horizontal scroll (`document.documentElement.scrollWidth === window.innerWidth`), dock visible below `lg`, navbar pills visible at `lg`, footer only on the five allowed routes.
- Reduced-motion check: with `prefers-reduced-motion: reduce` emulated, no element animates on route change or pointer-down.
- Keyboard check: Tab reaches every navbar and dock link; focus ring is the 3 px gold outline.
- Redirect check: each row in section E returns 308 to the expected destination via `curl -I`.

## Verification commands

```sh
pnpm --filter @kayu/web type-check
BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… pnpm --filter @kayu/web build
# overflow probe, run against the dev server with Playwright installed in apps/web
node scripts/overflow-check.mjs --urls / /rechercher /dev/tokens --widths 320 390 1440
for p in /providers/x /book/x /auth /pro /messages /bookings /dashboard/admin; do curl -sI "http://localhost:3000$p" | head -3; done
```

`scripts/overflow-check.mjs` is added in this workstream: it opens each URL at each width and fails when `scrollWidth > innerWidth`. Workstream 10 extends the URL list to every route.
