"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthBootScreen } from "./AuthBootScreen";
import { ProtectedRoute } from "./ProtectedRoute";

function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = user?.role === "ADMIN";

  useEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  return allowed ? <>{children}</> : <AuthBootScreen />;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminCheck>{children}</AdminCheck>
    </ProtectedRoute>
  );
}
