import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';
import { IconButton } from './IconButton';

export type ShrinkingSearchHeaderProps = {
  scrolled: boolean;
  onSearchTap: () => void;
  onInboxTap?: () => void;
  onProfileTap?: () => void;
  caption?: string;
  placeholder?: string;
};

const BRAND_ROW_HEIGHT = 40;

export function ShrinkingSearchHeader({
  scrolled,
  onSearchTap,
  onInboxTap,
  onProfileTap,
  caption = 'Plomberie · Coiffure · Ménage · …',
  placeholder = 'Trouve un pro',
}: ShrinkingSearchHeaderProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(scrolled ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: scrolled ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [scrolled, progress]);

  const brandHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND_ROW_HEIGHT, 0],
  });
  const brandOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0, 0],
  });
  const pillPaddingV = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 10],
  });
  const pillPaddingH = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 16],
  });
  const captionOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const captionHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const shadowOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Animated.View
        style={[
          styles.brandRow,
          {
            height: brandHeight,
            opacity: brandOpacity,
          },
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.brandMark} />
          <Text style={styles.brandText}>KAYOU</Text>
        </View>
        <View style={styles.brandActions}>
          <IconButton size={36} accessibilityLabel="Messages" onPress={onInboxTap}>
            <I.inbox size={18} color={theme.colors.textBody} />
          </IconButton>
          <IconButton size={36} accessibilityLabel="Moi" onPress={onProfileTap}>
            <I.user size={18} color={theme.colors.textBody} />
          </IconButton>
        </View>
      </Animated.View>

      <View style={styles.pillWrap}>
        <Animated.View style={theme.shadow.e3}>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel={placeholder}
            onPress={onSearchTap}
            style={({ pressed }) => [
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Animated.View
              style={[
                styles.pill,
                {
                  paddingVertical: pillPaddingV,
                  paddingHorizontal: pillPaddingH,
                },
              ]}
            >
              <I.search size={18} color={theme.colors.textPrimary} />
              <View style={styles.pillMid}>
                <Text style={styles.pillTitle}>{placeholder}</Text>
                <Animated.View
                  style={{ height: captionHeight, opacity: captionOpacity, overflow: 'hidden' }}
                >
                  <Text style={styles.pillCaption} numberOfLines={1}>
                    {caption}
                  </Text>
                </Animated.View>
              </View>
              <View style={styles.pillFilters}>
                <I.sliders size={15} color={theme.colors.primaryHover} />
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.underline, { opacity: shadowOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bg,
    zIndex: 10,
  },
  brandRow: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  brandText: {
    fontFamily: theme.fonts.display,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.36,
    color: theme.colors.textPrimary,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
  },
  pillMid: {
    flex: 1,
    minWidth: 0,
  },
  pillTitle: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  pillCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  pillFilters: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
  },
});
