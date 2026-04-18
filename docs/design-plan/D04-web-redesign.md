# D04 — Web redesign: homepage, search, profile, booking

## Goal

Bring the four existing web pages (homepage, search results, provider profile, booking flow) from design v1 into v2. Every v1 holdover — flat bordered cards, text-only ProviderCard, thin shadows — gets replaced.

## Why it matters

During the design sketch, the user pushed mobile into the Airbnb language but **forgot to update the web**. The web is currently in v1 state: bordered, flat, grid-heavy. This chunk closes that gap so web and mobile finally feel like the same product.

## Scope

### In scope — `apps/web`
- `app/page.tsx` — the homepage (hero, categories, featured, how it works, CTA banner, footer)
- `app/services/page.tsx` — search results (3-column: filters, list, map)
- `app/providers/[id]/page.tsx` — provider profile (hero card + sections)
- Booking flow pages — whatever route they live on after migration chunk 10 (likely a `/book/[providerId]` dynamic route with 3 steps)
- The `<WebHeader/>` and `<WebFooter/>` shared layout components
- Kill all v1 `glass-button.tsx`, `glass-card.tsx`, `glow-text.tsx`, and `pattern.svg` references
- Remove the old text-only ProviderCard from homepage/search; use `FeaturedProviderCard` from `@kayu/ui` instead

### Out of scope
- Mobile variants in these pages (legacy responsive mobile branches — migrate them to `apps/mobile` in D06, not here)
- Dashboard pages (not designed yet — see DESIGN_SYSTEM §9.6)
- Admin pages (different design direction)

## Reference files
- `prototype/components/Homepage.jsx` — **web branch** of the prototype homepage (skip the `MobileHome` at the bottom; that's D06). Use this as the pixel reference for the hero, category grid, featured section, how-it-works, CTA banner, footer.
- `prototype/components/SearchPage.jsx` — web branch: filter panel, list, map panel, filter pills, sort dropdown
- `prototype/components/ProviderProfile.jsx` — web branch: hero card with avatar+stat row, 2-column body, sticky booking rail
- `prototype/components/BookingFlow.jsx` — web branch: centered 560px column, stepper, provider mini-card, step 1/2/3 content

## Page-by-page

### `app/page.tsx` — homepage

1. **`<WebHeader/>`** — sticky with backdrop blur, logo + 4 nav links + Se connecter / S'inscrire (primary). Already correct in prototype.

2. **Hero**:
   - `NOUVEAU` overline badge (inline-flex, Paper border, 6px 14px 6px 8px padding, 999 radius)
   - Display-XL headline: `Le bon pro,` then `près de chez toi.` with gradient text (Sky 500 → Coral 500) on the second line. **SSR note:** server-render a fallback color (Ink), let a `useEffect` apply the gradient on mount for the hydration pass.
   - Body-L subline in Slate-700
   - **Oversized combined search card** — Paper, padding 8, `elev.e2`, `radius.lg`:
     - Two input columns separated by 1px Slate-200 vertical rule
     - Each column: 14 20 padding, icon + Caption-bold label above input + thin-border-less input (transparent bg)
     - Right-attached primary button, 56px height, 28px padding: `<Icon.search/>` + "Rechercher"
   - Trust strip row: three inline items `[BadgeCheck] 2 400 pros vérifiés` / `[Star] 4.8 moyenne` / `[Clock] Réponse en ~1h`, 22px top margin
   - Background: Sand with two radial gradients (Sky 9% at 18%/30%, Coral 6% at 82%/70%), no image

3. **Category grid** — section 24 40 40 padding, 1240 max-w:
   - Section heading row: "Trouve ton métier" (Display-M) on left, ghost button "Toutes les catégories →" on right
   - 6-column grid with 14px gap; each cell is a `CategoryTile` at `size="lg"` (20px padding, 48×48 tint square with 24px icon, Display 17px label, Caption count)

4. **Featured providers** — section 24 40 40 padding:
   - Header row: Coral overline "Top rated cette semaine" + Display-M "Pros vérifiés à Kinshasa", ghost button "Voir tous les pros →" right
   - **Replace v1 text ProviderCard with FeaturedProviderCard** — 3-column grid, 16px gap
   - Each FeaturedProviderCard has 4:5 photo (abstract work tile or future real photo), overlays, and meta block — identical to what mobile uses

5. **How it works** — 3 numbered steps on a timeline:
   - Each step has a 2px Slate-200 top border, with a Sky-primary 2px accent filling 100% (first step) / 50% (next steps) / transparent (last)
   - Big mono `01/02/03` number + 40×40 Sky-50 icon square, then Heading title + Body description

6. **Provider CTA banner** — big Coral-gradient panel:
   - Radius `xl`, padding 56 60, grid 1.2fr / 1fr
   - Left: Coral overline "Pour les pros", Display-L "Tu es un pro ? Rejoins KAYOU.", Body-L in rose-900, primary + ghost buttons
   - Right: a mock earnings card (`elev.3`) with bar chart, the same pattern deferred from DESIGN_SYSTEM §9.6
   - Behind: a decorative coral radial blob, absolute, pointer-events none

7. **`<WebFooter/>`** — 4-column grid, brand + 3 link columns, bottom bar with copyright + "Fait à Kinshasa, avec soin."

### `app/services/page.tsx` — search results

Structure is already correct in v1 (3-column). Changes are visual:

1. Top thin search strip: two `Input` (D02) with leading icons, primary `Rechercher`. 1px Slate-200 bottom border.

2. **Filters panel (left, 260px)**:
   - Paper card, `radius.lg`, padding 20 — not `elev`, no shadow. Sticky at top 80.
   - Sections with 1px `borderSubtle` dividers: Catégorie (6 checkboxes with tinted icon squares + count), Prix horaire (dual-thumb slider), Note minimum (3 pill buttons), Distance (range slider), Disponibilité (3 toggle rows), Confiance (3 toggle rows)
   - Header: "Filtres" heading + ghost "Effacer" button

3. **Results (middle)**:
   - Heading: "Plombiers à Kinshasa" (Display-M) + count + "mis à jour il y a 2 min" in muted
   - "Trier par" select (custom styled, Slate-200 border, radius.sm)
   - Filter pills row: `FilterPill` component (`D02`-like) — 34px height, 999 radius, Paper bg (Sky-50 when active), Slate-200 border (Sky primary when active). Pills: `Disponible maintenant`, `Vérifié`, `< 20 km`, `Top rated`, `Expert`
   - **Grid of `WideProviderCard`** — 14px vertical gap. Replace v1 text ProviderCard entirely.
   - Hover sync with map: on card hover, emit `hoveredId` upward; `MapPanel` bumps the corresponding pin

4. **Map (right, 440px)** — sticky top 80, full-height:
   - Paper card, `radius.md`, `elev.e1`, overflow hidden
   - Stylized Kinshasa SVG: Sky-50 bg + grid pattern + Congo river path (Sky-200 stroke 64 + thinner Sky-300 top line), Slate-300 roads, Emerald-100 park ellipses, area labels in Slate-400
   - Price pins: avatar chip with price in mono. Hovered pin goes Sky-primary + white text + `elev.3`.
   - Zoom controls top-right (Paper stack with Slate-200 divider)
   - Location indicator bottom-left: pill showing `[Pin] Kinshasa`

### `app/providers/[id]/page.tsx` — provider profile

1. **Breadcrumb** — thin Slate-500 trail: Accueil › Plombiers › {Name}

2. **Hero card** — Paper `radius.lg`, `elev.e1`, 32px padding, relative + overflow hidden (so TopRatedRibbon clips):
   - If topRated → `<TopRatedRibbon/>` in the corner
   - Grid: 96px avatar | 1fr info | auto actions
   - Info: Display-L name + BadgeCheck inline; Body-L profession; 3 meta icons row (pin/clock/award); chip row (TrustChip + Top rated warning-chip + Identité vérifiée + Assurance RC Pro)
   - Actions (right): icon buttons for share / heart (40px round Paper with Slate-200 border)
   - **Below: 4-cell big-stat row** — 1px top divider. Cells: Note globale (Star + rating), Avis (count), Missions réalisées (count), Taux de réponse (98% in Emerald). No vertical dividers — just generous gutter.

3. **Body — 2-column grid** 1fr / 360px:
   - **Left column** (stacked Paper cards, `radius.lg`, 28px padding):
     - "À propos": bio Body-L + Compétences overline + chip cloud of skills + Certifications overline + 3 `CertRow` (Emerald-50 bg, icon + title + sub) + Zones d'intervention overline + chip cloud of commune chips (`primary` variant)
     - "Évaluations détaillées": subtitle "Notes par dimension (système KAYOU)" + RatingsTab (5 rows of icon + label + score + progress bar colored by score)
     - "Portfolio": 3-column 4:3 abstract work-tile grid with label pills at bottom-left
     - "Avis (127)": ReviewsList — 3 reviews (avatar + name + star + date + comment), secondary "Voir tous les avis" button
   - **Right column** — sticky top 80, sticky booking card:
     - Paper `radius.lg`, `elev.e2`, 24px padding
     - Caption "À partir de" + price 32px mono display + Caption "Devis gratuit · Paiement sécurisé"
     - Surface-muted inner card: mini rows for Date / Durée / Adresse (icon + muted label + bold value)
     - Primary "Réserver maintenant →" lg button (full width), secondary "Envoyer un message" (full width)
     - 1px Slate-100 top divider at bottom, then `[ShieldCheck]` + Caption about protected payment

### Booking flow — 3 steps

Follow prototype's web branch:

1. Back arrow + "Réserver avec {firstName}" heading
2. 3-step progress stepper — each step shows a 4px Sky-filled / Slate-200 empty bar + a Caption label "1. Service"
3. Provider mini-card row (Paper, `radius.md`, Slate-200 border, padding 14): avatar + name + BadgeCheck + profession + inline StarRating
4. **Step 1 — Service**:
   - Heading "Quel service ?"
   - Stack of 4 option labels: Paper `radius.md`, 16 padding. Active = Sky-primary border + `0 0 0 3px rgba(14,165,233,0.12)` ring. Radio + label + (if active) check icon
   - Duration segment (4 buttons: 1h/2h/4h/8h, 44px height, radius.md, Sky-subtle active, Slate-200 border)
   - Textarea (k-input styling, 3 rows)
   - Primary lg button "Continuer →" (full width)
5. **Step 2 — Date & heure**:
   - Heading "Quand ?"
   - `<MiniCalendar/>` (Paper card, radius.md, 16 padding, month nav arrows, 7-col grid, available dots under dates, selected Sky-primary bg+white text)
   - Overline "Créneaux disponibles" + 4-col grid of time buttons (mono 15px font, 42px height)
   - Overline "Adresse d'intervention" + `<Input/>`
   - Primary lg "Continuer →"
6. **Step 3 — Confirmation**:
   - Heading "Récapitulatif"
   - Summary card (Paper, radius.md, 18 padding) with 5 `SumRow`s: Service / Durée estimée / Date / Adresse / Note (each 140px / 1fr grid, or full-width for multiline)
   - Sky-subtle totals card with 3 lines: `{hourly} × {duration}h`, Frais de service, Total estimé (bold, Sky-hover) — plus a small `[ShieldCheck]` line about protected payment
   - Primary lg "Confirmer la réservation" → triggers D08 Kayou Moment
   - Caption terms line below

## Consequences for the codebase
- Delete `apps/web/src/components/glass-button.tsx`, `glass-card.tsx`, `glow-text.tsx` (if they still exist post-migration)
- Delete `apps/web/public/pattern.svg` reference
- Replace any v1 `<ProviderCard/>` consumer with `<FeaturedProviderCard/>` or `<WideProviderCard/>` from `@kayu/ui`
- Remove mobile responsive branches from these pages entirely — responsive web still works, but the "mobile view" is the Expo app via `apps/mobile`, not a narrow web viewport. The web should feel good down to ~760px and then degrade gracefully (reflow, not hide).

## Dependencies
- Depends on D03 (photo-forward cards exported)
- Depends on migration chunk 10 (Next.js migration) finished — all feature data and routing must already be there

## Acceptance criteria
1. All four pages render identically to the prototype's web frame at 1280px width
2. No v1 bordered text-only ProviderCard remains anywhere in `apps/web`
3. No `glass-*` or `glow-*` components remain
4. Search page uses `WideProviderCard`; homepage featured uses `FeaturedProviderCard`; category tiles are the updated CategoryTile
5. Provider profile hero has the big-stat row with no vertical dividers; TopRatedRibbon clips correctly
6. Booking flow reaches step 3 and triggers the Kayou Moment placeholder (replaced with real D08 animation later)
7. `turbo run type-check --filter=@kayu/web` passes
8. `turbo run lint --filter=@kayu/web` passes

## QA checklist
- [ ] Homepage hero search button is 56px, Sky-primary, with inline icon + label
- [ ] Hero gradient text renders without breaking SSR (no hydration mismatch warnings in console)
- [ ] Category tile hover lifts 2px and bumps shadow
- [ ] Featured provider cards wrap at 3-columns at 1240px and gracefully degrade to 2 / 1 as width reduces
- [ ] Search filter panel is sticky and scrolls independently of the list
- [ ] Hovering a search card highlights the map pin with Sky-primary fill
- [ ] Profile hero card clips TopRatedRibbon cleanly to the top-left
- [ ] Profile sticky booking rail stops at the bottom of the page body, not escaping the column
- [ ] Booking stepper fills bars up to the current step; active step's label is 600 weight Ink
- [ ] Confirm button on step 3 triggers the celebration route
- [ ] All Paper cards use `elev.e1`/`e2`/`e3` from tokens — no inline `boxShadow` strings
- [ ] All buttons pass through the D02 `Button` component (no bespoke button styling)
