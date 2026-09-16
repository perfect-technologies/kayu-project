"use client";

import * as React from "react";
import { fonts, palette, radii } from "../tokens.js";
import type { IconProps } from "./Icon.js";

export type EmptyStateProps = {
  icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  /** The single call to action (a Button or a link styled as one). */
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/** Dashed `rounded-3xl` card with an icon and one CTA; every list renders one when empty. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  style,
}) => (
  <div
    role="status"
    className={className}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: 32,
      borderRadius: radii.cardLg,
      border: `2px dashed ${palette.border}`,
      background: "rgba(255,255,255,.6)",
      ...style,
    }}
  >
    {Icon ? (
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          marginBottom: 14,
          borderRadius: "50%",
          background: palette.secondary,
          color: palette.primary,
        }}
      >
        <Icon size={22} stroke={1.9} />
      </span>
    ) : null}
    <h3
      style={{
        margin: 0,
        fontFamily: `var(--font-heading, ${fonts.heading})`,
        fontSize: 16,
        fontWeight: 800,
        lineHeight: 1.3,
        color: palette.foreground,
      }}
    >
      {title}
    </h3>
    {description ? (
      <p
        style={{
          margin: "6px 0 0",
          maxWidth: 380,
          fontSize: 14,
          lineHeight: 1.5,
          color: palette.mutedForeground,
        }}
      >
        {description}
      </p>
    ) : null}
    {action ? <div style={{ marginTop: 18 }}>{action}</div> : null}
  </div>
);
