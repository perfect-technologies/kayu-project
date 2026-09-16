"use client";

import { useEffect, useState } from "react";
import type { AdminReference, ReferenceType } from "@kayu/schemas";
import { Field, SelectField } from "@/components/forms/Field";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { adminCopy } from "@/copy/admin";
import { ToggleRow } from "../_components/ToggleRow";

const copy = adminCopy.lists;
const TYPES: ReferenceType[] = ["LANGUAGE", "INTERVENTION_MODE", "CURRENCY", "PRICE_UNIT", "SKILL"];

export type ReferenceFormValues = { type: ReferenceType; label: string; aliases: string[]; categoryId: string | null; order: number; suggested: boolean; active: boolean; source: string };

type Draft = { type: ReferenceType; label: string; aliases: string; categoryId: string; order: string; suggested: boolean; active: boolean; source: string };

function initial(item: AdminReference | null, type: ReferenceType): Draft {
  return { type: item?.type ?? type, label: item?.label ?? "", aliases: item?.aliases.join(", ") ?? "", categoryId: item?.categoryId ?? "", order: String(item?.order ?? 0), suggested: item?.suggested ?? true, active: item?.active ?? true, source: item?.source ?? "" };
}

/** Type, label, aliases, category scope (skills), order, suggested and active for a reference item. */
export function ReferenceForm({ item, type, busy, onSubmit, onCancel }: { item: AdminReference | null; type: ReferenceType; busy: boolean; onSubmit: (values: ReferenceFormValues) => void; onCancel?: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => initial(item, type));
  const { tree } = useCategoryTree();

  useEffect(() => {
    setDraft(initial(item, type));
  }, [item, type]);

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          type: draft.type,
          label: draft.label.trim(),
          aliases: draft.aliases.split(",").map((alias) => alias.trim()).filter(Boolean),
          categoryId: draft.type === "SKILL" && draft.categoryId ? draft.categoryId : null,
          order: Number(draft.order) || 0,
          suggested: draft.suggested,
          active: draft.active,
          source: draft.source.trim(),
        });
      }}
    >
      <SelectField label={copy.form.type} value={draft.type} disabled={item !== null} onChange={(event) => patch({ type: event.target.value as ReferenceType, categoryId: "" })}>
        {TYPES.map((value) => (
          <option key={value} value={value}>
            {copy.types[value]}
          </option>
        ))}
      </SelectField>
      {draft.type === "SKILL" && (
        <SelectField label={copy.form.category} value={draft.categoryId} onChange={(event) => patch({ categoryId: event.target.value })}>
          <option value="">{copy.form.categoryAny}</option>
          {tree.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
      )}
      <Field label={adminCopy.common.label} required value={draft.label} maxLength={100} onChange={(event) => patch({ label: event.target.value })} />
      <Field label={adminCopy.common.aliases} value={draft.aliases} hint={adminCopy.common.aliasesHint} onChange={(event) => patch({ aliases: event.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={adminCopy.common.order} type="number" min={0} max={10000} value={draft.order} onChange={(event) => patch({ order: event.target.value })} />
        <Field label={adminCopy.common.source} value={draft.source} maxLength={500} onChange={(event) => patch({ source: event.target.value })} />
      </div>
      <ToggleRow label={copy.form.suggested} description={copy.form.suggestedHint} checked={draft.suggested} onChange={(suggested) => patch({ suggested })} />
      <ToggleRow label={copy.form.active} checked={draft.active} onChange={(active) => patch({ active })} />
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary-action flex-1" disabled={busy}>
            {adminCopy.common.cancel}
          </button>
        )}
        <button type="submit" disabled={busy || draft.label.trim().length === 0} className="primary-action min-h-11 flex-1 text-sm">
          {busy ? adminCopy.common.saving : item ? adminCopy.common.save : adminCopy.common.create}
        </button>
      </div>
    </form>
  );
}
