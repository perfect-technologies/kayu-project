import type { ProviderCardData } from '@kayu/ui';
import type { CategorySlug } from '@kayu/ui';
import type { Provider, ProviderDetail } from '@kayu/schemas';

// Portfolio-paired slugs (DESIGN_SYSTEM §8.5). Matches keys in tokens.portfolio.
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
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (PORTFOLIO_SLUGS.has(normalized as CategorySlug)) {
    return normalized as CategorySlug;
  }
  return 'plomberie';
}

function formatResponse(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return '2h';
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

export function providerToCardData(
  provider: Provider | ProviderDetail,
): ProviderCardData {
  const firstCategory = provider.categories?.[0];
  const firstZone = provider.serviceZones?.[0];

  return {
    id: provider.id,
    firstName: provider.user.firstName ?? '',
    lastName: provider.user.lastName ?? '',
    initials: computeInitials(provider.user.firstName, provider.user.lastName),
    profession: provider.profession,
    city: provider.user.city ?? firstZone?.city ?? undefined,
    commune: firstZone?.commune ?? provider.user.city ?? firstZone?.city ?? undefined,
    categories: [toCategorySlug(firstCategory?.slug)],
    avatarUrl: provider.user.avatar ?? undefined,
    rating: provider.rating ?? 0,
    reviews: provider.totalReviews ?? 0,
    response: formatResponse(provider.responseTime),
    hourly: provider.hourlyRate ?? 0,
    distance: undefined,
    verified: provider.verificationStatus === 'VERIFIED',
    topRated: (provider.rating ?? 0) >= 4.7 && (provider.totalReviews ?? 0) >= 5,
    online: provider.isAvailable,
  };
}
