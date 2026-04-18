import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/lib/theme';

export type IconButtonSize = 32 | 36 | 40 | 44;

export type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  size?: IconButtonSize;
  children: React.ReactNode;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function IconButton({
  size = 36,
  children,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn: PressableProps['onPressIn'] = (e) => {
    Animated.timing(scale, {
      toValue: 0.94,
      duration: 120,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const pressOut: PressableProps['onPressOut'] = (e) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  const elevation = size >= 40 ? theme.shadow.e2 : theme.shadow.e1;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.base,
          { width: size, height: size, borderRadius: size / 2 },
          elevation,
          style,
        ]}
        {...rest}
      >
        <View style={styles.inner}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
