import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.privacy };

export default function Page() {
  return (
    <RoutePlaceholder title={shellCopy.screenTitles.privacy} workstream="05" container="max-w-3xl" />
  );
}
