"use client";

import { useEffect, useState } from "react";
import type { AdminPlaceDetail, AdminPlaceSuggestion, PlaceKind, PlaceSummary } from "@kayu/schemas";
import { Field } from "@/components/forms/Field";
import { SelectField } from "@/components/forms/Field";
import { LocationFields } from "@/components/reference/LocationFields";
import { adminCopy } from "@/copy/admin";
import { providerCopy } from "@/copy/provider";
import { ToggleRow } from "../_components/ToggleRow";

const copy = adminCopy.places.form;
const KINDS: PlaceKind[] = ["COUNTRY", "PROVINCE", "CITY", "TERRITORY", "COMMUNE", "SECTOR", "CHIEFDOM", "QUARTIER", "VILLAGE"];

export type PlaceFormValues = {
  kind: PlaceKind;
  parentId: string | null;
  label: string;
  aliases: string[];
  source: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
};

export type PlaceFormProps = {
  /** Edit mode: kind and parent are fixed by the API. */
  place: AdminPlaceDetail | null;
  /** Suggestion mode: prefilled from the member's proposal. */
  suggestion: AdminPlaceSuggestion | null;
  busy: boolean;
  submitLabel: string;
  hint?: string;
  onSubmit: (values: PlaceFormValues) => void;
  onCancel?: () => void;
};

type Draft = { kind: PlaceKind; parentId: string | null; label: string; aliases: string; source: string; latitude: string; longitude: string; active: boolean };

function initial(place: AdminPlaceDetail | null, suggestion: AdminPlaceSuggestion | null): Draft {
  if (place) return { kind: place.kind, parentId: place.parentId, label: place.label, aliases: place.aliases.join(", "), source: place.source ?? "", latitude: place.latitude?.toString() ?? "", longitude: place.longitude?.toString() ?? "", active: place.active };
  if (suggestion) return { kind: suggestion.kind, parentId: suggestion.parentId, label: suggestion.label, aliases: "", source: "", latitude: "", longitude: "", active: true };
  return { kind: "COMMUNE", parentId: null, label: "", aliases: "", source: "", latitude: "", longitude: "", active: true };
}

function chainLine(chain: PlaceSummary[]): string {
  return chain.map((item) => item.label).join(" › ");
}

/** Kind, parent cascade, label, source, aliases, coordinates and active switch for a place. */
export function PlaceForm({ place, suggestion, busy, submitLabel, hint, onSubmit, onCancel }: PlaceFormProps) {
  const [draft, setDraft] = useState<Draft>(() => initial(place, suggestion));
  const editing = place !== null;

  useEffect(() => {
    setDraft(initial(place, suggestion));
  }, [place, suggestion]);

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));
  const number = (value: string) => (value.trim() === "" ? null : Number(value));
  const chain = place ? place.chain.slice(0, -1) : suggestion ? suggestion.parentChain : [];

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          kind: draft.kind,
          parentId: draft.parentId,
          label: draft.label.trim(),
          aliases: draft.aliases.split(",").map((alias) => alias.trim()).filter(Boolean),
          source: draft.source.trim(),
          latitude: number(draft.latitude),
          longitude: number(draft.longitude),
          active: draft.active,
        });
      }}
    >
      {hint && <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-xs text-foreground">{hint}</p>}
      <SelectField label={copy.kind} value={draft.kind} disabled={editing} onChange={(event) => patch({ kind: event.target.value as PlaceKind })}>
        {KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {providerCopy.references.kinds[kind]}
          </option>
        ))}
      </SelectField>
      {editing || suggestion ? (
        <p className="text-xs text-muted-foreground">
          {copy.chain} : <span className="font-semibold text-foreground">{chain.length > 0 ? chainLine(chain) : copy.noParent}</span>
        </p>
      ) : (
        draft.kind !== "COUNTRY" && (
          <div>
            <p className="mb-1.5 text-xs font-bold text-foreground">{copy.parent}</p>
            <LocationFields value={draft.parentId} onChange={(parentId) => patch({ parentId })} allowSuggest={false} />
            <p className="mt-1 text-[11px] text-muted-foreground">{copy.parentHint}</p>
          </div>
        )
      )}
      <Field label={adminCopy.common.label} required value={draft.label} minLength={2} maxLength={100} onChange={(event) => patch({ label: event.target.value })} />
      <Field label={adminCopy.common.source} value={draft.source} maxLength={500} onChange={(event) => patch({ source: event.target.value })} />
      <Field label={adminCopy.common.aliases} value={draft.aliases} hint={adminCopy.common.aliasesHint} onChange={(event) => patch({ aliases: event.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.latitude} type="number" step="any" min={-90} max={90} value={draft.latitude} onChange={(event) => patch({ latitude: event.target.value })} />
        <Field label={copy.longitude} type="number" step="any" min={-180} max={180} value={draft.longitude} onChange={(event) => patch({ longitude: event.target.value })} />
      </div>
      <ToggleRow label={copy.active} checked={draft.active} onChange={(active) => patch({ active })} />
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary-action flex-1" disabled={busy}>
            {adminCopy.common.cancel}
          </button>
        )}
        <button type="submit" disabled={busy || draft.label.trim().length < 2 || (draft.kind !== "COUNTRY" && !draft.parentId)} className="primary-action min-h-11 flex-1 text-sm">
          {busy ? adminCopy.common.saving : submitLabel}
        </button>
      </div>
    </form>
  );
}
