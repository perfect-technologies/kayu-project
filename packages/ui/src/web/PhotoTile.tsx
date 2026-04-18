"use client";

import * as React from "react";
import { tokens, type CategorySlug } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type PhotoAspect = "4/5" | "16/11" | "1/1";

export type PhotoTileProps = {
  category: CategorySlug;
  aspect?: PhotoAspect;
  /** Optional radius override; defaults to inherit from the parent. */
  radius?: number | string;
  /** Show the ambient centered icon as a watermark. Default true. */
  showAmbient?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

// PhotoTile — abstract "work tile" primitive (DESIGN_SYSTEM §8.5).
// Two corner radial gradients + a 135° hatching line pattern + ambient icon.
// Children render absolutely positioned overlays (specialty tag, heart, etc.).
export const PhotoTile: React.FC<PhotoTileProps> = ({
  category,
  aspect = "4/5",
  radius,
  showAmbient = true,
  ariaLabel,
  className,
  style,
  children,
}) => {
  const portfolio = tokens.portfolio[category];
  const accent = portfolio.accent;
  const AmbientIcon = I[portfolio.iconName as IconName];

  return (
    <div
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      className={className}
      style={{
        position: "relative",
        aspectRatio: aspect.replace("/", " / "),
        background: portfolio.bg,
        backgroundImage: [
          `radial-gradient(circle at 20% 15%, ${accent}26 0%, transparent 55%)`,
          `radial-gradient(circle at 80% 85%, ${accent}1a 0%, transparent 50%)`,
          `repeating-linear-gradient(135deg, transparent 0, transparent 18px, ${accent}14 18px, ${accent}14 19px)`,
        ].join(", "),
        borderRadius: radius,
        overflow: "hidden",
        ...style,
      }}
    >
      {showAmbient && AmbientIcon ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          <AmbientIcon size={36} stroke={1.5} />
        </div>
      ) : null}
      {children}
    </div>
  );
};
