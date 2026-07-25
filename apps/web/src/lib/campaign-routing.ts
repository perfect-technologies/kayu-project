const CAMPAIGN_PUBLIC_PREFIXES = [
  "/services",
  "/categories",
  "/providers",
  "/book",
  "/review",
] as const;

export function isCampaignPublicMarketplacePath(pathname: string): boolean {
  return CAMPAIGN_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
