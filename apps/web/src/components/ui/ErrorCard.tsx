"use client";

import { RotateCcw } from "lucide-react";
import { spacesCopy } from "@/copy/spaces";
import { cn } from "@/lib/utils";

/** Error surface for a failed query: a message and a "Réessayer" that calls `refetch`. */
export function ErrorCard({ message, onRetry, className }: { message?: string; onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("rounded-3xl border border-red-200 bg-red-50 p-6 text-center", className)}>
      <p className="text-sm font-semibold text-red-700">{message ?? spacesCopy.errorTitle}</p>
      <button type="button" onClick={onRetry} className="secondary-action mt-4">
        <RotateCcw size={15} aria-hidden /> {spacesCopy.retry}
      </button>
    </div>
  );
}
