"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const variants = {
  enter: (direction: number) => ({ opacity: 0, x: 24 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -24 * direction }),
};

/** Wizard step swap (contract §10): `mode="wait"`, x ±24 px, 0.28 s; direction follows the step index. */
export function WizardSteps({
  step,
  children,
  className,
}: {
  step: number;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const previous = useRef(step);
  const direction = step >= previous.current ? 1 : -1;

  useEffect(() => {
    previous.current = step;
  }, [step]);

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.75, 0.3, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
