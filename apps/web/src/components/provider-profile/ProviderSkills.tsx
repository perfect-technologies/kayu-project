"use client";

import { ProviderSection } from "./ProviderSection";

interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

interface ProviderSkillsProps {
  skills: Skill[];
}

const LEVEL_LABELS = ["Débutant", "Basique", "Intermédiaire", "Avancé", "Expert"];

export function ProviderSkills({ skills }: ProviderSkillsProps) {
  if (skills.length === 0) {
    return null;
  }

  return (
    <ProviderSection
      title="Compétences"
      subtitle="Niveaux déclarés par le prestataire"
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {skills.map((skill) => {
          const levelIdx = Math.max(0, Math.min(skill.level - 1, LEVEL_LABELS.length - 1));
          const isExpert = skill.level >= 5;
          const isAdvanced = skill.level === 4;
          const chipClass = isExpert
            ? "k-chip k-chip-sm k-chip-success"
            : isAdvanced
              ? "k-chip k-chip-sm k-chip-primary"
              : "k-chip k-chip-sm";
          return (
            <span key={skill.id} className={chipClass}>
              {skill.name}
              <span
                style={{
                  color: "var(--k-text-muted)",
                  fontSize: 11,
                  fontWeight: 500,
                  marginLeft: 4,
                }}
              >
                · {LEVEL_LABELS[levelIdx]}
              </span>
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
