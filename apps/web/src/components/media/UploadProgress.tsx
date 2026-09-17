"use client";

import { cn } from "@/lib/utils";

/** Thin progress bar with a caption; `percent` 0–100. */
export function UploadProgress({ percent, label, className }: { percent: number; label: string; className?: string }) {
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label} className={cn("w-full", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
        <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
