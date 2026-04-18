import * as React from "react";
import { Text, View, type ViewStyle, type TextStyle } from "react-native";
import { tokens } from "../tokens.js";

export type ChipVariant =
  | "neutral"
  | "success"
  | "warning"
  | "primary"
  | "accent"
  | "expert";

export type ChipSize = "sm" | "md";

export type ChipProps = {
  variant?: ChipVariant;
  size?: ChipSize;
  leadingIcon?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const VARIANT: Record<ChipVariant, { bg: string; fg: string }> = {
  neutral: { bg: tokens.color.surfaceMuted, fg: tokens.color.textBody },
  success: { bg: tokens.color.successSubtle, fg: "#047857" },
  warning: { bg: tokens.color.warningSubtle, fg: "#B45309" },
  primary: { bg: tokens.color.primarySubtle, fg: tokens.color.primaryHover },
  accent: { bg: tokens.color.accentSubtle, fg: "#BE123C" },
  expert: { bg: tokens.color.expertSubtle, fg: tokens.color.expert },
};

const SIZE: Record<
  ChipSize,
  { height: number; paddingX: number; fontSize: number; weight: TextStyle["fontWeight"]; gap: number; letter?: number }
> = {
  md: { height: 28, paddingX: 12, fontSize: 13, weight: "500", gap: 6 },
  sm: { height: 22, paddingX: 10, fontSize: 11.5, weight: "600", gap: 4, letter: 0.12 },
};

export const Chip: React.FC<ChipProps> = ({
  variant = "neutral",
  size = "md",
  leadingIcon,
  children,
  style,
  textStyle,
}) => {
  const v = VARIANT[variant];
  const s = SIZE[size];
  return (
    <View
      style={[
        {
          height: s.height,
          paddingHorizontal: s.paddingX,
          borderRadius: tokens.radius.pill,
          backgroundColor: v.bg,
          flexDirection: "row",
          alignItems: "center",
          gap: s.gap,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {leadingIcon}
      <Text
        style={[
          {
            color: v.fg,
            fontSize: s.fontSize,
            fontWeight: s.weight,
            letterSpacing: s.letter,
            fontFamily:
              s.weight === "600"
                ? "Inter-SemiBold"
                : s.weight === "500"
                  ? "Inter-Medium"
                  : "Inter-Regular",
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};
