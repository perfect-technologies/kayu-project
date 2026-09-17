"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { queryKeys, reviewsApi } from "@kayu/api";
import type { BookingCard, MyReview } from "@kayu/schemas";
import { formatSlotDay } from "@/components/bookings/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { StarRating } from "@/components/ui/StarRating";
import { avisCopy } from "@/copy/avis";
import { apiClient } from "@/lib/api";

const copy = avisCopy;
const TO_REVIEW_MAX = 6;

function DashedNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-border bg-white/60 p-5 text-center text-sm text-muted-foreground">{children}</p>;
}

function ToReviewRow({ booking }: { booking: BookingCard }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
      <MiniAvatar src={booking.counterpart.photo} name={booking.counterpart.name} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-foreground">{booking.counterpart.name}</p>
        <p className="text-xs text-muted-foreground">{copy.toReview.serviceOn(formatSlotDay(booking.scheduledLocal))}</p>
      </div>
      {booking.counterpart.providerId && (
        <Link
          href={`/prestataire/${booking.counterpart.providerId}?review=${encodeURIComponent(booking.id)}`}
          className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground"
        >
          {copy.toReview.action}
        </Link>
      )}
    </li>
  );
}

function ReviewCard({ review }: { review: MyReview }) {
  const href = `/prestataire/${review.provider.id}`;
  return (
    <li className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Link href={href} className="shrink-0 rounded-full">
          <MiniAvatar src={review.provider.profilePhoto} name={review.provider.displayName} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-sm font-extrabold text-foreground hover:underline">
            {review.provider.displayName}
          </Link>
          <p className="text-xs text-muted-foreground">{copy.published.serviceOn(formatSlotDay(review.booking.scheduledLocal))}</p>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>
      {review.comment && <ExpandableText text={review.comment} lines={3} className="mt-3 text-sm text-foreground" />}
      {review.reply && (
        <div className="mt-3 ml-4 rounded-2xl bg-secondary p-3">
          <p className="text-[11px] font-bold text-primary">{copy.published.reply}</p>
          <p className="mt-1 text-sm text-foreground">{review.reply}</p>
        </div>
      )}
    </li>
  );
}

export function AvisClient() {
  const query = useQuery({ queryKey: queryKeys.reviews.mine, queryFn: () => reviewsApi(apiClient).mine() });
  const reviews = query.data?.reviews ?? [];
  const toReview = (query.data?.toReview ?? []).slice(0, TO_REVIEW_MAX);
  const average = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const bothEmpty = query.isSuccess && reviews.length === 0 && toReview.length === 0;

  return (
    <div className="mobile-page max-w-3xl">
      <PageHeader back="/compte" backLabel={copy.backLabel} title={copy.title} subtitle={copy.subtitle} icon={<Star size={20} aria-hidden />} />

      <div className="mt-6 space-y-6">
        {query.isLoading ? (
          <>
            <Skeleton className="h-24 w-full rounded-3xl" />
            <SkeletonList count={2} />
          </>
        ) : query.isError ? (
          <ErrorCard onRetry={() => void query.refetch()} />
        ) : bothEmpty ? (
          <EmptyState icon={Star} title={copy.published.empty} description={copy.toReview.empty} action={{ href: "/rechercher", label: copy.published.emptyAction }} />
        ) : (
          <>
            <section className="flex items-center gap-4 rounded-3xl border border-border bg-white p-4 shadow-soft">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <Star size={26} aria-hidden className="fill-current" strokeWidth={0} />
              </span>
              <div>
                <p className="font-heading text-2xl leading-none font-extrabold text-foreground">{average === null ? copy.summary.none : average.toFixed(1)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.summary.given(reviews.length)} · {copy.summary.average}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-base font-extrabold">{copy.toReview.title}</h2>
              {toReview.length === 0 ? (
                <DashedNote>{copy.toReview.empty}</DashedNote>
              ) : (
                <ul className="mt-3 space-y-2">
                  {toReview.map((booking) => (
                    <ToReviewRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-base font-extrabold">{copy.published.title}</h2>
              {reviews.length === 0 ? (
                <DashedNote>{copy.published.empty}</DashedNote>
              ) : (
                <ul className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
