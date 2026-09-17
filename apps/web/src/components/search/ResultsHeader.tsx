"use client";

import { searchCopy } from "@/copy/search";
import type { ViewMode } from "./search-state";
import { ViewToggle } from "./ViewToggle";

export function ResultsHeader({
  total,
  hasMore,
  view,
  onView,
}: {
  total: number | null;
  hasMore: boolean;
  view: ViewMode;
  onView: (view: ViewMode) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
        {total === null ? searchCopy.searching : hasMore && view === "list" ? searchCopy.resultsMore(total) : searchCopy.results(total)}
      </p>
      <ViewToggle value={view} onChange={onView} />
    </div>
  );
}
