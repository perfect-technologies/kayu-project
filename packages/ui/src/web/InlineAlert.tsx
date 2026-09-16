"use client";

import * as React from "react";
import { palette, radii, type StatusTone } from "../tokens.js";
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

const VARIANT: Record<InlineAlertVariant, { tone: StatusTone; Icon: React.ComponentType<IconProps> }> = {
  info: { tone: "messages", Icon: I.info },
  success: { tone: "confirmed", Icon: I.checkCircle },
  warning: { tone: "pending", Icon: I.alertTriangle },
  error: { tone: "cancelled", Icon: I.alertCircle },
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
  const { tone, Icon: DefaultIcon } = VARIANT[variant];
  const colors = palette.status[tone];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: radii.card,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: palette.foreground,
        ...style,
      }}
    >
      <span aria-hidden style={{ display: "inline-flex", flexShrink: 0, marginTop: 1, color: colors.fg }}>
        <Icon size={18} stroke={1.9} />
      </span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.45 }}>
        {title ? <div style={{ fontWeight: 700 }}>{title}</div> : null}
        <div style={{ fontWeight: 500, marginTop: title ? 2 : 0 }}>{description}</div>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            flexShrink: 0,
            minHeight: 24,
            padding: 0,
            border: 0,
            background: "transparent",
            color: colors.fg,
            cursor: "pointer",
            font: "inherit",
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
};
