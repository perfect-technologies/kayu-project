# 02 - Backend Modules

Status: **Done** (2026-09-16). The contract as implemented, including the deviations from this doc, is in [`handover/02-backend-contract.md`](./handover/02-backend-contract.md); decisions are logged in `PROGRESS.md` with the prefix "(02)".

## Objective

Rebuild `apps/backend/src/modules` so the API serves exactly the K-YOU product on the schema from workstream 01, with KAYOU's guards, Zod validation, transactional writes, notifications and `node:test` conventions.

## Severity

P0. Web workstreams 05–08 consume this contract.

## Owns

- `apps/backend/src/modules/**`
- `apps/backend/src/common/**` (guards unchanged, new decorators only if needed)
- `apps/backend/src/app.module.ts`
- `apps/backend/src/test/launch/launch-critical.harness.spec.ts`
- `apps/backend/package.json` scripts (`test:launch` list)

## Out of scope

- Prisma schema (01), shared DTO package (03), web (04–09).

## Conventions that do not change

- Global prefix `/api`. `SupabaseGuard` → `ActorGuard` → `RolesGuard`. `@CurrentActor()` for the local user.
- Per-handler `LazyZodValidationPipe` with DTOs from `@kayu/schemas`.
- Every multi-row write in `prisma.$transaction`. Notifications created inside the caller's transaction via `NotificationsService.create(params, tx)`.
- `ActivityLog` row for every admin mutation with `ipAddress`.
- Service specs with hand-rolled Prisma fakes. Controller coverage through the launch harness.
- Storage: signed upload URLs from `POST /me/uploads/sign`, client uploads straight to Supabase Storage, backend stores the path and verifies ownership with `assertOwnedPath`.

## Module plan

| Module | Action | Notes |
| --- | --- | --- |
| `job-requests` | **Delete** | Also delete its specs and remove from `test:launch`. |
| `quotes` | **Delete** | |
| `earnings` | **Rewrite** | Summary and transactions only. Payouts removed. |
| `verification` | **Modify** | Keep documents and submit. Remove dispute endpoints. |
| `bookings` | **Rewrite** | Slot-based creation, three transitions, agreed price at completion, final-offers controller deleted. |
| `reviews` | **Rewrite** | Single rating; rating aggregates on Provider; client reviews per booking. |
| `providers` | **Rewrite** | Search over places and references, public profile with contact gating, media, schedule, availability slots. |
| `identity` | **Modify** | Profile fields from K-YOU account page, account deletion, role upgrade only. Remove legacy one-shot onboarding. |
| `onboarding` | **Rewrite** | One publish endpoint receiving the full wizard payload. No server-side draft. |
| `messaging` | **Rewrite** | Client↔provider conversations with unread counters, attachments, blocks. |
| `notifications` | **Keep** | Trim types. |
| `categories` | **Modify** | Three-level hierarchy with provider counts. |
| `admin` | **Rewrite** | Sections from K-YOU §25 plus KYC queue. |
| `dashboard` | **Rewrite** | Provider space and client space payloads shaped for the K-YOU screens. |
| `stats` | **Modify** | Public counters for the home stats bar. Trending removed. |
| `settings` | **Rewrite** | Public site content + feature flags from `SystemSetting`. Visibility settings removed. |
| `favorites` | **Delete** | |
| `geo` | **Keep** | Geocode and distance. Communes lists removed in favour of `places`. |
| `storage` | **Modify** | New purposes: `media`, `attachments` (private), `verification` (private). Add signed read URLs for private objects. |
| `health`, `launch-leads` | **Keep** | |
| `agent` | **Not present** | Only on `feat/agent-concierge-phase-1`. Out of scope. Its `search_providers` tool will need the new `ProvidersService.search` signature when that branch is rebased. |
| `places` | **New** | Place tree, suggestions, admin curation, merge. |
| `references` | **New** | Flat reference lists, admin curation, merge. |
| `safety` | **New** | Reports and blocks. |
| `contact` | **New** | Public contact form and admin inbox. |
| `addresses` | **New** | Client address book. |
| `account` | **New** (inside identity) | `DELETE /me` with cascading cleanup and storage deletion queue. |

## Endpoint contract

All paths are under `/api`. Roles: `pub` public, `auth` any signed-in active user, `C` client, `P` provider, `A` admin. Every list endpoint takes `page`, `limit` (max 100) and returns `{ items, total, page, limit }`.

### Public discovery

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/public` | pub | Site content overrides, feature flags, contact details, maintenance state. |
| GET | `/stats` | pub | `{ categories, countries: 2, providers, verifiedProviders }` for the home stats bar. |
| GET | `/categories/tree` | pub | Full 3-level tree with `providerCount` per node, active only. |
| GET | `/places` | pub | `?kind&parentId&q` active places; `?ids=` batch lookup. |
| GET | `/places/:id/ancestors` | pub | Chain to country, for chips and breadcrumbs. |
| GET | `/references` | pub | `?type` active reference items (languages, modes, currencies, units, skills with `categoryId`). |
| GET | `/providers` | pub | Search. Query: `q`, `categoryId|categorySlug`, `subcategoryId`, `placeId` (matches the place or any descendant), `languageId`, `modeId`, `minRating`, `verifiedOnly`, `premiumOnly`, `sort=recommended|rating|distance|newest`, `lat`, `lng`, `page`, `limit`. Returns card DTOs (id, displayName, photo, category chain labels, place labels, ratingAvg, ratingCount, premiumTier, verified, lat/lng, distanceKm when lat/lng given). Hidden providers, suspended users and providers blocked by/blocking the viewer are excluded. |
| GET | `/providers/:id` | pub | Public profile. Contacts (`phone`, `whatsapp`, `email`, `addressLine`, exact lat/lng) are present only when the viewer is signed in and (`contacts_require_premium` is off or tier ≠ FREE). Otherwise `contactsLocked: true`. Includes media, references, schedule summary, `reviewsPreview` (5), aggregates. 404 when hidden or owner suspended. |
| GET | `/providers/:id/availability` | pub | `?date=YYYY-MM-DD` → `{ timezone, slotDurationMin, slots: ["09:00", …] }` computed from rules, exceptions, existing PENDING/CONFIRMED bookings, and "not in the past". |
| GET | `/providers/:id/reviews` | pub | Paginated public reviews. |
| POST | `/contact` | pub | Contact form. Rate-limited per IP (reuse `LaunchIntakeProtectionService` bucket helpers). Creates `ContactMessage`. |
| GET | `/geocode` | pub | Unchanged: `?q` or `?placeId` → `{ lat, lng, label, source }`. Place-based lookup resolves through `Place.latitude/longitude` first, then Nominatim. |
| GET | `/distance` | pub | Unchanged haversine helper. |

### Identity and account

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/me` | auth | Provisioning endpoint (unchanged) + `provider: { id, hidden, verificationStatus } \| null`. |
| PATCH | `/me/profile` | auth | `firstName`, `lastName`, `avatar`, `bio`, `gender`, `birthdate`, `placeId`, `country`. |
| POST | `/me/avatar` | auth | Unchanged. |
| POST | `/me/uploads/sign` | auth | `purpose: avatar|media|attachments|verification`. |
| GET | `/me/media/sign-read` | auth | `?path` → short-lived signed download URL for private buckets, after ownership or conversation-membership check. |
| POST | `/me/accept-terms` | auth | Stamps `termsAcceptedAt`. Called once after first OTP. |
| DELETE | `/me` | auth | Account deletion: 409 for admins; deletes provider, media (queues storage paths), conversations and messages the user is part of, reports filed, blocks, addresses, notifications; anonymises bookings and reviews? **No** — bookings and reviews are deleted and provider aggregates recomputed, matching K-YOU. Writes `ActivityLog account.deleted`. Then the client calls `supabase.auth.signOut()`; a Supabase Auth admin deletion is issued server-side with the service key. |

### Provider self-service

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/me/provider` | C | Publish from the wizard. Body = full profile (section 5 of the contract). Validates: required fields, taxonomy node active and deepest, place chain active, phone E.164, ≤ 12 images, ≤ 12 videos, YouTube URLs on `youtube.com`/`youtu.be` only (K-YOU's deceptive-host check), schedule ≤ 4 ranges/day non-overlapping, duration 15–240, buffer 0–60. Creates Provider + relations, sets `role = PROVIDER`, `roleSelectedAt`. 409 if a provider already exists. |
| PATCH | `/providers/me` | P | Same validation, partial update of the same fields. Aggregates and status fields are not writable. |
| PUT | `/providers/me/schedule` | P | Replaces rules + exceptions atomically. Existing bookings are not touched (K-YOU rule). |
| PUT | `/providers/me/media` | P | Replaces the ordered media list. Removed uploads are queued for storage deletion. |
| PATCH | `/providers/me/availability` | P | `isAvailable` toggle for the dashboard pill. |
| GET | `/dashboard/provider` | P | `{ provider, metrics: { pending, completed, ratingAvg, ratingCount, acceptanceRate }, pendingBookings[], history[], weekCompletedByDay[7] }`. |
| GET | `/pro/earnings/summary` | P | `{ total, thisWeek, byDay[7], completedThisWeek, acceptanceRate, ratingAvg, ratingCount }` from `Transaction` and `Booking`. |
| GET | `/pro/earnings/transactions` | P | Paginated EARNING/BONUS rows with booking label. |
| GET/POST/DELETE | `/pro/verification/state`, `/documents`, `/documents/:id`, `/submit` | P | Unchanged behaviour. Dispute routes removed. |

### Bookings

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/bookings` | C | `{ providerId, date, time, clientPhone, clientNotes?, addressId? \| { placeId, addressLine, lat, lng } }`. Server converts date+time in the provider timezone to `scheduledAt`, locks the provider row, recomputes availability, inserts. 409 `SLOT_TAKEN` on conflict or unique violation. Blocks → 403. Self-booking → 400. `feat_booking` off → 403. Notifies provider `BOOKING_NEW`. |
| GET | `/bookings` | auth | Own bookings (client side or provider side by role). `?status=` filter. Card DTO includes the counterpart's name, photo, category label, and the client's average rating for providers. |
| GET | `/bookings/:id` | participant, A | Detail. |
| POST | `/bookings/:id/confirm` | P owner | PENDING → CONFIRMED. Notifies client. |
| POST | `/bookings/:id/complete` | P owner | CONFIRMED → COMPLETED. Body `{ agreedPrice?, isPaid? }`. Computes commission, writes EARNING transaction (`COMPLETED` if paid else `PENDING`), increments `completedJobs`. Notifies client. |
| POST | `/bookings/:id/cancel` | participant, A | PENDING/CONFIRMED → CANCELLED with `reason` (required for provider). Notifies counterpart. |
| PATCH | `/bookings/:id/notes` | P owner | `providerNotes`. |

### Reviews

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/reviews` | C | `{ bookingId, rating, comment }`. Booking must be the client's and COMPLETED; one per booking; `feat_reviews` on. Recomputes `ratingAvg`/`ratingCount` in the transaction. Notifies provider. |
| GET | `/reviews/mine` | C | Reviews written + completed bookings without a review (`toReview[]`). |
| POST | `/reviews/:id/reply` | P owner | Sets `reply`. |
| POST | `/reviews/clients` | P | `{ bookingId, rating, comment }`. One per booking. Notifies client. |
| GET | `/reviews/clients/:clientId/summary` | P, A | `{ avg, count }`. |

### Messaging and safety

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/conversations` | auth | Own conversations ordered by `lastMessageAt`, with counterpart, unread for the viewer. |
| POST | `/conversations` | C | `{ providerId, subject?, body, attachments? }`. Upserts the conversation, sends the first message. Blocked → 403. |
| GET | `/conversations/:id/messages` | participant | Paginated, oldest first for the page requested. Opening resets the viewer's unread counter. |
| POST | `/conversations/:id/messages` | participant | `{ body?, attachments? }` ≤ 6 attachments, each an owned `attachments/` path with `kind image|audio`. Bumps counters and preview. Notifies counterpart `NEW_MESSAGE`. |
| DELETE | `/conversations/:id/messages/:messageId` | sender, A | Soft delete. |
| POST | `/reports` | auth | `{ targetKind, targetId, reason }`. |
| POST | `/blocks` | auth | `{ userId }`. Idempotent. |
| DELETE | `/blocks/:userId` | auth | |
| GET | `/blocks` | auth | Own blocks. |

### Client utilities

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard/client` | C | `{ bookingsByStatus, clientRating: { avg, count }, unreadMessages }`. |
| GET/POST/PATCH/DELETE | `/addresses`, `/addresses/:id` | C | Address book. Setting `isDefault` demotes siblings in the transaction. First address becomes default. |
| GET | `/notifications` | auth | Unchanged. |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | auth | Unchanged. |
| POST | `/places/suggestions` | auth | `{ kind, label, parentId }`. Notifies the user on resolution. |

### Admin

Class-level `@Roles("ADMIN")`. Every mutation logs to `ActivityLog`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/overview` | `{ users: { total, suspended }, providers, bookings, openReports, pendingSuggestions, pendingVerifications }`. |
| GET | `/admin/users` | Search `q` over name, email, phone, place; filters `role`, `suspended`. |
| PATCH | `/admin/users/:id` | `{ role?, suspended?, suspendedReason? }`. Cannot target self. Cannot demote or suspend the last admin. Suspending a provider hides it. |
| GET | `/admin/users/:id/cv` | Full member sheet for the printable CV (profile, provider, aggregates, recent activity). |
| GET | `/admin/providers` | Search + filters `verificationStatus`, `premiumTier`, `hidden`. |
| PATCH | `/admin/providers/:id` | `{ hidden?, premiumTier?, premiumUntil?, verificationStatus? }` (manual override with the existing doc rules). |
| GET | `/admin/verification/submissions` · PUT `/admin/verification/documents` | Unchanged. |
| GET | `/admin/bookings` | Search over client/provider/phone, `status` filter. |
| POST | `/admin/bookings/:id/cancel` | Reason required. |
| GET | `/admin/reviews` · DELETE `/admin/reviews/:id` · PATCH `/admin/reviews/:id` | Rating filter; delete recomputes aggregates; patch toggles `isPublic`. |
| GET | `/admin/conversations` · GET `/admin/conversations/:id/messages` · DELETE `/admin/conversations/:id` · DELETE `/admin/messages/:id` | Moderation. |
| GET | `/admin/contacts` · PATCH `/admin/contacts/:id` · DELETE `/admin/contacts/:id` | Inbox with status. |
| GET | `/admin/reports` · PATCH `/admin/reports/:id` | `{ status: RESOLVED, resolution }`. |
| GET | `/admin/settings` · PUT `/admin/settings` | Bulk read/write of the site-content keys. |
| GET | `/admin/audit` | Last 200 `ActivityLog` rows with actor names. |
| GET | `/admin/health` | `{ database, storage, email: "not configured", version }`. |
| GET/POST/PATCH/DELETE | `/admin/categories`, `/admin/categories/:id`, `/admin/subcategories`, `/admin/subcategories/:id` | Three-level CRUD; deactivate/delete refused when providers, bookings or leads reference the node. |
| GET/POST/PATCH | `/admin/places`, `/admin/places/:id` | CRUD incl. `active`, `aliases`. |
| POST | `/admin/places/merge` | `{ fromId, intoId }` same kind and parent, `fromId` has no children; repoints users, providers, addresses, bookings; marks `mergedIntoId`. |
| GET | `/admin/places/suggestions` · POST `/admin/places/suggestions/:id/approve` · `/reject` | Approve creates the place and repoints the suggestion. |
| GET/POST/PATCH | `/admin/references`, `/admin/references/:id` · POST `/admin/references/merge` | Same shape as places. |

## Cross-cutting behaviour

- **Suspension**: `ActorGuard` already throws 403 when `isActive` is false. Add `suspendedReason` to the 403 body so the web can show it.
- **Blocks**: a `SafetyService.isBlocked(a, b)` helper used by search, profile, conversations and bookings.
- **Availability**: port K-YOU `shared/schedule.mjs` to `providers-availability.service.ts`: rules per weekday, exceptions override, slot stepping by `slotDurationMin + slotBufferMin`, existing bookings block `[scheduledAt, scheduledAt + duration + buffer)`, past slots removed for today in the provider timezone. Unit-test the seven K-YOU cases plus timezone edges.
- **YouTube**: port K-YOU `shared/media.mjs` parsing into `@kayu/utils` (workstream 03) and reuse server-side.
- **Storage deletion queue**: reuse the `storage_deletions` idea from K-YOU as a `StorageDeletion` table? **No.** Keep it simpler: delete objects synchronously inside the request after the DB transaction commits, log failures to `ActivityLog` with `entityType = "storage"`. Revisit if failures appear.
- **Rate limits**: contact form and report creation reuse the launch-leads token-bucket helper with their own buckets.
- **Email**: none. `admin/health` reports email as not configured.

## Tests

`test:launch` becomes:

```
identity, onboarding, providers (search, profile gating, availability), bookings (slot conflict under concurrency, transitions, agreed price + ledger), reviews (aggregates), messaging (unread, blocks, attachments), safety, places (tree, merge, suggestion approval), references, contact, addresses, admin (moderation, settings, last-admin protection), verification, launch-leads (all existing), launch-critical.harness
```

The harness smoke becomes: OTP user → accept terms → publish provider → second user searches → opens profile → sends message → books a slot → provider confirms → provider completes with agreed price → client reviews → provider rates client → admin sees the booking, resolves a report, edits hero copy.

## Acceptance criteria

- Every endpoint above exists with the documented role and status codes.
- No route or service from the deleted modules remains; `grep -r "FinalOffer\|JobRequest\|Quote\|Payout\|TrustScore\|Dispute\|Favorite\|VisibilitySettings" apps/backend/src` returns nothing.
- `pnpm --filter @kayu/backend test:launch` passes with PGlite-free real Postgres for the concurrency specs.
- `pnpm --filter @kayu/backend type-check` and `build` pass.
