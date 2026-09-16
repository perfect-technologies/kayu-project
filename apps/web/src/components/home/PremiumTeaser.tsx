"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, ShieldCheck, TrendingUp } from "lucide-react";
import type { SiteSettings } from "@kayu/schemas";
import { homeCopy } from "@/copy/home";
import { settingOr } from "@/hooks/useSiteSettings";

const copy = homeCopy.premium;

/** The one emerald gradient panel allowed by contract §11 rule 2. */
export function PremiumTeaser({ settings }: { settings: SiteSettings }) {
  const reduce = useReducedMotion();
  const tiers = [
    { Icon: ShieldCheck, label: copy.tiers.verified },
    { Icon: TrendingUp, label: copy.tiers.boosted },
    { Icon: Crown, label: copy.tiers.elite },
  ];
  const inView = (delay = 0, scale = false) => {
    const target = scale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 };
    return {
      initial: scale ? { opacity: 0, scale: 0.9 } : { opacity: 0, y: 24 },
      ...(reduce
        ? { animate: target, transition: { duration: 0 } }
        : { whileInView: target, viewport: { once: true }, transition: { delay } }),
    };
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div
        {...inView()}
        className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shadow-soft-lg sm:rounded-[2rem] sm:p-8 md:p-14"
      >
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-amber-400/20 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="text-2xl leading-tight font-extrabold text-white sm:text-3xl md:text-4xl">
              {settingOr(settings.premium_title, copy.title)}
            </h2>
            <p className="mt-3 max-w-md text-emerald-50">{settingOr(settings.premium_subtitle, copy.subtitle)}</p>
            <Link
              href="/premium"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 font-bold text-accent-foreground shadow-soft"
            >
              {copy.cta} <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.label}
                {...inView(index * 0.08, true)}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-md sm:p-5"
              >
                <tier.Icon aria-hidden className="mx-auto text-amber-300" size={22} />
                <p className="mt-2 text-xs font-bold">{tier.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
