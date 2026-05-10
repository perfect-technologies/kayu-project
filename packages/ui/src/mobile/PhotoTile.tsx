import * as React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  Pattern,
  Rect,
  RadialGradient,
  Stop,
  Line,
} from "react-native-svg";
import { tokens, type CategorySlug } from "../tokens.js";
import {
  FallbackCategoryIcon,
  I,
  resolveLucideIcon,
  type IconName,
} from "./Icon.js";

export type PhotoAspect = "4/5" | "16/11" | "1/1";

export type PhotoTileProps = {
  category?: CategorySlug;
  accent?: string;
  iconName?: string;
  aspect?: PhotoAspect;
  radius?: number;
  showAmbient?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const ASPECT_RATIO: Record<PhotoAspect, number> = {
  "4/5": 4 / 5,
  "16/11": 16 / 11,
  "1/1": 1,
};

// PhotoTile (mobile) — abstract "work tile" via react-native-svg.
// Recreates the web's two radial gradients + 135° hatching pattern using SVG
// primitives. Children render as absolutely positioned overlays on top.
export const PhotoTile: React.FC<PhotoTileProps> = ({
  category,
  accent: accentProp,
  iconName,
  aspect = "4/5",
  radius,
  showAmbient = true,
  accessibilityLabel,
  style,
  children,
}) => {
  const portfolio = category ? tokens.portfolio[category] : undefined;
  const accent = accentProp ?? portfolio?.accent ?? tokens.color.textBody;
  const bg = portfolio?.bg ?? tokens.color.surfaceMuted;
  const AmbientIcon =
    resolveLucideIcon(iconName) ??
    (portfolio ? I[portfolio.iconName as IconName] : null) ??
    FallbackCategoryIcon;
  const gradientId = category ?? "dyn";

  return (
    <View
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          position: "relative",
          aspectRatio: ASPECT_RATIO[aspect],
          backgroundColor: bg,
          borderRadius: radius,
          overflow: "hidden",
          width: "100%",
        },
        style,
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <RadialGradient
            id={`pt-${gradientId}-tl`}
            cx="20%"
            cy="15%"
            rx="55%"
            ry="55%"
          >
            <Stop offset="0%" stopColor={accent} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id={`pt-${gradientId}-br`}
            cx="80%"
            cy="85%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0%" stopColor={accent} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <Pattern
            id={`pt-${gradientId}-hatch`}
            patternUnits="userSpaceOnUse"
            width={19}
            height={19}
            patternTransform="rotate(135)"
          >
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={19}
              stroke={accent}
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-hatch)`} />
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-tl)`} />
        <Rect width="100%" height="100%" fill={`url(#pt-${gradientId}-br)`} />
      </Svg>

      {showAmbient ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.12,
          }}
        >
          <AmbientIcon size={36} color={accent} strokeWidth={1.5} />
        </View>
      ) : null}

      {children}
    </View>
  );
};
