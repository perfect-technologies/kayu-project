import type { CategoryChainItem, PlaceSummary, ProviderCard, ProviderPublic } from "@kayu/schemas";
import { categoryColorClasses } from "./categoryColors";
import { providerCopy } from "@/copy/provider";

export type TierBadgeKind = "verified" | "boosted" | "elite";

/** Elite and Boosted come from the tier; Vérifié from the tier or the KYC status. */
export function tierBadgeKind(
  provider: Pick<ProviderCard, "premiumTier" | "verified">,
): TierBadgeKind | null {
  if (provider.premiumTier === "ELITE") return "elite";
  if (provider.premiumTier === "BOOSTED") return "boosted";
  if (provider.premiumTier === "VERIFIED" || provider.verified) return "verified";
  return null;
}

export function rootCategory(chain: CategoryChainItem[]): CategoryChainItem | null {
  return chain[0] ?? null;
}

export function deepestCategory(chain: CategoryChainItem[]): CategoryChainItem | null {
  return chain.length > 0 ? chain[chain.length - 1]! : null;
}

export function categoryColorClass(slug: string | null | undefined): string {
  return (slug && categoryColorClasses[slug]) || "bg-primary";
}

export function cityOf(chain: PlaceSummary[]): PlaceSummary | null {
  return chain.find((place) => place.kind === "CITY") ?? chain[chain.length - 1] ?? null;
}

export function countryShort(chain: PlaceSummary[]): string | null {
  const country = chain.find((place) => place.kind === "COUNTRY");
  if (!country) return null;
  if (/d[ée]mocratique|RDC/i.test(country.label)) return providerCopy.header.countryRdc;
  return providerCopy.header.countryCongo;
}

/** "Kinshasa, RDC" for the meta row; the city alone for cards. */
export function placeLabel(chain: PlaceSummary[]): string {
  const city = cityOf(chain);
  const country = countryShort(chain);
  if (city && country && city.kind !== "COUNTRY") return `${city.label}, ${country}`;
  return city?.label ?? country ?? "";
}

export function placeChainLabel(chain: PlaceSummary[]): string {
  return chain
    .filter((place) => place.kind !== "COUNTRY")
    .map((place) => place.label)
    .join(", ");
}

export function formatRating(value: number, count: number): string {
  return count > 0 ? value.toFixed(1) : providerCopy.header.noRating;
}

export function whatsappLink(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
}

export function imageMedia(provider: Pick<ProviderPublic, "media">) {
  return provider.media.filter((item) => item.kind === "IMAGE").sort((a, b) => a.order - b.order);
}

export function videoMedia(provider: Pick<ProviderPublic, "media">) {
  return provider.media.filter((item) => item.kind !== "IMAGE").sort((a, b) => a.order - b.order);
}
