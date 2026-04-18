import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

// Placeholder confirmation screen. D08 replaces this with the full Kayou
// Moment animation (arc + pulse). For D07 we only need the step-3 landing so
// confirm advances somewhere coherent.
export function KayouMomentPlaceholder({
  providerName,
  onDone,
}: {
  providerName: string;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: 40 + insets.top, paddingBottom: 40 + insets.bottom }]}>
      <View style={styles.ringOuter}>
        <View style={styles.ringInner}>
          <I.check size={36} color={theme.colors.textInverse} strokeWidth={2.5} />
        </View>
      </View>

      <Text style={styles.title}>C&apos;est noté&nbsp;!</Text>
      <Text style={styles.body}>
        <Text style={styles.bodyBold}>{providerName}</Text> te recontacte sous{' '}
        <Text style={styles.bodyBold}>~15 min</Text> pour confirmer les détails.
      </Text>

      <View style={styles.refCard}>
        <View style={styles.refCell}>
          <Text style={styles.refLabel}>Référence</Text>
          <Text style={styles.refValue}>#KY-4829-AM</Text>
        </View>
        <View style={[styles.refCell, styles.refCellRight]}>
          <Text style={styles.refLabel}>Statut</Text>
          <Text style={styles.refValueBody}>En attente</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onDone}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.ctaText}>Voir ma réservation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ringOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textBody,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 360,
  },
  bodyBold: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  refCard: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  refCell: {
    flex: 1,
  },
  refCellRight: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  refValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  refValueBody: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  cta: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textInverse,
  },
});
