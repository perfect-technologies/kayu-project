import * as React from "react";
import { View, type ViewStyle } from "react-native";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";

export type FeaturedProviderCardSkeletonProps = {
  width?: number | string;
  style?: ViewStyle;
};

export const FeaturedProviderCardSkeleton: React.FC<
  FeaturedProviderCardSkeletonProps
> = ({ width, style }) => (
  <View
    accessible={false}
    style={[
      {
        width: (width ?? "78%") as ViewStyle["width"],
        maxWidth: typeof width === "number" ? undefined : 320,
        flexShrink: 0,
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        overflow: "hidden",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 6,
      },
      style,
    ]}
  >
    <View style={{ aspectRatio: 4 / 5, backgroundColor: tokens.color.surfaceMuted }} />
    <View style={{ padding: 14, paddingBottom: 16, gap: 7 }}>
      <Shimmer width="62%" height={16} />
      <Shimmer width="48%" height={12} />
      <Shimmer width="30%" height={12} />
      <Shimmer width="40%" height={16} />
    </View>
  </View>
);

export const WideProviderCardSkeleton: React.FC<{ style?: ViewStyle }> = ({
  style,
}) => (
  <View
    accessible={false}
    style={[
      {
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        overflow: "hidden",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 6,
      },
      style,
    ]}
  >
    <View
      style={{ aspectRatio: 16 / 11, backgroundColor: tokens.color.surfaceMuted }}
    />
    <View style={{ padding: 14, paddingBottom: 16, gap: 7 }}>
      <Shimmer width="62%" height={16} />
      <Shimmer width="70%" height={12} />
      <Shimmer width="38%" height={12} />
      <Shimmer width="44%" height={16} />
    </View>
  </View>
);

export const NearbyRowSkeleton: React.FC<{ last?: boolean }> = ({ last }) => (
  <View
    accessible={false}
    style={{
      flexDirection: "row",
      gap: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: tokens.color.borderSubtle,
    }}
  >
    <Shimmer width={84} height={84} radius={14} />
    <View style={{ flex: 1, gap: 6 }}>
      <Shimmer width="50%" height={14} />
      <Shimmer width="70%" height={12} />
      <Shimmer width="40%" height={12} />
    </View>
    <View style={{ alignItems: "flex-end", gap: 6 }}>
      <Shimmer width={48} height={14} />
      <Shimmer width={32} height={10} />
    </View>
  </View>
);

export const NearbyCardSkeleton: React.FC<{ rows?: number; style?: ViewStyle }> = ({
  rows = 4,
  style,
}) => (
  <View
    accessible={false}
    style={[
      {
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 4,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 6,
      },
      style,
    ]}
  >
    {Array.from({ length: rows }).map((_, i) => (
      <NearbyRowSkeleton key={i} last={i === rows - 1} />
    ))}
  </View>
);
