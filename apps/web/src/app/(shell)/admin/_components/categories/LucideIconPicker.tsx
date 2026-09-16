"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, icons } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";
import { LucideIconView } from "./LucideIcon";

const copy = adminCopy.categories;
const NAMES = Object.keys(icons).sort();
const MAX_RESULTS = 96;

/** Labelled button opening a searchable grid of every Lucide icon; stores the icon name. */
export function LucideIconPicker({ label, value, onChange }: { label: string; value: string; onChange: (name: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (needle ? NAMES.filter((name) => name.toLowerCase().includes(needle)) : NAMES).slice(0, MAX_RESULTS);
  }, [query]);

  return (
    <div ref={root} className="relative min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
      </label>
      <button id={id} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="field h-12 justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {value ? <LucideIconView name={value} size={16} /> : <span className="text-muted-foreground">—</span>}
          <span className={cn("truncate font-mono text-xs", !value && "text-muted-foreground")}>{value || copy.iconPlaceholder}</span>
        </span>
        <ChevronDown size={14} aria-hidden className="shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[280px] rounded-2xl border border-border bg-white p-2 shadow-soft-lg">
          <div className="flex items-center gap-2 border-b border-border px-2 pb-2">
            <Search size={14} aria-hidden className="text-muted-foreground" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.iconSearch} aria-label={copy.iconSearch} autoFocus className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            {value && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-[11px] font-semibold text-muted-foreground">
                {copy.iconClear}
              </button>
            )}
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">{copy.iconNone}</p>
            ) : (
              <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
                {matches.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    aria-label={name}
                    aria-pressed={name === value}
                    onClick={() => { onChange(name); setOpen(false); }}
                    className={cn("flex aspect-square items-center justify-center rounded-lg border", name === value ? "border-primary bg-secondary text-primary" : "border-transparent text-foreground hover:bg-secondary/60")}
                  >
                    <LucideIconView name={name} size={18} />
                  </button>
                ))}
              </div>
            )}
            {!query && matches.length === MAX_RESULTS && <p className="mt-2 text-center text-[11px] text-muted-foreground">{copy.iconMore}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
