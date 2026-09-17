"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AcceptTermsScreen } from "@/components/layout/AcceptTermsScreen";
import { SuspendedScreen } from "@/components/layout/SuspendedScreen";

// /login and /register collect the name and the terms inline as OTP steps (06).
const INLINE_TERMS_PATHS = new Set(["/login", "/register"]);

/** Replaces every route with the suspended notice or the terms screen; public content still SSRs. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  if (status === "suspended") return <SuspendedScreen />;
  if (status === "needs-terms" && !INLINE_TERMS_PATHS.has(pathname)) return <AcceptTermsScreen />;
  return <>{children}</>;
}
