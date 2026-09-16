import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";
import { ProtectedRoute } from "@/components/guards";

export const metadata: Metadata = { title: shellCopy.screenTitles.notifications };

export default function Page() {
  return (
    <ProtectedRoute>
      <RoutePlaceholder title={shellCopy.screenTitles.notifications} workstream="07" container="max-w-3xl" />
    </ProtectedRoute>
  );
}
