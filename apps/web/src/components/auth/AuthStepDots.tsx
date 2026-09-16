"use client";

import { authCopy } from "@/copy/auth";
import { cn } from "@/lib/utils";

/** Progress dots for the OTP flow: the active dot is a 28 px primary pill, the others 8 px. */
export function AuthStepDots({ steps, active, className }: { steps: string[]; active: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="status" aria-label={authCopy.steps.progress(active + 1, steps.length)}>
      {steps.map((step, index) => (
        <span
          key={step}
          aria-hidden
          className={cn("h-2 rounded-full transition-all", index === active ? "w-7 bg-primary" : "w-2 bg-primary/20")}
        />
      ))}
    </div>
  );
}
