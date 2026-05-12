"use client";

import * as React from "react";
import { ArrowRight, Star, BadgeCheck, User } from "lucide-react";
import type { ProviderCardData } from "../cards.js";
import { formatHourly } from "../cards.js";
import { tokens } from "../tokens.js";

export type ProviderHorizontalCardProps = {
  provider: ProviderCardData;
  onClick?: (id: string) => void;
};

const initialsOf = (p: ProviderCardData): string | null => {
  if (p.initials) return p.initials.slice(0, 2).toUpperCase();
  const first = p.firstName?.[0] ?? "";
  const last = p.lastName?.[0] ?? "";
  const composed = `${first}${last}`.toUpperCase();
  return composed.length > 0 ? composed : null;
};

export const ProviderHorizontalCard: React.FC<ProviderHorizontalCardProps> = ({ provider, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const handleClick = onClick ? () => onClick(provider.id) : undefined;
  const initials = initialsOf(provider);
  const fullName = [provider.firstName, provider.lastName].filter(Boolean).join(" ").trim();
  const cityLine = [provider.commune, provider.city].filter(Boolean).join(" · ");

  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "stretch",
        cursor: handleClick ? "pointer" : "default",
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        transform: hovered && handleClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
      }}
    >
      <div
        style={{
          width: 140,
          flexShrink: 0,
          background: "#F5F2E9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {provider.avatarUrl ? (
          <img
            src={provider.avatarUrl}
            alt={fullName || "Provider"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : initials ? (
          <span
            style={{
              fontFamily: tokens.font.mono,
              fontWeight: 700,
              fontSize: 36,
              color: tokens.color.textMuted,
            }}
          >
            {initials}
          </span>
        ) : (
          <User size={36} color={tokens.color.textMuted} strokeWidth={1.6} />
        )}
      </div>

      <div style={{ flex: 1, padding: 16, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: tokens.color.textPrimary }}>
              {fullName || "Pro KAYOU"}
            </div>
            {provider.verified ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#15803D",
                  background: "#DCFCE7",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                <BadgeCheck size={10} fill="currentColor" stroke="white" strokeWidth={2} />
                Vérifié
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 13, color: tokens.color.textMuted, marginBottom: 8 }}>
            {[provider.profession, cityLine].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: tokens.color.textMuted, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: tokens.color.textPrimary, fontFamily: tokens.font.mono }}>
              <Star size={13} fill={tokens.color.warning} stroke="none" />
              {provider.rating.toFixed(1)} ({provider.reviews})
            </span>
            <span style={{ fontFamily: tokens.font.mono }}>⚡ {provider.response}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: tokens.color.textMuted, letterSpacing: ".05em", fontWeight: 600 }}>
              À PARTIR DE
            </div>
            <div style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: 14, color: tokens.color.textPrimary }}>
              {formatHourly(provider.hourly)}{" "}
              <span style={{ fontSize: 11, color: tokens.color.textMuted, fontFamily: "inherit", fontWeight: 500 }}>FC</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick?.();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              padding: "6px 0",
              color: tokens.color.primary,
            }}
          >
            Voir le profil <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
};
