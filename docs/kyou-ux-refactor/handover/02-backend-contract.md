# 02 → 03: backend contract as implemented

Workstream 02 implemented every endpoint of `02-backend-modules.md` on branch `kyou-ux/02-backend`. This file is what 03 mirrors in `@kayu/schemas` and `@kayu/api`. Deviations from the 02 doc are also logged in `PROGRESS.md` (Decisions Log, rows prefixed "(02)").

- **Real responses** for every route below, captured by the launch harness against Postgres (success and the main error cases), are in [`02-example-responses.json`](./02-example-responses.json). Keys read `"<METHOD> <path> (<case>) → <status>"`; each holds the first response seen for that key. Regenerate with `LAUNCH_HARNESS_CAPTURE=<file>` on `test:launch:harness`.
- **Request schemas** are drafted as Zod in `apps/backend/src/common/contract/*.ts` (file layout mirrors 03's plan). 03 copies them into `packages/schemas`; 02 then changes one function, `contractPipe` in `apps/backend/src/common/contract/pipe.ts`, to lazy-load the same names from `@kayu/schemas`, and deletes the local folder.

## Conventions

- All paths are under `/api`. Auth is `Authorization: Bearer <supabase access token>` or the Supabase SSR cookie.
- **Access** column: `pub` = no auth; `pub (optional auth)` = anonymous allowed, the response adapts to a signed-in viewer; `auth` = any signed-in active user, with ownership or participation checked in the service (404 when not visible to the caller); a role = route-level `@Roles`.
- **Suspended users** get `403 { statusCode, code: "ACCOUNT_SUSPENDED", message, suspendedReason }` on every authenticated or optional-auth route, including `GET /me`.
- **Lists** return `{ items, total, page, limit }`. Query `page` ≥ 1, `limit` 1–100 (defaults per schema). Some lists add fields beside the envelope: `GET /notifications` → `unreadCount`, `GET /conversations` → `unreadTotal`, `GET /conversations/:id/messages` and `GET /admin/conversations/:id/messages` → `conversation`.
- **Not paginated** (bounded or tree-shaped): `GET /categories/tree`, `GET /places/:id/ancestors`, `GET /reviews/mine` (`{ reviews, toReview }`, 100 each), `GET /admin/categories`, `GET /admin/subcategories`, `GET /admin/audit` (last 200) → `{ items }`; settings, dashboards, earnings summary and schedule/media replies are plain objects.
- **Envelopes.** No `success` wrapper, except endpoints the doc marks unchanged: `GET /me`, `PATCH /me/profile`, `POST /me/accept-terms` → `{ success: true, user }`; `POST /me/avatar` → `{ success: true, avatarUrl }`; `GET /distance`; all `/pro/verification/*`; `GET /admin/verification/submissions` (`{ success, submissions, pagination, stats }`) and `PUT /admin/verification/documents`.
- **Mutations** return the updated resource; deletes and fire-and-forget actions return `{ ok: true }`. POSTs that create return 201; action POSTs (`confirm`, `complete`, `cancel`, `reply`, `accept-terms`, `uploads/sign`, `avatar`, `merge`, `approve`, `reject`, `/pro/verification/*`) return 200.
- **Dates** are ISO strings. Money is integer CDF. `ratingAvg` is a number with one decimal. Times of day are `"HH:mm"`, local dates `"YYYY-MM-DD"` in the provider timezone.
- **Validation errors** → `400 { message: "Validation failed", errors: [{ path, message, code }] }`.

## Error codes

Business errors have the shape `{ statusCode, code, message, ...extra }`. `ApiError.code` in `@kayu/api` should surface `code`.

| Code | Status | Raised when |
| --- | --- | --- |
| `ACCOUNT_SUSPENDED` | 403 | suspended caller; extra `suspendedReason` |
| `FORBIDDEN` | 403 | ownership check outside the role guard |
| `NOT_FOUND` | 404 | missing, hidden, or not visible to the caller |
| `BLOCKED` | 403 | block between caller and counterpart (messaging, booking) |
| `FEATURE_DISABLED` | 403 | `feat_booking` or `feat_reviews` off |
| `SELF_ACTION` | 400 | self-booking/-message/-block/-report; admin editing own user |
| `SLOT_TAKEN` | 409 | time not in availability, or lost the slot race |
| `PROVIDER_UNAVAILABLE` | 409 | provider paused bookings (`isAvailable = false`) |
| `INVALID_TRANSITION` | 409 | booking status change not allowed; resolving a resolved report; merge preconditions; non-pending suggestion |
| `REASON_REQUIRED` | 400 | provider or admin cancel without a reason |
| `BOOKING_NOT_COMPLETED` | 409 | review before completion |
| `ALREADY_EXISTS` | 409 | review, client review, provider profile, duplicate slug/label/suggestion |
| `LAST_ADMIN` | 409 | demoting or suspending the last active admin |
| `ADMIN_ACCOUNT` | 409 | `DELETE /me` by an admin |
| `ROLE_CHANGE_NOT_ALLOWED` | 409 | admin role change other than CLIENT ⇄ ADMIN, or on a user owning a provider |
| `REFERENCED` | 409 | deactivating/deleting a taxonomy node in use, merging a place with children; extra `counts` |
| `INVALID_REFERENCE` | 400 | unknown/inactive/merged place, taxonomy node or reference item; non-deepest taxonomy node |
| `INVALID_MEDIA` | 400 | media limits, YouTube host, foreign upload path, MIME/size on sign, bad sign-read path |
| `DOCS_MISSING` | 400 | admin VERIFIED override without the four required KYC docs; extra `missingKinds` |
| `RATE_LIMITED` | 429 | contact form (5 / IP / 15 min), reports (10 / user / hour); `Retry-After` header and `retryAfter` |
| `RECIPIENT_UNAVAILABLE` | 403 | messaging a provider whose owner is suspended |
| `LIMIT_REACHED` | 409 | more than 20 addresses, more than 10 pending place suggestions |

## Routes

Generated from the Nest route metadata. Launch-lead and health routes are unchanged and omitted.

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| GET | `/addresses` | CLIENT | 200 |
| POST | `/addresses` | CLIENT | 201 |
| PATCH | `/addresses/:id` | CLIENT | 200 |
| DELETE | `/addresses/:id` | CLIENT | 200 |
| GET | `/admin/audit` | ADMIN | 200 |
| GET | `/admin/bookings` | ADMIN | 200 |
| POST | `/admin/bookings/:id/cancel` | ADMIN | 200 |
| GET | `/admin/categories` | ADMIN | 200 |
| POST | `/admin/categories` | ADMIN | 201 |
| GET | `/admin/categories/:id` | ADMIN | 200 |
| PATCH | `/admin/categories/:id` | ADMIN | 200 |
| DELETE | `/admin/categories/:id` | ADMIN | 200 |
| GET | `/admin/contacts` | ADMIN | 200 |
| PATCH | `/admin/contacts/:id` | ADMIN | 200 |
| DELETE | `/admin/contacts/:id` | ADMIN | 200 |
| GET | `/admin/conversations` | ADMIN | 200 |
| DELETE | `/admin/conversations/:id` | ADMIN | 200 |
| GET | `/admin/conversations/:id/messages` | ADMIN | 200 |
| GET | `/admin/health` | ADMIN | 200 |
| DELETE | `/admin/messages/:id` | ADMIN | 200 |
| GET | `/admin/overview` | ADMIN | 200 |
| GET | `/admin/places` | ADMIN | 200 |
| POST | `/admin/places` | ADMIN | 201 |
| GET | `/admin/places/:id` | ADMIN | 200 |
| PATCH | `/admin/places/:id` | ADMIN | 200 |
| POST | `/admin/places/merge` | ADMIN | 200 |
| GET | `/admin/places/suggestions` | ADMIN | 200 |
| POST | `/admin/places/suggestions/:id/approve` | ADMIN | 200 |
| POST | `/admin/places/suggestions/:id/reject` | ADMIN | 200 |
| GET | `/admin/providers` | ADMIN | 200 |
| PATCH | `/admin/providers/:id` | ADMIN | 200 |
| GET | `/admin/references` | ADMIN | 200 |
| POST | `/admin/references` | ADMIN | 201 |
| GET | `/admin/references/:id` | ADMIN | 200 |
| PATCH | `/admin/references/:id` | ADMIN | 200 |
| POST | `/admin/references/merge` | ADMIN | 200 |
| GET | `/admin/reports` | ADMIN | 200 |
| PATCH | `/admin/reports/:id` | ADMIN | 200 |
| GET | `/admin/reviews` | ADMIN | 200 |
| PATCH | `/admin/reviews/:id` | ADMIN | 200 |
| DELETE | `/admin/reviews/:id` | ADMIN | 200 |
| GET | `/admin/settings` | ADMIN | 200 |
| PUT | `/admin/settings` | ADMIN | 200 |
| GET | `/admin/subcategories` | ADMIN | 200 |
| POST | `/admin/subcategories` | ADMIN | 201 |
| GET | `/admin/subcategories/:id` | ADMIN | 200 |
| PATCH | `/admin/subcategories/:id` | ADMIN | 200 |
| DELETE | `/admin/subcategories/:id` | ADMIN | 200 |
| GET | `/admin/users` | ADMIN | 200 |
| PATCH | `/admin/users/:id` | ADMIN | 200 |
| GET | `/admin/users/:id/cv` | ADMIN | 200 |
| PUT | `/admin/verification/documents` | ADMIN | 200 |
| GET | `/admin/verification/submissions` | ADMIN | 200 |
| GET | `/blocks` | auth | 200 |
| POST | `/blocks` | auth | 201 |
| DELETE | `/blocks/:userId` | auth | 200 |
| GET | `/bookings` | auth | 200 |
| POST | `/bookings` | CLIENT | 201 |
| GET | `/bookings/:id` | auth | 200 |
| POST | `/bookings/:id/cancel` | auth | 200 |
| POST | `/bookings/:id/complete` | PROVIDER | 200 |
| POST | `/bookings/:id/confirm` | PROVIDER | 200 |
| PATCH | `/bookings/:id/notes` | PROVIDER | 200 |
| GET | `/categories/tree` | pub | 200 |
| POST | `/contact` | pub | 201 |
| GET | `/conversations` | auth | 200 |
| POST | `/conversations` | CLIENT | 201 |
| GET | `/conversations/:id/messages` | auth | 200 |
| POST | `/conversations/:id/messages` | auth | 201 |
| DELETE | `/conversations/:id/messages/:messageId` | auth | 200 |
| GET | `/dashboard/client` | CLIENT | 200 |
| GET | `/dashboard/provider` | PROVIDER | 200 |
| GET | `/distance` | pub | 200 |
| GET | `/geocode` | pub | 200 |
| DELETE | `/me` | auth | 200 |
| GET | `/me` | auth (provisioning) | 200 |
| POST | `/me/accept-terms` | auth | 200 |
| POST | `/me/avatar` | auth | 200 |
| GET | `/me/media/sign-read` | auth | 200 |
| PATCH | `/me/profile` | auth | 200 |
| POST | `/me/provider` | CLIENT | 201 |
| POST | `/me/uploads/sign` | auth | 200 |
| GET | `/notifications` | auth | 200 |
| PATCH | `/notifications/:id/read` | auth | 200 |
| PATCH | `/notifications/read-all` | auth | 200 |
| GET | `/places` | pub | 200 |
| GET | `/places/:id/ancestors` | pub | 200 |
| POST | `/places/suggestions` | auth | 201 |
| GET | `/pro/earnings/summary` | PROVIDER | 200 |
| GET | `/pro/earnings/transactions` | PROVIDER | 200 |
| POST | `/pro/verification/documents` | PROVIDER | 200 |
| DELETE | `/pro/verification/documents/:id` | PROVIDER | 200 |
| GET | `/pro/verification/state` | PROVIDER | 200 |
| POST | `/pro/verification/submit` | PROVIDER | 200 |
| GET | `/providers` | pub (optional auth) | 200 |
| GET | `/providers/:id` | pub (optional auth) | 200 |
| GET | `/providers/:id/availability` | pub (optional auth) | 200 |
| GET | `/providers/:id/reviews` | pub (optional auth) | 200 |
| PATCH | `/providers/me` | PROVIDER | 200 |
| PATCH | `/providers/me/availability` | PROVIDER | 200 |
| PUT | `/providers/me/media` | PROVIDER | 200 |
| PUT | `/providers/me/schedule` | PROVIDER | 200 |
| GET | `/references` | pub | 200 |
| POST | `/reports` | auth | 201 |
| POST | `/reviews` | CLIENT | 201 |
| POST | `/reviews/:id/reply` | PROVIDER | 200 |
| POST | `/reviews/clients` | PROVIDER | 201 |
| GET | `/reviews/clients/:clientId/summary` | PROVIDER|ADMIN | 200 |
| GET | `/reviews/mine` | CLIENT | 200 |
| GET | `/settings/public` | pub | 200 |
| GET | `/stats` | pub | 200 |

## Zod schemas the controllers expect

All exported from `apps/backend/src/common/contract/index.ts` under these exact names (the `contractPipe` argument):

| File | Schemas |
| --- | --- |
| `common.ts` | `IdSchema`, `PaginationQuery`, `pagination(defaultLimit)`, `BooleanQuerySchema`, `DateOnlySchema`, `TimeOfDaySchema`, `PhoneE164Schema`, `StoragePathSchema`, `HttpsUrlSchema`, `LatitudeSchema`, `LongitudeSchema`, `CountrySchema` (`"RDC" \| "Congo"`), `optionalText(max)`, `csvIds` |
| `enums.ts` | `UserRole`, `VerificationStatus`, `PremiumTier`, `PlaceKind`, `SuggestionStatus`, `ReferenceType`, `MediaKind`, `BookingStatus`, `TransactionType`, `TransactionStatus`, `ReportTargetKind`, `ReportStatus`, `ContactStatus`, `AddressLabel`, `VerificationDocKind`, `VerificationDecision`, `NotificationType`, `UploadPurpose`, `MessageAttachmentKind` |
| `schedule.ts` | `SCHEDULE_LIMITS`, `TimezoneSchema`, `ScheduleRuleInput`, `ScheduleExceptionInput`, `ScheduleInputSchema`, `toMinutes` |
| `media.ts` | `MEDIA_LIMITS`, `YOUTUBE_HOSTS`, `MediaInputSchema`, `MediaListInputSchema`, `MessageAttachmentInput` |
| `public.dto.ts` | `PlacesQueryParams`, `ReferencesQueryParams`, `ProviderSearchSort`, `ProviderSearchParams`, `AvailabilityQueryParams`, `ProviderReviewsQueryParams`, `CreateContactMessageDto`, `GeocodeParams`, `DistanceParams` |
| `identity.dto.ts` | `UpdateProfileDto`, `ConfirmAvatarDto`, `UploadSignRequestDto`, `SignReadQueryParams`, `UploadVerificationDocDto` |
| `provider.dto.ts` | `PricingInputSchema`, `SocialLinksInputSchema`, `PublishProviderDto`, `UpdateProviderDto`, `PutScheduleDto`, `PutMediaDto`, `UpdateAvailabilityDto`, `EarningsTransactionsQueryParams` |
| `booking.dto.ts` | `CreateBookingDto`, `BookingsQueryParams`, `CompleteBookingDto`, `CancelBookingDto`, `UpdateBookingNotesDto`, `CreateReviewDto`, `ReplyReviewDto`, `CreateClientReviewDto` |
| `messaging.dto.ts` | `StartConversationDto`, `SendMessageDto`, `ConversationsQueryParams`, `MessagesQueryParams`, `CreateReportDto`, `CreateBlockDto`, `BlocksQueryParams` |
| `client.dto.ts` | `CreateAddressDto`, `UpdateAddressDto`, `AddressesQueryParams`, `NotificationsQueryParams`, `CreatePlaceSuggestionDto` |
| `admin.dto.ts` | `SITE_SETTING_STRING_KEYS`, `SITE_SETTING_BOOLEAN_KEYS`, `SITE_SETTING_DEFAULTS`, `SiteSettingsSchema`, `AdminUpdateSettingsDto`, `AdminUserSearchParams`, `AdminUpdateUserDto`, `AdminProviderSearchParams`, `AdminUpdateProviderDto`, `AdminVerificationQueueSearchParams`, `AdminReviewVerificationDocDto`, `AdminBookingSearchParams`, `AdminCancelBookingDto`, `AdminReviewSearchParams`, `AdminUpdateReviewDto`, `AdminConversationSearchParams`, `AdminMessagesQueryParams`, `AdminContactSearchParams`, `AdminUpdateContactDto`, `AdminReportSearchParams`, `AdminResolveReportDto`, `AdminCreateCategoryDto`, `AdminUpdateCategoryDto`, `AdminCreateSubcategoryDto`, `AdminUpdateSubcategoryDto`, `AdminPlaceSearchParams`, `AdminCreatePlaceDto`, `AdminUpdatePlaceDto`, `AdminMergeDto`, `AdminSuggestionSearchParams`, `AdminReferenceSearchParams`, `AdminCreateReferenceDto`, `AdminUpdateReferenceDto` |

Differences from the names in `03-shared-packages.md` §A:

- Category DTOs are prefixed: `AdminCreateCategoryDto`, `AdminUpdateCategoryDto`, `AdminCreateSubcategoryDto` (takes `parentId`), `AdminUpdateSubcategoryDto` (no `categoryId`/`parentId`: nodes do not move).
- Query schemas 03 did not list: `ProviderReviewsQueryParams`, `EarningsTransactionsQueryParams`, `ConversationsQueryParams`, `BlocksQueryParams`, `AddressesQueryParams`, `AdminMessagesQueryParams`, `AdminPlaceSearchParams`, `AdminSuggestionSearchParams`, `AdminReferenceSearchParams`. `GET /admin/subcategories` takes a plain `?categoryId`.
- Changed fields on kept schemas: `UploadVerificationDocDto` now requires `mime` and `bytes` (was optional `mimeType`/`fileSize`); `ConfirmAvatarDto.path` accepts `STORAGE_ENV_PREFIX`-prefixed paths (the old regex rejected them); `UploadSignRequestDto` adds optional `bytes`; `AdminVerificationQueueSearchParams` uses `q` instead of `search` (default `limit` 20).
- `ReferencesQueryParams` adds `q`; `PutScheduleDto` is `ScheduleInputSchema` itself.

Response schemas are not drafted in Zod; build them from the shapes below and the example file.

## Response shapes

Recurring projections (field lists are exact; see the example file for types):

- **MeUser** — the `User` row + `profileComplete` + `provider: { id, hidden, verificationStatus } | null`.
- **PlaceSummary** `{ id, kind, label, parentId, hasChildren }`. **ReferenceSummary** `{ id, type, label, categoryId }`.
- **ProviderCard** `{ id, displayName, profilePhoto, categoryChain: [{ id, slug, name }], placeChain: PlaceSummary[], ratingAvg, ratingCount, completedJobs, premiumTier, verified, isAvailable, latitude, longitude, distanceKm, pricing: { amount, currency: ReferenceSummary, unit: ReferenceSummary } | null }`. `premiumTier` is the effective tier (expired `premiumUntil` → `FREE`); coordinates are rounded to 2 decimals; `distanceKm` is null unless `lat`/`lng` were sent.
- **ProviderPublic** = ProviderCard + `{ ownerId, description, yearsExperience, freeSkills, skills, languages, interventionModes (ReferenceSummary[]), media: [{ id, kind, url, storagePath, youtubeId, title, order }], schedule: { timezone, slotDurationMin, slotBufferMin, rules: [{ dayOfWeek, startTime, endTime }], exceptions: [{ date, isOpen, startTime, endTime, reason }] }, scheduleSummary: [{ dayOfWeek, ranges }] (7, 0 = Sunday), social: { youtubeUrl, instagramUrl, tiktokUrl, facebookUrl }, contacts: { phone, whatsapp, email, addressLine, latitude, longitude } | null, contactsLocked, blocked, reviewsPreview: PublicReview[≤5], publishedAt, subcategoryId, placeId, isOwner, hidden, verificationStatus }`. The provider editor (06) reads this as the owner; there is no `GET /providers/me`.
- **PublicReview** `{ id, rating, comment, reply, repliedAt, createdAt, author: { id, name ("Prénom N."), avatar } }`.
- **BookingCard** `{ id, status, scheduledAt, scheduledLocal: { date, time }, durationMin, timezone, createdAt, agreedPrice, isPaid, cancelReason, cancelledAt, side: "client" | "provider", counterpart: { userId, providerId, name, photo, categoryLabel }, clientRating: { avg, count } | null, hasReview, hasClientReview }`.
- **BookingDetail** = BookingCard + `{ providerId, clientId, clientPhone, clientNotes, providerNotes, placeId, placeChain, addressLine, latitude, longitude, commissionPct, commissionAmt, providerNetAmt, paidAt, confirmedAt, completedAt, cancelledById, review: { id, rating, comment, reply } | null, clientReview: { id, rating, comment } | null }`. `providerNotes`, `commissionPct`, `commissionAmt` and `providerNetAmt` are null for the client.
- **ConversationItem** `{ id, subject, lastMessageAt, lastPreview, unread, side, counterpart: { userId, providerId, name, photo }, blocked, createdAt }`. **Message** `{ id, conversationId, senderId, mine, body, attachments: [{ kind, path, mime, bytes }], createdAt, deletedAt }` (deleted → `body: null`, `attachments: []`).
- **Notification** `{ id, type, title, message, data, isRead, readAt, createdAt }`; `data` carries `bookingId`, `conversationId` + `messageId`, `reviewId`, `clientReviewId`, `suggestionId` + `placeId` + `status` depending on the type.
- **SiteSettings** — flat object of the 21 keys (16 strings, 5 booleans), defaults filled.
- **Category tree node** `{ id, slug, name, icon, color, image, level: 1|2|3, providerCount, children }` publicly; the admin tree node adds `description, order, isActive, categoryId, parentId, counts: { providers, bookings, leads }` and drops `providerCount`.

## Behaviour notes for web workstreams

- **Search** (`GET /providers`) excludes hidden providers, suspended owners and users blocked by or blocking the viewer. `subcategoryId` and `placeId` match descendants. `sort=distance` requires `lat` and `lng` (400 otherwise). `sort=recommended` orders by stored premium tier, then rating.
- **Contacts** are visible to the owner and admins, and to any signed-in viewer unless `contacts_require_premium` is on and the effective tier is `FREE`. `feat_whatsapp` off nulls `contacts.whatsapp`. Blocked pairs still see the profile with `blocked: true`.
- **Profile, availability and public reviews** return 404 for hidden providers or suspended owners, except to the owner and admins.
- **Booking address** is optional: send either `addressId` or inline `placeId`/`addressLine`/`latitude`/`longitude`, not both (03's plan said "exactly one").
- **Messages** page 1 is the newest page; items are oldest-first within a page. Opening a thread resets the viewer's unread counter.
- **Attachments and KYC files** are private: resolve them with `GET /me/media/sign-read?path=` (owner, admin, or conversation participant for attachments; 5-minute URL). Avatars and provider media are public URLs.
- **Uploads**: `POST /me/uploads/sign` validates `mimeType` and optional `bytes` per purpose — avatar: jpeg/png/webp ≤ 8 MB; media: images ≤ 8 MB, mp4/quicktime/webm ≤ 25 MB; attachments: images, webm/mp4/mpeg/ogg audio ≤ 8 MB; verification: images or PDF ≤ 10 MB.
- **Agent concierge** (future rebase): `ProvidersService.search(query: ProviderSearchQuery, viewer?: Actor | null)`.
