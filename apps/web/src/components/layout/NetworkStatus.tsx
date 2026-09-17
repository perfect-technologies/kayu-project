"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { shellCopy } from "@/copy/shell";

type Banner = "hidden" | "offline" | "restored";

export function NetworkStatus() {
  const [banner, setBanner] = useState<Banner>("hidden");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const goOffline = () => {
      clearTimeout(timer);
      setBanner("offline");
    };
    const goOnline = () => {
      setBanner((current) => (current === "offline" ? "restored" : current));
      clearTimeout(timer);
      timer = setTimeout(() => setBanner("hidden"), 1000);
    };
    if (!navigator.onLine) setBanner("offline");
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (banner === "hidden") return null;
  const offline = banner === "offline";
  return (
    <div
      role="status"
      className={
        offline
          ? "fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950"
          : "fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-emerald-100 px-4 py-2 text-center text-xs font-semibold text-emerald-900"
      }
    >
      {offline ? <WifiOff size={15} aria-hidden /> : <Wifi size={15} aria-hidden />}
      {offline ? shellCopy.offline.offline : shellCopy.offline.online}
    </div>
  );
}
