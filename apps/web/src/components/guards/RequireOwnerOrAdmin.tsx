"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthBootScreen } from "./AuthBootScreen";
import { ProtectedRoute } from "./ProtectedRoute";

function OwnerCheck({ providerId, children }: { providerId: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = user?.role === "ADMIN" || user?.provider?.id === providerId;

  useEffect(() => {
    if (!allowed) router.replace(`/prestataire/${encodeURIComponent(providerId)}`);
  }, [allowed, providerId, router]);

  return allowed ? <>{children}</> : <AuthBootScreen />;
}

/** For /prestataire/[id]/modifier: the provider's owner (matched on `me.provider.id`) or an admin. */
export function RequireOwnerOrAdmin(props: { providerId: string; children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OwnerCheck {...props} />
    </ProtectedRoute>
  );
}
