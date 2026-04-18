# KAYOU Design Plan — Agent Handoffs

## Purpose

Copy-paste prompts for handing off a design chunk (D01–D09) to an implementation agent. Each prompt points the agent at the design system, the design chunk, and the prototype files that act as the visual source of truth.

---

## Reusable prompt template

```
You are implementing design chunk [DXX] of the KAYOU design plan.

1. Read these files first (do not skip any):
   - /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
   - /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
   - /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
   - /Users/alainmk/startups/kayu-project/docs/design-plan/[DXX-chunk-file].md

2. Treat /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/ as the
   visual source of truth. Open the component files referenced in the chunk
   while you implement — match the visual output, not the internal structure.

3. Work in: /Users/alainmk/startups/kayu-project/

4. Rules:
   - All visual tokens come from @kayu/ui — no raw hex / px / shadow strings
     in apps
   - Both web (Tailwind) and mobile (RN theme) derive from the same tokens
   - Shadows are the default containment, not borders (v2 rule — see
     DESIGN_SYSTEM §5.3)
   - Light mode only. No dark theme branching, ever.
   - No Cupertino or Material native patterns on mobile. Airbnb-inspired
     cross-platform discipline is the reference.
   - Update PROGRESS.md when done (status + notes + decisions if any)
   - If a chunk surfaces a design decision affecting downstream chunks,
     log it in PROGRESS.md's Decisions Log
```

---

## Stricter prompt template

```
You are implementing design chunk [DXX] of the KAYOU design plan.

REQUIRED READING (do all four before writing any code):
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/[DXX-chunk-file].md

VISUAL SOURCE OF TRUTH:
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/
  - KAYOU Prototype.html (shell wiring)
  - tokens.css (CSS-var mirror of @kayu/ui tokens)
  - components/*.jsx (the sketched output — open the files named in the chunk)
  - design-chat.md (the full conversation where design decisions were made —
    read if anything feels ambiguous)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

HARD CONSTRAINTS:
- Do NOT modify files outside this chunk's stated scope
- Do NOT add visual features not in the chunk's In Scope section
- Do NOT use raw hex / px / borderRadius numbers / boxShadow strings in apps —
  always pull from tokens
- Do NOT copy the prototype's window-mutation architecture or babel/standalone
  transpile path — translate to real React imports / RN components
- Do NOT copy the two-frame .web-frame / .mobile-frame wrapper — that's
  preview scaffolding, not product
- When the prototype and DESIGN_SYSTEM.md disagree, DESIGN_SYSTEM.md wins
- Run `pnpm turbo run lint` and `pnpm turbo run type-check` before declaring
  done
- Update PROGRESS.md with: status change, any decisions made, evidence
  (screenshots or "verified visually" notes)

WHEN DONE:
- List what you implemented
- List any deviations from the plan and why
- List any decisions that affect downstream chunks
- Confirm DESIGN_SYSTEM.md §15 checklist passes for any new screen
```

---

## Ready-to-send prompts

### D01 — Foundations: tokens, fonts, base styles
```
You are implementing design chunk D01 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D01-foundations.md

VISUAL REFERENCE (exact token values):
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/tokens.css
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/shared.jsx (CATEGORIES array for categoryTint values)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/MobileShell.jsx (PORTFOLIO_BG constant for work-tile pairs)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk installs the v2 token layer into @kayu/ui, wires Tailwind (web) and
the RN theme object (mobile) to consume it, loads Plus Jakarta Sans + Inter +
JetBrains Mono on both platforms, and ships a smoke-test screen that renders
the full type scale, color swatches, radius samples, and shadow levels. No
components yet — that's D02.
```

### D02 — Primitives
```
You are implementing design chunk D02 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D02-primitives.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/shared.jsx
  (Avatar, StarRating, TrustChip, TopRatedRibbon, CategoryTile, the I icon record)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/tokens.css
  (.k-btn / .k-input / .k-chip classes — translate to component variants)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk ships the atomic UI vocabulary: Button (3 variants × 3 sizes),
Input, Avatar, Chip, Icon wrapper, StarRating, TrustChip, TopRatedRibbon,
Shimmer. Both web (shadcn-aligned React + Tailwind) and mobile (React Native
with RN-style shadows). Shared prop surface. Everything consumes tokens from
@kayu/ui — no raw values.
```

### D03 — Canonical cards
```
You are implementing design chunk D03 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D03-canonical-cards.md

VISUAL REFERENCE (this is the most important prototype file for this chunk):
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/MobileShell.jsx
  (FeaturedProviderCard, WideProviderCard, NearbyRow, CategoryStrip,
  PORTFOLIO_BG — the photo-forward system)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/shared.jsx
  (CategoryTile — v2 update; the legacy text-only ProviderCard is retired
  for marketplace use)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk ships the photo-forward provider card system — 90% of the
marketplace surface. FeaturedProviderCard (4:5, carousels), WideProviderCard
(16:11, search), NearbyRow + NearbyCard (grouped list pattern), CategoryTile
(web home), CategoryStrip (mobile), PhotoTile (the abstract "work tile"
primitive), plus skeleton variants for all. Shadows do containment — no
borders on content cards.
```

### D04 — Web redesign
```
You are implementing design chunk D04 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D04-web-redesign.md

VISUAL REFERENCE (web branches of each prototype file):
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/Homepage.jsx (web branch — the MobileHome function at the bottom is D06's concern)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/SearchPage.jsx (web branch — MobileSearch is D06)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/ProviderProfile.jsx (web branch — mobile branch is D06)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/BookingFlow.jsx (web branch — the MobileBooking function is D07)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This is the chunk that closes the v1/v2 gap on web. Apply v2 (Airbnb-inspired
shadows, radii 16/20, photo-forward cards) across all four existing web
pages: homepage, search results, provider profile, booking flow. Delete any
glass-* or glow-* components. Replace the v1 bordered text ProviderCard with
FeaturedProviderCard (home) and WideProviderCard (search). Expect to touch a
lot of files — that's the scope.
```

### D05 — Mobile shell
```
You are implementing design chunk D05 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D05-mobile-shell.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/MobileShell.jsx (MobileTabBar — the floating pill tab bar)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/Homepage.jsx (MobileHome — the shrinking search header pattern)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk builds the mobile chrome every screen sits inside: floating pill
MobileTabBar (icon-only, hides on booking + profile), ShrinkingSearchHeader
(brand row collapses at scrollTop > 40), IconButton / FloatingBackButton /
StickyBottomBar primitives, useShrinkOnScroll hook, safe-area wiring, and
React Navigation config that hides the tab bar on the right routes.
```

### D06 — Mobile screens
```
You are implementing design chunk D06 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D06-mobile-screens.md

VISUAL REFERENCE (mobile branches of each prototype file):
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/Homepage.jsx (MobileHome function at the bottom)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/SearchPage.jsx (MobileSearch + MobileFilterSheet)
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/ProviderProfile.jsx (the if (mobile) branch)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk builds the three core mobile screens: Home (shrinking search,
category strip, featured carousel, grouped nearby list, CTA), Search
(compact header, filter pills, WideProviderCard list, floating Liste/Carte
toggle, full-screen filter sheet), Provider Profile (full-bleed photo hero,
floating nav, overlapping avatar, divided stat row, section dividers,
sticky price/reserve bar).
```

### D07 — Booking flow
```
You are implementing design chunk D07 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D07-booking-flow.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/BookingFlow.jsx
  (both branches: web BookingFlow function + MobileBooking function; includes
  MiniCalendar, SumRow, MbSumRow, MbPriceRow)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk ships the 3-step booking flow. Web is a centered 560px column
with a progress stepper. Mobile is a full-screen modal sheet (tab bar
hidden) with big step titles, shadowed option cards (not OS radios), a
calendar with availability dots, a time slot grid, and a sticky footer CTA
showing live price. Confirming step 3 advances to the Kayou Moment (D08).
```

### D08 — Kayou Moment + states
```
You are implementing design chunk D08 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D08-kayou-moment-states.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan/prototype/components/BookingFlow.jsx
  (the KayouMoment function — includes the inline <style> keyframes for
  kmDot, kmPath, kmPulse, kmPop, kmRise; preserve the exact timing curves)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk ships (1) the Kayou Moment — the booking-confirmation celebration
with the coral dot traveling an arc between client and provider avatars,
fires only on the user's first confirmed booking, reduced-motion aware;
(2) EmptyState primitive with 5 ready-made variants; (3) loading skeletons
matching the card layouts from D03; (4) ErrorState primitive with 4
variants; (5) Toast notifications. No spinners anywhere — shimmer only.
```

### D09 — QA audit
```
You are implementing design chunk D09 of the KAYOU design plan.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan/D09-qa-audit.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk is an audit, not a build. Run the token enforcement sweep (no
raw hex / px / shadow strings), the visual parity audit (web 1280 vs
mobile 390 on all four canonical screens plus the Kayou Moment), the
accessibility audit (contrast, focus rings, touch targets, screen readers,
reduced motion), the cross-platform parity checks, performance profiling,
and confirm lint + type-check are green. Update DESIGN_SYSTEM.md and
PROGRESS.md with any late-arriving decisions. Document any known trade-offs
explicitly.
```

---

## Recommended usage

1. Pick the chunk you're about to implement
2. Copy the ready-to-send prompt (the stricter version is usually right)
3. Paste into a fresh agent session
4. Let the agent read the 4 required files before it writes any code
5. When the agent reports done, verify the chunk's own QA checklist and DESIGN_SYSTEM.md §15 checklist
6. Confirm `PROGRESS.md` was updated
7. Commit the chunk as a single commit: `design(DXX): <short description>`

## When to run in parallel

- D01 is sequential (everything depends on it)
- D02 and D03 can run in sequence after D01
- **D04 (web) and D05+D06+D07 (mobile) can run in parallel** once D03 is done — different platforms, no shared files
- D08 touches both platforms — run after D07 is done on both
- D09 is last; must run after D08

## Note on the prototype

The prototype files under `prototype/` are the *sketched* output from Claude
Design. They're what "correct" looks like, visually. But they're not
production code — they use `babel/standalone` in-browser, `window.*` global
exports, and a two-frame preview shell. Agents should:

- Copy **structural decisions** (ordering, spacing, hierarchy, z-indexes)
- Copy **style decisions** (shadows, radii, paddings, colors, font sizes)
- **Not copy** the `window` mutation architecture → use real imports
- **Not copy** the `babel/standalone` transpile → use the app's bundler
- **Not copy** the `.web-frame` / `.mobile-frame` wrapper → that's preview
  scaffolding, the real app renders directly

When the prototype disagrees with DESIGN_SYSTEM.md, the design system wins —
the prototype was iterative exploration.
