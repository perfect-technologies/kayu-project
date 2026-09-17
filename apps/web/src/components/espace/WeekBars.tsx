"use client";

import { motion, useReducedMotion } from "framer-motion";
import { revenusCopy } from "@/copy/revenus";
import { cn } from "@/lib/utils";

const MIN_HEIGHT = 4;

/** Seven bars, Monday first; the tallest is gold, the others translucent white. */
export function WeekBars({ values }: { values: number[] }) {
  const reduceMotion = useReducedMotion();
  const days = revenusCopy.days;
  const series = days.map((_, index) => values[index] ?? 0);
  const max = Math.max(0, ...series);

  return (
    <div role="img" aria-label={revenusCopy.chartLabel} className="mt-6">
      <div className="flex h-28 items-end gap-2">
        {series.map((value, index) => {
          const ratio = max > 0 ? value / max : 0;
          const height = Math.max(MIN_HEIGHT, Math.round(ratio * 112));
          return (
            <motion.span
              key={days[index]}
              initial={{ height: MIN_HEIGHT }}
              animate={{ height }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              className={cn("block flex-1 rounded-t-md", max > 0 && value === max ? "bg-accent" : "bg-white/25")}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((day) => (
          <span key={day} className="flex-1 text-center text-[11px] font-semibold text-primary-foreground/70">
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}
