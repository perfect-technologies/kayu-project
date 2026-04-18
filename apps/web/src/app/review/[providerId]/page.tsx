import { notFound } from "next/navigation";
import Link from "next/link";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { providersApi } from "@kayu/api";
import { Layout } from "@/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laisser un avis | KAYOU",
};

// DS01 placeholder — DS05 replaces this with the full WriteReview surface.
// The booking flow replace-navigates here with `?fromBooking=1` after
// confirmation, so the route has to exist now even if empty.
export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<{ fromBooking?: string }>;
}) {
  const { providerId } = await params;
  const { fromBooking } = await searchParams;
  const client = await createAuthenticatedServerApiClient();

  let provider: Awaited<ReturnType<ReturnType<typeof providersApi>["getById"]>> | null =
    null;
  try {
    provider = await providersApi(client).getById(providerId);
  } catch {
    notFound();
  }
  if (!provider) notFound();

  const firstName = provider.user?.firstName ?? "le pro";

  return (
    <Layout>
      <div
        style={{
          background: "var(--k-bg)",
          minHeight: "calc(100vh - 64px)",
          paddingTop: 48,
          paddingBottom: 48,
        }}
      >
        <div
          className="mx-auto px-5"
          style={{ maxWidth: 560, textAlign: "center" }}
        >
          <h1 className="k-display-m" style={{ margin: "0 0 12px" }}>
            {fromBooking
              ? `Dis-nous comment ça s'est passé avec ${firstName}`
              : `Laisser un avis à ${firstName}`}
          </h1>
          <p
            className="k-body"
            style={{ color: "var(--k-text-muted)", margin: "0 0 24px" }}
          >
            L&apos;écran de notation complet arrive avec DS05. Pour l&apos;instant,
            ta réservation est confirmée — merci de faire confiance à KAYOU.
          </p>
          <Link
            href="/dashboard/client"
            className="k-btn k-btn-primary k-btn-lg"
          >
            Voir mes réservations
          </Link>
        </div>
      </div>
    </Layout>
  );
}
