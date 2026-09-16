"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { authCopy, type PhoneCountryCode } from "@/copy/auth";

export type CountrySelectProps = {
  value: PhoneCountryCode;
  onChange: (code: PhoneCountryCode) => void;
  disabled?: boolean;
};

/** Pill select with the two dial codes (+243 RD Congo, +242 Congo-Brazzaville). */
export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const id = useId();
  return (
    <div className="relative shrink-0">
      <label htmlFor={id} className="sr-only">
        {authCopy.phone.country}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as PhoneCountryCode)}
        className="field h-12 w-[7.75rem] appearance-none rounded-full bg-secondary/60 pr-8 pl-4 font-semibold"
      >
        {authCopy.phone.countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.dial} {country.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
