"use client";

import * as React from "react";
import { BadgeCheck, Star, Clock, MapPin } from "lucide-react";
import { tokens } from "../tokens.js";

export type TrustStripProps = {
  verifiedProviders: number | null;
  averageRating: number | null;
  cityCount: number | null;
  responseTime?: string; // hardcoded "~1h" by default per spec v1
};

type Metric = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
};

export const TrustStrip: React.FC<TrustStripProps> = ({
  verifiedProviders,
  averageRating,
  cityCount,
  responseTime = "~1h",
}) => {
  const fmt = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n);

  const metrics: Metric[] = [
    {
      icon: <BadgeCheck size={22} strokeWidth={1.8} color={tokens.color.success} />,
      value: <>{fmt(verifiedProviders)}{verifiedProviders != null ? "+" : ""}</>,
      label: "Pros vérifiés",
    },
    {
      icon: <Star size={22} fill={tokens.color.warning} stroke="none" />,
      value: averageRating == null ? "—" : <>{averageRating.toFixed(1)}<span style={{ color: tokens.color.textMuted, fontSize: 14, fontWeight: 500 }}>/5</span></>,
      label: "Note moyenne",
    },
    {
      icon: <Clock size={22} strokeWidth={1.8} color={tokens.color.primary} />,
      value: responseTime,
      label: "Temps de réponse",
    },
    {
      icon: <MapPin size={22} strokeWidth={1.8} color="#8B5CF6" />,
      value: fmt(cityCount),
      label: "Villes RDC & Congo",
    },
  ];

  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px" }}>
      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 16,
          padding: "20px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          alignItems: "center",
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingLeft: i === 0 ? 0 : 24,
              borderRight: i < metrics.length - 1 ? `1px solid ${tokens.color.border}` : "none",
              paddingRight: i < metrics.length - 1 ? 24 : 0,
            }}
          >
            <div>{m.icon}</div>
            <div>
              <div
                style={{
                  fontFamily: tokens.font.mono,
                  fontWeight: 700,
                  fontSize: 22,
                  color: tokens.color.textPrimary,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: tokens.color.textMuted }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
