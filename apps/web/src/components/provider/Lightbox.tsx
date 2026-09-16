"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProviderMedia } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.gallery;

export function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: ProviderMedia[];
  index: number | null;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const reduce = useReducedMotion();
  const closeButton = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const open = index !== null && items[index] !== undefined;

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      restore.current?.focus();
    };
  }, [open]);

  const step = (delta: number) => {
    if (index === null) return;
    onIndex((index + delta + items.length) % items.length);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  };

  const buttonClass = "flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={copy.lightbox}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          onClick={onClose}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
        >
          <button ref={closeButton} type="button" aria-label={copy.close} onClick={onClose} className={`absolute top-4 right-4 ${buttonClass}`}>
            <X size={20} aria-hidden />
          </button>
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label={copy.previous}
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                className={`absolute left-3 ${buttonClass}`}
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={copy.next}
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                className={`absolute right-3 ${buttonClass}`}
              >
                <ChevronRight size={22} aria-hidden />
              </button>
            </>
          )}
          <motion.img
            key={items[index!]!.id}
            src={items[index!]!.url}
            alt={items[index!]!.title ?? ""}
            onClick={(event) => event.stopPropagation()}
            initial={reduce ? false : { scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 280 }}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
