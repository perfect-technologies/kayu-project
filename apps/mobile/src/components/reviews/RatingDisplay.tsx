import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';

interface RatingCategoryProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
}

function RatingCategory({ label, icon, value }: RatingCategoryProps) {
  return (
    <View style={styles.category}>
      <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} />
      <Text style={styles.categoryLabel}>{label}</Text>
      <Text style={styles.categoryValue}>{value > 0 ? value.toFixed(1) : '—'}</Text>
    </View>
  );
}

interface RatingDisplayProps {
  averages: {
    overall: number;
    punctuality: number;
    quality: number;
    communication: number;
    value: number;
    professionalism: number;
  };
  totalReviews: number;
}

export function RatingDisplay({ averages, totalReviews }: RatingDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.overallRow}>
        <Ionicons name="star" size={28} color={colors.warning.DEFAULT} />
        <Text style={styles.overallScore}>{averages.overall > 0 ? averages.overall.toFixed(1) : '—'}</Text>
        <Text style={styles.reviewCount}>({totalReviews} avis)</Text>
      </View>

      <View style={styles.categories}>
        <RatingCategory label="Ponctualité" icon="time-outline" value={averages.punctuality} />
        <RatingCategory label="Qualité" icon="ribbon-outline" value={averages.quality} />
        <RatingCategory label="Communication" icon="chatbubble-outline" value={averages.communication} />
        <RatingCategory label="Rapport qualité-prix" icon="cash-outline" value={averages.value} />
        <RatingCategory label="Professionnalisme" icon="briefcase-outline" value={averages.professionalism} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  overallScore: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: fontSizes.sm,
    color: colors.text.tertiary,
  },
  categories: {
    gap: spacing.sm,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
  },
  categoryValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    width: 30,
    textAlign: 'right',
  },
});
