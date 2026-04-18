# D09 — QA, accessibility, cross-platform parity audit

## Goal

Close the loop on the design pass. Run a systematic audit across web and mobile to confirm: no v1 holdovers remain, tokens are enforced, accessibility minimums are met, and the two platforms feel like the same product.

## Why it matters

The whole point of this design plan was to close the gap that opened when only mobile was pushed into the Airbnb language. This chunk verifies the gap is closed and stays closed.

## Scope

### In scope
- Visual parity audit: web at 1280px vs mobile at 390px on the four canonical screens
- Token enforcement audit: no raw hex / px / shadow strings in components
- Accessibility audit: contrast, focus rings, touch targets, reduced motion, screen-reader labels
- Performance audit: no unnecessary re-renders on shrinking header, 60fps on Kayou Moment animation, bundle size sanity check
- Lint / type-check green across all design-plan deliverables
- Decision record: known trade-offs explicitly documented

### Out of scope
- Functional QA (feature migration plan owns this)
- Load/perf testing
- Security audit

## The audit, step by step

### 1. Token enforcement sweep

Run these searches across `apps/web/src` and `apps/mobile/src`:

- `#[0-9A-Fa-f]{3,8}\b` — any raw hex. Expected: zero matches in TSX/JSX. Any hex lives in `packages/ui/src/tokens.ts` only. Exceptions: one-off SVG path color attributes are OK if they derive from a token at component-init time.
- `style={{ boxShadow` — any inline shadow string. Expected: zero. All shadows come from a token class (`shadow-e1/2/3/4`) or the token imported object.
- `borderRadius:\s*\d+` — any raw radius number. Expected: zero in components. All radii via `radius.sm/md/lg/xl/xxl/pill`.
- `font(Family|Size|Weight):\s*['"]\w` — raw font references. Expected: only `tokens.font.*` or the Tailwind font classes.

Record any violations. Fix or justify each.

### 2. Visual parity audit

Open the prototype's `KAYOU Prototype.html` in a browser alongside the real apps:

| Screen | Web frame vs real web (1280px) | Mobile frame vs real mobile (390px) |
|---|---|---|
| Home | | |
| Search | | |
| Provider profile | | |
| Booking flow (3 steps) | | |
| Kayou Moment | | |

For each cell, record: match / minor drift (specify) / significant drift. Anything marked "significant" fails this chunk.

**Expected drift** (acceptable):
- OS-level font metric differences (iOS rendering vs Chrome)
- 1–2px margin/padding rounding
- Real photos (when they exist) vs abstract work tiles — a non-issue for now since we only ship work tiles

**Not acceptable:**
- Different card radii
- Different shadow depths
- Missing overlays (specialty tag, top-rated pill, heart button)
- Wrong color on trust chip or rating
- Gradient text not rendering on the homepage hero's second line

### 3. Accessibility audit

#### Contrast
Run every foreground/background combination through a contrast checker. Minimums:
- Body text: 4.5:1
- Display text ≥ 18px or ≥ 14px bold: 3:1
- UI components (button borders, icon-only buttons): 3:1 for hit targets

Expected flags:
- Sky-500 text on white: fails 4.5:1 (this is a known limitation — it's a button fill color, not a text color; text links use Sky-600). DESIGN_SYSTEM §3.4 documents this. Verify Sky-500 is NOT used as text on Paper/Sand anywhere.
- Caption Slate-500 on Sand: 4.9:1 — passes with a small margin. Do not drop Caption color below Slate-500.

#### Focus rings (web)
Every interactive element shows the 2px Sky-500 focus ring with 2px offset. Tab through every screen:
- Homepage: header links, search inputs, search button, category tiles, featured card links, ghost links
- Search: search inputs, filter controls, each ProviderCard, map pins, sort select
- Profile: share/heart buttons, tab-like section headings (if any), Reserve button, Message button, back link
- Booking: back, radios, duration buttons, calendar dates, time slots, textarea, continue
- Kayou Moment: Message, Voir ma réservation

Any element with `outline: none` or missing `:focus-visible` styling fails.

#### Touch targets (mobile)
Every interactive element ≥ 44×44px. Small chips and pills can be wider than tall (34×72+ is fine) but the tappable area must not be < 44 in the short axis.

#### Screen readers
- Avatar has `accessibilityLabel` with the person's full name
- Icon-only buttons have `accessibilityLabel` (Favorite, Share, Back, Message, Filter, Sort)
- Star ratings have `accessibilityLabel="4.9 sur 5, 127 avis"` — do not let VoiceOver read "4 .9 1 2 7"
- Form inputs have associated `<label>` (web) or `accessibilityLabel` (mobile)
- Images (including the abstract work tile in cards) have an accessibility role. The tile is decorative — `role="img"` with the category label as alt ("Plomberie"), OR `aria-hidden="true"` if an adjacent text label already describes the provider's category.

#### Reduced motion
- Kayou Moment collapses to static end state (D08 covers this — verify it actually works)
- Provider card hover-lift is disabled on web when `prefers-reduced-motion: reduce`
- Shimmer animation: keep (it's not motion in the vestibular sense, but some guides say to slow it; we keep it)

### 4. Cross-platform parity checks

For each card variant and each primitive, render identical data on web and mobile and photograph. Compare:
- Type rendering weight
- Color hex resolution (both should map to the exact same token value)
- Shadow depth (visual)
- Icon stroke weight
- Corner radius

Paste results into a diff document. Any delta > 1px or any wrong color is a defect.

### 5. Performance checks

- `useShrinkOnScroll` (D05): profile a hard scroll on mobile home. Expected: < 5% jank on mid-tier Android (e.g., Pixel 4a).
- Kayou Moment: the arc animation runs at 60fps on iOS Safari and the Expo dev client. If Android hits < 50fps, switch to Reanimated-driven animation.
- Homepage (web) bundle size: check that `next build` doesn't add > 20kB gzip from the design tokens. Tokens are data, not runtime.

### 6. Lint + type-check

- `pnpm turbo run lint` passes all packages
- `pnpm turbo run type-check` passes all packages
- No unused exports from `@kayu/ui`
- No `@ts-expect-error` or `@ts-ignore` in design-plan deliverables

### 7. Documentation refresh

After the audit:
- Update `DESIGN_SYSTEM.md` if any design decision was made or revised during D01–D08 (e.g., a real-world contrast issue forced a color adjustment)
- Update `PROGRESS.md` to mark every chunk done
- Note any deferred work in an "open design issues" section at the bottom of PROGRESS.md

## Dependencies
- Requires D01–D08 all complete
- Blocks the design-plan phase being declared "done"

## Acceptance criteria
1. Token enforcement sweep returns zero violations (or documented exceptions)
2. Visual parity audit shows no "significant drift" entries for any screen
3. Accessibility audit passes on contrast, focus, touch targets, screen readers, reduced-motion
4. Cross-platform rendering of primitives and cards is visually identical (± OS font metrics)
5. `useShrinkOnScroll` and Kayou Moment both hit 60fps on target devices
6. `lint` and `type-check` green for all affected packages
7. `DESIGN_SYSTEM.md` and `PROGRESS.md` updated to reflect final state

## QA checklist
- [ ] Zero raw hex values in `apps/web/src/**/*.{ts,tsx}` (excluding token files)
- [ ] Zero raw hex values in `apps/mobile/src/**/*.{ts,tsx}`
- [ ] Every inline `boxShadow` string replaced with token reference
- [ ] Every `borderRadius: N` replaced with token reference
- [ ] Sky-500 never used as text color on Paper/Sand (use Sky-600)
- [ ] Tabbing through every page on web shows the 2px Sky focus ring
- [ ] All icon-only buttons have descriptive `accessibilityLabel` / `aria-label`
- [ ] Star ratings read as one phrase to screen readers
- [ ] Prefers-reduced-motion disables: Kayou Moment animations, card hover lifts, shrinking header height transitions (use a constant state instead)
- [ ] Mobile: all tappables ≥ 44×44 in the short axis
- [ ] Visual parity: featured provider card on web vs mobile — radius, shadow, overlays identical
- [ ] Visual parity: search filter pill active state — identical Sky-subtle bg + Sky-600 text on both
- [ ] Visual parity: booking stepper progress filling matches across platforms
- [ ] Kayou Moment arc animation runs at 60fps on iOS Safari and Android Chrome
- [ ] Kayou Moment on reduced-motion: static end state visible immediately on mount
- [ ] `lint` and `type-check` green on `apps/web`, `apps/mobile`, and `packages/ui`
- [ ] DESIGN_SYSTEM.md reflects any late-arriving design decisions
- [ ] PROGRESS.md marks D01–D09 all done, with evidence notes
