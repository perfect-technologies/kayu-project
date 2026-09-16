import type { Metadata } from "next";
import { AuthCanvas } from "@/components/layout/AuthCanvas";
import { CanvasPlaceholder } from "@/components/placeholder/CanvasPlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.welcome };

/** Outside the (canvas) group because the welcome carousel is the one canvas with the top bar. */
export default function Page() {
  return (
    <AuthCanvas topBar skipHref="/login">
      <CanvasPlaceholder title={shellCopy.screenTitles.welcome} workstream="06" />
    </AuthCanvas>
  );
}
