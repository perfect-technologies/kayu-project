"use client";

import { useId, useState } from "react";
import { providerCopy } from "@/copy/provider";
import { normalizeText } from "@/lib/dto/category";
import { cn } from "@/lib/utils";

export type ChoiceOption = { id: string; label: string };

export type ChoiceProps = {
  label: string;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  /** Label of the empty option (default "Choisir…"). */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

const copy = providerCopy.references;

/** Pill select; lists over 12 items get a search box above. */
export function Choice({ label, options, value, onChange, placeholder, required, disabled, className }: ChoiceProps) {
  const id = useId();
  const [q, setQ] = useState("");
  const needle = normalizeText(q.trim());
  const filtered = needle ? options.filter((option) => option.id === value || normalizeText(option.label).includes(needle)) : options;
  const kept = value && !options.some((option) => option.id === value);

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
      </label>
      {options.length > 12 && (
        <input
          type="search"
          aria-label={copy.search(label)}
          placeholder={copy.searchPlaceholder}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="field mb-2 h-11 bg-secondary/50"
        />
      )}
      <select
        id={id}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field rounded-full bg-secondary/60 pr-10"
      >
        <option value="">{placeholder ?? copy.choose}</option>
        {kept && <option value={value}>{copy.kept}</option>}
        {filtered.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
