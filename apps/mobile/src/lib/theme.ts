import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import {
  tokens,
  colors,
  spacing,
  borderRadius,
  typography,
  brand,
} from '@kayu/ui';

// ─── v2 theme (primary) ──────────────────────────────────────────────────────
// Builds the React Native theme object from @kayu/ui tokens. New code should
// consume `theme` directly (theme.colors.primary, theme.text.displayM, …).

const fonts = {
  display: 'PlusJakartaSans-Bold',
  displayMed: 'PlusJakartaSans-SemiBold',
  body: 'Inter-Regular',
  bodyMed: 'Inter-Medium',
  bodySemi: 'Inter-SemiBold',
  mono: 'JetBrainsMono-Medium',
} as const;

type TextPreset = TextStyle & { fontFamily: string };

const text: Record<keyof typeof tokens.size, TextPreset> = {
  displayXL: {
    fontFamily: fonts.display,
    fontSize: tokens.size.displayXL.fontSize,
    lineHeight: tokens.size.displayXL.lineHeight,
    fontWeight: '700',
    letterSpacing: -1,
    color: tokens.color.textPrimary,
  },
  displayL: {
    fontFamily: fonts.display,
    fontSize: tokens.size.displayL.fontSize,
    lineHeight: tokens.size.displayL.lineHeight,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: tokens.color.textPrimary,
  },
  displayM: {
    fontFamily: fonts.displayMed,
    fontSize: tokens.size.displayM.fontSize,
    lineHeight: tokens.size.displayM.lineHeight,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: tokens.color.textPrimary,
  },
  heading: {
    fontFamily: fonts.displayMed,
    fontSize: tokens.size.heading.fontSize,
    lineHeight: tokens.size.heading.lineHeight,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: tokens.color.textPrimary,
  },
  bodyL: {
    fontFamily: fonts.body,
    fontSize: tokens.size.bodyL.fontSize,
    lineHeight: tokens.size.bodyL.lineHeight,
    fontWeight: '400',
    color: tokens.color.textBody,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: tokens.size.body.fontSize,
    lineHeight: tokens.size.body.lineHeight,
    fontWeight: '400',
    color: tokens.color.textBody,
  },
  bodyM: {
    fontFamily: fonts.bodyMed,
    fontSize: tokens.size.bodyM.fontSize,
    lineHeight: tokens.size.bodyM.lineHeight,
    fontWeight: '500',
    color: tokens.color.textBody,
  },
  caption: {
    fontFamily: fonts.bodyMed,
    fontSize: tokens.size.caption.fontSize,
    lineHeight: tokens.size.caption.lineHeight,
    fontWeight: '500',
    color: tokens.color.textMuted,
  },
  price: {
    fontFamily: fonts.mono,
    fontSize: tokens.size.price.fontSize,
    lineHeight: tokens.size.price.lineHeight,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  overline: {
    fontFamily: fonts.bodyMed,
    fontSize: tokens.size.overline.fontSize,
    lineHeight: tokens.size.overline.lineHeight,
    fontWeight: '600',
    letterSpacing: 0.88, // ~0.08em at 11px
    textTransform: 'uppercase',
    color: tokens.color.textMuted,
  },
};

const shadow: Record<'none' | 'e1' | 'e2' | 'e3' | 'e4' | 'brand', ViewStyle> = {
  none: {},
  e1: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  e2: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  e3: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  e4: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  brand: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const theme = {
  tokens,
  colors: tokens.color,
  spacing: tokens.space,
  radius: tokens.radius,
  fonts,
  text,
  shadow,
  ease: tokens.ease,
  duration: tokens.duration,
  portfolio: tokens.portfolio,
  categoryTint: tokens.categoryTint,
} as const;

export type Theme = typeof theme;

// ─── Legacy v1 exports ───────────────────────────────────────────────────────
// Kept so existing screens (33 files) keep rendering until D05–D07 migrates
// them. Do NOT add new usages — prefer `theme.*` from above.

export { colors, spacing, borderRadius, brand };

export const fontSizes = typography.fontSize;
export const fontWeights = typography.fontWeight;

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  titleLarge: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  titleMedium: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.normal,
    color: colors.text.primary,
  },
  bodyMedium: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    color: colors.text.tertiary,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
  },
});

export const shadowStyles = StyleSheet.create({
  sm: shadow.e1,
  md: shadow.e2,
  lg: shadow.e3,
});
