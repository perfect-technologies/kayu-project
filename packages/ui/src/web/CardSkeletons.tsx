"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";

// Skeletons for D03 cards. Match real-card dimensions ±2px so swapping
// loading→loaded does not layout-shift.

export type FeaturedProviderCardSkeletonProps = {
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export const FeaturedProviderCardSkeleton: React.FC<
  FeaturedProviderCardSkeletonProps
> = ({ width, className, style }) => (
  <div
    aria-hidden
    className={className}
    style={{
      width: width ?? "78%",
      maxWidth: typeof width === "number" ? undefined : 320,
      flexShrink: 0,
      background: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      overflow: "hidden",
      boxShadow: tokens.shadow.e3,
      ...style,
    }}
  >
    <div style={{ aspectRatio: "4 / 5", background: tokens.color.surfaceMuted }} />
    <div style={{ padding: "14px 16px 16px" }}>
      <SkeletonRows widths={["62%", "48%", "30%", "40%"]} />
    </div>
  </div>
);

export type WideProviderCardSkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const WideProviderCardSkeleton: React.FC<
  WideProviderCardSkeletonProps
> = ({ className, style }) => (
  <div
    aria-hidden
    className={className}
    style={{
      background: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      overflow: "hidden",
      boxShadow: tokens.shadow.e3,
      ...style,
    }}
  >
    <div
      style={{ aspectRatio: "16 / 11", background: tokens.color.surfaceMuted }}
    />
    <div style={{ padding: "14px 16px 16px" }}>
      <SkeletonRows widths={["62%", "70%", "38%", "44%"]} />
    </div>
  </div>
);

export const NearbyRowSkeleton: React.FC<{ last?: boolean }> = ({ last }) => (
  <div
    aria-hidden
    style={{
      display: "flex",
      gap: 12,
      padding: "12px 0",
      borderBottom: last ? 0 : `1px solid ${tokens.color.borderSubtle}`,
      alignItems: "center",
    }}
  >
    <Shimmer width={84} height={84} radius={14} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <Shimmer width="50%" height={14} />
      <Shimmer width="70%" height={12} />
      <Shimmer width="40%" height={12} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Shimmer width={48} height={14} />
      <Shimmer width={32} height={10} />
    </div>
  </div>
);

export const NearbyCardSkeleton: React.FC<{ rows?: number; style?: React.CSSProperties }> = ({
  rows = 4,
  style,
}) => (
  <div
    aria-hidden
    style={{
      background: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      boxShadow: tokens.shadow.e3,
      padding: "4px 16px",
      ...style,
    }}
  >
    {Array.from({ length: rows }).map((_, i) => (
      <NearbyRowSkeleton key={i} last={i === rows - 1} />
    ))}
  </div>
);

export const CategoryTileSkeleton: React.FC<{ size?: "md" | "lg" }> = ({
  size = "lg",
}) => {
  const isLg = size === "lg";
  return (
    <div
      aria-hidden
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        padding: isLg ? 20 : 16,
        display: "flex",
        flexDirection: "column",
        gap: isLg ? 16 : 12,
        boxShadow: tokens.shadow.e1,
        width: "100%",
      }}
    >
      <Shimmer width={isLg ? 48 : 40} height={isLg ? 48 : 40} radius={10} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Shimmer width="50%" height={isLg ? 16 : 14} />
        <Shimmer width="30%" height={11} />
      </div>
    </div>
  );
};

const SkeletonRows: React.FC<{ widths: (number | string)[] }> = ({ widths }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {widths.map((w, i) => (
      <Shimmer key={i} width={w} height={i === 0 ? 16 : i === 3 ? 16 : 12} />
    ))}
  </div>
);
