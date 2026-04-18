"use client";

import * as React from "react";
import { tokens } from "../tokens.js";

export type SparklineProps = {
  up?: boolean;
  width?: number;
  height?: number;
  strokeColor?: string;
};

const UP_POINTS = "0,24 14,20 28,22 42,15 56,18 70,12 84,14 100,6";
const DOWN_POINTS = "0,10 14,14 28,12 42,18 56,15 70,20 84,18 100,24";

// Decorative trend mini-chart for StatCard / Earnings. Two built-in shapes
// (up/down) — not interactive, no axes, no tooltips. Stroke color follows the
// semantic direction (emerald for up, rose for down) unless overridden.
export const Sparkline: React.FC<SparklineProps> = ({
  up = true,
  width = 100,
  height = 30,
  strokeColor,
}) => {
  const stroke = strokeColor ?? (up ? tokens.color.success : tokens.color.danger);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 30"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <polyline
        points={up ? UP_POINTS : DOWN_POINTS}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
