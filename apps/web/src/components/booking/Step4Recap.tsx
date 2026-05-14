"use client";

import { Calendar, MapPin, Briefcase, ShieldCheck } from "lucide-react";
import { CUSTOM_TASK_KEY } from "@kayu/schemas";
import { RecapCard } from "./RecapCard";
import type { BookingDraft } from "./booking-state";

interface Props {
  state: BookingDraft;
  subcategoryName: string;
  startingPriceFC: number;
  providerFirstName: string;
  goToStep: (step: 0 | 1 | 2) => void;
}

const DURATION_LABELS: Record<number, string> = {
  60: "1 h",
  120: "2 h",
  240: "Demi-journée",
  480: "Journée",
};

export function Step4Recap({ state, subcategoryName, startingPriceFC, providerFirstName, goToStep }: Props) {
  const taskLabel = state.taskKey === CUSTOM_TASK_KEY ? (state.taskLabelOverride ?? "—") : (state.taskKey ?? "—");
  const durationLabel = state.durationMin == null ? "À discuter" : (DURATION_LABELS[state.durationMin] ?? `${state.durationMin} min`);

  const dateLabel = state.scheduledDate
    ? new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Tout est bon ?</h2>

      <RecapCard title="Service" icon={Briefcase} onEdit={() => goToStep(0)}>
        <div><strong>{taskLabel}</strong> · {subcategoryName} · durée {durationLabel}</div>
        {state.description && <div className="mt-1 italic" style={{ color: "var(--k-text-muted)" }}>"{state.description}"</div>}
      </RecapCard>

      <RecapCard title="Date & heure" icon={Calendar} onEdit={() => goToStep(1)}>
        <div><strong>{dateLabel}</strong>{state.scheduledTime ? ` · ${state.scheduledTime}` : ""}</div>
      </RecapCard>

      <RecapCard title="Adresse" icon={MapPin} onEdit={() => goToStep(2)}>
        <div><strong>{state.street || "(Adresse à préciser sur place)"}</strong> · {state.commune ?? "Commune à choisir"}, Kinshasa</div>
        {state.locationNote && <div className="mt-1 italic" style={{ color: "var(--k-text-muted)" }}>"{state.locationNote}"</div>}
      </RecapCard>

      <div
        className="md:hidden"
        style={{
          padding: 14,
          background: "var(--k-surface-primary)",
          border: "1px solid #BAE6FD",
          borderRadius: "var(--k-r-lg)",
          marginBottom: 12,
        }}
      >
        <div className="flex justify-between text-[14px]">
          <span style={{ color: "var(--k-text-body)" }}>Prix de départ</span>
          <span className="k-price">{startingPriceFC.toLocaleString("fr-FR")} FC</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[14px]">
          <span style={{ color: "var(--k-text-muted)" }}>Paiement</span>
          <span style={{ color: "var(--k-text-body)" }}>Espèces à la fin</span>
        </div>
        <div style={{ height: 1, background: "#BAE6FD", margin: "12px 0" }} />
        <div className="flex items-baseline justify-between">
          <span className="k-heading" style={{ margin: 0 }}>Prix indicatif</span>
          <span className="k-price" style={{ fontSize: 22, color: "var(--k-primary-hover)" }}>
            ≥ {startingPriceFC.toLocaleString("fr-FR")} FC
          </span>
        </div>
        <div className="k-caption mt-2 inline-flex items-start gap-1.5">
          <ShieldCheck className="h-3 w-3 mt-0.5" style={{ color: "var(--k-success)", flexShrink: 0 }} />
          <span>Le prix final est convenu avec {providerFirstName} avant l'intervention. Aucun paiement en ligne.</span>
        </div>
      </div>

      <div className="k-caption mt-2 text-center md:text-left">
        En confirmant, tu acceptes les{" "}
        <a style={{ color: "var(--k-primary-hover)" }}>conditions générales</a> de Kayou.
      </div>
    </div>
  );
}
