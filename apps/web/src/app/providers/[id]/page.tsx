import { notFound } from "next/navigation";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { providersApi } from "@kayu/api";
import { Layout } from "@/components/layout";
import { ProviderProfileClient } from "./ProviderProfileClient";
import type { Metadata } from "next";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = await createAuthenticatedServerApiClient();

  try {
    const provider = await providersApi(client).getById(id);

    if (!provider) {
      return { title: "Prestataire non trouvé | KAYOU" };
    }

    const fullName = `${provider.user?.firstName ?? ""} ${provider.user?.lastName ?? ""}`.trim();
    const title = `${fullName} - ${provider.profession} | KAYOU`;
    const description = provider.description
      ? `${provider.description.slice(0, 150)}...`
      : `${fullName}, ${provider.profession}${provider.user?.city ? ` à ${provider.user.city}` : ""}. Note: ${provider.rating}/5 (${provider.totalReviews} avis)`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        locale: "fr_CD",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: "Prestataire | KAYOU" };
  }
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await createAuthenticatedServerApiClient();

  let provider: Awaited<ReturnType<ReturnType<typeof providersApi>["getById"]>> | null = null;

  try {
    provider = await providersApi(client).getById(id);
  } catch {
    notFound();
  }

  if (!provider) {
    notFound();
  }

  // hasAccess and accessDeniedReason come from the API
  const hasAccess = provider.hasAccess ?? true;
  const accessDeniedReason = provider.accessDeniedReason ?? "";

  // Build default visibility if not provided
  const visibility = (provider as Record<string, unknown>).visibility as {
    profileVisible: string;
    showEmail: boolean;
    showPhone: boolean;
    showExactLocation: boolean;
    showHourlyRate: boolean;
    showPastWork: boolean;
    showReviews: boolean;
    showAvailability: boolean;
    showCertifications: boolean;
    allowDirectContact: boolean;
    allowMessages: boolean;
  } ?? {
    profileVisible: "PUBLIC",
    showEmail: false,
    showPhone: false,
    showExactLocation: false,
    showHourlyRate: true,
    showPastWork: true,
    showReviews: true,
    showAvailability: true,
    showCertifications: true,
    allowDirectContact: true,
    allowMessages: true,
  };

  // Map certifications: split into certifications vs diplomas based on document type
  const allCertifications = (provider.certifications ?? []);
  const certifications = allCertifications
    .filter((cert) => !cert.documents?.some((doc) => doc.type === "DIPLOMA"))
    .map((cert) => ({
      id: cert.id ?? "",
      title: cert.title,
      issuingOrg: cert.issuingOrg,
      certificateNum: cert.certificateNum ?? null,
      status: (cert.status ?? "PENDING") as "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW",
      issueDate: cert.issueDate ? String(cert.issueDate) : null,
      expiryDate: cert.expiryDate ? String(cert.expiryDate) : null,
      isLifetime: cert.isLifetime ?? false,
      rejectionReason: cert.rejectionReason ?? null,
      documents: (cert.documents ?? []).map((doc) => ({
        id: doc.id ?? "",
        type: doc.type,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt ? String(doc.uploadedAt) : new Date().toISOString(),
      })),
    }));

  const diplomas = allCertifications
    .filter((cert) => cert.documents?.some((doc) => doc.type === "DIPLOMA"))
    .map((cert) => ({
      id: cert.id ?? "",
      title: cert.title,
      issuingOrg: cert.issuingOrg,
      certificateNum: cert.certificateNum ?? null,
      status: (cert.status ?? "PENDING") as "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW",
      issueDate: cert.issueDate ? String(cert.issueDate) : null,
      documents: (cert.documents ?? [])
        .filter((doc) => doc.type === "DIPLOMA")
        .map((doc) => ({
          id: doc.id ?? "",
          type: "DIPLOMA" as const,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt ? String(doc.uploadedAt) : new Date().toISOString(),
        })),
    }));

  // Build stats object
  const statsRaw = (provider as Record<string, unknown>).stats as {
    totalReviews?: number;
    totalBookings?: number;
    ratingBreakdown?: Record<string, number>;
    ratingAverages?: {
      overall?: number;
      punctuality?: number;
      quality?: number;
      communication?: number;
      value?: number;
    };
  } | undefined;

  const stats = {
    totalReviews: statsRaw?.totalReviews ?? provider.totalReviews ?? 0,
    totalBookings: statsRaw?.totalBookings ?? 0,
    ratingBreakdown: {
      5: statsRaw?.ratingBreakdown?.[5] ?? 0,
      4: statsRaw?.ratingBreakdown?.[4] ?? 0,
      3: statsRaw?.ratingBreakdown?.[3] ?? 0,
      2: statsRaw?.ratingBreakdown?.[2] ?? 0,
      1: statsRaw?.ratingBreakdown?.[1] ?? 0,
    },
    ratingAverages: {
      overall: statsRaw?.ratingAverages?.overall ?? provider.rating ?? 0,
      punctuality: statsRaw?.ratingAverages?.punctuality ?? 0,
      quality: statsRaw?.ratingAverages?.quality ?? 0,
      communication: statsRaw?.ratingAverages?.communication ?? 0,
      value: statsRaw?.ratingAverages?.value ?? 0,
    },
  };

  // Map recent reviews
  const recentReviews = (provider.recentReviews ?? []).map((review) => ({
    id: review.id ?? "",
    rating: review.rating ?? 0,
    punctuality: review.punctuality ?? null,
    quality: review.quality ?? null,
    communication: review.communication ?? null,
    value: review.value ?? null,
    comment: review.comment ?? null,
    createdAt: review.createdAt ? String(review.createdAt) : new Date().toISOString(),
    reply: review.reply ?? null,
    repliedAt: review.repliedAt ? String(review.repliedAt) : null,
    client: {
      id: review.client?.id ?? "",
      firstName: review.client?.firstName ?? "",
      lastName: review.client?.lastName ?? "",
      avatar: review.client?.avatar ?? null,
      initials: `${(review.client?.firstName ?? "?")[0]}${(review.client?.lastName ?? "?")[0]}`,
    },
  }));

  const providerData = {
    id: provider.id ?? "",
    userId: provider.userId ?? "",
    profession: provider.profession,
    description: provider.description ?? null,
    experience: provider.experience ?? null,
    hourlyRate: provider.hourlyRate ?? null,
    videoUrl: (provider as Record<string, unknown>).videoUrl as string ?? null,
    isCertified: provider.isCertified ?? false,
    isPremium: provider.isPremium ?? false,
    premiumExpiry: (provider as Record<string, unknown>).premiumExpiry as string ?? null,
    isAvailable: provider.isAvailable ?? false,
    rating: provider.rating ?? 0,
    totalReviews: provider.totalReviews ?? 0,
    totalJobs: provider.totalJobs ?? 0,
    responseTime: provider.responseTime ?? null,
    verificationStatus: provider.verificationStatus,
    createdAt: provider.createdAt ? String(provider.createdAt) : new Date().toISOString(),
    user: {
      id: provider.user?.id ?? "",
      firstName: provider.user?.firstName ?? "",
      lastName: provider.user?.lastName ?? "",
      avatar: provider.user?.avatar ?? null,
      city: provider.user?.city ?? null,
      country: provider.user?.country ?? "CD",
      isVerified: provider.user?.isVerified ?? false,
      createdAt: (provider.user as Record<string, unknown>)?.createdAt ? String((provider.user as Record<string, unknown>).createdAt) : new Date().toISOString(),
      email: provider.user?.email ?? undefined,
      phone: provider.user?.phone ?? null,
      address: provider.user?.address ?? null,
      latitude: provider.user?.latitude ?? null,
      longitude: provider.user?.longitude ?? null,
    },
    categories: (provider.categories ?? []).map((cat) => ({
      id: cat.id ?? "",
      name: cat.name,
      slug: cat.slug ?? "",
      icon: cat.icon ?? null,
      color: cat.color ?? null,
    })),
    subcategories: (provider.subcategories ?? []).map((subcategory) => ({
      id: subcategory.id ?? "",
      name: subcategory.name,
      slug: subcategory.slug ?? "",
      isPrimary: subcategory.isPrimary ?? false,
      experience: subcategory.experience ?? null,
    })),
    skills: (provider.skills ?? []).map((skill) => ({
      id: skill.id ?? "",
      name: skill.name,
      level: skill.level ?? 1,
    })),
    portfolio: (provider.portfolio ?? []).map((item) => ({
      id: item.id ?? "",
      title: item.title,
      description: item.description ?? null,
      imageUrl: item.imageUrl,
      order: item.order ?? 0,
    })),
    portfolioProjects: (provider.portfolioProjects ?? []).map((project) => ({
      id: project.id ?? "",
      title: project.title,
      description: project.description ?? null,
      duration: project.duration ?? null,
      price: project.price ?? null,
      viewCount: project.viewCount ?? 0,
      isFeatured: project.isFeatured ?? false,
      createdAt: project.createdAt ? String(project.createdAt) : new Date().toISOString(),
      category: (project as Record<string, unknown>).category
        ? { id: ((project as Record<string, unknown>).category as { id?: string; name: string }).id ?? "", name: ((project as Record<string, unknown>).category as { name: string }).name }
        : null,
      images: (project.images ?? []).map((img) => ({
        id: img.id ?? "",
        imageType: (img.imageType ?? "GENERAL") as "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN",
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl ?? null,
        caption: img.caption ?? null,
        displayOrder: img.displayOrder ?? 0,
        uploadedAt: img.uploadedAt ? String(img.uploadedAt) : new Date().toISOString(),
      })),
    })),
    certifications,
    diplomas,
    serviceZones: (provider.serviceZones ?? []).map((zone) => ({
      id: zone.id ?? "",
      city: zone.city,
      commune: zone.commune ?? null,
    })),
    recentReviews,
    stats,
    visibility,
  };

  return (
    <Layout>
      <ProviderProfileClient
        provider={providerData}
        hasAccess={hasAccess}
        accessDeniedReason={String(accessDeniedReason ?? "")}
      />
    </Layout>
  );
}
