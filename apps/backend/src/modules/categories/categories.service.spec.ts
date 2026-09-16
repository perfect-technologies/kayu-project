import assert from "node:assert/strict";
import test from "node:test";
import { CategoriesService } from "./categories.service";

const sub = (id: string, categoryId: string, parentId: string | null, isActive = true) => ({
  id,
  categoryId,
  parentId,
  slug: id,
  name: id,
  description: null,
  icon: null,
  order: 0,
  isActive,
});

test("tree keeps active nodes and rolls visible provider counts up to every ancestor", async () => {
  let providerWhere: unknown;
  const prisma = {
    category: {
      findMany: async ({ where }: { where: unknown }) => {
        assert.deepEqual(where, { isActive: true });
        return [
          { id: "cat_build", slug: "batiment", name: "Bâtiment", icon: "House", color: "bg-amber-500", image: null, isActive: true },
        ];
      },
    },
    subcategory: {
      findMany: async () => [
        sub("plomberie", "cat_build", null),
        sub("fuites", "cat_build", "plomberie"),
        sub("sanitaires", "cat_build", "plomberie", false),
        sub("old", "cat_build", null, false),
        sub("fuites_old", "cat_build", "old"),
      ],
    },
    provider: {
      groupBy: async ({ where }: { where: unknown }) => {
        providerWhere = where;
        return [
          { subcategoryId: "fuites", _count: { _all: 2 } },
          { subcategoryId: "plomberie", _count: { _all: 1 } },
          { subcategoryId: "sanitaires", _count: { _all: 4 } },
          { subcategoryId: "fuites_old", _count: { _all: 5 } },
        ];
      },
    },
  };

  const { items } = await new CategoriesService(prisma as never).tree();

  assert.deepEqual(providerWhere, { hidden: false, user: { isActive: true } });
  assert.equal(items.length, 1);
  const category = items[0]!;
  assert.equal(category.level, 1);
  assert.equal(category.color, "bg-amber-500");
  assert.equal(category.providerCount, 12);
  assert.deepEqual(
    category.children.map((node) => [node.id, node.level, node.providerCount]),
    [["plomberie", 2, 7]],
  );
  assert.deepEqual(
    category.children[0]!.children.map((node) => [node.id, node.level, node.providerCount, node.children.length]),
    [["fuites", 3, 2, 0]],
  );
});
