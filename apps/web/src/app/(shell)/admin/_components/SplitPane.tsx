"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";

export type SplitPaneProps = {
  /** True when `?id=` names an item: mobile shows the detail alone. */
  open: boolean;
  onBack: () => void;
  list: ReactNode;
  detail: ReactNode;
  placeholder: { icon: LucideIcon; title: string };
};

/** 5/7 list + detail on `lg`; one pane at a time below, swapped by `?id=`. */
export function SplitPane({ open, onBack, list, detail, placeholder: { icon: Icon, title } }: SplitPaneProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
      <div className={cn("min-w-0 lg:col-span-5", open && "hidden lg:block")}>{list}</div>
      <div className={cn("min-w-0 lg:col-span-7", !open && "hidden lg:block")}>
        {open ? (
          <div>
            <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-primary lg:hidden">
              <ArrowLeft size={16} aria-hidden /> {adminCopy.common.back}
            </button>
            {detail}
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-white/60 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Icon size={26} aria-hidden strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">{title}</p>
          </div>
        )}
      </div>
    </div>
  );
}
