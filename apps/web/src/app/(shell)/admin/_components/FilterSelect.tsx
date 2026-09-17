"use client";

import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

/** Compact labelled select for toolbars; an empty value means "all". */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <label className={cn("field h-11 w-full sm:w-auto sm:min-w-[150px]", className)}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="text-sm">
        {allLabel !== undefined && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
