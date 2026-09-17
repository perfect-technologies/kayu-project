"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import type { SiteSettings } from "@kayu/schemas";
import { homeCopy } from "@/copy/home";
import { settingOr } from "@/hooks/useSiteSettings";

const copy = homeCopy.hero;

function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return ["", words.join(" ")];
  return [words.slice(0, -2).join(" "), words.slice(-2).join(" ")];
}

export function Hero({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [lead, accent] = splitTitle(settingOr(settings.hero_title, copy.title));
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? { duration: 0 } : { delay, duration: 0.45 },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = q.trim();
    router.push(value ? `/rechercher?q=${encodeURIComponent(value)}` : "/rechercher");
  };

  return (
    <section className="mesh-bg relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 size-80 rounded-full bg-emerald-400/20 blur-3xl motion-safe:animate-blob" />
        <div className="absolute top-44 -left-24 size-80 rounded-full bg-amber-300/20 blur-3xl motion-safe:animate-blob [animation-delay:3s]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <motion.span
              {...rise(0.05)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-soft backdrop-blur"
            >
              <MapPin size={13} aria-hidden /> {copy.location}
            </motion.span>

            <motion.h1
              {...rise(0.1)}
              className="mt-5 text-3xl leading-[1.15] font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl"
            >
              {lead && <>{lead} </>}
              <span className="gradient-text">{accent}</span>
            </motion.h1>

            <motion.p {...rise(0.15)} className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {settingOr(settings.hero_subtitle, copy.subtitle)}
            </motion.p>

            <motion.form
              {...rise(0.2)}
              onSubmit={submit}
              role="search"
              className="mt-7 flex items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-4 shadow-soft sm:max-w-md"
            >
              <Search size={18} aria-hidden className="shrink-0 text-muted-foreground" />
              <label className="min-w-0 flex-1">
                <span className="sr-only">{copy.searchLabel}</span>
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-11 w-full min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <button
                type="submit"
                aria-label={settingOr(settings.hero_cta, copy.cta)}
                className="icon-button border-transparent bg-primary text-primary-foreground"
              >
                <ArrowRight size={18} aria-hidden />
              </button>
            </motion.form>

            <motion.ul
              {...rise(0.3)}
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground"
            >
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} aria-hidden className="text-emerald-600" /> {copy.trustVerified}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Star size={14} aria-hidden className="fill-amber-400 text-amber-400" /> {copy.trustReviews}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Sparkles size={14} aria-hidden className="text-amber-500" /> {copy.trustMadeBefore}{" "}
                <Heart size={13} aria-hidden className="fill-red-500 text-red-500" /> {copy.trustMadeAfter}
              </li>
            </motion.ul>
          </div>

          <div className="relative z-20 mt-4 mb-6 md:mb-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { delay: 0.2, type: "spring", stiffness: 120 }}
              className="relative h-60 overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft-lg sm:h-[360px] md:h-[440px]"
            >
              <Image
                src="/images/home/hero.jpg"
                alt={copy.photoAlt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent" />
            </motion.div>
            <motion.div
              {...rise(0.4)}
              className="absolute -bottom-5 left-2 flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-soft-lg md:-left-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Star aria-hidden className="fill-current" size={20} />
              </span>
              <div>
                <p className="text-sm leading-none font-bold text-foreground">{copy.ratingChipTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.ratingChipSubtitle}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
