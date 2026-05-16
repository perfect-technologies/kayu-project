"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { dashboardApi, providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

type Tone = "direct" | "chaleureux" | "expert";

const TONES: { key: Tone; label: string }[] = [
  { key: "direct", label: "Direct & rassurant" },
  { key: "chaleureux", label: "Chaleureux" },
  { key: "expert", label: "Expert" },
];

function buildBio(
  tone: Tone,
  title: string,
  city: string,
  years: string,
  skills: string,
): string {
  const s = skills || "mon métier";
  if (tone === "chaleureux") {
    return `Bonjour, je suis ${title} basé à ${city}. ${years} à votre service. Spécialisé en ${s}. À l'écoute et soigneux, je m'engage sur chaque chantier.`;
  }
  if (tone === "expert") {
    return `${title}, ${years} d'expérience à ${city}. Expertise : ${s}. Travail rigoureux, conforme aux règles de l'art et garanti.`;
  }
  return `${title} à ${city} avec ${years} d'expérience. Spécialisé en ${s}. Je réponds vite, je travaille propre et je garantis mes interventions.`;
}

function yearsLabel(experience: number | null | undefined): string {
  if (experience == null) return "plusieurs années";
  if (experience <= 0) return "moins d'un an";
  if (experience <= 3) return "1 à 3 ans";
  if (experience <= 7) return "4 à 7 ans";
  return "plus de 8 ans";
}

export function PresentationEditorClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
  });

  const provider = data?.provider;
  const title = provider?.profession || "Prestataire";
  const city = data?.availability.zoneCity || "Kinshasa";
  const years = yearsLabel(
    (provider as { experience?: number | null } | undefined)?.experience,
  );
  const skills = (
    (provider as { categories?: string[] } | undefined)?.categories ?? []
  ).join(", ");

  const [tone, setTone] = useState<Tone>("direct");
  const suggested = useMemo(
    () => buildBio(tone, title, city, years, skills),
    [tone, title, city, years, skills],
  );
  const [text, setText] = useState<string | null>(null);
  const value = text ?? suggested;

  const saveMut = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({ description: value.slice(0, 1000) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      toast.success("Présentation enregistrée.");
      router.push("/pro");
    },
    onError: () => toast.error("Échec de l'enregistrement"),
  });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 4px",
          color: "var(--k-text-primary)",
        }}
      >
        Ta présentation
      </h1>
      <p style={{ fontSize: 13, color: "var(--k-text-muted)", margin: "0 0 16px" }}>
        Choisis un ton, on le remplit avec tes infos. Ajuste librement.
      </p>

      <div className="k-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {TONES.map((t) => {
            const sel = tone === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTone(t.key);
                  setText(null);
                }}
                className={sel ? "k-chip k-chip-primary" : "k-chip"}
                style={{ cursor: "pointer" }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={value}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          style={{
            width: "100%",
            minHeight: 130,
            padding: 14,
            borderRadius: "var(--k-r-md)",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontFamily: "inherit",
            fontSize: 14.5,
            lineHeight: 1.5,
            outline: "none",
            resize: "vertical",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: "var(--k-text-muted)",
            marginTop: 4,
            textAlign: "right",
            fontFamily: "var(--font-mono)",
          }}
        >
          {value.length} / 1000 · tu peux tout modifier
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro")}
        >
          Plus tard
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={saveMut.isPending || value.trim().length < 10}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
