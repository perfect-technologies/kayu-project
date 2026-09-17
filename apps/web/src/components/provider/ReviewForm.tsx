"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, bookingsApi, queryKeys, reviewsApi } from "@kayu/api";
import type { PublicReview } from "@kayu/schemas";
import { toast } from "sonner";
import { StarRating } from "@/components/ui/StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";

const copy = providerCopy.review;
const MAX = 500;

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-border bg-white p-4 text-center text-sm text-muted-foreground">{children}</p>;
}

export type ReviewFormProps = {
  providerId: string;
  /** `feat_reviews` site flag. */
  enabled: boolean;
  onCreated: (review: PublicReview) => void;
};

/** Enabled only with a COMPLETED, unreviewed booking with this provider. */
export function ReviewForm({ providerId, enabled, onCreated }: ReviewFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const canReview = user?.role === "CLIENT" || user?.role === "ADMIN";

  const completed = useQuery({
    queryKey: queryKeys.bookings.list({ status: "COMPLETED", limit: 100 }),
    queryFn: async () => (await bookingsApi(apiClient).list({ status: "COMPLETED", limit: 100 })).items,
    enabled: canReview && enabled,
    staleTime: 30 * 1000,
  });
  const withProvider = (completed.data ?? []).filter((booking) => booking.side === "client" && booking.counterpart.providerId === providerId);
  const eligible = withProvider
    .filter((booking) => !booking.hasReview)
    .sort((a, b) => String(b.scheduledAt).localeCompare(String(a.scheduledAt)))[0];

  const create = useMutation({
    mutationFn: () => reviewsApi(apiClient).create({ bookingId: eligible!.id, rating, comment: comment.trim() || undefined }),
    onSuccess: (review) => {
      toast.success(copy.thanks);
      onCreated({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reply: null,
        repliedAt: null,
        createdAt: review.createdAt,
        author: {
          id: user!.id,
          name: `${user!.firstName ?? ""} ${(user!.lastName ?? "").charAt(0)}${user!.lastName ? "." : ""}`.trim(),
          avatar: user!.avatar,
        },
      });
      setComment("");
      setRating(5);
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError && error.code === "ALREADY_EXISTS" ? copy.alreadyReviewed : errorMessage(error));
    },
  });

  if (!enabled) return <Notice>{copy.disabled}</Notice>;
  if (!canReview) return <Notice>{copy.providerRole}</Notice>;
  if (completed.isPending) return <Notice>{copy.needsBooking}</Notice>;
  if (!eligible) return <Notice>{withProvider.length > 0 ? copy.alreadyReviewed : copy.needsBooking}</Notice>;

  return (
    <form
      id="avis"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}
      className="scroll-mt-24 rounded-2xl border border-border bg-white p-4 shadow-soft"
    >
      <h2 className="mb-3 text-base font-extrabold text-foreground">{copy.title}</h2>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{copy.rating}</span>
        <StarRating value={rating} size={22} onChange={setRating} label={copy.rating} />
      </div>
      <label className="block text-xs font-bold text-foreground">
        {copy.comment}
        <textarea
          maxLength={MAX}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={copy.commentPlaceholder}
          rows={3}
          className="field mt-1.5 h-auto py-3"
        />
      </label>
      <p className="mt-1 text-right text-xs text-muted-foreground" aria-live="polite">
        {copy.counter(comment.length, MAX)}
      </p>
      <button type="submit" disabled={create.isPending} className="primary-action mt-3">
        {create.isPending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
