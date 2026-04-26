"use client";

import * as React from "react";
import {
  formatMoneyFc,
  portfolioSlug,
  type ProviderCardData,
} from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { I } from "./Icon.js";
import { PhotoTile } from "./PhotoTile.js";

export type FeaturedProviderCardProps = {
  provider: ProviderCardData;
  favorited?: boolean;
  onFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  /** Override the natural carousel-item width (default 78%, max 320). */
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

// FeaturedProviderCard — 4:5 photo, used in carousels and 3-col featured grids.
// DESIGN_SYSTEM §8.4 / D03 spec.
export const FeaturedProviderCard: React.FC<FeaturedProviderCardProps> = ({
  provider,
  favorited = false,
  onFavorite,
  onClick,
  width,
  className,
  style,
}) => {
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];
  const [hovered, setHovered] = React.useState(false);
  const handleClick = onClick ? () => onClick(provider.id) : undefined;

  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        cursor: handleClick ? "pointer" : "default",
        scrollSnapAlign: "start",
        flexShrink: 0,
        width: width ?? "78%",
        maxWidth: typeof width === "number" ? undefined : 320,
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        overflow: "hidden",
        boxShadow: tokens.shadow.e3,
        transform: hovered && handleClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
        ...style,
      }}
    >
      <PhotoTile category={slug} aspect="4/5">
        <SpecialtyTag accent={portfolio.accent} label={portfolio.label} iconName={portfolio.iconName} />
        {onFavorite ? (
          <HeartButton
            favorited={favorited}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(provider.id);
            }}
          />
        ) : null}
        {provider.topRated ? <TopRatedPill /> : null}
        <div style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar
            name={`${provider.firstName} ${provider.lastName}`}
            initials={provider.initials}
            bg={provider.avatarBg}
            src={provider.avatarUrl}
            size={42}
            online={provider.online}
          />
        </div>
      </PhotoTile>

      <div style={{ padding: "14px 16px 16px" }}>
        <CardMetaRow1 provider={provider} showReviewCount={false} />
        <div
          style={{
            color: tokens.color.textMuted,
            fontFamily: tokens.font.body,
            fontSize: 14,
            fontWeight: 500,
            marginTop: 1,
          }}
        >
          {provider.profession}
          {provider.commune ? ` · ${provider.commune}` : ""}
        </div>
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} suffix="/h" />
      </div>
    </article>
  );
};

// ─── Sub-components reused across the card variants ─────────────────────────

const SpecialtyTag: React.FC<{
  accent: string;
  label: string;
  iconName: string;
}> = ({ accent, label, iconName }) => {
  const Icon = (I as Record<string, React.FC<{ size?: number }>>)[iconName];
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        borderRadius: 999,
        padding: "5px 10px",
        fontFamily: tokens.font.mono,
        fontSize: 10,
        fontWeight: 600,
        color: accent,
        letterSpacing: "0.04em",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {Icon ? <Icon size={11} /> : null} {label}
    </div>
  );
};

const HeartButton: React.FC<{
  favorited: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ favorited, onClick }) => (
  <button
    onClick={onClick}
    aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    aria-pressed={favorited}
    style={{
      position: "absolute",
      top: 10,
      right: 10,
      border: 0,
      background: "transparent",
      padding: 6,
      cursor: "pointer",
      color: favorited ? tokens.color.accent : "#FFFFFF",
      filter: favorited ? "none" : "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
    }}
  >
    <I.heart
      size={22}
      stroke={2}
      fill={favorited ? "currentColor" : "rgba(15,23,42,0.25)"}
    />
  </button>
);

const TopRatedPill: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 12,
      bottom: 12,
      background: "rgba(15,23,42,0.88)",
      color: "#FFFFFF",
      padding: "5px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
    }}
  >
    <I.award size={11} stroke={2} /> Top rated
  </div>
);

const CardMetaRow1: React.FC<{
  provider: ProviderCardData;
  showReviewCount: boolean;
}> = ({ provider, showReviewCount }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: tokens.font.display,
          fontWeight: 600,
          fontSize: 16,
          color: tokens.color.textPrimary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {provider.firstName} {provider.lastName}
      </span>
      {provider.verified ? (
        <I.badgeCheck size={14} strokeColor={tokens.color.success} />
      ) : null}
    </div>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: tokens.color.warning,
        flexShrink: 0,
      }}
    >
      <I.star size={13} />
      <span
        style={{
          color: tokens.color.textPrimary,
          fontWeight: 600,
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          fontFamily: tokens.font.body,
        }}
      >
        {provider.rating.toFixed(1)}
      </span>
      {showReviewCount ? (
        <span
          style={{
            color: tokens.color.textMuted,
            fontWeight: 400,
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            fontFamily: tokens.font.body,
          }}
        >
          ({provider.reviews})
        </span>
      ) : null}
    </span>
  </div>
);

const ResponseLine: React.FC<{ response: string }> = ({ response }) => {
  if (response === "À confirmer") {
    return (
      <div
        style={{
          fontFamily: tokens.font.body,
          fontSize: 12,
          fontWeight: 500,
          color: tokens.color.textMuted,
          marginTop: 4,
        }}
      >
        Délai de réponse à confirmer
      </div>
    );
  }

  const isFast = response.includes("min");
  return (
    <div
      style={{
        fontFamily: tokens.font.body,
        fontSize: 12,
        fontWeight: 500,
        color: isFast ? tokens.color.success : tokens.color.textMuted,
        marginTop: 4,
      }}
    >
      Répond en ~{response}
    </div>
  );
};

const PriceLine: React.FC<{ hourly: number; suffix: string }> = ({
  hourly,
  suffix,
}) => (
  <div style={{ marginTop: 8 }}>
    <span
      style={{
        fontFamily: tokens.font.mono,
        fontSize: 15,
        fontWeight: 600,
        color: tokens.color.textPrimary,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {formatMoneyFc(hourly)}
    </span>
    <span
      style={{
        color: tokens.color.textMuted,
        fontSize: 14,
        fontFamily: tokens.font.body,
      }}
    >
      {" "}
      {suffix}
    </span>
  </div>
);

// Re-exported so WideProviderCard can compose them without duplicating styles.
export const _featuredInternals = {
  SpecialtyTag,
  HeartButton,
  TopRatedPill,
  CardMetaRow1,
  ResponseLine,
  PriceLine,
};
