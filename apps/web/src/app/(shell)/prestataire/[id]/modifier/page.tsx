import type { Metadata } from "next";
import { RequireOwnerOrAdmin } from "@/components/guards";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.editProvider };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireOwnerOrAdmin providerId={id}>
      <RoutePlaceholder title={shellCopy.screenTitles.editProvider} workstream="06" container="max-w-3xl" />
    </RequireOwnerOrAdmin>
  );
}
