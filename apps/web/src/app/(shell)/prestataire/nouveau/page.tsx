import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";
import { RequireNotProvider } from "@/components/guards";

export const metadata: Metadata = { title: shellCopy.screenTitles.becomeProvider };

export default function Page() {
  return (
    <RequireNotProvider>
      <RoutePlaceholder title={shellCopy.screenTitles.becomeProvider} workstream="06" container="max-w-3xl" />
    </RequireNotProvider>
  );
}
