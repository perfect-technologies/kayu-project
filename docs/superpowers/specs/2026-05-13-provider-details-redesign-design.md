# Provider details page redesign — design

**Date:** 2026-05-13
**Scope:** `apps/web/src/app/providers/[id]/` and `apps/web/src/components/provider-profile/`
**Status:** Pending implementation plan.

## Goal

Rebuild the public provider profile page (`/providers/[id]`) to push visitors toward booking. Today's page reads like a CV — header, then a long stack of "About / Skills / Certifications / Diplomas / Portfolio / Reviews" cards in the left column with the booking CTA tucked into a small right rail. The redesign keeps the same data but reorganises it around three jobs the page must do, in this order: tell the visitor who this person is and what they do (hero), prove they're worth hiring (recent work + reviews), and make booking obvious (a polished right rail on desktop, a sticky bottom bar on mobile).

The web app is the mobile experience until the Expo app ships. Mobile views are designed as first-class layouts, not shrunk desktop.

## Non-goals

- No change to the booking flow itself (`/book/[providerId]`). The CTA still routes there.
- No change to the contact/message dialogs. They keep their current behaviour.
- No new `Service`/`Package` concept. Portfolio projects stay as showcase, not bookable items.
- No backend schema changes. The redesign is presentation-only.
- No change to admin or provider-side dashboards.
- No change to `/services` or the search results page (that's a future redesign).
- Visibility/access rules (`hasAccess`, `accessDeniedReason`, `visibility.*` flags) keep their existing semantics — we just re-render the visible data inside the new layout.

## Global design rules

Inherits the rules in `docs/design-direction/index.html`:

1. No gradient backgrounds. Flat surfaces only.
2. Lucide icons only. No emoji-as-icon.
3. Plain text for secondary metadata; chips for category/trust signals only.
4. Restrained color. The primary category chip uses `Category.color`; everything else stays neutral.
5. Tokens (`packages/ui/src/tokens.ts`) are the source of truth for color, spacing, radii, fonts.
6. Avatar fallback ladder: real `avatar` → initials in mono on beige `#F5F2E9` → Lucide `user` icon on beige.

## Page composition

```
<Layout>
  <Breadcrumb />                                  {/* desktop only */}
  <MobileBackBar />                               {/* mobile only */}

  <div class="page-grid">                         {/* lg: 1fr 320px */}
    <main>
      <ProviderHero />                            {/* see §1 */}
      <ProviderAbout />                           {/* see §2 */}
      <ProviderRecentWork />                      {/* see §3, merged */}
      <ProviderReviews />                         {/* see §4 */}
      <ProviderSkills />                          {/* see §5 */}
      <ProviderCredentials />                     {/* see §6, merged */}
    </main>

    <aside>
      <BookingRail />                             {/* see §7, sticky desktop */}
    </aside>
  </div>

  <MobileStickyBottomBar />                       {/* mobile only */}
</Layout>
```

Mobile drops the aside entirely; the same call-to-action data lives in the sticky bottom bar. Sections in `<main>` keep the same order on both viewports.

## §1. ProviderHero

Single white card with rounded radius (`var(--k-r-lg)`), 1px border, light shadow (`var(--k-e1)`), generous padding (24px desktop, 16px mobile).

### Top row

- **Availability state** on the left: a `●` dot + label. Green dot (`var(--k-success)`) + `"Disponible aujourd'hui · Répond en ~30 min"` when `isAvailable` is true. Muted dot + `"Indisponible actuellement"` when false. The response-time clause is appended only when `responseTime` is non-null, rendered as `formatResponseTime(responseTime)`.
- **Favorite + Share buttons** on the right: 32×32 circular icon buttons with a neutral border, no background fill. Heart turns to `var(--k-accent)` and fills when `isFavorited`. These replace today's larger header chrome.

### Identity row

Grid `130px 1fr` on desktop, stacked on mobile.

- **Avatar tile**: 130×130 (desktop) or 92×92 (mobile), `border-radius: 16px`, `overflow: hidden`. Background `var(--k-beige)`. Fallback ladder as in the global rules.
- **Right column**:
  - **Name** (`k-display-l`, ~30px desktop / 19px mobile, `font-weight: 700`, `letter-spacing: -0.01em`). When `verificationStatus === "VERIFIED"`, a `ShieldCheck` Lucide icon in `var(--k-success)` follows the name inline.
  - **Profession line** (`k-body-l`, 16px). Format: `"{profession} · {primarySubcategory}"` when a primary subcategory exists, else just `profession`. Subcategory string is the `name` of `subcategories.find(s => s.isPrimary)` if present.
  - **Location line**: `MapPin` Lucide icon (13px) + city + zone summary. Zone summary is the first two distinct `serviceZones[].commune` (or `.city` when commune is null) joined with `", "`. Skipped entirely if no city + no zones.
  - **Pitch line**: italic, 14px (desktop) / 13px (mobile), 12px left padding with a 2px left border (`var(--k-border)`). Source: first sentence of `description`, max 180 chars. Skipped when `description` is null, empty, or the first sentence resolves to fewer than 20 chars after trimming. See "Pitch derivation" below.

### Trust ribbon

Replaces today's combined stats row + chips strip + meta row.

A 4-column grid on desktop, 2×2 on mobile, with 1px vertical dividers between cells (no divider on mobile rows).

| Cell | Icon (Lucide) | Value | Subtext |
|---|---|---|---|
| Note | `Star` (filled, warning color) | `rating` formatted as `"4,9"` (French) or `"—"` if 0 | `"{totalReviews} avis"`, or `"Pas encore d'avis"` when 0 |
| Missions | `Briefcase` | `totalJobs` | `"depuis {year}"` where year is `createdAt`'s year |
| Délai | `Clock` (success color when < 60 min) | `formatResponseTime(responseTime)` or `"À confirmer"` | `"moyenne 7 jours"` |
| Expérience | `Award` | `"{experience} ans"` or `"Nouveau"` when null/0 | `"{country}"` (e.g. `"RDC"`) |

Each cell: small caption row (icon + uppercase label, 10px), value (20px display font, weight 700), subtext (11px muted).

### Chip strip

Bottom of the hero card, separated by a 1px top border.

Order:
1. **Primary category** chip first — `categories[0]` is treated as primary (the array is already ordered by the backend / admin). Renders `Category.name` with `Category.icon` via Lucide if `icon` is a valid Lucide name, and accent color drawn from `Category.color`. Tinted background (color at low opacity) when `Category.color` is set; otherwise the chip uses the default primary-blue tint already locked in by the landing redesign.
2. **Secondary categories** next: `categories.slice(1)` (all of them — no `+N more` truncation). Plain chip style, optional Lucide icon if the category has one. Subcategories are not chipped here — the primary subcategory is already shown in the profession line.
3. **Trust chips**: `"✓ Identité vérifiée"` (green) when `verificationStatus === "VERIFIED"`, `"★ Top rated"` (warning) when the provider qualifies (existing `topRated` derivation from `ProviderHeader`: `isPremium || totalReviews >= 50 || (totalReviews >= 5 && rating >= 4.8)`), `"Certifié KAYOU"` (primary) when `isCertified`. Order matches today.

The "Accepte les demandes" chip from today is removed — the availability line at the top covers that.

### Mobile differences

- Avatar 92×92 instead of 130×130.
- Identity row stacks: avatar + (name, profession, location) side-by-side at the top, pitch line below the row, trust ribbon below that, chip strip last.
- Trust ribbon collapses from 4-col to 2×2 grid, dividers removed.

### Pitch derivation

Pure front-end utility, no backend change. Logic:

```ts
function derivePitch(description: string | null | undefined): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length < 20) return null;

  // Find first sentence boundary
  const match = trimmed.match(/^([^.!?]+[.!?])/);
  const sentence = match ? match[1].trim() : trimmed;

  if (sentence.length < 20) return null;
  if (sentence.length > 180) return sentence.slice(0, 177).trimEnd() + "…";
  return sentence;
}
```

Lives in `apps/web/src/lib/provider/derivePitch.ts`. Unit-tested.

## §2. ProviderAbout

Card. Section title `"À propos"`. Single paragraph rendering `description` with a CSS `line-clamp: 5` truncation. When the rendered height is clipped (detected via `scrollHeight > clientHeight` after mount), a `"Lire plus"` ghost button reveals the full text; a `"Réduire"` button collapses it back. When `description` is null or empty, this section is hidden entirely.

Below the paragraph, a 1px top divider and a 3-column meta row (1-column on mobile):

| Cell | Source | Fallback |
|---|---|---|
| Expérience | `"{experience} ans"` | Hidden if null |
| Zones desservies | `serviceZones[].commune ?? serviceZones[].city`, joined with `", "`, max 4 zones + `"+N autres"` | Hidden if zero zones |
| Langues | static `"Français, Lingala"` for v1 | n/a |

The Langues cell is hardcoded for now because we don't track this on `Provider`. Flagged in "Out of scope" — when we add a `languages` field, this swap is trivial.

If all three cells are empty/hidden, the meta row is omitted (don't render a bare divider).

## §3. ProviderRecentWork (merged Portfolio + PortfolioProjects)

Single card. Section title `"Travaux récents"`. Replaces today's separate `ProviderPortfolio` and `ProviderPortfolioProjects` cards.

Right-aligned in the section header: a small muted count line `"{N projets} · {M photos}"`. `N` = `portfolioProjects.length`, `M` = total images across `portfolioProjects[].images` + `portfolio.length`.

### Merge logic

- If `portfolioProjects.length > 0`: featured projects on top + a gallery strip below.
- Else if `portfolio.length > 0`: only the gallery strip (no featured row).
- Else: section is hidden entirely.

### Featured projects (when present)

A 2-up grid on desktop, single-column on mobile. We render up to 2 projects, picked in this order:

1. All projects with `isFeatured === true`, sorted by `createdAt` desc.
2. If fewer than 2 featured, fill from remaining projects sorted by `createdAt` desc.
3. Max 2 cards.

Each project card:
- Image header (aspect ratio 16:10): first image whose `imageType === "AFTER"` if present, else `displayOrder` 0, else first image. If no images, the project is skipped.
- If the project has images with `imageType === "BEFORE"` AND `imageType === "AFTER"`, an `"Avant / après"` badge sits top-left of the image (white pill, 11px, weight 600). Useful sales signal for service work.
- Title (15px, weight 700).
- Meta row: `"Durée {duration}"` (formatted as `"3h"`, `"2 j"`, etc.) + `"À partir de {price}"` formatted in fr-FR with `" FC"` suffix. Cells are hidden individually when their source is null.
- Whole card clickable → opens an in-page lightbox showing all images for the project as a horizontal carousel with caption strip. The lightbox component is new (`ProviderRecentWorkLightbox.tsx`). Esc + outside-click close it; arrow keys / swipes navigate.

### Gallery strip

Below the featured row (or as the only content if no featured row).

A 6-column thumbnail grid on desktop, 4-column on mobile. Tiles are 1:1, `border-radius: 8px`. Source — combined images, in this order:

1. All `portfolio[]` images (older legacy structure), sorted by `order`.
2. All images from `portfolioProjects[].images` not already shown in the featured row, sorted by parent project's `createdAt` desc, then image `displayOrder`.

Maximum 6 tiles visible. If the combined set is larger, the 6th tile is replaced with a `"+N"` overlay tile (dark, weight 600, white text) that opens the lightbox starting at the 6th image with the full set available.

Tiles in the gallery strip open the same lightbox as the featured projects, scoped to the gallery image set.

### Mobile differences

- Featured row: 1-up, full-width.
- Gallery: 4-column instead of 6.
- The lightbox runs full-screen.

## §4. ProviderReviews (toggle variant)

Card. Section title `"Ce que disent les clients"`. Hidden when `visibility.showReviews` is false; rendered with the empty state described below when `totalReviews === 0`.

### Headline strip

Inside the card, a warm-yellow surface (`background: #FFFBF5; border: 1px solid #FDE68A; border-radius: 10px`). Two columns on desktop (`flex` row), single block on mobile.

Left side:
- Big rating number: 44px (desktop) / 36px (mobile), display font, `font-weight: 800`, `letter-spacing: -0.02em`. Format `rating` in French (`"4,9"`).
- Stars row beneath (★ count derived from `Math.round(rating)`), warning color.
- `count` line: `"{totalReviews} avis · {totalJobs} missions terminées"`. The "missions terminées" clause is omitted if `totalJobs === 0`.

Right side (desktop) / below (mobile):
- A green check + `"{recommendPct}% des clients recommandent {firstName}"` where `recommendPct = round((breakdown[5] + breakdown[4]) / totalReviews * 100)`. Only rendered when `totalReviews >= 5` (avoids a misleading "100% recommend" on 1 review).
- A "Voir le détail ▾" button (small ghost pill) toggling the breakdown panel.

### Breakdown panel (collapsed by default)

When expanded, sits below the headline strip inside the same yellow surface (separated by a 1px top divider).

A 2-column grid on desktop, 1-column on mobile. Each row: label (110px, muted) + horizontal progress bar (5px high, success color fill on a `#F1F5F9` track) + value (mono, weight 700, right-aligned).

Dimensions, in order: `Ponctualité`, `Qualité`, `Communication`, `Rapport qualité/prix`. Values come from `stats.ratingAverages.{punctuality, quality, communication, value}`. Bar width = `value / 5 * 100%`.

If a dimension's average is 0 or null, the row is hidden (don't show empty bars).

The toggle is purely client-side state. No URL hash, no analytics for now.

### Reviews list

Below the headline strip. Today's `ProviderReviews` already renders this — keep the existing list and "Voir tous les avis →" footer link. Show 3 most recent on initial render. The component's existing pagination behavior is preserved.

Each review item simplifies to: 40px circular initials avatar, name + stars + date row, comment body, optional reply from the provider in a slightly indented secondary block.

### Empty state

When `totalReviews === 0` AND `visibility.showReviews` is true: render the card with the title and a single muted line `"Pas encore d'avis. Soyez le premier à recommander {firstName}."` The headline strip and list are hidden. No breakdown toggle.

## §5. ProviderSkills

Card. Section title `"Compétences"`. Hidden when `skills.length === 0`.

A flat chip strip — one chip per skill. Each chip:
- Background `#F1F5F9` (neutral), no border, `border-radius: 999px`, padding `5px 10px`, `font-size: 12px`.
- Skill name in `var(--k-text-body)`, followed by a tiny separator and a level label in mono + muted color.
- Level mapping: `1 → "débutant"`, `2 → "intermédiaire"`, `3 → "avancé"`, `4 → "expert"`, `5 → "maître"`.

Today's `ProviderSkills` renders horizontal progress bars per skill — replace with this chip strip. Bars felt like a quiz; chips fit the rest of the page's chip language.

## §6. ProviderCredentials (merged Certifications + Diplomas)

Single card. Section title `"Crédentiels"`. Replaces today's separate `ProviderCertifications` + `ProviderDiplomas` cards.

Hidden when both `certifications.length === 0` AND `diplomas.length === 0`.

Two subsections inside the card, each preceded by a small uppercase muted heading (`"Diplômes"`, `"Certifications"`). Subsections are not tabs — both are visible at once, separated by a 1px divider. A subsection is hidden entirely when its array is empty.

### Subsection row (used for both)

Each row:
- Left: title (weight 600, 13px) + issuing org + date line (`"{issuingOrg} · {year}"` for diplomas, `"{issuingOrg} · expire en {year}"` or `"{issuingOrg} · à vie"` for certifications).
- Right: status badge (green `"✓ Vérifié"` when `status === "VERIFIED"`, neutral `"En attente"` when PENDING or UNDER_REVIEW, hidden when REJECTED) + a `"📄 Voir"` link to the first document's `fileUrl` (opens in a new tab). When the credential has no documents, the link is omitted.

Rows are separated by 1px top dividers; the first row in each subsection has no top border.

Hidden when `visibility.showCertifications` is false.

## §7. BookingRail

Desktop-only sticky right rail. 320px column, `position: sticky; top: 104px`. Renders nothing on mobile — the bottom bar (§8) covers the same job there.

Card structure, top to bottom:

1. **À partir de** overline (10px uppercase, muted).
2. **Price**: `hourlyRate` formatted in fr-FR with `" FC / h"` unit (unit in muted 14px, weight 500). 32px mono font for the number. When `hourlyRate` is null, the block reads "Prix à convenir" in display font (24px) — no overline, no unit.
3. **Reassurance line**: 12px muted. `"Le prix final est convenu avec {firstName}. Paiement en espèces à la fin de la mission."`.
4. **In-card stats strip** (1px top divider): 3 inline items, each `bold value` + muted label below. Items: `"★ {rating}"` + `"{totalReviews} avis"`, `"{responseTimeFormatted}"` + `"réponse"`, `"{totalJobs}"` + `"missions"`. Hidden cells when their source is null/0.
5. **Primary action** — `"Demander une réservation"` button (full-width, primary blue, 13px padding, 10px radius, weight 600). Routes to `/book/{id}`.
6. **Secondary actions** — a 2-column grid: `"☎ Appeler"` (only when `user.phone` is visible per visibility rules) and `"💬 Message"` (only when `visibility.allowMessages` is true). Both are ghost buttons (1px border, neutral text). If only one is available, it spans full width.
7. **Reassurance footer** (1px top divider): three short check lines in 11px:
   - `"✓ Aucun paiement avant le travail"` (always shown).
   - `"✓ Identité vérifiée par KAYOU"` (only when `verificationStatus === "VERIFIED"`).
   - `"✓ Note moyenne {rating} sur {totalReviews} avis"` (only when `totalReviews >= 5`).

The current bottom "Categories card" that sits below the rail is removed from the rail — the chips in the hero (§1) already cover that. Service zones are surfaced in the About meta row (§2). If we lose that data being clickable, that's acceptable for v1.

When the visitor is the provider themselves (`isOwnProfile`), the rail renders a single "Tableau de bord" link instead — no CTAs against themselves.

## §8. MobileStickyBottomBar

Already exists; the redesign tweaks its content and ordering.

Bottom-fixed bar, `z-index: 40`, white background, 1px top border, 10px padding, top shadow.

Left: price block — `"À partir de"` (9px caption) + `"{hourlyRate} FC /h"` in mono 13px, weight 700. When `hourlyRate` is null: `"À convenir"` in 13px weight 600 + `"Discussion puis offre finale"` underneath (10px caption).

Right side, in order:
- `☎` circular icon button (34×34) — only when `user.phone` is visible.
- `💬` circular icon button (34×34) — only when `visibility.allowMessages`.
- `"Réserver"` primary pill button — primary blue, 9px padding, 16px horizontal padding, 999px radius, weight 600.

For the provider's own profile, the bar shows a single "Tableau de bord" pill instead.

## §9. Breadcrumb / MobileBackBar

- **Desktop breadcrumb** (12px muted) sits above the hero card: `"Accueil › Prestataires › {fullName}"`. The last segment is `var(--k-text-primary)`, others are linkified.
- **Mobile back bar** (sticky, top: 64px from the layout header) keeps its current behavior — back link on the left, Favorite + Share circular buttons on the right. The hero card removes its own favorite/share buttons on mobile (they live in the back bar instead) to avoid duplication.

## Component changes

### New files

- `apps/web/src/lib/provider/derivePitch.ts` — pure utility + spec.
- `apps/web/src/components/provider-profile/ProviderRecentWork.tsx` — replaces `ProviderPortfolio.tsx`.
- `apps/web/src/components/provider-profile/ProviderRecentWorkLightbox.tsx` — image carousel modal.
- `apps/web/src/components/provider-profile/ProviderCredentials.tsx` — replaces `ProviderCertifications.tsx` + `ProviderDiplomas.tsx`.
- `apps/web/src/components/provider-profile/BookingRail.tsx` — extracts the rail markup currently inline in `ProviderProfileClient.tsx`.
- `apps/web/src/components/provider-profile/MobileStickyBar.tsx` — extracts the mobile sticky bar likewise.
- `apps/web/src/components/provider-profile/ProviderHeroAvailability.tsx` (or inlined) — small component for the green-dot availability line.

### Rewritten

- `apps/web/src/components/provider-profile/ProviderHeader.tsx` — replaced wholesale by the new hero design above. Keep the file name; the skeleton stays.
- `apps/web/src/components/provider-profile/ProviderAbout.tsx` — replace the body with the new structured 3-cell meta row.
- `apps/web/src/components/provider-profile/ProviderSkills.tsx` — chip strip with level label instead of bars.
- `apps/web/src/components/provider-profile/ProviderReviews.tsx` — rebuild the headline strip + toggle breakdown. The list/pagination block keeps its behaviour.

### Deleted

- `apps/web/src/components/provider-profile/ProviderPortfolio.tsx` (folded into `ProviderRecentWork`).
- `apps/web/src/components/provider-profile/ProviderCertifications.tsx` (folded into `ProviderCredentials`).
- `apps/web/src/components/provider-profile/ProviderDiplomas.tsx` (folded into `ProviderCredentials`).
- `apps/web/src/components/provider-profile/ProviderCategories.tsx` (its content is absorbed into the hero chip strip and About meta row; the standalone card is removed).

### Updated

- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx` — page composition only. The current inline rail markup moves into `BookingRail.tsx`; the current inline mobile bottom bar moves into `MobileStickyBar.tsx`. The component re-orders sections per §"Page composition" above and drops the `ProviderCategories` card.
- `apps/web/src/components/provider-profile/index.ts` — exports updated.

## Data sources

All data is already returned by `providersApi(client).getById(id)`. No new endpoints, no Prisma changes.

| Surface | Source |
|---|---|
| Pitch | `provider.description` (front-end derivation) |
| Availability + response time | `provider.isAvailable`, `provider.responseTime` |
| Trust ribbon | `provider.rating`, `provider.totalReviews`, `provider.totalJobs`, `provider.responseTime`, `provider.experience`, `provider.user.createdAt`, `provider.user.country` |
| Recommend % | `(stats.ratingBreakdown[5] + stats.ratingBreakdown[4]) / stats.totalReviews` |
| Featured projects | `provider.portfolioProjects.filter(p => p.isFeatured)`, then fill from rest |
| Gallery | `provider.portfolio` + `provider.portfolioProjects.flatMap(p => p.images)` (deduped against featured) |
| Reviews breakdown | `provider.stats.ratingAverages.{punctuality, quality, communication, value}` |
| Credentials | `provider.diplomas`, `provider.certifications` |

## Edge cases & empty states

| Condition | Behavior |
|---|---|
| `description` is null/empty | Hero pitch hidden; `À propos` section hidden |
| `description.firstSentence` < 20 chars | Pitch hidden, About section still rendered with full description |
| No subcategories, no primary | Profession line shows just `profession` |
| `serviceZones.length === 0` and `user.city` null | Hero location line hidden; About meta cell hidden |
| `responseTime` null | Trust ribbon Délai cell shows `"À confirmer"`, availability line drops the response clause |
| `experience` null/0 | Trust ribbon Expérience cell shows `"Nouveau"` + country |
| `totalReviews === 0` | Reviews card renders empty state line; headline + toggle hidden. Rating ribbon cell shows `"—"` and `"Pas encore d'avis"` |
| `totalReviews >= 1` but < 5 | Reviews card renders headline + list, but the `"X% recommandent"` line and the reassurance footer's review line are hidden |
| Both `certifications` and `diplomas` empty | Credentials section hidden |
| Only `certifications` (no diplomas) | Credentials card shows only the Certifications subsection (no Diplômes heading) |
| `skills.length === 0` | Compétences section hidden |
| `portfolioProjects` empty, `portfolio` non-empty | Featured row hidden; gallery strip only |
| Both portfolio sources empty | Travaux récents section hidden |
| `hourlyRate` null | Rail shows "Prix à convenir"; mobile bar shows "À convenir / Discussion puis offre finale" |
| `user.phone` not visible (per visibility) | Call button hidden in both rail and mobile bar |
| `visibility.allowMessages` false | Message button hidden in both rail and mobile bar |
| `verificationStatus !== "VERIFIED"` | Inline shield-check next to name hidden; Identity verified chip hidden; reassurance footer line hidden |
| `isOwnProfile` true | Rail and bottom bar collapse to a single "Tableau de bord" link |
| `hasAccess` false | Existing access-denied screen renders unchanged; none of this design applies |

The page never blocks on missing data — every section that lacks its source disappears cleanly.

## Visual tokens

All colors below come from `packages/ui/src/tokens.ts` or its CSS variable mirror (`--k-*`). No new tokens introduced.

| Use | Token |
|---|---|
| Hero card surface | `var(--k-surface)` (white) |
| Page background | `var(--k-bg)` (#FAFAF9) |
| Card border | `var(--k-border)` |
| Inner divider | `var(--k-border-subtle)` |
| Primary text | `var(--k-text-primary)` |
| Body text | `var(--k-text-body)` |
| Muted text | `var(--k-text-muted)` |
| Primary action | `var(--k-primary)` |
| Success accents (availability dot, success chip, recommend line) | `var(--k-success)`, `var(--k-success-soft)`, `var(--k-success-dark)` |
| Warning accents (stars, Top rated chip) | `var(--k-warning)`, `var(--k-warning-soft)` |
| Reviews headline strip | warm beige `#FFFBF5` + border `#FDE68A` (matches landing's provider CTA) |
| Avatar fallback | `var(--k-beige)` (#F5F2E9) |
| Display font | `var(--k-font-display)` |
| Mono font | `var(--k-font-mono)` |

## Out of scope (future work)

- Service-package booking (the bigger model change to make portfolio projects bookable directly).
- Provider-managed `tagline` field — the pitch is derived from `description` for v1.
- Provider-managed `languages` field — the About meta row hardcodes "Français, Lingala" until then.
- Real-time availability calendar in the rail.
- Inline messaging on the profile (separate page handles it).
- A/B testing or analytics events for the new CTAs.
- Sharing OG-image generation tuned for the new layout.
- The `/services` (search) page redesign — picked up in a follow-up.
- Polishing the booking flow itself (`/book/[providerId]`).

## Resolved decisions

1. **Booking model**: stays generic. No service packages.
2. **CTA placement**: polished right rail + sticky mobile bottom bar. No hero CTA.
3. **Pitch source**: derived front-end from `description` first sentence. No backend change.
4. **Section order**: proof-first (About → Travaux récents → Reviews → Compétences → Crédentiels).
5. **Merges**: Portfolio + PortfolioProjects → Travaux récents; Certifications + Diplomas → Crédentiels.
6. **Reviews breakdown**: toggle variant (closed by default, "Voir le détail ▾" reveals the bars).
7. **Mobile-first**: web app is the mobile experience until the Expo app ships; mobile views are designed as first-class.
