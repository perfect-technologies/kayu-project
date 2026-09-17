"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriesApi, queryKeys } from "@kayu/api";
import type { CategoryTreeNode } from "@kayu/schemas";
import { apiClient } from "@/lib/api";

export function useCategoryTree(initialData?: CategoryTreeNode[]) {
  const query = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: async () => (await categoriesApi(apiClient).getTree()).items,
    staleTime: 5 * 60 * 1000,
    initialData,
  });
  return { tree: query.data ?? [], isLoading: query.isLoading };
}
