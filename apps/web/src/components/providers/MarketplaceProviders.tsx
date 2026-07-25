"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "./QueryProvider";

export default function MarketplaceProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
