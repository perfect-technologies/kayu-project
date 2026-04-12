import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  style?: ViewStyle;
}

const variantColors = {
  primary: { bg: colors.primary[50], text: colors.primary.DEFAULT },
  success: { bg: colors.success.light, text: colors.success.dark },
  warning: { bg: colors.warning.light, text: colors.warning.dark },
  error: { bg: colors.error.light, text: colors.error.dark },
  neutral: { bg: colors.neutral[100], text: colors.neutral[700] },
};

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const c = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
});
