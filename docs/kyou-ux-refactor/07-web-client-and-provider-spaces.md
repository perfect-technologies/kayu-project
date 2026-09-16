# 07 - Web Client and Provider Spaces

## Objective

Rebuild every signed-in, non-admin screen of `apps/web` on the K-YOU disposition: the client space (bookings, reviews, addresses), the provider space (dashboard, earnings), and the shared screens (messaging, notifications, help, account). All of them render inside the single `Layout` from workstream 04 with the mobile dock, and read only the endpoints defined in workstream 02.

## Severity

P0 for `/mes-reservations`, `/mon-espace`, `/messagerie`, `/compte`. P1 for `/revenus`, `/avis`, `/notifications`, `/adresses`, `/aide`, `/reservation/[id]`.

## Owns

- `apps/web/src/app/mes-reservations/`
- `apps/web/src/app/reservation/[id]/`
- `apps/web/src/app/mon-espace/`
- `apps/web/src/app/revenus/`
- `apps/web/src/app/avis/`
- `apps/web/src/app/notifications/`
- `apps/web/src/app/aide/`
- `apps/web/src/app/adresses/`
- `apps/web/src/app/compte/`
- `apps/web/src/app/messagerie/`
- `apps/web/src/components/bookings/` (rebuilt)
- `apps/web/src/components/espace/` (new, provider dashboard pieces)
- `apps/web/src/components/messaging/` (new)
- `apps/web/src/components/account/` (new)
- `apps/web/src/components/addresses/` (new)
- `apps/web/src/copy/{bookings,espace,revenus,avis,notifications,aide,adresses,compte,messagerie}.ts`

## In scope

- Ten routes listed above, mobile-first at 390 px and desktop at 1440 px.
- Client rating of providers is **not** here; it lives on the profile page (workstream 05). This workstream links to it.
- Provider rating of clients (`ClientRatingForm`) is here, on `/mon-espace`.
- Voice recording and image attachments in messaging.
- Deletion of the old routes and components listed at the end.

## Out of scope

- The shell, tokens and motion primitives (04).
- Provider profile editing `/prestataire/[id]/modifier` (06).
- Admin (08).
- Push or realtime transport. Polling stays.

## Shared building blocks used across the workstream

Created in `apps/web/src/components/bookings/` unless noted; all consume tokens from 04.

| Component | Purpose |
| --- | --- |
| `PageHeader` (04) | Back circle button, H1, optional subtitle, optional right-side icon circle. Used by every screen here. |
| `StatusPill` (04) | `PENDING` amber, `CONFIRMED` emerald, `COMPLETED` muted, `CANCELLED` red. |
| `BookingCard` | Avatar (48 px) linking to the counterpart, name, category label, `StatusPill`, chip row (`Calendar` date, `Clock` time), notes, `BookingActions`. Prop `perspective: "client" \| "provider"`. |
| `BookingActions` | Client: `Annuler` on PENDING/CONFIRMED. Provider: `Confirmer`, `Terminer`, `Annuler` per state. Each opens `ConfirmSheet` (04). Cancel from a provider requires a reason textarea. Complete opens a sheet with optional agreed price (CDF integer) and "Payé en espèces" switch. |
| `ClientRatingForm` | 5-star input (22 px), 500-char textarea with counter, submit → `POST /reviews/clients`. Hidden when `GET /bookings` returns `clientReviewId` for that booking. |
| `MetricCard` (04) | Mint `rounded-2xl` card with a white icon square, value, label, sub-label. |
| `EmptyState` (04) | Dashed `rounded-3xl`, icon, title, one CTA. |
| `ExpandableText` (04) | 3-line clamp with "Voir plus / Voir moins". |
| `MiniAvatar` (04) | 44 px photo or primary initials. |

Data layer: every screen uses TanStack Query through `@kayu/api` wrappers from workstream 03. Query keys follow `queryKeys.<domain>.*`. Mutations invalidate the listed keys. Loading states use `SkeletonCard` (04). Errors render `ErrorCard` (04) with a "Réessayer" button that calls `refetch`.

## Guard matrix

| Route | Allowed | Redirect otherwise |
| --- | --- | --- |
| `/mes-reservations`, `/avis`, `/adresses` | CLIENT | PROVIDER → `/mon-espace`, ADMIN → `/admin`, anonymous → `/login?returnTo=` |
| `/mon-espace`, `/revenus` | PROVIDER | CLIENT → `/mes-reservations`, anonymous → `/login?returnTo=` |
| `/reservation/[id]` | participant or ADMIN | 404 card when the API returns 403/404 |
| `/messagerie`, `/notifications`, `/aide`, `/compte` | any signed-in | anonymous → `/login?returnTo=` |

Guards run in `RequireRole` (04) which reads the `AuthContext` and renders nothing until auth is resolved. The server enforces the same rules; the guards only avoid flashes.

---

## `/mes-reservations` — Mes commandes (client)

**Files**: `app/mes-reservations/page.tsx` (server, metadata) → `MesReservationsClient.tsx`.
**Reference**: `screenshots/ui-refresh/mes-reservations.png`.

**Layout, mobile 390**
1. `PageHeader`: back circle → `/`, H1 "Mes commandes", subtitle with the client's own received rating "★ 4.8 · 12 avis" when `clientRating.count > 0`, right icon circle `Package` in primary.
2. Status tab strip: horizontally scrolling pills (`no-scrollbar`) — Toutes / En cours (PENDING + CONFIRMED) / Terminées / Annulées, each with a count badge. Active = solid primary.
3. List of `BookingCard perspective="client"` in `AnimatePresence mode="popLayout"` with `layout`, stagger 0.03 s capped at 0.25 s.
4. Empty: `EmptyState` with `Inbox`, "Aucune commande", CTA "Rechercher" → `/rechercher`.
5. Dock below.

**Desktop 1440**: `max-w-3xl` centred, same order, tab strip does not scroll.

**Data**
- `GET /bookings?status=` (all statuses fetched once, filtered client-side, `queryKeys.bookings.mine()`).
- `GET /dashboard/client` for `clientRating`.
- `POST /bookings/:id/cancel` from `BookingActions`; invalidates `bookings.mine`, `dashboard.client`.

**States**: skeleton list of 3 cards; error card; empty as above. Cancelling shows a toast "Réservation annulée".

---

## `/reservation/[id]` — Détail d'une réservation

**Files**: `app/reservation/[id]/page.tsx` (server: awaits params, metadata) → `ReservationDetailClient.tsx`.
**Reference**: none in K-YOU. Layout is the expanded `BookingCard`.

**Layout**
1. `PageHeader`: back → `/mes-reservations` or `/mon-espace` by role, H1 "Réservation".
2. White `rounded-3xl` card: counterpart row (avatar 56, name, category, link to profile), `StatusPill`, chips (date, time, duration), address block with place chain and street when present, client phone (provider view only), notes (`ExpandableText`), agreed price and paid state when COMPLETED (provider view shows net after commission as plain text).
3. `BookingActions` for the viewer's role.
4. Provider view only: "Notes internes" textarea with a save pill → `PATCH /bookings/:id/notes`.
5. Timeline list: created, confirmed, completed, cancelled with reason, rendered as plain text rows.

**Data**: `GET /bookings/:id` (`queryKeys.bookings.detail(id)`); mutations as in `BookingActions`. 403/404 → `EmptyState` "Réservation introuvable" with back CTA.

---

## `/mon-espace` — Espace prestataire

**Files**: `app/mon-espace/page.tsx` → `MonEspaceClient.tsx`; pieces in `components/espace/`: `Greeting`, `StatusBanner`, `MetricsRow`, `RequestAccordion`, `ProfileRow`, `HistoryList`.
**Reference**: `screenshots/ui-refresh/mon-espace.png`.

**Layout, mobile 390**
1. `Greeting`: `MiniAvatar` + "Bonjour," / first name; right: availability pill with green/grey dot ("Disponible" / "Indisponible") and a bell icon-button → `/notifications` with an accent dot when unread.
2. `StatusBanner`: `rounded-3xl bg-primary` white text, giant faded `TrendingUp` watermark, `Eye` circle, "Vous êtes visible par les clients" (or "Vous êtes masqué" when `isAvailable` is false or `hidden`), sub-line, white pill "Passer indisponible" / "Passer disponible".
3. `MetricsRow`: three `MetricCard` — Demandes à traiter (`metrics.pending`), Terminées (`metrics.completed`), Note moyenne (`ratingAvg` with "n avis").
4. "Nouvelles demandes" title + gold count badge. `RequestAccordion` list: coloured category circle, category label, date/time/client chips, `ChevronRight` rotating 90°; expanded body shows phone (`tel:` link), notes, client average rating (amber star, from `clientRating` in the card DTO) and `BookingActions perspective="provider"`.
5. "Mon profil": `ProfileRow` — 56 px avatar, display name, category · place, star + `ratingAvg (ratingCount)`, outline "Modifier" → `/prestataire/[id]/modifier`; the row itself links to `/prestataire/[id]`.
6. "Réservations reçues": `HistoryList` of non-pending bookings as `BookingCard perspective="provider"`; COMPLETED cards append `ClientRatingForm` when not yet rated.
7. Dock.

**No provider profile** (`me.provider === null`, only possible for ADMIN or a stale role): `EmptyState` with `Plus`, "Créer mon profil", gold CTA → `/prestataire/nouveau`.

**Desktop 1440**: `max-w-4xl`; metrics stay 3-up; sections stack.

**Data**
- `GET /dashboard/provider` (`queryKeys.dashboard.provider`) supplies everything above.
- `GET /notifications?unreadOnly=true&limit=1` for the bell dot.
- `PATCH /providers/me/availability` (optimistic toggle, rollback on error).
- `POST /bookings/:id/confirm`, `/complete`, `/cancel`; `POST /reviews/clients`. Invalidate `dashboard.provider`, `bookings.mine`.

**States**: skeleton greeting + banner + 3 metric cards; error card; empty requests dashed "Aucune réservation pour l'instant".

**Motion**: accordion height via `AnimatePresence`; banner button press scale; metric cards stagger in.

---

## `/revenus` — Mes revenus (provider)

**Files**: `app/revenus/page.tsx` → `RevenusClient.tsx`; `components/espace/WeekBars.tsx`.
**Reference**: `screenshots/ui-refresh/revenus.png`.

**Layout**
1. `PageHeader`: back → `/mon-espace`, centred H1 "Mes revenus", right outline pill "Cette semaine" (static label, no menu).
2. Earnings hero `rounded-3xl bg-primary` white: `Wallet` circle, "Total gagné", `total` formatted `Intl.NumberFormat("fr-CD")` + " FC" in `text-3xl font-extrabold`, caption "Net après commission". Below: `WeekBars` — 7 bars (h-28), values `byDay`, tallest bar `bg-accent`, others `bg-white/25`, Lun…Dim labels. Bars animate height on mount.
3. Three `MetricCard`: interventions cette semaine (`completedThisWeek`), acceptation (`acceptanceRate` %), note moyenne (`ratingAvg` sur `ratingCount` avis).
4. "Transactions récentes": up to 6 rows — coloured category circle, booking label, date, amount in emerald, `ChevronRight` → `/reservation/[bookingId]`; "Voir tout" link toggles the full paginated list. Empty: dashed line "Aucune transaction".
5. Full-width gold pill "Retirer mes gains" → toast "Bientôt disponible". No API call.

**Data**: `GET /pro/earnings/summary` (`queryKeys.earnings.summary`), `GET /pro/earnings/transactions?page=` (`queryKeys.earnings.transactions(page)`).

**States**: skeleton hero + 3 metric cards; error card.

**Note**: amounts are `netAmt` for the provider. Commission is never shown as a line, only the caption.

---

## `/avis` — Mes avis (client)

**Files**: `app/avis/page.tsx` → `AvisClient.tsx`.
**Reference**: `screenshots/ui-refresh/avis.png`.

**Layout**
1. `PageHeader`: back → `/compte`, H1 "Mes avis", subtitle, right icon circle `Star` in primary.
2. Summary card `rounded-3xl`: amber star square, average rating given in `text-2xl`, "n avis laissés · note moyenne donnée".
3. "À évaluer": up to 6 rows (dashed `border-primary/30 bg-primary/5`): provider avatar, name, service date, gold pill "Évaluer" → `/prestataire/[providerId]?review=[bookingId]` (the profile page opens its review form pre-linked to that booking).
4. "Avis publiés": cards with 44 px avatar linking to the profile, name + category label, star row right, `ExpandableText` comment, "Service du <date>", and the provider's reply when present as an indented mint block.
5. Empty for both lists: dashed rows with copy.

**Data**: `GET /reviews/mine` (`queryKeys.reviews.mine`) → `{ items, toReview }`.

---

## `/notifications`

**Files**: `app/notifications/page.tsx` → `NotificationsClient.tsx`.
**Reference**: `screenshots/ui-refresh/notifications.png`.

**Layout**
1. `PageHeader`: back → previous or `/`, H1 "Notifications", subtitle "n activité(s) récente(s)", right icon circle `Bell` with an accent dot when `unreadCount > 0`. A text button "Tout marquer lu" under the header when unread exist.
2. List of rows (each a `Link` to `data.href` resolved from `type` + `data`): coloured round icon per type — `NEW_MESSAGE` blue `MessageSquare`, `BOOKING_NEW` amber `CalendarClock`, `BOOKING_CONFIRMED` secondary `CalendarCheck`, `BOOKING_COMPLETED` emerald `CheckCircle`, `BOOKING_CANCELLED` red `XCircle`, `NEW_REVIEW`/`NEW_CLIENT_REVIEW` amber `Star`, `VERIFICATION_UPDATED` emerald `ShieldCheck`, `PLACE_SUGGESTION_RESOLVED` primary `MapPin`, `SYSTEM` muted `Info`; bold title, one-line message, relative time on the right ("à l'instant", "il y a n min / h / j", then a date). Unread rows have a mint background and a 6 px primary dot.
3. Empty: `EmptyState` with `Inbox`, "Aucune notification".
4. "Voir plus" pill for the next page.

**Deep links**: bookings → `/reservation/[id]`; messages → `/messagerie?c=[conversationId]`; reviews → `/avis` (client) or `/mon-espace` (provider); verification → `/verification`; suggestions → `/compte`.

**Data**: `GET /notifications?page=&limit=30` (`queryKeys.notifications.list(page)`), `PATCH /notifications/:id/read` on click (fire-and-forget, optimistic), `PATCH /notifications/read-all`. Invalidate `notifications.*` and the dock badge query.

---

## `/aide`

**Files**: `app/aide/page.tsx` (server, static) → `AideClient.tsx` for search state; content in `copy/aide.ts`.
**Reference**: `screenshots/ui-refresh/aide.png`.

**Layout**
1. H1 "Comment pouvons-nous vous aider ?" (`text-3xl`).
2. Mint search pill filtering the FAQ client-side.
3. "Raccourcis" 2-column grid of mint `rounded-[22px]` tiles: Mes commandes / Mon espace (by role), Messages, Réserver (→ `/rechercher`), Compte.
4. FAQ: native `<details>` accordions with `CircleHelp`, chevron rotating 90°, answer reveal animation; five bilingual pairs from K-YOU rewritten in French only (réserver, annuler, contacter un prestataire, signaler un problème, supprimer mon compte) plus one about the verified badge.
5. Support card: emerald gradient panel (allowed by contract §11 rule 2 for this panel), `Headphones`, "Besoin d'aide maintenant ?", gold pill → `/contact`.

**Data**: none.

---

## `/adresses` — Mes adresses (client)

**Files**: `app/adresses/page.tsx` → `AdressesClient.tsx`; `components/addresses/AddressRow.tsx`, `AddressSheet.tsx`.
**Reference**: `screenshots/ui-refresh/adresses.png`.

**Layout**
1. `PageHeader`: back → `/compte`, H1 "Mes adresses", subtitle "n adresse(s) enregistrée(s)", right gold `+` circle opening the sheet.
2. `AddressRow` list: coloured type square (`HOME` emerald `Home`, `WORK` blue `Briefcase`, `OTHER` amber `MapPin`), label + "Par défaut" amber star chip, address line, place chain "Commune · Ville · RD Congo", three 44 px icon buttons — star (set default), pencil (edit), red trash (delete via `ConfirmSheet`).
3. Empty: `EmptyState` with `MapPin`, CTA "Ajouter une adresse".
4. `AddressSheet`: bottom sheet (spring from y 100%, `rounded-t-3xl sm:rounded-3xl max-h-[90vh]`), 3-tile type selector, Destinataire input, `AddressAutocomplete` (04, Nominatim through `GET /geocode`) with GPS confirmation line, `LocationFields` (04, cascading `GET /places`), full-width primary "Enregistrer" / "Mettre à jour".

**Data**: `GET /addresses` (`queryKeys.addresses.list`), `POST /addresses`, `PATCH /addresses/:id` (also for `isDefault`), `DELETE /addresses/:id`. Invalidate `addresses.list`.

---

## `/compte`

**Files**: `app/compte/page.tsx` → `CompteClient.tsx`; `components/account/ProfileHeaderCard.tsx`, `PremiumStatusCard.tsx`, `QuickAccessGrid.tsx`, `ProfileForm.tsx`, `AccountSecurityCard.tsx`, `ProfilePhotoUploader.tsx`.
**Reference**: `screenshots/ui-refresh/compte.png`.

**Layout**
1. H1 "Mon compte" + subtitle.
2. `ProfileHeaderCard`: `rounded-3xl` white card with a 64 px emerald→teal cover, avatar 96 px overlapping (`ProfilePhotoUploader`: signed upload `purpose=avatar` then `POST /me/avatar`, 5 MB cap, JPEG/PNG/WebP), name H2, chips row (phone chip, role chip Prestataire emerald / Client muted, amber "Admin" chip), "Membre depuis <mois année>".
3. `PremiumStatusCard` (providers only): `Crown` square, tier label and `premiumUntil`, small primary "Premium" button → `/premium`.
4. `QuickAccessGrid` `grid-cols-2 sm:grid-cols-3`: role-aware — client: Avis, Mes commandes, Notifications, Aide, Mes adresses; provider: Mon espace, Revenus, Notifications, Aide, Vérification.
5. `ProfileForm` "Informations personnelles": Prénom, Nom, Ville (`LocationFields` city level), Pays select RDC/Congo, Genre select, Date de naissance, Bio textarea; primary Save → `PATCH /me/profile`. Phone is shown read-only (it is the OTP identity).
6. Client only: "Devenir prestataire" row — icon square, title, description, primary "Commencer" → `/prestataire/nouveau`.
7. `AccountSecurityCard` "Sécurité & contrôle": "Se déconnecter" secondary action → `supabase.auth.signOut()`; "Supprimer mon compte" red secondary action → `ConfirmSheet` with a typed "SUPPRIMER" confirmation → `DELETE /me` → `supabase.auth.signOut()` → `/`. Admins see the 409 message from the API.

**Data**: `AuthContext.user` (from `GET /me`), `PATCH /me/profile`, `POST /me/uploads/sign`, `POST /me/avatar`, `DELETE /me`. Invalidate `me`.

---

## `/messagerie`

**Files**: `app/messagerie/page.tsx` (server, metadata) → `MessagerieClient.tsx` (orchestrator ≤ 250 lines); `components/messaging/ConversationList.tsx`, `ConversationRow.tsx`, `Thread.tsx`, `ThreadHeader.tsx`, `MessageBubble.tsx`, `MessageAttachments.tsx`, `AttachmentBar.tsx`, `VoiceRecorder.tsx`, `Composer.tsx`, `useConversationPolling.ts`, `useSignedAttachment.ts`.
**Reference**: K-YOU inventory §10; no screenshot in `ui-refresh`.

**Layout, mobile 390**: one pane at a time. List when no `?c=`; thread when `?c=[id]` is set (URL is the state, back button returns to the list). Dock visible on the list, hidden on the thread so the composer sits at the bottom with safe-area padding.

**Layout, desktop 1440**: `max-w-5xl`, header row (gradient emerald→teal `rounded-2xl` `Mailbox` square + H1 "Messages" + subtitle), then a 12-column grid: list `col-span-5`, thread `col-span-7`.

**List**: `ConversationRow` — subject or counterpart name bold, relative time right, role tag chip + counterpart name, `lastPreview` at 70 % opacity, unread pill (`bg-primary` circle) when the viewer's unread > 0. Active row `border-primary/30 bg-primary/5`. "Voir plus" for page 2+. Empty: `EmptyState` with `Inbox` and "Rechercher" link.

**Thread**: `ThreadHeader` (back arrow on mobile, subject, "Prestataire : X" / "Client : Y", `SafetyActions` from 05 — Signaler / Bloquer), scrollable area with `MessageBubble`s (mine right `bg-primary text-primary-foreground`, theirs left `bg-muted` with sender name), each bubble renders `MessageAttachments` (image thumbnails opening a lightbox, audio `<audio controls>`) and a 10 px timestamp; `Composer` at the bottom: `AttachmentBar` above a rounded input and a primary Send button.

**Attachments**: `AttachmentBar` — image picker (JPEG/PNG/WebP ≤ 8 MB, up to 6) and `VoiceRecorder` (MediaRecorder, `audio/webm` when supported else `audio/mp4`, 2 min cap, waveform-free timer pill, cancel/confirm). Files upload through `POST /me/uploads/sign?purpose=attachments` then direct to the private bucket; the message body carries `{ kind, path, mime, bytes }`. Rendering uses `useSignedAttachment(path)` → `GET /me/media/sign-read?path=` cached for the URL lifetime (`staleTime` = expiry − 30 s).

**Polling**: `useConversationPolling` refetches the list and the open thread every 15 s while `document.visibilityState === "visible"`.

**Client tip**: below the thread for CLIENT viewers, `rounded-xl bg-primary/5` with `Lock` and the privacy tip copy.

**Data**
- `GET /conversations` (`queryKeys.conversations.list`).
- `GET /conversations/:id/messages?page=` (`queryKeys.conversations.messages(id)`); opening resets unread server-side, the list cache is patched optimistically.
- `POST /conversations/:id/messages`; optimistic append, patch `lastPreview`/`lastMessageAt`.
- `DELETE /conversations/:id/messages/:messageId` for own messages (long-press / hover menu).
- `POST /reports`, `POST /blocks` from `SafetyActions`.
- Starting a conversation happens on the profile page (05) via `POST /conversations`; `/messagerie?c=` receives the id.

**States**: list skeleton rows; thread skeleton bubbles; 403 (blocked) shows an inline notice "Cette conversation est bloquée" and disables the composer.

---

## Deletions

Delete after the new routes pass their checklist:

- `apps/web/src/app/bookings/**`, `apps/web/src/app/messages/**`, `apps/web/src/app/dashboard/client/**`, `apps/web/src/app/dashboard/settings/**`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/provider/**`, `apps/web/src/app/pro/page.tsx`, `apps/web/src/app/pro/ProviderDashboardClient.tsx`, `apps/web/src/app/pro/earnings/**`, `apps/web/src/app/pro/layout.tsx`.
- `apps/web/src/components/bookings/FinalOfferDialog.tsx`, `AccordCard.tsx`, `BookingHero.tsx`, `StepStrip.tsx`, `ActionsCard.tsx`, `DetailsCard.tsx`, `AddressRow.tsx`, `MobileStickyBar.tsx`, `bookingActions.ts`, `BookingDetail.tsx` (rebuilt as described).
- `apps/web/src/components/booking/MobileStickyBar.tsx` (the second copy).
- `apps/web/src/components/dashboard/**` (legacy barrel, `client/`, `provider/`).
- `apps/web/src/components/settings/**`.
- `apps/web/src/app/messages/MessagesClient.tsx` and the `.k-messages-*` rules in `globals.css`.
- `apps/web/src/lib/booking-v2.ts`.
- Redirects added in `next.config.ts` for one release: `/bookings` → `/mes-reservations`, `/bookings/:id` → `/reservation/:id`, `/messages` → `/messagerie`, `/pro` → `/mon-espace`, `/pro/earnings` → `/revenus`, `/dashboard/settings` → `/compte`, `/dashboard/client` → `/mes-reservations`.

## Acceptance criteria

- Every route renders at 320, 390 and 1440 px without horizontal overflow, with the dock on mobile and no footer.
- Role redirects match the guard matrix, both client-side and by direct URL entry.
- A provider can confirm, complete with an agreed price, and cancel with a reason; the ledger row appears on `/revenus` within one refetch.
- A client can cancel, see their received rating, and reach the review form for a completed booking.
- Messaging: image and voice attachments upload, render through signed URLs, and are blocked after a block.
- Notifications mark read on click and the dock badge clears.
- Account deletion removes the user and signs out; an admin gets the 409 message.
- No file in the owned folders exceeds 400 lines. No inline hex colours; tokens only.
- `pnpm --filter @kayu/web type-check` passes; old routes return 308 redirects.

## Verification commands

```sh
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm dev:web   # manual pass through the checklist at 390 and 1440 px with the seeded provider and client
```
