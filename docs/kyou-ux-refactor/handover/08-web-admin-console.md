# 08 → 10: admin console as implemented

Workstream 08 replaced the admin placeholder with the K-YOU control room on `refactor/kyou-ux`. Decisions are logged in `PROGRESS.md` (rows prefixed "(08)"). This file lists the sections, the actions the smoke exercises, and what 10 reuses.

## Route and guard

| Piece | File | Notes |
| --- | --- | --- |
| Server guard | `(shell)/admin/layout.tsx` | `getSession()` → none → `/login?returnTo=/admin`; `GET /me` → role ≠ ADMIN → `/`; 403 `ACCOUNT_SUSPENDED` → `SuspendedScreen`; backend unreachable → children (the client guard and the API take over). Imports `print.css` |
| Page | `(shell)/admin/page.tsx` | Passes `{ webMode: KAYOU_PUBLIC_WEB_MODE, nodeVersion: process.version }` to the System section |
| Orchestrator | `AdminConsole.tsx` | Renders nothing until `useAuth().status === "ready"` with an ADMIN user; `?tab=` (default `overview`, legacy `moderation|disputes|payouts` mapped) → section; fade + 10 px rise over 0.2 s, off under reduced motion |
| Sections | `sections.ts` | `SECTIONS` (key, label, icon, Component) in rail order; `resolveSection(tab)` |

URL state: `?tab`, `?q` (search, debounced 300 ms), `?page`, `?id` (open item: member sheet, KYC submission, conversation, contact), `?sub=places|lists`. Select filters are local state and reset with the tab. Changing tab through the rail drops every other parameter.

## Sections and their endpoints

| `?tab=` | Reads | Writes |
| --- | --- | --- |
| `overview` | `GET /admin/overview` | — |
| `users` | `GET /admin/users?q&role&suspended&page&limit=50`, `GET /admin/users/:id/cv` (`?id=`) | `PATCH /admin/users/:id { role }` (Client ⇄ Admin, disabled for providers and for the signed-in admin), `{ suspended: true, suspendedReason }` (reason required), `{ suspended: false, suspendedReason: null }` |
| `providers` | `GET /admin/providers?q&verificationStatus&premiumTier&hidden&page&limit=30` | `PATCH /admin/providers/:id { verificationStatus: VERIFIED \| PENDING }`, `{ hidden }`, `{ premiumTier, premiumUntil }` (saved on change from the tier popover) |
| `verification` | `GET /admin/verification/submissions?status&q&page&limit=20` (default `UNDER_REVIEW`), `GET /me/media/sign-read?path=` per document | `PUT /admin/verification/documents { providerId, docId, decision, rejectionReason }` |
| `bookings` | `GET /admin/bookings?q&status&page&limit=50` | `POST /admin/bookings/:id/cancel { reason }` (PENDING / CONFIRMED rows); "Voir" opens `/reservation/[id]` in a new tab |
| `reviews` | `GET /admin/reviews?q&rating&page&limit=50` | `PATCH /admin/reviews/:id { isPublic }`, `DELETE /admin/reviews/:id` |
| `conversations` | `GET /admin/conversations?q&page&limit=50`, `GET /admin/conversations/:id/messages?limit=100` (`?id=`), signed reads for attachments | `DELETE /admin/conversations/:id`, `DELETE /admin/messages/:id` |
| `contacts` | `GET /admin/contacts?q&status&page&limit=50` | `PATCH /admin/contacts/:id { status }` (`READ` automatically when a NEW item opens; `REPLIED`, `CLOSED`, reopen → `READ`), `DELETE /admin/contacts/:id` |
| `reports` | `GET /admin/reports?status=OPEN|RESOLVED&page&limit=50` | `PATCH /admin/reports/:id { status: RESOLVED, resolution }` (resolution required). "Voir la cible": PROVIDER → `/prestataire/[id]`, USER → `?tab=users&id=`, CONVERSATION → `?tab=conversations&id=`, REVIEW → `?tab=reviews&q=<label>` |
| `content` | `GET /admin/settings` | `PUT /admin/settings` with only the changed keys; invalidates `settings.public` |
| `categories` | `GET /admin/categories` (tree) | `POST/PATCH/DELETE /admin/categories(/:id)`, `POST/PATCH/DELETE /admin/subcategories(/:id)` (`parentId` set → level 3); active toggle is a `PATCH { isActive }` |
| `references` (`sub=places`) | `GET /admin/places/suggestions?status=PENDING&limit=50`, `GET /admin/places?q&kind&limit=100`, `GET /admin/places/:id` (edit), `GET /admin/places?kind&parentId&active=true` (merge candidates), `GET /places` (parent cascade) | `POST /admin/places`, `PATCH /admin/places/:id`, `POST /admin/places/suggestions/:id/approve` (+ `PATCH` of the resolved place when the form was edited), `…/reject`, `POST /admin/places/merge` |
| `references` (`sub=lists`) | `GET /admin/references?q&type&limit=100`, `GET /categories/tree` (skill scope) | `POST /admin/references`, `PATCH /admin/references/:id`, `POST /admin/references/merge` |
| `audit` | `GET /admin/audit` | — |
| `system` | `GET /admin/health` | — |

Every mutation goes through `useAdminMutation`: success toast, error toast with the backend message (`adminErrorMessage` appends the `REFERENCED` counts and the `DOCS_MISSING` kinds), invalidation of the section keys plus `admin.overview` and `admin.audit`. Place and reference writes also invalidate `["places"]` and `["references"]` so the public pickers refresh. Destructive actions and every reason-bearing action go through `ConfirmAction` (a `ConfirmSheet` with an optional required textarea).

## Locks reflected in the UI

- The signed-in admin's own row: role and suspend buttons disabled with the tooltip "Vous ne pouvez pas modifier votre propre compte." (the API answers 400 `SELF_ACTION`).
- Users with a provider row (or role PROVIDER): role toggle disabled, tooltip "Le rôle d'un prestataire ne change pas ici." (API 409 `ROLE_CHANGE_NOT_ALLOWED`).
- Last-admin demotion or suspension: allowed in the UI on another admin; the API's 409 `LAST_ADMIN` is shown inline in the sheet and as a toast.
- Merged places and references: the merge button is disabled; rows are dimmed and show "→ target".

## Printable member sheet

`UserSheet` (Radix `Sheet`, right side, full width under `sm`) loads `GET /admin/users/:id/cv` and renders `MemberSheet` as `#member-sheet`. "Imprimer / PDF" calls `window.print()`; `print.css` hides everything else, sets A4 with 10 mm margins, forces colours and lays the sidebar and detail column side by side. Verified with `page.emulateMedia({ media: "print" })`: the shell header is hidden and the sheet visible.

## Admin primitives (`(shell)/admin/_components/`)

`AdminHeader`, `AdminTable` (table on `md+`, cards below; `cells`, optional `card`, `toolbar`, `pagination`, loading / error / empty), `Pagination`, `SearchBox` (`?q=`), `FilterSelect`, `AdminStatusPill` (booking, contact, report, verification, suggestion, tier, role, HIDDEN / SUSPENDED / ACTIVE…), `ConfirmAction`, `ToggleRow`, `SplitPane` (5/7 with the `?id=` mobile swap), `CommandHero`, `QueryState`, `SectionTitle`, `useAdminParams`, `useAdminMutation`, `admin-errors.ts`, `format.ts`; `categories/`: `AdminCategoriesList`, `LucideIconView`, `LucideIconPicker` (built on `icons` from `lucide-react`), `NewCategoryModal`, `SubcategoryForm`, `slugify`.

## Smoke (`apps/web/scripts/admin-smoke.mjs`)

```sh
cd apps/web && PW_CHANNEL=chrome node scripts/admin-smoke.mjs --shots ../../docs/kyou-ux-refactor/screenshots/08
cd apps/web && REDUCED=1 PW_CHANNEL=chrome node scripts/admin-smoke.mjs --only render
```

Needs the dev servers on :3000 / :3001 and the demo accounts (`admin@kayou.cd`, `paul.kabasele@email.cd`, `Password123!`). Checks: the guard and the six 308 rows; every tab at 320 / 390 / 1440 (greeting, active rail item, no overflow, screenshots); users search, self locks, `SELF_ACTION`, member sheet + print media; provider verify without documents (`DOCS_MISSING` message); level-3 create + delete and the referenced-delete counts; a throwaway quartier merged through the UI and gone from the public picker; contact NEW → READ (restored); journal rows; System cards; the KYC queue (empty on the seed). It leaves inactive `Smoke Q …` places and journal rows behind.

## Verification

```sh
pnpm --filter @kayu/web type-check
NODE_ENV=production pnpm --filter @kayu/web build
curl -sI "http://localhost:3000/dashboard/admin?tab=moderation" | grep -i location   # /admin?tab=users
curl -sI http://localhost:3000/admin | grep -i location                            # /login?returnTo=%2Fadmin
```
