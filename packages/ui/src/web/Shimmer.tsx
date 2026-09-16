"use client";

import * as React from "react";
import { motion, palette, radii } from "../tokens.js";

export type ShimmerProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

/** Skeleton block with the K-YOU 1.4 s sheen. Mount `<ShimmerStyles />` once for the animation. */
export const Shimmer: React.FC<ShimmerProps> = ({
  width = "100%",
  height = 16,
  radius = radii.field,
  className,
  style,
}) => (
  <span
    aria-hidden
    className={className}
    style={{
      position: "relative",
      display: "block",
      overflow: "hidden",
      width,
      height,
      borderRadius: radius,
      background: palette.skeleton,
      ...style,
    }}
  >
    <span
      data-kayu-sheen=""
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(100deg, transparent 20%, rgba(255,255,255,.56) 50%, transparent 80%)",
        animation: `kayu-sheen ${motion.sheenMs}ms ease-in-out infinite`,
      }}
    />
  </span>
);

export const ShimmerStyles: React.FC = () => (
  <style>{`@keyframes kayu-sheen { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
@media (prefers-reduced-motion: reduce) { [data-kayu-sheen] { animation: none !important; opacity: 0 } }`}</style>
);
