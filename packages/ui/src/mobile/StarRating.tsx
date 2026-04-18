import * as React from "react";
import { Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { tokens } from "../tokens.js";

export type StarRatingProps = {
  value: number;
  count?: number;
  size?: number;
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  count,
  size = 14,
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    <Star size={size} color={tokens.color.warning} fill={tokens.color.warning} strokeWidth={0} />
    <Text
      style={{
        color: tokens.color.textPrimary,
        fontWeight: "600",
        fontFamily: "Inter-SemiBold",
        fontSize: size,
      }}
    >
      {value.toFixed(1)}
    </Text>
    {count != null ? (
      <Text
        style={{
          color: tokens.color.textMuted,
          fontWeight: "400",
          fontFamily: "Inter-Regular",
          fontSize: size - 1,
        }}
      >
        ({count})
      </Text>
    ) : null}
  </View>
);
