"use client";

import * as React from "react";
import { tokens } from "../tokens.js";

export type ShimmerProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

// 1600ms linear infinite horizontal shimmer. Matches prototype .k-shimmer.
export const Shimmer: React.FC<ShimmerProps> = ({
  width = "100%",
  height = 16,
  radius = tokens.radius.sm,
  className,
  style,
}) => (
  <span
    aria-hidden
    className={className}
    style={{
      display: "inline-block",
      width,
      height,
      borderRadius: radius,
      background:
        "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)",
      backgroundSize: "800px 100%",
      animation: "kayu-shimmer 1600ms linear infinite",
      ...style,
    }}
  />
);

// Keyframes as a mountable one-shot. Consumers can instead ship the CSS via
// globals.css — kept inline so the component is self-sufficient in isolation.
export const ShimmerStyles: React.FC = () => (
  <style>{`@keyframes kayu-shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }`}</style>
);
