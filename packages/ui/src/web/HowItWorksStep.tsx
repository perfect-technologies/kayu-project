"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { tokens } from "../tokens.js";

export type HowItWorksStepProps = {
  number: 1 | 2 | 3;
  title: string;
  description: string;
};

export const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ number, title, description }) => (
  <div
    style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 16,
      padding: 24,
    }}
  >
    <div
      style={{
        fontFamily: tokens.font.mono,
        fontSize: 11,
        color: tokens.color.textMuted,
        letterSpacing: ".05em",
        fontWeight: 600,
      }}
    >
      ÉTAPE {String(number).padStart(2, "0")}
    </div>
    <div style={{ fontWeight: 700, fontSize: 17, color: tokens.color.textPrimary, marginTop: 6, marginBottom: 6 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: tokens.color.textBody, lineHeight: 1.5 }}>{description}</div>
    <div
      style={{
        marginTop: 18,
        background: "#FAFAF7",
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 10,
        padding: 14,
      }}
    >
      <StepMockup number={number} />
    </div>
  </div>
);

const StepMockup: React.FC<{ number: 1 | 2 | 3 }> = ({ number }) => {
  if (number === 1) return <Mockup1Search />;
  if (number === 2) return <Mockup2Chat />;
  return <Mockup3Booking />;
};

const Mockup1Search: React.FC = () => (
  <>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 8,
        padding: "8px 10px",
        marginBottom: 8,
      }}
    >
      <Search size={14} color={tokens.color.textMuted} strokeWidth={2} />
      <span style={{ fontSize: 11, color: tokens.color.textMuted }}>Plomberie · Gombe</span>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {["⭐ 4.8+", "⚡ <1h"].map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: 10,
            background: tokens.color.surface,
            color: tokens.color.textMuted,
            padding: "3px 8px",
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 999,
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  </>
);

const Mockup2Chat: React.FC = () => {
  const bubbleBase: React.CSSProperties = {
    fontSize: 11,
    padding: "6px 10px",
    maxWidth: "80%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-start",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: "10px 10px 10px 2px",
          color: tokens.color.textBody,
        }}
      >
        Bonjour, vous êtes dispo demain ?
      </div>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-end",
          background: tokens.color.primary,
          color: "#fff",
          borderRadius: "10px 10px 2px 10px",
        }}
      >
        Oui, 14h ça vous va ?
      </div>
      <div
        style={{
          ...bubbleBase,
          alignSelf: "flex-start",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: "10px 10px 10px 2px",
          color: tokens.color.textBody,
        }}
      >
        Parfait 👍
      </div>
    </div>
  );
};

const Mockup3Booking: React.FC = () => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: tokens.color.textMuted, marginBottom: 6 }}>
      <span>Réservation #4827</span>
      <span style={{ color: "#15803D", fontWeight: 600 }}>Confirmée</span>
    </div>
    <div style={{ fontSize: 11, color: tokens.color.textBody, marginBottom: 8 }}>
      Plomberie · 23 mai · 14h
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${tokens.color.border}` }}>
      <span style={{ fontSize: 10, color: tokens.color.textMuted, fontWeight: 600, letterSpacing: ".05em" }}>TOTAL</span>
      <span style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 12, color: tokens.color.textPrimary }}>25 000 FC</span>
    </div>
  </>
);
