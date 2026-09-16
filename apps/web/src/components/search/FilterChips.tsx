"use client";

import { MapPin, SlidersHorizontal, X } from "lucide-react";
import { searchCopy } from "@/copy/search";
import { cn } from "@/lib/utils";

export function FilterChips({
  advancedCount,
  activeCount,
  hasPosition,
  onOpen,
  onClear,
}: {
  advancedCount: number;
  activeCount: number;
  hasPosition: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={onOpen}
        aria-label={searchCopy.filtersOpen}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
          advancedCount > 0
            ? "bg-primary text-primary-foreground shadow-soft"
            : "border border-border bg-white text-foreground/80 hover:bg-muted",
        )}
      >
        <SlidersHorizontal size={15} aria-hidden /> {searchCopy.filters}
        {advancedCount > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 text-[10px] font-extrabold">{advancedCount}</span>
        )}
      </button>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          aria-label={searchCopy.clearAll}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-muted px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted/70"
        >
          <X size={13} aria-hidden /> {searchCopy.activeFilters(activeCount)}
        </button>
      )}
      {hasPosition && (
        <span className="inline-flex min-h-9 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
          <MapPin size={12} aria-hidden /> {searchCopy.positionOn}
        </span>
      )}
    </div>
  );
}
