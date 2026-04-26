"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/pro/onboarding")) {
    return <>{children}</>;
  }

  return <AppShell mobileTitle="Mon espace pro">{children}</AppShell>;
}
