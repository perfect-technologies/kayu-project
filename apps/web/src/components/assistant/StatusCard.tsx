"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, MessageSquare, XCircle } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { assistantCopy } from "@/copy/assistant";
import { formatSlotLabel, type AssistantUIMessage } from "./types";

const copy = assistantCopy.status;

type BookingPart = Extract<AssistantUIMessage["parts"][number], { type: "tool-create_booking" }>;
type MessagePart = Extract<AssistantUIMessage["parts"][number], { type: "tool-send_message" }>;

// "SLOT_TAKEN : Ce créneau n'est plus disponible." keeps the code for the model; the card shows the sentence.
export function humanError(errorText: string): string {
  const match = /^[A-Z_0-9]+ : (.+)$/.exec(errorText);
  return match ? match[1]! : errorText;
}

function Frame({ tone, icon, title, body, link }: { tone: "ok" | "error" | "muted"; icon: React.ReactNode; title: string; body?: React.ReactNode; link?: { href: string; label: string } }) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-700",
    muted: "border-border bg-muted text-muted-foreground",
  } as const;
  return (
    <section role="status" className={`rounded-3xl border p-4 ${tones[tone]}`}>
      <p className="flex items-center gap-2 text-sm font-extrabold">
        {icon} {title}
      </p>
      {body && <div className="mt-1 text-xs leading-relaxed">{body}</div>}
      {link && (
        <Link href={link.href} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-white px-4 text-xs font-bold text-primary shadow-soft">
          {link.label}
        </Link>
      )}
    </section>
  );
}

export function BookingStatusCard({ part }: { part: BookingPart }) {
  if (part.state === "output-available") {
    const booking = part.output;
    return (
      <Frame
        tone="ok"
        icon={<CalendarCheck size={16} aria-hidden />}
        title={copy.bookingTitle}
        body={
          <>
            <span className="mr-2 inline-block align-middle">
              <StatusPill status={booking.status} />
            </span>
            {booking.counterpart.name} · {formatSlotLabel(booking.scheduledLocal.date, booking.scheduledLocal.time)}
            <p className="mt-1">{copy.bookingBody}</p>
          </>
        }
        link={{ href: `/reservation/${encodeURIComponent(booking.id)}`, label: copy.bookingLink }}
      />
    );
  }
  if (part.state === "output-error") {
    const text = humanError(part.errorText);
    return <Frame tone="error" icon={<AlertTriangle size={16} aria-hidden />} title={copy.errorTitle} body={/SLOT_TAKEN/.test(part.errorText) ? copy.slotTaken : text} />;
  }
  if (part.state === "output-denied") {
    return <Frame tone="muted" icon={<XCircle size={16} aria-hidden />} title={assistantCopy.approval.denied} />;
  }
  return null;
}

export function MessageStatusCard({ part }: { part: MessagePart }) {
  if (part.state === "output-available") {
    const { conversation } = part.output;
    return (
      <Frame
        tone="ok"
        icon={<MessageSquare size={16} aria-hidden />}
        title={copy.messageTitle}
        body={copy.messageBody(conversation.counterpart.name)}
        link={{ href: `/messagerie?c=${encodeURIComponent(conversation.id)}`, label: copy.messageLink }}
      />
    );
  }
  if (part.state === "output-error") {
    return <Frame tone="error" icon={<AlertTriangle size={16} aria-hidden />} title={copy.errorTitle} body={humanError(part.errorText)} />;
  }
  if (part.state === "output-denied") {
    return <Frame tone="muted" icon={<XCircle size={16} aria-hidden />} title={assistantCopy.approval.denied} />;
  }
  return null;
}
