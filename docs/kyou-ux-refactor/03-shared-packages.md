# 03 - Shared Packages

Status: **Done** (2026-09-16). The packages as implemented, including the deviations from this doc, are described in [`handover/03-shared-packages.md`](./handover/03-shared-packages.md); decisions are logged in `PROGRESS.md` with the prefix "(03)".

## Objective

Bring `packages/schemas`, `packages/api`, `packages/ui` and `packages/utils` in line with the workstream 02 endpoint contract and the workstream 00 design tokens, so that `apps/web` consumes one typed client and one token set, and the backend validates with the same Zod schemas.

## Severity

P0. Workstreams 04–09 import from these packages; the backend pipes import the DTOs at runtime.

## Owns

- `packages/schemas/src/**`
- `packages/api/src/**`
- `packages/ui/src/tokens.ts`, `packages/ui/src/web/**`, `packages/ui/src/index.ts`, `packages/ui/src/cards.ts`
- `packages/utils/src/**`, `packages/utils/test/**`
- Root `package.json` `test:launch` script and `.github/workflows/ci.yml` type-check step

## In scope

- Delete every schema, endpoint group, query key and UI component that belongs to a removed domain.
- Add schemas, endpoint groups and query keys for every endpoint in `02-backend-modules.md`.
- Replace token values with the K-YOU set. Keep the legacy v1 export block for mobile.
- Add shared pure helpers ported from K-YOU (`shared/media.mjs`, `shared/schedule.mjs`) so backend and web compute the same thing.
- Remove the mobile type-check from the launch gate.

## Out of scope

- Backend services (02). Web components (04–08). `packages/ui/src/mobile/**` is frozen with the Expo app.
- Launch-lead DTOs (`CreateProviderLeadDto`, `CreateClientLeadDto`, `CreateLaunchFunnelEventDto`, `LeadAttributionDto`, all `LAUNCH_*` and `LEAD_*` constants) stay byte-for-byte. Agent DTOs do not exist on `main`; they live on `feat/agent-concierge-phase-1`.

---

## A. `packages/schemas`

### Files

| File | Action |
| --- | --- |
| `common.ts` | Keep (`IdSchema`, `DateTimeSchema`, pagination helpers, `ApiErrorResponseSchema`). Change `createPaginatedResponseSchema` to the `{ items, total, page, limit }` envelope from 02. |
| `enums.ts` | Rewrite. See enum list below. |
| `models.ts` | Rewrite. One Zod schema per Prisma model in `01-domain-and-schema-reset.md`, camelCase, plus card/summary projections. |
| `dto.ts` | Rewrite. Request DTOs and response schemas listed below. |
| `verification.ts` | Keep the document/state/submit schemas. Delete every `Dispute*` and `RespondDispute*` export. |
| `job-requests.ts` | **Delete.** |
| `quotes.ts` | **Delete.** |
| `tasks.ts` | **Delete** (`SUBCATEGORY_TASKS`, `CUSTOM_TASK_KEY`; tasks were a booking-flow constant that no longer exists). |
| `communes.ts` | **Delete** (`KIN_COMMUNES`, `KIN_COMMUNES_TUPLE`, `KinCommune`). Places come from the API. The launch-lead DTO currently validates `commune` against `KIN_COMMUNES_TUPLE`; move that tuple into `launch-leads.ts` (new file, launch-only) so the lead contract is unchanged. |
| `schedule.ts` | **New.** Schedule rule constants and Zod schema. |
| `media.ts` | **New.** Media item schema and limits. |
| `taxonomy.ts` | **New.** Import helper types for the K-YOU tree seed (`TaxonomySeedNode`). |
| `launch-leads.ts` | **New.** The unchanged lead/funnel DTOs moved out of `dto.ts` verbatim, plus the communes tuple. |
| `index.ts` | Re-export. |

### Enums (`enums.ts`)

Keep: `UserRole`, `VerificationStatus`, `VerificationDocKind`, `VerificationDecision`, `BookingStatus` (minus `IN_PROGRESS`), `TransactionType` (`EARNING | BONUS`), `TransactionStatus` (`PENDING | COMPLETED`), `NotificationType` (trimmed to the 10 values in 01), the `ProviderLead*`, `ClientLead*`, `Lead*`, `LaunchFunnel*` enums.

Add: `PremiumTier`, `PlaceKind`, `SuggestionStatus`, `ReferenceType`, `MediaKind`, `ReportTargetKind`, `ReportStatus`, `ContactStatus`, `AddressLabel`, `UploadPurpose` (`avatar | media | attachments | verification`).

Delete: `BadgeType`, `TrustLevel`, `ClientTrustLevel`, `CertificationStatus`, `DocType`, `DisputeOrigin`, `DisputeSeverity`, `DisputeStatus`, `FinalOfferStatus`, `JobRequestStatus`, `QuoteStatus`, `PayoutOperator`, `PayoutStatus`, `PaymentRating`, `MessageType`, `PortfolioImageType`, `SubscriptionPlan`, `VisibilityLevel`, `AvailabilityStatus`, `OnboardingStatus`, `TrendingBadge`.

### Models (`models.ts`)

Delete: `TrustScore*`, `ProviderBadge*`, `Certification*`, `CertificationDoc*`, `Skill*`, `SkillInputSchema`, `ServiceZone*`, `ServiceZoneInput*`, `PortfolioItem*`, `PortfolioProject*`, `PortfolioImage*`, `PortfolioProjectInputDto`, `AvailabilitySchedule*`, `AvailabilityDay`, `AvailabilityStatus*`, `Favorite*`, `Subscription*`, `VisibilitySettings*`, `FinalOffer*`, `JobRequest*`, `Quote*`, `QuoteLineItem*`, `Payout*`, `Dispute*`, `DisputeEvidence*`, `ClientReview` criteria fields, `Review` criteria fields (`punctuality`, `quality`, `communication`, `value`, `professionalism`, `overallScore`, `satisfactionTags`), `ProviderSubcategory*`, `ProviderStrength*`, `ProviderRatingBreakdownSchema`, `ProviderRatingAveragesSchema`, `TrendingServiceItem*`, `TodayJob*`, `RequestPreview*`, `ProviderDraftSkill*`, `ConversationLastMessage*` (replaced by `lastPreview`).

Add (name → shape source):

| Schema | Notes |
| --- | --- |
| `UserSchema`, `UserSummarySchema` | Fields from 01. `UserSummary` = `id, firstName, lastName, avatar, role`. |
| `ProviderSchema` | Full row. |
| `ProviderCardSchema` | Search card projection from `GET /providers`: `id, displayName, profilePhoto, categoryChain: [{id, slug, name}], placeChain: [{id, kind, label}], ratingAvg, ratingCount, premiumTier, verified, latitude, longitude, distanceKm?`. |
| `ProviderPublicSchema` | `GET /providers/:id` response: card fields + `description, yearsExperience, freeSkills, skills: ReferenceItemSummary[], languages, interventionModes, pricing: { amount, currency, unit } \| null, media: ProviderMedia[], scheduleSummary: ScheduleSummary, social: { youtube, instagram, tiktok, facebook }, contacts: { phone, whatsapp, email, addressLine, latitude, longitude } \| null, contactsLocked: boolean, reviewsPreview: Review[], ownerId`. |
| `CategorySchema`, `SubcategorySchema`, `CategoryTreeNodeSchema` | Tree node = `id, slug, name, icon, color, image, providerCount, children[]` recursive with `z.lazy`. |
| `PlaceSchema`, `PlaceSummarySchema` (`id, kind, label, parentId`), `PlaceSuggestionSchema` | |
| `ReferenceItemSchema`, `ReferenceItemSummarySchema` (`id, type, label`) | |
| `ProviderMediaSchema` | `id, kind, url, storagePath?, youtubeId?, title?, order`. |
| `AvailabilityRuleSchema`, `AvailabilityExceptionSchema`, `ScheduleSchema` | `ScheduleSchema = { timezone, slotDurationMin, slotBufferMin, rules: AvailabilityRule[], exceptions: AvailabilityException[] }`. |
| `ScheduleSummarySchema` | Per weekday label + ranges, for the profile "Horaires" card. |
| `BookingSchema`, `BookingCardSchema` | Card adds `counterpart: { id, name, photo, categoryLabel }`, `clientRating?: { avg, count }`, `scheduledLocal: { date, time }` in the booking timezone. |
| `ReviewSchema`, `ClientReviewSchema` | Single `rating`, `comment`, `reply`. |
| `TransactionSchema` | |
| `ConversationSchema`, `MessageSchema`, `MessageAttachmentSchema` | Attachment = `{ kind: "image" \| "audio", path, mime, bytes }`. |
| `ReportSchema`, `BlockSchema`, `ContactMessageSchema`, `AddressSchema`, `NotificationSchema` | |
| `VerificationDocSchema`, `VerificationStateSchema` | From `verification.ts`, unchanged shape minus dispute. |
| `SiteSettingsSchema` | Object of the keys in 01 §System settings. |
| `ActivityLogSchema` | For the admin journal. |

### DTOs and responses (`dto.ts`)

One request DTO and one response schema per endpoint in 02. Naming: `<Verb><Thing>Dto` for bodies, `<Thing>QueryParams` for query strings, `<Thing>ResponseSchema` for bodies returned. Every list uses `createPaginatedResponseSchema(ItemSchema)`.

Public: `PublicSettingsResponseSchema`, `PublicStatsResponseSchema` (`categories, countries, providers, verifiedProviders`), `CategoryTreeResponseSchema`, `PlacesQueryParams` (`kind?, parentId?, q?, ids?`), `PlacesResponseSchema`, `PlaceAncestorsResponseSchema`, `ReferencesQueryParams` (`type, categoryId?`), `ReferencesResponseSchema`, `ProviderSearchParams` (`q, categoryId, categorySlug, subcategoryId, placeId, languageId, modeId, minRating, verifiedOnly, premiumOnly, sort, lat, lng, page, limit`), `ProviderSearchResponseSchema`, `ProviderPublicResponseSchema`, `AvailabilityQueryParams` (`date`), `AvailabilityResponseSchema` (`timezone, slotDurationMin, slots: string[]`), `ProviderReviewsResponseSchema`, `CreateContactMessageDto`.

Identity: `MeResponseSchema` (adds `provider: { id, hidden, verificationStatus } | null`, `termsAcceptedAt`, `suspendedReason`), `UpdateProfileDto`, `ConfirmAvatarDto` (keep), `UploadSignRequestDto` (purpose enum extended), `UploadSignResponseSchema` (keep), `SignReadQueryParams` (`path`), `SignReadResponseSchema` (`url, expiresAt`), `AcceptTermsResponseSchema`, `DeleteAccountResponseSchema`.

Provider: `PublishProviderDto` = the full wizard payload (`displayName, phone, whatsapp, email?, profilePhoto?, subcategoryId, yearsExperience?, skillIds[], freeSkills[], description?, placeId, addressLine?, latitude?, longitude?, languageIds[], modeIds[], pricing?, schedule: ScheduleInput, media: MediaInput[], social?, acceptTerms: true`), `UpdateProviderDto = PublishProviderDto.partial().omit({ acceptTerms })`, `PutScheduleDto = ScheduleInput`, `PutMediaDto = { items: MediaInput[] }`, `UpdateAvailabilityDto = { isAvailable }`, `ProviderDashboardResponseSchema`, `EarningsSummaryResponseSchema` (`total, thisWeek, byDay[7], completedThisWeek, acceptanceRate, ratingAvg, ratingCount`), `EarningsTransactionsResponseSchema`, verification DTOs kept.

Bookings: `CreateBookingDto` (`providerId, date, time, clientPhone, clientNotes?, addressId? | placeId?/addressLine?/latitude?/longitude?` with a `refine` that exactly one address form is present), `BookingsQueryParams` (`status?, page, limit`), `BookingsResponseSchema`, `BookingResponseSchema`, `CompleteBookingDto` (`agreedPrice?: int ≥ 0, isPaid?: boolean`), `CancelBookingDto` (`reason?: string ≤ 500`), `UpdateBookingNotesDto`.

Reviews: `CreateReviewDto` (`bookingId, rating 1–5 int, comment ≤ 500`), `MyReviewsResponseSchema` (`{ reviews: Review[], toReview: BookingCard[] }`), `ReplyReviewDto`, `CreateClientReviewDto`, `ClientRatingSummaryResponseSchema`.

Messaging and safety: `ConversationsResponseSchema`, `StartConversationDto` (`providerId, subject?, body?, attachments?` with body-or-attachment refine, ≤ 6 attachments), `SendMessageDto`, `MessagesQueryParams`, `MessagesResponseSchema`, `CreateReportDto` (`targetKind, targetId, reason ≤ 1000`), `CreateBlockDto`, `BlocksResponseSchema`.

Client utilities: `ClientDashboardResponseSchema`, `CreateAddressDto`, `UpdateAddressDto`, `AddressesResponseSchema`, `NotificationsQueryParams` and `NotificationsResponseSchema` (keep), `CreatePlaceSuggestionDto`.

Admin: `AdminOverviewResponseSchema`, `AdminUserSearchParams` (keep, add `suspended`), `AdminUpdateUserDto` (`role?, suspended?, suspendedReason?`), `AdminUserCvResponseSchema`, `AdminProviderSearchParams`, `AdminUpdateProviderDto` (`hidden?, premiumTier?, premiumUntil?, verificationStatus?, rejectionReason?`), `AdminBookingSearchParams`, `AdminCancelBookingDto`, `AdminReviewSearchParams`, `AdminUpdateReviewDto` (`isPublic`), `AdminConversationSearchParams`, `AdminContactSearchParams`, `AdminUpdateContactDto` (`status`), `AdminReportSearchParams`, `AdminResolveReportDto` (`resolution`), `AdminSettingsResponseSchema`, `AdminUpdateSettingsDto` (partial of `SiteSettingsSchema`), `AdminAuditResponseSchema`, `AdminHealthResponseSchema`, category DTOs kept and extended with `parentId` on subcategory create/update, `AdminCreatePlaceDto`, `AdminUpdatePlaceDto`, `AdminMergeDto` (`fromId, intoId`), `AdminSuggestionsResponseSchema`, `AdminCreateReferenceDto`, `AdminUpdateReferenceDto`, verification queue DTOs kept.

### Constants ported from K-YOU

`schedule.ts`:

```ts
export const SCHEDULE_LIMITS = {
  maxRangesPerDay: 4,
  slotDurationMin: { min: 15, max: 240 },
  slotBufferMin: { min: 0, max: 60 },
  timezones: ["Africa/Kinshasa", "Africa/Lubumbashi", "Africa/Brazzaville"] as const,
} as const;
export const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const ScheduleInputSchema = /* rules ≤ 4 per day, start < end, non-overlapping, sorted; exceptions unique by date */;
```

`media.ts`:

```ts
export const MEDIA_LIMITS = { maxImages: 12, maxVideos: 12, maxVideoBytes: 25 * 1024 * 1024,
  videoMimes: ["video/mp4", "video/quicktime", "video/webm"], imageMimes: ["image/jpeg", "image/png", "image/webp"] } as const;
export const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"] as const;
export const MediaInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("IMAGE"), path: z.string(), title: z.string().max(120).optional() }),
  z.object({ kind: z.literal("VIDEO_UPLOAD"), path: z.string(), title: ... }),
  z.object({ kind: z.literal("VIDEO_YOUTUBE"), url: z.string().url(), title: ... }),
]);
```

The host allow-list is the K-YOU "deceptive hosts" rule (`youtube.com.evil.example` rejected). The actual parser lives in `@kayu/utils` (section D); the schema only checks shape, the backend calls the parser.

`taxonomy.ts`: `TaxonomySeedNodeSchema = { slug, fr, en?, subs?: TaxonomySeedNode[] }` mirroring K-YOU `shared/taxonomy.json` so the seed can validate the imported JSON.

---

## B. `packages/api`

### `endpoints.ts`

Delete groups: `finalOffersApi`, `favoritesApi`, `jobRequestsApi`, `quotesApi`, `settingsApi.getVisibility/putVisibility`, `earningsApi.createPayout/payouts`, `providersApi.listPortfolio/createPortfolio/updatePortfolio/deletePortfolio/getStrength`, `onboardingApi.getDraft/patchDraft`, `identityApi.setRole/providerOnboarding/recentAddresses`, `statsApi.getTrending`, `verificationApi.getDispute/respondDispute`, `adminApi.getDisputes/createDispute/updateDispute/getSupportBookings`.

Groups after the rewrite (method names are the contract; each returns the parsed response type):

| Group | Methods |
| --- | --- |
| `settingsApi` | `getPublic()` |
| `statsApi` | `getGlobal()` |
| `categoriesApi` | `getTree()` |
| `placesApi` | `list(params)`, `byIds(ids)`, `ancestors(id)`, `suggest(dto)` |
| `referencesApi` | `list(type, categoryId?)` |
| `providersApi` | `search(params)`, `getPublic(id)`, `availability(id, date)`, `reviews(id, params)`, `publish(dto)`, `updateMe(dto)`, `putSchedule(dto)`, `putMedia(dto)`, `setAvailability(isAvailable)` |
| `identityApi` | `me()`, `updateProfile(dto)`, `acceptTerms()`, `deleteAccount()` |
| `mediaApi` | `sign(dto)`, `signRead(path)`, `setAvatar(dto)` |
| `bookingsApi` | `create(dto)`, `list(params)`, `get(id)`, `confirm(id)`, `complete(id, dto)`, `cancel(id, dto)`, `updateNotes(id, dto)` |
| `reviewsApi` | `create(dto)`, `mine()`, `reply(id, dto)`, `createClientReview(dto)`, `clientSummary(clientId)` |
| `conversationsApi` | `list()`, `start(dto)`, `messages(id, params)`, `send(id, dto)`, `deleteMessage(id, messageId)` |
| `safetyApi` | `report(dto)`, `block(userId)`, `unblock(userId)`, `blocks()` |
| `addressesApi` | `list()`, `create(dto)`, `update(id, dto)`, `remove(id)` |
| `notificationsApi` | `list(params)`, `markRead(id)`, `markAllRead()` (keep) |
| `dashboardApi` | `provider()`, `client()` |
| `earningsApi` | `summary()`, `transactions(params)` |
| `verificationApi` | `state()`, `uploadDoc(dto)`, `removeDoc(id)`, `submit()` (keep) |
| `contactApi` | `send(dto)` |
| `geoApi` | `geocode(params)`, `distance(params)` (keep) |
| `launchLeadsApi` | unchanged |
| `agentsApi` | not on `main` (concierge branch only); nothing to do |
| `adminApi` | `overview()`, `users(params)`, `updateUser(id, dto)`, `userCv(id)`, `providers(params)`, `updateProvider(id, dto)`, `verificationQueue(params)`, `reviewVerificationDoc(dto)`, `bookings(params)`, `cancelBooking(id, dto)`, `reviews(params)`, `updateReview(id, dto)`, `deleteReview(id)`, `conversations(params)`, `conversationMessages(id)`, `deleteConversation(id)`, `deleteMessage(id)`, `contacts(params)`, `updateContact(id, dto)`, `deleteContact(id)`, `reports(params)`, `resolveReport(id, dto)`, `settings()`, `updateSettings(dto)`, `audit()`, `health()`, `categories()`, `category(id)`, `createCategory(dto)`, `updateCategory(id, dto)`, `deleteCategory(id)`, `createSubcategory(dto)`, `updateSubcategory(id, dto)`, `deleteSubcategory(id)`, `places(params)`, `createPlace(dto)`, `updatePlace(id, dto)`, `mergePlaces(dto)`, `placeSuggestions(params)`, `approveSuggestion(id)`, `rejectSuggestion(id)`, `references(params)`, `createReference(dto)`, `updateReference(id, dto)`, `mergeReferences(dto)` |

`client.ts` and `error.ts` stay. Add an `ApiError.code` passthrough so `SLOT_TAKEN` and `BLOCKED` can be matched by the web without string-parsing messages.

### `query-keys.ts`

Delete `finalOffers`, `favorites`, `jobRequests`, `quotes`, `onboarding`, `settings.visibility`. Add `places`, `references`, `conversations` (replaces `messages`), `safety`, `addresses`, `earnings` (keep), `admin.*` sub-keys per section (`overview, users, providers, verification, bookings, reviews, conversations, contacts, reports, settings, audit, health, categories, places, suggestions, references`). Key shapes: `[group, scope, params]` as today.

---

## C. `packages/ui`

### `tokens.ts`

Replace the v2 `colors`, `fonts`, `radii`, `elevation`, `motion` values with the contract §9 set. Keep the export names so `apps/web/src/app/globals.css` can be regenerated from them.

```ts
export const colors = {
  background: "#F8F8F3", foreground: "#0D2A25", card: "#FFFFFF",
  primary: "#0A3D36", primaryForeground: "#F8F8F3",
  secondary: "#E9F0EB", muted: "#EDF2EC", mutedForeground: "#5C7971",
  accent: "#FFBD25", accentForeground: "#0A3D36",
  destructive: "#C41E1E", border: "#DCE5DF", input: "#E8EEE9", ring: "#0A3D36",
  adminCanvas: "#F4F6F3", authCanvas: "#F8FAF7", authCanvasMobile: "#F8F8F3",
  status: { confirmed: {...emerald}, pending: {...amber}, cancelled: {...red}, completed: {...muted}, elite: {...violet}, messages: {...blue} },
} as const;
export const fonts = { heading: "'Sora Variable', system-ui, sans-serif", body: "'Plus Jakarta Sans Variable', system-ui, sans-serif", mono: "ui-monospace, SFMono-Regular, Menlo, monospace" } as const;
export const radii = { field: 14, card: 16, cardLg: 24, hero: 32, pill: 9999 } as const;
export const elevation = { soft: "0 4px 24px -8px rgba(15,23,42,.12)", softLg: "0 16px 48px -12px rgba(15,23,42,.18)", brand: "0 16px 40px -12px rgba(21,89,76,.5)" } as const;
export const motion = { screenEnterMs: 240, pressMs: 140, pulseMs: 420, sheetSpring: { damping: 28, stiffness: 280 }, dockSpring: { stiffness: 450, damping: 34 } } as const;
export const categoryColors: Record<string, string> = { batiment_construction: "bg-amber-500", /* … 19 entries from K-YOU taxonomy.jsx */ };
```

Remove `portfolio` and `categoryTint` token groups (old direction). Keep the **legacy v1 export block** (`colors` v1 alias, `spacing`, `borderRadius`, `typography`, `shadows`, `brand`) untouched and still marked "do NOT add new usages" — it has ~33 mobile consumers.

### `web/` components

Delete (encode the rejected 2026-05 direction or a removed domain): `TrustChip`, `TrustStrip`, `TopRatedRibbon`, `Sparkline`, `StatCard`, `PhotoTile`, `FeaturedProviderCard`, `WideProviderCard`, `ProviderShowcaseCard`, `NearbyCard`, `ProviderHorizontalCard`, `CategoryTile`, `TrendingServiceCard`, `CardSkeletons`, `PageSkeletons`, `KayouMoment`, `HowItWorksStep`, `TestimonialCard`, `ProviderDashboardPreview`, `AppPhoneMockup`, `StepIndicator`, `Chip`.

Keep and restyle to the new tokens: `Button`, `Input`, `Avatar` (fallback ladder becomes photo → initials on mint → Lucide `User`; K-YOU's watermark fallback is web-only and lives in `apps/web`), `Icon` (`I`, `resolveLucideIcon`, `FallbackCategoryIcon`), `StarRating` (amber-400 always), `Shimmer`, `EmptyState`, `ErrorState`, `InlineAlert`, `Toast`.

`web/agent/*` does not exist on `main`; the `packages/ui/dist/web/agent/*.d.ts` files are stale build output from the `feat/agent-concierge-phase-1` branch and are removed by `pnpm clean`. Nothing to keep here.

Move to `apps/web/src/components/` instead of the package (they are Next-specific or use framer-motion/next-link): `ProviderCard`, `CategoryFeatured`, `CategoryMedallion`, `SectionHeading`, `MetricCard`, `ExpandableText`, `LoginWall`, `BottomSheet`, `FilterSheet`. Rationale: `packages/ui/web` stays framework-agnostic React; page-level composites belong to the app.

`cards.ts`: delete (it exported the photo-forward card helpers). `index.ts`: re-export tokens only.

---

## D. `packages/utils`

| File | Action |
| --- | --- |
| `phone.ts` | Keep all exports (`normalizeDRCPhone`, `isPlausibleDRCMobilePhone`, …). Add `toE164(value, defaultCountry: "CD" \| "CG")` used by the wizard and booking form. |
| `currency.ts` | Keep `formatCDF`, `formatNumber`. Add `formatMoney(amount, currency: "CDF" \| "USD" \| "XAF")`. |
| `date.ts` | Keep. Add `formatRelativeFr(date, now?)` → `à l'instant`, `il y a 3 min`, `il y a 2 h`, `il y a 4 j`, then `12 sept.`; add `formatSlotLocal(iso, timezone)` → `{ date: "2026-09-16", time: "09:00", label: "mer. 16 sept. · 09:00" }` using `Intl.DateTimeFormat("fr-FR", { timeZone })`. |
| `distance.ts`, `helpers.ts` | Keep (`calculateDistance`, `cn`, `getInitials`, …). Delete `getDistanceColor`, `getDistanceStatus` (old card chips). |
| `youtube.ts` | **New.** Port of K-YOU `shared/media.mjs`: `parseYouTubeUrl(url): { id, watchUrl, embedUrl, thumbnailUrl } \| null` accepting `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`, rejecting any host not in `YOUTUBE_HOSTS` (exact match after lowercasing, no suffix match), IDs must match `/^[A-Za-z0-9_-]{11}$/`. Embed uses `youtube-nocookie.com`. |
| `schedule.ts` | **New.** Port of K-YOU `shared/schedule.mjs`: `computeSlots({ rules, exceptions, slotDurationMin, slotBufferMin, timezone, date, existing: { scheduledAt, durationMin, bufferMin }[], now })` → `string[]` of `"HH:mm"` in the provider timezone; `validateSchedule(input)` returning normalized rules (sorted, ≤ 4, non-overlapping) or a list of French error messages; `localSlotToInstant(date, time, timezone)` → ISO. Pure, no Prisma, no DOM. Backend `providers-availability.service.ts` calls these; the web booking form uses `formatSlotLocal` only. |
| `test/` | Add `youtube.test.mjs` (deceptive host, all URL shapes, bad id), `schedule.test.mjs` (the seven K-YOU cases: ranges, buffer, exception closed, exception custom range, past slots today, overlap with existing booking incl. buffer, DST-free timezone offset), `date.test.mjs` (relative FR, slot local). |

---

## E. Build order and gate

Build order is unchanged: `utils → schemas → api → ui → backend/web`. Turbo already encodes it through `dependsOn: ["^build"]`.

Root `package.json` `test:launch` becomes:

```
pnpm --filter @kayu/utils test && pnpm --filter @kayu/utils type-check
&& pnpm --filter @kayu/schemas type-check && pnpm --filter @kayu/schemas build
&& pnpm --filter @kayu/api type-check && pnpm --filter @kayu/api build
&& pnpm --filter @kayu/ui type-check && pnpm --filter @kayu/ui build
&& pnpm --filter @kayu/backend test:launch && pnpm --filter @kayu/backend type-check
&& pnpm --filter @kayu/web type-check
```

`pnpm --filter @kayu/mobile type-check` is removed from `test:launch` and from the "Type-check" step in `.github/workflows/ci.yml` (line 64 today). Add a comment in both places pointing at `docs/kyou-ux-refactor/README.md` §Mobile freeze. `@kayu/ui` type-check still compiles `src/mobile/**`; if the token rename breaks a mobile component, fix the import to the legacy block rather than editing the component's behaviour.

## Acceptance criteria

- `grep -rE "FinalOffer|JobRequest|Quote|Payout|TrustScore|TrustLevel|Badge|Dispute|Favorite|Visibility|Portfolio|Certification|Subscription|ServiceZone|KIN_COMMUNES|SUBCATEGORY_TASKS" packages/schemas/src packages/api/src packages/ui/src/web packages/ui/src/tokens.ts` returns nothing.
- `grep -rE "Inter|JetBrains|#0EA5E9|#FB7185" packages/ui/src/tokens.ts` returns nothing outside the legacy v1 block.
- Every endpoint row in `02-backend-modules.md` has exactly one `endpoints.ts` method and one response schema; checked by a table in the PR description.
- `packages/utils/test` passes with the new files; `computeSlots` output for the seeded demo provider matches the K-YOU reference output for the same input (fixture copied from K-YOU `tests/structured.test.mjs` expectations).
- Launch-lead DTOs: `git diff main -- packages/schemas/src/launch-leads.ts` shows only the file move; `pnpm --filter @kayu/backend test:launch-leads:ci` passes unchanged.
- `apps/mobile` untouched: `git diff main --stat -- apps/mobile` is empty.

## Verification commands

```sh
pnpm --filter @kayu/utils test
pnpm --filter @kayu/schemas type-check && pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check && pnpm --filter @kayu/api build
pnpm --filter @kayu/ui type-check && pnpm --filter @kayu/ui build
pnpm test:launch
```
