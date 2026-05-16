# KAYOU Design System

> Trust travels light.

This document holds the **foundations** — brand identity, color tokens, typography, spacing, radius, elevation, motion, and the philosophy that hasn't changed. Every token here maps directly to `@kayu/ui`.

> **Direction update (2026-05):** the homepage, marketplace card patterns, and trending/discovery behavior moved away from the original Airbnb-heavy photo-forward direction toward a flatter, restrained system. **The current source of truth for those patterns is [`docs/design-direction/index.html`](./design-direction/index.html).** Two sections below — §1 "What Airbnb teaches us" item #2 and §8.4 "ProviderCard — photo-forward" — are explicitly superseded; the rest of this document still applies.

---

## 1. Philosophy

KAYOU is a marketplace for trust in a market where "hiring a professional through an app" is still new. The design must do the reassurance that a well-known brand does elsewhere — not through corporate weight, but through **warmth, clarity, and unmistakable signals of credibility**.

The feel we're after: **optimistic, confident, human, modern** — the kind of product a young team in Kinshasa would be proud to ship and a grandparent in Matadi could actually use.

### Inspirations
- **Airbnb** *(primary — especially mobile)* — floating bottom tab bar, shrinking sticky search, photo-forward cards with heart top-right, sticky bottom price/reserve bars, full-screen filter sheets, grouped list cards with dividers, soft lifted shadows instead of heavy borders. The Airbnb mobile app is the single strongest reference for KAYOU's mobile feel.
- **Thumbtack** — approachable search, friendly photography, non-corporate palette (category discovery patterns)
- **Linear** — precision, tight typography, confident whitespace (admin/settings screens)
- **Stripe marketing** — generous scale, expressive display typography (web hero only)

### What Airbnb teaches us, explicitly

> Items 1 and 2 below are **superseded** by `docs/design-direction/`. We now lean toward 1px borders with soft hover lift (not shadow-only), flat avatars with categories in chips (not photo-forward overlay cards with hearts/specialty tags/avatar overlap). Items 3–10 still apply.

1. **Shadows over borders.** Cards feel lifted, not stamped out. A two-layer soft shadow (outer spread + inner tight) replaces most 1px borders.
2. **Photo-forward discovery.** The card *is* the image. Metadata comes below. A heart button overlays the photo top-right. Status (top-rated, verified) lives on the photo, not in a text chip elsewhere.
3. **Sticky shrinking search.** The top search bar stays visible while scrolling but shrinks — the brand row fades out, the search pill compacts.
4. **Floating bottom tab bar (mobile).** Rounded pill, icon-only (no labels), always visible except when a sticky sheet/CTA takes over.
5. **Sticky price bar replaces chrome.** On a listing/profile, the bottom tab bar hides and a "price + reserve" bar takes its place.
6. **Full-screen modal sheets, not dropdowns.** Filters, booking flow, any multi-field action opens a full-screen sheet with a close X top-left, step indicator top-right, and a sticky bottom CTA.
7. **Grouped list rows share one card.** Instead of N bordered rows, put them in ONE white card with thin 1px dividers.
8. **Big bold step titles.** "Quel service ?" at 28px display weight instead of small form labels.
9. **Lists use icon-in-tinted-square as the left adornment** (booking summary rows, settings rows). More visual rhythm than bare text.
10. **Stat rows with internal vertical borders.** 3 stats side-by-side separated by 1px vertical rules, not 3 separate cards.

### We are NOT
- Corporate blue SaaS (too cold, too HR)
- Dark/tech-gamer (wrong audience, wrong market)
- iOS-Cupertino or Android Material-You on mobile. **Explicitly rejected** — we want a product that feels like "KAYOU" on both platforms, with Airbnb's cross-platform discipline. (User rejected a fully iOS-native mobile pass during design: *"I didn't mean to have fully Cupertino UIs."*)
- African-print cliché — **no kitenge patterns, no flag tri-color stripes**, no "Africa-shaped" graphics. KAYOU is a Congolese product designed at world standard, not a product designed *about* being Congolese.
- Over-minimal monochrome (we'd lose warmth)
- Decorative / illustration-heavy (we'd lose trust)
- Heavy-bordered flat cards (the user's exact feedback: *"airbnb has cards and shadows, ours is way more flat with only borders. I don't like it."*). Borders are a last resort; shadows and photos do the containment work.

### Six Principles

1. **Clarity over cleverness.** A plumber should understand their dashboard on first open.
2. **Warmth beats wow.** Humanity and breathing room win against novelty and density.
3. **Trust earns the interface.** Verified badges, ratings, response times, and certifications are never buried.
4. **Light, always.** No dark mode. Our audience reads in daylight, phones often on low brightness outdoors. Light is easier to photograph work against. Light is what the market expects.
5. **Mobile pounds first.** ~80% of sessions will be mobile. Design for 390px, then stretch.
6. **One action per screen.** Every view has a primary thing to do. It's bigger, bolder, and the color of the brand.

---

## 2. Brand Identity

### Name
**KAYOU** — set in display weight, all-caps only for the wordmark. In running text it's always `KAYOU` (caps) or `Kayou` (mixed), never `kayou`.

### Tagline
**"Trouvez la bonne personne."**
English fallback: *"Find the right person."*

Alternatives for secondary surfaces:
- *"Des pros, près de chez vous."*
- *"Le métier, près de toi."*

### Tone of voice
- Direct, not formal. *"Demande un devis"* > *"Veuillez solliciter un devis"*.
- French by default. Lingala or Swahili terms are welcome where they fit naturally (e.g. *"mbote"* greeting), but never forced.
- Money is stated clearly and up front. Prices never hidden behind "contact for quote."
- Confirmations are warm, not bureaucratic. *"C'est noté, Jean te recontacte sous 1h."* > *"Votre demande a été enregistrée avec succès."*

---

## 3. Color System

The palette is small, opinionated, and named. Every token is a CSS variable in `@kayu/ui` and a typed export for React Native.

### 3.1 Core palette

| Token | Hex | Role |
|---|---|---|
| **Sky 500** *(primary)* | `#0EA5E9` | Primary actions, brand surfaces, links, logo |
| **Sky 600** | `#0284C7` | Hover / pressed on primary |
| **Sky 50** | `#F0F9FF` | Primary-tinted backgrounds (subtle) |
| **Coral 500** *(accent)* | `#FB7185` | Warmth accents, highlights, heart/favorite, category pops |
| **Coral 50** | `#FFF1F2` | Coral-tinted backgrounds |
| **Emerald 500** *(trust)* | `#10B981` | Verified, trust score high, success, online |
| **Emerald 50** | `#ECFDF5` | Success background tint |
| **Amber 500** *(attention)* | `#F59E0B` | Warning, pending, premium, rating stars |
| **Amber 50** | `#FFFBEB` | Warning tint |
| **Rose 600** *(danger)* | `#E11D48` | Destructive, error, cancellation |
| **Indigo 600** *(expert)* | `#4F46E5` | Reserved: **Expert** trust tier badge only |
| **Indigo 50** | `#EEF2FF` | Expert badge background tint |

> **Pairing note:** Sky + Coral is a deliberate warm/cool pairing. Cool primary keeps the UI calm and trustworthy; coral drops warmth exactly where the product needs emotion (favorites, highlights, category pops, the "Kayou Moment"). Together they read as fresh and human, never corporate.

### 3.2 Neutrals — "warm slate"

Warm, slightly blue-leaning grays. **Never pure black.** Pure black on a light UI reads as cheap.

| Token | Hex | Use |
|---|---|---|
| **Ink** | `#0F172A` | Primary text, headings (not `#000`) |
| **Slate 700** | `#334155` | Body text |
| **Slate 500** | `#64748B` | Secondary text, metadata |
| **Slate 400** | `#94A3B8` | Placeholder, disabled text |
| **Slate 200** | `#E2E8F0` | Borders, dividers |
| **Slate 100** | `#F1F5F9` | Disabled surfaces, hover backgrounds |
| **Sand** | `#FAFAF9` | **App background — warm off-white, not pure white** |
| **Paper** | `#FFFFFF` | Cards, sheets, elevated surfaces |

> **Design opinion, not negotiable:** the base background is `Sand` (`#FAFAF9`), not `#FFF`. This single choice is the single biggest lever for making the app feel warm and human instead of cold and clinical. Cards sit on top in `Paper` (`#FFFFFF`), creating a subtle warm-on-white lift without a single shadow.

### 3.3 Semantic tokens

These are what components consume. Never reference raw scale values in components — consume the semantic token so theming is one-change-away.

```ts
// @kayu/ui tokens
export const color = {
  // Surfaces
  bg:              '#FAFAF9',  // Sand
  surface:         '#FFFFFF',  // Paper
  surfaceMuted:    '#F1F5F9',  // Slate-100
  surfacePrimary:  '#F0F9FF',  // Sky-50
  surfaceEmerald:  '#ECFDF5',
  surfaceCoral:    '#FFF1F2',
  surfaceAmber:    '#FFFBEB',
  surfaceRose:     '#FEF2F2',
  surfaceExpert:   '#EEF2FF',  // Indigo-50 (Expert tier only)

  // Text
  textPrimary:     '#0F172A',  // Ink
  textBody:        '#334155',  // Slate-700
  textMuted:       '#64748B',  // Slate-500
  textSubtle:      '#94A3B8',  // Slate-400
  textInverse:     '#FFFFFF',
  textOnPrimary:   '#FFFFFF',

  // Borders
  border:          '#E2E8F0',  // Slate-200
  borderSubtle:    '#F1F5F9',  // Slate-100
  borderStrong:    '#CBD5E1',  // Slate-300

  // Brand / intent
  primary:         '#0EA5E9',  // Sky-500
  primaryHover:    '#0284C7',  // Sky-600
  primarySubtle:   '#F0F9FF',  // Sky-50
  accent:          '#FB7185',
  accentSubtle:    '#FFF1F2',
  success:         '#10B981',
  successSubtle:   '#ECFDF5',
  warning:         '#F59E0B',
  warningSubtle:   '#FFFBEB',
  danger:          '#E11D48',
  dangerSubtle:    '#FEF2F2',
  expert:          '#4F46E5',  // Indigo-600 — Expert trust tier only
  expertSubtle:    '#EEF2FF',  // Indigo-50
}
```

### 3.4 Accessibility

- **Text on Sand / Paper**: minimum contrast 4.5:1. Ink (`#0F172A`) on Sand gives 16:1. Slate-500 on Sand gives 4.9:1 — this is the floor for body text.
- **Text on Sky 500**: white only. Sky 500 on white is **below** the 4.5:1 bar for body text (it's ~3.1:1), so Sky 500 is a button fill color, not a text color on white surfaces. For links and tertiary buttons on Paper/Sand, use **Sky 600** (`#0284C7`) which meets 4.6:1.
- **Do not place Coral on Amber**, ever. They are both warm and they vibrate. Separate with neutral space or a white divider.
- **Error states** use Rose 600 on Rose-50 surface with Rose-600 border-left (2px). Red text alone is weak — always pair with icon and background tint.

### 3.5 The "one action" rule

On any view, there is exactly one **Sky 500** filled button. Every other action is a secondary (Slate-700 text on Paper with Slate-200 border) or a tertiary (Sky 600 text, no fill). This keeps the primary call-to-action magnetic.

---

## 4. Typography

### 4.1 Typefaces

| Role | Font | Weight range | Why |
|---|---|---|---|
| **Display / headings** | **Plus Jakarta Sans** | 500–800 | Geometric, warm, modern; pairs with Inter but has more personality |
| **Body / UI** | **Inter** | 400–600 | The de-facto UI font for a reason — unbeatable legibility at small sizes |
| **Numeric / price / code** | **JetBrains Mono** | 500 | For prices, IDs, phone numbers — tabular figures matter |

Load via `next/font` on web and `expo-font` on mobile. Fallback stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

### 4.2 Type scale

Mobile-first scale; web can bump Display-L and Display-XL at `md:` breakpoint.

| Name | Size (mobile → web) | Line height | Weight | Family | Use |
|---|---|---|---|---|---|
| Display-XL | 36 → 56 | 1.05 | 700 | Jakarta | Homepage hero |
| Display-L | 28 → 40 | 1.1 | 700 | Jakarta | Section headers, provider name on profile |
| Display-M | 24 → 28 | 1.15 | 600 | Jakarta | Card titles, page titles |
| Heading | 20 | 1.25 | 600 | Jakarta | Sub-sections |
| Body-L | 17 | 1.5 | 400 | Inter | Intro paragraphs |
| Body | 15 | 1.5 | 400 | Inter | Default body |
| Body-M | 14 | 1.45 | 500 | Inter | Dense UI, table cells |
| Caption | 12 | 1.35 | 500 | Inter | Metadata, timestamps |
| Price | 17 → 20 | 1 | 600 | JetBrains Mono | Always tabular |
| Overline | 11 | 1.2 | 600 | Inter | UPPERCASE, 0.08em tracking |

### 4.3 Opinions

- **Never center long-form text.** Left-aligned only. Center only for hero display lines and empty states.
- **Avoid italic in UI.** Italic is for quotes only.
- **Numbers always tabular.** Use `font-variant-numeric: tabular-nums` on any amount, rating, or count.
- **Price is a first-class type style** — never just "regular body text." It gets JetBrains Mono.

---

## 5. Spacing, Radius, Elevation

### 5.1 Spacing — base 4

| Token | px |
|---|---|
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |
| `space.12` | 48 |
| `space.16` | 64 |
| `space.20` | 80 |
| `space.24` | 96 |

Defaults:
- Card padding: `space.5` mobile, `space.6` web
- Section vertical rhythm: `space.12` mobile, `space.20` web
- Between stacked items in a list: `space.3`
- Between label and input: `space.2`

### 5.2 Radius

| Token | px | Use |
|---|---|---|
| `radius.sm` | 8 | Inputs, small buttons, badges |
| `radius.md` | 12 | Buttons, form containers, settings rows, inline chips |
| `radius.lg` | 20 | Default card radius, featured cards, large sheets, mobile profile hero |
| `radius.xl` | 28 | Modals, bottom sheets, full-screen sheet corners |
| `radius.xxl` | 28 | Backward-compatible alias for `radius.xl`; do not use in new code |
| `radius.pill` | 9999 | Filter pills, avatar, role chips, bottom tab bar |

> **Rule:** avatars and tab bars are `pill`. Buttons are `md` (12). Content cards and featured carousel cards are `lg` (20). Full-screen sheets and modals use `xl` (28). `xxl` exists only so older code keeps compiling.

> **Change from v1:** the default card radius moved up to 20 to match the standalone design system. 12 is still correct for buttons and tight form inputs.

### 5.3 Elevation — soft lifted shadows (the Airbnb move)

**Shadows do the containment work, not borders.** This is the biggest change from v1 of the system. A card should feel like it's floating on the Sand background — a soft drop shadow spread wide, optionally a second tight shadow for crispness. Borders are reserved for: form inputs, secondary buttons, grouped list row dividers.

Every shadow is **two-layer**: an outer spread for softness + an inner tight shadow for edge definition. For brand expressive surfaces, shadows can be sky-tinted; for content cards (the common case), they're neutral ink-tinted.

| Level | Shadow | Use |
|---|---|---|
| `elev.0` | none | Default — flat surfaces |
| `elev.1` | `0 2px 8px -3px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.04)` | Small lifted elements — option cards, text field cards, sticky footer bars |
| `elev.2` | `0 4px 14px -6px rgba(15,23,42,0.10), 0 1px 3px -1px rgba(15,23,42,0.05)` | **Default for content cards** — provider cards, grouped lists, form cards |
| `elev.3` | `0 8px 28px -10px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.06)` | **Photo-forward cards** — featured carousel, wide provider cards |
| `elev.4` | `0 10px 32px -10px rgba(15,23,42,0.28), 0 2px 6px -2px rgba(15,23,42,0.08)` | Floating bottom tab pill, primary floating CTAs |
| `elev.brand` | `0 4px 14px -4px rgba(14,165,233,0.30)` | Brand-moment surfaces only — the "Rechercher" hero button on web, the shimmer on the primary CTA |

**Never combine heavy shadow + thick border on the same element** — pick one. Cards choose shadow. Inputs choose border.

---

## 6. Iconography

- **Library:** Lucide (web and mobile via `lucide-react` / `lucide-react-native`). It's the most complete free set, stylistically neutral, stroke-based.
- **Stroke:** 1.75px default on 24px icons. 2px on 20px icons. Never change stroke within a screen.
- **Color:** inherit (`currentColor`). Icons match their parent text color. Active states can use `primary` or `accent`.
- **Sizes:** 16, 20, 24, 32. No others in UI chrome. Hero illustrations and empty states use 64–96.

### Category icons
Each service category gets one assigned Lucide icon + one tint color drawn from a curated secondary palette (teal, amber, coral, rose, emerald, violet, slate). Examples:
- Plomberie → `Wrench` (tinted teal — evokes water)
- Électricité → `Zap` (tinted amber)
- Ménage → `Sparkles` (tinted coral)
- Coiffure → `Scissors` (tinted rose)
- Informatique → `Laptop` (tinted violet)
- Jardinage → `Leaf` (tinted emerald)

**Two reserved colors** that may never be used as category tints:
- **Sky** — reserved for primary actions. Must remain magnetic.
- **Indigo** — reserved exclusively for the Expert trust tier badge.

Each category also gets a **tint color** (a desaturated version of one of the palette accents) used only as a light background behind the icon in the category tile. This is the one place where we allow multiple accent colors to coexist.

---

## 7. Motion

Motion is used to confirm, not to decorate.

### 7.1 Easings

```ts
export const ease = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',   // most UI
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)', // entrances, celebrations
  exit: 'cubic-bezier(0.3, 0, 1, 1)',        // dismissals
}
```

### 7.2 Durations

| Use | ms |
|---|---|
| Button press, hover | 120 |
| State change (toggle, tab) | 200 |
| Sheet / dialog entrance | 280 |
| Page / route transition | 320 |
| Celebration (rare) | 600 |

### 7.3 Signature moves

- **Card lift on hover (web only):** `translateY(-2px)` + shadow `elev.1` → `elev.2` over 160ms.
- **Success pop:** when a booking is confirmed or a message sent, a checkmark scales from 0.6 → 1 with a slight overshoot (cubic-bezier(0.34, 1.56, 0.64, 1)).
- **Shimmer for loading:** no spinners on content. Provider cards, booking lists, and messages use a subtle horizontal gradient shimmer (Slate-100 → Slate-200 → Slate-100) with 1600ms linear loop.
- **The "Kayou Moment"** *(surprise)*: when a client first confirms a booking, a small coral dot travels an arc from the client's avatar to the provider's avatar, leaving a fading trail. Shows once per first booking. It's the product's emotional payoff: **two people just connected.** Implement as an SVG path animation; skip on reduced-motion.

---

## 8. Component Patterns

These are the canonical components the implementation should build first. Every other screen is a composition of these.

### 8.1 Button

Three variants, one size scale, tokenized states.

**Variants:**
- `primary` — Sky 500 filled, white text, hover → Sky 600
- `secondary` — Paper with Slate-200 border, Ink text
- `ghost` — no border, no fill, Sky 600 text (Sky 600 not 500 — see §3.4 for contrast)

**Sizes:** `sm` (32px), `md` (40px default), `lg` (48px, only for primary CTAs on hero / empty states)

**Rules:**
- Corner radius: `radius.md` (12px)
- Font: Inter 600, size depends on button size (Body-M / Body / Body-L)
- Focus ring: 2px Sky 500 outline, 2px offset
- Disabled: 50% opacity, no hover
- Loading: keep width stable, swap label for a 16px shimmer bar — **no spinner inside buttons**

### 8.2 Input

- Paper background, Slate-200 border, `radius.md`
- Label above (always — never floating labels; they fail for our audience)
- Helper text below in Slate-500
- Error: Rose-600 border, Rose-600 helper text, `AlertCircle` icon leading the helper
- Height: 44px (hit target matters — our users often have large fingers, outdoor conditions)

### 8.3 Card

The fundamental container.

- Paper background, 1px Slate-200 border, `radius.md`, `elev.1`
- Padding: `space.5` mobile, `space.6` web
- Hover (web): lifts to `elev.2`, border stays
- Active (press on mobile): scale 0.98, 120ms

### 8.4 ProviderCard — the canonical component (photo-forward)

> **Superseded.** This section describes the original photo-forward provider card with overlays (specialty tag, heart, top-rated pill, bottom-right avatar overlap). It is **no longer the canonical**. The current provider card is a flat 1px-bordered card with a clean avatar tile (image / initials on beige / User icon) and categories rendered as chips. See `docs/design-direction/index.html` → "Provider cards" and the implementation in `packages/ui/src/web/ProviderShowcaseCard.tsx` and `ProviderHorizontalCard.tsx`. Section retained below for history.

This is KAYOU's hero component. The entire marketplace experience is basically lists of these. Get this right and 60% of the UI is done.

KAYOU has two canonical provider card layouts: a **featured** variant (carousels, featured lists, 4:5 or 16:11 aspect) and a **wide** variant (search results, full-width). Both share the same anatomy; only the photo aspect ratio and text layout differ.

#### Anatomy

```
┌───────────────────────────────────────┐
│                                   ♥   │    ← Heart button (top-right, over photo)
│  [ Plomberie ]                        │    ← Specialty tag (top-left, glass pill)
│                                       │
│                   [ work photo ]       │    ← Abstract "work tile" OR real photo
│                                       │
│  [🏆 Top rated]            [Avatar]   │    ← Top-rated pill (bottom-left), avatar (bottom-right overlap)
├───────────────────────────────────────┤
│  Jean Mubake ✓            ★ 4.9 (127) │    ← Name + verified check + rating
│  Plombier · Gombe · 2.3 km            │    ← Meta (profession · commune · distance)
│  Répond en ~15 min                    │    ← Response time (emerald if <30min)
│  15 000 FC /h                         │    ← Price (underlined like Airbnb)
└───────────────────────────────────────┘
```

#### Photo area

- Aspect: `4/5` for featured (vertical carousel), `16/11` for wide (search list)
- Background: real photo when available; otherwise an **abstract work tile** (see §8.5)
- Overlays (in z-order, bottom to top):
  1. Two radial gradients at corners (top-left and bottom-right) using the category tint at 10–15% opacity
  2. Repeating diagonal lines (135°, 14% opacity, 18–22px spacing)
  3. Tiny category icon centered if no content exists
  4. Specialty tag (top-left, semi-transparent white pill with `backdropFilter: blur(6px)`, mono font, category-tinted text)
  5. Heart button (top-right, transparent background, white icon with drop-shadow, flips to coral-filled when favorited)
  6. Top-rated pill if applicable (bottom-left, ink-900/88 background, white text, pill)
  7. Avatar (bottom-right, 42–44px, 2px Paper border)

#### Meta area (below photo)

- Padding: 14–16px
- Row 1: Name (Display-M size 16, weight 600) + small verified `BadgeCheck` (Emerald 500, 14px) on the left; Star + rating on the right. Rating uses tabular numbers.
- Row 2: `Profession · Commune · Distance km` in Body-M Slate-500
- Row 3: `Répond en ~15 min` in Caption. Emerald color if response includes "min", else Slate-500.
- Row 4 (bottom): Price in `JetBrains Mono` weight 600, **underlined** with 3px offset like Airbnb ("15 000 FC /h" where "/h" is Slate-500 lighter weight)

#### Card shell

- Background: `Paper` (#FFFFFF)
- Radius: `radius.lg` (20) for featured, wide, and nearby-list cards
- Shadow: `elev.3` (photo-forward default)
- **No border.** The shadow is the containment.
- Hover (web): subtle `translateY(-2px)` + shadow bumps one level
- Press (mobile): `scale(0.98)` over 120ms

#### States
- Default: `elev.3`
- Favorited: heart flipped to coral fill
- Premium: thin Sky-tinted 2px top border **only on the card shell**, not on the photo. Rare — reserved for paying pros.
- Unavailable: 60% opacity + `Non disponible` chip bottom-left instead of Top-rated

#### When to use the classic (text-only) ProviderCard

The previous "text-only bordered" ProviderCard from v1 is **retired as the canonical**. Keep a small variant only for:
- Dense admin table rows where the photo area is too large
- Dashboard recent-activity lists where speed is more important than photography

For all marketplace surfaces — home, search, category, profile's "similar pros" — use the photo-forward version.

### 8.5 The abstract "work tile" pattern

Real photography is the eventual goal but we're not blocked on it. When a provider has no portfolio photo, render an **abstract work tile** that's still branded and scannable:

```
background: {category.tintBg}                                  // category pastel
backgroundImage:
  radial-gradient(circle at 25% 20%, {category.accent}26, transparent 55%),
  radial-gradient(circle at 80% 80%, {category.accent}1a, transparent 50%),
  repeating-linear-gradient(135deg, transparent 0, transparent 20px, {category.accent}14 20px, {category.accent}14 21px)
```

- Two radial gradients at corners for depth
- A repeating 135° line pattern for texture (like architectural hatching)
- Category icon placed as a subtle anchor

Each category has paired colors in `PORTFOLIO_BG`:

| Category | `tintBg` | `accent` |
|---|---|---|
| Plomberie | `#EFF6FF` | `#0EA5E9` (teal-sky) |
| Électricité | `#FEF3C7` | `#D97706` |
| Ménage | `#FFE4E6` | `#E11D48` |
| Coiffure | `#FCE7F3` | `#BE185D` |
| Informatique | `#EDE9FE` | `#7C3AED` |
| Jardinage | `#D1FAE5` | `#059669` |
| Peinture | `#EEF2FF` | `#4F46E5` |
| Transport | `#E2E8F0` | `#475569` |
| Menuiserie | `#FEF3C7` | `#B45309` |

Note: these are **photo-substitute** colors, different from the category tile tints in §6. The work-tile accent tends to be more saturated for visual presence under overlay content.

### 8.6 List row (grouped) — the Airbnb nearby-list

Instead of rendering N shadowed cards in a vertical list, group them in **one** Paper card with 1px dividers between rows. This is how the mobile home "Près de toi" section reads.

```
┌─────────────────────────────────────────┐
│  [small tile 84×84]  Name ✓             │
│                      Profession · 2.3km │
│                      ★ 4.9 (127) ~15min │
│                                  15k FC │
│  ──────────────────────────────────────
│  [small tile 84×84]  Name ✓             │
│                         …               │
└─────────────────────────────────────────┘
```

- Outer card: Paper, `radius.lg` (20), `elev.3`, padding `4px 16px`
- Each row: 12px vertical padding, gap 12px, 1px bottom border except last
- Left adornment: 84×84 rounded work tile (radius 14) with small category icon (top-left) and small avatar (bottom-right, 28px)
- Right adornment: price `14k FC` in Price font + "/heure" Caption below

This pattern replaces a sequence of photo cards when vertical density matters more than photo impact.

### 8.5 Badge / Chip

- Pill shape (`radius.pill`)
- Sizes: `sm` (20px height, Caption), `md` (28px height, Body-M)
- Variants: `neutral` (Slate-100 bg, Slate-700 text), `success` (Emerald-50/500), `warning` (Amber-50/500), `primary` (Sky-50/Sky-600), `accent` (Coral-50/500), `expert` (Indigo-50/600)
- Optional leading icon at 14px

### 8.6 Rating display — the five-icon system

**This is KAYOU's distinctive rating system** (from the original app — keep it, it's a genuine differentiator):

Instead of generic stars, rate across five dimensions with meaningful icons:

| Dimension | Icon (Lucide) |
|---|---|
| Ponctualité | `Clock` |
| Qualité | `Wrench` |
| Communication | `MessageCircle` |
| Rapport qualité-prix | `Coins` |
| Professionnalisme | `Award` |

Each scored 0–5, rendered as 5 icon shapes that fill based on score. Overall rating rendered as a single `Star` with the average.

**Color by score:**
- 4–5 → Emerald 500
- 3 → Amber 500
- 1–2 → Rose 600

On the provider card we only show the overall star. On the profile we show all five dimensions with a small horizontal progress bar per dimension.

### 8.7 Mobile bottom tab bar — floating pill (icon-only)

The Airbnb-style floating pill tab bar is KAYOU's mobile navigation. **Not** a full-width bottom bar.

- Shape: a white pill floating ~14px from the bottom edge, left/right padded 10px
- Radius: `pill` (9999)
- Background: `Paper` (#FFFFFF)
- Shadow: `elev.4`
- Height: 52–56px
- 5 tabs: `Accueil / Rechercher / Réservations / Messages / Moi`
- **Icons only** — no labels. The active tab is a filled Sky 500 pill (circle-like rounded rect) behind the icon; inactive icons are Slate-500. This is a direct user preference ("all icons, no labels, even on the active tab").
- Behind the bar, add a fading gradient (Sand → transparent) so scrolled content doesn't crash into the pill
- **Hides on booking and profile screens** — the sticky bottom CTA replaces it there

Example:
```
      ╭──────────────────────────────────────────╮
      │  [⌂]   [🔍]   [●][📅]   [✉]   [👤]       │   ← active tab = Sky 500 filled circle
      ╰──────────────────────────────────────────╯
```

### 8.8 Sticky headers — shrinking search (mobile home)

On scroll, the mobile home page header compacts:
- Brand row (logo + KAYOU + icon buttons) collapses to `height: 0` with opacity 0 over 240ms
- Search pill reduces padding from `14px 18px` to `10px 16px`
- The subtitle line under the search placeholder hides
- The header gets a thin `1px 0 0 var(--k-border-subtle)` bottom border to mark it as floating
- Trigger: `scrollTop > 40`

This gives the user continuous access to search without taking up vertical space.

### 8.9 Sticky bottom CTA — price + reserve (mobile profile & booking)

Bottom-sticks a 72px white bar with a 1px top border and a very subtle negative-y shadow:

```
┌──────────────────────────────────────────────┐
│  15 000 FC /h                   [💬]  [Réserver] │
│  ★ 4.9 · 127 avis                                │
└──────────────────────────────────────────────┘
```

- Price: Price font 17px, underlined with 3px offset (Airbnb pattern)
- "/h" in Slate-500 smaller weight
- Under the price: small star + rating + review count in Caption
- Right side: a 44×44 round secondary button for Message, and a `primary` "Réserver" button at height 46, padding 0 20px

**Rule:** when this bar is visible, the bottom tab bar is hidden on that screen.

### 8.10 Full-screen modal sheets — filters, booking, any multi-step flow

Not a bottom drawer. A full-screen overlay sheet with:
- Close **X** top-left (not a back arrow — this is dismissing a modal task)
- Step indicator top-right: `Étape 1 sur 3` in mono font Caption
- 3-segment progress bar below header (`var(--k-text-primary)` filled, `var(--k-border)` empty, 3px tall)
- Content scrollable with 140px bottom padding (room for sticky CTA)
- Sticky bottom CTA: price + primary "Continuer" / "Confirmer" button

For the legacy half-sheet filter pattern (slide up from bottom): keep as an **alternate** only for instant-action filters (sort, quick toggle). For anything requiring ≥3 decisions, prefer the full-screen sheet.

### 8.11 Grouped list rows (summary, settings, booking summary)

When showing a list of fields (booking summary, account settings, profile sections):

- One outer Paper card with `radius.lg` (20) and `elev.2`
- Each row: 14–16px vertical padding, 12px gap
- Left: a 36×36 rounded-square (radius 10) Slate-100 bg with a 16px icon in Slate-700
- Middle: Caption label + Body-M value (semibold)
- Right (optional): chevron or action
- 1px Slate-100 divider between rows, no divider on last

This pattern is what the mobile booking step-3 summary uses, and what the profile/settings list uses. Don't render N small shadowed cards — group them.

### 8.12 Stat row (profile) — 3-cell with vertical dividers

Inside the mobile profile, below the identity block:

```
┌──────────────────────────────────────────┐
│   ★ 4.9     │    284      │    ~15 min   │
│   127 avis  │  missions   │   réponse    │
└──────────────────────────────────────────┘
```

- Full-width row, centered content in each cell
- Top + bottom 1px Slate-100 borders
- Middle cell has left+right 1px Slate-100 borders (3 columns → 2 vertical dividers)
- Cell padding: 14px vertical
- Big number (17px, weight 700, Display font) + Caption label
- One cell colors its number if it carries intent (emerald for fast response)

Web profile uses a similar 4-cell `BigStat` row at the bottom of the hero card, no vertical dividers — just 4 columns separated by generous gutter.

### 8.8 Empty state

Every list view has an empty state.

- **Illustration:** 96px hand-drawn line illustration (see §11). Never a photo, never a stock vector.
- **Headline:** Display-M, Ink, one sentence, warm. *"Pas encore de réservations."*
- **Subhead:** Body, Slate-500, explains what to do next.
- **CTA:** `primary` button if there's a clear next action; `ghost` otherwise.

---

## 9. Layout Patterns

### 9.1 Homepage

#### Web (1024+)
1. **Sticky translucent header** (backdrop blur, 1px border-bottom on scroll) — logo (image wordmark only, no separate text), centered nav links (Accueil · Trouver un pro · Comment ça marche · Devenir pro — `Devenir pro` hidden for logged-in providers; the active page's link shows a 2px Sky underline on desktop, a Sky-highlighted row in the mobile drawer), Se connecter / S'inscrire for guests / avatar menu when logged in
2. **Hero** — two-column visual balance:
   - **Left:** `NOUVEAU` overline badge, Display-XL headline ("Le bon pro, près de toi."), Body-L subline, **oversized combined search card** (two fields: `Quel service ?` + `Où ?`, divided by 1px, with a 56px Sky-primary "Rechercher" button on the right), trust strip (`2 400 pros · 4.8 · réponse ~1h`)
   - Headline's second line uses gradient text (Sky 500 → Coral 500) — this is the **only** place gradient text is permitted in the product
   - Hero background: Sand + two tiny radial gradients (Sky 9%, Coral 6%), no photo
3. **Category grid** — 6 `CategoryTile`s in a 6-column grid, `size=lg`. Each tile: Paper card, `radius.lg`, `elev.1` on hover, icon-in-tinted-square, category name + count.
4. **Featured providers** — 3-column grid of photo-forward `ProviderCard`s (featured variant, 4:5 photo, `radius.lg`, `elev.3`). Section overline "Top rated cette semaine" in Coral.
5. **How it works** — 3 numbered steps (`01/02/03` in Price font), each with a category-tinted icon square, heading, body.
6. **Provider CTA banner** — large Coral-gradient panel (Coral-50 → Coral-100 → Amber-50) with "Tu es un pro ? Rejoins KAYOU." Display-L, a mock earnings card on the right showing a weekly bar chart.
7. **Footer** — 4-column grid (brand + 3 link columns), bottom bar with copyright + "Fait à Kinshasa, avec soin."

#### Mobile (≤ 768)
1. **Sticky shrinking header** — brand row (logo + KAYOU + inbox/user icon buttons) that fades out at scrollTop > 40. Search pill stays, compacts.
2. **Search pill** — full-width white pill with shadow `elev.3`, `radius.pill`. Contains a search icon, placeholder "Trouve un pro" (bold 14px) + caption "Plomberie · Coiffure · Ménage · …", right-side 32px Sky-50 circle containing a sliders icon. Tapping navigates to Search.
3. **Category strip** — horizontal scroll row of category icons (22px icon + 11px label, underlined active state). `scroll-snap-type: x mandatory`.
4. **Hero intro block** — 26px Display-L headline + 1-line Body subtext. Minimal, tight.
5. **Featured carousel** — photo-forward cards, 78% viewport width each, horizontal scroll with snap. Each card 4:5 photo aspect, abstract work tile + overlays, meta below.
6. **Nearby grouped card** — ONE white card containing 4 `NearbyRow`s with dividers (see §8.6).
7. **How it works** — 3 minimal Paper cards, numbered, stacked.
8. **Provider CTA** — coral-gradient mini-panel with radius.lg.
9. **Bottom tab bar** (floating pill) — always visible here.

### 9.2 Search results

#### Web (1200+) — 3-column layout
```
┌─────────┬─────────────────────────┬──────────┐
│ Filters │  N pros à Kinshasa      │          │
│ (260px) │  [Available][Verified]  │  Map     │
│         │  [ProviderCard]          │  (440px) │
│         │  [ProviderCard]          │          │
│         │  [ProviderCard]          │          │
└─────────┴─────────────────────────┴──────────┘
```
- Top thin search strip: two inputs (service, city) + primary Rechercher button
- **Filters (left)**: Paper card, sectioned by dividers. Sections: Catégorie, Prix horaire (range slider), Note minimum (pill buttons), Distance (slider), Disponibilité (toggle rows), Confiance (toggle rows)
- **Results (middle)**: heading "Plombiers à Kinshasa" + result count + sort select; quick filter pills row; list of `ProviderCard` (featured variant) stacked with 14px gap
- **Map (right)**: stylized SVG map (Congo river, roads, area labels) with price pins. Hover a card → corresponding pin highlights with `elev.3` and Sky primary color.

#### Mobile — single column + map toggle
- **Sticky compact header**: back arrow (floating), search pill showing current query + result count, sliders icon for filters — all soft shadow, no borders
- **Category strip** (same as home)
- **Filter pills row** (horizontal scroll): Disponible · Vérifié · < 20 km · Top rated · Expert
- **Result summary**: "N pros disponibles" (19px Display, bold) + Trier link with chevron
- **Results list**: full-width `WideProviderCard`s (16:11 photo, `radius.lg`, `elev.3`), 16px vertical gap
- **Floating Liste/Carte toggle** at bottom center (above tab bar): ink-900 pill, white text, icon + label
- **Full-screen filter sheet** when sliders tapped (see §8.10)

### 9.3 Provider profile

#### Web (1200+) — 2-column
```
┌────────────────────────────────────────┐
│ Breadcrumb: Accueil > Plombiers > Jean │
│ ┌────────────────────────────────────┐ │
│ │ [Top-rated ribbon corner]          │ │
│ │ [Avatar 96] Name ✓   [share][♥]    │ │
│ │             Profession             │ │
│ │             [pills: trust, badges] │ │
│ │ ─────────────────────────────────  │ │
│ │ ★ 4.9   127   284   98%  (stats)   │ │
│ └────────────────────────────────────┘ │
│ ┌──────────────────┐ ┌──────────────┐ │
│ │ About            │ │ Booking rail │ │
│ │ Ratings          │ │ (sticky)     │ │
│ │ Portfolio        │ │              │ │
│ │ Reviews          │ │              │ │
│ └──────────────────┘ └──────────────┘ │
└────────────────────────────────────────┘
```
- Hero card is a big Paper card with the 4-cell stat row at the bottom (no vertical dividers — just generous gutter)
- Each body section is its own Paper `radius.lg` card with heading + subtitle + content
- Right rail (360px sticky): price card with mini-rows for date/duration/address placeholder + primary Réserver + secondary Message + protected-payment footer

#### Mobile — full-bleed photo hero
```
┌──────────────────────────┐
│ [← share ♥] floating     │
│     [ full-bleed photo ] │
│ [Plomberie]              │
│                          │
│      [Avatar overlaps]   │
├──────────────────────────┤
│      Jean Mubake ✓       │
│      Plombier            │
│      Kinshasa, Gombe     │
│ ★4.9 │ 284 │ ~15min     │   ← stat row with vertical dividers
│ [chips row]              │
│  ─────── About ───────   │
│  ─────── Ratings ───────  │
│  ─────── Portfolio ───── │
│  ─────── Reviews ─────── │
│ [sticky: Price + Reserve]│
└──────────────────────────┘
```
- **Full-bleed photo hero**: aspect 5/4, abstract work tile (category-tinted), floating round buttons (back/share/heart, `elev.1` white circles, backdrop-blur), specialty tag top-left, top-rated pill bottom-left, large avatar (88px, 4px Sand "ring") overlapping the bottom
- **Identity block**: centered, 54px top padding (to clear the avatar overlap)
- **Stat row**: 3 cells with vertical dividers (see §8.12)
- **Chips row**: Trust + Identité vérifiée + Assurance RC Pro
- **Sections**: heading, content. No nested cards — sections are separated by 1px Slate-100 dividers only. RatingsTab, PortfolioGrid (2-column), ReviewsList.
- **Sticky price/reserve bar** at bottom (see §8.9). Hides the tab bar.

### 9.4 Booking flow

#### Web — single column, 560px centered
- Back arrow + "Réserver avec Jean" heading
- 3-step progress stepper (filled sky pills + step labels)
- Provider mini-card (avatar + name + verified + profession + rating)
- **Step 1 — Service**: radio-style option cards (bordered, Sky-tinted on active), duration segment group, note textarea
- **Step 2 — Date & heure**: mini-calendar (month nav, 7-col grid, available dots), time slot grid, address input
- **Step 3 — Confirmation**: summary card + Sky-tinted total card with line items, protected payment footer, primary "Confirmer" button

#### Mobile — full-screen sheet pattern
- **Header**: close X (top-left), "Étape 1 sur 3" mono (center-right), 3-segment progress bar
- **Provider mini-card** (Paper, `radius.lg`, `elev.2`, no border)
- **Big step title** (28px Display)
- **Step 1**: 4 option cards (photo-absent, icon in 44px tinted-square + option name + description + check mark on selected). **Not radios** — full tap-target cards with shadow change on active. Duration as 4-segment dark-pill group. Note textarea as a shadowed card.
- **Step 2**: calendar in a Paper `elev.2` card (black active day, emerald dot for available), time slot grid (6 cells, dark-pill active), address input in a shadowed card with pin icon
- **Step 3**: Summary as a grouped-list card (§8.11) with icon per row, then a payment-breakdown card, then a success-subtle info panel about protected payment
- **Sticky footer CTA**: left side shows "à {hourly} FC/h" or "Total estimé" + amount (underlined like Airbnb); right side primary "Continuer" or "Confirmer" (48px height)

### 9.5 Kayou Moment — the booking confirmation celebration

The signature animation. Triggered on booking confirmation.

```
         ┌───────────────┐
         │   ●   ✓       │   ← 96px success-50 circle wrapping a 72px emerald circle with white check, pop-in + pulse
         └───────────────┘
     C'est noté !
     Jean te recontacte sous ~15 min
     
     [Avatar C] ──────arc────── [Avatar P]
        Toi                       Jean
     (coral dot traces arc client → provider over 2000ms, arc path fades behind it)
     
     ┌──────────────────────────────┐
     │ Réf #KY-4829-AM  │ Mer. 18 avril  │
     └──────────────────────────────┘
     
     [Message]  [Voir ma réservation]
```

- Background: Sand
- Success circle: pop-in with overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) then infinite pulse (2400ms)
- Text lines: rise + fade from 12px translateY
- Arc: SVG path from client avatar → provider avatar with a quadratic curve apexed above. Coral dot travels it with `offset-path`; path stroke fades from coral to transparent behind the dot. Provider avatar pulses once when the dot arrives.
- Summary card (ref + date) in Paper `radius.md`
- CTAs at bottom: secondary Message + primary "Voir ma réservation"

On `prefers-reduced-motion`: skip the arc + pulse, just show success circle + text + CTAs.

### 9.6 Dashboards (deferred design direction — not fully mocked yet)

- Top: greeting (*"Mbote, Jean."* + online indicator if provider) and a **stat row** using the §8.12 pattern (3–4 cells with dividers)
- Body: role-specific sections, each its own Paper `radius.lg` `elev.2` card. Provider: upcoming bookings carousel, earnings mini-chart (same pattern as homepage CTA), profile-completion meter. Client: upcoming bookings, favorites carousel, recent pros.
- Mobile: flattens to stacked cards; floating bottom tab bar remains.

---

## 10. Trust system — the signature

Trust is KAYOU's moat. The design must rank and signal it consistently.

### Trust Levels (maps to backend `TrustLevel` enum)

| Level | Visual |
|---|---|
| `NEWCOMER` | Slate-100 chip `Nouveau` |
| `ESTABLISHED` | Slate-100 chip `Établi` |
| `TRUSTED` | Emerald-50 chip with Emerald-500 `CheckCircle` `De confiance` |
| `EXPERT` | Indigo-50 chip with Indigo-600 `ShieldCheck` `Expert` |
| `TOP_RATED` | **Ribbon** — diagonal Amber-500 gradient ribbon on the top-left corner of the provider card, with tiny `Award` icon. The only visual element in the app that uses a ribbon — it's the one thing we break minimalism for. |

### Verified checkmark
- Small Emerald 500 `BadgeCheck` icon inline next to the provider's name, like Twitter's verified. Never alone — always anchored to a name.

### Response time
Shown as a `Clock` icon + text. If < 30 min, Emerald color; < 2h, neutral; > 2h, no color.

### Rating
Single gold `Star` + number + review count in parens. Star is Amber 500, filled. Never render half-stars — round to one decimal and show the number.

---

## 11. Illustrations & Imagery

### Illustrations
- **Style:** hand-drawn line art, 2px stroke, minimal shading, optionally one accent color fill.
- **Use:** empty states, onboarding, how-it-works sections, error pages.
- **Don't:** use 3D isometric illustrations (dated), corporate undraw.co vectors (generic), or stock vector packs.
- **Sourcing:** hire a local illustrator for 10–15 pieces total. Specify: characters represent the DRC/Congo market naturally (clothing, context) but never caricatured.

### Photography
- **Only on editorial surfaces** (blog, about page, marketing). **Not on the homepage hero**, not in category tiles, not in empty states.
- Real work, real people. No handshakes. No laptops in clean offices. Show a tool in use, a wire being stripped, a cake being iced.
- Edit warm, slightly underexposed. No heavy filters. No teal-and-orange.

---

## 12. Mobile-specific

### Safe areas
- Always respect notch and bottom bar via `SafeAreaView`.
- Bottom tab has its own safe inset — never let content slip behind.

### Gestures
- Swipe-back (iOS) on all stacks.
- Pull-to-refresh on every list view. Use Sky 500 tint.
- Long-press a provider card to open a quick-action sheet (Favorite, Share, Contact).

### Keyboard
- All forms use `KeyboardAvoidingView`.
- "Next" / "Done" keyboard action chains wired through inputs.

### Large-touch mode
Offer a setting (later, not MVP) that bumps `body` size by 2pt and all buttons to `lg`. Important for older users and outdoor use.

---

## 13. Accessibility floor

- All text meets 4.5:1 contrast minimum; headlines 3:1 minimum.
- All interactive elements have a visible focus ring (2px Sky 500, 2px offset).
- All icons that carry meaning have an accessible label (`aria-label` on web, `accessibilityLabel` on RN).
- No color-only signaling: if something is conveyed by red, it also has an icon.
- `prefers-reduced-motion`: skip the "Kayou Moment" animation, disable card hover lift.
- Minimum tap target: 44×44px.

---

## 14. Tokens — the handoff to `@kayu/ui`

The package `@kayu/ui` exports the following single object as the canonical token source. Both the Tailwind config (web) and the React Native theme (mobile) derive from it. **Nothing in the apps references a raw hex value.**

```ts
// packages/ui/src/tokens.ts
export const tokens = {
  color: {
    // Surfaces
    bg: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    surfacePrimary: '#F0F9FF',
    surfaceEmerald: '#ECFDF5',
    surfaceCoral: '#FFF1F2',
    surfaceAmber: '#FFFBEB',
    surfaceRose: '#FEF2F2',
    surfaceExpert: '#EEF2FF',

    // Text
    textPrimary: '#0F172A',
    textBody: '#334155',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Borders
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    borderStrong: '#CBD5E1',

    // Intent
    primary: '#0EA5E9',
    primaryHover: '#0284C7',
    primarySubtle: '#F0F9FF',
    accent: '#FB7185',
    accentSubtle: '#FFF1F2',
    success: '#10B981',
    successSubtle: '#ECFDF5',
    warning: '#F59E0B',
    warningSubtle: '#FFFBEB',
    danger: '#E11D48',
    dangerSubtle: '#FEF2F2',
    expert: '#4F46E5',
    expertSubtle: '#EEF2FF',
  },
  space: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
    8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
  },
  radius: {
    sm: 8, md: 12, lg: 20, xl: 28, xxl: 28, pill: 9999,
  },
  shadow: {
    none: 'none',
    e1: '0 2px 8px -3px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.04)',
    e2: '0 4px 14px -6px rgba(15,23,42,0.10), 0 1px 3px -1px rgba(15,23,42,0.05)',
    e3: '0 8px 28px -10px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.06)',
    e4: '0 10px 32px -10px rgba(15,23,42,0.28), 0 2px 6px -2px rgba(15,23,42,0.08)',
    brand: '0 4px 14px -4px rgba(14,165,233,0.30)',
  },
  font: {
    display: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  size: {
    displayXL: { fontSize: 36, lineHeight: 38, weight: 700, family: 'display' },
    displayL:  { fontSize: 28, lineHeight: 32, weight: 700, family: 'display' },
    displayM:  { fontSize: 24, lineHeight: 28, weight: 600, family: 'display' },
    heading:   { fontSize: 20, lineHeight: 25, weight: 600, family: 'display' },
    bodyL:     { fontSize: 17, lineHeight: 26, weight: 400, family: 'body' },
    body:      { fontSize: 15, lineHeight: 23, weight: 400, family: 'body' },
    bodyM:     { fontSize: 14, lineHeight: 20, weight: 500, family: 'body' },
    caption:   { fontSize: 12, lineHeight: 16, weight: 500, family: 'body' },
    price:     { fontSize: 17, lineHeight: 17, weight: 600, family: 'mono' },
    overline:  { fontSize: 11, lineHeight: 13, weight: 600, family: 'body', tracking: 0.08, transform: 'uppercase' },
  },
  ease: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  duration: {
    fast: 120, base: 200, slow: 280, page: 320, celebrate: 600,
  },
} as const
```

### Tailwind mapping (web)

`apps/web/src/app/globals.css` mirrors `tokens` through Tailwind v4 `@theme inline` variables and `:root` custom properties. Use `--k-*` for hand-authored CSS and `k-*` Tailwind utilities where available.

### React Native theme (mobile)

```ts
// apps/mobile/src/lib/theme.ts
import { tokens } from '@kayu/ui'

export const theme = {
  colors: tokens.color,
  spacing: tokens.space,
  radius: tokens.radius,
  font: tokens.font,
  text: {
    displayXL: { fontSize: 36, lineHeight: 38, fontWeight: '700', fontFamily: 'PlusJakartaSans-Bold' },
    // ...
  },
}
```

---

## 15. Checklist for any new screen

Before a screen ships, verify:

- [ ] Background is `bg` (`#FAFAF9`), not `#FFF`
- [ ] Exactly **one** primary (Sky filled) button visible
- [ ] All text uses a semantic color token, not a hex
- [ ] All spacing uses `space.*`, not magic numbers
- [ ] Headings use Plus Jakarta Sans; body uses Inter; prices use JetBrains Mono
- [ ] Focus states visible on all interactive elements
- [ ] Empty state designed (not just "no data")
- [ ] Loading state uses shimmer, not a spinner on content
- [ ] Mobile tap targets ≥ 44px
- [ ] Strings in French by default

---

## 16. Don't list

Things we will not do, ever, as long as this document is in force:

- Dark mode
- Neumorphism
- Glassmorphism (except controlled `backdrop-filter: blur(6px)` on pills that overlay photos — specialty tag on photo card, floating header buttons on profile hero)
- Flag-color tri-stripes or kitenge print backgrounds
- 3D isometric illustrations
- Gradient text in body copy. **Exception:** the web homepage hero Display-XL second line (Sky → Coral). One place in the product, nowhere else.
- Emoji in product UI (allowed in user-generated messages only)
- Purple as a general accent. Indigo is **reserved** for the Expert trust tier — don't use it elsewhere.
- Centered long-form text (identity blocks on mobile profile are the exception — short lines only)
- Spinners on content (shimmer only)
- Pure `#000` or pure `#FFF` app background
- iOS Cupertino or Android Material 3 platform-native patterns. The product is KAYOU on both — Airbnb's cross-platform discipline is the reference.
- Labels on the mobile bottom tab bar (icons only, active state = Sky fill)
- Bordered-box stacked rows when a grouped-card-with-dividers would do the same job
- Heavy 1px borders on content cards. Shadow is the default containment; border is for inputs and form chrome.

---

*End of document. When in doubt: soft shadow, warm Sand, one primary action, icon-led rows, price underlined. And ship.*
