"use client";

import { usePathname } from "next/navigation";

export const FOOTER_ROUTES = ["/", "/services", "/contact", "/cgu", "/confidentialite"] as const;

/** The compact footer shows only on the five public routes and never in signed-in journeys. */
export function FooterSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!pathname || !(FOOTER_ROUTES as readonly string[]).includes(pathname)) return null;
  return <>{children}</>;
}
