"use client";

import { useEffect, useState } from "react";

export const POLL_INTERVAL_MS = 15_000;

/** Query options polling every 15 s while the tab is visible, off otherwise (contract: polling, no realtime). */
export function useConversationPolling() {
  const [visible, setVisible] = useState(() => (typeof document === "undefined" ? true : document.visibilityState === "visible"));

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return {
    visible,
    refetchInterval: visible ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  } as const;
}
