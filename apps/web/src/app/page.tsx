import { createServerApiClient } from '@/lib/api';
import { statsApi, categoriesApi } from '@kayu/api';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const client = createServerApiClient();

  let stats = null;
  let categories: any[] = [];
  try {
    const [statsRes, catRes] = await Promise.all([
      statsApi(client).getGlobal(),
      categoriesApi(client).getHierarchy(),
    ]);
    stats = statsRes;
    const rawCategories = Array.isArray(catRes) ? catRes : (catRes as any)?.categories ?? [];
    categories = rawCategories.map((cat: any) => ({
      id: cat.id ?? "",
      name: cat.name,
      slug: cat.slug ?? "",
      description: cat.description ?? undefined,
      icon: cat.icon ?? null,
      color: cat.color ?? null,
      providersCount: (cat.providersCount as number) ?? 0,
    }));
  } catch {
    // Fallback for SSR when backend is unavailable
  }

  return <HomePageClient initialStats={stats} initialCategories={categories} />;
}
