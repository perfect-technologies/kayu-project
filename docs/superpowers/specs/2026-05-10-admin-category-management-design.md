# Admin category management — design

**Date:** 2026-05-10
**Surface:** web admin dashboard (`/dashboard/admin`)
**Scope:** finish the category-management workstream that was deferred when the admin Categories tab first shipped — enable creating, editing, and deleting categories and their subcategories.

## Context

The admin Categories section currently renders a read-only grid of category cards with a yellow banner saying *"Création et édition de catégories à brancher dans une prochaine itération admin."* The backend already exposes full CRUD on categories (`GET/POST/PUT/DELETE /admin/categories`), but **no per-subcategory CRUD** — subcategories can only be created at category creation time. There is also no `GET /admin/categories/:id`.

This iteration adds the missing endpoints and a dedicated detail UI so an admin can:

1. Create a new category from the list.
2. Edit any category's full set of fields.
3. Add, edit, and delete subcategories under a category.
4. Delete a category from the list.

Image upload is **not** in scope (no Storage pipeline exists yet); the `image` field stays a URL string for now.

## Routes

New web routes under the existing admin shell:

- `/dashboard/admin/categories/[id]` — category detail page (two-column form).

The list view stays where it is (`/dashboard/admin` with the `categories` section selected). Creation happens via a modal triggered from the list, then navigates to the new id's detail page on success — there is no separate `/new` route.

## List view changes (existing `CategoriesSection` in `apps/web/src/app/dashboard/admin/page.tsx`)

- Each category card becomes clickable: clicking the card or its name navigates to `/dashboard/admin/categories/[id]`.
- A `+ Nouvelle catégorie` button is added at the top-right of the section header. It opens `NewCategoryModal`.
- Each card gets a small trash-icon affordance (top-right corner, next to the active/inactive chip). Clicking it opens `DeleteConfirmDialog`. On confirm, calls `deleteCategory`. On `400` "providers still attached", surfaces the count inline on the card.
- The yellow "à brancher" banner is removed.

## Detail page layout

Two columns under a breadcrumb (`Admin › Catégories › <name>`) and a back link.

```
┌─ Admin › Catégories › Plomberie ──────────────────────────────┐
│  ← Retour à la liste                                          │
├───────────────────────────┬───────────────────────────────────┤
│ DÉTAILS DE LA CATÉGORIE   │ SOUS-CATÉGORIES         [+ Ajouter]│
│ Nom *      [__________]   │ ┌──────────────────────────────┐ │
│ Slug *     [__________]   │ │ Dépannage      /depannage   │ │
│ Description[__________]   │ │ Description...              │ │
│ Icône      [__________]   │ │           [Save] [Delete]   │ │
│ Image URL  [__________]   │ └──────────────────────────────┘ │
│ Couleur    [_______] ▣    │ ┌──────────────────────────────┐ │
│ Ordre      [___]          │ │ Installation   /installation│ │
│ Active     [✓]            │ │           [Save] [Delete]   │ │
│ [Enregistrer la catégorie]│ └──────────────────────────────┘ │
│ [Supprimer la catégorie]  │                                   │
└───────────────────────────┴───────────────────────────────────┘
```

**Left column (category form):** `name *`, `slug *` (auto-derived from name, editable), `description`, `icon` (string — lucide name), `image` (URL string), `color` (hex with swatch preview), `order` (number), `isActive` (toggle). One `Enregistrer la catégorie` button at the bottom of the column. Below it, a destructive `Supprimer la catégorie` button (confirm dialog).

**Right column (subcategories):** header with `+ Ajouter`. One row per subcategory in `order asc, name asc`. Each row is its own form unit with `name`, `slug`, `description`, `icon`, `order`, `isActive`, plus per-row `Enregistrer` and `Supprimer`. Clicking `+ Ajouter` inserts a draft row at the top; saving creates it, cancelling discards it.

**Empty subcategory state:** helper text + a ghost `+ Ajouter une sous-catégorie` button centred in the column.

**Responsive:** below the `lg` breakpoint the columns stack (form on top, subcategories below). The admin surface is desktop-first, so this is a graceful fallback only.

## Save behaviour

- Two scoped saves. Left column saves the category alone. Each subcategory row saves itself.
- Save buttons are disabled when no field in their scope is dirty.
- Slug auto-derives from name (kebab-case, accents stripped) **only in create flows** (`NewCategoryModal` and draft `SubcategoryRow`), and only while the slug field has not been manually edited in that instance. On the detail page (existing category) and on persisted subcategory rows, the slug field never auto-derives — changing the name leaves the slug alone.
- Toggling `isActive` is a dirty change and requires explicit save — no auto-commit.
- Draft subcategory rows can be cancelled before their first save.
- No optimistic updates in v1: rows show an inline spinner on save and stay in their pre-save state until the server confirms.

## Component & file structure

```
apps/web/src/app/dashboard/admin/categories/
├── [id]/
│   ├── page.tsx                       # Server shell, reads id, renders client
│   └── CategoryDetailClient.tsx       # Two-column form, owns React Query state
└── _components/
    ├── CategoryForm.tsx               # Left column form (controlled, dirty tracking)
    ├── SubcategoryList.tsx            # Right column container (list + add button)
    ├── SubcategoryRow.tsx             # One row, draft or persisted
    ├── NewCategoryModal.tsx           # Triggered from the list
    ├── DeleteConfirmDialog.tsx        # Shared confirm for category and subcategory
    └── slug.ts                        # name -> slug utility (kebab-case, strip accents)
```

**Updated files:**

- `apps/web/src/app/dashboard/admin/page.tsx` — `CategoriesSection` updated per "List view changes" above.
- `packages/api/src/endpoints.ts` — extend `adminApi` with `getCategory(id)`, `createSubcategory`, `updateSubcategory`, `deleteSubcategory(id)`.
- `packages/api/src/query-keys.ts` — add `admin.category(id)`.
- `packages/schemas/src/dto.ts` — add `CreateSubcategoryDto`, `UpdateSubcategoryDto` (and inferred types). `UpdateCategoryDto` already covers the editable fields.

**Component responsibilities:**

- `CategoryDetailClient` — single `useQuery(['admin', 'category', id])` for `getCategory(id)`. Owns all mutations and orchestrates invalidations. Pure orchestration, no presentation.
- `CategoryForm` — controlled inputs, dirty tracking, slug auto-derive, swatch preview for color. Receives `initialValues` and `onSubmit`.
- `SubcategoryRow` — draft mode (no id) and persisted mode (with id). Same dirty-tracking pattern.
- `NewCategoryModal` — name + slug only; submits create then navigates to the new id's detail page.

## Backend changes

**New endpoints in `apps/backend/src/modules/admin/admin.controller.ts` + `admin.service.ts`:**

```
GET    /admin/categories/:id              → one category with subcategories + stats
POST   /admin/categories/subcategories    → create one subcategory
PUT    /admin/categories/subcategories    → update one subcategory
DELETE /admin/categories/subcategories?id=…  → delete one subcategory
```

The existing `GET/POST/PUT/DELETE /admin/categories` endpoints are unchanged. The PUT already maps `description, icon, image, color, order, isActive` — no service change there.

**New service methods on `AdminService`:**

- `getCategory(id)` — loads one category by id with subcategories ordered `order asc, name asc` and the same `stats` shape (provider count, subcategory count) as the list. Throws `NotFoundException` when missing.
- `createSubcategory(actor, body, ip)` — validates the parent category exists, runs slug uniqueness check (per-row variant of `ensureSubcategorySlugsAvailable`), inserts, logs `CREATE_SUBCATEGORY` activity.
- `updateSubcategory(actor, body, ip)` — validates the subcategory exists, slug uniqueness check excluding the current id, updates, logs `UPDATE_SUBCATEGORY`.
- `deleteSubcategory(actor, id, ip)` — counts `providerSubcategory` rows for the id; if > 0, throws `BadRequestException` with the count (mirrors the existing `deleteCategory` guard). Otherwise hard-deletes and logs `DELETE_SUBCATEGORY`.

**New schemas in `packages/schemas/src/dto.ts`:**

```ts
export const CreateSubcategoryDto = z.object({
  categoryId: IdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateSubcategoryDto = CreateSubcategoryDto.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
});
```

Both types are also exported via `z.infer`.

**Auth:** the new endpoints reuse the same admin guard the existing category routes use in `admin.controller.ts` (we follow the file's prevailing decorator pattern verbatim).

**Activity log:** the action strings `CREATE_SUBCATEGORY`, `UPDATE_SUBCATEGORY`, `DELETE_SUBCATEGORY`, mirroring the existing category audit entries.

## Data flow

**Reads:**

- Detail page mounts → `useQuery(['admin', 'category', id])` calls `GET /admin/categories/:id` → seeds `CategoryForm` and `SubcategoryList`.
- The list view continues to use `useQuery(queryKeys.admin.categories)` for `GET /admin/categories`.

**Writes — each mutation invalidates two query keys on success:**

- the relevant detail `['admin', 'category', id]`
- the list `queryKeys.admin.categories` (so card counts/state stay in sync)

**Navigation after side-effects:**

- `createCategory` success → close modal → `router.push('/dashboard/admin/categories/<new-id>')`.
- `deleteCategory` success → toast → `router.push('/dashboard/admin?section=categories')`.

## Error handling

All mutations surface errors via the existing admin toast pattern **and** an inline error message below the relevant save button. Specific cases:

- Slug conflict (`409` or "slug already exists") → focus the slug field and show "Ce slug est déjà utilisé".
- Delete-category blocked (`400` "providers attached") → "Impossible de supprimer : N pros encore associés." with N parsed from the message.
- Delete-subcategory blocked (`400` "providers using this subcategory") → same pattern, scoped to the row.
- Network / 5xx → "Une erreur est survenue, réessayez."

**Loading / empty / 404:**

- Detail page initial load: skeleton mirroring the two columns.
- Subcategory list empty: helper text + ghost `+ Ajouter une sous-catégorie` button.
- Detail page id not found: inline `EmptyOpsState` with a back-to-list link.

## Testing

**Backend (`apps/backend/src/modules/admin/admin.service.spec.ts`, using `node:test` + `node:assert/strict` and hand-rolled Prisma fakes — same pattern as the existing tests in that file):**

- `getCategory` returns 404 when missing; returns subcategories sorted `order asc, name asc`; includes the right `stats` shape.
- `createSubcategory` happy path; rejects when parent missing; rejects on slug collision; writes activity log.
- `updateSubcategory` happy path; slug uniqueness excludes the current id (saving the same slug back is fine); rejects on missing id; writes activity log.
- `deleteSubcategory` happy path; rejects with `BadRequestException` when `providerSubcategory.count > 0`; writes activity log.
- `updateCategory` round-trip on the new editable fields (`description/icon/image/color/order/isActive`) if not already covered.

**Frontend:** the web app has no test runner today (no Jest/Vitest/RTL). Setting one up is a separate workstream — out of scope here. We rely on `pnpm --filter @kayu/web type-check` plus a manual smoke checklist.

**Pre-merge verification:**

- `pnpm --filter @kayu/schemas type-check && pnpm --filter @kayu/schemas build` (downstream packages depend on this).
- `pnpm --filter @kayu/api type-check && pnpm --filter @kayu/api build`.
- `pnpm --filter @kayu/backend test:launch` green (the existing script that runs `admin.service.spec.ts` among others).
- `pnpm --filter @kayu/backend type-check`.
- `pnpm --filter @kayu/web type-check`.
- Manual smoke: list → `+ Nouvelle catégorie` modal → detail page → edit each field → save → add 2 subcategories → edit one → delete one → delete the category (expect blocked when providers attached, allowed when not).

## Out of scope (explicit non-goals)

- Image upload / Storage pipeline. `image` stays a URL string. A separate workstream will add real upload.
- Drag-to-reorder for categories or subcategories. Ordering is via the numeric `order` field on the form.
- Soft delete. Categories and subcategories hard-delete (with the existing provider-attachment guard).
- Bulk operations (import, multi-select delete).
- Mobile admin. The admin dashboard is desktop-first and not exposed on mobile.
- Optimistic updates / undo on mutations.
