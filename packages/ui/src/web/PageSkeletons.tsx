"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";
import {
  FeaturedProviderCardSkeleton,
  NearbyCardSkeleton,
  WideProviderCardSkeleton,
} from "./CardSkeletons.js";

export type PageSkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

// Sticky header + category strip + featured row + nearby grouped card.
// Dimensions mirror the mobile home layout; also works as a neutral fallback
// for the web home featured section.
export const HomeScreenSkeleton: React.FC<PageSkeletonProps> = ({ className, style }) => (
  <div
    aria-hidden
    aria-busy
    className={className}
    style={{
      background: tokens.color.bg,
      padding: "0 16px 20px",
      ...style,
    }}
  >
    {/* Sticky-search placeholder */}
    <div style={{ paddingTop: 16, paddingBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Shimmer width={88} height={22} />
        <div style={{ display: "flex", gap: 8 }}>
          <Shimmer width={36} height={36} radius={18} />
          <Shimmer width={36} height={36} radius={18} />
        </div>
      </div>
      <Shimmer width="100%" height={52} radius={tokens.radius.pill} />
    </div>

    {/* Category strip */}
    <div style={{ display: "flex", gap: 20, overflow: "hidden", padding: "8px 2px 16px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Shimmer width={40} height={40} radius={20} />
          <Shimmer width={48} height={10} />
        </div>
      ))}
    </div>

    {/* Hero heading */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, paddingBottom: 14 }}>
      <Shimmer width="70%" height={26} />
      <Shimmer width="45%" height={14} />
    </div>

    {/* Featured carousel */}
    <div style={{ display: "flex", gap: 12, overflow: "hidden", paddingBottom: 24 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <FeaturedProviderCardSkeleton key={i} width={280} />
      ))}
    </div>

    {/* Nearby grouped card */}
    <Shimmer width={140} height={18} style={{ marginBottom: 10 }} />
    <NearbyCardSkeleton rows={4} />
  </div>
);

export const SearchResultsSkeleton: React.FC<PageSkeletonProps & { count?: number }> = ({
  count = 5,
  className,
  style,
}) => (
  <div
    aria-hidden
    aria-busy
    className={className}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: "16px",
      background: tokens.color.bg,
      ...style,
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <WideProviderCardSkeleton key={i} />
    ))}
  </div>
);

export const ProviderProfileSkeleton: React.FC<PageSkeletonProps> = ({ className, style }) => (
  <div
    aria-hidden
    aria-busy
    className={className}
    style={{ background: tokens.color.bg, ...style }}
  >
    <div style={{ aspectRatio: "5 / 4", background: tokens.color.surfaceMuted }} />
    <div style={{ padding: "20px 20px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: -44 }}>
        <Shimmer width={88} height={88} radius={44} />
        <Shimmer width={180} height={22} />
        <Shimmer width={140} height={14} />
        <Shimmer width={120} height={12} />
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: "14px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              borderLeft: i === 1 ? `1px solid ${tokens.color.borderSubtle}` : undefined,
              borderRight: i === 1 ? `1px solid ${tokens.color.borderSubtle}` : undefined,
            }}
          >
            <Shimmer width={40} height={16} />
            <Shimmer width={60} height={10} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 22, paddingBottom: 40 }}>
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={4} />
        <SectionSkeleton rows={2} />
      </div>
    </div>
  </div>
);

const SectionSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <Shimmer width={120} height={18} />
    {Array.from({ length: rows }).map((_, i) => (
      <Shimmer key={i} width={`${60 + ((i * 17) % 30)}%`} height={12} />
    ))}
  </div>
);
