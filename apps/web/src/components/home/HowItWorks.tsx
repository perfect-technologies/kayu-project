"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Search, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@kayu/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { homeCopy } from "@/copy/home";
import { settingOr } from "@/hooks/useSiteSettings";

const copy = homeCopy.how;
const ICONS = [Search, ShieldCheck, MessageCircle] as const;

export function HowItWorks({ settings }: { settings: SiteSettings }) {
  const reduce = useReducedMotion();
  const overrides = [
    [settings.how1_title, settings.how1_desc],
    [settings.how2_title, settings.how2_desc],
    [settings.how3_title, settings.how3_desc],
  ] as const;

  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading align="center" eyebrow={copy.eyebrow} title={copy.title} />
        <div className="relative mt-10 grid gap-6 sm:gap-8 md:grid-cols-3">
          <div aria-hidden className="absolute top-9 right-0 left-0 hidden h-px bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-200 md:block" />
          {copy.steps.map((step, index) => {
            const Icon = ICONS[index] ?? Search;
            const [title, description] = overrides[index] ?? ["", ""];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                {...(reduce
                  ? { animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
                  : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 } })}
                className="relative rounded-2xl border border-border bg-white p-5 text-center shadow-soft sm:p-6"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft sm:size-14">
                  <Icon size={26} aria-hidden />
                </div>
                <span className="mt-4 inline-block text-[10px] font-extrabold tracking-[.19em] text-accent-foreground uppercase">
                  {copy.step(index + 1)}
                </span>
                <h3 className="mt-1 text-lg font-bold text-foreground">{settingOr(title, step.title)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{settingOr(description, step.description)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
