# 07 → 08, 10: client and provider spaces as implemented

Workstream 07 rebuilt the ten signed-in, non-admin routes of `apps/web` on branch `kyou-ux/07-spaces`. Decisions are logged in `PROGRESS.md` (rows prefixed "(07)"). This file lists what 08 and 10 reuse.

## Routes

| Route | Files | Guard | Data |
| --- | --- | --- | --- |
| `/mes-reservations` | `(shell)/mes-reservations/{page,MesReservationsClient}.tsx` | `RequireClientOnly` | `GET /bookings?limit=100` once, filtered client-side; `GET /dashboard/client` for the received rating |
| `/reservation/[id]` | `(shell)/reservation/[id]/{page,ReservationDetailClient}.tsx` | `ProtectedRoute` | `GET /bookings/:id` (`retry: false`); 403/404 → "Réservation introuvable" card; perspective from `booking.side`; `PATCH /bookings/:id/notes` (provider) |
| `/mon-espace` | `(shell)/mon-espace/{page,MonEspaceClient}.tsx` + `components/espace/*` | `RequireRole PROVIDER` | `GET /dashboard/provider`; `PATCH /providers/me/availability` optimistic; accordion body lazily loads `GET /bookings/:id` for the phone and notes |
| `/revenus` | `(shell)/revenus/{page,RevenusClient}.tsx` + `components/espace/WeekBars.tsx` | `RequireRole PROVIDER` | `GET /pro/earnings/summary`, `GET /pro/earnings/transactions?page=` |
| `/avis` | `(shell)/avis/{page,AvisClient}.tsx` | `RequireClientOnly` | `GET /reviews/mine` → `{ reviews, toReview }`; "Évaluer" → `/prestataire/[providerId]?review=[bookingId]` |
| `/notifications` | `(shell)/notifications/{page,NotificationsClient}.tsx`, `notification-links.ts` | `ProtectedRoute` | `GET /notifications?page=&limit=30` (one key per loaded page), `PATCH /notifications/:id/read` optimistic, `PATCH /notifications/read-all` |
| `/aide` | `(shell)/aide/{page,AideClient}.tsx` | `ProtectedRoute` | none; FAQ in `copy/aide.ts` |
| `/adresses` | `(shell)/adresses/{page,AdressesClient}.tsx` + `components/addresses/*` | `RequireClientOnly` | `GET/POST/PATCH/DELETE /addresses` |
| `/compte` | `(shell)/compte/{page,CompteClient}.tsx` + `components/account/*` | `ProtectedRoute` | `GET /me` (createdAt, bio, gender…), `PATCH /me/profile` through `useAuth().updateProfile`, `POST /me/uploads/sign` + `POST /me/avatar`, `DELETE /me`, `GET /providers/:id` for the tier |
| `/messagerie` | `(shell)/messagerie/{page,MessagerieClient}.tsx` + `components/messaging/*` | `ProtectedRoute` | `GET /conversations?page=`, `GET /conversations/:id/messages` (infinite), `POST` / `DELETE` messages, `POST /reports` (`CONVERSATION`), `POST /blocks`, `GET /me/media/sign-read` |

`RequireClientOnly` (new in `components/guards/`) wraps `RequireRole CLIENT` and sends admins to `/admin`, because `/addresses`, `/reviews/mine` and `/dashboard/client` refuse the ADMIN role. Every other guard is 04's.

## Notification deep links (for 10's smoke)

`notification-links.ts` exports `notificationHref(notification, role)` and `NOTIFICATION_DEEP_LINKS`:

| Type | Href |
| --- | --- |
| `BOOKING_NEW`, `BOOKING_CONFIRMED`, `BOOKING_COMPLETED`, `BOOKING_CANCELLED` | `/reservation/[data.bookingId]` (`/notifications` when the id is missing) |
| `NEW_MESSAGE` | `/messagerie?c=[data.conversationId]` (`/messagerie` when missing) |
| `NEW_REVIEW`, `NEW_CLIENT_REVIEW` | `/avis` for CLIENT and ADMIN, `/mon-espace` for PROVIDER |
| `VERIFICATION_UPDATED` | `/verification` |
| `PLACE_SUGGESTION_RESOLVED` | `/compte` |
| `SYSTEM`, unknown | `/notifications` |

Clicking a row patches `isRead` on every loaded page, fires `PATCH /notifications/:id/read`, then invalidates `["notifications"]`, which also refreshes the navbar and dock badge (`queryKeys.notifications.list({ limit: 1 })`).

## Shared building blocks (`components/ui/`, usable by 08)

| Component | Props |
| --- | --- |
| `PageHeader` | `title`, `subtitle?`, `back?` (href or `"history"`), `backLabel?`, `icon?` + `iconHref?` / `onIconClick?` / `iconLabel?` / `iconDot?` (primary circle on the right), `action?` (free right slot), `centered?` |
| `StatusPill` | `status: BookingStatus` → `.status-pill--pending/confirmed/completed/cancelled` with `spacesCopy.status` labels |
| `MetricCard` | `icon`, `value`, `label`, `sub?`, `index?` (stagger) on `.metric-card` |
| `ConfirmSheet` | `open`, `onClose`, `title`, `description?`, `confirmLabel`, `cancelLabel?`, `tone?` `primary` · `gold` · `danger`, `busy?`, `disabled?`, `onConfirm`, `error?`, `children` (extra fields) — a `BottomSheet` with a form |
| `ErrorCard` | `message?`, `onRetry` ("Réessayer") |
| `SkeletonCard`, `SkeletonList` | `lines?` / `count?` |
| `MiniAvatar` | `src`, `name`, `size?` 40–96; photo or initials on the primary colour |
| `EmptyState` | `icon: LucideIcon`, `title`, `description?`, `action?` `{ href, label, tone? }` or a node; dashed `rounded-3xl` |

`components/bookings/`: `BookingCard` (`booking`, `perspective`, `notes?`, `linkToDetail?`, `children`), `BookingActions` (`booking: { id, status }`, `perspective`; confirm / complete with agreed price + "Payé en espèces" switch / cancel with a required reason for providers; exports `invalidateBookingQueries` which invalidates `["bookings"]`, `["dashboard"]`, `["earnings"]`, `["reviews"]`), `ClientRatingForm` (`bookingId`), `format.ts` (`formatSlotDay`, `formatSlotLongDay`, `formatDateTime`, `formatMonthYear`, `formatCdf`).

## Messaging internals

- `useConversationPolling()` returns `{ refetchInterval: 15_000 | false, refetchIntervalInBackground: false }` from a `visibilitychange` listener; both the list and the thread spread it. Verified: one refetch of the open thread within 16.5 s on a visible tab.
- `useSignedAttachment(path)` caches `GET /me/media/sign-read` under `queryKeys.media.signRead(path)` with `staleTime = expiresAt − now − 30 s`.
- `thread-cache.ts` holds the optimistic patches (`appendMessage`, `replaceMessage`, `markMessageDeleted`, `patchConversation`).
- `AttachmentBar` keeps its 05 props (`attachments`, `onChange`, `onError`, plus optional `disabled`) and now delegates to `VoiceRecorder` (`audio/webm` or `audio/mp4`, 2-minute cap, timer pill, cancel / confirm). 05's `MessageComposer` is unchanged.
- The thread sets `document.body.dataset.dock = "hidden"` while open; `globals.css` hides `.mobile-dock` and drops the shell's bottom padding for that attribute.
- Message bubbles carry `data-message-id` for tests; own messages show "Supprimer" on hover or long-press, behind a `ConfirmSheet`.
- Safety in a thread is `ThreadSafety` (report `targetKind: "CONVERSATION"`, block the counterpart user id, stay on the thread with the blocked notice), not 05's provider-profile `SafetyActions`.

## Copy

`copy/spaces.ts` (shared: status labels, common actions, `rating(avg, count)`), `copy/bookings.ts`, `espace.ts`, `revenus.ts`, `avis.ts`, `notifications.ts`, `aide.ts`, `adresses.ts`, `compte.ts`, `messagerie.ts`.

## Environment notes (for 10)

- The `message-attachments` bucket is missing on the shared Supabase project, like `provider-media` and `verification-docs`: `POST /me/uploads/sign?purpose=attachments` answers 500 and the composer shows the inline upload error. The signed-read rendering path is implemented but could not be exercised end to end here.
- After `DELETE /me` the Supabase user is removed but the caller's access token stays valid until it expires; a subsequent `GET /me` with that token provisions a brand-new `User` row (observed: new id, `auth/v1/admin/users/:id` → 404). The web signs out and reloads on `/` so the app never does this, but a script or a stale tab can. 02/10 should make provisioning refuse a subject whose Supabase user no longer exists, or revoke sessions before deletion.
- `apps/web/scripts/spaces-smoke.mjs` is the Playwright pass used for the evidence below: render + overflow at 320/390/1440 for both roles, the redirect matrix, the 308s, and the interaction checks (tabs, mark-read, availability toggle, earnings, profile save, address create/delete, send/poll/delete a message, admin 409, throwaway-account deletion). It needs the dev servers, the demo accounts and `SUPABASE_SERVICE_KEY` in `apps/backend/.env`.

## Verification

```sh
pnpm --filter @kayu/web type-check
NODE_ENV=production pnpm --filter @kayu/web build
cd apps/web && PW_CHANNEL=chrome node scripts/spaces-smoke.mjs --shots ../../docs/kyou-ux-refactor/screenshots/07
cd apps/web && REDUCED=1 PW_CHANNEL=chrome node scripts/spaces-smoke.mjs --only render
```
