import type { ProviderCardData } from '@kayu/ui';
import type { CategorySlug } from '@kayu/ui';

const PORTFOLIO_SLUGS = new Set<CategorySlug>([
  'plomberie',
  'electricite',
  'peinture',
  'coiffure',
  'informatique',
  'menage',
  'jardinage',
  'transport',
  'menuiserie',
]);

export function toCategorySlug(raw: string | undefined): CategorySlug {
  if (!raw) return 'plomberie';
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (PORTFOLIO_SLUGS.has(normalized as CategorySlug)) {
    return normalized as CategorySlug;
  }
  return 'plomberie';
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
      name: cat.name ?? '',
      icon: cat.icon ?? null,
      color: cat.color ?? null,
    });
  }
  return map;
}

function formatResponse(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return 'À confirmer';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function computeInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  const i = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  return i || '·';
}

type ProviderCardSource = {
  id?: string;
  profession?: string;
  responseTime?: number | null;
  hourlyRate?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  verificationStatus?: string | null;
  isAvailable?: boolean | null;
  categories?: Array<{ slug?: string | null; name?: string | null } | null> | null;
  serviceZones?: Array<{ city?: string | null; commune?: string | null } | null> | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    city?: string | null;
  } | null;
};

export function providerToCardData(
  provider: ProviderCardSource,
  lookup?: CategoryLookup,
): ProviderCardData {
  const validCategories = (provider.categories ?? []).filter(
    (c): c is { slug?: string | null; name?: string | null } =>
      !!c && typeof c.slug === 'string' && c.slug.length > 0,
  );
  const primaryRaw = validCategories[0];
  const primarySlug = primaryRaw?.slug ?? null;
  const primaryDisplay = primarySlug ? lookup?.get(primarySlug) : undefined;

  type SecondaryCategory = { name: string; iconName?: string; color?: string };
  const secondaryCategories: SecondaryCategory[] = [];
  for (const c of validCategories.slice(1)) {
    const slug = c.slug ?? null;
    const disp = slug ? lookup?.get(slug) : undefined;
    const name = disp?.name || c.name || '';
    if (!name) continue;
    secondaryCategories.push({
      name,
      iconName: disp?.icon ?? undefined,
      color: disp?.color ?? undefined,
    });
  }

  const firstZone = provider.serviceZones?.[0];

  return {
    id: provider.id ?? '',
    firstName: provider.user?.firstName ?? '',
    lastName: provider.user?.lastName ?? '',
    initials: computeInitials(provider.user?.firstName, provider.user?.lastName),
    profession: provider.profession ?? 'Professionnel',
    city: provider.user?.city ?? firstZone?.city ?? undefined,
    commune: firstZone?.commune ?? provider.user?.city ?? firstZone?.city ?? undefined,
    categories: [toCategorySlug(primarySlug ?? undefined)],
    categoryName: primaryDisplay?.name ?? primaryRaw?.name ?? undefined,
    categoryIconName: primaryDisplay?.icon ?? undefined,
    categoryColor: primaryDisplay?.color ?? undefined,
    secondaryCategories:
      secondaryCategories.length > 0 ? secondaryCategories : undefined,
    avatarUrl: provider.user?.avatar ?? undefined,
    rating: provider.rating ?? 0,
    reviews: provider.totalReviews ?? 0,
    response: formatResponse(provider.responseTime ?? undefined),
    hourly: provider.hourlyRate ?? 0,
    distance: undefined,
    verified: provider.verificationStatus === 'VERIFIED',
    topRated: (provider.rating ?? 0) >= 4.7 && (provider.totalReviews ?? 0) >= 5,
    online: !!provider.isAvailable,
  };
}
