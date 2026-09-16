"use client";

import { useState } from "react";
import type { ReferenceType } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { normalizeText } from "@/lib/dto/category";
import { cn } from "@/lib/utils";
import { useReferences } from "./useReferences";

const copy = providerCopy.references;

export type MultipleChoicesProps = {
  label: string;
  type: ReferenceType;
  categoryId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

/** Pill multi-select with a search box over `GET /references?type=`. */
export function MultipleChoices({ label, type, categoryId, value, onChange, className }: MultipleChoicesProps) {
  const { items, isError } = useReferences(type, categoryId);
  const [q, setQ] = useState("");
  const needle = normalizeText(q.trim());
  const visible = items.filter((item) => value.includes(item.id) || !needle || normalizeText(item.label).includes(needle));

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <input
        type="search"
        aria-label={copy.search(label)}
        placeholder={copy.multiSearch}
        value={q}
        onChange={(event) => setQ(event.target.value)}
        className="field h-11"
      />
      {isError && (
        <p role="alert" className="text-xs text-destructive">
          {copy.unavailable}
        </p>
      )}
      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {visible.map((item) => {
          const active = value.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? value.filter((id) => id !== item.id) : [...value, item.id])}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full border px-3.5 text-xs font-semibold",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/50 text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
