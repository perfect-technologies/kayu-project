import { Suspense } from "react";
import { Layout } from "@/components/layout";
import { ServicesPageContent } from "./ServicesPageContent";

// Server-side metadata for SEO
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="h-[600px] bg-muted rounded-xl animate-pulse" />
          </div>
          {/* Content skeleton */}
          <div className="flex-1">
            <div className="h-12 bg-muted rounded-lg animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[280px] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
