"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { Shimmer } from "./Shimmer.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 32, padding: "0 12px", fontSize: 13, gap: 6 },
  md: { height: 40, padding: "0 16px", fontSize: 15, gap: 8 },
  lg: { height: 48, padding: "0 22px", fontSize: 16, gap: 10 },
};

const VARIANT: Record<
  ButtonVariant,
  { base: React.CSSProperties; hover: React.CSSProperties }
> = {
  primary: {
    base: {
      background: tokens.color.primary,
      color: tokens.color.textOnPrimary,
      border: "none",
    },
    hover: { background: tokens.color.primaryHover },
  },
  secondary: {
    base: {
      background: tokens.color.surface,
      color: tokens.color.textPrimary,
      border: `1px solid ${tokens.color.border}`,
    },
    hover: { background: tokens.color.surfaceMuted },
  },
  ghost: {
    base: {
      background: "transparent",
      color: tokens.color.primaryHover,
      border: "none",
    },
    hover: { background: tokens.color.primarySubtle },
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      loading = false,
      fullWidth = false,
      disabled,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref,
  ) {
    const [hovered, setHovered] = React.useState(false);
    const v = VARIANT[variant];
    const s = SIZE[size];
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        {...rest}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
          cursor: isDisabled ? "not-allowed" : "pointer",
          borderRadius: tokens.radius.md,
          fontFamily: tokens.font.body,
          fontWeight: 600,
          width: fullWidth ? "100%" : undefined,
          transition: `background ${tokens.duration.fast}ms ${tokens.ease.standard}, transform ${tokens.duration.fast}ms ${tokens.ease.standard}`,
          opacity: isDisabled && !loading ? 0.5 : 1,
          outlineOffset: 2,
          ...s,
          ...v.base,
          ...(hovered && !isDisabled ? v.hover : null),
          ...style,
        }}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e);
        }}
        onPointerDown={(e) => {
          if (!isDisabled) e.currentTarget.style.transform = "scale(0.98)";
          rest.onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = "";
          rest.onPointerUp?.(e);
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        {loading ? (
          <Shimmer width={48} height={6} radius={3} />
        ) : (
          <>
            {leadingIcon}
            {children}
            {trailingIcon}
          </>
        )}
      </button>
    );
  },
);
