import { notFound } from "next/navigation";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { providersApi } from "@kayu/api";
import { Layout } from "@/components/layout";
import { WriteReviewClient, type WriteReviewProvider } from "./WriteReviewClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laisser un avis | KAYOU",
};

export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<{ bookingId?: string; fromBooking?: string }>;
}) {
  const { providerId } = await params;
  const { bookingId, fromBooking } = await searchParams;
  const client = await createAuthenticatedServerApiClient();

  let provider: Awaited<ReturnType<ReturnType<typeof providersApi>["getById"]>> | null =
    null;
  try {
    provider = await providersApi(client).getById(providerId);
  } catch {
    notFound();
  }
  if (!provider) notFound();

  const city = provider.user?.city ?? null;
  const viewProvider: WriteReviewProvider = {
    id: providerId,
    firstName: provider.user?.firstName ?? "le pro",
    lastName: provider.user?.lastName ?? "",
    profession: provider.profession ?? "Prestataire",
    city,
  };

  return (
    <Layout>
      <div style={{ background: "var(--k-bg)", minHeight: "calc(100vh - 64px)" }}>
        <WriteReviewClient
          provider={viewProvider}
          bookingId={bookingId}
          fromBooking={fromBooking === "1"}
        />
      </div>
    </Layout>
  );
}
