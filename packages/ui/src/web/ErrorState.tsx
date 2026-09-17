"use client";

import * as React from "react";
import { fonts, palette, radii } from "../tokens.js";
import { I } from "./Icon.js";

export type ErrorStateProps = {
  title: string;
  description?: string;
  /** Usually a retry Button. */
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  action,
  className,
  style,
}) => (
  <div
    role="alert"
    className={className}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: 32,
      borderRadius: radii.cardLg,
      border: `1px solid ${palette.border}`,
      background: palette.card,
      ...style,
    }}
  >
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
        background: palette.status.cancelled.bg,
        color: palette.destructive,
      }}
    >
      <I.alertCircle size={22} stroke={1.9} />
    </span>
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
