"use client";

import * as React from "react";
import { ArrowRight, TrendingUp, Star } from "lucide-react";
import type { TrendingServiceItem } from "@kayu/schemas";
import { tokens } from "../tokens.js";

export type TrendingServiceCardProps = {
  item: TrendingServiceItem;
  onClick?: (slug: string) => void;
};

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export const TrendingServiceCard: React.FC<TrendingServiceCardProps> = ({ item, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <article
      onClick={onClick ? () => onClick(item.categorySlug) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        transform: hovered && onClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
      }}
    >
      <div style={{ position: "relative", height: 160 }}>
        <img
          src={item.categoryImage}
          alt={item.categoryName}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {item.trendBadge ? (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <TrendBadge badge={item.trendBadge} />
          </div>
        ) : null}
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: tokens.color.textPrimary, marginBottom: 6 }}>
          {item.categoryName}
        </div>
        <div
          style={{
            fontSize: 13,
            color: tokens.color.textBody,
            lineHeight: 1.5,
            marginBottom: 16,
            minHeight: 38,
          }}
        >
          {item.description ?? " "}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontSize: 10,
                color: tokens.color.textMuted,
                letterSpacing: ".05em",
                fontWeight: 600,
              }}
            >
              À PARTIR DE
            </div>
            <div
              style={{
                fontFamily: tokens.font.mono,
                fontWeight: 700,
                fontSize: 16,
                color: tokens.color.textPrimary,
                marginTop: 2,
              }}
            >
              {item.startingPrice != null ? (
                <>
                  {formatPrice(item.startingPrice)}{" "}
                  <span style={{ fontSize: 11, color: tokens.color.textMuted, fontFamily: "inherit" }}>FC</span>
                </>
              ) : (
                <span style={{ color: tokens.color.textMuted, fontFamily: "inherit", fontWeight: 500 }}>—</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(item.categorySlug);
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
            Réserver <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
};

const TrendBadge: React.FC<{ badge: NonNullable<TrendingServiceItem["trendBadge"]> }> = ({ badge }) => {
  if (badge.kind === "growth") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 8px",
          borderRadius: 6,
          background: tokens.color.surface,
          color: "#C2410C",
          border: "1px solid #FED7AA",
        }}
      >
        <TrendingUp size={11} strokeWidth={2.5} />
        +{badge.pct}%
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: 6,
        background: tokens.color.surface,
        color: "#1E40AF",
        border: "1px solid #BFDBFE",
      }}
    >
      <Star size={11} fill="currentColor" stroke="none" />
      Top {badge.rank}
    </span>
  );
};
