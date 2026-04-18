import { AppShell } from "@/components/layout/AppShell";

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell mobileTitle="Mon espace pro">{children}</AppShell>;
}
