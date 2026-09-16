"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Compass, House, MessageCircle, Search, User } from "lucide-react";
import { elevation, palette, radii, textStyles } from "@kayu/ui";
import { AnimatedList } from "@/components/ui/animated-list";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { LoadingCard, LoadingRow, SkeletonLines } from "@/components/ui/skeleton";
import { WizardSteps } from "@/components/ui/wizard-steps";
import { devCopy } from "@/copy/dev";

const copy = devCopy;

const swatches: Array<[string, string]> = [
  ["background", palette.background],
  ["foreground", palette.foreground],
  ["card", palette.card],
  ["primary", palette.primary],
  ["primary-foreground", palette.primaryForeground],
  ["secondary", palette.secondary],
  ["muted", palette.muted],
  ["muted-foreground", palette.mutedForeground],
  ["accent", palette.accent],
  ["destructive", palette.destructive],
  ["border", palette.border],
  ["input", palette.input],
  ["admin canvas", palette.adminCanvas],
  ["auth canvas", palette.authCanvas],
  ["focus ring", palette.focusRing],
  ["star", palette.star],
];

const statusKeys = ["confirmed", "pending", "cancelled", "completed", "elite", "messages"] as const;

const dockDemo = [
  { key: "home", icon: House },
  { key: "explore", icon: Compass },
  { key: "messages", icon: MessageCircle },
  { key: "profile", icon: User },
];

const initialList = ["Aline Malu", "Rosine Kiese", "Patrick Ilunga", "Grâce Mbuyi", "Jean Kalala"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-base font-extrabold sm:text-lg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DockDemo() {
  const [active, setActive] = useState("home");
  const reduceMotion = useReducedMotion();
  return (
    <div className="mobile-dock !static max-w-sm rounded-3xl">
      <div className="flex items-stretch justify-around px-2">
        {dockDemo.map(({ key, icon: Icon }) => {
          const on = key === active;
          return (
            <button key={key} type="button" onClick={() => setActive(key)} className="relative flex flex-1 flex-col items-center gap-1.5 pt-3 pb-4">
              {on && (
                <motion.span
                  layoutId="dev-dock-tab"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 34 }}
                  className="absolute bottom-1 h-1 w-9 rounded-full bg-accent"
                />
              )}
              <Icon size={24} strokeWidth={on ? 2.4 : 2} className={on ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-[11px] font-semibold ${on ? "text-primary" : "text-muted-foreground"}`}>{key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListDemo() {
  const [items, setItems] = useState(initialList);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className="secondary-action" onClick={() => setItems((list) => [...list].sort(() => Math.random() - 0.5))}>
          {copy.samples.listShuffle}
        </button>
        <button type="button" className="secondary-action" onClick={() => setItems((list) => list.slice(1))}>
          {copy.samples.listRemove}
        </button>
        <button type="button" className="secondary-action" onClick={() => setItems(initialList)}>
          {copy.samples.listReset}
        </button>
      </div>
      <AnimatedList
        items={items}
        keyOf={(item) => item}
        className="grid gap-2 sm:grid-cols-2"
        render={(item) => <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold">{item}</div>}
      />
    </div>
  );
}

export function TokensShowcase() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <div className="mobile-page max-w-5xl">
      <p className="text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">dev</p>
      <h1 className="mt-2">{copy.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{copy.subtitle}</p>

      <Section title={copy.sections.palette}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, hex]) => (
            <li key={name} className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="h-14" style={{ background: hex }} />
              <div className="px-3 py-2 text-xs">
                <p className="font-bold">{name}</p>
                <p className="font-mono text-muted-foreground">{hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={copy.sections.status}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statusKeys.map((key) => (
            <li key={key} className="rounded-2xl border p-3 text-xs" style={{ background: palette.status[key].bg, borderColor: palette.status[key].border, color: palette.status[key].fg }}>
              <p className="font-bold">{key}</p>
              <p className="font-mono">{palette.status[key].fg}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={copy.sections.type}>
        <div className="space-y-4 rounded-3xl border border-border bg-white p-5">
          <p className={`${textStyles.hero} font-heading font-extrabold`}>{copy.samples.heading}</p>
          <p className={`${textStyles.pageTitle} font-heading`}>{copy.samples.heading}</p>
          <p className={`${textStyles.sectionTitle} font-heading`}>{copy.samples.heading}</p>
          <p className={textStyles.body}>{copy.samples.body}</p>
          <p className={`${textStyles.caption} text-muted-foreground`}>{copy.samples.caption}</p>
          <p className={`${textStyles.captionSm} text-muted-foreground`}>{copy.samples.caption}</p>
          <p className={`${textStyles.eyebrow} text-muted-foreground uppercase`}>{copy.samples.eyebrow}</p>
        </div>
      </Section>

      <Section title={copy.sections.radii}>
        <ul className="flex flex-wrap gap-4">
          {Object.entries(radii).map(([name, value]) => (
            <li key={name} className="flex flex-col items-center gap-2 text-xs">
              <span className="block size-16 border-2 border-primary bg-secondary" style={{ borderRadius: value }} />
              <span className="font-bold">{name}</span>
              <span className="font-mono text-muted-foreground">{value}px</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={copy.sections.shadows}>
        <ul className="grid gap-4 sm:grid-cols-3">
          {Object.entries(elevation).map(([name, value]) => (
            <li key={name} className="rounded-3xl bg-white p-5 text-xs" style={{ boxShadow: value }}>
              <p className="font-bold">{name}</p>
              <p className="mt-1 font-mono break-all text-muted-foreground">{value}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={copy.sections.actions}>
        <div className="grid max-w-md gap-3">
          <button type="button" className="primary-action">{copy.samples.primary}</button>
          <button type="button" className="primary-action primary-action--gold">{copy.samples.gold}</button>
          <button type="button" className="primary-action" disabled>{copy.samples.disabled}</button>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="secondary-action">{copy.samples.secondary}</button>
            <button type="button" className="secondary-action secondary-action--danger">{copy.samples.danger}</button>
            <button type="button" className="icon-button" aria-label={copy.samples.secondary}>
              <Search size={18} />
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{copy.samples.hover}</p>
      </Section>

      <Section title={copy.sections.fields}>
        <div className="grid max-w-md gap-4">
          <label className="block">
            <span className="text-xs font-bold">{copy.samples.fieldLabel}</span>
            <span className="field mt-1.5">
              <input placeholder={copy.samples.fieldPlaceholder} />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-bold">{copy.samples.fieldLabel}</span>
            <span className="field field--icon mt-1.5">
              <Search size={18} />
              <input placeholder={copy.samples.fieldPlaceholder} />
            </span>
          </label>
        </div>
      </Section>

      <Section title={copy.sections.surfaces}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="empty-state">
            <CalendarCheck size={28} className="mx-auto text-primary" />
            <p className="mt-3 font-bold">{copy.samples.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.samples.emptyDescription}</p>
            <button type="button" className="primary-action primary-action--gold mt-4 !w-auto px-6">{copy.samples.emptyAction}</button>
          </div>
          <div className="metric-card flex items-center gap-3">
            <span className="metric-card__icon">
              <CalendarCheck size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold">{copy.samples.metricValue}</span>
              <span className="block text-xs text-muted-foreground">{copy.samples.metricLabel}</span>
            </span>
          </div>
          <a href="#tile" className="provider-tile block overflow-hidden border border-border bg-white">
            <span className="block aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://picsum.photos/seed/kayou-tile/640/480" alt="" className="size-full object-cover" />
            </span>
            <span className="block p-4">
              <span className="block font-extrabold">{copy.samples.tileTitle}</span>
              <span className="block text-xs text-muted-foreground">{copy.samples.tileMeta}</span>
            </span>
          </a>
          <div className="mesh-bg rounded-3xl border border-border p-6">
            <p className="gradient-text text-2xl font-extrabold">{copy.samples.eyebrow}</p>
          </div>
        </div>
      </Section>

      <Section title={copy.sections.pills}>
        <div className="flex flex-wrap gap-2">
          {statusKeys.map((key) => (
            <span key={key} className={`status-pill status-pill--${key}`}>{copy.statuses[key]}</span>
          ))}
        </div>
      </Section>

      <Section title={copy.sections.skeleton}>
        <div className="grid gap-4 sm:grid-cols-3">
          <LoadingCard />
          <div className="space-y-3">
            <LoadingRow />
            <LoadingRow />
          </div>
          <div className="rounded-3xl border border-border bg-white p-4">
            <SkeletonLines lines={4} />
          </div>
        </div>
      </Section>

      <Section title={copy.sections.motion}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold">{copy.samples.dockDemo}</p>
            <DockDemo />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold">{copy.samples.sheetDemo}</p>
            <button type="button" className="secondary-action" onClick={() => setSheetOpen(true)}>{copy.samples.sheetOpen}</button>
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={copy.samples.sheetTitle}>
              <p className="text-sm text-muted-foreground">{copy.samples.sheetBody}</p>
              <button type="button" className="primary-action mt-5" onClick={() => setSheetOpen(false)}>{copy.samples.sheetClose}</button>
            </BottomSheet>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold">{copy.samples.wizardDemo}</p>
            <div className="overflow-hidden rounded-3xl border border-border bg-white p-5">
              <WizardSteps step={step}>
                <p className="text-xl font-extrabold">{copy.samples.wizardStep(step)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{copy.samples.body}</p>
              </WizardSteps>
              <div className="mt-4 flex gap-2">
                <button type="button" className="secondary-action" disabled={step <= 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                  {copy.samples.wizardPrev}
                </button>
                <button type="button" className="secondary-action" disabled={step >= 4} onClick={() => setStep((s) => Math.min(4, s + 1))}>
                  {copy.samples.wizardNext}
                </button>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold">{copy.samples.listDemo}</p>
            <ListDemo />
          </div>
        </div>
      </Section>

      <Section title={copy.sections.css}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{copy.samples.pulse}</li>
          <li>{copy.samples.screenEnter}</li>
        </ul>
      </Section>
    </div>
  );
}
