"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricCardProps = {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sub?: string;
  /** Position in a row, for the stagger. */
  index?: number;
  className?: string;
};

/** Mint `rounded-[22px]` card with a white icon square, a value, a label and a sub-label. */
export function MetricCard({ icon, value, label, sub, index = 0, className }: MetricCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: Math.min(index * 0.06, 0.3) }}
      className={cn("metric-card min-w-0", className)}
    >
      <span className="metric-card__icon">{icon}</span>
      <p className="mt-4 font-heading text-2xl leading-none font-extrabold text-foreground">{value}</p>
      <p className="mt-2 text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}
