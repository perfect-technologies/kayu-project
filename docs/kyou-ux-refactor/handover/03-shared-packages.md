# 03 → 02, 04–09: shared packages as implemented

Workstream 03 rebuilt `@kayu/utils`, `@kayu/schemas`, `@kayu/api` and `@kayu/ui` on branch `kyou-ux/03-packages` against the 02 contract (`02-backend-contract.md`, `02-example-responses.json`) and the 00 contract §9–§10. Decisions are logged in `PROGRESS.md` (rows prefixed "(03)").

Build order is unchanged: `utils → schemas → api → ui → backend/web`. `@kayu/schemas` now depends on `@kayu/utils` (schedule rules and YouTube hosts live there).

## `@kayu/schemas`

| File | Holds |
| --- | --- |
| `common.ts` | `IdSchema`, `DateTimeSchema`, `BooleanQuerySchema`, `pagination(defaultLimit)`, `PaginationQuery`, `createPaginatedResponseSchema` (`{ items, total, page, limit }`), `OkResponseSchema`, field schemas (`DateOnlySchema`, `PhoneE164Schema`, `StoragePathSchema`, `HttpsUrlSchema`, `LatitudeSchema`, `LongitudeSchema`, `CountrySchema`, `optionalText`, `csvIds`), `API_ERROR_CODES`, `ApiErrorResponseSchema`, the `Wire<S>` request type |
| `enums.ts` | All marketplace enums of 01 plus `UploadPurpose`, `MessageAttachmentKind`; lead enums unchanged |
| `schedule.ts` | `SCHEDULE_LIMITS` (re-exported from utils), `TimezoneSchema`, `TimeOfDaySchema`, `ScheduleRuleInput`, `ScheduleExceptionInput`, `ScheduleInputSchema`, `toMinutes` |
| `media.ts` | `MEDIA_LIMITS`, `YOUTUBE_HOSTS` (re-exported from utils), `MediaInputSchema`, `MediaListInputSchema`, `MessageAttachmentInput` |
| `taxonomy.ts` | `TaxonomySeedNodeSchema`, `TaxonomySeedSchema` (validates K-YOU `shared/taxonomy.json`: 19 roots, 213 nodes) |
| `models.ts` | Row schemas and projections (`UserSchema`, `ProviderCardSchema`, `ProviderPublicSchema`, `BookingCardSchema`, `BookingDetailSchema`, `CategoryTreeNodeSchema`, `PlaceSummarySchema`, `ConversationSchema`, `MessageSchema`, `NotificationSchema`, …), `SITE_SETTING_*` and `SiteSettingsSchema` |
| `verification.ts` | KYC document, state, upload, queue and review schemas (new doc columns, no disputes) |
| `dto.ts` | One request schema and one response schema per 02 route, grouped as in the 02 contract |
| `launch-leads.ts` | Lead and funnel DTOs and constants, byte-identical to `main`, plus `KIN_COMMUNES` (campaign form) |

### Naming

- **Schemas** end in `Dto` (bodies), `Params` / `QueryParams` (query strings), `ResponseSchema` (bodies returned) or `Schema` (shared shapes).
- **The same name as a type** (`CreateBookingDto`, `ProviderSearchParams`) is what a client sends: `Wire<typeof Schema>`. Keys are optional when the schema accepts them missing, values have the parsed type (so `page` is `number`, `verifiedOnly` is `boolean`, not `unknown` as `z.input` gives for coerced fields).
- **`…Input` / `…Query`** (`CreateBookingInput`, `ProviderSearchQuery`) are what a handler holds after parsing. These names are exactly 02's drafted names.
- **`…Response`** is the inferred body of `…ResponseSchema`; shared shapes drop `Schema` (`ProviderCard`, `BookingDetail`).
- Dates are `string | Date` (`DateTimeSchema`), so the same types serve the backend (Dates) and the web (ISO strings).

### Evidence that the contract matches 02

- **Responses:** every one of the 173 bodies in `02-example-responses.json` parses with its response schema (errors with `ApiErrorResponseSchema`, codes inside `API_ERROR_CODES`), and no field is stripped, so every returned field is modelled.
- **Requests:** the 110 Zod schemas exported by `apps/backend/src/common/contract` exist in `@kayu/schemas` under the same names, and `z.toJSONSchema` is identical for input and output for all of them; `SCHEDULE_LIMITS`, `MEDIA_LIMITS`, `YOUTUBE_HOSTS` and the `SITE_SETTING_*` constants are deep-equal.
- **Refinements:** `ScheduleInputSchema` delegates its cross-field rules to `validateSchedule` from `@kayu/utils`. On valid payloads and on payloads that break a schedule rule (overlap, five ranges, slotless range, duplicate or malformed exceptions) the issues are identical to 02's draft. On payloads that already fail a field format (`"8:00"`, `2030-02-30`) it reports the format error only, where 02's draft also added an overlap or duplicate-date issue computed from the bad value.

## For 02: swapping to the packages

1. `contractPipe(name)` can lazy-load `(await import("@kayu/schemas"))[name]`; every name it is called with exists. Type imports keep their names (`PublishProviderInput`, `ProviderSearchQuery`, `SiteSettings`, …).
2. `providers/schedule.ts` and `providers/youtube.ts` are in `@kayu/utils` with these differences:
   - `localSlotToInstant(date, time, timezone)` returns an **ISO string** (03 doc), not a `Date`: wrap with `new Date(...)` in `bookings.service.ts` and the specs.
   - `computeSlots` accepts `scheduledAt: Date | string`; `ScheduleException.startTime` / `endTime` / `reason` are optional.
   - `ParsedYouTube` is `ParsedYouTubeUrl`; `SCHEDULE_LIMITS` and `YOUTUBE_HOSTS` import from `@kayu/utils` or `@kayu/schemas`.
   - New: `validateSchedule(draft)` → `{ ok: true, schedule }` (rules sorted with `order`, exceptions sorted, closed days nulled) or `{ ok: false, errors: [{ path, message }] }` in French.
3. The backend is CJS: runtime values via `await import(...)`; types can be imported statically with `import type`.

## `@kayu/api`

- `ApiError` gains `code` (`ApiErrorCode | string`), read from the body's `code`: match `error.code === "SLOT_TAKEN"`, never `message`. `body` still holds the full JSON (`suspendedReason`, `counts`, `missingKinds`, `retryAfter`, validation `errors`).
- Query values: `undefined`/`null` are skipped, arrays are joined with commas (`placesApi.list({ ids })`), dates become ISO strings.
- `placesApi.list` and `placesApi.byIds` both call `GET /places`. `referencesApi.list(type, categoryId?, params?)` takes an optional third argument for `q`, `page`, `limit`.
- Launch-lead methods are unchanged.

### Route → method (111 routes; checked by calling every method against a recording `fetch`)

| Method | Path | Client method |
| --- | --- | --- |
| GET | `/addresses` | `addressesApi.list` |
| POST | `/addresses` | `addressesApi.create` |
| PATCH | `/addresses/:id` | `addressesApi.update` |
| DELETE | `/addresses/:id` | `addressesApi.remove` |
| GET | `/admin/audit` | `adminApi.audit` |
| GET | `/admin/bookings` | `adminApi.bookings` |
| POST | `/admin/bookings/:id/cancel` | `adminApi.cancelBooking` |
| GET | `/admin/categories` | `adminApi.categories` |
| POST | `/admin/categories` | `adminApi.createCategory` |
| GET | `/admin/categories/:id` | `adminApi.category` |
| PATCH | `/admin/categories/:id` | `adminApi.updateCategory` |
| DELETE | `/admin/categories/:id` | `adminApi.deleteCategory` |
| GET | `/admin/contacts` | `adminApi.contacts` |
| PATCH | `/admin/contacts/:id` | `adminApi.updateContact` |
| DELETE | `/admin/contacts/:id` | `adminApi.deleteContact` |
| GET | `/admin/conversations` | `adminApi.conversations` |
| DELETE | `/admin/conversations/:id` | `adminApi.deleteConversation` |
| GET | `/admin/conversations/:id/messages` | `adminApi.conversationMessages` |
| GET | `/admin/health` | `adminApi.health` |
| DELETE | `/admin/messages/:id` | `adminApi.deleteMessage` |
| GET | `/admin/overview` | `adminApi.overview` |
| GET | `/admin/places` | `adminApi.places` |
| POST | `/admin/places` | `adminApi.createPlace` |
| GET | `/admin/places/:id` | `adminApi.place` |
| PATCH | `/admin/places/:id` | `adminApi.updatePlace` |
| POST | `/admin/places/merge` | `adminApi.mergePlaces` |
| GET | `/admin/places/suggestions` | `adminApi.placeSuggestions` |
| POST | `/admin/places/suggestions/:id/approve` | `adminApi.approveSuggestion` |
| POST | `/admin/places/suggestions/:id/reject` | `adminApi.rejectSuggestion` |
| GET | `/admin/providers` | `adminApi.providers` |
| PATCH | `/admin/providers/:id` | `adminApi.updateProvider` |
| GET | `/admin/references` | `adminApi.references` |
| POST | `/admin/references` | `adminApi.createReference` |
| GET | `/admin/references/:id` | `adminApi.reference` |
| PATCH | `/admin/references/:id` | `adminApi.updateReference` |
| POST | `/admin/references/merge` | `adminApi.mergeReferences` |
| GET | `/admin/reports` | `adminApi.reports` |
| PATCH | `/admin/reports/:id` | `adminApi.resolveReport` |
| GET | `/admin/reviews` | `adminApi.reviews` |
| PATCH | `/admin/reviews/:id` | `adminApi.updateReview` |
| DELETE | `/admin/reviews/:id` | `adminApi.deleteReview` |
| GET | `/admin/settings` | `adminApi.settings` |
| PUT | `/admin/settings` | `adminApi.updateSettings` |
| GET | `/admin/subcategories` | `adminApi.subcategories` |
| POST | `/admin/subcategories` | `adminApi.createSubcategory` |
| GET | `/admin/subcategories/:id` | `adminApi.subcategory` |
| PATCH | `/admin/subcategories/:id` | `adminApi.updateSubcategory` |
| DELETE | `/admin/subcategories/:id` | `adminApi.deleteSubcategory` |
| GET | `/admin/users` | `adminApi.users` |
| PATCH | `/admin/users/:id` | `adminApi.updateUser` |
| GET | `/admin/users/:id/cv` | `adminApi.userCv` |
| PUT | `/admin/verification/documents` | `adminApi.reviewVerificationDoc` |
| GET | `/admin/verification/submissions` | `adminApi.verificationQueue` |
| GET | `/blocks` | `safetyApi.blocks` |
| POST | `/blocks` | `safetyApi.block` |
| DELETE | `/blocks/:userId` | `safetyApi.unblock` |
| GET | `/bookings` | `bookingsApi.list` |
| POST | `/bookings` | `bookingsApi.create` |
| GET | `/bookings/:id` | `bookingsApi.get` |
| POST | `/bookings/:id/cancel` | `bookingsApi.cancel` |
| POST | `/bookings/:id/complete` | `bookingsApi.complete` |
| POST | `/bookings/:id/confirm` | `bookingsApi.confirm` |
| PATCH | `/bookings/:id/notes` | `bookingsApi.updateNotes` |
| GET | `/categories/tree` | `categoriesApi.getTree` |
| POST | `/contact` | `contactApi.send` |
| GET | `/conversations` | `conversationsApi.list` |
| POST | `/conversations` | `conversationsApi.start` |
| GET | `/conversations/:id/messages` | `conversationsApi.messages` |
| POST | `/conversations/:id/messages` | `conversationsApi.send` |
| DELETE | `/conversations/:id/messages/:messageId` | `conversationsApi.deleteMessage` |
| GET | `/dashboard/client` | `dashboardApi.client` |
| GET | `/dashboard/provider` | `dashboardApi.provider` |
| GET | `/distance` | `geoApi.distance` |
| GET | `/geocode` | `geoApi.geocode` |
| DELETE | `/me` | `identityApi.deleteAccount` |
| GET | `/me` | `identityApi.me` |
| POST | `/me/accept-terms` | `identityApi.acceptTerms` |
| POST | `/me/avatar` | `mediaApi.setAvatar` |
| GET | `/me/media/sign-read` | `mediaApi.signRead` |
| PATCH | `/me/profile` | `identityApi.updateProfile` |
| POST | `/me/provider` | `providersApi.publish` |
| POST | `/me/uploads/sign` | `mediaApi.sign` |
| GET | `/notifications` | `notificationsApi.list` |
| PATCH | `/notifications/:id/read` | `notificationsApi.markRead` |
| PATCH | `/notifications/read-all` | `notificationsApi.markAllRead` |
| GET | `/places` | `placesApi.byIds`, `placesApi.list` |
| GET | `/places/:id/ancestors` | `placesApi.ancestors` |
| POST | `/places/suggestions` | `placesApi.suggest` |
| GET | `/pro/earnings/summary` | `earningsApi.summary` |
| GET | `/pro/earnings/transactions` | `earningsApi.transactions` |
| POST | `/pro/verification/documents` | `verificationApi.uploadDoc` |
| DELETE | `/pro/verification/documents/:id` | `verificationApi.removeDoc` |
| GET | `/pro/verification/state` | `verificationApi.state` |
| POST | `/pro/verification/submit` | `verificationApi.submit` |
| GET | `/providers` | `providersApi.search` |
| GET | `/providers/:id` | `providersApi.getPublic` |
| GET | `/providers/:id/availability` | `providersApi.availability` |
| GET | `/providers/:id/reviews` | `providersApi.reviews` |
| PATCH | `/providers/me` | `providersApi.updateMe` |
| PATCH | `/providers/me/availability` | `providersApi.setAvailability` |
| PUT | `/providers/me/media` | `providersApi.putMedia` |
| PUT | `/providers/me/schedule` | `providersApi.putSchedule` |
| GET | `/references` | `referencesApi.list` |
| POST | `/reports` | `safetyApi.report` |
| POST | `/reviews` | `reviewsApi.create` |
| POST | `/reviews/:id/reply` | `reviewsApi.reply` |
| POST | `/reviews/clients` | `reviewsApi.createClientReview` |
| GET | `/reviews/clients/:clientId/summary` | `reviewsApi.clientSummary` |
| GET | `/reviews/mine` | `reviewsApi.mine` |
| GET | `/settings/public` | `settingsApi.getPublic` |
| GET | `/stats` | `statsApi.getGlobal` |

### Query keys

Shape `[group, scope, params]`; invalidate a group with its first segment (`["bookings"]`, `["admin", "places"]`).

| Group | Keys |
| --- | --- |
| `settings`, `stats`, `categories` | `settings.public`, `stats.global`, `categories.tree` |
| `places` | `list(params)`, `byIds(ids)` (sorted), `ancestors(id)` |
| `references` | `list(type, categoryId?, params?)` |
| `providers` | `search(params)`, `detail(id)`, `availability(id, date)`, `reviews(id, params)` |
| `identity`, `media` | `identity.me`, `media.signRead(path)` |
| `bookings` | `list(params)`, `detail(id)` |
| `reviews` | `mine`, `clientSummary(clientId)` |
| `conversations` | `list(params)`, `messages(id, params)` |
| `safety`, `addresses`, `notifications` | `safety.blocks(params)`, `addresses.list(params)`, `notifications.list(params)` |
| `dashboard`, `earnings`, `verification` | `dashboard.provider`, `dashboard.client`, `earnings.summary`, `earnings.transactions(params)`, `verification.state` |
| `geo` | `geocode(params)`, `distance(params)` |
| `admin` | `overview`, `users(params)`, `userCv(id)`, `providers(params)`, `verification(params)`, `bookings(params)`, `reviews(params)`, `conversations(params)`, `conversationMessages(id, params)`, `contacts(params)`, `reports(params)`, `settings`, `audit`, `health`, `categories`, `category(id)`, `subcategories(params)`, `subcategory(id)`, `places(params)`, `place(id)`, `suggestions(params)`, `references(params)`, `reference(id)` |

## `@kayu/utils`

New: `toE164(value, "CD" | "CG")` (E.164 or `null`; RDC drops the trunk 0, Congo-Brazzaville keeps it), `formatMoney(amount, "CDF" | "USD" | "XAF")` (`25 000 FC`, `40 $`, `1 250 000 FCFA`), `formatRelativeFr(date, now?)` (`à l'instant`, `il y a 3 min`, `il y a 2 h`, `il y a 4 j`, `12 sept.`, `12 sept. 2025` for another year), `formatSlotLocal(iso, timezone)` (`{ date, time, label: "mer. 16 sept. · 09:00" }`), `parseYouTubeUrl`, `YOUTUBE_HOSTS`, and the schedule helpers (`SCHEDULE_LIMITS`, `computeSlots`, `validateSchedule`, `localSlotToInstant`, `toLocalSlot`, `localParts`, `scheduleSummary`, `normalizeRules`, `rangesForDate`, `addDays`, `weekdayOf`, `isValidDate`, `isTimeOfDay`, `toMinutes`, `clock`). Removed: `getDistanceStatus`, `getDistanceColor`.

## `@kayu/ui` tokens (`@kayu/ui`)

| Export | Content |
| --- | --- |
| `paletteHsl` | §9 HSL triplets verbatim (`background` `48 20% 97%`, `primary` `165 74% 14%`, `accent` `43 100% 57%`, …, `brandGlow` `172 60% 32%`) |
| `themeCssVariables` | The Tailwind v4 `@theme` entries of 04 §A (`--color-*`, `--radius`, `--radius-field/card/card-lg/hero`, `--shadow-soft/soft-lg/brand`, `--ease-screen`), built from the values above; paste or generate into `globals.css` |
| `palette` | Hex for inline styles: the §9 colours, `adminCanvas`, `authCanvas`, `authCanvasMobile`, `star` (amber-400), `focusRing` (`#E8AE29`), `primaryHover`, `secondaryHover`, `skeleton`, and `status.{confirmed,pending,cancelled,completed,elite,messages}` as `{ bg, fg, border }` |
| `fonts` | `heading` Sora Variable, `body` Plus Jakarta Sans Variable, `mono` system stack |
| `textStyles` | §9 type scale as Tailwind class strings (`pageTitle`, `hero`, `sectionTitle`, `body`, `caption`, `captionSm`, `eyebrow`) |
| `radii` | `base 20` (`--radius`), `field 14`, `card 16`, `cardLg 24`, `hero 32`, `pill 9999` |
| `elevation` | `soft`, `softLg`, `brand` (`0 16px 40px -12px hsl(172 60% 32% / .5)`) |
| `containers` | px: `marketing 1280`, `content 1024`, `dashboard 896`, `utility 768`, `auth 448`, `admin 1500` |
| `motion` | §10: screen enter 240 ms / opacity .45 / 7 px, `easeScreen`, press 140 ms / .975, dock icon .87, pulse 420 ms / 38 px / 6 live, sheen 1400 ms, sheet and dock springs, wizard 24 px / 280 ms, focus ring 3 px / 4 px |
| `categoryColors` | The 19 K-YOU root slugs → Tailwind `bg-*` class |

Everything below the `Legacy exports (frozen Expo app)` banner in `tokens.ts` (v2 `tokens`, `CategorySlug`, the photo-forward card helpers, v1 `colors`/`spacing`/`borderRadius`/`typography`/`shadows`/`brand`) exists only for `apps/mobile` and `src/mobile/**`. Do not import it from `apps/web`.

## `@kayu/ui/web` primitives

All are client components with inline styles from the tokens, so they render the same without app CSS. Fonts resolve `var(--font-heading)` / `var(--font-body)` first (04's `@theme`), then the token stack. Focus rings come from the app's global `:focus-visible`.

| Component | Props |
| --- | --- |
| `Button` (forwardRef) | `variant` `primary` (deep green pill) · `gold` (accent pill) · `secondary` (white, bordered, 14 px) · `ghost` · `danger` (red text, bordered); `size` `sm` 36 · `md` 44 (default) · `lg` 54 px min height; `leadingIcon`, `trailingIcon`, `loading` (disabled + `aria-busy`, 55 % opacity), `fullWidth`; `type` defaults to `"button"`; native button props. Press scales to .975 unless reduced motion |
| `Input` (forwardRef) | `label` (required), `hideLabel` (screen-reader only), `helperText`, `error` (red border, `role="alert"` message), `leadingIcon`, `trailingIcon`, `containerClassName`; native input props except `size`. 48 px field, 14 px radius, 12 px label |
| `Avatar` | `src`, `name`, `initials`, `size` (48), `alt`, `ring` (gold), `className`, `style`. Photo → initials on mint → Lucide `User` on mint; a broken `src` falls back |
| `Icon`, `I`, `resolveLucideIcon`, `FallbackCategoryIcon` | `I.<name>` preset map (`size` 20, `stroke` width 1.75, `strokeColor`); `I.verified` replaces `I.badgeCheck`; `resolveLucideIcon(Category.icon)` returns any Lucide icon by name or `null` |
| `StarRating` | `value`, `count`, `size` (14), `className`. Amber-400 star, one decimal, count in plain text |
| `Shimmer`, `ShimmerStyles` | `width`, `height`, `radius` (14), `className`, `style`; mount `<ShimmerStyles />` once for the 1.4 s sheen (off under reduced motion) |
| `EmptyState` | `icon`, `title`, `description`, `action` (one CTA node), `className`, `style`. Dashed 2 px, 24 px radius |
| `ErrorState` | `title`, `description`, `action`, `className`, `style` |
| `InlineAlert` | `variant` `info` · `success` · `warning` · `error` (messages / confirmed / pending / cancelled tones), `title`, `description`, `action` `{ label, onClick }`, `icon`, `className`, `style` |
| `ToastProvider`, `useToast` | Provider `topOffset` (24), `closeLabel` ("Fermer"); `useToast().show({ variant, message, durationMs = 4000, dismissible = true, id? })` → id, `dismiss(id)` |

Removed from the package: the 22 components listed in the 03 doc, `cards.ts`, and the presets that carried inline French copy (`NoBookingsEmpty` and siblings, `NetworkErrorState` and siblings, `FormErrorBanner`); build those from `EmptyState` / `ErrorState` / `InlineAlert` with strings from `apps/web/src/copy/*`. The composites the 03 doc lists for `apps/web/src/components/` (`ProviderCard`, `CategoryFeatured`, `CategoryMedallion`, `SectionHeading`, `MetricCard`, `ExpandableText`, `LoginWall`, `BottomSheet`, `FilterSheet`) never existed in `packages/ui` on this branch, so nothing moved; 04 and 05 build them in the app.

## Mobile freeze

- `apps/mobile` is untouched (`git diff main --stat -- apps/mobile` is empty).
- `@kayu/ui` type-check and build compile `src/mobile/**`; the only mobile edits are three imports (`FeaturedProviderCard`, `NearbyCard`, `WideProviderCard`) re-pointed from the deleted `../cards.js` to `../tokens.js`.
- `pnpm --filter @kayu/mobile type-check`: 6 pre-existing errors before 03, 181 after. None mention `@kayu/ui`; the 175 new ones are removed `@kayu/api` methods and `@kayu/schemas` exports, which the README accepts for the life of the refactor.
