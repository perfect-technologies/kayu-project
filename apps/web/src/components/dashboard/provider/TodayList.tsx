"use client";

import Link from "next/link";
import type { TodayJob } from "@kayu/schemas";
import { TodayRow } from "./TodayRow";

export type TodayListProps = {
  items: TodayJob[];
  estimatedRecette: number;
};

export function TodayList({ items, estimatedRecette }: TodayListProps) {
  const totalLabel =
    items.length === 0 ? null : items.length === 1 ? "1 MISSION" : `${items.length} MISSIONS`;
  const moneyLabel = estimatedRecette ? `${estimatedRecette.toLocaleString("fr-FR")} FC` : null;

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
          AUJOURD&apos;HUI{totalLabel ? ` · ${totalLabel}` : ""}{moneyLabel ? ` · ${moneyLabel}` : ""}
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
          Calendrier →
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
          Aucune mission aujourd&apos;hui
        </div>
      ) : (
        items.map((j) => <TodayRow key={j.id} job={j} isFirst={false} />)
      )}
    </section>
  );
}
