"use client";

import { usePathname } from "next/navigation";

/** Re-keys on the pathname so every screen plays the 240 ms enter (CSS handles reduced motion). */
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="screen-enter">
      {children}
    </div>
  );
}
