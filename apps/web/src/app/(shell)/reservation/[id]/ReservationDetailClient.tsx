"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Phone, SearchX } from "lucide-react";
import { toast } from "sonner";
import { ApiError, bookingsApi, queryKeys } from "@kayu/api";
import type { BookingDetail } from "@kayu/schemas";
import { BookingActions } from "@/components/bookings/BookingActions";
import { formatCdf, formatDateTime, formatSlotDay } from "@/components/bookings/format";
import { TextAreaField } from "@/components/forms/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StarRating } from "@/components/ui/StarRating";
import { StatusPill } from "@/components/ui/StatusPill";
import { bookingsCopy } from "@/copy/bookings";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";

const copy = bookingsCopy.detail;
const card = bookingsCopy.card;

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404 || error.code === "NOT_FOUND" || error.code === "FORBIDDEN");
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3 text-xs font-semibold text-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

function InternalNotes({ booking }: { booking: BookingDetail }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(booking.providerNotes ?? "");
  useEffect(() => setValue(booking.providerNotes ?? ""), [booking.providerNotes]);
  const save = useMutation({
    mutationFn: () => bookingsApi(apiClient).updateNotes(booking.id, { providerNotes: value.trim() || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
      toast.success(copy.notesSaved);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const dirty = value.trim() !== (booking.providerNotes ?? "").trim();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty) save.mutate();
      }}
      className="rounded-3xl border border-border bg-white p-4 shadow-soft"
    >
      <TextAreaField label={copy.internalNotes} hint={copy.internalNotesHint} rows={3} maxLength={2000} value={value} onChange={(event) => setValue(event.target.value)} placeholder={copy.internalNotesPlaceholder} />
      <button type="submit" disabled={!dirty || save.isPending} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-55">
        {copy.saveNotes}
      </button>
    </form>
  );
}

function Timeline({ booking }: { booking: BookingDetail }) {
  const rows: { label: string; at: string | Date; extra?: string }[] = [{ label: copy.events.created, at: booking.createdAt }];
  if (booking.confirmedAt) rows.push({ label: copy.events.confirmed, at: booking.confirmedAt });
  if (booking.completedAt) rows.push({ label: copy.events.completed, at: booking.completedAt });
  if (booking.cancelledAt) rows.push({ label: copy.events.cancelled, at: booking.cancelledAt, extra: booking.cancelReason ? copy.events.reason(booking.cancelReason) : undefined });
  return (
    <section className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <h2 className="text-base font-extrabold">{copy.timeline}</h2>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2 text-sm">
            <span className="font-semibold text-foreground">{row.label}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(row.at)}</span>
            {row.extra && <span className="w-full text-xs text-muted-foreground">{row.extra}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewBlock({ title, rating, comment, reply }: { title: string; rating: number; comment: string | null; reply?: string | null }) {
  return (
    <section className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold">{title}</h2>
        <StarRating value={rating} size={14} />
      </div>
      {comment && <p className="mt-2 text-sm text-muted-foreground">{comment}</p>}
      {reply && <p className="mt-3 ml-4 rounded-2xl bg-secondary p-3 text-sm text-foreground">{reply}</p>}
    </section>
  );
}

export function ReservationDetailClient({ id }: { id: string }) {
  const query = useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingsApi(apiClient).get(id),
    retry: false,
  });
  const booking = query.data;
  const perspective = booking?.side ?? "client";
  const backHref = perspective === "provider" ? "/mon-espace" : "/mes-reservations";

  return (
    <div className="mobile-page max-w-3xl">
      <PageHeader back={backHref} backLabel={copy.backLabel} title={copy.title} />
      <div className="mt-6 space-y-4">
        {query.isLoading ? (
          <SkeletonCard lines={4} />
        ) : query.isError ? (
          isMissing(query.error) ? (
            <EmptyState icon={SearchX} title={copy.notFound.title} description={copy.notFound.description} action={{ href: backHref, label: copy.notFound.action }} />
          ) : (
            <ErrorCard onRetry={() => void query.refetch()} />
          )
        ) : booking ? (
          <>
            <article className="rounded-3xl border border-border bg-white p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <MiniAvatar src={booking.counterpart.photo} name={booking.counterpart.name} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-base font-extrabold text-foreground">{booking.counterpart.name}</p>
                    <StatusPill status={booking.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{booking.counterpart.categoryLabel ?? card.noCategory}</p>
                  {booking.counterpart.providerId && (
                    <Link href={`/prestataire/${booking.counterpart.providerId}`} className="mt-1 inline-flex min-h-9 items-center text-sm font-bold text-primary">
                      {copy.viewProfile}
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip icon={<Calendar size={13} aria-hidden />}>{formatSlotDay(booking.scheduledLocal)}</Chip>
                <Chip icon={<Clock size={13} aria-hidden />}>
                  {booking.scheduledLocal.time} · {card.duration(booking.durationMin)}
                </Chip>
              </div>

              {(booking.placeChain.length > 0 || booking.addressLine) && (
                <div className="mt-4 flex items-start gap-2 text-sm">
                  <MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{copy.address}</p>
                    {booking.placeChain.length > 0 && <p className="text-muted-foreground">{booking.placeChain.map((place) => place.label).join(" · ")}</p>}
                    {booking.addressLine && <p className="text-foreground">{booking.addressLine}</p>}
                  </div>
                </div>
              )}

              {perspective === "provider" && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Phone size={16} aria-hidden className="shrink-0 text-primary" />
                  <span className="text-xs font-bold text-foreground">{copy.clientPhone}</span>
                  <a href={`tel:${booking.clientPhone}`} className="ml-auto inline-flex min-h-9 items-center font-bold text-primary">
                    {booking.clientPhone}
                  </a>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-bold text-foreground">{copy.notes}</p>
                {booking.clientNotes ? (
                  <ExpandableText text={booking.clientNotes} lines={3} className="mt-1 text-sm text-muted-foreground" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{copy.noNotes}</p>
                )}
              </div>

              {booking.status === "COMPLETED" && booking.agreedPrice !== null && (
                <div className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm">
                  <p>
                    <span className="font-semibold">{copy.agreedPrice}</span> · {formatCdf(booking.agreedPrice)} · {booking.isPaid ? card.paid : card.unpaid}
                  </p>
                  {perspective === "provider" && booking.providerNetAmt !== null && <p className="mt-1 text-muted-foreground">{copy.net(formatCdf(booking.providerNetAmt))}</p>}
                </div>
              )}

              <BookingActions booking={booking} perspective={perspective} className="mt-4" />
            </article>

            {perspective === "provider" && <InternalNotes booking={booking} />}
            <Timeline booking={booking} />
            {booking.review && <ReviewBlock title={copy.review} rating={booking.review.rating} comment={booking.review.comment} reply={booking.review.reply} />}
            {booking.clientReview && <ReviewBlock title={copy.clientReview} rating={booking.clientReview.rating} comment={booking.clientReview.comment} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
