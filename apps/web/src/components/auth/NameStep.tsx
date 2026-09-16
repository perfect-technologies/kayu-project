"use client";

import { useState } from "react";
import { ArrowRight, User } from "lucide-react";
import type { Country, PlaceSummary } from "@kayu/schemas";
import { authCopy } from "@/copy/auth";
import { Field, FormError, Spinner } from "@/components/forms/Field";
import { LocationFields } from "@/components/reference/LocationFields";

export type NameStepValue = {
  firstName: string;
  lastName: string;
  placeId: string | null;
  country: Country | null;
};

export type NameStepProps = {
  initial: { firstName: string | null; lastName: string | null; placeId: string | null };
  busy: boolean;
  error: string | null;
  onSubmit: (value: NameStepValue) => void;
};

function countryOf(chain: PlaceSummary[]): Country | null {
  const root = chain.find((place) => place.kind === "COUNTRY");
  if (!root) return null;
  return /congo-?brazza|^congo$/i.test(root.label) && !/d[ée]mocratique|RDC/i.test(root.label) ? "Congo" : "RDC";
}

/** Prénom, Nom and country › city (the place cascade stops at CITY), saved through `PATCH /me/profile`. */
export function NameStep({ initial, busy, error, onSubmit }: NameStepProps) {
  const copy = authCopy.name;
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [lastName, setLastName] = useState(initial.lastName ?? "");
  const [placeId, setPlaceId] = useState<string | null>(initial.placeId);
  const [country, setCountry] = useState<Country | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError(copy.required);
      return;
    }
    setLocalError(null);
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), placeId, country });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{copy.subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.firstName} required autoComplete="given-name" autoFocus value={firstName} onChange={(event) => setFirstName(event.target.value)} icon={<User size={18} aria-hidden />} maxLength={80} />
        <Field label={copy.lastName} required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={80} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-bold">{copy.location}</p>
        <LocationFields
          value={placeId}
          stopAt="CITY"
          allowSuggest={false}
          onChange={(id, chain) => {
            setPlaceId(id);
            setCountry(countryOf(chain));
          }}
        />
      </div>
      <FormError message={error ?? localError} />
      <button type="submit" disabled={busy} aria-busy={busy} className="primary-action">
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
