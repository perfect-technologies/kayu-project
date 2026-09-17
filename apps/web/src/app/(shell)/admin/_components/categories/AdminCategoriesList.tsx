"use client";

import type { AdminCategoryNode } from "@kayu/schemas";
import { ChevronRight } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { categoryColorClasses } from "@/lib/dto/categoryColors";
import { cn } from "@/lib/utils";
import { LucideIconView } from "./LucideIcon";

const copy = adminCopy.categories;

export type AdminCategoriesListProps = {
  nodes: readonly AdminCategoryNode[];
  selectedId: string | null;
  onSelect: (node: AdminCategoryNode) => void;
  /** Level-1 rows show the colour swatch; deeper rows don't. */
  swatch?: boolean;
};

/** One column of the tree: icon, name, slug, counts, active state; the selected row is emerald. */
export function AdminCategoriesList({ nodes, selectedId, onSelect, swatch }: AdminCategoriesListProps) {
  if (nodes.length === 0) return <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">{copy.noChildren}</p>;
  return (
    <ul className="space-y-1.5">
      {[...nodes]
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map((node) => {
          const active = node.id === selectedId;
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelect(node)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white hover:bg-secondary/40",
                  !node.isActive && !active && "opacity-60",
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", active ? "bg-white/15" : "bg-secondary text-primary", swatch && !active && node.color ? categoryColorClasses[node.color] : undefined)}>
                  <LucideIconView name={node.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{node.name}</span>
                    <span className={cn("text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>#{node.order}</span>
                    {!node.isActive && <span className={cn("status-pill h-5 px-2 text-[10px]", active && "border-white/30 bg-white/10 text-white")}>{adminCopy.common.inactive}</span>}
                  </span>
                  <span className={cn("block truncate text-[11px]", active ? "text-white/70" : "text-muted-foreground")}>
                    {node.slug} · {copy.counts(node.counts)}
                  </span>
                </span>
                {node.level < 3 && <ChevronRight size={14} aria-hidden className={cn("shrink-0", active ? "text-white/80" : "text-muted-foreground")} />}
              </button>
            </li>
          );
        })}
    </ul>
  );
}
