"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { palette } from "../tokens.js";

export type StarRatingProps = {
  value: number;
  count?: number;
  size?: number;
  className?: string;
};

/** One amber-400 star, the average to one decimal, then the review count as plain text. */
export const StarRating: React.FC<StarRatingProps> = ({ value, count, size = 14, className }) => (
  <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <Star aria-hidden size={size} fill={palette.star} color={palette.star} strokeWidth={0} />
    <span
      style={{
        color: palette.foreground,
        fontWeight: 700,
        fontSize: Math.max(size, 12),
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toFixed(1)}
    </span>
    {count != null ? (
      <span
        style={{
          color: palette.mutedForeground,
          fontSize: Math.max(size - 1, 12),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ({count})
      </span>
    ) : null}
  </span>
);
