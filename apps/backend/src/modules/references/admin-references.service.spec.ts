import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { AdminReferencesService } from "./admin-references.service";

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
    if (key === "NOT") return !matches(row, condition);
    if (condition !== null && typeof condition === "object") {
      if ("startsWith" in condition) return String(row[key]).startsWith(condition.startsWith);
      if ("in" in condition) return condition.in.includes(row[key]);
    }
    return (row[key] ?? null) === condition;
  });
}

function item(id: string, type: string, label: string, extra: Row = {}): Row {
  return {
    id,
    type,
    label,
    slug: id,
    aliases: [],
    categoryId: null,
    order: 0,
    active: true,
    suggested: true,
    mergedIntoId: null,
    source: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...extra,
  };
}

function linkDelegate(rows: Row[]) {
  return {
    findMany: async ({ where }: Row) => rows.filter((row) => matches(row, where)),
    deleteMany: async ({ where }: Row) => {
      const doomed = rows.filter((row) => matches(row, where));
      doomed.forEach((row) => rows.splice(rows.indexOf(row), 1));
      return { count: doomed.length };
    },
    updateMany: async ({ where, data }: Row) => {
      const moved = rows.filter((row) => matches(row, where));
      moved.forEach((row) => Object.assign(row, data));
      return { count: moved.length };
    },
  };
}

function makeHarness(items: Row[], links: { skills?: Row[]; refs?: Row[] } = {}) {
  const logs: Row[] = [];
  const skills = links.skills ?? [];
  const refs = links.refs ?? [];
  const providerUpdates: Row[] = [];
  let nextId = 1;
  const withCount = (row: Row) => ({
    ...row,
    _count: {
      providerSkills: skills.filter((link) => link.itemId === row.id).length,
      providerRefs: refs.filter((link) => link.itemId === row.id).length,
    },
  });
  const tx = {
    referenceItem: {
      findUnique: async ({ where }: Row) => items.find((row) => row.id === where.id) ?? null,
      findUniqueOrThrow: async ({ where }: Row) => withCount(items.find((row) => row.id === where.id)!),
      findMany: async ({ where }: Row) => items.filter((row) => matches(row, where)),
      aggregate: async ({ where }: Row) => ({
        _max: { order: Math.max(-1, ...items.filter((row) => matches(row, where)).map((row) => row.order)) },
      }),
      create: async ({ data }: Row) => {
        const row = item(`ref_new_${nextId++}`, data.type, data.label, data);
        items.push(row);
        return withCount(row);
      },
      update: async ({ where, data }: Row) => {
        const row = items.find((candidate) => candidate.id === where.id)!;
        for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value;
        return withCount(row);
      },
      updateMany: async ({ where, data }: Row) => {
        const rows = items.filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
    },
    category: {
      findUnique: async ({ where }: Row) => (where.id === "cat_1" ? { id: "cat_1" } : null),
    },
    providerSkill: linkDelegate(skills),
    providerReference: linkDelegate(refs),
    provider: {
      updateMany: async (args: Row) => {
        providerUpdates.push(args);
        return { count: 1 };
      },
    },
  };
  const prisma = { ...tx, $transaction: async (run: (client: Row) => unknown) => run(tx) };
  const service = new AdminReferencesService(prisma as never, { log: async (entry: Row) => logs.push(entry) } as never);
  return { service, items, skills, refs, providerUpdates, logs };
}

test("create slugs by type, appends after the last order and journals the ip", async () => {
  const { service, logs } = makeHarness([
    item("language-francais", "LANGUAGE", "Français", { slug: "language-francais", order: 0 }),
    item("language-kikongo", "LANGUAGE", "Kikongo", { slug: "language-kikongo", order: 3 }),
    item("x", "PRICE_UNIT", "Par m²", { slug: "price-unit-par-m2" }),
  ]);

  const created = await service.create(admin, { type: "LANGUAGE", label: "Kiswahili", aliases: [] }, "10.0.0.9");
  assert.equal(created.slug, "language-kiswahili");
  assert.equal(created.order, 4);
  assert.equal(created.usageCount, 0);
  assert.equal(logs[0]!.action, "reference.create");
  assert.equal(logs[0]!.ipAddress, "10.0.0.9");

  const unit = await service.create(admin, { type: "PRICE_UNIT", label: "Par M² carré", aliases: [] });
  assert.equal(unit.slug, "price-unit-par-m2-carre");
});

test("create refuses duplicate labels within a type and scope, and categories on non-skills", async () => {
  const { service } = makeHarness([
    item("fr", "LANGUAGE", "Français"),
    item("sk", "SKILL", "Fuites", { categoryId: "cat_1" }),
  ]);
  await assert.rejects(
    () => service.create(admin, { type: "LANGUAGE", label: "francais", aliases: [] }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(
    () => service.create(admin, { type: "SKILL", label: "FUITES", categoryId: "cat_1", aliases: [] }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  const global = await service.create(admin, { type: "SKILL", label: "Fuites", aliases: [] });
  assert.equal(global.slug, "skill-custom-fuites");
  assert.equal(global.categoryId, null);
  await assert.rejects(
    () => service.create(admin, { type: "LANGUAGE", label: "Lingala", categoryId: "cat_1", aliases: [] }),
    hasCode(400, "INVALID_REFERENCE"),
  );
  await assert.rejects(
    () => service.create(admin, { type: "SKILL", label: "Joints", categoryId: "cat_x", aliases: [] }),
    hasCode(400, "INVALID_REFERENCE"),
  );
});

test("merge moves provider links without breaking the (provider, item) key and repoints pricing", async () => {
  const skills = [
    { providerId: "p1", itemId: "old" },
    { providerId: "p2", itemId: "old" },
    { providerId: "p2", itemId: "new" },
  ];
  const refs = [{ providerId: "p3", itemId: "old", kind: "LANGUAGE" }];
  const { service, items, providerUpdates, logs } = makeHarness(
    [item("old", "CURRENCY", "Franc"), item("new", "CURRENCY", "CDF"), item("older", "CURRENCY", "FC", { active: false, mergedIntoId: "old" })],
    { skills, refs },
  );

  const result = await service.merge(admin, { fromId: "old", intoId: "new" }, "10.0.0.5");

  assert.deepEqual(
    skills.map((link) => `${link.providerId}:${link.itemId}`).sort(),
    ["p1:new", "p2:new"],
  );
  assert.deepEqual(refs, [{ providerId: "p3", itemId: "new", kind: "LANGUAGE" }]);
  assert.deepEqual(providerUpdates, [
    { where: { pricingCurrencyId: "old" }, data: { pricingCurrencyId: "new" } },
    { where: { pricingUnitId: "old" }, data: { pricingUnitId: "new" } },
  ]);
  assert.equal(items.find((row) => row.id === "older")!.mergedIntoId, "new");
  assert.equal(result.from.active, false);
  assert.equal(result.from.mergedIntoId, "new");
  assert.equal(result.into.usageCount, 3);
  assert.deepEqual(result.repointed, { providerSkills: 2, providerReferences: 1, pricing: 2 });
  assert.equal(logs[0]!.action, "reference.merge");
});

test("merge refuses different types, other skill scopes, merged sources and inactive targets", async () => {
  const { service } = makeHarness([
    item("fr", "LANGUAGE", "Français"),
    item("cdf", "CURRENCY", "CDF"),
    item("sk1", "SKILL", "A", { categoryId: "cat_1" }),
    item("sk2", "SKILL", "B", { categoryId: "cat_2" }),
    item("gone", "LANGUAGE", "Old", { active: false, mergedIntoId: "fr" }),
    item("off", "LANGUAGE", "Off", { active: false }),
  ]);
  for (const [fromId, intoId] of [
    ["fr", "cdf"],
    ["sk1", "sk2"],
    ["gone", "fr"],
    ["fr", "off"],
  ]) {
    await assert.rejects(() => service.merge(admin, { fromId: fromId!, intoId: intoId! }), hasCode(409, "INVALID_TRANSITION"));
  }
  await assert.rejects(() => service.merge(admin, { fromId: "fr", intoId: "missing" }), hasCode(404, "NOT_FOUND"));
});

test("update checks duplicates in the new scope and refuses reactivating merged items", async () => {
  const { service } = makeHarness([
    item("a", "SKILL", "Fuites", { categoryId: "cat_1" }),
    item("b", "SKILL", "Fuites"),
    item("m", "LANGUAGE", "Old", { active: false, mergedIntoId: "x" }),
  ]);
  await assert.rejects(() => service.update(admin, "b", { categoryId: "cat_1" }), hasCode(409, "ALREADY_EXISTS"));
  await assert.rejects(() => service.update(admin, "m", { active: true }), hasCode(409, "INVALID_TRANSITION"));
  const renamed = await service.update(admin, "b", { label: "Débouchage" });
  assert.equal(renamed.label, "Débouchage");
});
