"use client";

import { useQuery, type Query } from "@tanstack/react-query";
import { mediaApi, queryKeys } from "@kayu/api";
import type { SignReadResponse } from "@kayu/schemas";
import { apiClient } from "@/lib/api";

const SAFETY_MS = 30_000;
type SignReadQuery = Query<SignReadResponse, Error, SignReadResponse, ReturnType<typeof queryKeys.media.signRead>>;

function remaining(query: SignReadQuery): number {
  const data = query.state.data;
  if (!data) return 0;
  return Math.max(0, new Date(data.expiresAt).getTime() - Date.now() - SAFETY_MS);
}

/** `GET /me/media/sign-read?path=` cached for the URL lifetime (expiry − 30 s). */
export function useSignedAttachment(path: string) {
  return useQuery<SignReadResponse, Error, SignReadResponse, ReturnType<typeof queryKeys.media.signRead>>({
    queryKey: queryKeys.media.signRead(path),
    queryFn: () => mediaApi(apiClient).signRead(path),
    staleTime: (query: SignReadQuery) => remaining(query),
    // The signed URL lives 5 minutes; keep the entry a little longer than one lifetime.
    gcTime: 6 * 60_000,
    retry: 1,
  });
}
