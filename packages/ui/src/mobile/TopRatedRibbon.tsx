import * as React from "react";
import { View, Text } from "react-native";
import { Award } from "lucide-react-native";

// On mobile photo cards the Airbnb-style ribbon is replaced by a pill at
// bottom-left of the photo (DESIGN_SYSTEM §8.4). This renders that pill.
// A desktop-style diagonal ribbon does not translate well to RN compositing.

export type TopRatedRibbonProps = {
  label?: string;
};

export const TopRatedRibbon: React.FC<TopRatedRibbonProps> = ({
  label = "Top rated",
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      height: 24,
      borderRadius: 9999,
      backgroundColor: "rgba(15,23,42,0.88)",
      alignSelf: "flex-start",
    }}
  >
    <Award size={12} color="#FFFFFF" strokeWidth={2} />
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
        fontFamily: "Inter-SemiBold",
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  </View>
);
