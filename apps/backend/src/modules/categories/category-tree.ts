import type { Category, Subcategory } from "@prisma/client";

export type CategoryRow = Pick<
  Category,
  "id" | "slug" | "name" | "description" | "icon" | "color" | "image" | "order" | "isActive"
>;
export type SubcategoryRow = Pick<
  Subcategory,
  "id" | "categoryId" | "parentId" | "slug" | "name" | "description" | "icon" | "order" | "isActive"
>;

export type CountMap = Map<string, number>;

export function countMap(rows: Array<{ key: string | null; count: number }>): CountMap {
  const map: CountMap = new Map();
  for (const row of rows) {
    if (row.key) map.set(row.key, (map.get(row.key) ?? 0) + row.count);
  }
  return map;
}

export function mergeCounts(...maps: CountMap[]): CountMap {
  const merged: CountMap = new Map();
  for (const map of maps) {
    for (const [key, count] of map) merged.set(key, (merged.get(key) ?? 0) + count);
  }
  return merged;
}

// Rolls direct counts up the three-level tree: level 2 includes its level-3 children, a category
// includes every subcategory it owns (active or not, since references survive deactivation).
export function rollUp(subcategories: SubcategoryRow[], direct: CountMap) {
  const bySubcategory: CountMap = new Map();
  const byCategory: CountMap = new Map();
  for (const sub of subcategories) {
    const own = direct.get(sub.id) ?? 0;
    bySubcategory.set(sub.id, (bySubcategory.get(sub.id) ?? 0) + own);
    if (sub.parentId) {
      bySubcategory.set(sub.parentId, (bySubcategory.get(sub.parentId) ?? 0) + own);
    }
    byCategory.set(sub.categoryId, (byCategory.get(sub.categoryId) ?? 0) + own);
  }
  return { bySubcategory, byCategory };
}

export type TreeNode<Extra> = Extra & {
  id: string;
  slug: string;
  name: string;
  level: 1 | 2 | 3;
  children: Array<TreeNode<Extra>>;
};

export function buildTree<Extra>(
  categories: CategoryRow[],
  subcategories: SubcategoryRow[],
  options: {
    activeOnly: boolean;
    category: (row: CategoryRow) => Extra;
    subcategory: (row: SubcategoryRow, level: 2 | 3) => Extra;
  },
): Array<TreeNode<Extra>> {
  const visible = (row: { isActive: boolean }) => !options.activeOnly || row.isActive;

  return categories.filter(visible).map((category) => {
    const secondLevel = subcategories.filter(
      (sub) => sub.categoryId === category.id && sub.parentId === null && visible(sub),
    );
    return {
      ...options.category(category),
      id: category.id,
      slug: category.slug,
      name: category.name,
      level: 1 as const,
      children: secondLevel.map((sub) => ({
        ...options.subcategory(sub, 2),
        id: sub.id,
        slug: sub.slug,
        name: sub.name,
        level: 2 as const,
        children: subcategories
          .filter((child) => child.parentId === sub.id && visible(child))
          .map((child) => ({
            ...options.subcategory(child, 3),
            id: child.id,
            slug: child.slug,
            name: child.name,
            level: 3 as const,
            children: [],
          })),
      })),
    };
  });
}

export function findNode<Extra>(nodes: Array<TreeNode<Extra>>, id: string): TreeNode<Extra> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export const subcategorySelect = {
  id: true,
  categoryId: true,
  parentId: true,
  slug: true,
  name: true,
  description: true,
  icon: true,
  order: true,
  isActive: true,
} as const;

export const treeOrder = [{ order: "asc" as const }, { name: "asc" as const }];
