"use client";

import { useQuery } from "@tanstack/react-query";
import { placesApi, queryKeys, referencesApi } from "@kayu/api";
import type { PlaceSummary, PlacesQueryParams, ReferenceItemSummary, ReferenceType } from "@kayu/schemas";
import { apiClient } from "@/lib/api";

const STALE = 60 * 1000;

export function useReferences(type: ReferenceType, categoryId?: string) {
  const query = useQuery({
    queryKey: queryKeys.references.list(type, categoryId, { limit: 100 }),
    queryFn: async () => (await referencesApi(apiClient).list(type, categoryId, { limit: 100 })).items,
    staleTime: STALE,
  });
  return { items: (query.data ?? []) as ReferenceItemSummary[], isLoading: query.isLoading, isError: query.isError };
}

export function usePlaces(params: PlacesQueryParams | null) {
  const query = useQuery({
    queryKey: queryKeys.places.list(params ?? undefined),
    queryFn: async () => (await placesApi(apiClient).list({ ...params, limit: 100 })).items,
    staleTime: STALE,
    enabled: params !== null,
  });
  return { items: (query.data ?? []) as PlaceSummary[], isLoading: query.isLoading, isError: query.isError };
}

export function usePlaceAncestors(placeId: string | null) {
  const query = useQuery({
    queryKey: queryKeys.places.ancestors(placeId ?? ""),
    queryFn: async () => (await placesApi(apiClient).ancestors(placeId!)).items,
    staleTime: STALE,
    enabled: Boolean(placeId),
  });
  return { chain: (query.data ?? []) as PlaceSummary[], isLoading: query.isLoading };
}
