import type { PremiumTier, Prisma } from "@prisma/client";

export function searchableProviderWhere(): Prisma.ProviderWhereInput {
  return { hidden: false, user: { isActive: true } };
}

export function effectiveTier(
  provider: { premiumTier: PremiumTier; premiumUntil: Date | null },
  now: Date = new Date(),
): PremiumTier {
  if (provider.premiumTier === "FREE") return "FREE";
  if (provider.premiumUntil && provider.premiumUntil.getTime() <= now.getTime()) return "FREE";
  return provider.premiumTier;
}

export function roundCoordinate(value: number | null | undefined): number | null {
  return typeof value === "number" ? Math.round(value * 100) / 100 : null;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
