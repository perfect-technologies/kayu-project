"use client";

import Link from "next/link";
import type { DashboardBooking } from "@kayu/schemas";
import { UpcomingRow } from "./UpcomingRow";

export type UpcomingListProps = {
  items: DashboardBooking[];
};

export function UpcomingList({ items }: UpcomingListProps) {
  return (
    <section
      className="k-pd-section"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          À VENIR
        </div>
        <Link
          href="/bookings"
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            textDecoration: "none",
          }}
        >
          Tout voir →
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            textAlign: "center",
          }}
        >
          Aucune mission à venir
        </div>
      ) : (
        items.map((b) => <UpcomingRow key={b.id} booking={b} isFirst={false} />)
      )}
    </section>
  );
}
