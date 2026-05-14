"use client";

import Link from "next/link";
import type { ProviderDashboardStats } from "@kayu/schemas";
import { formatShortMoney } from "./providerDashboardHelpers";

const MONTHS_FR_FULL = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];

export type PulseStripProps = {
  stats: ProviderDashboardStats;
  ratingValue: number;
  ratingDelta: number;
};

export function PulseStrip({ stats, ratingValue, ratingDelta }: PulseStripProps) {
  const now = new Date();
  const periodLabel =
    stats.period === "week" ? "CETTE SEMAINE" : `${MONTHS_FR_FULL[now.getMonth()]} ${now.getFullYear()}`;

  const revenueLabel = formatShortMoney(stats.revenue.value);
  const revenueDelta = stats.revenue.deltaPct;
  const missions = stats.missions.value;
  const missionsDelta = stats.missions.deltaPct;
  const responseValue = stats.responseRate.value;
  const responseQual = stats.responseRate.label;

  const deltaColor = (n: number) =>
    n > 0 ? "#047857" : n < 0 ? "#B91C1C" : "var(--k-text-muted)";

  return (
    <Link
      href="/pro/earnings"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <section
        className="k-pd-pulse"
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
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
            POULS · {periodLabel}
          </div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--k-text-primary)",
            }}
          >
            Voir les revenus →
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          <Cell
            value={revenueLabel}
            sub={
              <span style={{ color: deltaColor(revenueDelta) }}>
                {revenueDelta >= 0 ? "+" : ""}{revenueDelta}%
              </span>
            }
            label="REVENUS"
          />
          <Cell
            value={String(missions)}
            sub={
              <span style={{ color: deltaColor(missionsDelta) }}>
                {missionsDelta >= 0 ? "+" : ""}{missionsDelta}
              </span>
            }
            label="MISSIONS"
          />
          <Cell value={`${responseValue}%`} sub={<span>{responseQual}</span>} label="RÉPONSE" />
          <Cell
            value={`${ratingValue.toFixed(1)} ★`}
            sub={
              <span style={{ color: deltaColor(ratingDelta) }}>
                {ratingDelta >= 0 ? "+" : ""}{ratingDelta.toFixed(1)} CE MOIS
              </span>
            }
            label=""
          />
        </div>
      </section>
    </Link>
  );
}

function Cell({ value, sub, label }: { value: string; sub: React.ReactNode; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          color: "var(--k-text-muted)",
          letterSpacing: "0.04em",
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {label ? `${label} · ` : ""}{sub}
      </div>
    </div>
  );
}
