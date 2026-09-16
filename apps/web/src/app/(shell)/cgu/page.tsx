import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.cgu };

export default function Page() {
  return (
    <RoutePlaceholder title={shellCopy.screenTitles.cgu} workstream="05" container="max-w-3xl" />
  );
}
