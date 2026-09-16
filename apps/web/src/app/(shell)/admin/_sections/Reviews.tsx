"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminReview } from "@kayu/schemas";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { FilterSelect } from "../_components/FilterSelect";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { formatDate } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";

const copy = adminCopy.reviews;
const LIMIT = 50;

function ReviewCard({ review, busy, onToggle, onDelete }: { review: AdminReview; busy: boolean; onToggle: () => void; onDelete: () => Promise<unknown> }) {
  return (
    <article className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-foreground">{review.client.name}</p>
          <p className="text-xs text-muted-foreground">{copy.on(review.provider.displayName, formatDate(review.createdAt))}</p>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} />
          {!review.isPublic && <AdminStatusPill status="HIDDEN" className="h-6" />}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{review.comment ?? <span className="text-muted-foreground italic">{copy.noComment}</span>}</p>
      {review.reply && (
        <div className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">{copy.reply}</p>
          <p className="mt-1 text-sm">{review.reply}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={onToggle} className="secondary-action h-9 px-3 text-xs">
          {review.isPublic ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />} {review.isPublic ? copy.hide : copy.publish}
        </button>
        <ConfirmAction className="h-9 px-3 text-xs" destructive disabled={busy} sheet={{ title: copy.sheets.delete.title, description: copy.sheets.delete.description, confirmLabel: copy.sheets.delete.confirm }} onConfirm={onDelete}>
          <Trash2 size={14} aria-hidden /> {copy.delete}
        </ConfirmAction>
      </div>
    </article>
  );
}

export function Reviews() {
  const { q, page, set } = useAdminParams();
  const [rating, setRating] = useState("");
  const params = { q: q || undefined, rating: rating ? Number(rating) : undefined, page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.reviews(params),
    queryFn: () => adminApi(apiClient).reviews(params),
    placeholderData: keepPreviousData,
  });
  const toggle = useAdminMutation({
    mutationFn: ({ reviewId, isPublic }: { reviewId: string; isPublic: boolean }) => adminApi(apiClient).updateReview(reviewId, { isPublic }),
    invalidate: [["admin", "reviews"], ["providers"]],
    success: (_result, { isPublic }) => (isPublic ? copy.toasts.published : copy.toasts.hidden),
  });
  const remove = useAdminMutation({
    mutationFn: (reviewId: string) => adminApi(apiClient).deleteReview(reviewId),
    invalidate: [["admin", "reviews"], ["admin", "providers"], ["providers"]],
    success: copy.toasts.deleted,
    silent: true,
  });
  const items = query.data?.items ?? [];

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox placeholder={copy.searchPlaceholder} />
        <FilterSelect label={copy.ratingFilter} value={rating} onChange={(value) => { setRating(value); set({ page: null }); }} allLabel={adminCopy.common.all} options={[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: copy.stars(value) }))} />
      </div>
      <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={items.length === 0} empty={{ icon: Star, title: copy.empty }}>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              busy={toggle.isPending || remove.isPending}
              onToggle={() => toggle.mutate({ reviewId: review.id, isPublic: !review.isPublic })}
              onDelete={() => remove.mutateAsync(review.id)}
            />
          ))}
        </div>
      </QueryState>
      {items.length > 0 && <Pagination page={page} total={query.data?.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next })} />}
    </section>
  );
}
