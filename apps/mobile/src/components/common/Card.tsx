import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadowStyles } from '@/lib/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg';
}

export function Card({ children, style, shadow = 'sm' }: CardProps) {
  return (
    <View style={[styles.card, shadowStyles[shadow], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
