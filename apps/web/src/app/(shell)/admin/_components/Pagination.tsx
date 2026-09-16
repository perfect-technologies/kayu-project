"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminCopy } from "@/copy/admin";

export type PaginationProps = { page: number; total: number; limit: number; onPage: (page: number) => void };

/** "Page 2 / 5 · 230 résultats" with previous / next; hidden when everything fits on one page. */
export function Pagination({ page, total, limit, onPage }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1 && total <= limit) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground" aria-label={adminCopy.common.page(page, pages)}>
      <span>
        {adminCopy.common.page(page, pages)} · {adminCopy.common.results(total)}
      </span>
      <span className="flex gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className="icon-button size-9" aria-label={adminCopy.common.previous}>
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} className="icon-button size-9" aria-label={adminCopy.common.next}>
          <ChevronRight size={16} aria-hidden />
        </button>
      </span>
    </nav>
  );
}
