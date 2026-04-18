# 00 — Design Plan Overview

## Goal

Apply the KAYOU design system (`../DESIGN_SYSTEM.md` v2) consistently across the Next.js web app and the Expo mobile app, closing the gap that was left open when only mobile was pushed to the Airbnb-inspired language during the design sketch.

## Why this matters

KAYOU is a trust marketplace in a market where "hiring a pro online" is still new. The design is the product's reassurance strategy. If web and mobile feel like two different apps, trust breaks; if they feel like one confident brand, adoption accelerates.

## What changed from design v1

Design v1 (the first `DESIGN_SYSTEM.md`) got these right:
- Palette (Sky + Coral on Sand), typography (Plus Jakarta + Inter + JetBrains Mono), 5-dimension rating system, no dark mode, trust-first signals, French UI.

Design v1 had these problems that v2 fixes:
1. **Cards were flat and bordered.** v2: shadows do containment, borders are for inputs only. Verbatim user feedback: *"airbnb has cards and shadows, ours is way more flat with only borders. I don't like it."*
2. **The canonical ProviderCard was text-only.** v2: photo-forward with an abstract "work tile" when no real photo exists.
3. **No explicit mobile navigation pattern.** v2: floating pill bottom tab bar, icon-only. Not Cupertino, not Material.
4. **No explicit sticky-header / sticky-CTA patterns.** v2: shrinking sticky search, sticky price/reserve bar, full-screen modal sheets.
5. **Card radius was too conservative (12).** v2: 16 is the default for content cards, 20 for featured photo cards.
6. **Shadows were too subtle and single-layer.** v2: two-layer, elevated enough to feel lifted.

## Consequences for implementation

### Existing web (if it survived the migration plan)
The Next.js web pages built during migration chunk 10 followed v1. They now need a **design pass** to bring them into v2. This means:
- Replace bordered `ProviderCard` with the photo-forward variant (keep the original component signature, new rendering)
- Bump card radius from 12 → 16
- Replace single-layer shadows with two-layer
- Rework the provider profile layout to match the full mobile-hero pattern (web keeps 2-column, mobile uses full-bleed)
- Refresh the mobile branches in the responsive views to follow the Airbnb patterns — **or** extract mobile views into their own `apps/mobile` (if the web mobile branch still exists post-migration)

### New mobile (Expo)
Mobile is greenfield. Use v2 directly. No v1 migration cost.

### Shared packages
- `@kayu/ui` tokens expand slightly (new radius step `xl: 20`, new elevation level `elev.4`, `elev.brand`)
- `@kayu/ui` adds exported constants for `PORTFOLIO_BG` (category photo-tile paired colors)
- No new packages; no new runtime dependencies

## Scope

### In scope
- Design tokens in `@kayu/ui` updated and exported
- `apps/web` — all four existing pages (home, search, provider profile, booking) redesigned to v2
- `apps/mobile` — all four core screens built to v2 from scratch
- Canonical cards (photo-forward) in `@kayu/ui/components` or equivalent export
- The Kayou Moment animation (both platforms)
- Empty/loading/error states

### Out of scope
- Real photo upload/hosting (abstract work tiles for now; cloud storage is its own migration)
- Dashboards (there's a short §9.6 direction in the design system; full screens ship later)
- Admin UI (uses Linear-flavored dense layout — separate design pass)
- Dark mode (never)
- i18n visual variants (FR is the only language)
- Illustration commission for empty states (short-term: use simple line SVGs from Lucide + type; commission later)

## The prototype as source of truth

The files under `prototype/` are the *sketched* output. They are not production code — they use React via `babel/standalone` in a browser, global `window` exports, and a fake two-frame preview shell.

But they are what "correct" looks like, visually. When implementing:
- Copy structural decisions (ordering, spacing, hierarchy) from the prototype
- Copy style decisions (shadows, radii, paddings, colors) from the tokens and the prototype's inline styles
- **Do not** copy the `window`-mutation architecture — translate to real imports / RN components
- **Do not** copy the `babel/standalone` transpile path — real React with bundler
- **Do not** copy the two-frame `.web-frame` / `.mobile-frame` wrapper — those are preview scaffolding

When the prototype and the design system disagree, the system wins. The prototype was iterative exploration.

## Principal risks

1. **Divergence regression** — web and mobile drift apart again between chunks. Mitigation: chunk D09 is an explicit cross-platform audit.
2. **Abstract work tiles look bad at small sizes** — if the radial gradients collapse visually. Mitigation: include D03 QA at 84×84 (nearby row tile size) and confirm.
3. **Shimmer vs. spinner confusion** — engineers default to spinners. Mitigation: `@kayu/ui` exports a `<Shimmer/>` primitive in D02 so teams have a ready path.
4. **The Kayou Moment arc feels gimmicky on repeat use** — it only ever fires on the user's *first* booking confirmation (see D08). Subsequent bookings show the success without the arc.
5. **Photo-tile `backdrop-filter: blur` support on Android** — not all Android versions render it. Mitigation: fallback to white-90%-opacity pill without blur; verify on Android 10+ during D06.
6. **Next.js SSR + gradients** — heavy radial/linear gradients can cause hydration jank. Mitigation: compute gradients in CSS vars at build time, not via inline React styles, where possible.

## Milestones

### M1 — Foundations ready (after D01–D03)
The token layer, primitives, and photo-forward cards work in isolation in both web and mobile Storybook-equivalent harnesses.

### M2 — Web parity (after D04)
Web pages match the prototype's web frame visually. No v1 holdovers.

### M3 — Mobile MVP (after D05–D07)
Mobile app's home / search / profile / booking all look and feel Airbnb-inspired with KAYOU's palette.

### M4 — Delight & polish (after D08–D09)
Kayou Moment ships. Empty/loading/error states complete. Accessibility and cross-platform audits pass.

## Open questions

- **Category photos — when do we commission?** Placeholder: abstract work tiles indefinitely. Decision needed around 1k MAUs.
- **Illustration commission** — see scope. Decision by launch.
- **Featured card on web — should it match mobile's 4:5 or switch to 16:11?** The prototype uses text-first ProviderCard on web and photo-forward only on mobile. v2 says *use photo-forward on web too*. Recommend 4:5 on web featured for visual consistency; confirm during D04.
- **The Sky→Coral gradient headline on the homepage — does it SEO-index correctly with `WebkitBackgroundClip: text`?** Mitigation: retain a non-gradient fallback for SSR; let JS hydrate the gradient. Revisit in D04.
