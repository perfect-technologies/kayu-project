import * as React from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";
import {
  FeaturedProviderCardSkeleton,
  NearbyCardSkeleton,
  WideProviderCardSkeleton,
} from "./CardSkeletons.js";

export type PageSkeletonProps = {
  style?: ViewStyle;
};

export const HomeScreenSkeleton: React.FC<PageSkeletonProps> = ({ style }) => (
  <View accessible={false} style={[styles.page, style]}>
    {/* Sticky-search placeholder */}
    <View style={styles.headerRow}>
      <Shimmer width={88} height={22} />
      <View style={styles.headerButtons}>
        <Shimmer width={36} height={36} radius={18} />
        <Shimmer width={36} height={36} radius={18} />
      </View>
    </View>
    <Shimmer width="100%" height={52} radius={tokens.radius.pill} style={{ marginBottom: 16 }} />

    {/* Category strip */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryStrip}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.categoryItem}>
          <Shimmer width={40} height={40} radius={20} />
          <Shimmer width={48} height={10} />
        </View>
      ))}
    </ScrollView>

    {/* Hero */}
    <View style={{ gap: 8, paddingVertical: 10 }}>
      <Shimmer width="70%" height={26} />
      <Shimmer width="45%" height={14} />
    </View>

    {/* Featured carousel */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <FeaturedProviderCardSkeleton key={i} width={280} />
      ))}
    </ScrollView>

    <Shimmer width={140} height={18} style={{ marginBottom: 10 }} />
    <NearbyCardSkeleton rows={4} />
  </View>
);

export const SearchResultsSkeleton: React.FC<PageSkeletonProps & { count?: number }> = ({
  count = 5,
  style,
}) => (
  <View accessible={false} style={[styles.searchPage, style]}>
    {Array.from({ length: count }).map((_, i) => (
      <WideProviderCardSkeleton key={i} style={i === 0 ? undefined : { marginTop: 16 }} />
    ))}
  </View>
);

export const ProviderProfileSkeleton: React.FC<PageSkeletonProps> = ({ style }) => (
  <View accessible={false} style={[styles.profilePage, style]}>
    <View style={styles.heroPhoto} />
    <View style={styles.profileIdentity}>
      <Shimmer width={88} height={88} radius={44} />
      <Shimmer width={180} height={22} style={{ marginTop: 10 }} />
      <Shimmer width={140} height={14} style={{ marginTop: 6 }} />
      <Shimmer width={120} height={12} style={{ marginTop: 6 }} />
    </View>
    <View style={styles.statRow}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.statCell,
            i === 1 && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: tokens.color.borderSubtle },
          ]}
        >
          <Shimmer width={40} height={16} />
          <Shimmer width={60} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
    <View style={{ gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 }}>
      <SectionSkeleton rows={3} />
      <SectionSkeleton rows={4} />
      <SectionSkeleton rows={2} />
    </View>
  </View>
);

const SectionSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <View style={{ gap: 8 }}>
    <Shimmer width={120} height={18} />
    {Array.from({ length: rows }).map((_, i) => (
      <Shimmer key={i} width={`${60 + ((i * 17) % 30)}%`} height={12} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  categoryStrip: {
    gap: 20,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  categoryItem: {
    alignItems: "center",
    gap: 6,
  },
  searchPage: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    padding: 16,
  },
  profilePage: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  heroPhoto: {
    aspectRatio: 5 / 4,
    backgroundColor: tokens.color.surfaceMuted,
  },
  profileIdentity: {
    alignItems: "center",
    marginTop: -44,
  },
  statRow: {
    flexDirection: "row",
    marginTop: 22,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.borderSubtle,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
});
