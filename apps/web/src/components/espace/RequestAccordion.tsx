"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronRight, Clock, Phone, Star, User } from "lucide-react";
import { bookingsApi, queryKeys } from "@kayu/api";
import type { BookingCard } from "@kayu/schemas";
import { BookingActions } from "@/components/bookings/BookingActions";
import { formatSlotDay } from "@/components/bookings/format";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingsCopy } from "@/copy/bookings";
import { espaceCopy } from "@/copy/espace";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = espaceCopy.requests;

function RequestBody({ booking }: { booking: BookingCard }) {
  const detail = useQuery({
    queryKey: queryKeys.bookings.detail(booking.id),
    queryFn: () => bookingsApi(apiClient).get(booking.id),
  });
  const rating = booking.clientRating;

  return (
    <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">
      {detail.isLoading ? (
        <div aria-hidden className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ) : (
        <>
          {detail.data && (
            <p className="flex items-center gap-2 text-sm">
              <Phone size={15} aria-hidden className="text-primary" />
              <span className="sr-only">{copy.phone} </span>
              <a href={`tel:${detail.data.clientPhone}`} className="font-bold text-primary underline-offset-2 hover:underline">
                {detail.data.clientPhone}
              </a>
            </p>
          )}
          <div className="text-sm text-muted-foreground">
            <p className="text-xs font-bold text-foreground">{copy.notes}</p>
            {detail.data?.clientNotes ? <ExpandableText text={detail.data.clientNotes} lines={3} /> : <p>{copy.noNotes}</p>}
          </div>
        </>
      )}
      <p className="flex items-center gap-1.5 text-sm text-foreground">
        <Star size={15} aria-hidden className="fill-amber-400 text-amber-400" />
        {rating && rating.count > 0 ? copy.clientRating(rating.avg, rating.count) : copy.newClient}
      </p>
      <BookingActions booking={booking} perspective="provider" />
    </div>
  );
}

function RequestRow({ booking, index }: { booking: BookingCard; index: number }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const label = booking.counterpart.categoryLabel ?? bookingsCopy.card.noCategory;
  const bodyId = `request-${booking.id}`;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, delay: Math.min(index * 0.04, 0.25) }}
      className="rounded-3xl border border-border bg-white shadow-soft"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={open ? copy.collapse : copy.expand}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-3xl p-4 text-left"
      >
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-extrabold text-primary-foreground">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-foreground">{label}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-foreground">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2">
              <Calendar size={11} aria-hidden className="text-primary" /> {formatSlotDay(booking.scheduledLocal)}
            </span>
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2">
              <Clock size={11} aria-hidden className="text-primary" /> {booking.scheduledLocal.time}
            </span>
            <span className="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-secondary px-2">
              <User size={11} aria-hidden className="text-primary" /> <span className="truncate">{booking.counterpart.name}</span>
            </span>
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden
          className={cn("shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", open && "rotate-90")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24 }}
            className="overflow-hidden"
          >
            <RequestBody booking={booking} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/** Pending bookings as accordions; the body lazily loads the detail for the phone and the notes. */
export function RequestAccordion({ bookings }: { bookings: BookingCard[] }) {
  if (bookings.length === 0) {
    return <p className="rounded-3xl border-2 border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted-foreground">{copy.empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {bookings.map((booking, index) => (
        <RequestRow key={booking.id} booking={booking} index={index} />
      ))}
    </ul>
  );
}
