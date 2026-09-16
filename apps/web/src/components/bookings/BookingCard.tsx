"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import type { BookingCard as BookingCardDto } from "@kayu/schemas";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { bookingsCopy } from "@/copy/bookings";
import { cn } from "@/lib/utils";
import { BookingActions } from "./BookingActions";
import { formatCdf, formatSlotDay } from "./format";

const copy = bookingsCopy.card;

export type BookingCardProps = {
  booking: BookingCardDto;
  perspective: "client" | "provider";
  /** Client notes are only on the detail DTO; pass them when available. */
  notes?: string | null;
  /** Hide the detail link when the card is the detail. */
  linkToDetail?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function counterpartHref(booking: Pick<BookingCardDto, "counterpart">): string | null {
  return booking.counterpart.providerId ? `/prestataire/${booking.counterpart.providerId}` : null;
}

/** Avatar linking to the counterpart, name, category, status pill, date/time chips, notes and actions. */
export function BookingCard({ booking, perspective, notes, linkToDetail = true, children, className }: BookingCardProps) {
  const href = counterpartHref(booking);
  const avatar = <MiniAvatar src={booking.counterpart.photo} name={booking.counterpart.name} size={48} />;
  return (
    <article className={cn("rounded-3xl border border-border bg-white p-4 shadow-soft", className)}>
      <div className="flex items-start gap-3">
        {href ? (
          <Link href={href} className="shrink-0 rounded-full">
            {avatar}
          </Link>
        ) : (
          avatar
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-base font-extrabold text-foreground">
              {href ? (
                <Link href={href} className="hover:underline">
                  {booking.counterpart.name}
                </Link>
              ) : (
                booking.counterpart.name
              )}
            </p>
            <StatusPill status={booking.status} />
          </div>
          <p className="text-xs text-muted-foreground">{booking.counterpart.categoryLabel ?? copy.noCategory}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-foreground">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3">
          <Calendar size={13} aria-hidden className="text-primary" />
          <span className="sr-only">{copy.date} </span>
          {formatSlotDay(booking.scheduledLocal)}
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3">
          <Clock size={13} aria-hidden className="text-primary" />
          <span className="sr-only">{copy.time} </span>
          {booking.scheduledLocal.time} · {copy.duration(booking.durationMin)}
        </span>
        {perspective === "provider" && booking.clientRating && booking.clientRating.count > 0 && (
          <span className="inline-flex h-8 items-center rounded-full bg-amber-50 px-3 text-amber-700">
            {copy.clientRating(booking.clientRating.avg, booking.clientRating.count)}
          </span>
        )}
      </div>

      {notes && (
        <div className="mt-3 text-sm text-muted-foreground">
          <ExpandableText text={notes} lines={3} />
        </div>
      )}

      {booking.status === "COMPLETED" && booking.agreedPrice !== null && (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-semibold">{copy.agreedPrice}</span> · {formatCdf(booking.agreedPrice)} · {booking.isPaid ? copy.paid : copy.unpaid}
        </p>
      )}
      {booking.status === "CANCELLED" && booking.cancelReason && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{copy.cancelReason}</span> · {booking.cancelReason}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <BookingActions booking={booking} perspective={perspective} />
        {linkToDetail && (
          <Link href={`/reservation/${booking.id}`} className="ml-auto inline-flex min-h-9 items-center gap-1 text-sm font-bold text-primary">
            {copy.viewDetail} <ChevronRight size={15} aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </article>
  );
}
