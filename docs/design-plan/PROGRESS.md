# Design Plan — Progress Tracker

## Overall

- **Track:** KAYOU Design v2 (Airbnb-inspired)
- **Status:** not_started
- **Primary reference:** `../DESIGN_SYSTEM.md`
- **Visual source of truth:** `prototype/`
- **Last updated:** 2026-04-18

---

## Feature status table

| ID | Chunk | Priority | Depends on | Platforms | Status | Notes |
|---|---|---|---|---|---|---|
| D01 | Foundations — tokens, fonts, base styles | P0 | migration 01 scaffold | web + mobile + `@kayu/ui` | not_started | Source of truth for every token |
| D02 | Primitives — button, input, avatar, chip, icon, shimmer | P0 | D01 | web + mobile | not_started | Atomic layer |
| D03 | Canonical cards — photo-forward system | P0 | D02 | web + mobile + `@kayu/ui` | done | The whole marketplace leans on this |
| D04 | Web redesign — home, search, profile, booking | P0 | D03, migration 10 | web | done | Brings web from v1 → v2 |
| D05 | Mobile shell — navigation, headers, icons | P0 | D03, migration 11 | mobile | not_started | Floating pill tab bar |
| D06 | Mobile screens — home, search, profile | P0 | D05 | mobile | not_started | Airbnb patterns |
| D07 | Booking flow — web stepper + mobile full-screen sheet | P0 | D04, D06 | web + mobile | not_started | |
| D08 | Kayou Moment + states (empty, loading, error) | P1 | D07 | web + mobile | not_started | The animation + all the small surfaces |
| D09 | QA, accessibility, cross-platform audit | P0 | D08 | web + mobile | not_started | Closes the gap web/mobile |

---

## Milestones

### M1 — Foundations ready (D01–D03)
All tokens installed, primitives exported from `@kayu/ui`, photo-forward card system verified in harness on both platforms.
**Status:** not_started

### M2 — Web parity (D04)
Web pages match the prototype's web frame visually. No v1 bordered cards remain.
**Status:** done

### M3 — Mobile MVP (D05–D07)
Mobile app home / search / profile / booking all reach the prototype's visual bar.
**Status:** not_started

### M4 — Delight & polish (D08–D09)
Kayou Moment ships. Empty/loading/error states done. Accessibility + cross-platform audit pass.
**Status:** not_started

---

## Dependency notes

- **D01 can start** as soon as migration chunk 01 exists (monorepo scaffold + `@kayu/ui` package).
- **D02–D03 can overlap** with migration chunks 09 (shared packages) and 10 (web) — the primitives land in `@kayu/ui`, and web/mobile start consuming them as they come online.
- **D04 requires migration 10** (web scaffold + backend wired up).
- **D05–D07 require migration 11–12** (mobile scaffold).
- **D08 (Kayou Moment)** touches both web and mobile — pair it with whichever booking flow (D07) lands later.
- **D09 is explicit cross-platform** — run it only after web *and* mobile have shipped D04/D06/D07.

---

## Blockers

| Date | Chunk | Blocker | Next action |
|---|---|---|---|
| — | — | — | — |

---

## Decisions log

| Date | Decision | Affects | Rationale |
|---|---|---|---|
| 2026-04-18 | Airbnb is the primary mobile inspiration | D02–D09 | User testing rejected iOS-native Cupertino; user confirmed Airbnb as reference |
| 2026-04-18 | Shadows replace borders as default containment | D01, D02, D03 | User feedback: "cards are flat with only borders. I don't like it." |
| 2026-04-18 | Card radius bumped 12 → 16 (default) / 20 (featured) | D01, D03 | Matches Airbnb card radius; v1's 12 read as too tight |
| 2026-04-18 | Bottom tab bar is icon-only | D05 | User preference: "all icons, no labels, even on the active tab" |
| 2026-04-18 | Tab bar hides on booking + profile | D05, D06 | Sticky bottom price/reserve bar takes its place |
| 2026-04-18 | Filters open full-screen sheet, not dropdown | D06, D07 | Airbnb pattern; better for 3+ fields |
| 2026-04-18 | Abstract "work tile" pattern instead of placeholder photos | D03 | No cloud photo storage for launch; deterministic category-tinted gradients scale cleanly |
| 2026-04-18 | Nearby rows live in one grouped card, not N shadowed rows | D03, D06 | Dense lists; too many shadows create visual noise |
| 2026-04-18 | Provider profile on mobile is full-bleed photo hero | D06 | Airbnb listing-detail pattern; the right way to introduce a person |
| 2026-04-18 | Kayou Moment arc fires only on **first** booking | D08 | Gimmick on repeat use; magic on first use |
| 2026-04-18 | Light mode only — no dark theme branching | all | Market + product constraints; reinforced throughout |

---

## Current focus

**Objective:** get D01 (foundations) ready and verified so D02/D03 can start.

**Definition of done for D01:** tokens exported from `@kayu/ui`, Tailwind config consumes them on web, RN theme object consumes them on mobile, three fonts load on both, a smoke-test page renders type scale + button variants + card with correct shadow on both platforms.

---

## Launch-critical checklist

- [ ] Tokens live in `@kayu/ui` and nothing in apps references raw hex values
- [ ] Plus Jakarta Sans + Inter + JetBrains Mono load on web and mobile
- [ ] Primitives (Button, Input, Avatar, Chip, Icon, Shimmer) exported
- [x] `FeaturedProviderCard`, `WideProviderCard`, `NearbyRow` implemented
- [x] Abstract work-tile pattern implemented (deterministic per category)
- [x] Web home / search / profile / booking redesigned
- [ ] Mobile shell (tab bar, shrinking search, icon buttons) in place
- [ ] Mobile home / search / profile built
- [ ] Booking flow on both platforms (stepper + sheet)
- [ ] Kayou Moment animation implemented, reduced-motion safe
- [ ] Empty / loading / error states on every list and form view
- [ ] Cross-platform audit passes (D09)

---

## Update rules

1. Update this file whenever a chunk status changes.
2. Log all cross-chunk decisions in the decisions log.
3. Record blockers immediately when discovered.
4. Mark chunks `done` only after the chunk's own checklist passes **and** the `../DESIGN_SYSTEM.md` §15 checklist passes.
