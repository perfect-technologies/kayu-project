"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthBootScreen } from "./AuthBootScreen";
import { ProtectedRoute } from "./ProtectedRoute";

function NoProviderCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const providerId = user?.provider?.id ?? null;

  useEffect(() => {
    if (providerId) router.replace(`/prestataire/${encodeURIComponent(providerId)}/modifier`);
  }, [providerId, router]);

  return providerId ? <AuthBootScreen /> : <>{children}</>;
}

/** /prestataire/nouveau: a user who already owns a provider row is sent to their editor. */
export function RequireNotProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <NoProviderCheck>{children}</NoProviderCheck>
    </ProtectedRoute>
  );
}
