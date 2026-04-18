import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';
import type { V2Status } from '@/lib/bookingV2';

export function BookingStatusChip({ status }: { status: V2Status }) {
  if (status === 'upcoming') {
    return (
      <View style={[styles.chip, styles.primary]}>
        <Text style={[styles.chipText, styles.primaryText]}>À venir</Text>
      </View>
    );
  }
  if (status === 'active') {
    return (
      <View style={[styles.chip, styles.success]}>
        <PulseDot />
        <Text style={[styles.chipText, styles.successText]}>En cours</Text>
      </View>
    );
  }
  if (status === 'completed') {
    return (
      <View style={[styles.chip, styles.neutral]}>
        <Text style={[styles.chipText, styles.neutralText]}>Terminée</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, styles.danger]}>
      <Text style={[styles.chipText, styles.dangerText]}>Annulée</Text>
    </View>
  );
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.85, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
    };
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    fontWeight: '600',
  },
  primary: { backgroundColor: theme.colors.primarySubtle },
  primaryText: { color: theme.colors.primaryHover },
  success: { backgroundColor: theme.colors.successSubtle },
  successText: { color: theme.colors.success },
  neutral: { backgroundColor: theme.colors.surfaceMuted },
  neutralText: { color: theme.colors.textBody },
  danger: { backgroundColor: theme.colors.dangerSubtle },
  dangerText: { color: '#BE123C' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
});
