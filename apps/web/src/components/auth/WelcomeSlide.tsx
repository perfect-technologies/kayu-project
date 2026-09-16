"use client";

import { motion, useReducedMotion } from "framer-motion";

export type WelcomeSlideData = { title: string; description: string; image: string };

/** One carousel slide: layered illustration plate, left-aligned title and paragraph. */
export function WelcomeSlide({ slide, direction }: { slide: WelcomeSlideData; direction: 1 | -1 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: 28 * direction }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 * direction }}
      transition={reduce ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.75, 0.3, 1] }}
      className="flex w-full flex-col items-center"
    >
      <div className="relative mb-8 flex size-60 items-center justify-center sm:size-80">
        <div aria-hidden className="absolute -inset-2 rounded-[2.75rem] bg-gradient-to-br from-accent/20 via-primary/5 to-transparent blur-md" />
        <div aria-hidden className="absolute inset-0 rounded-[2.5rem] bg-accent/10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" className="relative size-full rounded-[2rem] object-cover shadow-soft" draggable={false} />
      </div>
      <h1 className="w-full text-left text-2xl leading-tight font-extrabold tracking-tight text-foreground sm:text-3xl">{slide.title}</h1>
      <p className="mt-3 w-full text-left text-base leading-relaxed text-muted-foreground">{slide.description}</p>
    </motion.div>
  );
}
