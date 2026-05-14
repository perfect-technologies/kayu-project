import Link from "next/link";
import type { ClientDashboardCompletedBooking } from "@kayu/schemas";
import { ActivityRow } from "./ActivityRow";

export function ActivityList({ items }: { items: ClientDashboardCompletedBooking[] }) {
  if (items.length === 0) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
        marginTop: 14,
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
        <span className="k-overline">ACTIVITÉ RÉCENTE</span>
        <Link href="/bookings" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}>
          Historique →
        </Link>
      </header>
      {items.map((b, idx) => (
        <ActivityRow key={b.id} booking={b} isFirst={idx === 0} />
      ))}
    </section>
  );
}
