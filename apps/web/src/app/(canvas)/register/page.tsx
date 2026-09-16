import type { Metadata } from "next";
import { GuestOnly } from "@/components/guards";
import { CanvasPlaceholder } from "@/components/placeholder/CanvasPlaceholder";
import { shellCopy } from "@/copy/shell";

export const metadata: Metadata = { title: shellCopy.screenTitles.register };

export default function Page() {
  return (
    <GuestOnly>
      <CanvasPlaceholder title={shellCopy.screenTitles.register} workstream="06" />
    </GuestOnly>
  );
}
