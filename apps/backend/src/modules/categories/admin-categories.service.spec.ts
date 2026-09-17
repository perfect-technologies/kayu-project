import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { AdminCategoriesService } from "./admin-categories.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as never;
type Row = Record<string, any>;

function hasCode(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException, String(error));
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (condition !== null && typeof condition === "object" && "in" in condition) {
      return condition.in.includes(row[key]);
    }
    return (row[key] ?? null) === condition;
  });
}

function makeHarness(options: { references?: Record<string, Row[]> } = {}) {
  const categories: Row[] = [
    { id: "cat_1", slug: "batiment", name: "Bâtiment", description: null, icon: null, color: null, image: null, order: 0, isActive: true },
  ];
  const subcategories: Row[] = [
    { id: "plomberie", categoryId: "cat_1", parentId: null, slug: "plomberie", name: "Plomberie", description: null, icon: null, order: 0, isActive: true },
    { id: "fuites", categoryId: "cat_1", parentId: "plomberie", slug: "fuites", name: "Fuites", description: null, icon: null, order: 0, isActive: true },
    { id: "peinture", categoryId: "cat_1", parentId: null, slug: "peinture", name: "Peinture", description: null, icon: null, order: 1, isActive: true },
  ];
  const refs = {
    provider: [] as Row[],
    booking: [] as Row[],
    providerLead: [] as Row[],
    providerLeadAdditionalSubcategory: [] as Row[],
    clientWaitlistLeadSubcategory: [] as Row[],
    ...options.references,
  };
  const countQueries: Row[] = [];
  const logs: Row[] = [];
  const deleted: string[] = [];
  const disabledSkills: Row[] = [];
  let nextId = 1;

  const refDelegate = (rows: Row[], key: string) => ({
    count: async ({ where }: Row) => {
      countQueries.push(where);
      return rows.filter((row) => matches(row, where)).length;
    },
    groupBy: async ({ where }: Row) => {
      const counts = new Map<string, number>();
      for (const row of rows.filter((candidate) => matches(candidate, where))) {
        counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
      }
      return [...counts].map(([value, count]) => ({ [key]: value, _count: { _all: count } }));
    },
  });

  const tx: Row = {
    category: {
      findUnique: async ({ where }: Row) =>
        categories.find((row) => (where.id ? row.id === where.id : row.slug === where.slug)) ?? null,
      findMany: async ({ where }: Row) => categories.filter((row) => matches(row, where)),
      aggregate: async () => ({ _max: { order: Math.max(...categories.map((row) => row.order)) } }),
      create: async ({ data }: Row) => {
        const row = { id: `cat_new_${nextId++}`, ...data };
        categories.push(row);
        return row;
      },
      update: async ({ where, data }: Row) => {
        const row = categories.find((candidate) => candidate.id === where.id)!;
        for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value;
        return row;
      },
      delete: async ({ where }: Row) => deleted.push(where.id),
    },
    subcategory: {
      findUnique: async ({ where }: Row) =>
        subcategories.find((row) => (where.id ? row.id === where.id : row.slug === where.slug)) ?? null,
      findMany: async ({ where }: Row) => subcategories.filter((row) => matches(row, where)),
      aggregate: async ({ where }: Row) => ({
        _max: { order: Math.max(-1, ...subcategories.filter((row) => matches(row, where)).map((row) => row.order)) },
      }),
      create: async ({ data }: Row) => {
        const row = { id: `sub_new_${nextId++}`, ...data };
        subcategories.push(row);
        return row;
      },
      update: async ({ where, data }: Row) => {
        const row = subcategories.find((candidate) => candidate.id === where.id)!;
        for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value;
        return row;
      },
      delete: async ({ where }: Row) => deleted.push(where.id),
    },
    provider: refDelegate(refs.provider, "subcategoryId"),
    booking: refDelegate(refs.booking, "subcategoryId"),
    providerLead: refDelegate(refs.providerLead, "primarySubcategoryId"),
    providerLeadAdditionalSubcategory: refDelegate(refs.providerLeadAdditionalSubcategory, "subcategoryId"),
    clientWaitlistLeadSubcategory: refDelegate(refs.clientWaitlistLeadSubcategory, "subcategoryId"),
    referenceItem: {
      updateMany: async (args: Row) => {
        disabledSkills.push(args);
        return { count: 0 };
      },
    },
  };
  const prisma = { ...tx, $transaction: async (run: (client: Row) => unknown) => run(tx) };
  const service = new AdminCategoriesService(prisma as never, { log: async (entry: Row) => logs.push(entry) } as never);
  return { service, categories, subcategories, countQueries, logs, deleted, disabledSkills };
}

test("admin tree includes inactive nodes and rolls providers, bookings and leads up", async () => {
  const { service, subcategories } = makeHarness({
    references: {
      provider: [{ subcategoryId: "fuites" }],
      booking: [{ subcategoryId: "fuites" }, { subcategoryId: "peinture" }],
      providerLead: [{ primarySubcategoryId: "plomberie" }],
      clientWaitlistLeadSubcategory: [{ subcategoryId: "fuites" }],
    },
  });
  subcategories[2]!.isActive = false;

  const { items } = await service.list();

  assert.deepEqual(items[0]!.counts, { providers: 1, bookings: 2, leads: 2 });
  const [plomberie, peinture] = items[0]!.children;
  assert.deepEqual(plomberie!.counts, { providers: 1, bookings: 1, leads: 2 });
  assert.deepEqual(plomberie!.children[0]!.counts, { providers: 1, bookings: 1, leads: 1 });
  assert.equal(peinture!.isActive, false);
  assert.deepEqual(peinture!.counts, { providers: 0, bookings: 1, leads: 0 });
});

test("deactivating a category referenced only by a launch lead is refused with counts", async () => {
  const { service, countQueries } = makeHarness({
    references: { providerLeadAdditionalSubcategory: [{ subcategoryId: "fuites" }] },
  });

  await assert.rejects(
    () => service.updateCategory(admin, "cat_1", { isActive: false }),
    (error: unknown) => {
      hasCode(409, "REFERENCED")(error);
      assert.deepEqual(((error as HttpException).getResponse() as { counts: unknown }).counts, {
        providers: 0,
        bookings: 0,
        leads: 1,
      });
      return true;
    },
  );
  assert.deepEqual(countQueries[0], { subcategoryId: { in: ["plomberie", "fuites", "peinture"] } });
});

test("deleting a subcategory checks its level-3 children too", async () => {
  const { service, deleted } = makeHarness({ references: { booking: [{ subcategoryId: "fuites" }] } });
  await assert.rejects(() => service.deleteSubcategory(admin, "plomberie"), hasCode(409, "REFERENCED"));
  assert.deepEqual(deleted, []);

  const ok = await service.deleteSubcategory(admin, "peinture", "10.0.0.1");
  assert.deepEqual(ok, { ok: true });
  assert.deepEqual(deleted, ["peinture"]);
});

test("deleting an unreferenced category retires its scoped skills and journals the ip", async () => {
  const { service, deleted, disabledSkills, logs } = makeHarness();
  await service.deleteCategory(admin, "cat_1", "10.0.0.4");
  assert.deepEqual(deleted, ["cat_1"]);
  assert.deepEqual(disabledSkills, [{ where: { categoryId: "cat_1" }, data: { active: false } }]);
  assert.equal(logs[0]!.action, "category.delete");
  assert.equal(logs[0]!.ipAddress, "10.0.0.4");
});

test("subcategories nest at most three levels and slugs stay unique", async () => {
  const { service, logs } = makeHarness();

  await assert.rejects(
    () => service.createSubcategory(admin, { categoryId: "cat_1", parentId: "fuites", name: "Trop profond", slug: "profond" }),
    hasCode(400, "INVALID_REFERENCE"),
  );
  await assert.rejects(
    () => service.createSubcategory(admin, { categoryId: "cat_1", parentId: "plomberie", name: "Doublon", slug: "fuites" }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(
    () => service.createSubcategory(admin, { categoryId: "cat_x", name: "Orphelin", slug: "orphelin" }),
    hasCode(400, "INVALID_REFERENCE"),
  );

  const node = await service.createSubcategory(admin, {
    categoryId: "cat_1",
    parentId: "plomberie",
    name: "Robinetterie",
    slug: "robinetterie",
  });
  assert.equal(node.level, 3);
  assert.equal(node.parentId, "plomberie");
  assert.equal(node.order, 1);
  assert.equal(logs[0]!.action, "subcategory.create");
});

test("category slug conflicts and unknown ids are reported", async () => {
  const { service } = makeHarness();
  await assert.rejects(
    () => service.createCategory(admin, { name: "Autre", slug: "batiment" }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(() => service.get("missing"), hasCode(404, "NOT_FOUND"));
  const created = await service.createCategory(admin, { name: "Beauté", slug: "beaute" });
  assert.equal(created.level, 1);
  assert.equal(created.order, 1);
  assert.deepEqual(created.counts, { providers: 0, bookings: 0, leads: 0 });
});
