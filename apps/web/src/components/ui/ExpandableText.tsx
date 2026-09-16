"use client";

import { useId, useState } from "react";
import { providerCopy } from "@/copy/provider";
import { cn } from "@/lib/utils";

export type ExpandableTextProps = {
  text: string;
  /** Character preview length (default 180). */
  chars?: number;
  /** Line clamp preview instead of a character cut. */
  lines?: 2 | 3 | 4;
  className?: string;
};

/** "Voir plus / Voir moins" expander (contract §11 rule 6). The original text is never altered. */
export function ExpandableText({ text, chars = 180, lines, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const value = text ?? "";
  const long = lines ? value.length > 120 : value.length > chars;
  const preview = lines ? value : value.slice(0, chars).replace(/\s+\S*$/, "") || value.slice(0, chars);
  const clampClass = lines === 2 ? "line-clamp-2" : lines === 3 ? "line-clamp-3" : lines === 4 ? "line-clamp-4" : "";

  return (
    <div className={className}>
      <p id={id} className={cn("whitespace-pre-line", lines && !expanded && clampClass)}>
        {long && !expanded && !lines ? `${preview}…` : value}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 inline-flex min-h-9 items-center text-sm font-bold text-primary"
        >
          {expanded ? providerCopy.expandable.less : providerCopy.expandable.more}
        </button>
      )}
    </div>
  );
}
