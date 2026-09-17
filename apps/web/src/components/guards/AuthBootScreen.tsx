"use client";

import { shellCopy } from "@/copy/shell";

/** The one full-page loader allowed (contract §11 rule 9): a 32 px ring on the ivory canvas. */
export function AuthBootScreen() {
  return (
    <div role="status" aria-label={shellCopy.loading} className="grid min-h-dvh place-items-center bg-background">
      <span
        aria-hidden
        className="size-8 animate-spin rounded-full border-[3px] border-border border-t-primary motion-reduce:animate-none"
      />
    </div>
  );
}
