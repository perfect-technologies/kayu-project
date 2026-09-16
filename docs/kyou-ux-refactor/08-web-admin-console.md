# 08 - Web Admin Console

## Objective

Replace `/dashboard/admin/**` with a single `/admin` route that renders the K-YOU control-room disposition inside the shared `Layout`: a left rail of sections on desktop, a scrolling tab bar on mobile, and one small file per section. Every section reads and writes only the admin endpoints of workstream 02 and keeps KAYOU's KYC verification queue.

## Severity

P1. Needed before the closed beta operates, not before the public screens ship.

## Owns

- `apps/web/src/app/admin/layout.tsx` (server guard)
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/AdminConsole.tsx` (client orchestrator)
- `apps/web/src/app/admin/_sections/*.tsx` (one file per section)
- `apps/web/src/app/admin/_components/*.tsx` (admin-only primitives)
- `apps/web/src/app/admin/_components/categories/*` (moved from `dashboard/admin/categories/_components`)
- `apps/web/src/app/admin/print.css` (member CV print stylesheet)
- `apps/web/src/copy/admin.ts`

## In scope

- Thirteen K-YOU sections plus the KYC verification section.
- Server-side admin guard.
- Printable member sheet through a print stylesheet.
- Three-level category editor.
- Places and lists curation with suggestions and merge.

## Out of scope

- Admin MFA or external identity provider.
- Any public or provider screen.
- Analytics beyond the overview counters.

## Guard

`app/admin/layout.tsx` is a server component:

1. `createSupabaseServerClient()` → `getSession()`; no session → `redirect("/login?returnTo=/admin")`.
2. `createAuthenticatedServerApiClient()` → `GET /me`; `role !== "ADMIN"` → `redirect("/")`; suspended → the shared suspended screen.
3. Renders `<Layout>` children. The client orchestrator still reads `AuthContext` and renders nothing while auth resolves, so navigation between tabs never flashes.

This replaces the client-only `useEffect` guard in `dashboard/admin/layout.tsx`. The API enforces `@Roles("ADMIN")` on every admin route regardless.

## Shell

**Reference**: `screenshots/admin-desktop.png`, `screenshots/admin-mobile.png`.

- Page canvas `bg-[#F4F6F3]` (token `admin-canvas`), `max-w-[1500px] lg:flex`, rendered inside the shared `Layout` so the navbar and dock remain.
- `AdminRail`: on `lg` a 230 px column with a right border and `min-height: 85dvh`; a brand block (`bg-primary rounded-2xl` `ShieldCheck` square, "KAYOU ADMIN", "L'ESPACE DE PILOTAGE" in 10 px `tracking-[.18em]`, desktop only) and one `AdminNavButton` per section (12 px, 650 weight, `rounded-[13px]`, active = `bg-primary text-white` with soft shadow and trailing `ChevronRight` on desktop). Below `lg` the rail becomes a horizontally scrolling top bar with a bottom border and no brand block.
- `AdminHeader`: breadcrumb "Centre de contrôle / <section>", "Bonjour, administrateur.", and an "Accès sécurisé" emerald pill on `sm+`.
- Active section is `?tab=` in the URL (default `overview`), read with `useSearchParams` inside `<Suspense>`. Section swap is a `motion.div` keyed on the tab: fade + 10 px rise over 0.2 s, disabled under reduced motion.

Sections in order and their `?tab=` keys:

| Key | Label | File |
| --- | --- | --- |
| `overview` | Vue d'ensemble | `_sections/Overview.tsx` |
| `users` | Communauté | `_sections/Users.tsx` + `_sections/UserSheet.tsx` |
| `providers` | Talents | `_sections/Providers.tsx` |
| `verification` | Vérification | `_sections/Verification.tsx` |
| `bookings` | Réservations | `_sections/Bookings.tsx` |
| `reviews` | Avis | `_sections/Reviews.tsx` |
| `conversations` | Conversations | `_sections/Conversations.tsx` |
| `contacts` | Contact | `_sections/Contacts.tsx` |
| `reports` | Modération | `_sections/Reports.tsx` |
| `content` | Contenu | `_sections/Content.tsx` |
| `categories` | Catégories | `_sections/Categories.tsx` |
| `references` | Listes & lieux | `_sections/References.tsx` + `_sections/Places.tsx` + `_sections/Lists.tsx` |
| `audit` | Journal | `_sections/Audit.tsx` |
| `system` | Système | `_sections/System.tsx` |

## Admin primitives (`_components/`)

| Component | Purpose |
| --- | --- |
| `AdminRail`, `AdminNavButton` | Section navigation as above. |
| `AdminHeader` | Breadcrumb + greeting + secure pill. |
| `AdminTable` | Responsive table: real `<table>` on `md+`, stacked cards below. Props: columns, rows, `renderRow`, pagination (`page`, `total`, `limit`, `onPage`), `toolbar` slot. |
| `SearchBox` | Debounced 300 ms input with `Search` icon, mirrors to `?q=`. |
| `MetricCard` | Shared from 04; admin uses the `rounded-[22px]` variant. |
| `StatusPill` | Shared from 04, with extra admin variants `NEW`, `READ`, `REPLIED`, `CLOSED`, `OPEN`, `RESOLVED`, `PENDING`, `APPROVED`, `REJECTED`, `UNDER_REVIEW`, `VERIFIED`. |
| `ConfirmAction` | Button that opens `ConfirmSheet` (04) with title, body, optional reason textarea (required flag), destructive flag. |
| `EmptyState` | Shared from 04, `.empty-state` variant. |
| `ToggleRow` | Full-width bordered row with a label, description and an iOS-style switch. |
| `SplitPane` | 5/7 column list + detail with mobile swap driven by `?id=`. |
| `CommandHero` | The dark emerald "K-YOU · CONTROL ROOM" panel with the orbit ring (hidden under 600 px). |

All lists use TanStack Query with `queryKeys.admin.*`; mutations invalidate their list and `admin.overview`. Every mutation shows a toast. Every destructive action goes through `ConfirmAction`.

## Sections

### Overview

`CommandHero` ("Une vue claire. Un impact réel.", subtitle), then four `MetricCard`s in a responsive grid: Membres (`users.total`, sub "n suspendus"), Talents (`providers`), Réservations (`bookings`), Signalements (`openReports`); a second row of two smaller cards: Propositions de lieux (`pendingSuggestions`), Vérifications en attente (`pendingVerifications`), each linking to its tab. Then the explanatory white card. Data: `GET /admin/overview`.

### Users (Communauté)

Toolbar: `SearchBox` (nom, e-mail, téléphone, lieu), `role` select (Tous / Client / Prestataire / Admin), `suspended` select. `AdminTable` 50 per page from `GET /admin/users?q&role&suspended&page`. Columns: avatar + name + phone/e-mail; role chip; **role toggle** (Client ⇄ Admin via `PATCH /admin/users/:id { role }`); place; inscrit le; **suspend toggle** (`PATCH { suspended, suspendedReason }`, reason required through `ConfirmAction`); "Voir" opening `UserSheet`. Self row: toggles disabled with a tooltip. API 409 on last-admin → toast with the message. Providers whose user is suspended are hidden automatically by the backend; the row shows a muted "masqué" note.

`UserSheet` (a right-side sheet on desktop, full-screen sheet on mobile) renders the member sheet from `GET /admin/users/:id/cv`: emerald banner, dark sidebar (photo, name, category label, tier badge, phone / e-mail / place / member-since rows, chips for role, admin, verified), right column sections: À propos, Localisation & activité (phone, WhatsApp, place chain, address, schedule summary, verified), Activité (bookings count by status, reviews given/received, last login), Sécurité (suspended state and reason). A "Imprimer / PDF" outline button calls `window.print()`.

**Print decision**: use a print stylesheet (`admin/print.css`, loaded with `media="print"`) that hides everything except `#member-sheet`, sets A4 margins and forces backgrounds. **Do not keep `html2canvas` and `jspdf`**: they add ~600 KB gzip to the bundle for a screenshot-quality export, and the browser's "Save as PDF" produces a selectable, accessible document from the same markup. Remove both from `apps/web/package.json`.

### Providers (Talents)

Toolbar: `SearchBox`, `verificationStatus` select, `premiumTier` select, `hidden` select. Two-column cards, 30 per page from `GET /admin/providers`. Card: avatar, display name (links to `/prestataire/[id]`), place · category chain, `StatusPill` for verification and tier, then actions: **Vérifier / Retirer la vérification** (`PATCH /admin/providers/:id { verificationStatus }` — the backend applies its document rules and may 400 when required docs are missing; show the message), **Masquer / Publier** (`{ hidden }`), tier select (`FREE | VERIFIED | BOOSTED | ELITE`) with a date picker for `premiumUntil` inside a small popover, saved on change.

### Verification (kept)

`SplitPane` over `GET /admin/verification/submissions` (status filter UNDER_REVIEW default). List row: provider name, submitted at, progress "3/4 approuvés". Detail: document rows (`ID_FRONT`, `ID_BACK`, `SELFIE`, `ADDRESS`, `CERT_OPTIONAL`) each with a thumbnail loaded through `GET /me/media/sign-read?path=` (admins pass the ownership check), file meta, and Approve / Reject (`PUT /admin/verification/documents { id, decision, rejectionReason }`, reason required on reject). The aggregate status pill updates from the response. Restyled only; behaviour matches today.

### Bookings (Réservations)

Toolbar: `SearchBox` (client, prestataire, téléphone), status select. `AdminTable` from `GET /admin/bookings`. Columns: client (name + phone), prestataire, date · heure (in the booking timezone), `StatusPill`, **Annuler** (`ConfirmAction` with required reason → `POST /admin/bookings/:id/cancel`) for PENDING/CONFIRMED rows. Row click opens `/reservation/[id]` in a new tab.

### Reviews (Avis)

Toolbar: `SearchBox` (auteur, prestataire, commentaire), rating select 5→1. Cards from `GET /admin/reviews`: author, "Sur <provider> · <date>", `StarRating` (04), comment, provider reply if any, and actions **Masquer / Publier** (`PATCH /admin/reviews/:id { isPublic }`) and **Supprimer** (`ConfirmAction` → `DELETE /admin/reviews/:id`; the backend recomputes aggregates, no client-side recalculation call).

### Conversations

`SplitPane`: list from `GET /admin/conversations?q` (subject, last message time, "Client : … · Prestataire : …", preview) with a per-conversation **Supprimer** (`DELETE /admin/conversations/:id`); detail from `GET /admin/conversations/:id/messages` rendering every message (sender name + role, body, attachment names as links through signed read) with a hover/long-press delete (`DELETE /admin/messages/:id`).

### Contacts (Contact)

`SplitPane` over `GET /admin/contacts?q&status`. List rows show name, subject, relative time and `StatusPill` (NEW/READ/REPLIED/CLOSED). Opening a NEW item sends `PATCH { status: READ }`. Detail: name, `mailto:` and `tel:` links, subject, message body, actions **Marquer répondu**, **Fermer**, **Supprimer** (`ConfirmAction`).

### Reports (Modération)

Title "Confiance & sécurité". Cards from `GET /admin/reports?status=OPEN` (toggle to show resolved): `targetKind · status`, date, reason, reporter name, a "Voir la cible" link resolved by kind (`/prestataire/[id]`, `/reservation/[id]`, conversation in the Conversations tab, user in `UserSheet`), and **Marquer comme examiné** (`ConfirmAction` with optional resolution text → `PATCH /admin/reports/:id { status: RESOLVED, resolution }`). Empty: `EmptyState` "Aucun signalement ouvert".

### Content (Contenu)

One form bound to `GET /admin/settings` / `PUT /admin/settings`, grouped in white cards: **Section Hero** (`hero_title`, `hero_subtitle`, `hero_cta`, `tagline`), **Comment ça marche** (`how1..3_title`, `how1..3_desc`), **Section mise en avant** (`premium_title`, `premium_subtitle`), **Coordonnées** (`contact_phone`, `contact_email`, `contact_website`), **Fonctionnalités activées** (`ToggleRow` for `feat_booking`, `feat_reviews`, `feat_whatsapp`, `contacts_require_premium`), **Mode maintenance** (`ToggleRow` `maintenance_mode` + `maintenance_message`). Save button is the emerald→teal pill that turns into a check for 1.5 s on success. Empty string means "use the default copy" and the helper text says so.

### Categories (Catégories)

Three-level tree editor. Left: category list (`AdminCategoriesList`, moved and restyled) with active toggle, order, colour swatch, icon (`LucideIconPicker` moved). Selecting a category shows its subcategories; selecting a level-2 subcategory shows its children. Create/edit through `NewCategoryModal` and a new `SubcategoryForm` (name, slug auto from `slug.ts`, icon, order, active, parent). Deactivate/delete are `ConfirmAction`s; the backend refuses when providers, bookings or leads reference the node and the toast shows the reference counts. Data: `GET /admin/categories`, `GET /admin/categories/:id`, `POST/PATCH/DELETE /admin/categories(/:id)`, `POST/PATCH/DELETE /admin/subcategories(/:id)`.

### References (Listes & lieux)

A primary-coloured panel header, then two sub-tabs persisted as `?sub=places|lists`.

**Places** (`_sections/Places.tsx`): top section "Propositions à valider (n)" from `GET /admin/places/suggestions?status=PENDING` with Examiner (opens the form prefilled) and Refuser (`POST …/reject`); Approve from the form (`POST …/approve` after optional edits). Left form: kind select (Pays, Province, Ville, Territoire, Commune, Secteur, Chefferie, Quartier, Village), parent picker (cascading `GET /places?kind&parentId`), Libellé, Source, aliases (comma-separated), Actif switch, coordinates optional; saves via `POST /admin/places` or `PATCH /admin/places/:id`. **Fusionner** control: from-item and into-item pickers filtered to the same kind and parent → `POST /admin/places/merge`; the API refuses when the source has children and the toast explains "réconciliez ses subdivisions d'abord". Right: searchable list (100 max) with kind chips, inactive items dimmed, merged items showing "→ <target>".

**Lists** (`_sections/Lists.tsx`): same layout for `ReferenceItem` with type select (Langue, Mode d'intervention, Devise, Unité de prix, Compétence), optional category scope for skills, "Proposé dans les formulaires" switch (`suggested`), aliases, merge. Data: `GET /references?type` (includes inactive when `?all=1` for admins), `POST/PATCH /admin/references(/:id)`, `POST /admin/references/merge`.

Every write invalidates `queryKeys.places.*` and `queryKeys.references.*` so the public pickers refresh.

### Audit (Journal)

`AdminTable` read-only from `GET /admin/audit`: Action, Auteur, Cible (entityType + id, linked when resolvable), Date. Metadata JSON expands in a `<details>` row.

### System (Système)

Two-column grid of `MetricCard`s from `GET /admin/health`: Base de données, Stockage, E-mail, Version, plus the current `KAYOU_PUBLIC_WEB_MODE` and Node version reported by the API.

## File split rule

No file in `app/admin/` exceeds 400 lines. `AdminConsole.tsx` only maps `?tab=` to a section component. Each section owns its queries, toolbar and rows. Shared row components (`UserRow`, `ProviderCard`, `BookingRow`, `ReviewCard`, `ContactRow`, `ReportCard`, `PlaceRow`, `ReferenceRow`) live next to their section file when they exceed ~80 lines.

## Deletions

- `apps/web/src/app/dashboard/admin/page.tsx` (2437 lines), `apps/web/src/app/dashboard/admin/layout.tsx`, `apps/web/src/app/dashboard/admin/categories/[id]/**`.
- `apps/web/src/app/dashboard/admin/categories/_components/*` → **moved** to `apps/web/src/app/admin/_components/categories/` and restyled, not deleted.
- `apps/web/src/app/admin/page.tsx` (the 5-line redirect) is replaced by the new console.
- `apps/web/src/app/dashboard/layout.tsx` once 07 has removed the other dashboard routes.
- `html2canvas`, `jspdf` are not added; if any earlier branch added them, remove.
- Redirects for one release: `/dashboard/admin` → `/admin`, `/dashboard/admin?tab=X` → `/admin?tab=X` (moderation → users, disputes → reports, payouts → overview).

## Acceptance criteria

- Direct navigation to `/admin` as anonymous redirects to login; as CLIENT or PROVIDER redirects to `/`; as ADMIN renders without a flash.
- Every section lists, searches, paginates and mutates through the documented endpoints; toasts on success and on API errors with the server message.
- Self-demotion, self-suspension and last-admin removal are blocked in the UI and confirmed blocked by the API (409 shown).
- Member sheet prints to a single A4 page from the browser dialog.
- Category editor creates a level-3 subcategory and refuses to delete a referenced node with the counts in the toast.
- Place merge repoints a seeded provider and the public picker no longer lists the merged source.
- Rail collapses to a scrolling tab bar at 390 px; no section overflows at 320 px.
- No file over 400 lines in `app/admin/`; `pnpm --filter @kayu/web type-check` passes.

## Verification commands

```sh
pnpm --filter @kayu/web type-check
pnpm --filter @kayu/web build
pnpm dev:web   # sign in as admin@kayou.cd, walk every tab at 390 and 1440 px
```
