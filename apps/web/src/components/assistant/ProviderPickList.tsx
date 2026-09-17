"use client";

import { Check, SearchX } from "lucide-react";
import type { ProviderCard as ProviderCardDto } from "@kayu/schemas";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ProviderCardSkeleton } from "@/components/search/ProviderCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { assistantCopy } from "@/copy/assistant";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { findRoot } from "@/lib/dto/category";
import { cn } from "@/lib/utils";
import type { SearchProvidersOutput } from "./types";

const copy = assistantCopy.pick;
const SKELETONS = [0, 1, 2];

export function ProviderPickListSkeleton() {
  return (
    <div role="status" aria-label={assistantCopy.tools.searching} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {SKELETONS.map((index) => (
        <ProviderCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProviderPickList({
  output,
  searchHref,
  chosenIds,
  disabled,
  onChoose,
}: {
  output: SearchProvidersOutput;
  searchHref: string;
  chosenIds: Set<string>;
  disabled?: boolean;
  onChoose: (provider: ProviderCardDto) => void;
}) {
  const { tree } = useCategoryTree();

  if (output.items.length === 0) {
    return <EmptyState icon={SearchX} title={copy.empty.title} description={copy.empty.body} action={{ href: searchHref, label: copy.empty.action }} />;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{copy.count(output.items.length, output.total)}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {output.items.map((provider, index) => {
          const chosen = chosenIds.has(provider.id);
          return (
            <li key={provider.id} className="flex flex-col gap-2">
              <ProviderCard provider={provider} category={findRoot(tree, provider.categoryChain[0]?.slug)} index={index} />
              <button
                type="button"
                disabled={disabled || chosen}
                aria-pressed={chosen}
                onClick={() => onChoose(provider)}
                className={cn(
                  "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold transition",
                  chosen ? "bg-primary text-primary-foreground" : "border border-border bg-white text-primary hover:bg-muted disabled:opacity-55",
                )}
              >
                {chosen && <Check size={15} aria-hidden />}
                {chosen ? copy.chosen : copy.choose}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
