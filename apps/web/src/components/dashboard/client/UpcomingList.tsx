import Link from "next/link";
import type { ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { UpcomingRow } from "./UpcomingRow";

export function UpcomingList({ items }: { items: ClientDashboardUpcomingBooking[] }) {
  if (items.length === 0) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">
          À VENIR · {items.length} {items.length === 1 ? "RÉSERVATION" : "RÉSERVATIONS"}
        </span>
        <Link href="/bookings" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}>
          Tout voir →
        </Link>
      </header>
      {items.map((b, idx) => (
        <UpcomingRow key={b.id} booking={b} isFirst={idx === 0} />
      ))}
    </section>
  );
}
