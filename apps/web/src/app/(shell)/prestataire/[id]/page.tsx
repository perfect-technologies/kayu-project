import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.provider };

export default function Page() {
  return (
    <RoutePlaceholder title={shellCopy.screenTitles.provider} workstream="05" container="max-w-5xl" />
  );
}
