import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Une erreur est survenue',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={56} color={colors.error.DEFAULT} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button title="Réessayer" onPress={onRetry} variant="outline" size="sm" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  message: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
