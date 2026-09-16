"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@kayu/api";
import type { MeUser, UpdateProfileDto } from "@kayu/schemas";
import { Field, FormError, SelectField, TextAreaField } from "@/components/forms/Field";
import { LocationFields } from "@/components/reference/LocationFields";
import { useAuth } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";
import { errorMessage } from "@/copy/errors";

const copy = compteCopy.form;
const BIO_MAX = 1000;
type Country = "RDC" | "Congo";

type Draft = {
  firstName: string;
  lastName: string;
  placeId: string | null;
  country: Country;
  gender: string;
  birthdate: string;
  bio: string;
};

function toDate(value: MeUser["birthdate"]): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function fromMe(me: MeUser): Draft {
  return {
    firstName: me.firstName ?? "",
    lastName: me.lastName ?? "",
    placeId: me.placeId,
    country: me.country === "Congo" ? "Congo" : "RDC",
    gender: me.gender ?? "",
    birthdate: toDate(me.birthdate),
    bio: me.bio ?? "",
  };
}

function diff(initial: Draft, draft: Draft): UpdateProfileDto {
  const dto: UpdateProfileDto = {};
  if (draft.firstName.trim() !== initial.firstName) dto.firstName = draft.firstName.trim();
  if (draft.lastName.trim() !== initial.lastName) dto.lastName = draft.lastName.trim();
  if (draft.placeId !== initial.placeId) dto.placeId = draft.placeId;
  if (draft.country !== initial.country) dto.country = draft.country;
  if (draft.gender !== initial.gender) dto.gender = draft.gender || null;
  if (draft.birthdate !== initial.birthdate) dto.birthdate = draft.birthdate || null;
  if (draft.bio.trim() !== initial.bio) dto.bio = draft.bio.trim() || null;
  return dto;
}

/** "Informations personnelles": `PATCH /me/profile` with only the changed keys. Phone is read-only. */
export function ProfileForm({ me }: { me: MeUser }) {
  const { updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [initial, setInitial] = useState<Draft>(() => fromMe(me));
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = fromMe(me);
    setInitial(next);
    setDraft((current) => (Object.keys(diff(initial, current)).length === 0 ? next : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));
  const changes = diff(initial, draft);
  const dirty = Object.keys(changes).length > 0;
  const nameMissing = draft.firstName.trim().length === 0 || draft.lastName.trim().length === 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nameMissing) {
      setError(copy.nameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateProfile(changes);
      await queryClient.invalidateQueries({ queryKey: queryKeys.identity.me });
      toast.success(copy.saved);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <h2 className="text-base font-extrabold text-foreground">{copy.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={copy.firstName} required value={draft.firstName} onChange={(event) => patch({ firstName: event.target.value })} maxLength={80} autoComplete="given-name" />
        <Field label={copy.lastName} required value={draft.lastName} onChange={(event) => patch({ lastName: event.target.value })} maxLength={80} autoComplete="family-name" />
        <Field label={copy.phone} value={me.phone ?? ""} disabled readOnly hint={copy.phoneHint} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-bold text-foreground">{copy.city}</p>
          <LocationFields value={draft.placeId} onChange={(placeId) => patch({ placeId })} mode="full" stopAt="CITY" allowSuggest={false} />
        </div>
        <SelectField label={copy.country} value={draft.country} onChange={(event) => patch({ country: event.target.value as Country })}>
          <option value="RDC">{copy.countries.RDC}</option>
          <option value="Congo">{copy.countries.Congo}</option>
        </SelectField>
        <SelectField label={copy.gender} value={draft.gender} onChange={(event) => patch({ gender: event.target.value })}>
          {Object.entries(copy.genders).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <Field label={copy.birthdate} type="date" value={draft.birthdate} onChange={(event) => patch({ birthdate: event.target.value })} max={new Date().toISOString().slice(0, 10)} />
        <TextAreaField
          label={copy.bio}
          value={draft.bio}
          onChange={(event) => patch({ bio: event.target.value.slice(0, BIO_MAX) })}
          maxLength={BIO_MAX}
          placeholder={copy.bioPlaceholder}
          counter={copy.counter(draft.bio.length, BIO_MAX)}
          className="sm:col-span-2"
        />
      </div>
      <FormError message={error} className="mt-4" />
      <button type="submit" disabled={!dirty || busy} className="primary-action mt-5 sm:w-auto sm:min-w-48">
        {busy ? copy.saving : copy.save}
      </button>
    </form>
  );
}
