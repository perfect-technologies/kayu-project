"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";
import { useAdminParams } from "./useAdminParams";

/** Debounced (300 ms) search input mirrored to `?q=`; a new query resets `?page`. */
export function SearchBox({ placeholder, className }: { placeholder: string; className?: string }) {
  const { q, set } = useAdminParams();
  const [value, setValue] = useState(q);
  const last = useRef(q);

  useEffect(() => {
    if (q !== last.current) {
      last.current = q;
      setValue(q);
    }
  }, [q]);

  useEffect(() => {
    if (value === last.current) return;
    const timer = window.setTimeout(() => {
      last.current = value;
      set({ q: value.trim(), page: null });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, set]);

  return (
    <label className={cn("field field--icon h-11 min-w-0 flex-1", className)}>
      <Search size={16} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={adminCopy.common.search}
        autoComplete="off"
      />
    </label>
  );
}
