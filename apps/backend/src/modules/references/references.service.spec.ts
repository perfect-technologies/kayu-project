import assert from "node:assert/strict";
import test from "node:test";
import { ReferencesService } from "./references.service";

test("public list keeps active, suggested, non-merged items and widens a skill category to global skills", async () => {
  const calls: Record<string, any> = {};
  const prisma = {
    referenceItem: {
      count: async (args: unknown) => {
        calls.count = args;
        return 1;
      },
      findMany: async (args: unknown) => {
        calls.findMany = args;
        return [{ id: "skill_1", type: "SKILL", label: "Fuites", categoryId: "cat_1" }];
      },
    },
  };
  const service = new ReferencesService(prisma as never);

  const page = await service.list({ type: "SKILL", categoryId: "cat_1", q: "fu", page: 1, limit: 100 });

  assert.deepEqual(calls.count.where, {
    AND: [
      { type: "SKILL", active: true, suggested: true, mergedIntoId: null },
      { OR: [{ categoryId: "cat_1" }, { categoryId: null }] },
      { OR: [{ label: { contains: "fu", mode: "insensitive" } }, { aliases: { has: "fu" } }] },
    ],
  });
  assert.deepEqual(calls.findMany.orderBy, [{ order: "asc" }, { label: "asc" }, { id: "asc" }]);
  assert.deepEqual(page, {
    items: [{ id: "skill_1", type: "SKILL", label: "Fuites", categoryId: "cat_1" }],
    total: 1,
    page: 1,
    limit: 100,
  });

  await service.list({ type: "LANGUAGE", page: 1, limit: 100 });
  assert.deepEqual(calls.count.where, {
    AND: [{ type: "LANGUAGE", active: true, suggested: true, mergedIntoId: null }],
  });
});
