"use client";

import { useId, useState } from "react";
import { providerCopy } from "@/copy/provider";
import { cn } from "@/lib/utils";

export type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
};

const copy = providerCopy.phoneField;
const KNOWN = copy.countries.map((country) => country.value);

/** Prefix select + local number; emits E.164 (`+243…`). */
export function PhoneField({ value, onChange, label, required, error, className }: PhoneFieldProps) {
  const id = useId();
  const [fallback, setFallback] = useState<string>(KNOWN[0]!);
  const prefix = KNOWN.find((candidate) => value.startsWith(candidate));
  const country = prefix ?? (!value || !value.startsWith("+") ? fallback : "other");
  const local = prefix ? value.slice(prefix.length) : value;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          aria-label={copy.prefix}
          value={country}
          onChange={(event) => {
            const next = event.target.value;
            setFallback(next === "other" ? fallback : next);
            onChange(next === "other" ? value : `${next}${local.replace(/\D/g, "")}`);
          }}
          className="field w-[7.5rem] shrink-0 bg-secondary/50 px-3"
        >
          {copy.countries.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="other">{copy.other}</option>
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          aria-invalid={error ? true : undefined}
          value={country === "other" ? value : local}
          maxLength={16}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^0-9+]/g, "");
            onChange(country === "other" ? digits : digits ? `${country}${digits.replace(/\D/g, "")}` : "");
          }}
          placeholder={country === "other" ? copy.otherPlaceholder : copy.placeholder}
          className="field"
        />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
