import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

// Placeholder for DS06–DS09 pro screens so the role-aware tab set has real
// navigation targets in DS01. Each tab passes its label via route params.
export function ComingSoonScreen({
  title,
  iconName = 'sparkles',
  description = 'Cette surface arrive dans une prochaine mise à jour.',
}: {
  title: string;
  iconName?: keyof typeof I;
  description?: string;
}) {
  const insets = useSafeAreaInsets();
  const Icon = I[iconName];
  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 120 },
      ]}
    >
      <View style={styles.iconCircle}>
        <Icon size={32} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}

// ProviderDashboardScreen (DS06), JobRequestsScreen (DS07), and EarningsScreen
// (DS08) ship their own files. Onboarding remains a placeholder until DS09.

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
