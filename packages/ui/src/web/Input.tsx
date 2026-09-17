"use client";

import * as React from "react";
import { fonts, palette, radii } from "../tokens.js";
import { I } from "./Icon.js";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Every field has a label; `hideLabel` keeps it for screen readers only (e.g. a search bar). */
  label: string;
  hideLabel?: boolean;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
};

const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    helperText,
    error,
    leadingIcon,
    trailingIcon,
    containerClassName,
    id,
    style,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const helperId = `${inputId}-help`;
  const hasError = Boolean(error);
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={containerClassName} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        htmlFor={inputId}
        style={
          hideLabel
            ? visuallyHidden
            : { fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: palette.foreground }
        }
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "0 16px",
          borderRadius: radii.field,
          background: palette.card,
          border: `1px solid ${hasError ? palette.destructive : focused ? palette.primary : palette.border}`,
          boxShadow: focused
            ? `0 0 0 3px ${hasError ? "rgba(196,30,30,.12)" : "rgba(10,61,54,.12)"}`
            : undefined,
          transition: "border-color 180ms, box-shadow 180ms",
        }}
      >
        {leadingIcon ? (
          <span aria-hidden style={{ display: "inline-flex", color: palette.mutedForeground }}>
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? helperId : undefined}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 46,
            background: "transparent",
            border: "none",
            outline: "none",
            color: palette.foreground,
            fontFamily: `var(--font-body, ${fonts.body})`,
            fontSize: 14,
            ...style,
          }}
        />
        {trailingIcon ? (
          <span style={{ display: "inline-flex", color: palette.mutedForeground }}>{trailingIcon}</span>
        ) : null}
      </div>
      {helperText || error ? (
        <div
          id={helperId}
          role={hasError ? "alert" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            lineHeight: 1.35,
            color: hasError ? palette.destructive : palette.mutedForeground,
          }}
        >
          {hasError ? <I.alertCircle size={14} stroke={2} aria-hidden /> : null}
          {error ?? helperText}
        </div>
      ) : null}
    </div>
  );
});
