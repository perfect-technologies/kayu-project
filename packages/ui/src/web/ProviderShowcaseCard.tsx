"use client";

import * as React from "react";
import { portfolioSlug, type ProviderCardData } from "../cards.js";
import { tokens } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type ProviderShowcaseCardProps = {
  provider: ProviderCardData;
  /** Render the thin top accent line (used for premium/featured cards). */
  highlight?: boolean;
  /** Compact mode: hide the testimonial and shrink padding. */
  compact?: boolean;
  /** Bottom-right CTA label. Defaults to `Voir le profil`. */
  ctaLabel?: string;
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

// Faithful port of the KAYOU standalone prototype's ProviderCard
// (file 052e06e1-4809-46c9-b44e-a37e517fa61a.js, function ProviderCard).
// Square category icon tile (radial-gradient bg) on the left, name + verified
// + StarRating header on the right, profession line, response line, trust
// chips strip, optional testimonial, and a footer with `À partir de … FC`
// plus a CTA pill.
export const ProviderShowcaseCard: React.FC<ProviderShowcaseCardProps> = ({
  provider,
  highlight = false,
  compact = false,
  ctaLabel = "Voir le profil",
  onClick,
  className,
  style,
}) => {
  const slug = portfolioSlug(provider.categories);
  const portfolio = tokens.portfolio[slug];
  const SpecialtyIcon = (
    I as Record<IconName, React.FC<{ size?: number; stroke?: number }>>
  )[portfolio.iconName as IconName];
  const [hovered, setHovered] = React.useState(false);
  const handleClick = onClick ? () => onClick(provider.id) : undefined;
  const isFastResponse = provider.response.includes("min");

  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        boxShadow: hovered ? tokens.shadow.e2 : tokens.shadow.e1,
        padding: compact ? 16 : 20,
        cursor: handleClick ? "pointer" : "default",
        overflow: "hidden",
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
        transform: hovered && handleClick ? "translateY(-2px)" : undefined,
        borderTop: highlight
          ? `2px solid ${tokens.color.primary}`
          : undefined,
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            flexShrink: 0,
            position: "relative",
            background: portfolio.bg,
            backgroundImage: `radial-gradient(circle at 25% 25%, ${portfolio.accent}2a 0%, transparent 60%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: portfolio.accent,
          }}
        >
          {SpecialtyIcon ? <SpecialtyIcon size={28} /> : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "nowrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.font.display,
                  fontWeight: 600,
                  fontSize: 18,
                  color: tokens.color.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {provider.firstName} {provider.lastName}
              </span>
              {provider.verified ? (
                <span
                  style={{
                    color: tokens.color.success,
                    display: "inline-flex",
                    flexShrink: 0,
                  }}
                >
                  <I.badgeCheck size={16} />
                </span>
              ) : null}
            </span>
            <span style={{ flexShrink: 0 }}>
              <StarRating value={provider.rating} count={provider.reviews} />
            </span>
          </div>

          <div
            className="k-body-m"
            style={{ color: tokens.color.textMuted, marginTop: 2 }}
          >
            {provider.profession}
            {provider.city ? ` · ${provider.city}` : ""}
            {provider.commune ? `, ${provider.commune}` : ""}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              color: isFastResponse
                ? tokens.color.success
                : tokens.color.textMuted,
            }}
          >
            <I.clock size={13} />
            <span className="k-caption" style={{ color: "inherit" }}>
              {provider.response === "À confirmer"
                ? "Délai à confirmer"
                : `Réponse en ~${provider.response}`}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 14,
          marginBottom: 16,
        }}
      >
        {provider.verified ? (
          <TrustChip topRated={!!provider.topRated} />
        ) : null}
        {typeof provider.experienceYears === "number" ? (
          <span className="k-chip k-chip-sm">
            <I.award size={12} /> {provider.experienceYears} ans
          </span>
        ) : null}
        {typeof provider.distance === "number" ? (
          <span className="k-chip k-chip-sm">
            <I.mapPin size={12} /> {provider.distance.toFixed(1)} km
          </span>
        ) : null}
      </div>

      {!compact && provider.testimonial ? (
        <p
          className="k-body"
          style={{
            color: tokens.color.textBody,
            marginTop: 14,
            marginBottom: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          «&nbsp;{provider.testimonial}&nbsp;»
        </p>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 14,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <div>
          <div
            className="k-caption"
            style={{ marginBottom: 2, color: tokens.color.textMuted }}
          >
            À partir de
          </div>
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 17,
              fontWeight: 600,
              color: tokens.color.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {provider.hourly.toLocaleString("fr-FR")} FC
          </div>
        </div>

        {ctaLabel ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
              color: tokens.color.textPrimary,
              border: `1px solid ${tokens.color.border}`,
              fontFamily: tokens.font.body,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {ctaLabel} <I.arrowRight size={14} stroke={2} />
          </span>
        ) : null}
      </div>
    </article>
  );
};

// Inlined to keep the component self-contained and to render the prototype's
// borderless filled star.
const StarRating: React.FC<{ value: number; count?: number; size?: number }> = ({
  value,
  count,
  size = 14,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: tokens.color.warning,
    }}
  >
    <I.star size={size} stroke={0} fill="currentColor" />
    <span
      style={{
        color: tokens.color.textPrimary,
        fontWeight: 600,
        fontSize: size,
        fontFamily: tokens.font.body,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toFixed(1)}
    </span>
    {typeof count === "number" && count > 0 ? (
      <span
        style={{
          color: tokens.color.textMuted,
          fontWeight: 400,
          fontSize: size - 1,
          fontFamily: tokens.font.body,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ({count})
      </span>
    ) : null}
  </span>
);

const TrustChip: React.FC<{ topRated: boolean }> = ({ topRated }) =>
  topRated ? (
    <span className="k-chip k-chip-sm k-chip-expert">
      <I.shieldCheck size={12} /> Expert
    </span>
  ) : (
    <span className="k-chip k-chip-sm k-chip-success">
      <I.badgeCheck size={12} /> De confiance
    </span>
  );

export type ProviderShowcaseCardSkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const ProviderShowcaseCardSkeleton: React.FC<
  ProviderShowcaseCardSkeletonProps
> = ({ className, style }) => (
  <div
    className={className}
    style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadow.e1,
      padding: 20,
      ...style,
    }}
  >
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div
        className="animate-k-shimmer"
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          borderRadius: 14,
          background: tokens.color.surfaceMuted,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="animate-k-shimmer"
          style={{
            width: "55%",
            height: 16,
            borderRadius: 6,
            background: tokens.color.surfaceMuted,
          }}
        />
        <div
          className="animate-k-shimmer"
          style={{
            width: "75%",
            height: 12,
            borderRadius: 6,
            background: tokens.color.surfaceMuted,
            marginTop: 8,
          }}
        />
        <div
          className="animate-k-shimmer"
          style={{
            width: "45%",
            height: 12,
            borderRadius: 6,
            background: tokens.color.surfaceMuted,
            marginTop: 8,
          }}
        />
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
      <div
        className="animate-k-shimmer"
        style={{
          width: 80,
          height: 22,
          borderRadius: 999,
          background: tokens.color.surfaceMuted,
        }}
      />
      <div
        className="animate-k-shimmer"
        style={{
          width: 60,
          height: 22,
          borderRadius: 999,
          background: tokens.color.surfaceMuted,
        }}
      />
      <div
        className="animate-k-shimmer"
        style={{
          width: 70,
          height: 22,
          borderRadius: 999,
          background: tokens.color.surfaceMuted,
        }}
      />
    </div>
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div
        className="animate-k-shimmer"
        style={{
          width: 110,
          height: 30,
          borderRadius: 6,
          background: tokens.color.surfaceMuted,
        }}
      />
      <div
        className="animate-k-shimmer"
        style={{
          width: 110,
          height: 30,
          borderRadius: 8,
          background: tokens.color.surfaceMuted,
        }}
      />
    </div>
  </div>
);
