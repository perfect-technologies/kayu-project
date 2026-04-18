"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { tokens } from "../tokens.js";

export type StarRatingProps = {
  value: number;
  count?: number;
  size?: number;
};

// Single amber star + tabular rating + optional review count.
// Rounded to 1 decimal; no half-stars (DESIGN_SYSTEM §10).
export const StarRating: React.FC<StarRatingProps> = ({
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
      fontFamily: tokens.font.body,
    }}
  >
    <Star size={size} fill="currentColor" strokeWidth={0} />
    <span
      style={{
        color: tokens.color.textPrimary,
        fontWeight: 600,
        fontSize: size,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toFixed(1)}
    </span>
    {count != null ? (
      <span
        style={{
          color: tokens.color.textMuted,
          fontWeight: 400,
          fontSize: size - 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ({count})
      </span>
    ) : null}
  </span>
);
