import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';

export function SearchScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={48} color={colors.neutral[300]} />
      <Text style={styles.title}>Recherche</Text>
      <Text style={styles.subtitle}>Bientôt disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.text.tertiary,
  },
});
