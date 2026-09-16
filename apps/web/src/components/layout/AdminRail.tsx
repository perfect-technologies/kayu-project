"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck, type LucideIcon } from "lucide-react";
import { shellCopy } from "@/copy/shell";
import { cn } from "@/lib/utils";

export type AdminSection = { key: string; label: string; icon: LucideIcon };

/** 230 px left rail on `lg`, scrolling tab bar below (contract §8). Sections come from workstream 08. */
export function AdminRail({
  sections,
  active,
  hrefFor = (key) => `/admin?tab=${encodeURIComponent(key)}`,
}: {
  sections: readonly AdminSection[];
  active: string;
  hrefFor?: (key: string) => string;
}) {
  return (
    <aside className="admin-rail">
      <div className="mb-7 hidden items-center gap-3 px-3 lg:flex">
        <span className="rounded-2xl bg-primary p-3 text-primary-foreground">
          <ShieldCheck size={22} aria-hidden />
        </span>
        <div>
          <p className="font-extrabold text-primary">{shellCopy.admin.title}</p>
          <p className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground uppercase">
            {shellCopy.admin.subtitle}
          </p>
        </div>
      </div>
      <nav aria-label={shellCopy.admin.nav} className="flex gap-2 overflow-x-auto lg:flex-col">
        {sections.map(({ key, label, icon: Icon }) => {
          const current = key === active;
          return (
            <Link
              key={key}
              href={hrefFor(key)}
              aria-current={current ? "page" : undefined}
              className={cn("admin-nav", current && "admin-nav--active")}
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {current && <ChevronRight size={14} aria-hidden className="ml-auto hidden lg:block" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
