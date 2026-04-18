"use client";

import * as React from "react";
import { Award } from "lucide-react";

// Parent must set: position: relative; overflow: hidden; border-top-left-radius: inherit.
export const TopRatedRibbon: React.FC = () => (
  <div
    aria-label="Top rated"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: 88,
      height: 88,
      overflow: "hidden",
      pointerEvents: "none",
      borderTopLeftRadius: "inherit",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 14,
        left: -24,
        width: 120,
        transform: "rotate(-45deg)",
        background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "4px 0",
        boxShadow: "0 2px 6px rgba(245,158,11,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Award size={10} strokeWidth={2} />
      Top Rated
    </div>
  </div>
);
