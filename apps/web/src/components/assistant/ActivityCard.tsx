"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { assistantCopy } from "@/copy/assistant";
import { formatSlotLabel, type ActivityOutput } from "./types";

const copy = assistantCopy.activity;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-1.5">{children}</ul>
    </div>
  );
}

export function ActivityCard({ output }: { output: ActivityOutput }) {
  const empty = output.openBookings.length === 0 && output.conversations.length === 0 && output.addresses.length === 0;
  return (
    <section className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <Activity size={16} aria-hidden className="text-primary" /> {copy.title}
      </h3>
      {empty ? (
        <p className="mt-2 text-xs text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {output.openBookings.length > 0 && (
            <Section title={copy.bookings}>
              {output.openBookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold">{booking.counterpart.name}</span>
                    <span className="block text-xs text-muted-foreground">{formatSlotLabel(booking.scheduledLocal.date, booking.scheduledLocal.time)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill status={booking.status} />
                    <Link href={`/reservation/${encodeURIComponent(booking.id)}`} className="text-xs font-bold text-primary">
                      {copy.open}
                    </Link>
                  </span>
                </li>
              ))}
            </Section>
          )}
          {output.conversations.length > 0 && (
            <Section title={copy.conversations}>
              {output.conversations.map((conversation) => (
                <li key={conversation.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-semibold">{conversation.counterpart.name}</span>
                  <Link href={`/messagerie?c=${encodeURIComponent(conversation.id)}`} className="shrink-0 text-xs font-bold text-primary">
                    {copy.open}
                  </Link>
                </li>
              ))}
            </Section>
          )}
          {output.addresses.length > 0 && (
            <Section title={copy.addresses}>
              {output.addresses.map((address) => (
                <li key={address.id} className="text-sm">
                  <span className="font-semibold">{assistantCopy.addressCard.labels[address.label] ?? address.label}</span>
                  <span className="text-muted-foreground"> · {address.addressLine}</span>
                </li>
              ))}
            </Section>
          )}
        </div>
      )}
    </section>
  );
}
