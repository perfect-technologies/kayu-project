# D06 — Mobile screens: Home, Search, Provider Profile

## Goal

Build the three core marketplace screens on mobile using the Airbnb-inspired patterns: photo-forward cards, shrinking sticky search, category strip, grouped nearby list, full-screen filter sheet, full-bleed profile photo hero, and sticky price/reserve bar.

## Why it matters

These three screens are ~80% of user time. Mobile-first audience. Getting them to feel like Airbnb but read like KAYOU is the whole point of the design pass.

## Scope

### In scope — `apps/mobile/src/screens/`
- `home/HomeScreen.tsx` — discovery with shrinking search, categories, featured carousel, nearby grouped list, CTA
- `search/SearchScreen.tsx` — compact search header, filter pills, full-width results list, Liste/Carte toggle, full-screen filter sheet
- `search/CategoryScreen.tsx` — tapping a category strip item with `slug` lands on a pre-filtered search (visually just a filtered SearchScreen; no new screen component needed, but route config must support `route.params.category`)
- `profile/ProviderProfileScreen.tsx` — full-bleed photo hero, floating nav, overlapping avatar, divided stat row, sections with dividers, sticky price/reserve bar
- `search/components/MobileFilterSheet.tsx` — full-screen sheet with dismiss X, progress indicator row, filter panel, sticky "Voir N résultats"

### Out of scope
- Booking flow (D07)
- Kayou Moment confirmation (D08)
- Bookings list / Messages / Profile (Moi) tabs — later chunks

## Reference files
- `prototype/components/Homepage.jsx` — **`MobileHome`** at the bottom of the file. Use as pixel reference for shrinking header, search pill, category strip, featured carousel, nearby grouped card, CTA.
- `prototype/components/SearchPage.jsx` — **`MobileSearch`** at the bottom. Compact sticky header, category strip, filter pills, WideProviderCard list, floating Liste/Carte toggle, full-screen filter sheet.
- `prototype/components/ProviderProfile.jsx` — the **mobile branch** (early in the file, guarded by `if (mobile)`). Full-bleed photo hero, floating header buttons, overlapping avatar, stat-row with vertical dividers, sections with thin dividers, sticky price/reserve bar.
- DESIGN_SYSTEM §9.1 (home), §9.2 (search), §9.3 (profile), §8.6 (grouped list), §8.9 (sticky price bar), §8.10 (full-screen sheet)

## Screen-by-screen

### HomeScreen

Layout (vertical scroll, padding-bottom 100 to clear the tab bar):

1. **Shrinking search header** — from D05. `scrolled` state wired via `useShrinkOnScroll`. Tapping search pill navigates to `SearchScreen`.
2. **CategoryStrip** — horizontal scroll (D03), no active state on home (no filter yet). Tapping an item navigates to `SearchScreen` with `category: slug` param.
3. **Hero intro block** — padding 18 20 4:
   - Display-L headline "Le bon pro," / "près de toi." (26px, no gradient)
   - Body subtitle "Des pros vérifiés à Kinshasa, prêts à intervenir."
4. **Featured carousel** — marginTop 22:
   - Header: "Top pros cette semaine" (Display-L 20px) + underlined "Tout voir" link right
   - `FlatList` horizontal or a `ScrollView` with snap — scroll-snap-type: x mandatory, gap 14, 20px left/right padding, 8px bottom padding
   - Items: `FeaturedProviderCard` at 78% viewport width, max 320. 4 cards from PROVIDERS.
5. **Nearby grouped section** — marginTop 26, padding 0 20:
   - Header: "Près de toi" + underlined "Carte" link right
   - `NearbyCard` wrapping 4 `NearbyRow`s (D03). One outer Paper card with dividers.
6. **How it works** — minimal mobile `HowItWorks` (shared function from prototype, mobile flavor): 3 stacked Paper cards, each with number + title + desc.
7. **Provider CTA** — small coral-gradient card (Coral-50 → Coral-100), `radius.lg`, 22px padding, overline "Pour les pros", Display-M title "Tu es un pro ? Rejoins-nous.", Body copy, `primary` CTA "Devenir pro →". Coral radial blob decoration absolute.

### SearchScreen

Full page under the tab bar, `padding-bottom: 110` for the tab bar + floating toggle:

1. **Sticky compact header** — position sticky top 0, zIndex 10, Sand bg, padding-top 10:
   - Row: `FloatingBackButton` → nav("home"), search pill (showing query + result count), sliders IconButton → opens filter sheet
   - Search pill: 40px height, Paper bg, `radius.pill`, `elev.e2`, contains search icon + bold query + Caption "Kinshasa · N pros"
   - Below row: `CategoryStrip` with active state set from `filters.category`. Tapping toggles the category.
   - Below strip: horizontal scroll of `FilterPill`s: Disponible / Vérifié / < 20 km / Top rated / Expert (each toggles local filter state)

2. **Result summary row** — padding 6 20 14, flex baseline space-between:
   - Left: "N pros disponibles" (Display 19px, 700 weight)
   - Right: ghost "Trier ▾" button

3. **Results body**:
   - List view (default): vertical grid of `WideProviderCard`s, 16px gap, 20px horizontal padding
   - Map view: full-width stylized map panel (same as web, scaled). Vertical height ~500.

4. **Floating Liste/Carte toggle** — position fixed, left 50% translateX(-50%), bottom 84 (above tab bar), zIndex 25:
   - Ink-900 pill, white text, 14px semibold, icon + label
   - `<I.mapPin/> Carte` or `<I.menu/> Liste`

5. **MobileFilterSheet** — conditionally rendered when `sheetOpen`:
   - `position: absolute; inset: 0; zIndex: 20; background: rgba(15,23,42,0.4)` (overlay)
   - Inside: flex column, `flex: 1` spacer on top, then a Sand sheet with `radius.xxl` top corners only
   - Sheet: padding 14 20 24, `max-height: 82%`, scrollable
   - Grab handle: 40×4 Slate-strong rounded bar, centered, 16px bottom margin
   - Header row: "Filtres" heading + X IconButton
   - Body: the full `FilterPanel` (same as web, reused)
   - Sticky bottom primary button: "Voir N résultats" — full width lg

Filter sheet is NOT a half-sheet; it's a near-full-screen modal. Only the top ~18% of the screen shows the overlay; everything else is filter content.

### ProviderProfileScreen

Layout (with `padding-bottom: 110` for the sticky price bar):

1. **Full-bleed photo hero** — aspect 5/4, full viewport width:
   - Background: PhotoTile (abstract work tile) for the provider's primary category
   - **Floating header row**: absolute top 14, left 14, right 14, flex space-between, zIndex 2
     - Left: `FloatingBackButton` → navigates back (nav("search") or `navigation.goBack()`)
     - Right: `FloatingShareButton` + `FloatingHeartButton`
   - **Specialty tag**: top 74, left 16 (below the floating buttons) — Paper-94% with blur(6px), pill, mono font, category accent color
   - **Top-rated pill**: left 16, bottom 74 (above the avatar overlap) — Ink-90% bg, white text, pill
   - **Overlapping avatar**: left 50%, bottom -40, translateX(-50%). Inside: 4px Sand "ring" around an 88px Avatar with online dot. The Sand ring makes the avatar bleed out of the photo hero cleanly.

2. **Identity block** — padding 54 24 0, centered text:
   - Name (Display 24px) + BadgeCheck inline (18px, Emerald)
   - Body-M profession in Slate-500
   - Caption row: `[MapPin]` + "{city}, {commune}"

3. **Divided stat row** — margin 18 20 0:
   - 3-column grid, `border-top: 1px Slate-100`, `border-bottom: 1px Slate-100`, padding 14 0
   - Middle cell has left+right 1px Slate-100 borders
   - Each cell centered; small icon (or nothing) + big number + Caption label
   - Cells: Star + 4.9 / 127 avis | 284 / missions | ~15 min / réponse (response colored Emerald if `includes("min")`)

4. **Trust chips row** — padding 16 20 0, flex wrap, 6px gap:
   - `TrustChip` (the enum-mapped chip), Identité vérifiée chip, Assurance RC Pro chip

5. **Sections** — each padded 24 20 0, followed by a thin divider (`height: 1, background: borderSubtle, margin: 24 20 0`):
   - À propos: bio + skills chip cloud + certifications list + zones chip cloud
   - Évaluations KAYOU: Caption "Notes par dimension" + RatingsTab (5 rows with score color)
   - Portfolio: 2-column work-tile grid (aspect 4:3)
   - Avis · 127: ReviewsList (3 reviews, then secondary "Voir tous les avis")

6. **Sticky price/reserve bar** — `StickyBottomBar` from D05:
   - Left block: Price 17px underlined (3px offset) + `/h` Slate-500 small, then Caption with Star + rating + "· {reviews}"
   - Right: 44×44 round secondary `MessageCircle` IconButton + `primary` "Réserver" (height 46, padding 0 20, fontSize 14)
   - `flex: 1` spacer between left and right

Tapping Réserver → navigates to `/book/{p.id}` (Booking flow — D07).

## Dependencies
- Depends on D03 (photo cards), D05 (shell)
- Depends on migration chunks 05, 06 (providers + bookings backend exists)
- Blocks D07 (booking flow — needs Réserver navigation from profile)

## Acceptance criteria
1. HomeScreen shrinking header: scrolling past 40px collapses brand row and compacts search pill
2. Featured carousel scroll-snaps at item starts; cards are 78% viewport, 4 visible on swipe
3. Nearby grouped card renders 4 `NearbyRow`s inside ONE outer Paper card with dividers
4. SearchScreen filter sheet opens as full-screen overlay, not a half sheet
5. Filter pills in SearchScreen visually update when tapped and filter the result list
6. Map/List toggle on SearchScreen is a black pill floating above the tab bar
7. ProviderProfileScreen photo hero is full-bleed edge-to-edge at the top
8. Avatar on profile overlaps the photo hero bottom edge and appears to sit between the photo and the identity block
9. Stat row has a vertical 1px divider between each cell
10. Sticky price/reserve bar on profile hides the floating tab bar

## QA checklist
- [ ] Tapping the search pill on Home navigates to SearchScreen (doesn't require keyboard open)
- [ ] CategoryStrip press-down feedback is visible (opacity or scale)
- [ ] Tapping a FeaturedProviderCard navigates to the provider profile
- [ ] Heart toggle in FeaturedProviderCard stops event propagation (doesn't navigate)
- [ ] NearbyCard with 4 rows has exactly 3 dividers (none on last row)
- [ ] SearchScreen result count updates in the search pill when filters change
- [ ] FilterSheet "Voir N résultats" button shows the correct pending count
- [ ] Sliders IconButton on SearchScreen header opens the filter sheet smoothly
- [ ] ProviderProfileScreen: back arrow navigates back, not forward
- [ ] Profile photo hero specialty tag does not overflow on narrow screens (390px)
- [ ] Profile overlapping avatar is not clipped by the photo's border-radius (hero has 0 radius on mobile)
- [ ] Profile sticky price bar price is underlined
- [ ] Tab bar is hidden on Profile (not just covered by the sticky bar — actually unmounted)
- [ ] Profile "Réserver" navigates to Booking flow
- [ ] All screens render safely on iPhone 14 Pro (notch) and Pixel 7 (rounded corners + gesture bar)
