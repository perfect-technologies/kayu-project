"use client";

import { useEffect, useState } from "react";
import { assistantCopy } from "@/copy/assistant";

const VISIBLE = 4;
const NEAR_ME_VISIBLE = 2;

const stem = (chip: string) => chip.split(" ").slice(0, 2).join(" ").toLowerCase();

function rotate(list: readonly string[], offset: number, count: number): string[] {
  return Array.from({ length: Math.min(count, list.length) }, (_, index) => list[(offset + index) % list.length]!);
}

export function SuggestionChips({
  onPick,
  disabled,
  locationKnown,
}: {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** Adds the "près de chez moi" variants when the server resolved a default location (RFC §4.3). */
  locationKnown?: boolean;
}) {
  const [offset, setOffset] = useState(0);

  // Rotated per session; picked after mount so the server and first client render agree.
  useEffect(() => {
    setOffset(Math.floor(Math.random() * 1000));
  }, []);

  const nearMe = locationKnown ? rotate(assistantCopy.chipsNearMe, offset, NEAR_ME_VISIBLE) : [];
  const taken = new Set(nearMe.map(stem));
  const generic = assistantCopy.chips.filter((chip) => !taken.has(stem(chip)));
  const chips = [...nearMe, ...rotate(generic, offset, VISIBLE - nearMe.length)];

  return (
    <ul aria-label={assistantCopy.greeting.chipsLabel} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(chip)}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-left text-sm font-semibold text-foreground/80 shadow-soft transition hover:border-primary/30 hover:text-primary disabled:opacity-55"
          >
            {chip}
          </button>
        </li>
      ))}
    </ul>
  );
}
