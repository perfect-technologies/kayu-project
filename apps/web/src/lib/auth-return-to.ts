import type { AuthUser } from "@/contexts/AuthContext";
import { safeReturnTo } from "./auth-redirects";

export type SignupIntent = "client" | "provider";

const INTENT_KEY = "kayou.signupIntent";
const AUTH_PATHS = new Set(["/login", "/register", "/bienvenue"]);

/** A `returnTo` that may be followed after sign-in: same-origin, and not an auth screen. */
export function usableReturnTo(raw: string | null | undefined): string | null {
  const safe = safeReturnTo(raw);
  if (!safe) return null;
  const pathname = safe.split(/[?#]/)[0] ?? safe;
  return AUTH_PATHS.has(pathname) ? null : safe;
}

export function readSignupIntent(): SignupIntent | null {
  try {
    const value = window.sessionStorage.getItem(INTENT_KEY);
    return value === "client" || value === "provider" ? value : null;
  } catch {
    return null;
  }
}

export function writeSignupIntent(intent: SignupIntent): void {
  try {
    window.sessionStorage.setItem(INTENT_KEY, intent);
  } catch {
    // Private mode or storage denied: the intent is only a routing hint.
  }
}

export function clearSignupIntent(): void {
  try {
    window.sessionStorage.removeItem(INTENT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Post-auth routing matrix (06 doc, contract §2), shared by /login, /register and the guards:
 * ADMIN → /admin; safe returnTo → returnTo; provider intent without a provider row → wizard;
 * PROVIDER → /mon-espace; otherwise /rechercher.
 */
export function postAuthDestination(
  user: Pick<AuthUser, "role" | "provider">,
  options: { returnTo?: string | null; signupIntent?: SignupIntent | null } = {},
): string {
  if (user.role === "ADMIN") return "/admin";
  const returnTo = usableReturnTo(options.returnTo);
  if (returnTo) return returnTo;
  if (options.signupIntent === "provider" && user.provider === null) return "/prestataire/nouveau";
  if (user.role === "PROVIDER") return "/mon-espace";
  return "/rechercher";
}

/** Where an already signed-in visitor of /login or /register is sent. */
export function roleLanding(user: Pick<AuthUser, "role">): string {
  if (user.role === "ADMIN") return "/admin";
  return user.role === "PROVIDER" ? "/mon-espace" : "/mes-reservations";
}
