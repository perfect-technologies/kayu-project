"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type Slot = "BEFORE" | "DURING" | "AFTER";
type SlotState = { file: File; preview: string } | null;

const WHAT = ["Réparation", "Installation", "Pose", "Rénovation", "Entretien", "Dépannage"];
const WHERE = ["Cuisine", "Salle de bain", "Salon", "Chambre", "Extérieur", "Toiture", "Bureau"];
const RESULT = [
  "Travail garanti",
  "Intervention propre",
  "Terminé dans les délais",
  "Client satisfait",
];
const DURATION = ["½ journée", "1 jour", "2–3 jours", "+ d'une semaine"];

export function AddChantierClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Record<Slot, SlotState>>({
    BEFORE: null,
    DURING: null,
    AFTER: null,
  });
  const refs = {
    BEFORE: useRef<HTMLInputElement>(null),
    DURING: useRef<HTMLInputElement>(null),
    AFTER: useRef<HTMLInputElement>(null),
  };
  const [what, setWhat] = useState<string>("");
  const [where, setWhere] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const description = [
    [what, where].filter(Boolean).join(" · "),
    result,
  ]
    .filter(Boolean)
    .join(". ");

  const canSave = Boolean(slots.BEFORE) && what && where;

  const saveMut = useMutation({
    mutationFn: async () => {
      const order: Slot[] = ["BEFORE", "DURING", "AFTER"];
      const images: Array<{
        imageType: Slot;
        path: string;
        displayOrder: number;
      }> = [];
      for (let i = 0; i < order.length; i++) {
        const s = slots[order[i]];
        if (!s) continue;
        const { path } = await uploadFile("portfolio", s.file);
        images.push({ imageType: order[i], path, displayOrder: i });
      }
      return providersApi(apiClient).createPortfolio({
        title: [what, where].filter(Boolean).join(" — ") || "Chantier",
        description: description || undefined,
        images,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast.success("Chantier ajouté.");
      router.push("/pro/profile/portfolio");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Échec de l'ajout"),
  });

  const slotMeta: Record<Slot, { label: string; req: string }> = {
    BEFORE: { label: "Avant", req: "obligatoire" },
    DURING: { label: "Pendant", req: "optionnel" },
    AFTER: { label: "Après", req: "recommandé" },
  };

  const chip = (active: boolean): string =>
    active ? "k-chip k-chip-primary" : "k-chip";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro/profile/portfolio")}
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
          margin: "0 0 16px",
          color: "var(--k-text-primary)",
        }}
      >
        Nouveau chantier
      </h1>

      <div className="k-card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: "var(--k-text-primary)" }}>
          Photos du chantier
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {(["BEFORE", "DURING", "AFTER"] as Slot[]).map((slot) => {
            const s = slots[slot];
            return (
              <div key={slot} style={{ flex: 1 }}>
                <input
                  ref={refs[slot]}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setSlots((prev) => ({
                      ...prev,
                      [slot]: { file: f, preview: URL.createObjectURL(f) },
                    }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => refs[slot].current?.click()}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 10,
                    border: s
                      ? "1.5px solid var(--k-primary)"
                      : "1.5px dashed var(--k-border-strong)",
                    background: s ? "transparent" : "var(--k-surface-muted)",
                    color: "var(--k-text-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  {s ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.preview}
                      alt={slotMeta[slot].label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <>
                      <I.camera size={16} />
                      {slotMeta[slot].label}
                      <span style={{ fontWeight: 400, fontSize: 9.5 }}>
                        {slotMeta[slot].req}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div
          style={{
            background: "var(--k-warning-subtle)",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 11.5,
            color: "#92400E",
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          Photo nette, en pleine lumière, cadre tout le travail. Évite le flou.
        </div>

        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: "var(--k-text-primary)" }}>
          Décris en tapant
        </div>
        {[
          { label: "Quoi ?", opts: WHAT, val: what, set: setWhat },
          { label: "Où ?", opts: WHERE, val: where, set: setWhere },
          { label: "Résultat ?", opts: RESULT, val: result, set: setResult },
        ].map((row) => (
          <div key={row.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginBottom: 5 }}>
              {row.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {row.opts.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => row.set(row.val === o ? "" : o)}
                  className={chip(row.val === o)}
                  style={{ cursor: "pointer" }}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: "var(--k-surface-muted)",
            borderRadius: "var(--k-r-md)",
            fontSize: 12.5,
            color: "var(--k-text-body)",
            minHeight: 38,
          }}
        >
          {description || "La description s'assemble ici…"}
        </div>

        <div style={{ fontWeight: 700, fontSize: 13.5, margin: "16px 0 8px", color: "var(--k-text-primary)" }}>
          Durée <span style={{ fontWeight: 400, color: "var(--k-text-subtle)" }}>· optionnel</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DURATION.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(duration === d ? "" : d)}
              className={chip(duration === d)}
              style={{ cursor: "pointer" }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro/profile/portfolio")}
        >
          Annuler
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={!canSave || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Ajout…" : "Ajouter ce chantier"}
        </button>
      </div>
    </div>
  );
}
