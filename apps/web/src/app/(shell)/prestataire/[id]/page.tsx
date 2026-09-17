import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ApiError, categoriesApi, providersApi } from "@kayu/api";
import type { CategoryTreeNode, ProviderPublic, PublicReview } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { createServerApiClient } from "@/lib/api";
import { cityOf, deepestCategory } from "@/lib/dto/provider";
import { ProviderProfileClient } from "./ProviderProfileClient";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** One fetch per request for the page and its metadata; the cookie decides whether contacts are present. */
const loadProvider = cache(async (id: string): Promise<ProviderPublic | null> => {
  const client = await createAuthenticatedServerApiClient();
  try {
    return await providersApi(client).getPublic(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const provider = await loadProvider(id).catch(() => null);
  if (!provider) return { title: providerCopy.meta.title("") };
  const specialty = deepestCategory(provider.categoryChain)?.name ?? "";
  const city = cityOf(provider.placeChain)?.label ?? "";
  return {
    title: { absolute: providerCopy.meta.title(provider.displayName) },
    description: providerCopy.meta.description(provider.displayName, specialty, city),
  };
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  const provider = await loadProvider(id);
  if (!provider) notFound();

  const anonymous = createServerApiClient();
  const [reviews, tree] = await Promise.all([
    providersApi(anonymous)
      .reviews(id, { limit: 50 })
      .catch(() => ({ items: [] as PublicReview[], total: provider.ratingCount })),
    categoriesApi(anonymous)
      .getTree()
      .catch(() => ({ items: [] as CategoryTreeNode[] })),
  ]);
  const rootSlug = provider.categoryChain[0]?.slug;
  const category = tree.items.find((node) => node.slug === rootSlug) ?? null;

  return (
    <ProviderProfileClient
      initial={provider}
      initialReviews={reviews.items}
      reviewsTotal={reviews.total}
      category={category}
    />
  );
}
