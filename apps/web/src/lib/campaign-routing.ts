const CAMPAIGN_PUBLIC_PREFIXES = [
  "/services",
  "/categories",
  "/providers",
  "/book",
  "/review",
] as const;

export type PublicWebMode = "campaign" | "marketplace";

export function resolvePublicWebMode(
  configuredMode: string | undefined,
): PublicWebMode {
  return configuredMode === "campaign" ? "campaign" : "marketplace";
}

export function isCampaignPublicMarketplacePath(pathname: string): boolean {
  return CAMPAIGN_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isCampaignShellPath(pathname: string): boolean {
  return pathname === "/launch" || pathname.startsWith("/launch/");
}

export function isCampaignAuthRequest(
  pathname: string,
  publicMode: PublicWebMode,
): boolean {
  return publicMode === "campaign" && pathname === "/auth";
}

export function shouldCreateAuthUser(
  mode: "signup" | "login",
  signupEnabled: boolean,
): boolean {
  return signupEnabled && mode === "signup";
}

export function campaignScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
