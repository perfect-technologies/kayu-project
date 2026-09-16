"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { postLoginDestination, returnToFromLocation } from "@/lib/auth-redirects";

/** /login and /register: a signed-in user is sent to `returnTo` or their role landing. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const signedIn = status === "ready" && user !== null;

  useEffect(() => {
    if (signedIn) router.replace(postLoginDestination(user, returnToFromLocation()));
  }, [signedIn, user, router]);

  if (signedIn) return null;
  return <>{children}</>;
}
