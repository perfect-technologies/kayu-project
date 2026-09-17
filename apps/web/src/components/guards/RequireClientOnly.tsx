"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthBootScreen } from "./AuthBootScreen";
import { RequireRole } from "./RequireRole";

function AdminRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";
  useEffect(() => {
    if (isAdmin) router.replace("/admin");
  }, [isAdmin, router]);
  return isAdmin ? <AuthBootScreen /> : <>{children}</>;
}

/**
 * Client-only screens whose endpoints (`/addresses`, `/reviews/mine`, `/dashboard/client`) refuse admins:
 * PROVIDER → `/mon-espace`, ADMIN → `/admin`, anonymous → `/login?returnTo=` (07 guard matrix).
 */
export function RequireClientOnly({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="CLIENT">
      <AdminRedirect>{children}</AdminRedirect>
    </RequireRole>
  );
}
