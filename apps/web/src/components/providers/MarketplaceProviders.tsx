"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { InteractionEffects } from "@/components/layout/InteractionEffects";
import { NetworkStatus } from "@/components/layout/NetworkStatus";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { AuthGate } from "./AuthGate";
import { QueryProvider } from "./QueryProvider";

export default function MarketplaceProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <NetworkStatus />
        <AuthGate>{children}</AuthGate>
        <InteractionEffects />
        <ScrollToTop />
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
