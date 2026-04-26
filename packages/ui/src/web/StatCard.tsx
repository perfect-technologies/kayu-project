"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { Sparkline } from "./Sparkline.js";

export type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  /** 1 = up, -1 = down, null/undefined = no sparkline/delta */
  trend?: 1 | -1 | null;
  compact?: boolean;
};

// Label + big value + delta pill + mini Sparkline. Used on ProviderDashboard
// (DS06) and Earnings (DS08). Colors follow the trend: emerald up / rose down.
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  trend,
  compact = false,
}) => {
  const up = trend != null && trend > 0;
  const deltaColor = up ? tokens.color.success : tokens.color.danger;
  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: compact ? 14 : 18,
        boxShadow: tokens.shadow.e1,
      }}
    >
      <div
        className="k-overline"
        style={{
          fontFamily: tokens.font.body,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: tokens.color.textMuted,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: tokens.font.display,
              fontWeight: 700,
              fontSize: compact ? 22 : 26,
              color: tokens.color.textPrimary,
              letterSpacing: 0,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
          {sub && trend != null && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                color: deltaColor,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: tokens.font.body,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path
                  d={up ? "M2 7 L5 3 L8 7" : "M2 3 L5 7 L8 3"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {sub}
            </div>
          )}
          {sub && trend == null && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 500,
                color: tokens.color.textMuted,
                fontFamily: tokens.font.body,
              }}
            >
              {sub}
            </div>
          )}
        </div>
        {trend != null && <Sparkline up={up} />}
      </div>
    </div>
  );
};
