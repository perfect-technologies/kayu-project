"use client";

import { useEffect, useState } from "react";
import type { PlaceKind, PlaceSummary } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { Choice } from "./Choice";
import { SuggestPlaceForm, childKindsOf } from "./SuggestPlaceForm";
import { usePlaceAncestors, usePlaces } from "./useReferences";

const copy = providerCopy.references;

export type LocationFieldsProps = {
  /** Deepest selected place id. */
  value: string | null;
  onChange: (placeId: string | null, chain: PlaceSummary[]) => void;
  /** Filter mode stops at commune and allows an empty selection. */
  mode?: "filter" | "full";
  /** Stop the cascade at this kind (e.g. `CITY` for the account profile). */
  stopAt?: PlaceKind;
  allowSuggest?: boolean;
  className?: string;
};

function LevelSelect({
  parent,
  selected,
  onPick,
}: {
  parent: PlaceSummary | null;
  selected: PlaceSummary | null;
  onPick: (place: PlaceSummary | null) => void;
}) {
  const { items } = usePlaces(parent ? { parentId: parent.id } : { kind: "COUNTRY" });
  const kind = selected?.kind ?? items[0]?.kind ?? (parent ? childKindsOf(parent.kind)[0] : "COUNTRY");
  if (!selected && items.length === 0) return null;
  return (
    <Choice
      label={copy.kinds[kind ?? "COUNTRY"]}
      options={items}
      value={selected?.id ?? ""}
      onChange={(id) => onPick(items.find((item) => item.id === id) ?? null)}
    />
  );
}

/** Cascading country › province › city › commune › quartier selects from `GET /places`. */
export function LocationFields({ value, onChange, mode = "full", stopAt, allowSuggest = true, className }: LocationFieldsProps) {
  const [chain, setChain] = useState<PlaceSummary[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const restore = usePlaceAncestors(value && chain.length === 0 ? value : null);

  useEffect(() => {
    if (value && chain.length === 0 && restore.chain.length > 0) setChain(restore.chain);
    if (!value && chain.length > 0) setChain([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, restore.chain]);

  const pick = (level: number, place: PlaceSummary | null) => {
    const next = place ? [...chain.slice(0, level), place] : chain.slice(0, level);
    setChain(next);
    onChange(next.length > 0 ? next[next.length - 1]!.id : null, next);
  };

  const deepest = chain[chain.length - 1] ?? null;
  const stop = (mode === "filter" && deepest?.kind === "COMMUNE") || (stopAt !== undefined && deepest?.kind === stopAt);
  const showNext = deepest !== null && deepest.hasChildren && !stop;

  return (
    <section className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        <LevelSelect parent={null} selected={chain[0] ?? null} onPick={(place) => pick(0, place)} />
        {chain.map((place, index) => {
          const isLast = index === chain.length - 1;
          if (!isLast) {
            return (
              <LevelSelect
                key={place.id}
                parent={place}
                selected={chain[index + 1] ?? null}
                onPick={(next) => pick(index + 1, next)}
              />
            );
          }
          return showNext ? (
            <LevelSelect key={place.id} parent={place} selected={null} onPick={(next) => pick(index + 1, next)} />
          ) : null;
        })}
      </div>
      {allowSuggest && deepest && childKindsOf(deepest.kind).length > 0 && (
        <button
          type="button"
          onClick={() => setSuggesting((open) => !open)}
          aria-expanded={suggesting}
          className="mt-2 inline-flex min-h-9 items-center text-xs font-bold text-primary"
        >
          {copy.missingPlace}
        </button>
      )}
      {suggesting && deepest && <SuggestPlaceForm parent={deepest} onDone={() => setSuggesting(false)} />}
    </section>
  );
}
