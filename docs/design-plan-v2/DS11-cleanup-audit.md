# DS11 — Cleanup, cross-platform audit, v1 retirement

## Goal

Close the loop on v2. Retire the v1 dashboard stubs, audit tab bar + routing + role-based navigation on both platforms, verify no v1 holdovers remain, and update PROGRESS + the main DESIGN_SYSTEM doc with any decisions made during the iteration.

## Why it matters

v2 added 11 new chunks and touched most of the app. Without a deliberate cleanup pass, stale `/dashboard/*` routes, unused v1 components, and inconsistent tab bar behavior will drift back into production. DS11 is the contract that v2 is actually landed.

## Scope

### In scope
- **Retire v1 dashboard stubs** (web):
  - `apps/web/src/app/dashboard/admin/*` → replaced by `/admin`
  - `apps/web/src/app/dashboard/client/*` → replaced by `/bookings`, `/messages`, and the profile menu
  - `apps/web/src/app/dashboard/provider/*` → replaced by `/pro`
  - `apps/web/src/app/dashboard/settings/*` → move to `/settings` (or keep under `/pro/settings` and `/settings` depending on role)
- **Retire v1 mobile auth:** confirm `LoginScreen.tsx` / `RegisterScreen.tsx` are deleted (they were scheduled for deletion in DS02; DS11 verifies)
- **Confirm role-based mobile tabs** render correctly:
  - Client: Accueil / Rechercher / Réservations / Messages / Moi
  - Pro: Dashboard / Demandes / Messages / Gains / Moi
- **Confirm hide-tab-bar list** is respected:
  - Hidden on: `booking, profile, review, onboarding, auth, quote`
  - Visible on everything else
- **Cross-platform rendering parity**: spot-check each of the 15 screens at web 1280px and mobile 390px to catch drift
- **Token enforcement sweep**: no raw hex / shadow strings / borderRadius numbers in app code for the new chunks (DS02-10); tokens only
- **Accessibility audit** on the new screens: contrast, focus rings, touch targets, screen reader labels on all icon-only buttons (bell, phone, send, plus, etc.)
- **DESIGN_SYSTEM.md updates**: if DS02-10 surfaced a new pattern (e.g. phone input group, StepIndicator primitive), update the design system doc as §§new
- **PROGRESS.md close**: mark DS01-11 all done, note known TODOs (backend integration, camera access, real Mobile Money wiring, real-time messaging)
- **Retired-file list**: final list of files deleted with 1-line justification each

### Out of scope
- Implementing the deferred backend work (payout wiring, real KYC, etc.)
- Performance audit (bundle size, TTI) — separate chunk later
- End-to-end test suite coverage — separate engineering concern
- Any new visual decisions — DS11 is enforcement, not creation

## The retirement list

### Web (`apps/web/src/app`)

Delete — these are v1 stubs that v2 replaces:
- [ ] `dashboard/admin/page.tsx` (+ layout if present) → `/admin`
- [ ] `dashboard/client/page.tsx` (+ layout) → `/bookings`, `/messages`, etc.
- [ ] `dashboard/provider/page.tsx` (+ layout) → `/pro`
- [ ] `dashboard/settings/page.tsx` → `/settings` (new or retained, depending on whether DS11 ships the consolidated settings page) 
- [ ] `dashboard/layout.tsx` if unused after the children are deleted

Also purge:
- [ ] Any `v1-auth-page.tsx` or equivalent email-password login leftovers
- [ ] `apps/web/src/components/glass-*.tsx`, `glow-*.tsx` — killed in design plan v1 DS04 but verify again
- [ ] Sidebar nav routes pointing to `/dashboard/*`

### Mobile (`apps/mobile/src`)

Delete:
- [ ] `screens/auth/LoginScreen.tsx` (v1 email-password)
- [ ] `screens/auth/RegisterScreen.tsx` (v1 email-password)
- [ ] `components/common/LoadingScreen.tsx` — flagged in design plan v1 DS09 as a legacy ActivityIndicator-based component; should use `@kayu/ui/mobile/PageSkeletons` or `Shimmer` now
- [ ] Any v1 email-field imports or references

Confirm kept (these are fine):
- `screens/profile/ProfileScreen.tsx` — still the "Moi" tab destination for both roles (role-aware content is a future concern)
- `screens/profile/EditProfileScreen.tsx`
- `screens/profile/FavoritesScreen.tsx`
- `screens/profile/SettingsScreen.tsx`

## Role-based tab matrix

Verify the mobile navigator picks tabs based on `user.role`:

```
role === "CLIENT":
  Accueil → HomeStack
  Rechercher → SearchStack
  Réservations → BookingsStack  ← NEW (DS03)
  Messages → MessagesStack       ← NEW (DS04)
  Moi → ProfileStack

role === "PROVIDER":
  Dashboard → ProviderStack (DS06)
  Demandes → RequestsStack (DS07)
  Messages → MessagesStack
  Gains → EarningsStack (DS08)
  Moi → ProfileStack

role === "ADMIN":
  Falls back to CLIENT tabs (with a "use desktop" banner somewhere)
```

## Hide-tab-bar list

Verify across ALL the following screens:
- `home` → visible
- `search` → visible
- `bookings` → visible
- `messages` → visible
- `profile` (ProviderProfile) → **hidden** (sticky price bar replaces it)
- `booking` (BookingFlow) → **hidden**
- `detail` (BookingDetail) → visible (keeps the tab bar because chrome is minimal)
- `review` → **hidden** (wizard)
- `auth` → **hidden**
- `onboarding` → **hidden**
- `provider` (dashboard) → visible
- `requests` → visible
- `quote` → **hidden**
- `earnings` → visible
- `verify` → visible

## Token enforcement sweep

Grep rules across files modified in DS02-DS10:

```bash
# No raw hex
grep -rE '#[0-9A-Fa-f]{3,8}' apps/ --include='*.{ts,tsx}' | grep -v 'token' | grep -v '\.md'
# No inline boxShadow strings
grep -rE 'style=\{.*boxShadow' apps/ --include='*.{ts,tsx}'
# No raw borderRadius numbers > sm/md/lg/xl/pill
grep -rE 'borderRadius:\s*[0-9]+' apps/ --include='*.{ts,tsx}'
```

Exceptions that are OK:
- Decorative SVG fills in admin map/chart components (same as DS09 audit)
- The existing `PhotoTile` pattern that passes category tint colors via `PORTFOLIO_BG` — these come from tokens already, just used inline
- Admin-specific colors that derive from tokens (e.g. severity badges): OK if the source value is in `@kayu/ui/tokens.ts` even if the usage is inline

## Accessibility audit

For each of the 12 new/upgraded screens:

- [ ] Icon-only buttons have `aria-label` (or `accessibilityLabel` on mobile). Specifically check: phone, send, plus, filter, sliders, bell, settings, copy, trash, moreVertical
- [ ] Form inputs have associated labels (the `FieldLabel` component takes care of this for onboarding; verify custom fields in Auth, QuoteCompose, WriteReview)
- [ ] Rating buttons in WriteReview use `aria-label="N étoile(s)"`
- [ ] OTP slots in Auth use `aria-label="Chiffre N"`
- [ ] All interactive elements pass keyboard tab navigation on web
- [ ] Focus rings visible (2px Sky outline, 2px offset) on all interactive elements
- [ ] Color contrast: Sky 500 is never used as body text (use Sky 600); this stayed true in v2

## Cross-platform parity

Side-by-side visual check for each screen at 1280px web vs 390px mobile:
- Auth, MyBookings, BookingDetail, Messages, WriteReview, ProviderDashboard, JobRequests, QuoteCompose, Earnings, ProviderOnboarding, ProVerification, AdminOps (web only — no mobile check needed)

Record "match / minor drift / significant drift" for each.

## DESIGN_SYSTEM.md updates

If DS02-10 introduced patterns worth codifying in the main design system:
- [ ] `StepIndicator` component (shared across Onboarding, WriteReview, Verification)
- [ ] `BookingStatusChip` variants (4 status colors with pulsing dot on active)
- [ ] Country-picker tab segmented control (from Auth)
- [ ] OTP slot input pattern
- [ ] Work-tile abstract backgrounds (already documented in v1 as `PORTFOLIO_BG`; verify admin/ops doesn't deviate)
- [ ] Grouped-card-with-dividers pattern (already documented in v1 as `NearbyCard`; confirm MyBookings / JobRequests active list follows it)
- [ ] Admin denser visual language (smaller body, denser rows) — document if it's going to spread

Add an "§N — v2 additions" section to DESIGN_SYSTEM.md to scope these clearly.

## PROGRESS.md close

After the audit:
- Mark DS01-11 all `done`
- Update the "Current focus" section to point to next work (likely dashboards polish, notifications center, settings page)
- Note known TODOs under an "Open design issues" section (backend wiring, real Mobile Money, camera access for KYC, real-time messaging, admin user management)
- Timestamp the close

## Dependencies
- Requires DS01-DS10 all complete
- Blocks: none (this is terminal)

## Acceptance criteria

1. All files in the retirement list are deleted
2. Role-based tab matrix holds for both CLIENT and PROVIDER users on mobile
3. Hide-tab-bar list is enforced correctly on all 15 screens
4. Token enforcement sweep returns zero violations in new code (or documented exceptions)
5. Accessibility audit passes for all 12 new/upgraded screens
6. DESIGN_SYSTEM.md updated with v2 additions (new patterns, admin language notes)
7. PROGRESS.md marks DS01-11 all done with notes on open TODOs

## QA checklist
- [ ] Zero raw hex in `apps/web/src/app/{auth,bookings,messages,review,pro,admin}` folders
- [ ] Zero raw hex in `apps/mobile/src/screens` v2 files (excluding token imports)
- [ ] No `dashboard/*` route returns a 200 response
- [ ] Mobile navigator doesn't contain any reference to `target: "home"` placeholders
- [ ] Mobile Login/Register files no longer exist on disk
- [ ] `turbo run lint` passes
- [ ] `turbo run type-check` passes across `@kayu/web`, `@kayu/mobile`, `@kayu/ui`
- [ ] Spot-check on a CLIENT user account: Réservations tab → MyBookings; Messages tab → Messages
- [ ] Spot-check on a PROVIDER user account: Dashboard tab → ProviderDashboard; Demandes tab → JobRequests; Gains tab → Earnings
- [ ] `/admin` route is admin-only (CLIENT/PROVIDER redirect to `/`)
- [ ] All interactive elements on v2 screens have visible focus rings on web
- [ ] No `Activity Indicator` / spinner usage in new code — shimmer or skeletons only
- [ ] The `@kayu/ui` export list is up to date (StatCard, Sparkline, StepIndicator, Timeline, MessageBubble, MoneyChart are all exported)
- [ ] Cross-platform parity noted "match" on at least 10/12 screens; flag any "minor drift" with a follow-up ticket and any "significant drift" as a DS11 failure
- [ ] PROGRESS.md v1 and v2 both reflect done-state; AGENT-HANDOFFS.md prompts match the current chunk set
