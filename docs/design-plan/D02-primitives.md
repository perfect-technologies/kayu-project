# D02 — Primitives: Button, Input, Avatar, Chip, Icon, StarRating, Shimmer

## Goal

Ship the atomic UI vocabulary for both web and mobile, all derived from the `tokens` object from D01. Every primitive exists in two places: a web version (React + Tailwind, aligned with shadcn patterns) and a mobile version (React Native, styled from the theme object). They share identical props and behavior.

## Why it matters

These are used hundreds of times across every screen. Small inconsistencies here compound; get the atoms right, the molecules and pages go fast.

## Scope

### Components (web + mobile)
- **Button** — three variants (primary, secondary, ghost), three sizes (sm/md/lg)
- **Input** — with label, helper text, error state
- **Avatar** — initials fallback with brand color, online dot, optional ring
- **Chip** — sizes (sm/md), variants (neutral/success/warning/primary/accent/expert), optional leading icon
- **Icon** — lucide wrapper that enforces stroke 1.75 at 20/24
- **StarRating** — inline rating display (star + number + count)
- **TrustChip** — the 4-tier chip from DESIGN_SYSTEM §10
- **TopRatedRibbon** — the diagonal amber ribbon (web) + its pill equivalent (mobile) from DESIGN_SYSTEM §8.4 photo overlays
- **Shimmer** — shimmer placeholder bar/block for skeleton states

### Out of scope
- Photo-forward cards — those are D03
- Screen layouts — D04+

## Reference files
- `prototype/components/shared.jsx` — has reference implementations for `Avatar`, `StarRating`, `TrustChip`, `TopRatedRibbon`, `CategoryTile`, plus all icons as SVG `path`s
- `prototype/tokens.css` — `.k-btn`, `.k-btn-primary/secondary/ghost/lg/sm`, `.k-input`, `.k-chip`, `.k-chip-sm`, `.k-chip-*` — the token-level CSS classes
- DESIGN_SYSTEM §8.1 (Button), §8.2 (Input), §8.5/§10 (TrustChip, TopRatedRibbon)

## Components in detail

### Button
Props: `variant: "primary" | "secondary" | "ghost"`, `size: "sm" | "md" | "lg"`, `leadingIcon`, `trailingIcon`, `loading`, `disabled`, `fullWidth`, standard HTML button props.

- Primary: Sky-500 bg, white text; hover → Sky-600; focus ring Sky-500
- Secondary: Paper bg, Ink text, 1px Slate-200 border; hover → Slate-100 bg
- Ghost: no bg, no border, Sky-600 text; hover → Sky-50 bg
- Sizes: sm 32px, md 40px, lg 48px
- Radius: 12 (all sizes)
- Loading: **keep width stable**, swap label for a 16×6 shimmer bar (DESIGN_SYSTEM §8.1)
- Active: scale 0.98 over 120ms

**Web:** Tailwind classes + headless button. `class-variance-authority` is fine.
**Mobile:** Pressable with `pressIn`/`pressOut` scale animation; no hover states (RN).

### Input
Props: `label`, `helperText`, `error?: string`, `leadingIcon`, `trailingIcon`, standard input props.

- 44px height
- 1px Slate-200 border, Paper bg, radius 12
- Focus: Sky-500 border + 3px `rgba(14,165,233,0.12)` ring (DESIGN_SYSTEM §3.3 `primarySubtle` at lower opacity)
- Error: Rose-600 border, Rose-600 helper text, `AlertCircle` leading helper
- Label is **always** above the input (never floating) — §8.2 states this explicitly
- Helper text always reserves a 20px line below to prevent layout jump

### Avatar
Props: `name`, `bg`, `size`, `initials?`, `online?`, `ring?`, `src?` (future — photo URL).

- Radius: 9999 (pill)
- Default bg fallback by hashing name → one of 8 brand colors
- Initials: first letter of each word, max 2 letters
- Online: 24%-of-size emerald dot bottom-right with 2px Paper ring
- Ring variant: 2px Paper + 2px Sky ring (used when avatar sits on a category-tinted background and needs contrast separation)
- Font: Plus Jakarta Sans 600, font-size ≈ 0.38× size

Reference: `prototype/components/shared.jsx` `Avatar` function — identical shape.

### Chip
Props: `variant`, `size`, `leadingIcon`, `children`.

- Pill shape, 28px (md) / 22px (sm)
- sm uses Caption-like weight 600, tracking 0.01em
- Variants: `neutral` (Slate-100 bg, Slate-700 text), `success` (Emerald-50 bg, #047857 text), `warning` (Amber-50 bg, #B45309), `primary` (Sky-50 bg, Sky-600 text), `accent` (Coral-50 bg, #BE123C), `expert` (Indigo-50 bg, Indigo-600 text)

### Icon
Tiny wrapper: `<Icon size={20} stroke={1.75}>{pathJSX}</Icon>` on web. On mobile, re-export `lucide-react-native` components but force `strokeWidth={1.75}` via a wrapper. Export a named `I.*` record for common icons: search, mapPin, star, heart, badgeCheck, shieldCheck, award, clock, wrench, messageCircle, coins, zap, sparkles, scissors, laptop, leaf, paintbrush, car, hammer, arrowRight, arrowLeft, chevronRight, chevronDown, menu, x, filter, sliders, home, user, calendar, inbox, plus, check, share, phone, send.

Reference: `prototype/components/shared.jsx` has the `I` object with all these paths — can be transcribed directly.

### StarRating
Props: `value: number`, `count?: number`, `size?: number`.

Renders: filled amber Star (size), value with 1-decimal precision in tabular numerals, optional `(count)` in Slate-500.

### TrustChip
Consumes `trust: "NEWCOMER" | "ESTABLISHED" | "TRUSTED" | "EXPERT" | "TOP_RATED"`. Returns a Chip with the correct variant + label (French):
- NEWCOMER → neutral "Nouveau"
- ESTABLISHED → neutral "Établi"
- TRUSTED → success with `BadgeCheck` icon "De confiance"
- EXPERT → expert variant with `ShieldCheck` "Expert"
- TOP_RATED → **not rendered as a chip** — it's a ribbon on the card (see TopRatedRibbon below); this chip returns null for TOP_RATED to avoid double-signaling

### TopRatedRibbon
The diagonal Amber ribbon in the top-left corner of a photo card (web featured) or a Paper card (web profile hero).

Props: parent must be `position: relative; overflow: hidden; border-top-left-radius: inherit`.

Renders a 120px translucent-rotated ribbon at 14px from top, -24px left, rotate(-45deg), `linear-gradient(90deg, #F59E0B, #FBBF24)` bg, white 10px uppercase text "Top Rated" with `Award` icon, amber drop shadow.

**On mobile photo cards**, this ribbon is replaced by a small ink-90% pill at bottom-left of the photo saying "Top rated" with an Award icon (see prototype `FeaturedProviderCard` / `WideProviderCard`). Ribbon is web-featured only.

### Shimmer
Props: `width`, `height`, `radius?`.

- Web: a span with linear-gradient keyframe animation (1600ms linear infinite), `background-size: 800px 100%` (the `.k-shimmer` class from tokens.css)
- Mobile: Reanimated-powered loop or `LinearGradient` + `Animated.Value` driving `translateX` on a child masked to the component bounds

Used in D03 card skeletons, D07 booking loading, D08 list loading states.

## Dependencies
- Depends on D01 (tokens and fonts ready)
- Blocks D03, D04, D05, D06

## Acceptance criteria
1. All 8 primitives exported from `@kayu/ui` (web) and usable in `apps/web`
2. All 8 primitives usable in `apps/mobile` (as RN components sharing the same prop surface)
3. Visual parity: rendering the same props in both platforms produces near-identical pixel output at matching device widths (allow OS-level font metric differences)
4. No primitive references a raw hex or raw px — everything pulls from `tokens`
5. Keyboard accessibility: Button + Input have visible focus rings on web; RN tab order works for Button
6. Touch targets ≥ 44px on mobile for all interactive primitives
7. Smoke-test screen from D01 now also renders every primitive at every variant

## QA checklist
- [ ] Button primary at `md` size matches the prototype's `.k-btn.k-btn-primary` exactly (color, radius, height, padding)
- [ ] Button loading state keeps layout width stable (no jiggle on state change)
- [ ] Input focus ring is visible on all 3 keyboard-navigation orderings
- [ ] Input error state shows the Rose border AND the leading helper icon
- [ ] Avatar online dot renders at 24% of size with 2px Paper ring, bottom-right
- [ ] TrustChip "Expert" has `ShieldCheck` icon at 12px and Indigo-50 bg + Indigo-600 text
- [ ] TopRatedRibbon clips to the parent's top-left corner (no overflow)
- [ ] Icon stroke is 1.75 at default; passing `stroke={2}` overrides it
- [ ] StarRating renders `4.9 (127)` with tabular numerals (digits align in a column)
- [ ] Shimmer loops at 1600ms and doesn't jank on mobile at 120fps devices
