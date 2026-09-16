"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { roleHome } from "@/lib/auth-redirects";
import { AuthBootScreen } from "./AuthBootScreen";
import { ProtectedRoute } from "./ProtectedRoute";

export type GuardedRole = "CLIENT" | "PROVIDER";

/** Admins browse client screens as clients (contract §2). */
export function hasRole(user: AuthUser | null, role: GuardedRole): boolean {
  if (!user) return false;
  if (role === "CLIENT") return user.role === "CLIENT" || user.role === "ADMIN";
  return user.role === "PROVIDER";
}

function RoleCheck({
  role,
  redirectTo,
  children,
}: {
  role: GuardedRole;
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = hasRole(user, role);
  const destination = redirectTo ?? (role === "CLIENT" ? roleHome("PROVIDER") : roleHome("CLIENT"));

  useEffect(() => {
    if (!allowed) router.replace(destination);
  }, [allowed, destination, router]);

  return allowed ? <>{children}</> : <AuthBootScreen />;
}

export function RequireRole(props: { role: GuardedRole; redirectTo?: string; children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <RoleCheck {...props} />
    </ProtectedRoute>
  );
}
