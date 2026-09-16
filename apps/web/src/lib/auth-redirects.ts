import type { AuthUser } from "@/contexts/AuthContext";

/** Accepts only same-origin relative paths: starts with "/" and not "//". */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\r\n]/.test(value)) return null;
  return value;
}

export function loginPath(returnTo?: string | null): string {
  const safe = safeReturnTo(returnTo);
  if (!safe || safe === "/") return "/login";
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}

export function registerPath(returnTo?: string | null): string {
  const safe = safeReturnTo(returnTo);
  if (!safe || safe === "/") return "/register";
  return `/register?returnTo=${encodeURIComponent(safe)}`;
}

export function currentLocation(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function returnToFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return safeReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
}

/** Contract §2 redirect matrix, applied after a successful sign-in. */
export function postLoginDestination(user: AuthUser, returnTo?: string | null): string {
  const safe = safeReturnTo(returnTo);
  if (safe) return safe;
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "PROVIDER" && !user.provider) return "/prestataire/nouveau";
  return "/";
}

/** Where a signed-in user lands when they open a screen meant for the other role. */
export function roleHome(role: AuthUser["role"]): string {
  return role === "PROVIDER" ? "/mon-espace" : "/mes-reservations";
}
