import type { CSSProperties } from "react";

export type HeroStatusVariant = "live" | "confirmed" | "pending" | "neutral" | "welcome";

const STYLES: Record<HeroStatusVariant, { bg: string; fg: string; dot: string | null; pulse: boolean }> = {
  live:      { bg: "var(--k-success-subtle)", fg: "#047857", dot: "var(--k-success)", pulse: true  },
  confirmed: { bg: "var(--k-success-subtle)", fg: "#047857", dot: "var(--k-success)", pulse: true  },
  pending:   { bg: "var(--k-warning-subtle)", fg: "#92400E", dot: "var(--k-warning)", pulse: false },
  neutral:   { bg: "#F1F5F9",                 fg: "var(--k-text-body)", dot: null,    pulse: false },
  welcome:   { bg: "#FDE68A",                 fg: "#92400E",            dot: null,    pulse: false },
};

export function HeroStatusChip({
  variant,
  label,
  compact,
}: {
  variant: HeroStatusVariant;
  label: string;
  compact?: boolean;
}) {
  const s = STYLES[variant];
  const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: compact ? 9.5 : 10.5,
    fontWeight: 600,
    padding: compact ? "2px 6px" : "4px 10px",
    borderRadius: 999,
    background: s.bg,
    color: s.fg,
    letterSpacing: "0.02em",
  };
  const dotSize = compact ? 5 : 6;
  const dotStyle: CSSProperties | null = s.dot
    ? {
        width: dotSize,
        height: dotSize,
        borderRadius: 999,
        background: s.dot,
        animation: s.pulse ? "kPulse 1.5s ease-in-out infinite" : undefined,
      }
    : null;
  return (
    <span style={chipStyle}>
      {dotStyle && <span style={dotStyle} aria-hidden />}
      {label}
    </span>
  );
}
