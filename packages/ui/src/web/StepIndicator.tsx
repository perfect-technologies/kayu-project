"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { I, type IconName } from "./Icon.js";

export type StepIndicatorStep = {
  /** Step key / identifier */
  key: string;
  /** Step number (1-based) */
  n: number;
  /** Optional short label shown under the circle (web only) */
  label?: string;
  /** Icon name used when the step is current or future (done steps always show a check) */
  icon?: IconName;
};

export type StepIndicatorProps = {
  steps: StepIndicatorStep[];
  /** Current step number (1-based, matches step.n) */
  step: number;
  /** Compact layout — circles only, smaller sizes */
  compact?: boolean;
  /** Override: hide labels even on the default (non-compact) layout */
  hideLabels?: boolean;
  style?: React.CSSProperties;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  step,
  compact = false,
  hideLabels = false,
  style,
}) => {
  const circle = compact ? 30 : 36;
  const icon = compact ? 14 : 16;
  const showLabels = !compact && !hideLabels;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 4 : 8,
        padding: compact ? 0 : "0 8px",
        ...style,
      }}
    >
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const IconC = s.icon ? I[s.icon] : I.check;
        const circleBg = done
          ? tokens.color.success
          : active
            ? tokens.color.primary
            : tokens.color.surface;
        const circleBorder = done
          ? tokens.color.success
          : active
            ? tokens.color.primary
            : tokens.color.border;
        const circleFg =
          done || active ? tokens.color.textInverse : tokens.color.textMuted;

        return (
          <React.Fragment key={s.key}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: circle,
                  height: circle,
                  borderRadius: "50%",
                  background: circleBg,
                  color: circleFg,
                  border: `2px solid ${circleBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
                  boxShadow: active ? "0 0 0 4px rgba(14,165,233,0.15)" : "none",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <I.check size={icon} stroke={2.5} />
                ) : (
                  <IconC size={icon} />
                )}
              </div>
              {showLabels && s.label && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: active
                      ? tokens.color.textPrimary
                      : tokens.color.textMuted,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    fontFamily: tokens.font.body,
                  }}
                >
                  {s.label}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: compact ? 10 : 24,
                  background: done ? tokens.color.success : tokens.color.border,
                  marginBottom: showLabels ? 18 : 0,
                  transition: "background 200ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
