"use client";

import * as React from "react";
import { portfolioSlug, type ProviderCardData } from "../cards.js";
import { tokens } from "../tokens.js";
import { Avatar } from "./Avatar.js";
import { _featuredInternals } from "./FeaturedProviderCard.js";
import { PhotoTile } from "./PhotoTile.js";

const { SpecialtyTag, HeartButton, TopRatedPill, CardMetaRow1, ResponseLine, PriceLine } =
  _featuredInternals;

export type WideProviderCardProps = {
  provider: ProviderCardData;
  favorited?: boolean;
  onFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

// WideProviderCard — 16:11 photo, full-width search result card.
// DESIGN_SYSTEM §8.4 / D03 spec.
export const WideProviderCard: React.FC<WideProviderCardProps> = ({
  provider,
  favorited = false,
  onFavorite,
  onClick,
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
        background: tokens.color.surface,
        borderRadius: tokens.radius.xl,
        overflow: "hidden",
        boxShadow: tokens.shadow.e3,
        transform: hovered && handleClick ? "translateY(-2px)" : undefined,
        transition: `transform 160ms ${tokens.ease.standard}, box-shadow 160ms ${tokens.ease.standard}`,
        ...style,
      }}
    >
      <PhotoTile category={slug} aspect="16/11">
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
            size={44}
            online={provider.online}
          />
        </div>
      </PhotoTile>

      <div style={{ padding: "14px 16px 16px" }}>
        <CardMetaRow1 provider={provider} showReviewCount />
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
          {provider.distance != null ? ` · ${provider.distance} km` : ""}
        </div>
        <ResponseLine response={provider.response} />
        <PriceLine hourly={provider.hourly} suffix="/heure" />
      </div>
    </article>
  );
};
