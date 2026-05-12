"use client";

import * as React from "react";
import { Coins, Star } from "lucide-react";
import { tokens } from "../tokens.js";

const cardBase: React.CSSProperties = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,.04)",
  position: "absolute",
};

export const ProviderDashboardPreview: React.FC = () => (
  <div style={{ position: "relative", height: 340 }}>
    {/* Revenue card — top-left */}
    <div style={{ ...cardBase, top: 0, left: 0, width: 280 }}>
      <div style={{ fontSize: 10, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>
        REVENUS CE MOIS
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontWeight: 700,
          fontSize: 24,
          color: tokens.color.textPrimary,
          marginTop: 4,
        }}
      >
        842 500 <span style={{ fontSize: 12, color: tokens.color.textMuted }}>FC</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803D", marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>↑ +23%</span>
        <span style={{ fontSize: 11, color: tokens.color.textMuted }}>vs mois dernier</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, marginTop: 12 }}>
        {[18, 28, 22, 32, 24, 34, 36].map((h, i, arr) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              background: i === arr.length - 1 ? tokens.color.primary : "#E0F2FE",
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>

    {/* New booking notification — middle-right */}
    <div style={{ ...cardBase, top: 140, right: 0, width: 260 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#DCFCE7",
            color: "#15803D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Coins size={16} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#15803D" }}>Nouvelle réservation</div>
          <div style={{ fontSize: 10, color: tokens.color.textMuted }}>il y a 3 min</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: tokens.color.textPrimary, lineHeight: 1.4 }}>
        Marie K. a réservé <b>Plomberie</b> pour demain 14h ·{" "}
        <span style={{ fontFamily: tokens.font.mono }}>25 000 FC</span>
      </div>
    </div>

    {/* Recent review — bottom-left (offset to avoid overlap) */}
    <div style={{ ...cardBase, top: 230, left: 30, width: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#F5F2E9",
            color: tokens.color.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: tokens.font.mono,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          PN
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textPrimary }}>Patrick N.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: tokens.color.warning }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} fill="currentColor" stroke="none" />
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: tokens.color.textBody, fontStyle: "italic", lineHeight: 1.4 }}>
        "Travail rapide et propre, je recommande sans hésiter."
      </div>
    </div>
  </div>
);
