"use client";

import { Search } from "lucide-react";
import { searchCopy } from "@/copy/search";

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{searchCopy.searchLabel}</span>
      <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={searchCopy.searchPlaceholder}
        className="h-12 w-full rounded-full border border-border bg-white py-3.5 pr-4 pl-11 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}
