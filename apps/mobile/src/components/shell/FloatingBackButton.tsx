import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';

type ChassisProps = Omit<PressableProps, 'style' | 'children'> & {
  accessibilityLabel: string;
  style?: ViewStyle;
  children: React.ReactNode;
};

function FloatingChassis({
  accessibilityLabel,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: ChassisProps) {
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

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.chassis, theme.shadow.e1]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export type FloatingBackButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: ViewStyle;
};

export function FloatingBackButton({ style, ...rest }: FloatingBackButtonProps) {
  return (
    <FloatingChassis accessibilityLabel="Retour" style={style} {...rest}>
      <I.arrowLeft size={18} color={theme.colors.textPrimary} />
    </FloatingChassis>
  );
}

export type FloatingShareButtonProps = FloatingBackButtonProps;

export function FloatingShareButton({ style, ...rest }: FloatingShareButtonProps) {
  return (
    <FloatingChassis accessibilityLabel="Partager" style={style} {...rest}>
      <I.share size={18} color={theme.colors.textPrimary} />
    </FloatingChassis>
  );
}

export type FloatingHeartButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: ViewStyle;
  active?: boolean;
};

export function FloatingHeartButton({
  style,
  active = false,
  ...rest
}: FloatingHeartButtonProps) {
  const color = active ? theme.colors.accent : theme.colors.textPrimary;
  return (
    <FloatingChassis
      accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={style}
      {...rest}
    >
      <I.heart
        size={18}
        color={color}
        fill={active ? theme.colors.accent : 'transparent'}
      />
    </FloatingChassis>
  );
}

const styles = StyleSheet.create({
  chassis: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
