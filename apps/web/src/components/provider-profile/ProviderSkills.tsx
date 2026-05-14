"use client";

import { ProviderSection } from "./ProviderSection";

interface ProviderSkillsProps {
  skills: Array<{ id: string; name: string; level: number }>;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "débutant",
  2: "intermédiaire",
  3: "avancé",
  4: "expert",
  5: "maître",
};

export function ProviderSkills({ skills }: ProviderSkillsProps) {
  if (skills.length === 0) return null;

  return (
    <ProviderSection title="Compétences">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {skills.map((skill) => {
          const levelLabel = LEVEL_LABELS[skill.level] ?? null;
          return (
            <span
              key={skill.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                padding: "5px 10px",
                borderRadius: 999,
                background: "#F1F5F9",
                color: "var(--k-text-body)",
              }}
            >
              {skill.name}
              {levelLabel && (
                <span style={{ fontFamily: "var(--k-font-mono)", color: "var(--k-text-muted)", fontSize: 10 }}>
                  {levelLabel}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </ProviderSection>
  );
}

export function ProviderSkillsSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 140, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
