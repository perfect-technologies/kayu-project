"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminReference, ReferenceType } from "@kayu/schemas";
import { GitMerge, Pencil, Settings2 } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FilterSelect } from "../_components/FilterSelect";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";
import { MergeControl } from "./MergeControl";
import { ReferenceForm, type ReferenceFormValues } from "./ReferenceForm";

const copy = adminCopy.lists;
const TYPES: ReferenceType[] = ["LANGUAGE", "INTERVENTION_MODE", "CURRENCY", "PRICE_UNIT", "SKILL"];
const INVALIDATE = [["admin", "references"], ["references"]] as const;

export function Lists() {
  const { q, set } = useAdminParams();
  const [type, setType] = useState<ReferenceType>("LANGUAGE");
  const [editing, setEditing] = useState<AdminReference | null>(null);
  const [mergeFrom, setMergeFrom] = useState<AdminReference | null>(null);

  const params = { q: q || undefined, type, limit: 100 };
  const list = useQuery({ queryKey: queryKeys.admin.references(params), queryFn: () => adminApi(apiClient).references(params), placeholderData: keepPreviousData });
  const items = list.data?.items ?? [];
  const labelById = new Map(items.map((item) => [item.id, item.label]));

  const save = useAdminMutation({
    mutationFn: (values: ReferenceFormValues) => {
      const body = { label: values.label, aliases: values.aliases, categoryId: values.categoryId, order: values.order, suggested: values.suggested, active: values.active, source: values.source || undefined };
      return editing ? adminApi(apiClient).updateReference(editing.id, body) : adminApi(apiClient).createReference({ type: values.type, ...body });
    },
    invalidate: INVALIDATE,
    success: editing ? copy.toasts.updated : copy.toasts.created,
    onSuccess: () => setEditing(null),
  });
  const merge = useAdminMutation({
    mutationFn: (dto: { fromId: string; intoId: string }) => adminApi(apiClient).mergeReferences(dto),
    invalidate: INVALIDATE,
    success: (result) => copy.toasts.merged(Object.values(result.repointed).reduce((sum, n) => sum + n, 0)),
    onSuccess: () => setMergeFrom(null),
    silent: true,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
      <div className="space-y-4 lg:col-span-5">
        <section className="rounded-3xl border border-border bg-white p-4">
          <h3 className="mb-3 text-sm font-extrabold text-foreground">{editing ? copy.form.edit : copy.form.create}</h3>
          <ReferenceForm key={editing?.id ?? "create"} item={editing} type={type} busy={save.isPending} onSubmit={(values) => save.mutate(values)} onCancel={editing ? () => setEditing(null) : undefined} />
        </section>
        <MergeControl
          title={copy.mergeTitle}
          hint={copy.mergeHint}
          fromLabel={copy.mergeFrom}
          intoLabel={copy.mergeInto}
          from={mergeFrom ? { id: mergeFrom.id, label: mergeFrom.label } : null}
          candidates={items.filter((item) => item.id !== mergeFrom?.id && item.type === mergeFrom?.type && item.categoryId === mergeFrom?.categoryId && item.active && !item.mergedIntoId).map((item) => ({ id: item.id, label: item.label }))}
          sheet={copy.sheets.merge}
          onMerge={(intoId) => merge.mutateAsync({ fromId: mergeFrom!.id, intoId })}
          onClear={() => setMergeFrom(null)}
        />
      </div>
      <section className="rounded-3xl border border-border bg-white p-4 lg:col-span-7">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBox placeholder={copy.searchPlaceholder} />
          <FilterSelect label={copy.form.type} value={type} onChange={(value) => { setType(value as ReferenceType); setEditing(null); setMergeFrom(null); set({ page: null }); }} options={TYPES.map((value) => ({ value, label: copy.types[value] }))} />
        </div>
        <QueryState isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} isEmpty={items.length === 0} empty={{ icon: Settings2, title: copy.empty }}>
          <ul className="max-h-[70dvh] space-y-1.5 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.id} className={cn("flex items-center gap-2 rounded-2xl border border-border px-3 py-2", (!item.active || item.mergedIntoId) && "opacity-55")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {item.label}
                    {item.mergedIntoId && <span className="ml-1 text-xs font-semibold text-muted-foreground">→ {labelById.get(item.mergedIntoId) ?? item.mergedIntoId.slice(0, 8)}</span>}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {copy.usage(item.usageCount)}
                    {item.suggested ? ` · ${copy.form.suggested}` : ""}
                    {item.aliases.length > 0 && ` · ${item.aliases.join(", ")}`}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing(item)} aria-label={adminCopy.common.edit} className="icon-button size-9">
                  <Pencil size={14} aria-hidden />
                </button>
                <button type="button" onClick={() => setMergeFrom(item)} disabled={Boolean(item.mergedIntoId)} aria-label={copy.merge} title={copy.merge} className="icon-button size-9">
                  <GitMerge size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
    </div>
  );
}
