"use client";

import { X } from "lucide-react";
import { clock } from "@kayu/utils";
import { onboardingCopy } from "@/copy/onboarding";
import { cn } from "@/lib/utils";

const copy = onboardingCopy.schedule;
export const TIMES = Array.from({ length: 96 }, (_, index) => clock(index * 15));

export type Range = { startTime: string; endTime: string };

/** Start and end selects at 15 min steps, plus a remove button. */
export function RangeRow({ value, onChange, onRemove, invalid }: { value: Range; onChange: (next: Range) => void; onRemove: () => void; invalid?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={copy.start}
        value={value.startTime}
        onChange={(event) => onChange({ ...value, startTime: event.target.value })}
        className={cn("field h-11 min-w-0 flex-1 px-3", invalid && "border-destructive")}
      >
        {TIMES.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <span aria-hidden className="text-muted-foreground">
        –
      </span>
      <select
        aria-label={copy.end}
        value={value.endTime}
        onChange={(event) => onChange({ ...value, endTime: event.target.value })}
        className={cn("field h-11 min-w-0 flex-1 px-3", invalid && "border-destructive")}
      >
        {TIMES.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <button type="button" onClick={onRemove} aria-label={copy.removeRange} className="icon-button size-9 text-muted-foreground">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
