import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary.DEFAULT : colors.text.inverse}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            sizeTextStyles[size],
            variantTextStyles[variant],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: fontWeights.semibold,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 36 },
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.md },
  lg: { fontSize: fontSizes.lg },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary.DEFAULT },
  secondary: { backgroundColor: colors.neutral[200] },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary.DEFAULT },
  ghost: { backgroundColor: 'transparent' },
});

const variantTextStyles = StyleSheet.create({
  primary: { color: colors.text.inverse },
  secondary: { color: colors.text.primary },
  outline: { color: colors.primary.DEFAULT },
  ghost: { color: colors.primary.DEFAULT },
});
