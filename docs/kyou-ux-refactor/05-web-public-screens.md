# 05 - Web Public Screens

## Objective

Rebuild every public-facing screen of `apps/web` on the K-YOU layouts: home, search, provider profile, services grid, premium, contact, legal pages and 404. These are the screens an anonymous visitor meets first, so they carry the whole visual identity from workstream 00 and consume the public endpoints from workstream 02.

## Severity

P0. Home, search and profile are the acquisition funnel and the entry to every signed-in flow.

## Owns

- `apps/web/src/app/page.tsx`, `apps/web/src/app/home/**`
- `apps/web/src/app/rechercher/**`
- `apps/web/src/app/prestataire/[id]/page.tsx`, `apps/web/src/app/prestataire/[id]/ProviderProfileClient.tsx` (not `/modifier`, owned by 06)
- `apps/web/src/app/services/**`
- `apps/web/src/app/premium/**`, `apps/web/src/app/contact/**`, `apps/web/src/app/cgu/**`, `apps/web/src/app/confidentialite/**`, `apps/web/src/app/delete-account/**`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/components/home/**`, `apps/web/src/components/provider/**`, `apps/web/src/components/search/**`, `apps/web/src/components/reference/**`, `apps/web/src/components/booking/**`, `apps/web/src/components/messaging/MessageComposer.tsx`, `apps/web/src/components/media/**`
- `apps/web/src/copy/home.ts`, `search.ts`, `provider.ts`, `services.ts`, `legal.ts`, `contact.ts`, `premium.ts`

## In scope

- The nine public routes below, mobile and desktop.
- The shared components listed in §Shared components. Workstreams 06, 07 and 08 reuse them and must not fork them.
- Deletion of the old public routes and their components.
- Redirects: `/services?…` (old search) → `/rechercher?…` with query preserved, `/providers/[id]` → `/prestataire/[id]`, `/categories/[slug]` → `/rechercher?category=[slug]`, `/book/[providerId]` → `/prestataire/[providerId]#reserver`, `/review/[providerId]` → `/prestataire/[providerId]#avis`. Implemented in `next.config.ts` `redirects()` with `permanent: true`.

## Out of scope

- Shell, tokens, fonts, motion primitives (04). This workstream consumes `Layout`, `SectionHeading`, `Pill`, `Sheet`, `Skeleton`, `EmptyState` from 04.
- Auth screens, wizard, profile editor (06).
- Signed-in spaces (07), admin (08), campaign (09).
- English copy. Every string lives in `apps/web/src/copy/*.ts`.

## Data conventions for this workstream

- Server components fetch through `createServerApiClient()` (anonymous) or `createAuthenticatedServerApiClient()` (reads the Supabase cookie) and pass typed DTOs down. Client components use `apiClient` through TanStack Query with `queryKeys.*` from `@kayu/api`.
- Site copy overrides: every page reads `settingsApi.getPublic()` → `GET /settings/public` once at the root layout (04 puts it in `SiteContentProvider`); pages call `useSiteContent()` and use `co(value, fallback)` so an empty admin value falls back to `apps/web/src/copy/*`.
- `maintenance_mode` renders `MaintenanceBanner` above the page content on every public route; it never blocks the page.
- Feature flags `feat_booking`, `feat_reviews`, `feat_whatsapp` gate the booking form, review form and WhatsApp button. Off means the block is replaced by a muted notice, not removed silently.

---

## `/` — Home

Reference: `screenshots/ui-refresh/home.png` (mobile), `screenshots/home-desktop.png`, `screenshots/home-scroll-mobile.png`.

**Files**: `apps/web/src/app/page.tsx` (server, `dynamic = "force-dynamic"`), `apps/web/src/app/home/HomeClient.tsx`, components in `apps/web/src/components/home/`: `Hero.tsx`, `StatsBar.tsx`, `CategoryGrid.tsx`, `CategoryFeatured.tsx`, `CategoryMedallion.tsx`, `HowItWorks.tsx`, `PremiumTeaser.tsx`, `MaintenanceBanner.tsx`.

**Audience**: public. Identical content signed in; only the shell changes.

**SSR data** (`Promise.all`, each call in its own `try/catch` so one failure degrades one section):

| Call | Endpoint | Feeds |
| --- | --- | --- |
| `statsApi.get()` | `GET /stats` | StatsBar |
| `categoriesApi.getTree()` | `GET /categories/tree` | CategoryGrid (level 1 only) |
| site content | already in `SiteContentProvider` | Hero, HowItWorks, PremiumTeaser, MaintenanceBanner |

No client fetch on this page.

**Layout, mobile 390 px, top to bottom**

1. `MaintenanceBanner` — only when `maintenance_mode`; `max-w-7xl`, amber-50 card, `rounded-2xl`, warning icon + `maintenance_message`.
2. `Hero` — full-bleed mesh canvas with two blurred blobs (emerald-400/20 top right, amber-300/20 left). Single column: location chip pill (`MapPin` + "RDC · Congo-Brazzaville"), H1 `text-3xl font-extrabold` where the last two words carry the gradient text class, subtitle, pill search bar (Search icon, input, primary circle submit with `ArrowRight`), trust badges row (`ShieldCheck` Vérifié, `Star` Avis clients, `Sparkles` Fait avec ❤ pour l'Afrique — the heart is the one permitted decorative glyph, rendered as a Lucide `Heart` icon in red, not an emoji). Photo card below the search bar at `h-60`, `rounded-[2rem]`, with a floating rating chip card overlapping its bottom-left corner.
3. `StatsBar` — pulled up `-mt-10`, white `rounded-3xl shadow-soft` card, `grid-cols-2`: categories count, "2 pays connectés", "FR" (single value now that EN is gone: show "Kinshasa · Brazzaville"), "100 % talents locaux". Values `text-2xl font-extrabold text-primary`, labels 10 px uppercase.
4. `CategoryGrid` — `SectionHeading` (eyebrow pill "Explorez par catégorie", H2, subtitle). Bento of the first six categories in `grid-cols-2`: two tiles `col-span-2 h-48`, three tiles `col-span-1 h-40`, one tile `col-span-2 h-40`. Each `CategoryFeatured`: photo from `Category.image`, emerald-950 bottom gradient, ghost index number "01"…"06", glass icon square + truncated name, gold "Explorer ↗" pill always visible on mobile. Below: `CategoryMedallion` row for the remaining 13 categories in `grid-cols-3` (64 px white ring, 40 px coloured disc with the Lucide icon from `Category.icon`, 11 px label). A "Voir tous les services →" link closes the section.
5. `HowItWorks` — `bg-secondary/40` band, centred `SectionHeading`, three stacked cards (Search / ShieldCheck / MessageCircle in a primary rounded square, "Étape n" eyebrow, title, description). Copy from `how1_title`…`how3_desc` overrides.
6. `PremiumTeaser` — emerald gradient panel `rounded-[1.5rem]` (allowed by rule 2 of the contract), two blurred orbs, H2 + paragraph + gold pill → `/premium`; three glass tiles stacked (Vérifié / Boosté / Elite).
7. Compact footer (04).

**Desktop 1440 px**

Hero becomes `md:grid-cols-2`: text column left, photo card right at `h-[440px]`. StatsBar `sm:grid-cols-4`. Bento `md:grid-cols-6` (spans 3 / 3 / 2 / 2 / 2 / 6). Medallions `md:grid-cols-6`. HowItWorks `md:grid-cols-3` with the emerald→amber→emerald hairline behind the cards. PremiumTeaser two columns with the glass tiles in a row. The "Voir tous les services" link moves to the section heading's right side.

**States**: stats unavailable → each value renders "—", no skeleton. Categories unavailable → the section is hidden. Never a spinner.

**Interactions and motion**: hero search submit → `router.push('/rechercher?q=…')`. Tiles and medallions → `/rechercher?category=<slug>`. Hero children stagger in (opacity + y, delays 0.05→0.4); the photo uses a spring scale-in. Bento tiles scale their image 1.035 on hover (pointer-fine only). HowItWorks cards use `whileInView` once with 0.1 stagger.

**Delete**: `src/app/HomePageClient.tsx`, `src/app/home/HardcodedTestimonials.ts`, `TrustStrip`, `TrendingSection`, `FeaturedProvidersSection`, `TestimonialsSection`, `ProviderCTASection`, `AppDownloadCTASection`, `ProviderDashboardPreview`, `AppPhoneMockup` usages and their `@kayu/ui/web` exports (03 removes the exports).

---

## `/rechercher` — Search

Reference: `screenshots/ui-refresh/rechercher.png`, `screenshots/ui-refresh/filtres.png`.

**Files**: `apps/web/src/app/rechercher/page.tsx` (server, metadata + `<Suspense>` around the client), `apps/web/src/app/rechercher/SearchClient.tsx`, `apps/web/src/components/search/`: `SearchBar.tsx`, `NearMeButton.tsx`, `FilterChips.tsx`, `FiltersSheet.tsx`, `ResultsHeader.tsx`, `ViewToggle.tsx`, `SearchMapView.tsx` (dynamic import, `ssr: false`), `ProviderCardSkeleton.tsx`, `search-state.ts` (URL ⇄ state reducer).

**Audience**: public.

**Data** (client, TanStack Query):

| Call | Endpoint | Notes |
| --- | --- | --- |
| `providersApi.search(params)` | `GET /providers` | `q, categorySlug, subcategoryId, placeId, languageId, modeId, minRating, verifiedOnly, premiumOnly, sort, lat, lng, page, limit: 24`. `keepPreviousData`, debounced 250 ms on criteria change; "Voir plus" appends the next page. |
| `categoriesApi.getTree()` | `GET /categories/tree` | cascading selects in the sheet, `staleTime: 5 min` |
| `referencesApi.list({ type })` | `GET /references?type=LANGUAGE`, `…=INTERVENTION_MODE` | sheet options |
| `placesApi.list({ kind, parentId })` | `GET /places` | inside `LocationFields` |
| `useGeolocation()` | browser | "À proximité" sets `lat/lng` and switches `sort=distance` |

All criteria live in the URL (`useSearchParams` + `router.replace`), so a shared link reproduces the search and the back button restores it.

**Layout, mobile 390 px**

1. H1 "Trouver un prestataire" `text-2xl font-extrabold`.
2. Row: `SearchBar` pill (Search icon inside, `rounded-full border bg-white py-3.5 pl-11 shadow-soft`) + `NearMeButton` pill (`Navigation` icon, spins while locating, turns solid when a position is set).
3. `FilterChips` row: "Filtres" pill (`SlidersHorizontal`, solid primary with a count badge when any advanced filter is active), active-filter counter chip with an `X` that clears everything, green "Position activée" chip when geolocated.
4. `ResultsHeader`: "n prestataires trouvés" left; `ViewToggle` segmented pill (Liste / Carte) right.
5. Body, one of: four `ProviderCardSkeleton` in `grid-cols-2` with `role="status"`; `EmptyState` dashed card ("Aucun prestataire pour ces critères", reset CTA); `SearchMapView` at 70 vh, `rounded-3xl`; or the `ProviderCard` grid `grid-cols-2 gap-4` followed by a centred "Voir plus" pill while `hasMore`.
6. `FiltersSheet` — bottom sheet (`AnimatePresence`, black/40 backdrop, spring y 100 %→0, `rounded-t-3xl max-h-[85dvh]`, `role="dialog"`, focus trap, Escape closes, body scroll locked, focus restored on close). Contents in order: title + close; cascading pill selects Catégorie → Spécialité → Service (levels 1→3 from the tree); `LocationFields` in filter mode (country › province › city › commune); `Choice` Langue parlée; `Choice` Mode d'intervention; sort select (Recommandé / Note / Distance / Nouveaux); Note minimale 4-button row (Toutes / 3+ / 4+ / 4,5+); two full-width switch rows (Premium uniquement with `Crown`, Vérifiés uniquement with `BadgeCheck`); sticky bottom bar with "Réinitialiser" outline and gold "Appliquer".

**Desktop 1440 px**

Grid `sm:grid-cols-3 lg:grid-cols-4`. The sheet becomes a centred `sm:rounded-3xl` modal with the same content. Everything else keeps the single-column stack; there is no persistent sidebar (the K-YOU direction removes it).

**Map**: `SearchMapView` uses `react-leaflet` with OpenStreetMap tiles (already allowed in `next.config.ts` remote patterns), fits bounds to results, and renders a custom photo pin per provider (`border-radius: 50% 50% 50% 8px`, rotated −45°, provider photo inside, `shadow` per the tokens). Clicking a pin opens a small popover card with name, category, rating and "Voir le profil". The map is loaded only when the toggle is on.

**States**: loading → skeletons; empty → dashed card; error → toast "Recherche indisponible" plus the previous results kept on screen; geolocation denied → toast "Position refusée", "À proximité" pill returns to idle.

**Delete**: `src/app/services/ServicesPageContent.tsx` (1250 lines) and its inline `FilterPanel`, `PriceSlider`, `Toggle`, `CategoryRow`; `src/app/categories/**`; `ProviderShowcaseCard` and `ProviderShowcaseCardSkeleton` exports (03).

---

## `/prestataire/[id]` — Provider profile

Reference: `screenshots/ui-refresh/prestataire.png`.

**Files**: `apps/web/src/app/prestataire/[id]/page.tsx` (server, `generateMetadata`, `createAuthenticatedServerApiClient()`), `apps/web/src/app/prestataire/[id]/ProviderProfileClient.tsx`, components in `apps/web/src/components/provider/`: `ProviderHeaderCard.tsx`, `TierBadge.tsx`, `ContactBlock.tsx`, `ContactsLocked.tsx`, `DistanceEstimator.tsx`, `Gallery.tsx` + `Lightbox.tsx`, `SocialEmbeds.tsx`, `ProviderChoices.tsx`, `SkillsList.tsx`, `ReviewsList.tsx`, `ReviewForm.tsx`, `ScheduleSummary.tsx`, `AddressCard.tsx`.

**Audience**: public. Contact block, booking form, review form and address card are behind `LoginWall` for anonymous visitors. Phone, WhatsApp and email are additionally hidden when the API returns `contactsLocked: true`.

**SSR data**

| Call | Endpoint | Notes |
| --- | --- | --- |
| `providersApi.getById(id)` | `GET /providers/:id` | `notFound()` on 404. The bearer from the cookie decides whether contacts are present. |
| `providersApi.reviews(id, { limit: 50 })` | `GET /providers/:id/reviews` | first page only |

**Client data**

| Call | Endpoint | Trigger |
| --- | --- | --- |
| `providersApi.availability(id, date)` | `GET /providers/:id/availability?date=` | date change in `BookingForm` |
| `bookingsApi.create(payload)` | `POST /bookings` | booking submit; 409 `SLOT_TAKEN` → refetch availability and toast |
| `reviewsApi.create(payload)` | `POST /reviews` | review submit; 409 → toast "Vous avez déjà noté ce prestataire" |
| `conversationsApi.create(payload)` | `POST /conversations` | `MessageComposer` submit, then `router.push('/messagerie?c=<id>')` |
| `safetyApi.report(payload)`, `safetyApi.block(userId)` | `POST /reports`, `POST /blocks` | `SafetyActions` |
| `geoApi.geocode(q)` / `geoApi.distance(...)` | `GET /geocode`, `GET /distance` | `DistanceEstimator` |
| `bookingsApi.mine({ status: 'COMPLETED', providerId })` | `GET /bookings` | signed-in clients only, decides whether the review form is enabled |

**Layout, mobile 390 px**

1. Back link "← Rechercher" (uses `router.back()` when the referrer is `/rechercher`, else links there).
2. `ProviderHeaderCard` — `rounded-3xl border bg-white shadow-soft`, 12 px colour strip on top using `Category.color`; 96 px `ProviderAvatar`; H1 name; `SafetyActions` (Signaler / Bloquer, signed-in only); `TierBadge` (Vérifié emerald / Boosté amber / Elite violet, from `premiumTier` and `verificationStatus`); category chip (coloured square icon + deepest node label) with "n ans d'expérience"; meta row (amber star + `ratingAvg` + `(ratingCount) avis`, `MapPin` place chain "Kinshasa, RDC", distance in primary when a viewer position exists); `ExpandableText` description at 180 characters.
3. `ContactBlock` — signed in: full-width primary "Envoyer un message" (opens `MessageComposer`); then a 2-column grid: `tel:` Appeler, WhatsApp (emerald-500, only when `feat_whatsapp` and a number exists), and a full-width `mailto:`. When `contactsLocked`: `ContactsLocked` renders a blurred fake contact block with an overlay pill "Contacts verrouillés", one explaining line and a link to `/premium`. Anonymous: `LoginWall`.
4. `DistanceEstimator` — `rounded-2xl bg-primary/5` block with `AddressAutocomplete`; picking an address recomputes the header distance client-side.
5. `Gallery` — `grid-cols-2` square thumbnails from `media` of kind IMAGE, opening `Lightbox` (black/80 overlay, arrows, Escape). Dashed empty state.
6. `SocialEmbeds` — YouTube / Instagram / TikTok / Facebook embeds with a header strip (420 px tall for TikTok and Instagram, `aspect-video` otherwise), falling back to an outbound link tile when embedding fails. Then `VideoGallery`.
7. `ProviderChoices` — chips for skills (reference + free), languages, intervention modes; indicative price block "à partir de {amount} {currency} · {unit}" when present.
8. `ReviewsList` — "Avis clients (n)"; white cards with name, `StarRating`, `ExpandableText` comment, provider reply when present; dashed empty state.
9. `ScheduleSummary` — "Horaires" card listing weekday ranges and the next three exceptions.
10. `AddressCard` — signed in and contacts unlocked only: address line, place chain, "Itinéraire" link to Google Maps with lat/lng.
11. `BookingForm` (anchor `#reserver`) — see Shared components. When `feat_booking` is off: muted notice "Réservations temporairement désactivées". Anonymous: `LoginWall`.
12. `ReviewForm` (anchor `#avis`) — `StarRating` interactive at 22 px, 500-character textarea with `n/500` counter, submit. Enabled only when the viewer has a COMPLETED booking with this provider that has no review yet; otherwise a muted line explains why. Anonymous: `LoginWall`. `feat_reviews` off: muted notice.

**Desktop 1440 px**

`max-w-5xl`. From step 5 the page becomes `md:grid-cols-3`: left `md:col-span-2` holds Gallery, SocialEmbeds + VideoGallery, ProviderChoices, SkillsList, ReviewsList; right column holds ScheduleSummary, AddressCard, BookingForm, ReviewForm, sticky at `top-24`. Header card and contact block stay full width above the grid.

**States**: 404 → `not-found.tsx`. Suspended owner or hidden profile → 404 (server decides). Availability loading → slot pills shimmer; no slots → "Aucun créneau ce jour". Attachment upload failure in the composer → inline error, the draft is kept.

**Motion**: header card fades and rises; gallery thumbnails stagger 0.03 s; lightbox and composer use the shared `Sheet`/modal spring; "Voir plus" expands with height auto.

**Delete**: `src/app/providers/**`, `src/components/provider-profile/**` (`ProviderHeader`, `ProviderAbout`, `ProviderRecentWork`, `ProviderReviews`, `ProviderSkills`, `ProviderCredentials`, `BookingRail`, `ContactDialog`, `MobileStickyBar`), `src/app/book/**`, `src/app/review/**`, `src/components/booking/**` (BookingShell, SidebarRail, Step1–4, RecapCard, BookingStepper, `booking-state.ts`), `KayouMoment` usage.

---

## `/services` — Services grid

Reference: `screenshots/ui-refresh/services.png`.

**Files**: `apps/web/src/app/services/page.tsx` (server, fetches the tree), `apps/web/src/app/services/ServicesClient.tsx`.

**Audience**: public. Footer shown.

**Data**: SSR `categoriesApi.getTree()`; the client only filters locally. Short labels come from `apps/web/src/copy/services.ts` (`shortLabel[slug]`, falling back to the name).

**Layout, mobile 390 px**: back icon-button + H1 "Explorer les services" (22 px on mobile); mint search pill (`#E9F0EB`, `rounded-[28px]`, Search icon, transparent input) filtering by name and short label; a **fixed four-column grid** of `ServiceCell` (min-height 105 px on mobile / 128 px desktop, `rounded-3xl`, `#F0F0E9`, 32 px outline Lucide icon with an 8 px gold dot badge, two-line short label, `gap: 9px`); a full-width pill "Tous les services / Moins de services" toggling between the first 12 and all 19; empty-state paragraph when the filter matches nothing; closing full-width dark primary CTA "Trouver un prestataire →" → `/rechercher`.

**Desktop 1440 px**: `max-w-5xl`, same four columns with larger cells and 13 px labels.

**Interactions**: cells link to `/rechercher?category=<slug>`. Cells scale 0.975 on press.

**Delete**: the old `/services` search page is replaced by `/rechercher` (redirect above). `CategoryTile` "centered-mono" variant export (03).

---

## `/premium`

Reference: K-YOU `src/pages/Premium.jsx`.

**Files**: `apps/web/src/app/premium/page.tsx` (server, static). Renders on the auth canvas outside the shell? **No** — K-YOU renders it inside `Layout` with the `.auth-canvas` treatment as page background. Do the same: inside `Layout`, page-level canvas class from 04.

**Layout**: centred 480 px `AuthCard`: amber `Sparkles` 40 px, H1 "Votre talent mérite de briller.", paragraph stating that paid plans are not enabled, `PrimaryAction` → `/prestataire/nouveau` (or `/mon-espace` when the viewer is already a provider). No data.

---

## `/contact`

Reference: `screenshots/ui-refresh/contact.png`.

**Files**: `apps/web/src/app/contact/page.tsx` (server, metadata), `apps/web/src/app/contact/ContactClient.tsx`.

**Audience**: public. Footer shown.

**Data**: channels from `useSiteContent()` (`contact_phone`, `contact_email`, `contact_website`); submit `contactApi.send(payload)` → `POST /contact`. 429 → toast "Trop de messages, réessayez plus tard".

**Layout, mobile 390 px**: "← Retour" link; H1 "Nous contacter" + subtitle; three clickable channel cards (Phone, Mail, Globe in a `bg-primary/10` square, uppercase label, bold value) and a non-clickable "Zone — Kinshasa, RDC · Congo-Brazzaville" card with an amber `MapPin`; white `rounded-3xl` form card: Nom complet* + Téléphone in `grid-cols-2`, Email*, Sujet*, Message* (5 rows), full-width emerald→teal gradient submit with `shadow-brand` and an inline spinner inside the button only. Success replaces the form with an emerald check circle, thank-you copy, and "Envoyer un autre message".

**Desktop 1440 px**: `max-w-5xl lg:grid-cols-5`, channel cards in `lg:col-span-2`, form in `lg:col-span-3`.

**Validation**: name ≥ 2, valid email, subject ≥ 3, message ≥ 10; inline errors under fields; `aria-invalid`.

---

## `/cgu`

**Files**: `apps/web/src/app/cgu/page.tsx` (server, static), content in `apps/web/src/copy/legal.ts` as an array of `{ n, title, paragraphs[], bullets?[] }`.

**Layout**: `mesh-bg` page background, `max-w-3xl`; "← Retour à l'accueil"; header card (`rounded-3xl bg-white shadow-soft`) with the emerald→teal `ShieldCheck` tile, H1 "Conditions générales d'utilisation", "KAYOU" editor line, and an outline "Imprimer / Exporter en PDF" button calling `window.print()` (a `@media print` rule in `globals.css` hides the shell); 12 numbered section cards (`rounded-2xl bg-white shadow-soft`, numbered `bg-primary/10` badge, body, `list-disc marker:text-primary` bullets); copyright line. Section titles follow K-YOU's twelve headings with the KAYOU legal entity substituted. Footer shown.

---

## `/confidentialite` and `/delete-account`

**Files**: `apps/web/src/app/confidentialite/page.tsx` (server, static), `apps/web/src/app/delete-account/page.tsx` re-exporting the same component (store listings need a stable deletion URL later).

**Layout**: `article max-w-3xl px-5 py-12`; `ShieldCheck` 36 px; H1 "Vos données. Votre contrôle."; "KAYOU"; five sections (Ce que nous utilisons / Vos fichiers / Votre sécurité / Supprimer votre compte / Nous contacter) as `<section><h2><p>`; `PrimaryAction` → `/compte#supprimer`; `SecondaryAction` → `/contact`. Footer on `/confidentialite` only. `/launch/confidentialite` is untouched (09).

---

## `not-found`

**Files**: `apps/web/src/app/not-found.tsx`.

**Layout**: inside `Layout` (K-YOU's off-system slate 404 is not reproduced). Centred `max-w-md`: `Compass` icon in a `bg-secondary` circle, H1 "Page introuvable", one line with the attempted path in mono, `PrimaryAction` "Retour à l'accueil" and `SecondaryAction` "Rechercher un prestataire". No data.

---

## Shared components

All under `apps/web/src/components/`. Each is a client component unless noted. Props are typed against `@kayu/schemas` DTOs; no component reshapes API data itself (mapping helpers live in `apps/web/src/lib/dto/*`).

| Component | Path | Contract |
| --- | --- | --- |
| `ProviderCard` | `provider/ProviderCard.tsx` | Search result tile: square photo with a top-right chip (amber star + rating or "—"), name (2 lines max), specialty line (deepest node label, 2 lines, `line-clamp-2`), `MapPin` + city, gold pill "Voir le profil →". Links to `/prestataire/[id]`. `whileHover` image scale 1.035 pointer-fine only. Skeleton twin `ProviderCardSkeleton`. |
| `ProviderAvatar` | `provider/ProviderAvatar.tsx` | Rounded image with the fallback ladder: `profilePhoto` → initials in Sora on mint → Lucide `User` on mint. Sizes 32 / 44 / 56 / 96 / 112. Server-safe. |
| `StarRating` | `ui/StarRating.tsx` | Read-only row (amber-400 fill) or interactive (`onChange`, keyboard arrows, `role="radiogroup"`). Sizes 14 / 18 / 22. |
| `ExpandableText` | `ui/ExpandableText.tsx` | Preview at `chars` (default 180) or `lines`; "Voir plus / Voir moins" button in primary, 36 px touch height; original text untouched. |
| `LoginWall` | `auth/LoginWall.tsx` | `rounded-2xl border-primary/10 bg-primary/5 p-5 text-center`, `Lock` circle, message, two pills → `/login?returnTo=` and `/register?returnTo=` with the current path sanitised by `safeReturnTo()` (path must start with `/` and not `//`). |
| `SafetyActions` | `provider/SafetyActions.tsx` | Two text buttons Signaler / Bloquer opening a small sheet: reason textarea for reports (`POST /reports`), confirm for block (`POST /blocks`). After a block, `router.replace('/rechercher')` with a toast. |
| `BookingForm` | `booking/BookingForm.tsx` | Card "Réserver un créneau": date input (min today, provider timezone), slot pills from `GET /providers/:id/availability` (shimmer while loading, "Aucun créneau" when empty), phone field prefilled from the user (`PhoneField`, E.164), address choice (default address, another saved address, or a new `AddressAutocomplete` + `LocationFields`), notes (2000 chars), gold submit. On success: inline emerald confirmation with the date/time and a link to `/mes-reservations`. |
| `MessageComposer` | `messaging/MessageComposer.tsx` | Modal sheet with subject (optional, 120 chars), body (4000 chars), `AttachmentBar` (image picker ≤ 8 MB, voice recorder producing `audio/webm` ≤ 8 MB) uploading through `POST /me/uploads/sign` purpose `attachments`; submit → `POST /conversations`; 403 blocked → error line. |
| `ReferenceFields` | `reference/LocationFields.tsx`, `reference/Choice.tsx`, `reference/MultipleChoices.tsx`, `reference/PricingFields.tsx`, `reference/SuggestPlaceForm.tsx`, `reference/useReferences.ts` | `LocationFields`: cascading `Choice` selects country › province › city › commune › quartier from `GET /places?kind&parentId`, with a "Mon lieu est absent" link opening `SuggestPlaceForm` (`POST /places/suggestions`). `mode="filter"` stops at commune and allows empty. `Choice`: pill select with search for lists > 12. `MultipleChoices`: pill multi-select with search over `GET /references?type=`. `PricingFields`: checkbox "Afficher un tarif indicatif" revealing amount + currency + unit selects. `useReferences(type)` wraps TanStack Query with `staleTime: 60 s`. |
| `AddressAutocomplete` | `geo/AddressAutocomplete.tsx` | Debounced text input calling `GET /geocode?q=`; returns `{ label, lat, lng, placeGuess }`; shows a green "✓ Vérifié GPS: lat, lng" line (Lucide `Check`). Browser geolocation fallback with a 5 s timeout. |
| `SearchMapView` | `search/SearchMapView.tsx` | Described above. `dynamic(() => import(...), { ssr: false })`. |
| `VideoGallery` | `media/VideoGallery.tsx` | Grid of video tiles; YouTube tiles show the thumbnail and load the iframe only on click (`youtube-nocookie.com`), with an external link under it; uploaded videos use `<video controls preload="metadata">` from the public media URL. |
| `ScheduleSummary` | `provider/ScheduleSummary.tsx` | Renders rules grouped by weekday ("Lun 08:00–12:00 · 14:00–18:00"), closed days muted, next exceptions. Server-safe. |
| `SectionHeading` | `ui/SectionHeading.tsx` | Eyebrow pill + H2 + optional subtitle, `align="left" \| "center"`, optional right-side action slot. Server-safe. |
| `CategoryFeatured`, `CategoryMedallion` | `home/` | Described in Home. Server-safe. |

`PhoneField`, `Sheet`, `Skeleton`, `EmptyState`, `PrimaryAction`, `SecondaryAction`, `Pill` come from workstream 04.

## Acceptance criteria

- The nine routes render at 320, 390 and 1440 px without horizontal overflow (checked in 10).
- Anonymous visitors never receive phone, WhatsApp or email in the HTML of `/prestataire/[id]`; the server omits them (verify with `curl` and no cookie).
- Search state round-trips through the URL: reload and back button restore filters, page and view mode.
- Booking a slot that another test client took in parallel returns the 409 path with a refreshed slot list.
- The review form is disabled without a completed booking and refuses a second review with the 409 toast.
- All copy comes from `apps/web/src/copy/*`; `grep -rn "'" apps/web/src/app/{page.tsx,rechercher,prestataire,services,premium,contact,cgu,confidentialite}` shows no French sentence literals inside JSX.
- No `@kayu/ui/web` component removed in 03 is imported anywhere under the owned paths.
- Old routes redirect with 308 as listed.

## Verification commands

```sh
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
curl -s http://localhost:3000/prestataire/<seeded-id> | grep -c "+243"    # expect 0
curl -sI http://localhost:3000/providers/<seeded-id> | head -1           # expect 308
node scripts/ui-review.mjs --routes "/,/rechercher,/prestataire/<id>,/services,/contact,/cgu,/confidentialite,/premium,/missing" --widths 320,390,1440
```
