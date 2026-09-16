"use client";

import { List, Map as MapIcon } from "lucide-react";
import { searchCopy } from "@/copy/search";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./search-state";

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (view: ViewMode) => void }) {
  const options: Array<{ key: ViewMode; label: string; Icon: typeof List }> = [
    { key: "list", label: searchCopy.view.list, Icon: List },
    { key: "map", label: searchCopy.view.map, Icon: MapIcon },
  ];
  return (
    <div role="group" aria-label={searchCopy.view.label} className="inline-flex rounded-full border border-border bg-white p-1 shadow-soft">
      {options.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
            value === key ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          <Icon size={14} aria-hidden /> {label}
        </button>
      ))}
    </div>
  );
}
