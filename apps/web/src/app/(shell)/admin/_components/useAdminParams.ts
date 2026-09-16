"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ParamPatch = Record<string, string | number | null | undefined>;

/** The URL is the console state: `?tab`, `?q`, `?page`, `?id`, `?sub`. Empty values remove the key. */
export function useAdminParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefWith = useCallback(
    (patch: ParamPatch) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [params, pathname],
  );

  const set = useCallback(
    (patch: ParamPatch, options?: { push?: boolean }) => {
      const href = hrefWith(patch);
      if (options?.push) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [hrefWith, router],
  );

  const page = Number(params.get("page") ?? 1);
  return {
    params,
    set,
    hrefWith,
    tab: params.get("tab") ?? "overview",
    q: params.get("q") ?? "",
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    id: params.get("id"),
    sub: params.get("sub"),
  };
}
