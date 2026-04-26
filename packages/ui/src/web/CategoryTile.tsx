"use client";

import * as React from "react";
import { tokens, type CategorySlug } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type CategoryTileSize = "md" | "lg";

export type CategoryTileProps = {
  slug: CategorySlug;
  /** Display label override; defaults to portfolio.label. */
  label?: string;
  /** Provider count shown below the label. */
  count?: number;
  /** Icon override; defaults to portfolio iconName. */
  iconName?: IconName;
  size?: CategoryTileSize;
  onClick?: (slug: CategorySlug) => void;
  className?: string;
  style?: React.CSSProperties;
};

// CategoryTile (web) — discovery card for the homepage 6-col category grid.
// Keeps a 1px border (unlike content cards) per D03 spec — discovery surface.
export const CategoryTile: React.FC<CategoryTileProps> = ({
  slug,
  label,
  count,
  iconName,
  size = "lg",
  onClick,
  className,
  style,
}) => {
  const tint = tokens.categoryTint[slug];
  const portfolio = tokens.portfolio[slug];
  const ResolvedIconName = iconName ?? (portfolio.iconName as IconName);
  const Icon = I[ResolvedIconName];
  const isLg = size === "lg";
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick ? () => onClick(slug) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: isLg ? 20 : 16,
        display: "flex",
        flexDirection: "column",
        gap: isLg ? 16 : 12,
        alignItems: "flex-start",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        width: "100%",
        minWidth: 0,
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        transform: hovered && onClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
        font: "inherit",
        color: "inherit",
        ...style,
      }}
    >
      <div
        style={{
          width: isLg ? 48 : 40,
          height: isLg ? 48 : 40,
          borderRadius: 10,
          background: tint?.bg ?? tokens.color.surfaceMuted,
          color: tint?.fg ?? tokens.color.textBody,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon size={isLg ? 24 : 20} /> : null}
      </div>
      <div style={{ width: "100%", minWidth: 0 }}>
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: isLg ? 17 : 15,
            lineHeight: 1.25,
            color: tokens.color.textPrimary,
            overflowWrap: "anywhere",
          }}
        >
          {label ?? portfolio.label}
        </div>
        {count != null ? (
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 12,
              fontWeight: 500,
              color: tokens.color.textMuted,
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count} pros
          </div>
        ) : null}
      </div>
    </button>
  );
};
