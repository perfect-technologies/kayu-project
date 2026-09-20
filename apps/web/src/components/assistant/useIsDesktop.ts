"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

/** True from `lg` up, where the conversation list is a persistent sidebar instead of a drawer. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(DESKTOP_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
