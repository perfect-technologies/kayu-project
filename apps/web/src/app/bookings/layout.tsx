import { AppShell } from '@/components/layout/AppShell';

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell mobileTitle="Mes réservations">{children}</AppShell>;
}
