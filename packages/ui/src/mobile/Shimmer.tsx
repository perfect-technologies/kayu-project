import * as React from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";
import { tokens } from "../tokens.js";

export type ShimmerProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

// Two-tone wipe over a slate block, 1600ms linear loop.
// No LinearGradient dep — uses absolute-positioned translated slate-200 bar.
export const Shimmer: React.FC<ShimmerProps> = ({
  width = "100%",
  height = 16,
  radius = tokens.radius.sm,
  style,
}) => {
  const progress = React.useRef(new Animated.Value(0)).current;
  const [layoutW, setLayoutW] = React.useState(0);

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const barW = Math.max(layoutW, 1) * 0.6;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-barW, Math.max(layoutW, 1)],
  });

  return (
    <View
      accessible={false}
      onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: tokens.color.surfaceMuted,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {layoutW > 0 ? (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: barW,
            backgroundColor: tokens.color.border,
            opacity: 0.9,
            transform: [{ translateX }],
          }}
        />
      ) : null}
    </View>
  );
};
