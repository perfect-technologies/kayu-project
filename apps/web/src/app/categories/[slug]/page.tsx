import { notFound } from "next/navigation";
import { createServerApiClient } from "@/lib/api";
import { categoriesApi, providersApi } from "@kayu/api";
import { Layout } from "@/components/layout";
import { CategoryPageClient } from "./CategoryPageClient";
import type { Metadata } from "next";

// Metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = createServerApiClient();

  try {
    const hierarchyRes = await categoriesApi(client).getHierarchy();
    const hierarchy = Array.isArray(hierarchyRes) ? hierarchyRes : (hierarchyRes as any).categories ?? [];
    const category = hierarchy.find((c: any) => c.slug === slug);

    if (!category) {
      return { title: "Catégorie non trouvée | KAYOU" };
    }

    return {
      title: `${category.name} - Prestataires | KAYOU`,
      description:
        category.description ||
        `Trouvez les meilleurs prestataires en ${category.name} en RDC et Congo-Brazzaville.`,
      openGraph: {
        title: `${category.name} - Prestataires | KAYOU`,
        description:
          category.description ||
          `Trouvez les meilleurs prestataires en ${category.name} en RDC et Congo-Brazzaville.`,
        type: "website",
      },
    };
  } catch {
    return { title: "Catégorie | KAYOU" };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = createServerApiClient();

  // Fetch category hierarchy and providers in parallel
  let hierarchy: any[] = [];
  let featuredProvidersData: Awaited<ReturnType<ReturnType<typeof providersApi>["search"]>> | null = null;

  try {
    const [hierarchyRes, providersRes] = await Promise.all([
      categoriesApi(client).getHierarchy(),
      providersApi(client).search({ category: slug, limit: 6 } as Record<string, string | number | boolean | undefined>),
    ]);
    hierarchy = Array.isArray(hierarchyRes) ? hierarchyRes : (hierarchyRes as any).categories ?? [];
    featuredProvidersData = providersRes;
  } catch {
    // fallback: hierarchy might be partial
  }

  const category = hierarchy.find((c: any) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Build provider count per subcategory from the hierarchy data
  const subcategories = (category.subcategories || []).map((sub: any) => ({
    id: sub.id ?? "",
    name: sub.name,
    slug: sub.slug ?? "",
    icon: sub.icon ?? null,
    description: sub.description ?? null,
    providerCount: (sub as Record<string, unknown>).providersCount as number ?? 0,
  }));

  // Map featured providers from API response
  const featuredProviders = (featuredProvidersData?.providers ?? []).map((p) => ({
    id: p.id ?? "",
    userId: p.userId ?? "",
    profession: p.profession,
    description: p.description ?? null,
    hourlyRate: p.hourlyRate ?? null,
    rating: p.rating ?? 0,
    totalReviews: p.totalReviews ?? 0,
    totalJobs: p.totalJobs ?? 0,
    isCertified: p.isCertified ?? false,
    isPremium: p.isPremium ?? false,
    isAvailable: p.isAvailable ?? false,
    experience: p.experience ?? null,
    user: {
      id: p.user?.id ?? "",
      firstName: p.user?.firstName ?? "",
      lastName: p.user?.lastName ?? "",
      avatar: p.user?.avatar ?? null,
      city: p.user?.city ?? null,
      isVerified: p.user?.isVerified ?? false,
      latitude: (p.user as Record<string, unknown>)?.latitude as number ?? null,
      longitude: (p.user as Record<string, unknown>)?.longitude as number ?? null,
    },
    categories: (p.categories ?? []).map((cat) => ({
      id: cat.id ?? "",
      name: cat.name,
      slug: cat.slug ?? "",
      icon: cat.icon ?? null,
      color: cat.color ?? null,
    })),
    serviceZones: (p.serviceZones ?? []).map((zone) => ({
      city: zone.city,
      commune: zone.commune ?? null,
    })),
  }));

  const categoryData = {
    id: category.id ?? "",
    name: category.name,
    slug: category.slug ?? "",
    description: category.description ?? null,
    icon: category.icon ?? null,
    color: category.color ?? null,
    providerCount: (category as Record<string, unknown>).providersCount as number ?? featuredProvidersData?.pagination?.total ?? 0,
    subcategories,
    featuredProviders,
  };

  return (
    <Layout>
      <CategoryPageClient category={categoryData} />
    </Layout>
  );
}
