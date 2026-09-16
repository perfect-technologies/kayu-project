"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Full-width bordered row: label, description and an iOS-style switch. */
export function ToggleRow({ label, description, checked, onChange, disabled, className }: ToggleRowProps) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3", className)}>
      <div className="min-w-0">
        <p id={id} className="text-sm font-bold text-foreground">
          {label}
        </p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-55",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          aria-hidden
          className={cn("absolute top-1 left-1 size-5 rounded-full bg-white shadow-soft transition-transform", checked && "translate-x-5")}
        />
      </button>
    </div>
  );
}
