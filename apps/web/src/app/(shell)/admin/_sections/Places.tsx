"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminPlace, AdminPlaceSuggestion, PlaceKind } from "@kayu/schemas";
import { GitMerge, MapPinned, Pencil } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmAction } from "../_components/ConfirmAction";
import { FilterSelect } from "../_components/FilterSelect";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { formatDate } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";
import { MergeControl } from "./MergeControl";
import { PlaceForm, type PlaceFormValues } from "./PlaceForm";

const copy = adminCopy.places;
const KINDS: PlaceKind[] = ["COUNTRY", "PROVINCE", "CITY", "TERRITORY", "COMMUNE", "SECTOR", "CHIEFDOM", "QUARTIER", "VILLAGE"];
const INVALIDATE = [["admin", "places"], ["admin", "suggestions"], ["places"]] as const;

type Mode = { kind: "create" } | { kind: "edit"; id: string } | { kind: "suggestion"; suggestion: AdminPlaceSuggestion };

export function Places() {
  const { q, set } = useAdminParams();
  const [kind, setKind] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "create" });
  const [mergeFrom, setMergeFrom] = useState<AdminPlace | null>(null);

  const listParams = { q: q || undefined, kind: (kind || undefined) as PlaceKind | undefined, limit: 100 };
  const list = useQuery({ queryKey: queryKeys.admin.places(listParams), queryFn: () => adminApi(apiClient).places(listParams), placeholderData: keepPreviousData });
  const suggestions = useQuery({ queryKey: queryKeys.admin.suggestions({ status: "PENDING", limit: 50 }), queryFn: () => adminApi(apiClient).placeSuggestions({ status: "PENDING", limit: 50 }) });
  const editing = useQuery({ queryKey: queryKeys.admin.place(mode.kind === "edit" ? mode.id : ""), queryFn: () => adminApi(apiClient).place(mode.kind === "edit" ? mode.id : ""), enabled: mode.kind === "edit" });
  const mergeParams = mergeFrom ? { kind: mergeFrom.kind, parentId: mergeFrom.parentId ?? undefined, active: true, limit: 100 } : null;
  const candidates = useQuery({ queryKey: queryKeys.admin.places(mergeParams ?? undefined), queryFn: () => adminApi(apiClient).places(mergeParams!), enabled: mergeParams !== null });

  const save = useAdminMutation({
    mutationFn: async (values: PlaceFormValues) => {
      const body = { label: values.label, aliases: values.aliases, source: values.source || undefined, latitude: values.latitude, longitude: values.longitude, active: values.active };
      if (mode.kind === "edit") return adminApi(apiClient).updatePlace(mode.id, body);
      if (mode.kind === "suggestion") {
        const resolved = await adminApi(apiClient).approveSuggestion(mode.suggestion.id);
        const changed = values.label !== mode.suggestion.label || values.aliases.length > 0 || values.source || values.latitude !== null || !values.active;
        if (resolved.resolvedPlaceId && changed) await adminApi(apiClient).updatePlace(resolved.resolvedPlaceId, body);
        return resolved;
      }
      return adminApi(apiClient).createPlace({ kind: values.kind, parentId: values.parentId, ...body });
    },
    invalidate: INVALIDATE,
    success: mode.kind === "edit" ? copy.toasts.updated : mode.kind === "suggestion" ? copy.toasts.approved : copy.toasts.created,
    onSuccess: () => setMode({ kind: "create" }),
  });
  const reject = useAdminMutation({ mutationFn: (id: string) => adminApi(apiClient).rejectSuggestion(id), invalidate: INVALIDATE, success: copy.toasts.rejected, silent: true });
  const merge = useAdminMutation({
    mutationFn: (dto: { fromId: string; intoId: string }) => adminApi(apiClient).mergePlaces(dto),
    invalidate: INVALIDATE,
    success: (result) => copy.toasts.merged(Object.values(result.repointed).reduce((sum, n) => sum + n, 0)),
    onSuccess: () => setMergeFrom(null),
    silent: true,
  });

  const items = list.data?.items ?? [];
  const labelById = new Map(items.map((item) => [item.id, item.label]));
  const pending = suggestions.data?.items ?? [];
  const formTitle = mode.kind === "edit" ? copy.form.edit : mode.kind === "suggestion" ? copy.approve : copy.form.create;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-white p-4">
        <h3 className="text-sm font-extrabold text-foreground">{copy.suggestions(pending.length)}</h3>
        {pending.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{copy.noSuggestions}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((suggestion) => (
              <li key={suggestion.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {suggestion.label} <span className="text-[11px] font-semibold text-muted-foreground">({providerCopy.references.kinds[suggestion.kind]})</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {suggestion.parentChain.map((item) => item.label).join(" › ")} · {copy.suggestedBy(suggestion.user.name, formatDate(suggestion.createdAt))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode({ kind: "suggestion", suggestion })} className="secondary-action h-9 px-3 text-xs">
                    {copy.review}
                  </button>
                  <ConfirmAction className="h-9 px-3 text-xs" destructive sheet={{ title: copy.sheets.reject.title, description: copy.sheets.reject.description, confirmLabel: copy.sheets.reject.confirm }} onConfirm={() => reject.mutateAsync(suggestion.id)}>
                    {copy.reject}
                  </ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-5">
          <section className="rounded-3xl border border-border bg-white p-4">
            <h3 className="mb-3 text-sm font-extrabold text-foreground">{formTitle}</h3>
            <PlaceForm
              key={mode.kind === "edit" ? mode.id : mode.kind === "suggestion" ? mode.suggestion.id : "create"}
              place={mode.kind === "edit" ? (editing.data ?? null) : null}
              suggestion={mode.kind === "suggestion" ? mode.suggestion : null}
              busy={save.isPending || (mode.kind === "edit" && editing.isLoading)}
              submitLabel={mode.kind === "suggestion" ? copy.approve : adminCopy.common.save}
              hint={mode.kind === "suggestion" ? copy.approveHint : undefined}
              onSubmit={(values) => save.mutate(values)}
              onCancel={mode.kind === "create" ? undefined : () => setMode({ kind: "create" })}
            />
          </section>
          <MergeControl
            title={copy.mergeTitle}
            hint={copy.mergeHint}
            fromLabel={copy.mergeFrom}
            intoLabel={copy.mergeInto}
            from={mergeFrom ? { id: mergeFrom.id, label: mergeFrom.label } : null}
            candidates={(candidates.data?.items ?? []).filter((item) => item.id !== mergeFrom?.id && item.parentId === (mergeFrom?.parentId ?? null) && !item.mergedIntoId).map((item) => ({ id: item.id, label: item.label }))}
            sheet={copy.sheets.merge}
            onMerge={(intoId) => merge.mutateAsync({ fromId: mergeFrom!.id, intoId })}
            onClear={() => setMergeFrom(null)}
          />
        </div>
        <section className="rounded-3xl border border-border bg-white p-4 lg:col-span-7">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox placeholder={copy.searchPlaceholder} />
            <FilterSelect label={copy.kindsFilter} value={kind} onChange={(value) => { setKind(value); set({ page: null }); }} allLabel={adminCopy.common.all} options={KINDS.map((value) => ({ value, label: providerCopy.references.kinds[value] }))} />
          </div>
          <QueryState isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} isEmpty={items.length === 0} empty={{ icon: MapPinned, title: copy.empty }}>
            <ul className="max-h-[70dvh] space-y-1.5 overflow-y-auto pr-1">
              {items.map((place) => (
                <li key={place.id} className={cn("flex items-center gap-2 rounded-2xl border border-border px-3 py-2", (!place.active || place.mergedIntoId) && "opacity-55")}>
                  <span className="status-pill h-6 shrink-0 px-2 text-[10px]">{providerCopy.references.kinds[place.kind]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {place.label}
                      {place.mergedIntoId && <span className="ml-1 text-xs font-semibold text-muted-foreground">{copy.mergedInto(labelById.get(place.mergedIntoId) ?? place.mergedIntoId.slice(0, 8))}</span>}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {copy.children(place.childCount)}
                      {place.aliases.length > 0 && ` · ${place.aliases.join(", ")}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => setMode({ kind: "edit", id: place.id })} aria-label={adminCopy.common.edit} className="icon-button size-9">
                    <Pencil size={14} aria-hidden />
                  </button>
                  <button type="button" onClick={() => setMergeFrom(place)} disabled={Boolean(place.mergedIntoId)} aria-label={copy.merge} title={copy.merge} className="icon-button size-9">
                    <GitMerge size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </QueryState>
        </section>
      </div>
    </div>
  );
}
