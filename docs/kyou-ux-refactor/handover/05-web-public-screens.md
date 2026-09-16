# 05 → 06, 07, 08: public screens and shared components as implemented

Workstream 05 rebuilt the nine public routes of `apps/web` on branch `kyou-ux/05-public`. Decisions are logged in `PROGRESS.md` (rows prefixed "(05)"). This file lists what later workstreams reuse.

## Routes

| Route | Files | Rendering |
| --- | --- | --- |
| `/` | `(shell)/page.tsx` + `components/home/*` | Server, `force-dynamic`; stats, tree and settings fetched in parallel with per-call fallbacks; no client fetch |
| `/rechercher` | `(shell)/rechercher/{page,SearchClient}.tsx` + `components/search/*` | Client under `<Suspense>`; every criterion lives in the URL (`q, category, sub, service, place, language, mode, rating, verified, premium, sort, lat, lng, page, view`) |
| `/prestataire/[id]` | `(shell)/prestataire/[id]/{page,ProviderProfileClient}.tsx` + `components/provider/*` | Server through `createAuthenticatedServerApiClient()` (contacts follow the cookie); the client refetches `queryKeys.providers.detail(id)` once auth is `ready` |
| `/services` | `(shell)/services/{page,ServicesClient}.tsx` | Server fetches the tree; client filters locally |
| `/contact` | `(shell)/contact/{page,ContactClient}.tsx` | react-hook-form + zod; channels from `useSiteSettings()` |
| `/cgu`, `/confidentialite`, `/delete-account` | `(shell)/cgu/page.tsx`, `(shell)/confidentialite/{page,PrivacyArticle}.tsx`, `(shell)/delete-account/page.tsx` | Static; content in `copy/legal.ts` |
| `/premium` | `(canvas)/premium/{page,PremiumCard}.tsx` | Auth canvas (outside the shell, contract §8) |
| 404 | `app/not-found.tsx` + `app/NotFoundContent.tsx` | Inside `Layout` |

## Components handed to 06 and 07

All are client components under `apps/web/src/components/`; props are typed against `@kayu/schemas`.

| Component | Props | Notes |
| --- | --- | --- |
| `auth/LoginWall` | `message?`, `className?` | Uses `usePathname()` for `returnTo` through `loginPath` / `registerPath` |
| `booking/BookingForm` | `providerId`, `timezone`, `enabled` (feat_booking), `onBooked?` | Date (min today in the provider timezone), slot pills from `GET /providers/:id/availability` (skeleton while loading), `PhoneField` prefilled from `user.phone`, address choice (none / default / saved / new with `AddressAutocomplete` + `LocationFields`), notes; 409 `SLOT_TAKEN` refetches availability and toasts; PROVIDER viewers get a muted notice |
| `messaging/MessageComposer` | `open`, `onClose`, `providerId`, `providerName` | `BottomSheet` modal; subject ≤ 120, body ≤ 4000, `AttachmentBar`; `POST /conversations` then `router.push('/messagerie?c=<id>')`; 403 `BLOCKED` → inline line |
| `messaging/AttachmentBar` | `attachments: PendingAttachment[]`, `onChange`, `onError` | Image picker (jpeg/png/webp ≤ 8 MB) and `MediaRecorder` voice note (`audio/webm`, `audio/mp4` on Safari) uploaded with `uploadFile("attachments", file)`; `PendingAttachment` = `MessageAttachmentInput & { previewUrl, name }` |
| `provider/ReviewForm` | `providerId`, `enabled` (feat_reviews), `onCreated(review: PublicReview)` | Eligibility from `GET /bookings?status=COMPLETED&limit=100` (client side, same provider, `hasReview` false); interactive `StarRating` 22 px; 500-char counter; 409 → "Vous avez déjà noté ce prestataire." |
| `provider/SafetyActions` | `providerId`, `ownerId` | Report sheet (`POST /reports`, `targetKind: "PROVIDER"`) and block confirm (`POST /blocks`) then `router.replace('/rechercher')` |
| `provider/ProviderCard`, `ProviderCardSkeleton` (in `search/`) | `provider: ProviderCard`, `category?: CategoryTreeNode`, `viewer?: LatLng`, `index?` | Square photo, rating chip, deepest node label, city, distance or review count, gold pill |
| `provider/ProviderAvatar` | `src`, `name`, `size` 32/44/56/96/112, `fill?`, `rounded?` | photo → initials → `User` on mint |
| `provider/TierBadge`, `ScheduleSummary`, `AddressCard`, `ProviderChoices`, `SkillsList` | see files | Server-safe |
| `reference/LocationFields` | `value: placeId \| null`, `onChange(placeId, chain)`, `mode` `"filter" \| "full"`, `allowSuggest?` | Cascading selects from `GET /places?kind=COUNTRY` then `?parentId=`; restores a chain from `GET /places/:id/ancestors`; filter mode stops at COMMUNE; "Mon lieu est absent" → `SuggestPlaceForm` (`POST /places/suggestions`, login hint when anonymous) |
| `reference/Choice` | `label`, `options {id,label}[]`, `value`, `onChange`, `placeholder?`, `required?`, `disabled?` | Pill select; search box above 12 items |
| `reference/MultipleChoices` | `label`, `type: ReferenceType`, `categoryId?`, `value: string[]`, `onChange` | Pill multi-select over `useReferences(type, categoryId)` |
| `reference/PricingFields` | `value: { amount, currencyId, unitId } \| null`, `onChange` | Checkbox revealing amount + CURRENCY + PRICE_UNIT selects |
| `reference/useReferences` | `useReferences(type, categoryId?)`, `usePlaces(params \| null)`, `usePlaceAncestors(id \| null)` | TanStack Query, 60 s stale, `queryKeys.references.list` / `places.list` / `places.ancestors` |
| `geo/AddressAutocomplete` | `value`, `onChange(text)`, `onSelect(GeoPick \| null)`, `label`, `placeholder?`, `allowBrowserPosition?` | Debounced `GET /geocode?q=` (one result, 404 → "Adresse introuvable."), green "Vérifié GPS" line, browser position fallback with a 5 s timeout |
| `media/VideoGallery` | `items: ProviderMedia[]` | YouTube thumbnail → `youtube-nocookie.com` iframe on click; uploads use `<video controls preload="metadata">` |
| `ui/StarRating` | `value`, `size` 14/18/22, `onChange?`, `label?` | Read-only row or `role="radiogroup"` with arrow keys |
| `ui/ExpandableText` | `text`, `chars?` (180), `lines?` 2/3/4 | "Voir plus / Voir moins" |
| `ui/SectionHeading` | `eyebrow?`, `title`, `subtitle?`, `align?`, `action?` | Server-safe |
| `ui/PhoneField` | `value`, `onChange(e164)`, `label`, `required?`, `error?` | Prefix select (+243 default) + local number → E.164 |

## Helpers

- `lib/dto/provider.ts`: `tierBadgeKind`, `rootCategory`, `deepestCategory`, `categoryColorClass(slug)`, `cityOf`, `countryShort`, `placeLabel` ("Kinshasa, RDC"), `placeChainLabel`, `formatRating`, `whatsappLink`, `imageMedia`, `videoMedia`.
- `lib/dto/category.ts`: `findRoot`, `findNode`, `normalizeText`. `lib/dto/icons.ts`: `lucideIcon(name)` (server-safe, `Tag` fallback). `lib/dto/categoryColors.ts`: the 19 `bg-*` classes (must stay inside `apps/web` for Tailwind's scan).
- `hooks/useCategoryTree(initialData?)`: `{ tree, isLoading }`, 5 min stale.
- `lib/geo.ts`: `getBrowserPosition(timeoutMs)`, `GeolocationDenied`, `roundCoord`.
- `copy/provider.ts` also holds the copy for the shared components above (`booking`, `composer`, `review`, `loginWall`, `phoneField`, `geo`, `references`).

## Conventions kept

- Every string lives in `copy/*.ts`; route files contain no French literal.
- Skeletons on content (`ProviderCardSkeleton`, slot shimmer); the only spinners are the `Navigation` icon while locating and the inline submit spinner on the contact button.
- Framer sections keep `initial`/`animate` and switch to `transition: { duration: 0 }` (or `animate` instead of `whileInView`) under `useReducedMotion()`; never drop the props, or the server-rendered `opacity: 0` stays.
