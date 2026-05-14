"use client";

import Link from "next/link";
import type { TodayJob } from "@kayu/schemas";
import { HeroStatusChip } from "./HeroStatusChip";

export function TodayRow({ job, isFirst }: { job: TodayJob; isFirst: boolean }) {
  const variant =
    job.status === "completed" ? "neutral" : job.status === "en_route" ? "live" : "confirmed";
  const chipLabel =
    job.status === "completed" ? "TERMINÉE" : job.status === "en_route" ? "EN ROUTE" : "CONFIRMÉE";
  const priceLabel = job.fee ? `${job.fee.toLocaleString("fr-FR")} FC` : "Prix à confirmer";

  return (
    <Link
      href={`/bookings/${job.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr auto",
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
          {job.time}
        </div>
        {job.duration && (
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
            {job.duration}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {job.kind} · {job.client.name}
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
          {job.address} · {priceLabel}
        </div>
      </div>
      <HeroStatusChip variant={variant} label={chipLabel} compact />
    </Link>
  );
}
