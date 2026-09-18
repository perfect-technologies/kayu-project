"use client";

import { useQuery } from "@tanstack/react-query";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import type { KnownProvider } from "./types";

/** The conversation usually showed the provider already; otherwise the public profile names it (ids can come from the profile block). */
export function useProviderName(providerId: string, known: KnownProvider | null): KnownProvider | null {
  const profile = useQuery({
    queryKey: queryKeys.providers.detail(providerId),
    queryFn: () => providersApi(apiClient).getPublic(providerId),
    enabled: known === null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  if (known) return known;
  if (!profile.data) return null;
  return { id: profile.data.id, displayName: profile.data.displayName, timezone: profile.data.schedule.timezone };
}
