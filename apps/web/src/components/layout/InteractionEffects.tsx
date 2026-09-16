"use client";

import { useEffect } from "react";

const MAX_LIVE = 6;
const LIFETIME_MS = 450;

/** Gold touch pulse on pointer-down over buttons and links. One document listener, no React state. */
export function InteractionEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const live = new Set<HTMLElement>();
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const onPointerDown = (event: PointerEvent) => {
      if (reduced.matches || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest("button, a, [role='button']");
      if (!(target instanceof HTMLElement)) return;
      if (target.matches(":disabled, [aria-disabled='true']")) return;
      if (live.size >= MAX_LIVE) return;
      const rect = target.getBoundingClientRect();
      if (rect.width > 480 || rect.height > 100) return;

      const pulse = document.createElement("span");
      pulse.className = "touch-pulse";
      pulse.setAttribute("aria-hidden", "true");
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      document.body.appendChild(pulse);
      live.add(pulse);

      const timer = setTimeout(() => {
        pulse.remove();
        live.delete(pulse);
        timers.delete(timer);
      }, LIFETIME_MS);
      timers.add(timer);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      timers.forEach(clearTimeout);
      live.forEach((node) => node.remove());
    };
  }, []);

  return null;
}
