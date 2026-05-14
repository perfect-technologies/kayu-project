import Link from "next/link";
import type { ClientDashboardCompletedBooking } from "@kayu/schemas";
import { formatMoneyFc } from "@kayu/ui";
import { I } from "@kayu/ui/web";
import { dayMonthAbbr } from "./dashboardHelpers";

export function ActivityRow({
  booking,
  isFirst,
}: {
  booking: ClientDashboardCompletedBooking;
  isFirst: boolean;
}) {
  const { day, month } = dayMonthAbbr(booking.completedAt);
  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        gap: 12,
        alignItems: "center",
        padding: "9px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
        fontSize: 12,
      }}
    >
      <span style={{ fontWeight: 500 }}>
        {booking.title} · {booking.provider.firstName}
      </span>
      <span style={{ fontSize: 10.5, fontFamily: "var(--k-font-mono)", color: "var(--k-text-muted)" }}>
        {day} {month}
      </span>
      <span style={{ fontWeight: 600, fontSize: 11.5, fontFamily: "var(--k-font-display)" }}>
        {formatMoneyFc(booking.price)}
      </span>
      {booking.hasReview ? (
        <span style={{ fontSize: 10.5, color: "var(--k-text-muted)", display: "inline-flex", gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <I.star
              key={i}
              size={10}
              fill={i < (booking.reviewScore ?? 0) ? "currentColor" : "none"}
            />
          ))}
        </span>
      ) : (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "#92400E",
            background: "#FEF3C7",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          À NOTER ★
        </span>
      )}
    </Link>
  );
}
