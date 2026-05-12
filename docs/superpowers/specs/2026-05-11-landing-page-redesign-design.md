# Landing page redesign — design

**Date:** 2026-05-11
**Scope:** `apps/web/src/app/page.tsx` + `apps/web/src/app/HomePageClient.tsx`
**Status:** Approved (visual direction); pending implementation plan.

## Goal

Replace the current landing page with a denser, more informative experience that gives visitors a real sense of what KAYOU offers and pushes them toward booking. The current page (hero → 6 category tiles → 3 featured providers → 3 how-it-works steps → provider CTA) is too sparse and stops short of selling the product.

The user kept what works (the blue→coral hero gradient, the search bar feel) and asked to redesign or add everything else.

## Non-goals

- No change to the hero copy, search bar UX, or hero background. We keep it as-is.
- No redesign of `/services`, `/providers/[id]`, or any internal page.
- No new authentication flows.
- Mobile app links can be placeholder (`#`) for now — the app may not be live yet.

## Global design rules

These constraints apply to every section below:

1. **No gradient backgrounds anywhere.** Cards and section backdrops are flat. The only gradient on the page is the hero headline text (kept).
2. **Lucide icons only.** No emoji-as-icon, no other icon sets. Section overlines may use a single accent emoji (🔥, ⭐) as decoration — that's it.
3. **Plain text for secondary info.** No chips around counts. "128 pros" is text under a label, not a pill.
4. **Restrained color.** Color is anchored to a specific element per section, not sprayed everywhere. Categories grid is monochrome on purpose.
5. **Existing design tokens** (`packages/ui/src/tokens.ts`) — colors, radii, fonts — are the source of truth. New colors must come from tokens or extend them.

## Section-by-section

### 1. Hero — kept (no change)

`HomePageClient.tsx::Hero` stays as it is. Verify the trust strip is removed from the hero (the three inline stats below the search bar move to the new section 2).

### 2. Trust strip — new section

**Layout:** Inline banner (single card, full-width within container), 4 metrics in a row separated by vertical dividers.

**Metrics:**

| # | Icon (Lucide)    | Value (source)                                     | Label                |
|---|------------------|----------------------------------------------------|----------------------|
| 1 | `database-zap` / `shield-check` | `verifiedProviders` from `/stats`     | Pros vérifiés        |
| 2 | `star` (filled)  | `averageRating` from `/stats`, e.g. `4.8/5`        | Note moyenne         |
| 3 | `clock`          | `~1h` (hardcoded for now — see "Open questions")   | Temps de réponse     |
| 4 | `map-pin`        | `providersByCity.length` from `/stats`             | Villes RDC & Congo   |

Each metric: small colored icon (24px) on the left, value in mono font + label stacked on the right. Dividers between metrics. Card has a 1px border and rounded radius from tokens.

**Empty/loading:** If `/stats` fails or hasn't loaded, render the strip with placeholder dashes (`—`) and no spinner. The page must not block on stats.

### 3. Categories grid

**Count:** 12 tiles in a 6×2 grid on desktop; 3 columns on tablet, 2 on mobile. "Voir toutes les catégories" link in the section header → `/services` (or `/categories` if that's the canonical route).

**Tile (variant C1, monochrome):**
- White surface, 1px border, rounded radius.
- Lucide icon (38px, stroke-width 1.6) centered, color: deep neutral (`#1F2937`).
- Label (centered, 14px, weight 600).
- Count as plain text below: `128 pros` (no pill, no chip), 12px, muted color, monospace font.
- Hover: subtle shadow lift + a small `arrow-up-right` icon in top-right corner.

**Data:** Already fetched server-side in `page.tsx::page()` via `getPublicCategories(12)`. Take the first 12 sorted by `order`.

**Component:** Update `packages/ui/src/web/CategoryTile.tsx` to support the centered-monochrome variant (add a `variant: "compact" | "centered-mono"` prop, default to today's behavior to avoid regressions elsewhere). The homepage uses `centered-mono`.

### 4. Trending services / Categories to discover — new section

**Note on terminology:** "Service" here means "Category" — there is no separate `Service` model in the schema. The card data is keyed by `Category`.

**Layout:** Section header with overline + title + "Voir tout" link. 3 cards in a row.

Two modes for the section header, decided server-side:

- **Trending mode** — overline "🔥 TENDANCE CETTE SEMAINE", title "Services populaires". Used when we have real booking data from the last 7 days.
- **Discovery mode** — overline "✨ À DÉCOUVRIR", title "Catégories à découvrir". Used as fallback when there's no meaningful trending data (e.g. very low booking volume or fewer than 3 categories qualify after filters).

The **card design is identical in both modes**. Only the section heading and the badge on each card change. In discovery mode the badge is omitted (or shows a neutral "Nouveau" / "À découvrir" label — TBD when implementing).

**Card:**
- 16:10 image header from `Category.image` (160px tall). In trending mode, badge top-right (white pill + colored text, e.g. `↑ +42%` or `⭐ Top 3`). In discovery mode, no badge.
- Flat white body. Category name (700, 16px), short description (1–2 lines, 13px muted), then a footer row.
- Footer row: left = "À PARTIR DE" overline + price in mono (e.g. `25 000 FC`); right = text-only "Réserver →" button colored with the category color.

**Data — new endpoint required:** `GET /stats/trending-services`.

Returns:

```ts
{
  mode: "trending" | "discovery";
  items: Array<{
    categoryId: string;
    categorySlug: string;
    categoryName: string;
    categoryImage: string | null;     // always set (see filter)
    categoryColor: string | null;     // accent for the text button
    description: string | null;       // from Category.description
    startingPrice: number | null;     // FC, see source below
    trendBadge:                        // only in trending mode
      | { kind: "growth"; pct: number }
      | { kind: "top"; rank: number }
      | null;
  }>;
}
```

**Trending logic:**
1. Query `Booking` rows in the last 7 days and the previous 7 days, grouped by category.
2. Filter to categories with `image != null` (no image fallback allowed — user rule).
3. Rank by `thisWeek` count desc. Take top 3.
4. For each: compute growth = `(thisWeek - lastWeek) / max(lastWeek, 1)`. `trendBadge.kind = "growth"` if growth ≥ 10%, else `"top"` with rank.
5. If fewer than 3 qualify → switch to discovery mode.

**Discovery fallback logic** (when trending yields < 3 cards):
1. Pick 3 categories from `Category` where `image != null` and `isActive = true`, ordered by `order` then `name`.
2. Set `mode = "discovery"`, `trendBadge = null` on each item.
3. If fewer than 3 categories qualify at all (no images set anywhere) → return `{ mode: "discovery", items: [] }` and the frontend hides the section.

**`averagePrice` source:** **Minimum** `Provider.hourlyRate` across active providers linked to that category (via `ProviderCategory`). The field name `averagePrice` is misleading in retrospect — the value is the lowest "starting from" price across providers in that category, which is what the "À partir de X FC" label communicates. Rename the field to `startingPrice` in the API response. `null` if no providers in the category have a non-null `hourlyRate`.

**Caching:** Same as before — 10 minutes in-memory.

**Component:** New `TrendingServiceCard` in `packages/ui/src/web/`. The card accepts an optional `badge` prop; the parent section component decides which heading and badge style to render based on `mode`.

### 5. Top-rated providers

**Layout:** Section header (overline "⭐ TOP RATED" + title "Pros vérifiés à Kinshasa" + "Voir tous les pros" link). 4 horizontal cards in a 2×2 grid.

**Card (horizontal):**
- Left column (140px fixed): avatar image (filling the column, object-cover). Avatar fallback below.
- Right column (flex): name + "✓ Vérifié" badge inline; profession + neighborhood line; row of three small text stats (rating with star, response time, missions count); footer with "À PARTIR DE" + price on left, "Voir le profil →" text button on right.

**Avatar fallback:** When `avatar` is null, render the column with a neutral beige background (`#F5F2E9`) and the provider's initials centered in mono font, dark muted color. Initials = first letter of `firstName` + first letter of `lastName`, uppercased. If both are missing, fall back to a single Lucide `user` icon at the same size and color.

**Data:** Already on `featuredProviders` from `page.tsx::getFeaturedProviders(4)`. Verify the response includes: avatar, firstName, lastName, profession, neighborhood/zone, rating, reviewCount, responseTime, missionsCount, startingPrice, verified flag.

**Existing component:** `packages/ui/src/web/ProviderShowcaseCard.tsx` is the vertical version used today. Add a sibling `ProviderHorizontalCard.tsx` for this layout — do not retrofit the existing component. The two cards are used in different contexts and have different information density.

### 6. How it works

**Layout:** Centered overline + title + 1-line subtitle. 3 step cards in a row, no connecting line.

**Step card:**
- Tiny overline `ÉTAPE 01` (mono, muted).
- Title (700, 17px).
- 1-sentence description.
- A mini UI mockup at the bottom (height ~120px, inside a soft `#FAFAF7` container with a 1px border):
  - Step 1: a fake search bar + 2 filter chips.
  - Step 2: 3 alternating chat bubbles (client/pro/client).
  - Step 3: a tiny "Réservation #4827 — Confirmée" card with date/service/total.

The mockups are **static HTML/CSS, not screenshots**. They're built from divs so they stay sharp and translate when copy changes.

**Steps content:**
1. Cherche un pro — filtre par service, quartier et disponibilité.
2. Discute directement — appel ou message pour confirmer besoin, prix, adresse.
3. Réserve et paie — paiement en espèces à la fin, tu notes le pro après.

### 7. Testimonials

**Layout:** Centered section header + 3 quote cards side by side.

**Quote card:**
- Row of 5 amber-filled `star` icons at the top.
- Quote body (15px, dark gray, line-height 1.55).
- Footer: round 44px initials avatar (same beige + mono style as section 5 fallback) + name + role line.

**Voices:** 2 clients + 1 pro (mixed perspective is more credible than 3 client testimonials).

**Data:** Hardcoded for now (3 entries directly in the component or a sibling `testimonials.ts` constants file). When real reviews exist, swap to a `/reviews/featured` endpoint that returns 3 most recent 5-star reviews. **In-scope: hardcoded.**

**Hide-when-empty rule:** If we choose to gate this section on real data later, the section disappears entirely when fewer than 3 qualifying reviews exist (no half-empty layout). Not in scope for v1.

### 8. Provider CTA — redesigned (was gradient → flat)

**Layout:** Single rounded card, off-white background (`#FFFBF5`), warm 1px border (`#F1ECDE`). Two-column grid (1fr 1.1fr).

**Left column:**
- Overline `POUR LES PROS` (coral).
- Headline "Tu es un pro ? Rejoins KAYOU." (700, 30px).
- 1-paragraph description.
- 3-item feature list with green check icons:
  - Profil vérifié et notations clients
  - Messages et appels directs
  - Tableau de bord des revenus
- Two buttons: primary "Devenir pro →" + ghost "En savoir plus".

**Right column — diagonal stack of 3 mini dashboard cards:**
1. **Revenue card** (top-left, 280px wide): "REVENUS CE MOIS" overline, big mono number `842 500 FC`, `↑ +23%` change, 7-bar mini chart.
2. **New booking notification** (middle-right, 260px wide): green check icon + "Nouvelle réservation · il y a 3 min" + 1-line summary `Marie K. a réservé Plomberie pour demain 14h · 25 000 FC`.
3. **Recent review** (bottom-left, 280px wide): initials avatar + name + 5-star row + italic quote.

These are visual mockups, not live data. Hardcoded in the component.

### 9. App download CTA

**Layout:** Two-column grid (1fr 1.1fr).

**Left column:**
- Overline `📱 MOBILE` (blue).
- Headline "L'app KAYOU, dans ta poche." (700, 30px).
- 1-paragraph description.
- 3-item feature list with green check icons:
  - Notifications en temps réel
  - Chat avec les pros
  - Historique et factures
- Two store buttons: App Store + Google Play, both on dark `#111` background, white text. Each has the 22px brand SVG icon + small "Télécharger sur" / "Disponible sur" overline + bold store name.
- Both link to `#` for now (links TBD).

**Right column — two phone mockups:**
- Phone A (back, rotated -6°, 200×400 frame): home screen mockup — "Bonjour Marie 👋" greeting, search bar, 3 category mini-tiles, top pros mini-card.
- Phone B (front, rotated +6°, on top): booking-confirmed screen — green check circle, "Réservation confirmée", booking summary card, Chatter/Appeler buttons.

Both phones are HTML/CSS frames with a notch and a small inner content area styled to match the actual app's design. **Not actual screenshots.**

## Page composition

Update `apps/web/src/app/HomePageClient.tsx` to render sections in this order:

```
<Layout>
  <Hero onSearch={…} />          {/* unchanged */}
  <TrustStrip stats={stats} />
  <CategoryGrid categories={categories.slice(0,12)} />
  <TrendingServices items={trending} />   {/* may render null */}
  <FeaturedProviders providers={providers} />
  <HowItWorks />
  <Testimonials />
  <ProviderCTA />
  <AppDownloadCTA />
</Layout>
```

`page.tsx` server fetches: `getPublicStats()`, `getPublicCategories(12)`, `getFeaturedProviders(4)`, `getTrendingServices()` (new). All in parallel; partial failure of any one degrades only its section.

## Backend changes

### New endpoint: `GET /stats/trending-services`

Add to `apps/backend/src/modules/stats/`:
- `stats.controller.ts`: `@Get("trending-services") getTrendingServices()`.
- `stats.service.ts`: `getTrendingServices(): Promise<TrendingService[]>`.

Logic:
1. Query bookings created in the last 7 days, grouped by `categoryId`.
2. Query bookings created in the previous 7 days, grouped by `categoryId`.
3. For each category present in either window: compute growth = `(thisWeek - lastWeek) / max(lastWeek, 1)`.
4. Filter out categories where `category.image` is null.
5. Rank by `thisWeek` count (descending). Take top 3.
6. For each, fetch `averagePrice` (lowest quote amount in the last 30 days for that category, or fall back to `null`).
7. Compute `trendBadge`: if growth ≥ 10%, `{ kind: "growth", pct: round(growth * 100) }`; else `{ kind: "top", rank: index + 1 }`.

**Caching:** Result is the same for every visitor and changes slowly. Cache in-memory for 10 minutes (NestJS cache or simple `Map<string, { value, expiresAt }>`).

### Shared schema

Add `TrendingService` and `TrendingServicesResponse` to `packages/schemas/`. Add the corresponding fetcher to `apps/web/src/lib/api/stats.ts` (or wherever `getPublicStats` lives).

## Component changes

### New components (in `packages/ui/src/web/`)

- `TrustStrip.tsx`
- `TrendingServiceCard.tsx`
- `ProviderHorizontalCard.tsx`
- `HowItWorksStepCard.tsx` (with sub-mockup components for steps 1/2/3)
- `TestimonialCard.tsx`
- `ProviderDashboardPreview.tsx` (the 3 stacked mini-cards)
- `AppPhoneMockup.tsx` (renders one phone with a variant prop: `"home" | "booking-confirmed"`)

### Modified components

- `CategoryTile.tsx`: add `variant: "default" | "centered-mono"` prop. Default unchanged. New variant: centered icon (38px, deep neutral), centered label, plain-text count, hover arrow.

### Page-level

- `HomePageClient.tsx`: rewritten to compose the new sections. The internal `Hero`, `CategoryGrid`, `FeaturedProviders`, `HowItWorks`, `ProviderCTA` inline functions are removed or replaced. The new components live in the UI package so they can be reused/tested.
- `page.tsx`: add `getTrendingServices()` to the parallel fetches.

## Edge cases & empty states

| Section | Empty/failure behavior |
|---|---|
| Trust strip | `/stats` fails → render with `—` placeholders, no spinner |
| Categories | Fewer than 12 categories → render what we have |
| Trending services | < 3 trending categories with images → falls back to discovery mode. 0 categories with images at all → section hidden. |
| Top-rated providers | Fewer than 4 → render what we have (no padding) |
| Testimonials | Always shows (hardcoded for v1) |
| Provider/App CTAs | Always shown |

## Out of scope (future work)

- Real testimonials endpoint (gated on data volume).
- Live data inside provider CTA dashboard preview (right now static).
- Real app screenshots inside the phone mockups (right now styled divs).
- Mobile app links (App Store / Play Store URLs).
- A/B testing or analytics events for the new CTAs.
- i18n — copy is currently French-only, matching existing pages.

## Resolved decisions

1. **"Temps de réponse"** — hardcoded static `~1h` for v1. Real value instrumented later.
2. **Starting price source** — minimum `Provider.hourlyRate` across active providers linked to the category via `ProviderCategory`. Field renamed `startingPrice` in the API.
3. **Trending zero-fallback** — discovery section (same card design, different header "✨ À DÉCOUVRIR / Catégories à découvrir") replaces hidden state. Section only hides if zero categories have images at all.
