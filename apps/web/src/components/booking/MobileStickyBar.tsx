"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Props {
  canGoBack: boolean;
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  variant?: "continue" | "confirm";
}

export function MobileStickyBar({
  canGoBack,
  onBack,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  variant = "continue",
}: Props) {
  return (
    <div
      className="flex gap-2 md:hidden"
      style={{
        position: "sticky",
        bottom: 0,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 12px)",
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        background:
          "linear-gradient(to top, var(--k-bg) 70%, color-mix(in srgb, var(--k-bg) 0%, transparent) 100%)",
      }}
    >
      {canGoBack && (
        <button
          onClick={onBack}
          className="k-btn"
          style={{
            flex: "0 0 88px",
            height: 48,
            borderRadius: 12,
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontWeight: 600,
            color: "var(--k-text-body)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="k-btn k-btn-primary"
        style={{
          flex: 1,
          height: 48,
          borderRadius: 12,
          fontWeight: 700,
          opacity: primaryDisabled ? 0.5 : 1,
        }}
      >
        {primaryLabel}
        {variant === "continue" ? <ArrowRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </button>
    </div>
  );
}
