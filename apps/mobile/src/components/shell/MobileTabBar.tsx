import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { I, type IconName } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

// Icon-only: labels feed accessibilityLabel but never render.
const TAB_CONFIG: Record<string, { icon: IconName; label: string }> = {
  // Client tabs
  Home: { icon: 'home', label: 'Accueil' },
  Search: { icon: 'search', label: 'Rechercher' },
  Bookings: { icon: 'calendar', label: 'Réservations' },
  Messages: { icon: 'messageCircle', label: 'Messages' },
  Profile: { icon: 'user', label: 'Moi' },
  // Pro tabs
  ProviderDashboard: { icon: 'home', label: 'Espace pro' },
  Requests: { icon: 'inbox', label: 'Demandes' },
  Earnings: { icon: 'coins', label: 'Gains' },
};

type TabButtonProps = PressableProps & {
  active: boolean;
  icon: IconName;
  label: string;
};

function TabButton({ active, icon, label, ...rest }: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn: PressableProps['onPressIn'] = (e) => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 120,
      useNativeDriver: true,
    }).start();
    rest.onPressIn?.(e);
  };
  const pressOut: PressableProps['onPressOut'] = (e) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
    rest.onPressOut?.(e);
  };

  const IconCmp = I[icon];
  const iconColor = active ? theme.colors.textInverse : theme.colors.textMuted;

  return (
    <Animated.View style={[styles.tab, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.tabInner, active && styles.tabInnerActive]}
        {...rest}
      >
        <IconCmp size={20} strokeWidth={active ? 2 : 1.75} color={iconColor} />
      </Pressable>
    </Animated.View>
  );
}

export function MobileTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Allow any screen in any stack to hide the tab bar via tabBarStyle: 'none'.
  const activeDescriptor = descriptors[state.routes[state.index].key];
  const hidden =
    (activeDescriptor.options.tabBarStyle as { display?: string } | undefined)
      ?.display === 'none';
  if (hidden) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fade]} />
      <View style={[styles.pill, theme.shadow.e4]}>
        {state.routes.map((route, index) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const active = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!active && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabButton
              key={route.key}
              active={active}
              icon={cfg.icon}
              label={cfg.label}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  fade: {
    backgroundColor: theme.colors.bg,
    top: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tab: {
    flex: 1,
    minWidth: 0,
  },
  tabInner: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabInnerActive: {
    backgroundColor: theme.colors.primary,
  },
});
