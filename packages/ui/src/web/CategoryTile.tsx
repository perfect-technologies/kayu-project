"use client";

import * as React from "react";
import { tokens, type CategorySlug } from "../tokens.js";
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
  type IconProps,
} from "./Icon.js";

export type CategoryTileSize = "md" | "lg";

export type CategoryTileVariant = "default" | "centered-mono";

export type CategoryTileProps = {
  slug?: CategorySlug;
  label?: string;
  count?: number;
  iconName?: IconName | string;
  color?: string;
  size?: CategoryTileSize;
  variant?: CategoryTileVariant;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export const CategoryTile: React.FC<CategoryTileProps> = ({
  slug,
  label,
  count,
  iconName,
  color,
  size = "lg",
  variant = "default",
  onClick,
  className,
  style,
}) => {
  const portfolio = slug ? tokens.portfolio[slug] : undefined;
  const tint = slug ? tokens.categoryTint[slug] : undefined;

  const resolvedLabel = label ?? portfolio?.label ?? "Catégorie";
  const Icon =
    resolveLucideIcon(iconName) ??
    (portfolio ? (I[portfolio.iconName as IconName] as React.FC<IconProps>) : null) ??
    FallbackCategoryIcon;

  const [hovered, setHovered] = React.useState(false);

  if (variant === "centered-mono") {
    return (
      <button
        onClick={onClick ? () => onClick() : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={className}
        style={{
          position: "relative",
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: "30px 14px 22px",
          textAlign: "center",
          cursor: onClick ? "pointer" : "default",
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
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            color: hovered ? tokens.color.textMuted : "transparent",
            transition: "color 160ms",
          }}
        >
          <I.arrowUpRight size={16} />
        </span>
        <div
          style={{
            color: tokens.color.textPrimary,
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon size={38} strokeWidth={1.6} />
        </div>
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.25,
            color: tokens.color.textPrimary,
            overflowWrap: "anywhere",
          }}
        >
          {resolvedLabel}
        </div>
        {count != null ? (
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 12,
              fontWeight: 500,
              color: tokens.color.textMuted,
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count} pros
          </div>
        ) : null}
      </button>
    );
  }

  const tileBg = color
    ? hexWithAlpha(color, 0.16)
    : tint?.bg ?? tokens.color.surfaceMuted;
  const tileFg = color ?? tint?.fg ?? tokens.color.textBody;

  return (
    <button
      onClick={onClick ? () => onClick() : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: size === "lg" ? 20 : 16,
        display: "flex",
        flexDirection: "column",
        gap: size === "lg" ? 16 : 12,
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
          width: size === "lg" ? 48 : 40,
          height: size === "lg" ? 48 : 40,
          borderRadius: 10,
          background: tileBg,
          color: tileFg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={size === "lg" ? 24 : 20} />
      </div>
      <div style={{ width: "100%", minWidth: 0 }}>
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: size === "lg" ? 17 : 15,
            lineHeight: 1.25,
            color: tokens.color.textPrimary,
            overflowWrap: "anywhere",
          }}
        >
          {resolvedLabel}
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

function hexWithAlpha(hex: string, alpha: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${match[1]}${a}`;
}
