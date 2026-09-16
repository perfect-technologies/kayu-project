"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, CircleHelp, Headphones, LayoutDashboard, MessageCircle, Package, Search, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { aideCopy } from "@/copy/aide";
import { normalizeText } from "@/lib/dto/category";

const copy = aideCopy;

type Shortcut = { href: string; label: string; icon: LucideIcon };

export function AideClient() {
  const { user } = useAuth();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const needle = normalizeText(query.trim());
  const items = needle ? copy.faq.items.filter((item) => normalizeText(`${item.question} ${item.answer}`).includes(needle)) : copy.faq.items;

  const shortcuts: Shortcut[] = [
    user?.role === "PROVIDER"
      ? { href: "/mon-espace", label: copy.shortcuts.space, icon: LayoutDashboard }
      : { href: "/mes-reservations", label: copy.shortcuts.orders, icon: Package },
    { href: "/messagerie", label: copy.shortcuts.messages, icon: MessageCircle },
    { href: "/rechercher", label: copy.shortcuts.book, icon: CalendarDays },
    { href: "/compte", label: copy.shortcuts.account, icon: User },
  ];

  return (
    <div className="mobile-page max-w-3xl">
      <h1 className="!text-3xl">{copy.title}</h1>

      <label htmlFor={searchId} className="sr-only">
        {copy.searchLabel}
      </label>
      <div className="field field--icon mt-5 rounded-full border-transparent bg-secondary">
        <Search size={18} aria-hidden />
        <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} />
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-extrabold text-foreground">{copy.shortcuts.title}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {shortcuts.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-h-[104px] flex-col justify-between rounded-[22px] bg-secondary p-4 transition hover:bg-muted">
              <Icon size={24} aria-hidden strokeWidth={1.75} className="text-primary" />
              <span className="flex items-center justify-between gap-2 text-sm font-extrabold text-foreground">
                {label}
                <ChevronRight size={16} aria-hidden className="shrink-0" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-extrabold text-foreground">{copy.faq.title}</h2>
        <div className="mt-3 space-y-2">
          {items.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">{copy.faq.noResult}</p>}
          {items.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-border bg-white px-4 shadow-soft">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                <CircleHelp size={18} aria-hidden className="shrink-0 text-primary" />
                <span className="flex-1">{item.question}</span>
                <ChevronRight size={16} aria-hidden className="shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="animate-in fade-in slide-in-from-top-1 pb-4 pl-8 text-sm text-muted-foreground duration-200">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-center text-white">
        <span className="flex size-12 items-center justify-center rounded-full bg-white/15">
          <Headphones size={22} aria-hidden strokeWidth={1.75} />
        </span>
        <p className="text-lg font-extrabold">{copy.support.title}</p>
        <p className="text-sm text-white/80">{copy.support.description}</p>
        <Link href="/contact" className="primary-action primary-action--gold mt-1 max-w-xs">
          {copy.support.action}
        </Link>
      </section>
    </div>
  );
}
