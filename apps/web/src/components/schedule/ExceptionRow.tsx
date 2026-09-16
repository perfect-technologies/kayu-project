"use client";

import { Trash2 } from "lucide-react";
import type { ScheduleException } from "@kayu/utils";
import { onboardingCopy } from "@/copy/onboarding";
import { cn } from "@/lib/utils";
import { RangeRow } from "./RangeRow";

const copy = onboardingCopy.schedule;

export type ExceptionRowProps = {
  value: ScheduleException;
  onChange: (next: ScheduleException) => void;
  onRemove: () => void;
  error?: string | null;
};

/** One exception: date, closed / custom range toggle, optional reason. */
export function ExceptionRow({ value, onChange, onRemove, error }: ExceptionRowProps) {
  return (
    <div className={cn("space-y-2 rounded-2xl border bg-white p-3", error ? "border-destructive" : "border-border")}>
      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1 text-xs font-bold">
          {copy.exceptionDate}
          <input type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} className="field mt-1 h-11" />
        </label>
        <button type="button" onClick={onRemove} aria-label={copy.removeException} className="icon-button mt-5 size-9 text-destructive">
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
      <div className="flex gap-2">
        {(
          [
            [false, copy.exceptionClosed],
            [true, copy.exceptionOpen],
          ] as const
        ).map(([open, label]) => (
          <button
            key={String(open)}
            type="button"
            aria-pressed={value.isOpen === open}
            onClick={() =>
              onChange(open ? { ...value, isOpen: true, startTime: value.startTime ?? "09:00", endTime: value.endTime ?? "12:00" } : { ...value, isOpen: false, startTime: null, endTime: null })
            }
            className={cn(
              "min-h-9 flex-1 rounded-full border px-3 text-xs font-semibold",
              value.isOpen === open ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {value.isOpen && (
        <RangeRow
          value={{ startTime: value.startTime ?? "09:00", endTime: value.endTime ?? "12:00" }}
          onChange={(range) => onChange({ ...value, ...range })}
          onRemove={() => onChange({ ...value, isOpen: false, startTime: null, endTime: null })}
        />
      )}
      <label className="block text-xs font-bold">
        {copy.exceptionReason}
        <input
          value={value.reason ?? ""}
          maxLength={200}
          placeholder={copy.exceptionReasonPlaceholder}
          onChange={(event) => onChange({ ...value, reason: event.target.value || null })}
          className="field mt-1 h-11"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
