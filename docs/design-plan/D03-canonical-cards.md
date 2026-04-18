# D03 — Canonical cards: the photo-forward system

## Goal

Ship the photo-forward provider card system — the component vocabulary for 90% of KAYOU's surfaces. Web and mobile share these components; they just compose differently on the page.

## Why it matters

The entire marketplace experience is provider cards. Featured carousels, search results, nearby lists, favorites — every list is one of these three variants. Getting the system right is the biggest force-multiplier in the plan.

## Scope

### Components
- **FeaturedProviderCard** — 4:5 photo aspect, carousel item
- **WideProviderCard** — 16:11 photo aspect, full-width (search results, favorites)
- **NearbyRow** — 84×84 mini-tile + meta + price, grouped inside a parent card
- **NearbyCard** — the outer Paper container that wraps N NearbyRows with dividers
- **CategoryTile** — static category card (icon square + label + count) for the web homepage
- **CategoryStrip** — mobile horizontal-scroll category icons
- **PhotoTile** — abstract "work tile" renderer (primitive the three provider cards compose from)
- **Skeletons** — for each of the above (shimmer placeholders matching layout)

### Out of scope
- Hover animations beyond the standard card lift (page-specific polish lives in D04/D06)
- Infinite scroll / virtualization (data-layer concerns; feature migration plan)

## Reference files
- `prototype/components/shared.jsx` — `CategoryTile` (v1, gets an update here), legacy `ProviderCard` (v1, retired as canonical but kept for admin dense lists)
- `prototype/components/MobileShell.jsx` — **the whole v2 system**: `FeaturedProviderCard`, `WideProviderCard`, `NearbyRow`, `CategoryStrip`, `PORTFOLIO_BG`. This file is the most important reference in the plan.
- DESIGN_SYSTEM §8.4 (ProviderCard anatomy), §8.5 (work tile pattern), §8.6 (grouped list row), §6 (category icons)

## Component specs

### PhotoTile (primitive)

```
<PhotoTile
  category={p.categories[0]}
  aspect="4/5" | "16/11" | "1/1"
  ariaLabel="…"
>
  {children} // overlays
</PhotoTile>
```

Renders:
- Outer div with `background: tokens.portfolio[category].bg`
- `backgroundImage`: two radial gradients at 25%/20% and 80%/80% using `{accent}26` then `{accent}1a` opacity, plus a repeating-linear-gradient(135°) with `{accent}14` at 20px spacing (see DESIGN_SYSTEM §8.5)
- Centered subtle category icon (24px, `accent` color, 12% opacity) as ambient texture
- Slot: `children` for overlays (specialty tag, heart button, top-rated pill, avatar)

Expose `aspect` as a prop so consumers decide.

### FeaturedProviderCard

Aspect of photo: `4/5`. Used in horizontal carousels (mobile home "Top pros cette semaine") and in 3-column grid on web featured section.

**Photo area (PhotoTile at 4/5):**
- Top-left overlay: specialty tag — `Paper` 92% opacity + `backdropFilter: blur(6px)`, 999 radius, 5px 10px padding, mono font 10px weight 600, category.accent color, `{categoryIcon} {categoryLabel}`
- Top-right overlay: heart button — transparent bg, 22px heart, white with drop-shadow when unfavorited, coral filled when favorited
- Bottom-left overlay (if `topRated`): ink-88% bg pill, white, 11px weight 600, `Award` + "Top rated"
- Bottom-right overlay: 42px Avatar with 2px Paper border and online dot if applicable

**Meta area (white, 14–16px padding):**
- Row 1: Name (16px Display 600, ellipsis) + small BadgeCheck (verified) on left; Star + rating on right. Tabular numbers.
- Row 2: `{profession} · {commune}` in Body-M Slate-500
- Row 3: `Répond en ~{response}` in Caption. Emerald when "min", Slate-500 otherwise.
- Row 4: Price — `{hourly.toLocaleString("fr-FR")} FC` in mono 15px weight 600, **underlined** (3px offset), " /h" in Slate-500 smaller weight

**Card shell:**
- Paper bg, `radius.xl` (20), `elev.3`, `overflow: hidden`
- Width: 78% of carousel viewport (mobile) or flex-filled (web 3-col grid)
- No border

**Interactive:**
- Whole card is a link/button to the provider profile
- Heart click stops propagation, toggles favorite state
- Press on mobile: scale 0.98 for 120ms

### WideProviderCard

Full-width, used on mobile search and web search list. Photo aspect `16/11`.

Same overlays as Featured, same meta structure but laid out with more horizontal room:
- Photo + specialty tag + heart + top-rated + avatar overlap (all same as Featured)
- Meta: 14px 16px padding
  - Row 1: Name + verified; Star + rating + "(127)" on the right
  - Row 2: `{profession} · {commune} · {distance} km`
  - Row 3: response time caption
  - Row 4: price **underlined** (Airbnb's price-link pattern); " /heure" Slate-500

Card shell: Paper, `radius.xl` (20), `elev.3`, no border.

### NearbyRow + NearbyCard

Nearby sections use the **grouped card** pattern.

**NearbyCard (outer):**
- Paper bg, `radius.xl` (20), `elev.3`
- Padding: `4px 16px` (rows handle their own vertical padding)
- Contains N `NearbyRow` children

**NearbyRow:**
- `display: flex; gap: 12px; padding: 12px 0; align-items: center`
- `border-bottom: 1px solid tokens.color.borderSubtle` except on `last`
- Left: 84×84 mini PhotoTile (aspect `1/1`, `radius: 14`, `elev: e1`) with:
  - small category icon top-left (14px, tinted)
  - small 28px Avatar bottom-right
- Middle (flex:1): name + verified; `{profession} · {distance} km` 13px; row with star+rating+(count) and response-time caption side-by-side
- Right (text-align: right): `{(hourly/1000).toFixed(0)}k FC` in Price 14px; Caption "/heure" Slate-500

Pressable (whole row). No hover shadow (the parent card handles containment).

### CategoryTile (web)

Replaces v1. Used on web homepage "Trouve ton métier" grid (6 cols).

- Paper card, `radius.lg` (16), 1px Slate-200 border, `elev.1`
- Padding: 20px
- Top: 48×48 rounded square (`radius: 10`) with `categoryTint.bg` background and `categoryTint.fg` icon (24px)
- Heading (17px Display 600) + Caption count "{count} pros"
- Hover (web): `translateY(-2px)` + bump to `elev.2`
- Text alignment: left, no wrap on label

Note: unlike v1, this tile **keeps its border** because it's a nav/discovery tile, not a content card. Shadow alone would make the homepage grid too visually heavy.

### CategoryStrip (mobile)

Horizontal-scroll row used on mobile Home (discovery) and mobile Search (filter).

- `display: flex; gap: 28; overflow-x: auto; padding: 0 20 12; scroll-snap-type: x mandatory`
- Each item: 52px min-width, `scroll-snap-align: start`
- Content: 22px Lucide icon + 11px label, stacked, center-aligned
- Active: 2px ink-900 border-bottom on the item, opacity 1
- Inactive: transparent border, opacity 0.64
- Transition: opacity and border-color at 160ms standard

### Skeletons

For each card variant, ship a skeleton that matches exact layout with shimmer placeholders instead of content. These go in the loading state for D06/D07.

- `FeaturedProviderCardSkeleton` — photo area is solid shimmer, meta lines are 4 shimmer bars
- `WideProviderCardSkeleton` — same principle, 16:11 shimmer
- `NearbyRowSkeleton` — 84×84 shimmer + 3 meta lines + price block

## Dependencies
- Depends on D02 (Avatar, StarRating, Icon, TrustChip, TopRatedRibbon, Shimmer primitives)
- Blocks D04 (web pages) and D06 (mobile screens)

## Acceptance criteria
1. All cards compose cleanly from D02 primitives — no re-implementation
2. `PhotoTile` renders the work-tile pattern deterministically per category
3. Card shadows match DESIGN_SYSTEM §5.3 values precisely (`elev.3` for photo-forward)
4. Underlined price + tabular numbers render on both platforms
5. Favoriting via heart button is purely visual (state owned by parent); no internal state
6. Skeletons match the layout dimensions of the real cards within ±2px
7. Nearby grouped card renders 4 rows without visual clutter at 390px mobile width

## QA checklist
- [ ] FeaturedProviderCard at 4:5 aspect, photo overlays positioned per spec (corners + bottom-right avatar overlap)
- [ ] Heart unfavorited state: white icon with drop-shadow so it reads on any photo tone
- [ ] Heart favorited state: solid coral fill
- [ ] Top-rated pill sits at bottom-left, not clipped by avatar overlap
- [ ] Specialty tag's `backdrop-filter: blur(6px)` works on iOS Safari and falls back cleanly elsewhere
- [ ] Meta Row 1: verified BadgeCheck is inline right of the name, not wrapping
- [ ] Meta Row 4: price is underlined with 3px underline offset, "/h" smaller and Slate-500
- [ ] WideProviderCard renders correctly at 358px (390px viewport - 32px horizontal padding)
- [ ] NearbyCard handles 2 / 4 / 6 rows without the outer shadow looking weird
- [ ] NearbyRow press feedback triggers on iOS and Android
- [ ] CategoryTile hover on web lifts 2px, shadow bumps
- [ ] CategoryStrip scroll-snaps to item starts on touch
- [ ] Skeletons don't layout-shift when real content loads (same dimensions ±2px)
