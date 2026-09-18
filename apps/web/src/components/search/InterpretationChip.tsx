"use client";

import { Sparkles, X } from "lucide-react";
import type { SearchInterpretation } from "@kayu/schemas";
import { searchCopy } from "@/copy/search";

export function InterpretationChip({ interpretation, onRemove }: { interpretation: SearchInterpretation; onRemove: () => void }) {
  const copy = searchCopy.interpretation;
  return (
    <div className="mt-3 flex">
      <span className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-3xl bg-secondary py-1 pl-3.5 pr-1 text-sm font-semibold text-primary">
        <Sparkles size={14} aria-hidden className="shrink-0" />
        <span className="min-w-0 leading-snug">{copy.label(interpretation.label)}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={copy.remove(interpretation.label)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-primary/70 transition hover:bg-primary/10 hover:text-primary"
        >
          <X size={15} aria-hidden />
        </button>
      </span>
    </div>
  );
}
