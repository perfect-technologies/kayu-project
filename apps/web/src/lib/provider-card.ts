import type { CategorySlug, ProviderCardData } from "@kayu/ui";

// Accept any shape close to the DB provider record and map it to what the
// D03 photo-forward cards expect.
type AnyProvider = {
  id?: string;
  profession?: string;
  description?: string | null;
  hourlyRate?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  responseTime?: number | null;
  isCertified?: boolean | null;
  isPremium?: boolean | null;
  isAvailable?: boolean | null;
  verificationStatus?: string | null;
  experience?: number | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    city?: string | null;
    isVerified?: boolean | null;
  } | null;
  categories?: Array<{ slug?: string | null; name?: string | null } | null> | null;
  serviceZones?: Array<{ city?: string | null; commune?: string | null } | null> | null;
};

// DB category slugs vary per seed — collapse them to the v2 portfolio palette.
const SLUG_ALIASES: Record<string, CategorySlug> = {
  "plomberie": "plomberie",
  "plombier": "plomberie",
  "electricite": "electricite",
  "electricien": "electricite",
  "menage": "menage",
  "menage-nettoyage": "menage",
  "coiffure": "coiffure",
  "coiffure-beaute": "coiffure",
  "informatique": "informatique",
  "jardinage": "jardinage",
  "peinture": "peinture",
  "transport": "transport",
  "menuiserie": "menuiserie",
  "btp-construction": "menuiserie",
  "mecanique-auto": "transport",
};

export function resolveCategorySlug(raw: string | null | undefined): CategorySlug {
  if (!raw) return "plomberie";
  const normalized = raw.toLowerCase();
  return SLUG_ALIASES[normalized] ?? "plomberie";
}

function responseFor(provider: AnyProvider): string {
  const minutes = provider.responseTime ?? 0;
  if (minutes <= 0) return "À confirmer";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
}

export function toProviderCardData(raw: AnyProvider): ProviderCardData {
  const firstName = raw.user?.firstName ?? "";
  const lastName = raw.user?.lastName ?? "";
  const initials =
    `${(firstName[0] ?? "?").toUpperCase()}${(lastName[0] ?? "").toUpperCase()}`.trim() ||
    "?";

  const primaryCategory = (raw.categories ?? []).find((c) => c?.slug)?.slug ?? null;
  const slug = resolveCategorySlug(primaryCategory);

  const commune =
    (raw.serviceZones ?? []).find((z) => z?.commune)?.commune ?? undefined;

  return {
    id: raw.id ?? "",
    firstName: firstName || "Prestataire",
    lastName: lastName || "",
    initials,
    profession: raw.profession ?? "Professionnel",
    commune: commune ?? undefined,
    city: raw.user?.city ?? undefined,
    categories: [slug],
    rating: raw.rating ?? 0,
    reviews: raw.totalReviews ?? 0,
    response: responseFor(raw),
    hourly: raw.hourlyRate ?? 0,
    verified: raw.verificationStatus === "VERIFIED",
    topRated: !!raw.isPremium || (raw.rating ?? 0) >= 4.8,
    online: !!raw.isAvailable,
    avatarUrl: raw.user?.avatar ?? undefined,
    experienceYears:
      typeof raw.experience === "number" && raw.experience > 0
        ? raw.experience
        : undefined,
  };
}
