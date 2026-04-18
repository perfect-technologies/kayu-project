import * as React from "react";
import { Image, Text, View, type ViewStyle } from "react-native";
import { tokens } from "../tokens.js";

export type AvatarProps = {
  name?: string;
  bg?: string;
  size?: number;
  initials?: string;
  online?: boolean;
  ring?: boolean;
  src?: string;
  style?: ViewStyle;
};

const BRAND_BGS = [
  tokens.color.primary,
  tokens.color.accent,
  tokens.color.success,
  tokens.color.warning,
  "#4F46E5",
  "#BE185D",
  "#7C3AED",
  "#0D9488",
];

const hashBg = (name = ""): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return BRAND_BGS[Math.abs(h) % BRAND_BGS.length]!;
};

const deriveInitials = (name = ""): string =>
  name
    .split(/\s+/)
    .map((p) => p[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const Avatar: React.FC<AvatarProps> = ({
  name,
  bg,
  size = 56,
  initials,
  online,
  ring,
  src,
  style,
}) => {
  const background = bg ?? hashBg(name);
  const label = initials ?? deriveInitials(name);
  const dot = Math.round(size * 0.24);
  // RN lacks multi-ring box-shadow — emulate with nested borders.
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tokens.color.surface,
          alignItems: "center",
          justifyContent: "center",
          padding: ring ? 4 : 2,
        },
        ring
          ? {
              borderWidth: 2,
              borderColor: tokens.color.primary,
            }
          : null,
        style,
      ]}
    >
      <View
        style={{
          width: size - (ring ? 8 : 4),
          height: size - (ring ? 8 : 4),
          borderRadius: (size - (ring ? 8 : 4)) / 2,
          backgroundColor: background,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {src ? (
          <Image
            source={{ uri: src }}
            accessibilityLabel={name}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : (
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "PlusJakartaSans-SemiBold",
              fontSize: Math.round(size * 0.38),
              lineHeight: Math.round(size * 0.38) * 1.05,
              letterSpacing: -0.5,
            }}
          >
            {label}
          </Text>
        )}
      </View>
      {online ? (
        <View
          accessibilityLabel="en ligne"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: tokens.color.success,
            borderWidth: 2,
            borderColor: tokens.color.surface,
          }}
        />
      ) : null}
    </View>
  );
};
