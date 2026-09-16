import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";
import { RequireRole } from "@/components/guards";

export const metadata: Metadata = { title: shellCopy.screenTitles.addresses };

export default function Page() {
  return (
    <RequireRole role="CLIENT">
      <RoutePlaceholder title={shellCopy.screenTitles.addresses} workstream="07" container="max-w-3xl" />
    </RequireRole>
  );
}
