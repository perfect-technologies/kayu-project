"use client";

import { MessageSquareQuote } from "lucide-react";
import type { PublicReview } from "@kayu/schemas";
import { formatRelativeFr } from "@kayu/utils";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { StarRating } from "@/components/ui/StarRating";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.reviews;

export function ReviewsList({ reviews, total }: { reviews: PublicReview[]; total: number }) {
  return (
    <section id="avis-clients">
      <h2 className="mb-3 text-lg font-extrabold text-foreground">{copy.title(total)}</h2>
      {reviews.length === 0 ? (
        <div className="empty-state flex flex-col items-center py-6">
          <MessageSquareQuote size={22} aria-hidden className="mb-2 text-primary" />
          <p className="text-sm font-semibold text-foreground">{copy.empty}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.emptyHint}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold text-foreground">{review.author.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <StarRating value={review.rating} size={14} />
                  {formatRelativeFr(review.createdAt)}
                </span>
              </div>
              {review.comment && <ExpandableText text={review.comment} lines={3} className="mt-2 text-sm text-muted-foreground" />}
              {review.reply && (
                <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                  <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{copy.reply}</p>
                  <p className="mt-1 text-foreground/80">{review.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
