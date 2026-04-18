"use client";

import * as React from "react";
import { tokens } from "../tokens.js";

export type AvatarProps = {
  name?: string;
  bg?: string;
  size?: number;
  initials?: string;
  online?: boolean;
  ring?: boolean;
  src?: string;
  alt?: string;
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
  alt,
}) => {
  const background = bg ?? hashBg(name);
  const label = initials ?? deriveInitials(name);
  const dot = Math.round(size * 0.24);
  return (
    <span
      role="img"
      aria-label={alt ?? name}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background,
        color: "#FFFFFF",
        fontFamily: tokens.font.display,
        fontWeight: 600,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.02em",
        boxShadow: ring
          ? `0 0 0 2px ${tokens.color.surface}, 0 0 0 4px ${tokens.color.primary}`
          : `0 0 0 2px ${tokens.color.surface}`,
        overflow: "hidden",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? name ?? ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      ) : (
        label
      )}
      {online ? (
        <span
          aria-label="en ligne"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dot,
            height: dot,
            borderRadius: "50%",
            background: tokens.color.success,
            boxShadow: `0 0 0 2px ${tokens.color.surface}`,
          }}
        />
      ) : null}
    </span>
  );
};
