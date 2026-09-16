"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WelcomeSlide } from "@/components/auth/WelcomeSlide";
import { useAuth } from "@/contexts/AuthContext";
import { authCopy } from "@/copy/auth";
import { markOnboarded } from "@/components/auth/WelcomeGate";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 40;

export function WelcomeClient() {
  const router = useRouter();
  const { status } = useAuth();
  const copy = authCopy.welcome;
  const slides = copy.slides;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const pointerStart = useRef<number | null>(null);
  const signedIn = status === "ready" || status === "needs-terms";
  const last = index === slides.length - 1;
  const exitHref = signedIn ? "/" : "/login";

  // Reaching the carousel once counts as onboarded, so "Passer" can stay a plain link.
  useEffect(() => {
    markOnboarded();
  }, []);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, slides.length],
  );

  const finish = useCallback(() => {
    markOnboarded();
    router.push(exitHref);
  }, [exitHref, router]);

  const advance = useCallback(() => {
    if (last) finish();
    else go(index + 1);
  }, [last, finish, go, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") advance();
      if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, go, index]);

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col">
      <div
        className="flex flex-1 touch-pan-y flex-col items-center justify-center py-4 select-none"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (start === null) return;
          const delta = event.clientX - start;
          if (delta <= -SWIPE_THRESHOLD) advance();
          else if (delta >= SWIPE_THRESHOLD) go(index - 1);
        }}
        aria-roledescription="carousel"
        aria-label={copy.slideOf(index + 1, slides.length)}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <WelcomeSlide key={index} slide={slides[index]!} direction={direction} />
        </AnimatePresence>
      </div>
      <div className="pt-6">
        <div className="mb-6 flex items-center gap-2" aria-hidden>
          {slides.map((slide, slideIndex) => (
            <span key={slide.image} className={cn("h-2 rounded-full transition-all", slideIndex === index ? "w-7 bg-primary" : "w-2 bg-primary/20")} />
          ))}
        </div>
        <button type="button" onClick={advance} className="primary-action primary-action--gold text-lg">
          {last ? copy.start : copy.next} <ArrowRight size={20} aria-hidden />
        </button>
        <p className="mt-4 text-center">
          <Link href={exitHref} onClick={markOnboarded} className="inline-flex min-h-9 items-center text-sm font-semibold text-primary underline underline-offset-4">
            {copy.haveAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
