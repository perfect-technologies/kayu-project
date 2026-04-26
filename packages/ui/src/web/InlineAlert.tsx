"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { I, type IconProps } from "./Icon.js";

export type InlineAlertVariant = "info" | "success" | "warning" | "error";

export type InlineAlertAction = {
  label: string;
  onClick?: () => void;
};

export type InlineAlertProps = {
  variant?: InlineAlertVariant;
  title?: string;
  description: string;
  action?: InlineAlertAction;
  icon?: React.ComponentType<IconProps>;
  className?: string;
  style?: React.CSSProperties;
};

const VARIANT: Record<
  InlineAlertVariant,
  {
    surface: string;
    border: string;
    icon: string;
    Icon: React.ComponentType<IconProps>;
  }
> = {
  info: {
    surface: tokens.color.primarySubtle,
    border: "rgba(14,165,233,0.22)",
    icon: tokens.color.primaryHover,
    Icon: I.info,
  },
  success: {
    surface: tokens.color.successSubtle,
    border: "rgba(16,185,129,0.24)",
    icon: "#047857",
    Icon: I.checkCircle,
  },
  warning: {
    surface: tokens.color.warningSubtle,
    border: "rgba(245,158,11,0.28)",
    icon: "#B45309",
    Icon: I.alertTriangle,
  },
  error: {
    surface: tokens.color.dangerSubtle,
    border: "rgba(225,29,72,0.22)",
    icon: tokens.color.danger,
    Icon: I.alertCircle,
  },
};

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = "info",
  title,
  description,
  action,
  icon,
  className,
  style,
}) => {
  const v = VARIANT[variant];
  const Icon = icon ?? v.Icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        border: `1px solid ${v.border}`,
        borderRadius: tokens.radius.md,
        background: v.surface,
        padding: "12px 14px",
        color: tokens.color.textPrimary,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          color: v.icon,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={18} stroke={1.85} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <div
            style={{
              fontFamily: tokens.font.body,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.35,
              color: tokens.color.textPrimary,
            }}
          >
            {title}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: tokens.font.body,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.45,
            color: title ? tokens.color.textBody : tokens.color.textPrimary,
            marginTop: title ? 2 : 0,
          }}
        >
          {description}
        </div>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            border: 0,
            background: "transparent",
            color: v.icon,
            cursor: "pointer",
            fontFamily: tokens.font.body,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.4,
            padding: 0,
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
};
