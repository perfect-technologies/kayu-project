"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, settingsApi } from "@kayu/api";
import { SITE_SETTING_DEFAULTS, type SiteSettings } from "@kayu/schemas";
import { apiClient } from "@/lib/api";

export function useSiteSettings(): { settings: SiteSettings; isLoading: boolean } {
  const query = useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: () => settingsApi(apiClient).getPublic(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { settings: query.data ?? SITE_SETTING_DEFAULTS, isLoading: query.isLoading };
}

/** Returns the admin-edited value, or the copy-module default when the setting is empty. */
export function settingOr(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}
