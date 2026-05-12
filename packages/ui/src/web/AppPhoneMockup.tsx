"use client";

import * as React from "react";
import { Search, Wrench, Scissors, Zap, Check } from "lucide-react";
import { tokens } from "../tokens.js";

export type AppPhoneMockupVariant = "home" | "booking-confirmed";
export type AppPhoneMockupProps = {
  variant: AppPhoneMockupVariant;
  rotate?: number; // degrees, used for layered display
  style?: React.CSSProperties;
};

export const AppPhoneMockup: React.FC<AppPhoneMockupProps> = ({ variant, rotate = 0, style }) => (
  <div
    style={{
      width: 200,
      height: 400,
      background: "#111",
      borderRadius: 30,
      padding: 7,
      transform: `rotate(${rotate}deg)`,
      boxShadow: rotate === 0 ? "0 20px 40px rgba(0,0,0,.15)" : "0 20px 40px rgba(0,0,0,.2)",
      position: "relative",
      ...style,
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 80,
        height: 18,
        background: "#111",
        borderRadius: "0 0 12px 12px",
        zIndex: 2,
      }}
    />
    <div
      style={{
        width: "100%",
        height: "100%",
        background: variant === "home" ? "#FAFAF7" : tokens.color.surface,
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      {variant === "home" ? <HomeContent /> : <BookingContent />}
    </div>
  </div>
);

const HomeContent: React.FC = () => (
  <div style={{ padding: "34px 12px 10px" }}>
    <div style={{ fontSize: 8, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>BONJOUR</div>
    <div style={{ fontWeight: 700, fontSize: 14, color: tokens.color.textPrimary, marginTop: 1 }}>Marie 👋</div>
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: "7px 9px",
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Search size={10} color={tokens.color.textMuted} strokeWidth={2} />
      <span style={{ fontSize: 9, color: tokens.color.textMuted }}>Quel service ?</span>
    </div>
    <div style={{ fontSize: 9, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em", marginTop: 12 }}>
      CATÉGORIES
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginTop: 5 }}>
      {([
        { name: "Plomberie", Icon: Wrench },
        { name: "Coiffure", Icon: Scissors },
        { name: "Élec.", Icon: Zap },
      ] as const).map(({ name, Icon }) => (
        <div
          key={name}
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 7,
            padding: "7px 4px",
            textAlign: "center",
          }}
        >
          <div style={{ color: tokens.color.textPrimary, display: "flex", justifyContent: "center", marginBottom: 3 }}>
            <Icon size={11} strokeWidth={1.7} />
          </div>
          <div style={{ fontSize: 7, color: tokens.color.textPrimary, fontWeight: 600 }}>{name}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 9, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em", marginTop: 12 }}>
      TOP PROS
    </div>
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: 7,
        marginTop: 5,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#F5F2E9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontSize: 8,
          color: tokens.color.textMuted,
          fontWeight: 700,
        }}
      >
        JM
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: tokens.color.textPrimary }}>Jean-Pierre M.</div>
        <div style={{ fontSize: 7, color: tokens.color.textMuted }}>Plombier · ⭐ 4.9</div>
      </div>
    </div>
  </div>
);

const BookingContent: React.FC = () => (
  <div style={{ padding: "34px 14px 10px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        background: "#DCFCE7",
        borderRadius: "50%",
        margin: "8px auto",
        color: "#15803D",
      }}
    >
      <Check size={26} strokeWidth={2.5} />
    </div>
    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, color: tokens.color.textPrimary, marginTop: 6 }}>
      Réservation confirmée
    </div>
    <div style={{ textAlign: "center", fontSize: 9, color: tokens.color.textMuted, marginTop: 2 }}>
      Réservation #4827
    </div>
    <div style={{ marginTop: 14, background: "#FAFAF7", borderRadius: 8, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#F5F2E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: tokens.font.mono,
            fontSize: 9,
            color: tokens.color.textMuted,
            fontWeight: 700,
          }}
        >
          JM
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: tokens.color.textPrimary }}>Jean-Pierre M.</div>
          <div style={{ fontSize: 8, color: tokens.color.textMuted }}>Plombier</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${tokens.color.border}`,
          fontSize: 9,
          color: tokens.color.textMuted,
          lineHeight: 1.5,
        }}
      >
        {[
          ["Date", "23 mai · 14h"],
          ["Service", "Plomberie"],
          ["Adresse", "Gombe"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{k}</span>
            <span style={{ color: tokens.color.textPrimary, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${tokens.color.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 8, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>TOTAL</span>
        <span style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 11, color: tokens.color.textPrimary }}>
          25 000 FC
        </span>
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <button
        style={{
          flex: 1,
          background: tokens.color.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: 7,
          fontSize: 9,
          fontWeight: 600,
        }}
      >
        Chatter
      </button>
      <button
        style={{
          flex: 1,
          background: tokens.color.surface,
          color: tokens.color.primary,
          border: "1px solid #BAE6FD",
          borderRadius: 8,
          padding: 7,
          fontSize: 9,
          fontWeight: 600,
        }}
      >
        Appeler
      </button>
    </div>
  </div>
);
