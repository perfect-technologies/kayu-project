"use client";

import * as React from "react";
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
  className?: string;
  style?: React.CSSProperties;
};

const VARIANT_STYLE: Record<ChipVariant, React.CSSProperties> = {
  neutral: {
    background: tokens.color.surfaceMuted,
    color: tokens.color.textBody,
  },
  success: {
    background: tokens.color.successSubtle,
    color: "#047857",
  },
  warning: {
    background: tokens.color.warningSubtle,
    color: "#B45309",
  },
  primary: {
    background: tokens.color.primarySubtle,
    color: tokens.color.primaryHover,
  },
  accent: {
    background: tokens.color.accentSubtle,
    color: "#BE123C",
  },
  expert: {
    background: tokens.color.expertSubtle,
    color: tokens.color.expert,
  },
};

const SIZE_STYLE: Record<ChipSize, React.CSSProperties> = {
  md: {
    height: 28,
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 500,
    gap: 6,
  },
  sm: {
    height: 22,
    padding: "0 10px",
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.01em",
    gap: 4,
  },
};

export const Chip: React.FC<ChipProps> = ({
  variant = "neutral",
  size = "md",
  leadingIcon,
  children,
  className,
  style,
}) => (
  <span
    className={className}
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: tokens.radius.pill,
      fontFamily: tokens.font.body,
      whiteSpace: "nowrap",
      ...SIZE_STYLE[size],
      ...VARIANT_STYLE[variant],
      ...style,
    }}
  >
    {leadingIcon}
    {children}
  </span>
);
