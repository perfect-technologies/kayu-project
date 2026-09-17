"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { assistantCopy } from "@/copy/assistant";
import { cn } from "@/lib/utils";
import { bookingHref, formatDayLabel, type AvailabilityOutput, type PickedSlot } from "./types";

const copy = assistantCopy.availability;
const SLOT_SHIMMER = [0, 1, 2, 3, 4, 5, 6, 7];

export function AvailabilityCardSkeleton() {
  return (
    <div role="status" aria-label={assistantCopy.thinking} className="loading-card p-4">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {SLOT_SHIMMER.map((index) => (
          <Skeleton key={index} className="h-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function AvailabilityCard({
  output,
  picked,
  disabled,
  onPick,
}: {
  output: AvailabilityOutput;
  picked: PickedSlot | null;
  disabled?: boolean;
  onPick: (date: string, time: string) => void;
}) {
  const firstOpen = output.days.find((day) => day.slots.length > 0) ?? output.days[0];
  const [date, setDate] = useState(picked?.providerId === output.providerId ? picked.date : (firstOpen?.date ?? ""));
  const day = output.days.find((item) => item.date === date) ?? firstOpen;
  const pickedHere = picked?.providerId === output.providerId ? picked : null;

  return (
    <section className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <CalendarCheck size={16} aria-hidden className="text-primary" /> {copy.title}
      </h3>

      <div role="tablist" aria-label={copy.dates} className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {output.days.map((item) => {
          const active = item.date === day?.date;
          return (
            <button
              key={item.date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDate(item.date)}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold capitalize transition",
                active ? "bg-primary text-primary-foreground" : "border border-border bg-white text-foreground/80",
                item.slots.length === 0 && !active && "text-muted-foreground/70",
              )}
            >
              {formatDayLabel(item.date)}
            </button>
          );
        })}
      </div>

      {day && (
        <div role="tabpanel" className="mt-3">
          <p className="mb-1.5 text-xs font-bold text-foreground">{copy.slots}</p>
          {day.slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.empty}</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {day.slots.map((time) => {
                const active = pickedHere?.date === day.date && pickedHere.time === time;
                return (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => onPick(day.date, time)}
                    className={cn(
                      "min-h-9 rounded-full text-xs font-semibold transition disabled:opacity-55",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {copy.timezone(output.timezone)} · {copy.duration(output.slotDurationMin)}
          </p>
        </div>
      )}

      {pickedHere && (
        <div className="mt-3 border-t border-border pt-3">
          <Link href={bookingHref(output.providerId)} className="primary-action primary-action--gold min-h-11 text-sm">
            {copy.book}
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{copy.bookHint}</p>
        </div>
      )}
    </section>
  );
}
