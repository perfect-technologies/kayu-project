import { AppShell } from "@/components/layout/AppShell";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell mobileTitle="Messages">{children}</AppShell>;
}
