import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.search };

export default function Page() {
  return (
    <RoutePlaceholder title={shellCopy.screenTitles.search} workstream="05" container="max-w-7xl" />
  );
}
