"use client";

import Link from "next/link";
import type { DashboardBooking } from "@kayu/schemas";
import { dayMonthAbbr, timeOfDayFR } from "./providerDashboardHelpers";

export function UpcomingRow({ booking, isFirst }: { booking: DashboardBooking; isFirst: boolean }) {
  if (!booking.scheduledDate) return null;
  const { day, month } = dayMonthAbbr(booking.scheduledDate);
  const time = timeOfDayFR(booking.scheduledDate);
  const clientFirstName = (booking.client?.name ?? "Client").split(" ")[0] ?? "Client";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à confirmer";

  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        color: "var(--k-text-primary)",
        textDecoration: "none",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {day}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--k-text-muted)",
            marginTop: 3,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {month}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {booking.title} · {clientFirstName}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {time} · {commune} · {priceLabel}
        </div>
      </div>
    </Link>
  );
}
