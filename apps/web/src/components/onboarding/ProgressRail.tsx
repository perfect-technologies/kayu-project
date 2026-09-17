"use client";

import { Check } from "lucide-react";
import { onboardingCopy } from "@/copy/onboarding";
import { cn } from "@/lib/utils";
import type { WizardStep } from "./wizard-state";

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  1: onboardingCopy.steps.infos,
  2: onboardingCopy.steps.services,
  3: onboardingCopy.steps.location,
  4: onboardingCopy.steps.public,
};

/** Four numbered circles on a hairline rail; the primary fill grows by `(step-1)/3`. */
export function ProgressRail({ step, className }: { step: WizardStep; className?: string }) {
  const steps: WizardStep[] = [1, 2, 3, 4];
  return (
    <nav aria-label={onboardingCopy.steps.label} className={cn("relative", className)}>
      <p className="sr-only">{onboardingCopy.steps.stepOf(step, 4)}</p>
      <div className="relative flex items-start justify-between">
        <div aria-hidden className="absolute inset-x-0 top-4 mx-6 h-0.5 bg-border" />
        <div aria-hidden className="absolute top-4 left-6 h-0.5 bg-primary transition-[width] duration-300" style={{ width: `calc((100% - 3rem) * ${(step - 1) / 3})` }} />
        {steps.map((n) => {
          const current = n === step;
          const done = n < step;
          return (
            <div key={n} className="relative z-10 flex flex-1 flex-col items-center text-center" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                  current || done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-muted-foreground",
                )}
              >
                {done ? <Check size={14} aria-hidden /> : n}
              </span>
              <span className={cn("mt-1.5 max-w-[72px] text-[10px] leading-tight font-semibold", current ? "text-primary" : "text-muted-foreground")}>{WIZARD_STEP_LABELS[n]}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
