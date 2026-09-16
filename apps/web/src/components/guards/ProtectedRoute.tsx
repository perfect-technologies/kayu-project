"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { currentLocation, loginPath } from "@/lib/auth-redirects";
import { AuthBootScreen } from "./AuthBootScreen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace(loginPath(currentLocation()));
  }, [status, router]);

  if (status === "ready") return <>{children}</>;
  return <AuthBootScreen />;
}
