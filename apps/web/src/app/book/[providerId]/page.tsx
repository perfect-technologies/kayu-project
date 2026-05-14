import { notFound } from "next/navigation";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { providersApi } from "@kayu/api";
import { BookingFlowClient } from "./BookingFlowClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réserver | KAYOU",
};

export default async function BookingPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const client = await createAuthenticatedServerApiClient();

  let provider: Awaited<ReturnType<ReturnType<typeof providersApi>["getById"]>> | null =
    null;
  try {
    provider = await providersApi(client).getById(providerId);
  } catch {
    notFound();
  }
  if (!provider) notFound();

  const data = {
    id: provider.id ?? providerId,
    firstName: provider.user?.firstName ?? "",
    lastName: provider.user?.lastName ?? "",
    profession: provider.profession ?? "Professionnel",
    hourlyRate: provider.hourlyRate ?? 0,
    rating: provider.rating ?? 0,
    totalReviews: provider.totalReviews ?? 0,
    avatarUrl: provider.user?.avatar ?? null,
    city: provider.user?.city ?? "Kinshasa",
    verified: provider.user?.isVerified ?? false,
    subcategories: (provider.subcategories ?? []).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      isPrimary: s.isPrimary,
    })),
  };

  return <BookingFlowClient provider={data} />;
}
