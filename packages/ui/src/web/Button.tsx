"use client";

import * as React from "react";
import { fonts, motion, palette, radii } from "../tokens.js";

export type ButtonVariant = "primary" | "gold" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { minHeight: 36, padding: "0 14px", fontSize: 13, gap: 6 },
  md: { minHeight: 44, padding: "0 18px", fontSize: 14, gap: 8 },
  lg: { minHeight: 54, padding: "0 24px", fontSize: 15, gap: 9 },
};

const VARIANT: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: {
      background: palette.primary,
      color: "#FFFFFF",
      border: "1px solid transparent",
      borderRadius: radii.pill,
      boxShadow: "0 6px 20px -9px rgba(10,61,54,.38)",
    },
    hover: { background: palette.primaryHover, boxShadow: "0 8px 20px -10px rgba(11,80,61,.53)" },
  },
  gold: {
    base: {
      background: palette.accent,
      color: palette.accentForeground,
      border: "1px solid transparent",
      borderRadius: radii.pill,
      boxShadow: "0 6px 20px -9px rgba(10,61,54,.38)",
    },
    hover: { boxShadow: "0 8px 20px -10px rgba(11,80,61,.53)" },
  },
  secondary: {
    base: {
      background: palette.card,
      color: palette.foreground,
      border: `1px solid ${palette.border}`,
      borderRadius: radii.field,
    },
    hover: { background: palette.secondaryHover },
  },
  ghost: {
    base: {
      background: "transparent",
      color: palette.primary,
      border: "1px solid transparent",
      borderRadius: radii.field,
    },
    hover: { background: palette.secondary },
  },
  danger: {
    base: {
      background: palette.card,
      color: palette.destructive,
      border: `1px solid ${palette.border}`,
      borderRadius: radii.field,
    },
    hover: { background: palette.status.cancelled.bg },
  },
};

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Primary and gold are pills (one per screen region); secondary, ghost and danger use the field radius. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    loading = false,
    fullWidth = false,
    disabled,
    type = "button",
    children,
    style,
    onMouseEnter,
    onMouseLeave,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const v = VARIANT[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onMouseEnter={(event) => {
        setHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHovered(false);
        onMouseLeave?.(event);
      }}
      onPointerDown={(event) => {
        if (!isDisabled && !reducedMotion()) setPressed(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setPressed(false);
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        setPressed(false);
        onPointerLeave?.(event);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: `var(--font-body, ${fonts.body})`,
        fontWeight: 700,
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.55 : 1,
        transform: pressed ? `scale(${motion.pressScale})` : undefined,
        transition: `background-color 180ms, box-shadow 180ms, border-color 180ms, transform ${motion.pressMs}ms`,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        ...SIZE[size],
        ...v.base,
        ...(hovered && !isDisabled ? v.hover : null),
        ...style,
      }}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
