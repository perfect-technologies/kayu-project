"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AcceptTermsScreen } from "@/components/layout/AcceptTermsScreen";
import { SuspendedScreen } from "@/components/layout/SuspendedScreen";

/** Replaces every route with the suspended notice or the terms screen; public content still SSRs. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "suspended") return <SuspendedScreen />;
  if (status === "needs-terms") return <AcceptTermsScreen />;
  return <>{children}</>;
}
