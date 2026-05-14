"use client";

import { useEffect, useRef, useState } from "react";
import { ProviderSection } from "./ProviderSection";

interface ProviderAboutProps {
  provider: {
    description?: string | null;
    experience?: number | null;
    serviceZones: Array<{ id: string; city: string; commune?: string | null }>;
  };
}

export function ProviderAbout({ provider }: ProviderAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClipped, setIsClipped] = useState(false);
  const pRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = pRef.current;
    if (!el) return;
    setIsClipped(el.scrollHeight > el.clientHeight + 1);
  }, [provider.description]);

  if (!provider.description || provider.description.trim().length === 0) {
    return null;
  }

  const zoneSummary = (() => {
    if (provider.serviceZones.length === 0) return null;
    const names = provider.serviceZones.map((z) => z.commune ?? z.city).filter(Boolean);
    if (names.length === 0) return null;
    if (names.length <= 4) return names.join(", ");
    return `${names.slice(0, 4).join(", ")} +${names.length - 4} autres`;
  })();

  const experienceLabel =
    provider.experience && provider.experience > 0 ? `${provider.experience} ans` : null;

  const languagesLabel = "Français, Lingala";

  const hasMeta = experienceLabel || zoneSummary || languagesLabel;

  return (
    <ProviderSection title="À propos">
      <p
        ref={pRef}
        style={{
          fontSize: 14,
          color: "var(--k-text-body)",
          lineHeight: 1.6,
          margin: 0,
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 5,
          WebkitBoxOrient: "vertical",
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {provider.description}
      </p>
      {isClipped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="k-btn k-btn-ghost"
          style={{ marginTop: 8, padding: "4px 0", fontSize: 13, fontWeight: 600, color: "var(--k-primary)" }}
        >
          {expanded ? "Réduire" : "Lire plus"}
        </button>
      )}

      {hasMeta && (
        <div
          className="grid gap-4 md:grid-cols-3"
          style={{
            borderTop: "1px solid var(--k-border-subtle)",
            paddingTop: 14,
            marginTop: 14,
          }}
        >
          {experienceLabel && <AboutMeta label="Expérience" value={experienceLabel} />}
          {zoneSummary && <AboutMeta label="Zones desservies" value={zoneSummary} />}
          <AboutMeta label="Langues" value={languagesLabel} />
        </div>
      )}
    </ProviderSection>
  );
}

function AboutMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--k-text-primary)", fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

export function ProviderAboutSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 200, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
