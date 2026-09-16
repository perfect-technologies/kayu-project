import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.services };

export default function Page() {
  return (
    <RoutePlaceholder title={shellCopy.screenTitles.services} workstream="05" container="max-w-5xl" />
  );
}
