"use client";

import { useState } from "react";
import { GitMerge } from "lucide-react";
import { Choice, type ChoiceOption } from "@/components/reference/Choice";
import { adminCopy } from "@/copy/admin";
import { ConfirmAction } from "../_components/ConfirmAction";

export type MergeControlProps = {
  title: string;
  hint: string;
  fromLabel: string;
  intoLabel: string;
  /** The item chosen from the list with "Fusionner"; null shows the hint only. */
  from: ChoiceOption | null;
  /** Candidates with the same kind / type and parent, without `from`. */
  candidates: ChoiceOption[];
  sheet: { title: string; description: string; confirm: string };
  onMerge: (intoId: string) => Promise<unknown>;
  onClear: () => void;
};

/** "Fusionner" panel: the source is fixed by the list, the target comes from a filtered picker. */
export function MergeControl({ title, hint, fromLabel, intoLabel, from, candidates, sheet, onMerge, onClear }: MergeControlProps) {
  const [intoId, setIntoId] = useState("");
  return (
    <section className="rounded-3xl border border-border bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <GitMerge size={16} aria-hidden className="text-primary" /> {title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {from && (
        <div className="mt-3 space-y-3">
          <p className="text-xs">
            <span className="text-muted-foreground">{fromLabel} : </span>
            <span className="font-bold">{from.label}</span>
            <button type="button" onClick={() => { onClear(); setIntoId(""); }} className="ml-2 text-[11px] font-semibold text-muted-foreground underline">
              {adminCopy.common.cancel}
            </button>
          </p>
          <Choice label={intoLabel} options={candidates} value={intoId} onChange={setIntoId} />
          <ConfirmAction className="w-full" disabled={!intoId} destructive sheet={{ title: sheet.title, description: sheet.description, confirmLabel: sheet.confirm }} onConfirm={async () => { await onMerge(intoId); setIntoId(""); }}>
            <GitMerge size={14} aria-hidden /> {sheet.confirm}
          </ConfirmAction>
        </div>
      )}
    </section>
  );
}
