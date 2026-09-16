"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Layout animation for lists that reorder or filter (contract §10, the fourth framer use). */
export function AnimatedList<T>({
  items,
  keyOf,
  render,
  className,
  itemClassName,
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  render: (item: T) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={keyOf(item)}
            layout={!reduceMotion}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
            className={itemClassName}
          >
            {render(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
