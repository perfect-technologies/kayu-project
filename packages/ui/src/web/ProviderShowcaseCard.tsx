"use client";

import * as React from "react";
import { User } from "lucide-react";
import type { ProviderCardData } from "../cards.js";
import { tokens } from "../tokens.js";
import { FallbackCategoryIcon, I, resolveLucideIcon } from "./Icon.js";

export type ProviderShowcaseCardProps = {
  provider: ProviderCardData;
  highlight?: boolean;
  compact?: boolean;
  ctaLabel?: string;
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export const ProviderShowcaseCard: React.FC<ProviderShowcaseCardProps> = ({
  provider,
  highlight = false,
  compact = false,
  ctaLabel = "Voir le profil",
  onClick,
  className,
  style,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const handleClick = onClick ? () => onClick(provider.id) : undefined;
  const isFastResponse = provider.response.includes("min");
  const initials =
    provider.initials ?? initialsFrom(provider.firstName, provider.lastName);
  const hasInitials = initials !== "?";

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
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            flexShrink: 0,
            background: "#F5F2E9",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {provider.avatarUrl ? (
            <img
              src={provider.avatarUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : hasInitials ? (
            <span
              style={{
                fontFamily: tokens.font.mono,
                fontWeight: 700,
                fontSize: 22,
                color: tokens.color.textMuted,
              }}
            >
              {initials}
            </span>
          ) : (
            <User size={28} color={tokens.color.textMuted} strokeWidth={1.6} />
          )}
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
        {provider.categoryName ? (
          (() => {
            const PrimaryIcon =
              resolveLucideIcon(provider.categoryIconName) ?? FallbackCategoryIcon;
            return (
              <span className="k-chip k-chip-sm">
                <span style={{ color: provider.categoryColor ?? "currentColor", display: "inline-flex" }}>
                  <PrimaryIcon size={12} />
                </span>
                {provider.categoryName}
              </span>
            );
          })()
        ) : null}
        {provider.secondaryCategories?.map((cat) => {
          const ChipIcon = resolveLucideIcon(cat.iconName) ?? FallbackCategoryIcon;
          return (
            <span key={cat.name} className="k-chip k-chip-sm">
              <span style={{ color: cat.color ?? "currentColor", display: "inline-flex" }}>
                <ChipIcon size={12} />
              </span>
              {cat.name}
            </span>
          );
        })}
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

function initialsFrom(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] ?? "";
  const l = lastName.trim()[0] ?? "";
  const combo = `${f}${l}`.toUpperCase();
  return combo || "?";
}

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
