"use client";

import { useId } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { authCopy, type PhoneCountryCode } from "@/copy/auth";
import { FormError, Spinner } from "@/components/forms/Field";
import { CountrySelect } from "./CountrySelect";

export type PhoneStepProps = {
  country: PhoneCountryCode;
  onCountryChange: (code: PhoneCountryCode) => void;
  number: string;
  onNumberChange: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
};

export function PhoneStep({ country, onCountryChange, number, onNumberChange, busy, error, onSubmit }: PhoneStepProps) {
  const id = useId();
  const copy = authCopy.phone;
  const hint = copy.countries.find((item) => item.code === country)?.hint ?? "";
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
          {copy.label}
        </label>
        <div className="flex gap-2">
          <CountrySelect value={country} onChange={onCountryChange} disabled={busy} />
          <div className="field field--icon min-w-0 flex-1">
            <Phone size={18} aria-hidden />
            <input
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              autoFocus
              required
              disabled={busy}
              value={number}
              onChange={(event) => onNumberChange(event.target.value.replace(/[^0-9 ]/g, ""))}
              placeholder={copy.placeholder}
              aria-describedby={`${id}-hint`}
              aria-invalid={error ? true : undefined}
            />
          </div>
        </div>
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-muted-foreground">
          {hint} · {copy.hint}
        </p>
      </div>
      <FormError message={error} />
      <button type="submit" disabled={busy || number.trim().length === 0} aria-busy={busy} className="primary-action">
        {busy ? (
          <>
            <Spinner /> {copy.sending}
          </>
        ) : (
          <>
            {copy.submit} <ArrowRight size={18} aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
