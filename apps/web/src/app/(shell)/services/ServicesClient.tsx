"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Ellipsis, Search } from "lucide-react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { servicesCopy } from "@/copy/services";
import { normalizeText } from "@/lib/dto/category";
import { lucideIcon } from "@/lib/dto/icons";

const copy = servicesCopy;
const FIRST_PAGE = 12;

function ServiceCell({ category }: { category: CategoryTreeNode }) {
  const Icon = lucideIcon(category.icon);
  const label = copy.shortLabel[category.slug] ?? category.name;
  return (
    <Link
      href={`/rechercher?category=${encodeURIComponent(category.slug)}`}
      title={category.name}
      className="flex min-h-[105px] min-w-0 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F0F0E9] px-1.5 py-3 text-center text-[11px] font-bold text-[#0A4033] transition active:scale-[0.975] motion-reduce:active:scale-100 sm:min-h-32 sm:rounded-3xl sm:px-2 sm:py-3.5 sm:text-[13px]"
    >
      <span className="relative block">
        <Icon size={32} strokeWidth={2.2} aria-hidden />
        <i aria-hidden className="absolute -right-1 -bottom-0.5 size-2 rounded-full bg-accent" />
      </span>
      <span className="line-clamp-2">{label}</span>
    </Link>
  );
}

export function ServicesClient({ categories }: { categories: CategoryTreeNode[] }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const needle = normalizeText(q.trim());
  const filtered = needle
    ? categories.filter((category) => normalizeText(`${category.name} ${copy.shortLabel[category.slug] ?? ""}`).includes(needle))
    : categories;
  const visible = needle || all ? filtered : filtered.slice(0, FIRST_PAGE);

  return (
    <div className="mobile-page max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label={copy.back} className="icon-button">
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <h1 className="text-[22px] font-extrabold sm:text-2xl">{copy.title}</h1>
      </div>

      <label className="my-6 flex items-center gap-3 rounded-[28px] bg-secondary px-5 py-[15px] text-primary">
        <Search size={22} aria-hidden className="shrink-0" />
        <span className="sr-only">{copy.searchLabel}</span>
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-primary/60"
        />
      </label>

      {categories.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{copy.unavailable}</p>
      ) : (
        <div className="grid grid-cols-4 gap-[9px] sm:gap-3">
          {visible.map((category) => (
            <ServiceCell key={category.id} category={category} />
          ))}
        </div>
      )}

      {!needle && categories.length > FIRST_PAGE && (
        <button
          type="button"
          onClick={() => setAll((open) => !open)}
          aria-expanded={all}
          className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-3xl bg-[#E9F1EC] px-5 text-sm font-bold text-[#0A4033]"
        >
          <Ellipsis size={26} aria-hidden /> {all ? copy.showLess : copy.showAll}
        </button>
      )}

      {needle && filtered.length === 0 && <p className="py-10 text-center text-muted-foreground">{copy.empty}</p>}

      <Link
        href="/rechercher"
        className="mt-7 flex min-h-[68px] items-center justify-between rounded-3xl bg-primary px-6 font-bold text-primary-foreground shadow-soft"
      >
        {copy.cta}
        <ArrowRight size={20} aria-hidden />
      </Link>
    </div>
  );
}
