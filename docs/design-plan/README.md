# KAYOU Design Implementation Plan

> The feature migration lives in [../implementation-plan/](../implementation-plan/). This is its design twin — how KAYOU should *look and feel*, chunk by chunk.

## What this plan is

A step-by-step plan for applying the KAYOU design system (see `../DESIGN_SYSTEM.md`) across the Next.js web app and the Expo mobile app. It was written after an interactive design sketch in Claude Design, where the mobile direction landed on Airbnb-inspired patterns (photo-forward cards, floating bottom tab pill, soft lifted shadows, shrinking sticky search, full-screen booking sheet, sticky price bars) while keeping KAYOU's Sky + Coral on Sand palette.

**The crucial gap the plan closes:** during the design sketch, only mobile was pushed into the Airbnb language. The web still carries the original v1 bordered-box style. This plan updates *both* apps in one coordinated pass so they stop diverging.

## Source materials

Everything you need is in this folder:

- [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — tokens, primitives, components, patterns, the "don't list"
- [`prototype/`](prototype/) — the actual HTML/CSS/JSX sketch, the source of truth for visual intent
  - `KAYOU Prototype.html` — the wiring (fonts, shell, two frames, React bootstrap)
  - `tokens.css` — design tokens as CSS variables (mirrors `@kayu/ui`)
  - `components/shared.jsx` — icons, data, and the **original** canonical `ProviderCard` (v1 bordered)
  - `components/MobileShell.jsx` — **the Airbnb-inspired** mobile building blocks: `MobileTabBar`, `FeaturedProviderCard`, `WideProviderCard`, `NearbyRow`, `CategoryStrip`, `PORTFOLIO_BG`
  - `components/Homepage.jsx` — web homepage + `MobileHome` (Airbnb style)
  - `components/SearchPage.jsx` — web search + `MobileSearch` (Airbnb style)
  - `components/ProviderProfile.jsx` — web profile + mobile full-bleed photo hero
  - `components/BookingFlow.jsx` — web booking + `MobileBooking` (full-screen sheet) + `KayouMoment`
  - `design-chat.md` — the full back-and-forth with the design assistant. **Read this if anything is ambiguous** — it's where the decisions were made.

## How to use this plan

1. Read `../DESIGN_SYSTEM.md` in full. It's the contract.
2. Read `00-overview.md` to understand what changed from design v1 and what that means for implementation.
3. Open `PROGRESS.md` to see current status.
4. Pick the next chunk (D01 → D09). Each chunk is self-contained: scope, acceptance criteria, prototype references.
5. While implementing, **open the corresponding prototype file** alongside the chunk. The prototype shows what pixel-perfect means.
6. Update `PROGRESS.md` when done.

## Relationship to the migration plan

| | Migration plan (`../implementation-plan/`) | Design plan (this folder) |
|---|---|---|
| **Answers** | *What does the app do?* | *What does it look like?* |
| **Builds** | Backend modules, API client, page routes, data fetching, auth, bookings logic | Tokens, primitives, photo-forward cards, sticky headers, Kayou Moment animation |
| **Ordering** | Sequential, dependency-gated | Sequential but can overlap with migration chunks 10 (web) and 11-12 (mobile) |
| **When to run** | Scaffold → backend → frontend integration | After the web app and mobile app scaffolds exist (migration 01, 10, 11). Design D01-D03 can start earlier (tokens + primitives + cards) since they have no backend dependency. |

A practical sequence: migration chunks 01-09 (backend complete) → start design D01-D03 (tokens + primitives + cards) in parallel with migration 10 (web app) → interleave design D04-D05 while the web pages are being built → migration 11-12 (mobile) + design D06-D08 in parallel.

## Recommended execution order

1. [D01 — Foundations: tokens, fonts, base styles](./D01-foundations.md)
2. [D02 — Primitives: buttons, inputs, avatars, chips, icons](./D02-primitives.md)
3. [D03 — Canonical cards: the photo-forward system](./D03-canonical-cards.md)
4. [D04 — Web redesign: homepage, search, profile, booking](./D04-web-redesign.md)
5. [D05 — Mobile shell: navigation, sticky headers, safe areas](./D05-mobile-shell.md)
6. [D06 — Mobile screens: home, search, profile](./D06-mobile-screens.md)
7. [D07 — Booking flow: web stepper + mobile full-screen sheet](./D07-booking-flow.md)
8. [D08 — The Kayou Moment + states (empty, loading, error)](./D08-kayou-moment-states.md)
9. [D09 — QA, accessibility, cross-platform parity audit](./D09-qa-audit.md)

## Working agreement

1. Every visual token comes from `@kayu/ui`. No hex codes in components.
2. Both web (Tailwind) and mobile (RN theme) map from the same `tokens` object.
3. When in doubt, the prototype JSX is more authoritative than prose. Open it.
4. When the prototype and DESIGN_SYSTEM.md disagree, DESIGN_SYSTEM.md wins — the prototype was sketching, the doc is the agreement.
5. No new colors. No new radius values. No new font weights. If a chunk needs one, stop and raise it.
6. Every screen passes the §15 checklist in DESIGN_SYSTEM.md before the chunk is marked done.
7. Light mode only — never introduce a dark theme branch, even speculatively.
8. Mobile uses Airbnb discipline, not Cupertino or Material. (This was a hard-earned lesson — see `prototype/design-chat.md`.)

## File map

| File | Purpose |
|---|---|
| `README.md` | This file |
| `00-overview.md` | What changed in design v2, why, consequences |
| `PROGRESS.md` | Live status tracker |
| `D01-foundations.md` | Tokens, fonts, Tailwind config, RN theme |
| `D02-primitives.md` | Button, Input, Avatar, Chip, Icon, StarRating, TrustChip |
| `D03-canonical-cards.md` | FeaturedProviderCard, WideProviderCard, NearbyRow, CategoryTile, CategoryStrip, work-tile pattern |
| `D04-web-redesign.md` | All four web pages updated to Airbnb language |
| `D05-mobile-shell.md` | MobileTabBar, shrinking headers, icon buttons, scroll patterns |
| `D06-mobile-screens.md` | Home, Search, Profile — mobile-native |
| `D07-booking-flow.md` | Web stepper + mobile full-screen sheet |
| `D08-kayou-moment-states.md` | Confirmation animation, empty/loading/error states |
| `D09-qa-audit.md` | Accessibility, cross-platform audit, docs |
| `prototype/` | The HTML/JSX sketch from Claude Design — visual source of truth |
