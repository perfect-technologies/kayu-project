"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationsApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PARAMS = { limit: 1 } as const;

/** Unread badge for the navbar bell; GET /me carries no counter, so it polls the list envelope. */
export function useUnreadNotifications(): number {
  const { status } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.notifications.list(PARAMS),
    queryFn: () => notificationsApi(apiClient).list(PARAMS),
    enabled: status === "ready",
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
  return query.data?.unreadCount ?? 0;
}
