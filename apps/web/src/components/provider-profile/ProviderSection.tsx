"use client";

import type { CSSProperties, ReactNode } from "react";

interface ProviderSectionProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function ProviderSection({
  title,
  subtitle,
  trailing,
  className,
  style,
  children,
}: ProviderSectionProps) {
  return (
    <section
      className={className}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        boxShadow: "var(--k-e1)",
        padding: "clamp(20px, 4vw, 28px)",
        ...style,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            className="k-display-m"
            style={{
              margin: 0,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: "var(--k-text-primary)",
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <div
              className="k-caption"
              style={{ marginTop: 4, color: "var(--k-text-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {trailing ? <div style={{ flexShrink: 0 }}>{trailing}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function ProviderSectionSkeleton({
  height = 160,
}: {
  height?: number;
}) {
  return (
    <div
      className="animate-k-shimmer"
      style={{
        borderRadius: "var(--k-r-lg)",
        height,
      }}
    />
  );
}
