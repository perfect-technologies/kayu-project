import type { Metadata } from "next";
import { CanvasPlaceholder } from "@/components/placeholder/CanvasPlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.premium };

export default function Page() {
  return <CanvasPlaceholder title={shellCopy.screenTitles.premium} workstream="05" />;
}
