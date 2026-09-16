import type { CategoryTreeNode } from "@kayu/schemas";

/** Root node for a provider's category chain (slug of the level-1 node). */
export function findRoot(tree: CategoryTreeNode[] | undefined, slug: string | null | undefined) {
  if (!tree || !slug) return null;
  return tree.find((node) => node.slug === slug) ?? null;
}

export function findNode(tree: CategoryTreeNode[] | undefined, id: string | null | undefined) {
  if (!tree || !id) return null;
  const stack = [...tree];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.id === id) return node;
    stack.push(...node.children);
  }
  return null;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
