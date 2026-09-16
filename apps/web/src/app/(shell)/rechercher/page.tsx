import type { Metadata } from "next";
import { Suspense } from "react";
import { ProviderCardSkeleton } from "@/components/search/ProviderCardSkeleton";
import { searchCopy } from "@/copy/search";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: searchCopy.meta.title,
  description: searchCopy.meta.description,
};

function Fallback() {
  return (
    <div className="mobile-page max-w-7xl pt-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{searchCopy.title}</h1>
      <div role="status" aria-label={searchCopy.searching} className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <ProviderCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <SearchClient />
    </Suspense>
  );
}
