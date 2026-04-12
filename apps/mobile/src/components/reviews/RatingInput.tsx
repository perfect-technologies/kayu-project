import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';

interface RatingInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onChange: (value: number) => void;
}

export function RatingInput({ label, icon, value, onChange }: RatingInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={28}
              color={star <= value ? colors.warning.DEFAULT : colors.neutral[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
});
