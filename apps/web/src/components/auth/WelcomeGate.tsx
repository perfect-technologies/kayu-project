"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const ONBOARDED_KEY = "kayou_onboarded";
const PHONE_QUERY = "(max-width: 639px)";

export function isOnboarded(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboarded(): void {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Mounted on the home page: an anonymous first visit on a phone-sized viewport goes to /bienvenue.
 * Never fires for a signed-in session, on desktop, or when a `returnTo` is present.
 */
export function WelcomeGate() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "anonymous") return;
    if (isOnboarded()) return;
    if (new URLSearchParams(window.location.search).has("returnTo")) return;
    if (!window.matchMedia(PHONE_QUERY).matches) return;
    router.replace("/bienvenue");
  }, [status, router]);

  return null;
}
