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

export type CategoryDisplay = {
  name: string;
  icon: string | null;
  color: string | null;
};

export type CategoryLookup = Map<string, CategoryDisplay>;

export function buildCategoryLookup(
  categories: Array<{
    slug?: string | null;
    name?: string | null;
    icon?: string | null;
    color?: string | null;
  }>,
): CategoryLookup {
  const map: CategoryLookup = new Map();
  for (const cat of categories) {
    if (!cat?.slug) continue;
    map.set(cat.slug, {
      name: cat.name ?? "",
      icon: cat.icon ?? null,
      color: cat.color ?? null,
    });
  }
  return map;
}

export function toProviderCardData(
  raw: AnyProvider,
  categoryLookup?: CategoryLookup,
): ProviderCardData {
  const firstName = raw.user?.firstName ?? "";
  const lastName = raw.user?.lastName ?? "";
  const initials =
    `${(firstName[0] ?? "?").toUpperCase()}${(lastName[0] ?? "").toUpperCase()}`.trim() ||
    "?";

  const validCategories = (raw.categories ?? []).filter(
    (c): c is { slug?: string | null; name?: string | null } =>
      !!c && typeof c.slug === "string" && c.slug.length > 0,
  );
  const primaryCategoryRaw = validCategories[0];
  const primaryCategorySlug = primaryCategoryRaw?.slug ?? null;
  const slug = resolveCategorySlug(primaryCategorySlug);
  const display = primaryCategorySlug
    ? categoryLookup?.get(primaryCategorySlug)
    : undefined;
  type SecondaryCategory = { name: string; iconName?: string; color?: string };
  const secondaryCategories: SecondaryCategory[] = [];
  for (const c of validCategories.slice(1)) {
    const lookup = c.slug ? categoryLookup?.get(c.slug) : undefined;
    const name = lookup?.name || c.name || "";
    if (!name) continue;
    secondaryCategories.push({
      name,
      iconName: lookup?.icon ?? undefined,
      color: lookup?.color ?? undefined,
    });
  }

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
    categoryName: display?.name ?? primaryCategoryRaw?.name ?? undefined,
    categoryIconName: display?.icon ?? undefined,
    categoryColor: display?.color ?? undefined,
    secondaryCategories:
      secondaryCategories.length > 0 ? secondaryCategories : undefined,
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
