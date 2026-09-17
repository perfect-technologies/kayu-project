"use client";

import { useState } from "react";
import { BadgeCheck, Crown, Star } from "lucide-react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { Choice } from "@/components/reference/Choice";
import { LocationFields } from "@/components/reference/LocationFields";
import { useReferences } from "@/components/reference/useReferences";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { searchCopy } from "@/copy/search";
import { cn } from "@/lib/utils";
import { EMPTY_DRAFT, RATING_STEPS, SORT_KEYS, type FilterDraft, type SortKey } from "./search-state";

const copy = searchCopy.sheet;

function SwitchRow({
  checked,
  onChange,
  icon: Icon,
  title,
  hint,
  tone,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  icon: typeof Crown;
  title: string;
  hint: string;
  tone: "amber" | "emerald";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition",
        checked ? "border-primary/30 bg-primary/5" : "border-border bg-white",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          checked ? (tone === "amber" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-600") : "bg-muted text-muted-foreground",
        )}
      >
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <span aria-hidden className={cn("flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition", checked ? "bg-primary" : "bg-muted")}>
        <span className={cn("size-5 rounded-full bg-white shadow transition", checked && "translate-x-4")} />
      </span>
    </button>
  );
}

export type FiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  initial: FilterDraft;
  onApply: (draft: FilterDraft) => void;
  tree: CategoryTreeNode[];
  hasPosition: boolean;
};

/** Bottom sheet on mobile, centred modal from `sm`; edits stay in a draft until "Appliquer". */
export function FiltersSheet(props: FiltersSheetProps) {
  return (
    <BottomSheet
      open={props.open}
      onClose={props.onClose}
      title={copy.title}
      className="max-h-[85dvh] rounded-t-3xl bg-background sm:top-[7dvh] sm:bottom-auto sm:max-h-[86dvh] sm:rounded-3xl"
    >
      {props.open && <SheetBody key="body" {...props} />}
    </BottomSheet>
  );
}

function SheetBody({ onClose, initial, onApply, tree, hasPosition }: FiltersSheetProps) {
  const [draft, setDraft] = useState<FilterDraft>(initial);
  const languages = useReferences("LANGUAGE").items;
  const modes = useReferences("INTERVENTION_MODE").items;
  const roots = tree.filter((node) => node.level === 1);
  const category = roots.find((node) => node.slug === draft.category) ?? null;
  const subcategory = category?.children.find((node) => node.id === draft.subcategory) ?? null;
  const patch = (next: Partial<FilterDraft>) => setDraft((current) => ({ ...current, ...next }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-3xl border border-border bg-white p-4 shadow-soft">
        <Choice
          label={copy.category}
          placeholder={copy.allCategories}
          options={roots.map((node) => ({ id: node.slug, label: node.name }))}
          value={draft.category}
          onChange={(category) => patch({ category, subcategory: "", service: "" })}
        />
        {category && category.children.length > 0 && (
          <Choice
            label={copy.subcategory}
            placeholder={copy.allSubcategories}
            options={category.children.map((node) => ({ id: node.id, label: node.name }))}
            value={draft.subcategory}
            onChange={(subcategory) => patch({ subcategory, service: "" })}
          />
        )}
        {subcategory && subcategory.children.length > 0 && (
          <Choice
            label={copy.service}
            placeholder={copy.allServices}
            options={subcategory.children.map((node) => ({ id: node.id, label: node.name }))}
            value={draft.service}
            onChange={(service) => patch({ service })}
          />
        )}
        <LocationFields mode="filter" allowSuggest={false} value={draft.place || null} onChange={(place) => patch({ place: place ?? "" })} />
        <Choice label={copy.language} options={languages} value={draft.language} onChange={(language) => patch({ language })} />
        <Choice label={copy.mode} options={modes} value={draft.mode} onChange={(mode) => patch({ mode })} />
        <Choice
          label={copy.sort}
          placeholder={copy.sortOptions.recommended}
          options={SORT_KEYS.filter((key) => key !== "recommended").map((key) => ({ id: key, label: copy.sortOptions[key] }))}
          value={draft.sort === "recommended" ? "" : draft.sort}
          onChange={(sort) => patch({ sort: (sort || "recommended") as SortKey })}
        />
        {draft.sort === "distance" && !hasPosition && <p className="text-xs text-muted-foreground">{copy.distanceNeedsPosition}</p>}
      </div>

      <div className="rounded-3xl border border-border bg-white p-4 shadow-soft">
        <p className="mb-2 text-sm font-bold text-foreground">{copy.minRating}</p>
        <div className="flex flex-wrap gap-2">
          {RATING_STEPS.map((step) => {
            const active = draft.minRating === step;
            return (
              <button
                key={step}
                type="button"
                aria-pressed={active}
                onClick={() => patch({ minRating: step })}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold transition",
                  active ? "bg-primary text-primary-foreground" : "border border-border bg-white text-foreground/80",
                )}
              >
                {step > 0 && <Star aria-hidden className="fill-amber-400 text-amber-400" size={13} />}
                {step === 0 ? copy.ratingAll : `${String(step).replace(".", ",")}+`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 rounded-3xl border border-border bg-white p-4 shadow-soft">
        <SwitchRow checked={draft.premiumOnly} onChange={(premiumOnly) => patch({ premiumOnly })} icon={Crown} title={copy.premiumOnly} hint={copy.premiumOnlyHint} tone="amber" />
        <SwitchRow checked={draft.verifiedOnly} onChange={(verifiedOnly) => patch({ verifiedOnly })} icon={BadgeCheck} title={copy.verifiedOnly} hint={copy.verifiedOnlyHint} tone="emerald" />
      </div>

      <div className="sticky -bottom-[calc(20px+env(safe-area-inset-bottom))] -mx-5 flex gap-3 bg-background px-5 py-3">
        <button
          type="button"
          onClick={() => {
            onApply(EMPTY_DRAFT);
            onClose();
          }}
          className="secondary-action min-h-12 flex-1 rounded-full"
        >
          {copy.reset}
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-soft"
        >
          {copy.apply}
        </button>
      </div>
    </div>
  );
}
