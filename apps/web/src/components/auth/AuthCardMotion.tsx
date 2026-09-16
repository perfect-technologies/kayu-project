"use client";

import { motion, useReducedMotion } from "framer-motion";

/** The card fades and rises 20 px on mount (duration 0 under reduced motion). */
export function AuthCardMotion({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.75, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
