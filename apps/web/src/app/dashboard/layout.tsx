'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Admin gets its own dedicated chrome (dark ops bar) — bypass AppShell so the
  // sidebar + generic header don't compete with the prototype Ops layout.
  if (pathname?.startsWith('/dashboard/admin')) {
    return <>{children}</>;
  }
  return <AppShell mobileTitle="Tableau de bord">{children}</AppShell>;
}
