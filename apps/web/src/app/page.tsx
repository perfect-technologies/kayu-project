import { createServerApiClient } from "@/lib/api";
import { statsApi, categoriesApi, providersApi } from "@kayu/api";
import HomePageClient from "./HomePageClient";
import { buildCategoryLookup, toProviderCardData } from "@/lib/provider-card";
import type { ProviderCardData } from "@kayu/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const client = createServerApiClient();

  let stats = null;
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon: string | null;
    color: string | null;
    providersCount: number;
  }> = [];
  let featured: ProviderCardData[] = [];

  try {
    const [statsRes, catRes, providersRes] = await Promise.all([
      statsApi(client).getGlobal(),
      categoriesApi(client).getHierarchy(),
      providersApi(client).search({ limit: 6 } as Record<string, string | number | boolean | undefined>),
    ]);
    stats = statsRes;
    const rawCategories = Array.isArray(catRes) ? catRes : (catRes as { categories?: unknown[] })?.categories ?? [];
    categories = (rawCategories as Array<Record<string, unknown>>).map((cat) => ({
      id: (cat.id as string) ?? "",
      name: cat.name as string,
      slug: (cat.slug as string) ?? "",
      description: (cat.description as string) ?? undefined,
      icon: (cat.icon as string | null) ?? null,
      color: (cat.color as string | null) ?? null,
      providersCount: (cat.providersCount as number) ?? 0,
    }));
    const categoryLookup = buildCategoryLookup(categories);
    const rawProviders = (providersRes as { providers?: unknown[] })?.providers ?? [];
    featured = (rawProviders as Array<Record<string, unknown>>).map((p) =>
      toProviderCardData(p, categoryLookup),
    );
  } catch {
    // SSR fallback: backend unavailable
  }

  return (
    <HomePageClient
      initialStats={stats}
      initialCategories={categories}
      featuredProviders={featured}
    />
  );
}
