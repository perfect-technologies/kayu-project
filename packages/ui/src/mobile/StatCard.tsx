import * as React from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { tokens } from "../tokens.js";
import { Sparkline } from "./Sparkline.js";

export type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  /** 1 = up, -1 = down, null/undefined = no sparkline/delta */
  trend?: 1 | -1 | null;
  compact?: boolean;
};

// Mobile mirror of the web StatCard. Emerald/rose delta arrow + Sparkline.
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  trend,
  compact = false,
}) => {
  const up = trend != null && trend > 0;
  const deltaColor = up ? tokens.color.success : tokens.color.danger;
  return (
    <View
      style={{
        backgroundColor: tokens.color.surface,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderRadius: tokens.radius.md,
        padding: compact ? 14 : 18,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter-SemiBold",
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.88,
          textTransform: "uppercase",
          color: tokens.color.textMuted,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 10,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans-Bold",
              fontWeight: "700",
              fontSize: compact ? 22 : 26,
              color: tokens.color.textPrimary,
              letterSpacing: 0,
              lineHeight: (compact ? 22 : 26) * 1.1,
            }}
          >
            {value}
          </Text>
          {sub && trend != null && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              <Svg width={10} height={10} viewBox="0 0 10 10">
                <Path
                  d={up ? "M2 7 L5 3 L8 7" : "M2 3 L5 7 L8 3"}
                  stroke={deltaColor}
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  color: deltaColor,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {sub}
              </Text>
            </View>
          )}
          {sub && trend == null && (
            <Text
              style={{
                fontFamily: "Inter-Medium",
                marginTop: 4,
                fontSize: 12,
                fontWeight: "500",
                color: tokens.color.textMuted,
              }}
            >
              {sub}
            </Text>
          )}
        </View>
        {trend != null && <Sparkline up={up} />}
      </View>
    </View>
  );
};
