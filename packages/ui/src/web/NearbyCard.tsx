"use client";

import * as React from "react";
import {
  formatHourlyCompact,
  portfolioSlug,
  type ProviderCardData,
} from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { I, type IconName } from "./Icon.js";
import { PhotoTile } from "./PhotoTile.js";

export type NearbyRowProps = {
  provider: ProviderCardData;
  onClick?: (id: string) => void;
  /** Render with no bottom divider — set on the last row in a NearbyCard. */
  last?: boolean;
};

// NearbyRow — 84×84 mini tile + meta + price.
// Lives inside a parent <NearbyCard/>. No own shadow — the card contains it.
export const NearbyRow: React.FC<NearbyRowProps> = ({ provider, onClick, last }) => {
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];
  const TileIcon = (I as Record<string, React.FC<{ size?: number }>>)[
    portfolio.iconName as IconName
  ];

  return (
    <button
      onClick={onClick ? () => onClick(provider.id) : undefined}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? 0 : `1px solid ${tokens.color.borderSubtle}`,
        background: "transparent",
        border: 0,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        width: "100%",
        alignItems: "center",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 84,
          height: 84,
          flexShrink: 0,
          boxShadow: tokens.shadow.e1,
          borderRadius: 14,
        }}
      >
        <PhotoTile category={slug} aspect="1/1" radius={14} showAmbient={false}>
          <div
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              color: portfolio.accent,
              display: "flex",
            }}
          >
            {TileIcon ? <TileIcon size={14} /> : null}
          </div>
          <div style={{ position: "absolute", right: 6, bottom: 6 }}>
            <Avatar
              name={`${provider.firstName} ${provider.lastName}`}
              initials={provider.initials}
              bg={provider.avatarBg}
              src={provider.avatarUrl}
              size={28}
            />
          </div>
        </PhotoTile>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              fontFamily: tokens.font.display,
              fontWeight: 600,
              fontSize: 15,
              color: tokens.color.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {provider.firstName} {provider.lastName}
          </span>
          {provider.verified ? (
            <I.badgeCheck size={13} strokeColor={tokens.color.success} />
          ) : null}
        </div>
        <div
          style={{
            color: tokens.color.textMuted,
            fontFamily: tokens.font.body,
            fontSize: 13,
            fontWeight: 500,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.distance != null ? ` · ${provider.distance} km` : ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 5,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: tokens.color.warning,
            }}
          >
            <I.star size={11} />
            <span
              style={{
                color: tokens.color.textPrimary,
                fontWeight: 600,
                fontSize: 12,
                fontFamily: tokens.font.body,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {provider.rating.toFixed(1)}
            </span>
            <span
              style={{
                color: tokens.color.textMuted,
                fontSize: 12,
                fontFamily: tokens.font.body,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ({provider.reviews})
            </span>
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: tokens.font.body,
              fontWeight: 500,
              color: provider.response.includes("min")
                ? tokens.color.success
                : tokens.color.textMuted,
            }}
          >
            ~{provider.response}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 14,
            fontWeight: 600,
            color: tokens.color.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatHourlyCompact(provider.hourly)}
        </div>
        <div
          style={{
            color: tokens.color.textMuted,
            fontSize: 12,
            fontFamily: tokens.font.body,
            fontWeight: 500,
            marginTop: 2,
          }}
        >
          /heure
        </div>
      </div>
    </button>
  );
};

export type NearbyCardProps = {
  providers: ProviderCardData[];
  onSelect?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

// NearbyCard — outer Paper container for N NearbyRow children.
// Replaces a stack of N shadowed cards (DESIGN_SYSTEM §8.6).
export const NearbyCard: React.FC<NearbyCardProps> = ({
  providers,
  onSelect,
  className,
  style,
}) => (
  <div
    className={className}
    style={{
      background: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      boxShadow: tokens.shadow.e3,
      padding: "4px 16px",
      ...style,
    }}
  >
    {providers.map((p, i) => (
      <NearbyRow
        key={p.id}
        provider={p}
        onClick={onSelect}
        last={i === providers.length - 1}
      />
    ))}
  </div>
);
