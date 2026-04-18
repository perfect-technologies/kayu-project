import { Suspense } from "react";
import { Layout } from "@/components/layout";
import { ServicesPageContent } from "./ServicesPageContent";

export const metadata = {
  title: "Services - Trouvez des prestataires | KAYOU",
  description:
    "Recherchez et trouvez les meilleurs prestataires de services en RDC et Congo-Brazzaville. Plombiers, électriciens, coiffeurs, et plus encore.",
  openGraph: {
    title: "Services - Trouvez des prestataires | KAYOU",
    description:
      "Recherchez et trouvez les meilleurs prestataires de services en RDC et Congo-Brazzaville.",
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <Layout>
      <Suspense fallback={<ServicesPageSkeleton />}>
        <ServicesPageContent />
      </Suspense>
    </Layout>
  );
}

function ServicesPageSkeleton() {
  return (
    <div
      style={{ background: "var(--k-bg)" }}
      className="mx-auto flex max-w-[1400px] gap-6 px-5 py-6 md:px-8"
    >
      <div
        className="hidden w-[260px] shrink-0 rounded-[var(--k-r-lg)] lg:block"
        style={{
          height: 520,
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
        }}
      />
      <div className="flex-1">
        <div
          className="mb-4 h-8 w-64 rounded-[8px]"
          style={{ background: "var(--k-surface-muted)" }}
        />
        <div className="space-y-3.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-k-shimmer rounded-[var(--k-r-xl)]"
              style={{ height: 260 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
