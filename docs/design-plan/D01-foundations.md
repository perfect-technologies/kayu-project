# D01 — Foundations: tokens, fonts, base styles

## Goal

Install the complete v2 token layer into `@kayu/ui`, load the three brand typefaces on web and mobile, and wire up base-level styles (Tailwind theme on web, React Native theme on mobile) so everything downstream consumes the same source.

## Why it matters

If token names, scales, or mappings are inconsistent, every subsequent chunk compounds the drift. D01 is the contract.

## Scope

### In scope
- `@kayu/ui/src/tokens.ts` — the canonical object exported for both platforms (colors, space, radius, shadows, typography, easings, durations, plus `PORTFOLIO_BG` for the work-tile pattern)
- Web: `apps/web/tailwind.config.ts` maps tokens → Tailwind theme
- Web: `apps/web/src/app/globals.css` loads three fonts via `next/font` or Google Fonts, declares CSS custom properties mirroring tokens (so hand-styled components can still pull var(--k-primary) etc.)
- Mobile: `apps/mobile/src/lib/theme.ts` builds the React Native theme object from the same `tokens` import
- Mobile: `apps/mobile/App.tsx` loads fonts via `expo-font`, gates rendering on `useFonts()`
- A smoke-test screen on both platforms that renders: the full type scale, all color chips, all radius samples, all shadow levels

### Out of scope
- Components (that's D02)
- Any page-level work
- Illustration / imagery

## Token file structure

`packages/ui/src/tokens.ts` exports a single deeply-typed object. No runtime logic — pure data.

```ts
export const tokens = {
  color: { /* see DESIGN_SYSTEM §3, §14 */ },
  space: { /* base 4, 1..24 */ },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 9999 },
  shadow: { none, e1, e2, e3, e4, brand },
  font: { display, body, mono },
  size: { /* displayXL … overline, see DESIGN_SYSTEM §4.2 */ },
  ease: { standard, emphasized, exit, bounce },
  duration: { fast: 120, base: 200, slow: 280, page: 320, celebrate: 600 },

  // Work-tile pattern inputs (DESIGN_SYSTEM §8.5)
  portfolio: {
    plomberie:    { bg: "#EFF6FF", accent: "#0EA5E9" },
    electricite:  { bg: "#FEF3C7", accent: "#D97706" },
    peinture:     { bg: "#EEF2FF", accent: "#4F46E5" },
    coiffure:     { bg: "#FCE7F3", accent: "#BE185D" },
    informatique: { bg: "#EDE9FE", accent: "#7C3AED" },
    menage:       { bg: "#FFE4E6", accent: "#E11D48" },
    jardinage:    { bg: "#D1FAE5", accent: "#059669" },
    transport:    { bg: "#E2E8F0", accent: "#475569" },
    menuiserie:   { bg: "#FEF3C7", accent: "#B45309" },
  },

  // Category tint for CategoryTile (different from portfolio tile — §6)
  categoryTint: {
    plomberie:    { bg: "#CCFBF1", fg: "#0D9488" },
    electricite:  { bg: "#FEF3C7", fg: "#D97706" },
    menage:       { bg: "#FFE4E6", fg: "#E11D48" },
    coiffure:     { bg: "#FCE7F3", fg: "#BE185D" },
    informatique: { bg: "#EDE9FE", fg: "#7C3AED" },
    jardinage:    { bg: "#D1FAE5", fg: "#059669" },
    peinture:     { bg: "#DBEAFE", fg: "#2563EB" },
    transport:    { bg: "#E2E8F0", fg: "#475569" },
    menuiserie:   { bg: "#FEF3C7", fg: "#B45309" },
  },
} as const
```

Reference: `prototype/tokens.css` and `prototype/components/shared.jsx` (the `CATEGORIES` and `MobileShell.jsx`'s `PORTFOLIO_BG` constants give exact values).

## Web setup

### `apps/web/tailwind.config.ts`
Derive `theme.extend.colors` / `borderRadius` / `boxShadow` / `fontFamily` / `fontSize` from the `tokens` import so Tailwind classes map 1:1.

Key class names to target:
- `bg-surface`, `bg-bg`, `bg-surface-muted`, `bg-primary`, `bg-primary-subtle`, `bg-accent`, etc.
- `text-ink`, `text-body`, `text-muted`, `text-subtle`
- `rounded-lg` (16), `rounded-xl` (20)
- `shadow-e1`, `shadow-e2`, `shadow-e3`, `shadow-e4`
- `font-display`, `font-body`, `font-mono`

### `apps/web/src/app/globals.css`
Also declare CSS vars (so hand-authored components can reach tokens without Tailwind). Copy the `:root { --k-* }` declarations from `prototype/tokens.css` as a starting point. **Update** the elevation values to v2 (see DESIGN_SYSTEM §5.3) and add `--k-r-xl: 20px`, `--k-r-xxl: 28px`.

### Fonts (web)
Use `next/font/google`:

```ts
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google"
```

Expose as CSS vars `--font-display`, `--font-body`, `--font-mono` on `<html>`. Tailwind's `fontFamily` consumes them.

## Mobile setup

### `apps/mobile/src/lib/theme.ts`

```ts
import { tokens } from "@kayu/ui"

export const theme = {
  colors: tokens.color,
  spacing: tokens.space,
  radius: tokens.radius,
  fonts: {
    display: "PlusJakartaSans-Bold",
    displayMed: "PlusJakartaSans-SemiBold",
    body: "Inter-Regular",
    bodyMed: "Inter-Medium",
    bodySemi: "Inter-SemiBold",
    mono: "JetBrainsMono-Medium",
  },
  // derived text presets (StyleSheet objects)
  text: { displayXL, displayL, displayM, heading, bodyL, body, bodyM, caption, price, overline },
  shadow: { /* RN-style shadow objects derived from tokens.shadow */ },
}
```

### Fonts (mobile)

Use `expo-font` with Google's OTF files bundled in `assets/fonts/`:

```ts
const [loaded] = useFonts({
  "PlusJakartaSans-Bold": require("./assets/fonts/PlusJakartaSans-Bold.ttf"),
  "PlusJakartaSans-SemiBold": require("./assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
  "Inter-Medium": require("./assets/fonts/Inter-Medium.ttf"),
  "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
  "JetBrainsMono-Medium": require("./assets/fonts/JetBrainsMono-Medium.ttf"),
})
if (!loaded) return null
```

Wrap `App.tsx` in a splash-until-ready pattern via `expo-splash-screen`.

### RN shadows
RN doesn't natively take CSS shadow strings. Convert each elevation level to `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` pairs. Example:

```ts
e3: {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.16,
  shadowRadius: 14,
  elevation: 6,
}
```

## Smoke-test screen

Both platforms ship a `/_design` (web) and `DesignProbeScreen` (mobile) that render:

1. All color swatches with labels
2. All radius samples (filled squares at sm/md/lg/xl/xxl)
3. All shadow levels (identical 120px Paper squares)
4. Full type scale, one line each with the token name
5. The three fonts side-by-side at 20px

Remove after D09 passes.

## Dependencies
- Depends on migration chunk 01 (monorepo scaffold) for `packages/ui` to exist
- Blocks every later design chunk

## Acceptance criteria
1. `@kayu/ui` exports a single `tokens` object containing every value in DESIGN_SYSTEM §3–§5 and `PORTFOLIO_BG` / `categoryTint`
2. `apps/web` Tailwind config derives `colors`, `borderRadius`, `boxShadow`, `fontFamily`, `fontSize` from `tokens`
3. `apps/web/globals.css` declares matching `--k-*` CSS variables
4. `apps/mobile/lib/theme.ts` derives from the same `tokens` import and exports text presets + RN-style shadow objects
5. Three fonts load on both platforms; the font fallback never renders in production builds
6. Smoke-test screen renders on both platforms with no layout errors
7. Nothing in `apps/web` or `apps/mobile` references a raw hex or raw px size (outside the smoke-test)

## QA checklist
- [ ] `tokens` object compiles with no `any`
- [ ] Tailwind class `shadow-e3` produces the exact elevation string from DESIGN_SYSTEM §5.3
- [ ] RN `theme.shadow.e3` on iOS produces a visible soft shadow (shadowOpacity > 0)
- [ ] RN `theme.shadow.e3` on Android sets `elevation` ≥ 4
- [ ] `Plus Jakarta Sans 700` renders on both platforms at the Display-XL size
- [ ] Smoke-test: the 5 shadow levels visibly differ (stacked from e1 to e4, each clearly heavier)
- [ ] Smoke-test: radius samples at 16 and 20 visibly differ (the whole point of bumping from 12)
- [ ] CSS vars declared on `:root` match the `tokens` object (spot-check 6 values)
