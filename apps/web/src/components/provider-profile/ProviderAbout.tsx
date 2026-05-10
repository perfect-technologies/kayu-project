"use client";

import { Briefcase, Calendar } from "lucide-react";
import { ProviderSection } from "./ProviderSection";

interface ProviderAboutProps {
  provider: {
    description?: string | null;
    experience?: number | null;
    profession: string;
    subcategories?: Array<{
      id: string;
      name: string;
      isPrimary?: boolean;
    }>;
  };
}

export function ProviderAbout({ provider }: ProviderAboutProps) {
  const subcategories = provider.subcategories?.slice(0, 6) ?? [];

  return (
    <ProviderSection title="À propos">
      {provider.description ? (
        <p
          className="k-body-l"
          style={{
            color: "var(--k-text-body)",
            margin: "0 0 18px",
            whiteSpace: "pre-line",
            lineHeight: 1.55,
          }}
        >
          {provider.description}
        </p>
      ) : (
        <p
          className="k-body"
          style={{
            margin: "0 0 18px",
            color: "var(--k-text-muted)",
            fontStyle: "italic",
          }}
        >
          Aucune description disponible
        </p>
      )}

      <div
        className="k-overline"
        style={{ marginTop: 6, marginBottom: 10, color: "var(--k-text-muted)" }}
      >
        Activité
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span className="k-chip k-chip-sm">
          <Briefcase className="h-3 w-3" />
          {provider.profession}
        </span>
        {provider.experience ? (
          <span className="k-chip k-chip-sm">
            <Calendar className="h-3 w-3" />
            {provider.experience} ans d&apos;expérience
          </span>
        ) : null}
        {subcategories.map((subcategory) => (
          <span
            key={subcategory.id}
            className={
              subcategory.isPrimary
                ? "k-chip k-chip-sm k-chip-primary"
                : "k-chip k-chip-sm"
            }
          >
            {subcategory.name}
            {subcategory.isPrimary ? " · principale" : ""}
          </span>
        ))}
      </div>
    </ProviderSection>
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
