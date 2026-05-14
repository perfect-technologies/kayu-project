"use client";

import { ArrowLeft, Star, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProviderMini {
  firstName: string;
  lastName: string;
  profession: string;
  avatarUrl: string | null;
  rating: number;
}

interface SummaryLine {
  label: string;
  value: string | null;
}

interface Props {
  provider: ProviderMini;
  summary: SummaryLine[];
  startingPriceFC: number;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
  variant?: "summary" | "confirm";
}

export function SidebarRail({
  provider,
  summary,
  startingPriceFC,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onBack,
  variant = "summary",
}: Props) {
  const fullName = `${provider.firstName} ${provider.lastName}`.trim();
  const initials = `${(provider.firstName[0] ?? "?").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 20,
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={provider.avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback
            style={{ background: "#F5F2E9", color: "#7a5e2b", fontWeight: 700, fontSize: 14 }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{fullName}</div>
          <div className="k-caption">{provider.profession}</div>
        </div>
        <div className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>
          <Star className="h-3.5 w-3.5" style={{ color: "var(--k-warning)" }} />
          {provider.rating ? provider.rating.toFixed(1) : "—"}
        </div>
      </div>

      {variant === "summary" && (
        <div className="mt-4">
          {summary.map((row, i) => (
            <div
              key={row.label}
              className="flex justify-between gap-2 py-2.5 text-[13px]"
              style={{
                borderTop: i === 0 ? "1px solid var(--k-border-subtle)" : 0,
                borderBottom: "1px dashed var(--k-border-subtle)",
              }}
            >
              <span className="k-caption" style={{ flexShrink: 0 }}>{row.label}</span>
              <span
                className="text-right"
                style={{
                  fontWeight: row.value ? 600 : 500,
                  color: row.value ? "var(--k-text-primary)" : "var(--k-text-muted)",
                }}
              >
                {row.value ?? "À choisir"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="k-overline">À partir de</div>
        <div className="k-price" style={{ fontSize: 22, marginTop: 4, color: "var(--k-primary-hover)" }}>
          {startingPriceFC.toLocaleString("fr-FR")} FC
        </div>
      </div>

      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="k-btn k-btn-primary"
        style={{ width: "100%", height: 48, borderRadius: 12, fontWeight: 700, marginTop: 14, opacity: primaryDisabled ? 0.5 : 1 }}
      >
        {primaryLabel}
      </button>
      {onBack && (
        <button
          onClick={onBack}
          className="k-btn"
          style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            fontWeight: 600,
            color: "var(--k-text-body)",
            marginTop: 8,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <div className="k-caption mt-2.5 inline-flex items-start gap-1.5">
        <ShieldCheck className="h-3 w-3 mt-0.5" style={{ color: "var(--k-success)", flexShrink: 0 }} />
        <span>Paiement en espèces à la fin. Le prix final est convenu avec le pro.</span>
      </div>
    </div>
  );
}
