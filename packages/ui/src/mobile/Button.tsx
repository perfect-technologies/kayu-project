import * as React from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const SIZE: Record<
  ButtonSize,
  { height: number; paddingX: number; fontSize: number; gap: number }
> = {
  sm: { height: 32, paddingX: 12, fontSize: 13, gap: 6 },
  md: { height: 40, paddingX: 16, fontSize: 15, gap: 8 },
  lg: { height: 48, paddingX: 22, fontSize: 16, gap: 10 },
};

const VARIANT: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string }
> = {
  primary: {
    bg: tokens.color.primary,
    fg: tokens.color.textOnPrimary,
  },
  secondary: {
    bg: tokens.color.surface,
    fg: tokens.color.textPrimary,
    border: tokens.color.border,
  },
  ghost: {
    bg: "transparent",
    fg: tokens.color.primaryHover,
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  fullWidth = false,
  disabled,
  title,
  children,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  ...rest
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;
  // Meet the 44px minimum touch target even on sm buttons (DESIGN_SYSTEM §13).
  const minHitSlop = Math.max(0, (44 - s.height) / 2);

  const handlePressIn: PressableProps["onPressIn"] = (e) => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: tokens.duration.fast,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };
  const handlePressOut: PressableProps["onPressOut"] = (e) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: tokens.duration.fast,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled && !loading ? 0.5 : 1,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        hitSlop={{ top: minHitSlop, bottom: minHitSlop, left: 0, right: 0 }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            height: s.height,
            paddingHorizontal: s.paddingX,
            borderRadius: tokens.radius.md,
            backgroundColor: v.bg,
            borderWidth: v.border ? 1 : 0,
            borderColor: v.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: s.gap,
          },
          style,
        ]}
        {...rest}
      >
        {loading ? (
          <Shimmer width={48} height={6} radius={3} />
        ) : (
          <>
            {leadingIcon}
            {(title || children) && (
              <Text
                style={[
                  {
                    color: v.fg,
                    fontSize: s.fontSize,
                    fontFamily: "Inter-SemiBold",
                    fontWeight: "600",
                  },
                  textStyle,
                ]}
                numberOfLines={1}
              >
                {title ?? children}
              </Text>
            )}
            {trailingIcon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Placeholder reference so unused View import isn't stripped by bundlers that
// tree-shake type-only imports aggressively.
void View;
