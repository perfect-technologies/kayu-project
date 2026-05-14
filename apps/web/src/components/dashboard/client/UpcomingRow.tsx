import Link from "next/link";
import type { ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { formatMoneyFc } from "@kayu/ui";
import { dayMonthAbbr, isTomorrow } from "./dashboardHelpers";
import { HeroStatusChip } from "./HeroStatusChip";

export function UpcomingRow({
  booking,
  isFirst,
}: {
  booking: ClientDashboardUpcomingBooking;
  isFirst: boolean;
}) {
  const { day, month } = dayMonthAbbr(booking.scheduledDate);
  const tomorrow = isTomorrow(booking.scheduledDate);
  const time = new Date(booking.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const chipVariant = booking.status === "PENDING" ? "pending" : "confirmed";
  const chipLabel = booking.status === "PENDING" ? "EN ATTENTE" : "CONFIRMÉE";

  return (
    <Link
      href={`/bookings/${booking.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, fontFamily: "var(--k-font-display)" }}>
          {tomorrow ? "DEM" : day}
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: "var(--k-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 3,
            fontFamily: "var(--k-font-mono)",
          }}
        >
          {tomorrow ? "DEMAIN" : month}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{booking.title}</div>
        <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>
          {time} · {booking.provider.firstName} · {booking.commune ?? ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--k-text-body)",
              background: "#F8FAFC",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            {formatMoneyFc(booking.price)}
          </span>
          {booking.hasOffer && (
            <span
              style={{
                fontSize: 10,
                color: "var(--k-text-muted)",
                background: "#F8FAFC",
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              Accord enregistré
            </span>
          )}
        </div>
      </div>
      <HeroStatusChip variant={chipVariant} label={chipLabel} />
    </Link>
  );
}
