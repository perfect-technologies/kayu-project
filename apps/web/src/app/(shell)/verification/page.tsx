import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";
import { RequireRole } from "@/components/guards";

export const metadata: Metadata = { title: shellCopy.screenTitles.verification };

export default function Page() {
  return (
    <RequireRole role="PROVIDER">
      <RoutePlaceholder title={shellCopy.screenTitles.verification} workstream="06" container="max-w-3xl" />
    </RequireRole>
  );
}
