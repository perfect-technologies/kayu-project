import * as React from "react";
import Svg, { Polyline } from "react-native-svg";
import { tokens } from "../tokens.js";

export type SparklineProps = {
  up?: boolean;
  width?: number;
  height?: number;
  strokeColor?: string;
};

const UP_POINTS = "0,24 14,20 28,22 42,15 56,18 70,12 84,14 100,6";
const DOWN_POINTS = "0,10 14,14 28,12 42,18 56,15 70,20 84,18 100,24";

// React Native mirror of the web Sparkline. Same two hand-drawn shapes so
// mobile and web StatCards visually match.
export const Sparkline: React.FC<SparklineProps> = ({
  up = true,
  width = 100,
  height = 30,
  strokeColor,
}) => {
  const stroke = strokeColor ?? (up ? tokens.color.success : tokens.color.danger);
  return (
    <Svg width={width} height={height} viewBox="0 0 100 30">
      <Polyline
        points={up ? UP_POINTS : DOWN_POINTS}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
