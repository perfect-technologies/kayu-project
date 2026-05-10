# Admin Category Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship category and subcategory CRUD for the admin dashboard — list view gets create/delete affordances, and a dedicated detail page lets admins edit a category and manage its subcategories.

**Architecture:** Add subcategory CRUD endpoints to the existing `AdminController`/`AdminService` (the file already owns category endpoints). Reuse existing slug-uniqueness helpers, activity-log helper, and the global `BadRequestException`/`NotFoundException` patterns. On the web app, add a new route `/dashboard/admin/categories/[id]` plus a small set of presentational components under `_components/`. The current admin tab in `/dashboard/admin/page.tsx` becomes interactive (clickable cards, `+ Nouvelle catégorie` button, per-card delete confirm) — it's not rewritten.

**Tech Stack:**
- Backend: NestJS + Prisma (`@prisma/client`), validation via `LazyZodValidationPipe` + `@kayu/schemas`. Tests via `node:test` + `node:assert/strict` with hand-rolled Prisma fakes.
- Frontend: Next.js App Router, React Query (`@tanstack/react-query`), `sonner` toasts, Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`) — already in deps.
- Shared: `@kayu/schemas` (Zod DTOs), `@kayu/api` (typed HTTP client + query keys).

**Spec:** `docs/superpowers/specs/2026-05-10-admin-category-management-design.md`

---

## File Structure

**Schemas package — `packages/schemas/src/dto.ts`** (modify)
- Add `CreateSubcategoryDto`, `UpdateSubcategoryDto` and inferred types.

**Backend admin module — `apps/backend/src/modules/admin/`** (modify only)
- `admin.service.ts` — add 4 new methods (`getCategory`, `createSubcategory`, `updateSubcategory`, `deleteSubcategory`) and supporting types/helpers.
- `admin.controller.ts` — add 4 routes + 2 new validation pipes.
- `admin.service.spec.ts` — add tests for all new service methods (using `node:test` + Prisma fakes).

**API package — `packages/api/src/`** (modify)
- `endpoints.ts` — extend `adminApi` with `getCategory`, `createSubcategory`, `updateSubcategory`, `deleteSubcategory`.
- `query-keys.ts` — add `admin.category(id)` query-key factory.

**Web app — `apps/web/src/app/dashboard/admin/`**
- `page.tsx` — modify `CategoriesSection` only: add `+ Nouvelle catégorie` button, make cards clickable, add per-card delete affordance, delete the yellow "à brancher" banner.
- `categories/[id]/page.tsx` — new server shell.
- `categories/[id]/CategoryDetailClient.tsx` — new orchestrator client component.
- `categories/_components/CategoryForm.tsx` — left-column form.
- `categories/_components/SubcategoryList.tsx` — right-column container.
- `categories/_components/SubcategoryRow.tsx` — single subcategory row (draft or persisted).
- `categories/_components/NewCategoryModal.tsx` — modal triggered from the list.
- `categories/_components/DeleteConfirmDialog.tsx` — shared confirm dialog for category and subcategory deletes.
- `categories/_components/slug.ts` — name → slug utility.

---

## Task 1: Add subcategory DTOs to the schemas package

**Files:**
- Modify: `packages/schemas/src/dto.ts`

This unblocks the backend controller/service work and the api package — start here.

- [ ] **Step 1: Verify the new schemas don't already exist**

Run: `grep -n "CreateSubcategoryDto\|UpdateSubcategoryDto" packages/schemas/src/dto.ts`
Expected: no matches.

- [ ] **Step 2: Add the schemas next to `UpdateCategoryDto`**

In `packages/schemas/src/dto.ts`, find the existing block:

```ts
export const UpdateCategoryDto = CreateCategoryDto.partial().extend({
  id: IdSchema.optional(),
  categoryId: IdSchema.optional(),
  isActive: z.boolean().optional(),
});
```

Insert immediately after it:

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

- [ ] **Step 3: Add the inferred types in the type-export block at the bottom of the file**

Find the existing exports near `export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;` and add right below them:

```ts
export type CreateSubcategoryDto = z.infer<typeof CreateSubcategoryDto>;
export type UpdateSubcategoryDto = z.infer<typeof UpdateSubcategoryDto>;
```

- [ ] **Step 4: Type-check and build the schemas package**

Run: `pnpm --filter @kayu/schemas type-check && pnpm --filter @kayu/schemas build`
Expected: clean exit code 0, build outputs to `packages/schemas/dist`.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/dto.ts
git commit -m "feat(schemas): add Create/UpdateSubcategoryDto"
```

---

## Task 2: Backend — `getCategory(id)` service method (TDD)

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.service.ts`
- Modify: `apps/backend/src/modules/admin/admin.service.spec.ts`

`getCategory` returns one category by id with its subcategories (sorted) plus the same `stats` shape that the list returns.

- [ ] **Step 1: Write the failing test in `admin.service.spec.ts`**

Append at the end of the file:

```ts
test("getCategory returns a category with sorted subcategories and stats", async () => {
  const fakeCategory = {
    id: "cat_1",
    name: "Plomberie",
    slug: "plomberie",
    description: "Plombiers",
    icon: "Wrench",
    image: null,
    color: "#1E40AF",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    subcategories: [
      {
        id: "sub_2",
        categoryId: "cat_1",
        name: "Installation",
        slug: "installation",
        description: null,
        icon: null,
        order: 1,
        isActive: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        id: "sub_1",
        categoryId: "cat_1",
        name: "Dépannage",
        slug: "depannage",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ],
    _count: { providers: 5, subcategories: 2 },
  };

  let findUniqueArgs: unknown;
  const prisma = {
    category: {
      findUnique: async (args: unknown) => {
        findUniqueArgs = args;
        // Simulate prisma's orderBy by sorting before returning.
        return {
          ...fakeCategory,
          subcategories: [...fakeCategory.subcategories].sort(
            (a, b) => a.order - b.order || a.name.localeCompare(b.name),
          ),
        };
      },
    },
  };

  const service = new AdminService(prisma as never, {} as never);
  const result = await service.getCategory("cat_1");

  assert.equal(result.success, true);
  assert.equal(result.category.id, "cat_1");
  assert.equal(result.category.subcategories[0].slug, "depannage");
  assert.equal(result.category.subcategories[1].slug, "installation");
  assert.deepEqual(result.category.stats, {
    providerCount: 5,
    subcategoryCount: 2,
  });
  assert.deepEqual(findUniqueArgs, {
    where: { id: "cat_1" },
    include: {
      subcategories: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          providers: true,
          subcategories: true,
        },
      },
    },
  });
});

test("getCategory throws NotFoundException when the category is missing", async () => {
  const prisma = {
    category: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () => service.getCategory("missing"),
    (err: Error) => err.message.includes("Category not found"),
  );
});
```

- [ ] **Step 2: Run the failing test**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: both new tests fail with `service.getCategory is not a function`.

- [ ] **Step 3: Implement `getCategory` in `admin.service.ts`**

Insert this method immediately above the existing `async listCategories(query: AdminCategoryQuery)` method (around line 816):

```ts
async getCategory(id: string) {
  const category = await this.prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          providers: true,
          subcategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new NotFoundException("Category not found");
  }

  return {
    success: true as const,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      image: category.image,
      color: category.color,
      order: category.order,
      isActive: category.isActive,
      createdAt: category.createdAt,
      subcategories: category.subcategories.map((subcategory) => ({
        id: subcategory.id,
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        slug: subcategory.slug,
        description: subcategory.description,
        icon: subcategory.icon,
        order: subcategory.order,
        isActive: subcategory.isActive,
        createdAt: subcategory.createdAt,
      })),
      stats: {
        providerCount: category._count.providers,
        subcategoryCount: category._count.subcategories,
      },
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: both `getCategory` tests pass; existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/admin/admin.service.ts apps/backend/src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): getCategory service method"
```

---

## Task 3: Backend — `createSubcategory` service method (TDD)

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.service.ts`
- Modify: `apps/backend/src/modules/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `admin.service.spec.ts`:

```ts
test("createSubcategory inserts and writes activity log", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    category: {
      findUnique: async (args: { where: { id: string } }) => {
        calls.categoryFindUnique = args;
        return { id: args.where.id };
      },
    },
    subcategory: {
      findMany: async () => [],
      create: async (args: { data: Record<string, unknown> }) => {
        calls.subcategoryCreate = args;
        return {
          id: "sub_new",
          categoryId: args.data.categoryId,
          name: args.data.name,
          slug: args.data.slug,
          description: args.data.description ?? null,
          icon: args.data.icon ?? null,
          order: args.data.order ?? 0,
          isActive: true,
          createdAt: new Date("2026-05-10T00:00:00.000Z"),
        };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.createSubcategory(
    makeAdminActor() as never,
    {
      categoryId: "cat_1",
      name: "Vidange",
      slug: "vidange",
      description: "Vidange chauffe-eau",
      order: 2,
    },
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.equal(result.subcategory.slug, "vidange");
  assert.deepEqual(calls.categoryFindUnique, { where: { id: "cat_1" } });
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "CREATE_SUBCATEGORY",
  );
});

test("createSubcategory throws when the parent category is missing", async () => {
  const prisma = {
    category: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.createSubcategory(
        makeAdminActor() as never,
        {
          categoryId: "missing",
          name: "X",
          slug: "x",
        },
        "127.0.0.1",
      ),
    (err: Error) => err.message.includes("Category not found"),
  );
});

test("createSubcategory throws when the slug already exists", async () => {
  const prisma = {
    category: {
      findUnique: async () => ({ id: "cat_1" }),
    },
    subcategory: {
      findMany: async () => [{ slug: "vidange" }],
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.createSubcategory(
        makeAdminActor() as never,
        {
          categoryId: "cat_1",
          name: "Vidange",
          slug: "vidange",
        },
        "127.0.0.1",
      ),
    (err: Error) => err.message.toLowerCase().includes("slug"),
  );
});
```

- [ ] **Step 2: Run the failing tests**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: 3 new tests fail (`createSubcategory is not a function`).

- [ ] **Step 3: Add the type and method to `admin.service.ts`**

Add this type near the existing `CreateCategoryBody` type definitions:

```ts
type CreateSubcategoryBody = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
};

type UpdateSubcategoryBody = {
  id: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
};
```

Insert these methods immediately below `deleteCategory` (around line 1038):

```ts
async createSubcategory(
  actor: User,
  body: CreateSubcategoryBody,
  ipAddress?: string,
) {
  const parent = await this.prisma.category.findUnique({
    where: { id: body.categoryId },
  });
  if (!parent) {
    throw new NotFoundException("Category not found");
  }

  await this.ensureSubcategorySlugUnique(body.slug);

  const subcategory = await this.prisma.subcategory.create({
    data: {
      categoryId: body.categoryId,
      name: body.name,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      order: body.order ?? 0,
    },
  });

  await this.logActivity({
    userId: actor.id,
    action: "CREATE_SUBCATEGORY",
    entityType: "Subcategory",
    entityId: subcategory.id,
    metadata: {
      categoryId: body.categoryId,
      name: body.name,
      slug: body.slug,
    },
    ipAddress,
  });

  return {
    success: true as const,
    subcategory,
    message: "Subcategory created successfully",
  };
}
```

Then add this private helper next to `ensureSubcategorySlugsAvailable` (around line 2050) — the existing helper takes the array form used in `createCategory`; this one validates a single slug:

```ts
private async ensureSubcategorySlugUnique(slug: string, excludeId?: string) {
  const existing = await this.prisma.subcategory.findMany({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing.length > 0) {
    throw new BadRequestException("Subcategory slug already exists");
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: all 3 new `createSubcategory` tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/admin/admin.service.ts apps/backend/src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): createSubcategory service method"
```

---

## Task 4: Backend — `updateSubcategory` service method (TDD)

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.service.ts`
- Modify: `apps/backend/src/modules/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `admin.service.spec.ts`:

```ts
test("updateSubcategory updates fields and writes activity log", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "depannage",
      }),
      findMany: async () => [],
      update: async (args: { data: Record<string, unknown> }) => {
        calls.subcategoryUpdate = args;
        return {
          id: "sub_1",
          categoryId: "cat_1",
          name: (args.data.name as string) ?? "Dépannage",
          slug: (args.data.slug as string) ?? "depannage",
          description: (args.data.description as string) ?? null,
          icon: (args.data.icon as string) ?? null,
          order: (args.data.order as number) ?? 0,
          isActive: (args.data.isActive as boolean) ?? true,
          createdAt: new Date(),
        };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.updateSubcategory(
    makeAdminActor() as never,
    {
      id: "sub_1",
      name: "Dépannage urgent",
      isActive: false,
    },
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "UPDATE_SUBCATEGORY",
  );
});

test("updateSubcategory skips the slug uniqueness check when the slug is unchanged", async () => {
  let findManyCalled = false;
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "depannage",
      }),
      findMany: async () => {
        findManyCalled = true;
        return [];
      },
      update: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        name: "x",
        slug: "depannage",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date(),
      }),
    },
    activityLog: { create: async () => {} },
  };
  const service = new AdminService(prisma as never, {} as never);

  await service.updateSubcategory(
    makeAdminActor() as never,
    { id: "sub_1", slug: "depannage" },
    "127.0.0.1",
  );

  assert.equal(findManyCalled, false);
});

test("updateSubcategory excludes the current id when checking slug uniqueness on a slug change", async () => {
  let findManyArgs: unknown;
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "old-slug",
      }),
      findMany: async (args: unknown) => {
        findManyArgs = args;
        return [];
      },
      update: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        name: "x",
        slug: "new-slug",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date(),
      }),
    },
    activityLog: { create: async () => {} },
  };
  const service = new AdminService(prisma as never, {} as never);

  await service.updateSubcategory(
    makeAdminActor() as never,
    { id: "sub_1", slug: "new-slug" },
    "127.0.0.1",
  );

  assert.deepEqual(findManyArgs, {
    where: { slug: "new-slug", NOT: { id: "sub_1" } },
    select: { id: true },
  });
});

test("updateSubcategory throws when the subcategory is missing", async () => {
  const prisma = {
    subcategory: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.updateSubcategory(
        makeAdminActor() as never,
        { id: "missing", name: "X" },
        "127.0.0.1",
      ),
    (err: Error) => err.message.includes("Subcategory not found"),
  );
});
```

- [ ] **Step 2: Run the failing tests**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: 4 new `updateSubcategory` tests fail.

- [ ] **Step 3: Implement the method**

Insert immediately below `createSubcategory`:

```ts
async updateSubcategory(
  actor: User,
  body: UpdateSubcategoryBody,
  ipAddress?: string,
) {
  const existing = await this.prisma.subcategory.findUnique({
    where: { id: body.id },
  });
  if (!existing) {
    throw new NotFoundException("Subcategory not found");
  }

  if (body.slug && body.slug !== existing.slug) {
    await this.ensureSubcategorySlugUnique(body.slug, body.id);
  }

  const updated = await this.prisma.subcategory.update({
    where: { id: body.id },
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      order: body.order,
      isActive: body.isActive,
    },
  });

  await this.logActivity({
    userId: actor.id,
    action: "UPDATE_SUBCATEGORY",
    entityType: "Subcategory",
    entityId: body.id,
    metadata: {
      name: body.name,
      slug: body.slug,
      isActive: body.isActive,
    },
    ipAddress,
  });

  return {
    success: true as const,
    subcategory: updated,
    message: "Subcategory updated successfully",
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: all `updateSubcategory` tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/admin/admin.service.ts apps/backend/src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): updateSubcategory service method"
```

---

## Task 5: Backend — `deleteSubcategory` service method (TDD)

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.service.ts`
- Modify: `apps/backend/src/modules/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `admin.service.spec.ts`:

```ts
test("deleteSubcategory deletes when no providers are using it", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    providerSubcategory: {
      count: async (args: unknown) => {
        calls.count = args;
        return 0;
      },
    },
    subcategory: {
      delete: async (args: unknown) => {
        calls.delete = args;
        return { id: "sub_1" };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.deleteSubcategory(
    makeAdminActor() as never,
    "sub_1",
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.deepEqual(calls.count, { where: { subcategoryId: "sub_1" } });
  assert.deepEqual(calls.delete, { where: { id: "sub_1" } });
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "DELETE_SUBCATEGORY",
  );
});

test("deleteSubcategory rejects when providers are using it", async () => {
  const prisma = {
    providerSubcategory: {
      count: async () => 3,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.deleteSubcategory(
        makeAdminActor() as never,
        "sub_1",
        "127.0.0.1",
      ),
    (err: Error) =>
      err.message.includes("provider association") || err.message.includes("3"),
  );
});
```

- [ ] **Step 2: Run the failing tests**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: 2 new tests fail.

- [ ] **Step 3: Implement the method**

Insert immediately below `updateSubcategory` (mirrors the existing `deleteCategory` pattern):

```ts
async deleteSubcategory(actor: User, id: string, ipAddress?: string) {
  const providersCount = await this.prisma.providerSubcategory.count({
    where: { subcategoryId: id },
  });

  if (providersCount > 0) {
    throw new BadRequestException(
      `Subcategory still has ${providersCount} provider association(s)`,
    );
  }

  await this.prisma.subcategory.delete({
    where: { id },
  });

  await this.logActivity({
    userId: actor.id,
    action: "DELETE_SUBCATEGORY",
    entityType: "Subcategory",
    entityId: id,
    ipAddress,
  });

  return {
    success: true as const,
    message: "Subcategory deleted successfully",
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @kayu/backend exec node --test -r ts-node/register src/modules/admin/admin.service.spec.ts`
Expected: all 2 new tests pass; full file still green.

- [ ] **Step 5: Type-check the backend**

Run: `pnpm --filter @kayu/backend type-check`
Expected: clean exit code 0.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/admin/admin.service.ts apps/backend/src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): deleteSubcategory service method"
```

---

## Task 6: Backend — Wire controller routes

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.controller.ts`

- [ ] **Step 1: Add a `Param` import and DTO type imports at the top of the file**

Update the existing `@nestjs/common` import to include `Param`:

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
```

Then add type aliases for the new bodies near the existing `CreateCategoryBody` block:

```ts
type CreateSubcategoryBody = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
};

type UpdateSubcategoryBody = Partial<CreateSubcategoryBody> & {
  id: string;
  isActive?: boolean;
};
```

- [ ] **Step 2: Add the two new lazy zod pipes**

Below the existing `updateCategoryBodyPipe` block:

```ts
const createSubcategoryBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateSubcategoryDto } = await import("@kayu/schemas");
  return CreateSubcategoryDto;
});

const updateSubcategoryBodyPipe = new LazyZodValidationPipe(async () => {
  const { UpdateSubcategoryDto } = await import("@kayu/schemas");
  return UpdateSubcategoryDto;
});
```

- [ ] **Step 3: Add the four new routes inside `AdminController`**

Insert immediately after the existing `@Delete("categories")` handler block:

```ts
@Get("categories/:id")
getCategory(@Param("id") id: string) {
  return this.admin.getCategory(id);
}

@Post("categories/subcategories")
createSubcategory(
  @CurrentActor() actor: Actor,
  @Body(createSubcategoryBodyPipe) body: CreateSubcategoryBody,
  @Req() request: Request,
) {
  return this.admin.createSubcategory(actor, body, request.ip);
}

@Put("categories/subcategories")
updateSubcategory(
  @CurrentActor() actor: Actor,
  @Body(updateSubcategoryBodyPipe) body: UpdateSubcategoryBody,
  @Req() request: Request,
) {
  return this.admin.updateSubcategory(actor, body, request.ip);
}

@Delete("categories/subcategories")
deleteSubcategory(
  @CurrentActor() actor: Actor,
  @Query("id") id: string | undefined,
  @Req() request: Request,
) {
  return this.admin.deleteSubcategory(actor, id ?? "", request.ip);
}
```

Note on route ordering: NestJS matches `categories/:id` after the static `categories/subcategories` only if static routes are declared **first** in the controller. The block above does declare `categories/subcategories` after `categories/:id`, so we must declare `subcategories` routes BEFORE `:id`. Reorder so the file reads:

```
@Post("categories/subcategories")    // create one
@Put("categories/subcategories")     // update one
@Delete("categories/subcategories")  // delete one
@Get("categories/:id")               // get one
```

This way `categories/subcategories` never matches `:id`. Place the four handlers in that order in the file.

- [ ] **Step 4: Type-check the backend**

Run: `pnpm --filter @kayu/backend type-check`
Expected: clean exit.

- [ ] **Step 5: Build the backend to confirm Nest decorators wire up**

Run: `pnpm --filter @kayu/backend build`
Expected: clean exit, dist refreshed.

- [ ] **Step 6: Run the full backend test:launch suite**

Run: `pnpm --filter @kayu/backend test:launch`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/modules/admin/admin.controller.ts
git commit -m "feat(admin): wire subcategory CRUD routes"
```

---

## Task 7: API package — endpoints + query keys

**Files:**
- Modify: `packages/api/src/endpoints.ts`
- Modify: `packages/api/src/query-keys.ts`

- [ ] **Step 1: Add the new DTO imports in `endpoints.ts`**

Update the existing `@kayu/schemas` import block to add the new types:

```ts
import {
  // ...existing imports
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  // ...rest
} from "@kayu/schemas";
```

(Preserve the order/style already in the file.)

- [ ] **Step 2: Extend `adminApi` with the new methods**

Replace the existing `// Categories` block:

```ts
// Categories
getCategories: (params?: Partial<AdminCategorySearchParams>) =>
  client.get<{ categories: unknown[] }>("/admin/categories", params as Record<string, string | number | boolean | undefined>),
createCategory: (data: CreateCategoryDto) =>
  client.post<{ success: boolean }>("/admin/categories", data),
updateCategory: (data: UpdateCategoryDto) =>
  client.put<{ success: boolean }>("/admin/categories", data),
deleteCategory: (id: string) =>
  client.delete<{ success: boolean }>("/admin/categories", { id }),
```

with:

```ts
// Categories
getCategories: (params?: Partial<AdminCategorySearchParams>) =>
  client.get<{ categories: unknown[] }>("/admin/categories", params as Record<string, string | number | boolean | undefined>),
getCategory: (id: string) =>
  client.get<{ success: boolean; category: AdminCategoryDetail }>(`/admin/categories/${id}`),
createCategory: (data: CreateCategoryDto) =>
  client.post<{ success: boolean; category: { id: string } }>("/admin/categories", data),
updateCategory: (data: UpdateCategoryDto) =>
  client.put<{ success: boolean }>("/admin/categories", data),
deleteCategory: (id: string) =>
  client.delete<{ success: boolean }>("/admin/categories", { id }),
createSubcategory: (data: CreateSubcategoryDto) =>
  client.post<{ success: boolean }>("/admin/categories/subcategories", data),
updateSubcategory: (data: UpdateSubcategoryDto) =>
  client.put<{ success: boolean }>("/admin/categories/subcategories", data),
deleteSubcategory: (id: string) =>
  client.delete<{ success: boolean }>("/admin/categories/subcategories", { id }),
```

- [ ] **Step 3: Add the `AdminCategoryDetail` type at the top of `endpoints.ts`**

Add (near the other admin response types):

```ts
export type AdminCategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  subcategories: Array<{
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    order: number;
    isActive: boolean;
    createdAt: string;
  }>;
  stats: {
    providerCount: number;
    subcategoryCount: number;
  };
};
```

- [ ] **Step 4: Add the query-key factory in `query-keys.ts`**

Replace the existing `categories: ["admin", "categories"] as const,` line inside the `admin` block with:

```ts
categories: ["admin", "categories"] as const,
category: (id: string) => ["admin", "categories", id] as const,
```

- [ ] **Step 5: Type-check and build the api package**

Run: `pnpm --filter @kayu/api type-check && pnpm --filter @kayu/api build`
Expected: clean exit; downstream consumers (web, mobile) compile against the rebuilt dist.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/endpoints.ts packages/api/src/query-keys.ts
git commit -m "feat(api): admin subcategory + getCategory endpoints"
```

---

## Task 8: Web — slug utility

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/slug.ts`

- [ ] **Step 1: Create the file**

```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/slug.ts
git commit -m "feat(admin-web): slugify utility"
```

---

## Task 9: Web — Delete confirm dialog component

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/DeleteConfirmDialog.tsx`

The web app already exposes `apps/web/src/components/ui/alert-dialog.tsx` (Radix wrapper). Use it.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Supprimer",
  isPending,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            style={{ background: "var(--k-danger)", color: "white" }}
          >
            {isPending ? "Suppression…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit (assumes `@/components/ui/alert-dialog` exposes the named exports above — confirm with `grep -n "export" apps/web/src/components/ui/alert-dialog.tsx` if it fails; the file is the standard shadcn-style wrapper).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/DeleteConfirmDialog.tsx
git commit -m "feat(admin-web): shared delete-confirm dialog"
```

---

## Task 10: Web — `NewCategoryModal` component

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/NewCategoryModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "./slug";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewCategoryModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state whenever the modal closes.
  React.useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi(apiClient).createCategory({
        name: name.trim(),
        slug: slug.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      toast.success("Catégorie créée");
      onOpenChange(false);
      const newId = response?.category?.id;
      if (newId) {
        router.push(`/dashboard/admin/categories/${newId}`);
      }
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setError(message);
      toast.error(message);
    },
  });

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError("Nom et slug sont obligatoires.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Saisissez le nom et le slug. Vous pourrez compléter description, icône, image, couleur et sous-catégories sur la page suivante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--k-text-body)" }}>Nom *</span>
            <input
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </label>
          <label className="block">
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--k-text-body)" }}>Slug *</span>
            <input
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              required
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "var(--k-font-mono)",
              }}
            />
          </label>
          {error ? (
            <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{error}</div>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                background: "white",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "var(--k-primary)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {mutation.isPending ? "Création…" : "Créer"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

If the import path `@/lib/api` does not resolve, run `grep -rn "apiClient" apps/web/src/lib | head -5` and update the import to whatever path exposes `apiClient` in this project.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/NewCategoryModal.tsx
git commit -m "feat(admin-web): NewCategoryModal"
```

---

## Task 11: Web — Update list view (`CategoriesSection`)

**Files:**
- Modify: `apps/web/src/app/dashboard/admin/page.tsx`

- [ ] **Step 1: Add imports at the top of the file**

Add these to the existing import block (preserve any existing ordering):

```ts
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { NewCategoryModal } from "./categories/_components/NewCategoryModal";
import { DeleteConfirmDialog } from "./categories/_components/DeleteConfirmDialog";
```

(Some of these may already be imported — keep the file's import style and de-dupe.)

- [ ] **Step 2: Replace the `CategoriesSection` body**

Find the current implementation (around line 2243) and replace the entire `CategoriesSection` function with:

```tsx
function CategoriesSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => adminApi(apiClient).getCategories({ includeInactive: true } as any),
    enabled: isAdmin,
  });
  const cats = (data?.categories ?? []) as any[];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi(apiClient).deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      toast.success("Catégorie supprimée");
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      toast.error(message);
    },
  });

  return (
    <div>
      <SectionHeader
        title="Catégories de service"
        subtitle="Référentiel des catégories et services exposés à la recherche client."
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--k-primary)",
              color: "white",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Plus size={14} /> Nouvelle catégorie
          </button>
        }
      />
      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
        </OpsCard>
      ) : cats.length === 0 ? (
        <EmptyOpsState icon={Layers} title="Aucune catégorie" description="Le référentiel est vide." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((c: any) => (
            <div
              key={c.id}
              style={{
                background: 'var(--k-surface)',
                border: '1px solid var(--k-border)',
                borderRadius: 12,
                padding: 14,
                position: "relative",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link
                  href={`/dashboard/admin/categories/${c.id}`}
                  style={{ flex: 1, display: "block" }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--k-text-primary)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--k-text-subtle)',
                      fontFamily: 'var(--k-font-mono)',
                      marginTop: 2,
                    }}
                  >
                    /{c.slug}
                  </div>
                </Link>
                <div className="flex items-center gap-1.5">
                  <StatusChip tone={c.isActive === false ? 'warning' : 'success'}>
                    {c.isActive === false ? 'Inactive' : 'Active'}
                  </StatusChip>
                  <Link
                    href={`/dashboard/admin/categories/${c.id}`}
                    aria-label="Modifier"
                    title="Modifier"
                    style={{ padding: 6, borderRadius: 6, color: "var(--k-text-muted)" }}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                    aria-label="Supprimer"
                    title="Supprimer"
                    style={{ padding: 6, borderRadius: 6, color: "var(--k-danger)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--k-text-muted)' }}>
                {c.providerCount ?? c.stats?.providerCount ?? 0} pros
                {c.subcategoryCount != null
                  ? ` · ${c.subcategoryCount} sous-catégories`
                  : c.stats?.subcategoryCount != null
                    ? ` · ${c.stats.subcategoryCount} sous-catégories`
                    : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      <NewCategoryModal open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Supprimer la catégorie"
        description={
          deleteTarget
            ? `La catégorie "${deleteTarget.name}" sera définitivement supprimée. Si des prestataires y sont associés, la suppression sera bloquée.`
            : ""
        }
        confirmLabel="Supprimer la catégorie"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Confirm `SectionHeader` accepts an `action` prop**

Run: `grep -n "function SectionHeader" -A 30 apps/web/src/app/dashboard/admin/page.tsx | head -40`
Expected output should show the prop list. If `action` is not in the prop list, add it now:

In the `SectionHeader` component definition near line 94, change the props to include `action?: React.ReactNode` and render `{action}` on the right side of the header. Match the existing CSS on the page (the title and subtitle are flex-rowed; the action sits opposite). Example minimal change inside `SectionHeader`:

```tsx
function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--k-text-primary)" }}>{title}</h2>
        {subtitle ? (
          <p style={{ fontSize: 12.5, color: "var(--k-text-muted)", marginTop: 2 }}>{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
```

(Adjust the structural details to match the existing JSX so other sections that render `SectionHeader` still look right. If the existing component already supports an `action` prop, skip this step.)

- [ ] **Step 4: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/admin/page.tsx
git commit -m "feat(admin-web): make Categories list interactive (create + delete)"
```

---

## Task 12: Web — `CategoryForm` component (left column)

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/CategoryForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  color: string;
  order: number;
  isActive: boolean;
};

export type CategoryFormProps = {
  initialValues: CategoryFormValues;
  isSaving: boolean;
  isDeleting: boolean;
  saveError: string | null;
  onSave: (values: CategoryFormValues) => void;
  onDelete: () => void;
};

export function CategoryForm({
  initialValues,
  isSaving,
  isDeleting,
  saveError,
  onSave,
  onDelete,
}: CategoryFormProps) {
  const [values, setValues] = React.useState<CategoryFormValues>(initialValues);

  // Re-sync when the parent passes new initialValues (e.g., after a successful save).
  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const isDirty = React.useMemo(() => {
    return (Object.keys(values) as Array<keyof CategoryFormValues>).some(
      (key) => values[key] !== initialValues[key],
    );
  }, [values, initialValues]);

  function update<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--k-text-primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Détails de la catégorie
      </h3>

      <Field label="Nom *">
        <input
          type="text"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Slug *">
        <input
          type="text"
          value={values.slug}
          onChange={(event) => update("slug", event.target.value)}
          required
          style={{ ...inputStyle, fontFamily: "var(--k-font-mono)" }}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="Icône (nom Lucide, ex. Wrench)">
        <input
          type="text"
          value={values.icon}
          onChange={(event) => update("icon", event.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Image (URL)">
        <input
          type="text"
          value={values.image}
          onChange={(event) => update("image", event.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Couleur (hex)">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={values.color}
            onChange={(event) => update("color", event.target.value)}
            placeholder="#1E40AF"
            style={{ ...inputStyle, flex: 1 }}
          />
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--k-border)",
              background: values.color || "transparent",
            }}
          />
        </div>
      </Field>

      <Field label="Ordre">
        <input
          type="number"
          value={values.order}
          onChange={(event) => update("order", Number(event.target.value) || 0)}
          min={0}
          style={inputStyle}
        />
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => update("isActive", event.target.checked)}
        />
        Active
      </label>

      {saveError ? (
        <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{saveError}</div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: isDirty ? "var(--k-primary)" : "var(--k-border)",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            cursor: isDirty ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer la catégorie"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "white",
            color: "var(--k-danger)",
            border: "1px solid var(--k-danger)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {isDeleting ? "Suppression…" : "Supprimer la catégorie"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--k-text-body)" }}>{label}</span>
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--k-border)",
  borderRadius: 8,
  fontSize: 13,
  background: "white",
};
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/CategoryForm.tsx
git commit -m "feat(admin-web): CategoryForm left-column component"
```

---

## Task 13: Web — `SubcategoryRow` component

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/SubcategoryRow.tsx`

This component handles both draft (no id yet) and persisted (with id) modes.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { slugify } from "./slug";

export type SubcategoryDraftValues = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
};

export type PersistedSubcategory = {
  id: string;
  categoryId: string;
} & SubcategoryDraftValues;

export type SubcategoryRowProps =
  | {
      mode: "persisted";
      initialValues: PersistedSubcategory;
      isSaving: boolean;
      isDeleting: boolean;
      saveError: string | null;
      deleteError: string | null;
      onSave: (values: SubcategoryDraftValues) => void;
      onDelete: () => void;
    }
  | {
      mode: "draft";
      isSaving: boolean;
      saveError: string | null;
      onSave: (values: SubcategoryDraftValues) => void;
      onCancel: () => void;
    };

const EMPTY_DRAFT: SubcategoryDraftValues = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  order: 0,
  isActive: true,
};

export function SubcategoryRow(props: SubcategoryRowProps) {
  const initial: SubcategoryDraftValues =
    props.mode === "persisted" ? props.initialValues : EMPTY_DRAFT;

  const [values, setValues] = React.useState<SubcategoryDraftValues>(initial);
  const [slugTouched, setSlugTouched] = React.useState(props.mode === "persisted");

  React.useEffect(() => {
    setValues(initial);
    setSlugTouched(props.mode === "persisted");
  }, [props.mode === "persisted" ? props.initialValues : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = React.useMemo(() => {
    return (Object.keys(values) as Array<keyof SubcategoryDraftValues>).some(
      (key) => values[key] !== initial[key],
    );
  }, [values, initial]);

  function update<K extends keyof SubcategoryDraftValues>(key: K, value: SubcategoryDraftValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(name: string) {
    update("name", name);
    if (props.mode === "draft" && !slugTouched) {
      setValues((current) => ({ ...current, name, slug: slugify(name) }));
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSave(values);
      }}
      style={{
        background: "white",
        border: "1px solid var(--k-border)",
        borderRadius: 10,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label>
          <span style={labelStyle}>Nom *</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => handleNameChange(event.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Slug *</span>
          <input
            type="text"
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              update("slug", event.target.value);
            }}
            required
            style={{ ...inputStyle, fontFamily: "var(--k-font-mono)" }}
          />
        </label>
      </div>
      <label>
        <span style={labelStyle}>Description</span>
        <textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span style={labelStyle}>Icône</span>
          <input
            type="text"
            value={values.icon}
            onChange={(event) => update("icon", event.target.value)}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Ordre</span>
          <input
            type="number"
            value={values.order}
            onChange={(event) => update("order", Number(event.target.value) || 0)}
            min={0}
            style={inputStyle}
          />
        </label>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => update("isActive", event.target.checked)}
        />
        Active
      </label>

      {props.saveError ? (
        <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{props.saveError}</div>
      ) : null}
      {props.mode === "persisted" && props.deleteError ? (
        <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{props.deleteError}</div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {props.mode === "draft" ? (
          <button
            type="button"
            onClick={props.onCancel}
            disabled={props.isSaving}
            style={secondaryButtonStyle}
          >
            Annuler
          </button>
        ) : (
          <button
            type="button"
            onClick={props.onDelete}
            disabled={props.isDeleting}
            aria-label="Supprimer"
            style={{ ...secondaryButtonStyle, color: "var(--k-danger)", borderColor: "var(--k-danger)" }}
          >
            <Trash2 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {props.isDeleting ? "Suppression…" : "Supprimer"}
          </button>
        )}
        <button
          type="submit"
          disabled={!isDirty || props.isSaving}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: isDirty ? "var(--k-primary)" : "var(--k-border)",
            color: "white",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: isDirty ? "pointer" : "not-allowed",
          }}
        >
          {props.isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--k-text-body)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 3,
  padding: "7px 9px",
  border: "1px solid var(--k-border)",
  borderRadius: 7,
  fontSize: 12.5,
  background: "white",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "white",
  border: "1px solid var(--k-border)",
  fontSize: 12.5,
  fontWeight: 600,
};
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/SubcategoryRow.tsx
git commit -m "feat(admin-web): SubcategoryRow component"
```

---

## Task 14: Web — `SubcategoryList` component

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/_components/SubcategoryList.tsx`

The orchestrator passes mutation callbacks down; this component just owns the draft-row state and renders the list.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  PersistedSubcategory,
  SubcategoryDraftValues,
  SubcategoryRow,
} from "./SubcategoryRow";

type Props = {
  subcategories: PersistedSubcategory[];
  pendingSaveId: string | null;
  pendingDeleteId: string | null;
  rowSaveErrors: Record<string, string | null>;
  rowDeleteErrors: Record<string, string | null>;
  isCreating: boolean;
  draftSaveError: string | null;
  onCreate: (values: SubcategoryDraftValues, onDone: () => void) => void;
  onUpdate: (id: string, values: SubcategoryDraftValues) => void;
  onDelete: (id: string) => void;
};

export function SubcategoryList({
  subcategories,
  pendingSaveId,
  pendingDeleteId,
  rowSaveErrors,
  rowDeleteErrors,
  isCreating,
  draftSaveError,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [draftOpen, setDraftOpen] = React.useState(false);

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--k-text-primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Sous-catégories
        </h3>
        <button
          type="button"
          onClick={() => setDraftOpen(true)}
          disabled={draftOpen}
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            background: "var(--k-primary)",
            color: "white",
            fontSize: 12.5,
            fontWeight: 600,
            opacity: draftOpen ? 0.6 : 1,
          }}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {draftOpen ? (
        <SubcategoryRow
          mode="draft"
          isSaving={isCreating}
          saveError={draftSaveError}
          onCancel={() => setDraftOpen(false)}
          onSave={(values) =>
            onCreate(values, () => setDraftOpen(false))
          }
        />
      ) : null}

      {subcategories.length === 0 && !draftOpen ? (
        <div
          style={{
            padding: "24px 12px",
            textAlign: "center",
            border: "1px dashed var(--k-border)",
            borderRadius: 10,
            color: "var(--k-text-muted)",
            fontSize: 12.5,
          }}
        >
          Aucune sous-catégorie pour le moment.
          <button
            type="button"
            onClick={() => setDraftOpen(true)}
            style={{
              display: "block",
              margin: "8px auto 0",
              padding: "6px 10px",
              border: "1px solid var(--k-border)",
              borderRadius: 8,
              background: "white",
              fontSize: 12.5,
            }}
          >
            + Ajouter une sous-catégorie
          </button>
        </div>
      ) : null}

      {subcategories.map((sub) => (
        <SubcategoryRow
          key={sub.id}
          mode="persisted"
          initialValues={sub}
          isSaving={pendingSaveId === sub.id}
          isDeleting={pendingDeleteId === sub.id}
          saveError={rowSaveErrors[sub.id] ?? null}
          deleteError={rowDeleteErrors[sub.id] ?? null}
          onSave={(values) => onUpdate(sub.id, values)}
          onDelete={() => onDelete(sub.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/admin/categories/_components/SubcategoryList.tsx
git commit -m "feat(admin-web): SubcategoryList container"
```

---

## Task 15: Web — Detail page route shell

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/[id]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { CategoryDetailClient } from "./CategoryDetailClient";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryDetailClient categoryId={id} />;
}
```

(Next.js App Router 14+ types `params` as a Promise. If the rest of the codebase uses synchronous `params`, match that — `grep -n "params" apps/web/src/app/dashboard/admin/page.tsx` to compare.)

- [ ] **Step 2: Commit (placeholder until Task 16 lands `CategoryDetailClient`)**

Skip the commit here and combine with Task 16 — the page is non-functional without the client component.

---

## Task 16: Web — `CategoryDetailClient` orchestrator

**Files:**
- Create: `apps/web/src/app/dashboard/admin/categories/[id]/CategoryDetailClient.tsx`

This is the orchestration component. It owns the React Query for the detail and all mutation lifecycles. It also handles router navigation after delete.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { CategoryForm, CategoryFormValues } from "../_components/CategoryForm";
import { SubcategoryList } from "../_components/SubcategoryList";
import {
  PersistedSubcategory,
  SubcategoryDraftValues,
} from "../_components/SubcategoryRow";
import { DeleteConfirmDialog } from "../_components/DeleteConfirmDialog";

type Props = { categoryId: string };

export function CategoryDetailClient({ categoryId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.category(categoryId),
    queryFn: () => adminApi(apiClient).getCategory(categoryId),
  });

  const [categorySaveError, setCategorySaveError] = React.useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = React.useState<string | null>(null);
  const [rowSaveErrors, setRowSaveErrors] = React.useState<Record<string, string | null>>({});
  const [rowDeleteErrors, setRowDeleteErrors] = React.useState<Record<string, string | null>>({});
  const [confirmDeleteCategory, setConfirmDeleteCategory] = React.useState(false);

  const invalidateBoth = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.category(categoryId) });
  };

  const updateCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      adminApi(apiClient).updateCategory({
        categoryId,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        image: values.image || undefined,
        color: values.color || undefined,
        order: values.order,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      setCategorySaveError(null);
      invalidateBoth();
      toast.success("Catégorie enregistrée");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setCategorySaveError(message);
      toast.error(message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: () => adminApi(apiClient).deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      toast.success("Catégorie supprimée");
      setConfirmDeleteCategory(false);
      router.push("/dashboard/admin?section=categories");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setCategorySaveError(message);
      toast.error(message);
      setConfirmDeleteCategory(false);
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: (values: SubcategoryDraftValues) =>
      adminApi(apiClient).createSubcategory({
        categoryId,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        order: values.order,
      }),
    onMutate: () => setDraftSaveError(null),
    onSuccess: () => {
      invalidateBoth();
      toast.success("Sous-catégorie ajoutée");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setDraftSaveError(message);
      toast.error(message);
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SubcategoryDraftValues }) =>
      adminApi(apiClient).updateSubcategory({
        id,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        order: values.order,
        isActive: values.isActive,
      }),
    onSuccess: (_data, vars) => {
      setRowSaveErrors((current) => ({ ...current, [vars.id]: null }));
      invalidateBoth();
      toast.success("Sous-catégorie enregistrée");
    },
    onError: (err: Error, vars) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setRowSaveErrors((current) => ({ ...current, [vars.id]: message }));
      toast.error(message);
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi(apiClient).deleteSubcategory(id),
    onSuccess: (_data, id) => {
      setRowDeleteErrors((current) => ({ ...current, [id]: null }));
      invalidateBoth();
      toast.success("Sous-catégorie supprimée");
    },
    onError: (err: Error, id) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setRowDeleteErrors((current) => ({ ...current, [id]: message }));
      toast.error(message);
    },
  });

  if (detailQuery.isLoading) {
    return <DetailSkeleton />;
  }
  if (detailQuery.isError || !detailQuery.data?.category) {
    return (
      <div style={{ padding: 24 }}>
        <Link href="/dashboard/admin?section=categories" style={{ fontSize: 13, color: "var(--k-text-muted)" }}>
          ← Retour à la liste
        </Link>
        <div
          style={{
            marginTop: 24,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 12,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Catégorie introuvable</h2>
          <p style={{ fontSize: 13, color: "var(--k-text-muted)", marginTop: 8 }}>
            La catégorie demandée n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const category = detailQuery.data.category;
  const initialFormValues: CategoryFormValues = {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.icon ?? "",
    image: category.image ?? "",
    color: category.color ?? "",
    order: category.order,
    isActive: category.isActive,
  };

  const subcategories: PersistedSubcategory[] = category.subcategories.map((sub) => ({
    id: sub.id,
    categoryId: sub.categoryId,
    name: sub.name,
    slug: sub.slug,
    description: sub.description ?? "",
    icon: sub.icon ?? "",
    order: sub.order,
    isActive: sub.isActive,
  }));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--k-text-muted)" }}>
        <Link
          href="/dashboard/admin?section=categories"
          className="inline-flex items-center gap-1"
          style={{ color: "var(--k-text-muted)" }}
        >
          <ChevronLeft size={14} /> Retour à la liste
        </Link>
        <span>·</span>
        <span>Admin › Catégories › {category.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryForm
          initialValues={initialFormValues}
          isSaving={updateCategoryMutation.isPending}
          isDeleting={deleteCategoryMutation.isPending}
          saveError={categorySaveError}
          onSave={(values) => updateCategoryMutation.mutate(values)}
          onDelete={() => setConfirmDeleteCategory(true)}
        />

        <SubcategoryList
          subcategories={subcategories}
          pendingSaveId={
            updateSubcategoryMutation.isPending
              ? (updateSubcategoryMutation.variables?.id ?? null)
              : null
          }
          pendingDeleteId={
            deleteSubcategoryMutation.isPending
              ? (deleteSubcategoryMutation.variables ?? null)
              : null
          }
          rowSaveErrors={rowSaveErrors}
          rowDeleteErrors={rowDeleteErrors}
          isCreating={createSubcategoryMutation.isPending}
          draftSaveError={draftSaveError}
          onCreate={(values, onDone) =>
            createSubcategoryMutation.mutate(values, {
              onSuccess: () => onDone(),
            })
          }
          onUpdate={(id, values) =>
            updateSubcategoryMutation.mutate({ id, values })
          }
          onDelete={(id) => deleteSubcategoryMutation.mutate(id)}
        />
      </div>

      <DeleteConfirmDialog
        open={confirmDeleteCategory}
        onOpenChange={setConfirmDeleteCategory}
        title="Supprimer la catégorie"
        description={`La catégorie "${category.name}" sera définitivement supprimée. Si des prestataires y sont associés, la suppression sera bloquée.`}
        confirmLabel="Supprimer la catégorie"
        isPending={deleteCategoryMutation.isPending}
        onConfirm={() => deleteCategoryMutation.mutate()}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 14, width: 160, background: "var(--k-border)", borderRadius: 4, marginBottom: 16 }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={{ height: 480, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12 }} />
        <div style={{ height: 480, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12 }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check the web app**

Run: `pnpm --filter @kayu/web type-check`
Expected: clean exit.

- [ ] **Step 3: Commit (combines Task 15 and Task 16)**

```bash
git add apps/web/src/app/dashboard/admin/categories/[id]/page.tsx apps/web/src/app/dashboard/admin/categories/[id]/CategoryDetailClient.tsx
git commit -m "feat(admin-web): category detail page"
```

---

## Task 17: Final verification and manual smoke

**Files:** none (verification only).

- [ ] **Step 1: Run the full type-check + test gauntlet from the spec**

Run each command and confirm clean exit:

```bash
pnpm --filter @kayu/schemas type-check
pnpm --filter @kayu/schemas build
pnpm --filter @kayu/api type-check
pnpm --filter @kayu/api build
pnpm --filter @kayu/backend type-check
pnpm --filter @kayu/backend test:launch
pnpm --filter @kayu/web type-check
```

If any step fails, fix the underlying issue (do NOT skip), commit the fix, and re-run.

- [ ] **Step 2: Boot the stack and smoke the feature**

Run: `pnpm db:up` (if Postgres isn't already up), then in two terminals:
```bash
pnpm --filter @kayu/backend dev
pnpm --filter @kayu/web dev
```

Sign in as an admin user and walk through:
1. Open `/dashboard/admin?section=categories` — list renders, `+ Nouvelle catégorie` button is visible.
2. Click `+ Nouvelle catégorie` — modal opens, slug auto-derives from name.
3. Submit — toast appears, navigates to `/dashboard/admin/categories/<new-id>`.
4. Edit name/description/order/isActive on the left form — `Enregistrer` enables; click — toast success; values persist after refresh.
5. Click `+ Ajouter` on the right — draft row appears, slug auto-derives from name; type values; `Enregistrer` — row converts into a persisted entry with delete button.
6. Click `Enregistrer` on a persisted row after editing — toast success; left/right counts in list view updated when navigating back.
7. Click `Supprimer` on a subcategory — confirm dialog; confirm; row disappears.
8. Click `Supprimer la catégorie` — confirm dialog; if no providers attached, toast success and we're back on the list. If providers ARE attached, toast error with the provider count (try this on a seeded category with associations).
9. From the list, click trash on a card — confirm; deleted (or blocked).

If any step is broken, fix and re-run from Step 1.

- [ ] **Step 3: No commit needed; the feature is complete.**

---

## Self-review notes

- **Spec coverage** — every section of the spec (routes, list-view changes, detail layout, save behavior, components, backend endpoints, schemas, data flow, error handling, testing, out-of-scope) maps to a task above. Frontend tests are intentionally absent because the spec puts that out of scope.
- **No placeholders** — every code-changing step contains either complete code or precise edit instructions.
- **Type consistency** — `CategoryFormValues`, `SubcategoryDraftValues`, `PersistedSubcategory`, `AdminCategoryDetail`, the new DTO types, and the backend service-method signatures are consistent across tasks.
- **Route-ordering gotcha** — Task 6 explicitly calls out declaring static `/categories/subcategories` routes before the `:id` parameterized route to avoid Nest matching `subcategories` as the `:id` param.
- **Per-row mutation pending tracking** — `CategoryDetailClient` uses `useMutation`'s `variables` to know which row is currently saving/deleting, avoiding extra state. If tanstack-query types in this codebase don't expose `variables` on a non-pending mutation in the way used here, fall back to local state mapping `id → "saving" | "deleting"`.
