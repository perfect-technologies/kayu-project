"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { I } from "./Icon.js";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helperText,
      error,
      leadingIcon,
      trailingIcon,
      containerClassName,
      id,
      style,
      ...rest
    },
    ref,
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const helperId = `${inputId}-help`;
    const hasError = Boolean(error);
    const [focused, setFocused] = React.useState(false);

    const borderColor = hasError
      ? tokens.color.danger
      : focused
        ? tokens.color.primary
        : tokens.color.border;

    return (
      <div
        className={containerClassName}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {label ? (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: tokens.font.body,
              fontSize: 13,
              fontWeight: 500,
              color: tokens.color.textBody,
            }}
          >
            {label}
          </label>
        ) : null}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 44,
            borderRadius: tokens.radius.md,
            background: tokens.color.surface,
            border: `1px solid ${borderColor}`,
            boxShadow: focused && !hasError ? "0 0 0 3px rgba(14,165,233,0.12)" : undefined,
            transition: `border-color ${tokens.duration.fast}ms, box-shadow ${tokens.duration.fast}ms`,
            padding: "0 14px",
            gap: 8,
          }}
        >
          {leadingIcon ? (
            <span style={{ color: tokens.color.textMuted, display: "inline-flex" }}>
              {leadingIcon}
            </span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={hasError || undefined}
            aria-describedby={helperText || error ? helperId : undefined}
            {...rest}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: tokens.color.textPrimary,
              fontFamily: tokens.font.body,
              fontSize: 15,
              lineHeight: 1.4,
              ...style,
            }}
          />
          {trailingIcon ? (
            <span style={{ color: tokens.color.textMuted, display: "inline-flex" }}>
              {trailingIcon}
            </span>
          ) : null}
        </div>
        {helperText || error ? (
          <div
            id={helperId}
            style={{
              minHeight: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: hasError ? tokens.color.danger : tokens.color.textMuted,
            }}
          >
            {hasError ? <I.alertCircle size={14} stroke={2} /> : null}
            {error ?? helperText}
          </div>
        ) : (
          <div style={{ minHeight: 20 }} />
        )}
      </div>
    );
  },
);
