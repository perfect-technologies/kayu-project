"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { authCopy } from "@/copy/auth";
import { FormError, Spinner } from "@/components/forms/Field";
import { cn } from "@/lib/utils";

export type TermsStepProps = {
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
};

/** Custom square checkbox linking the CGU and the privacy policy, then `POST /me/accept-terms`. */
export function TermsStep({ busy, error, onSubmit }: TermsStepProps) {
  const copy = authCopy.terms;
  const [checked, setChecked] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (checked) onSubmit();
      }}
    >
      <div>
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{copy.subtitle}</p>
      </div>
      <TermsCheckbox checked={checked} onChange={setChecked} copy={copy} />
      <FormError message={error} />
      <button type="submit" disabled={busy || !checked} aria-busy={busy} className="primary-action primary-action--gold">
        {busy ? (
          <>
            <Spinner /> {copy.saving}
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

export type TermsCopy = { accept: string; cgu: string; and: string; privacy: string; end: string };

/** Shared by the auth terms step and the wizard's last step. */
export function TermsCheckbox({
  checked,
  onChange,
  copy,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  copy: TermsCopy;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white p-3.5", className)}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white",
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="text-sm text-muted-foreground">
        {copy.accept}{" "}
        <Link href="/cgu" target="_blank" className="font-semibold text-primary underline underline-offset-2">
          {copy.cgu}
        </Link>{" "}
        {copy.and}{" "}
        <Link href="/confidentialite" target="_blank" className="font-semibold text-primary underline underline-offset-2">
          {copy.privacy}
        </Link>{" "}
        {copy.end}
      </span>
    </label>
  );
}
