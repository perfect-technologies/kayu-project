"use client";

import { Navigation } from "lucide-react";
import { searchCopy } from "@/copy/search";
import { cn } from "@/lib/utils";

export function NearMeButton({
  active,
  locating,
  onClick,
}: {
  active: boolean;
  locating: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-soft transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
      )}
    >
      <Navigation size={16} aria-hidden className={locating ? "motion-safe:animate-spin" : undefined} />
      <span className="hidden sm:inline">{locating ? searchCopy.locating : searchCopy.nearMe}</span>
      <span className="sm:hidden">{searchCopy.nearMe}</span>
    </button>
  );
}
