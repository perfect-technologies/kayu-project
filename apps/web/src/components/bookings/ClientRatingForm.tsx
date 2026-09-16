"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewsApi } from "@kayu/api";
import { StarRating } from "@/components/ui/StarRating";
import { bookingsCopy } from "@/copy/bookings";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";
import { invalidateBookingQueries } from "./BookingActions";

const copy = bookingsCopy.clientRating;
const MAX = 500;

/** Provider → client rating for a COMPLETED booking; `POST /reviews/clients`. Hidden by callers once `hasClientReview`. */
export function ClientRatingForm({ bookingId, className }: { bookingId: string; className?: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => reviewsApi(apiClient).createClientReview({ bookingId, rating, comment: comment.trim() || undefined }),
    onSuccess: async () => {
      await invalidateBookingQueries(queryClient);
      toast.success(copy.thanks);
    },
    onError: (cause) => setError(errorMessage(cause)),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        submit.mutate();
      }}
      className={className ?? "mt-4 rounded-2xl bg-secondary/60 p-4"}
    >
      <p className="text-sm font-extrabold text-foreground">{copy.title}</p>
      <div className="mt-2">
        <StarRating value={rating} onChange={setRating} size={22} label={copy.ratingLabel} />
      </div>
      <label className="mt-3 block text-xs font-bold text-foreground">
        {copy.commentLabel}
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, MAX))}
          rows={3}
          maxLength={MAX}
          placeholder={copy.commentPlaceholder}
          className="field mt-1.5 h-auto py-3"
        />
      </label>
      <p className="mt-1 text-right text-[11px] text-muted-foreground" aria-live="polite">
        {copy.counter(comment.length, MAX)}
      </p>
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
      <button type="submit" disabled={submit.isPending} className="mt-2 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-55">
        {submit.isPending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
