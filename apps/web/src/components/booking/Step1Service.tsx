"use client";

import { Check } from "lucide-react";
import { CUSTOM_TASK_KEY, getTasksForSubcategory } from "@kayu/schemas";
import type { BookingDraft, BookingAction } from "./booking-state";

interface Subcategory { id: string; slug: string; name: string; isPrimary?: boolean; }

interface Props {
  subcategories: Subcategory[];
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

const DURATIONS: Array<{ label: string; minutes: number | null }> = [
  { label: "1 h",          minutes: 60  },
  { label: "2 h",          minutes: 120 },
  { label: "Demi-journée", minutes: 240 },
  { label: "Journée",      minutes: 480 },
  { label: "À discuter",   minutes: null },
];

export function Step1Service({ subcategories, state, dispatch }: Props) {
  const showSubChips = subcategories.length > 1;
  const activeSlug = state.subcategorySlug ?? subcategories.find((s) => s.isPrimary)?.slug ?? subcategories[0]?.slug ?? "";
  const tasks = getTasksForSubcategory(activeSlug);

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Quel service ?</h2>

      {showSubChips && (
        <>
          <div className="k-overline mb-2">Spécialité</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {subcategories.map((s) => {
              const active = s.slug === activeSlug;
              return (
                <button
                  key={s.id}
                  onClick={() => dispatch({ type: "SET_SUBCATEGORY", id: s.id, slug: s.slug })}
                  className="k-btn"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: active ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: active ? "#fff" : "var(--k-text-body)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="k-overline mb-2">Prestation</div>
      <div className="mb-5 grid gap-2 md:grid-cols-2">
        {[...tasks, "__autre__"].map((task, i) => {
          const isCustomRow = task === "__autre__";
          const key = isCustomRow ? CUSTOM_TASK_KEY : task;
          const selected = state.taskKey === key;
          return (
            <label
              key={`${task}-${i}`}
              className="flex cursor-pointer items-center gap-3"
              style={{
                padding: 14,
                background: "var(--k-surface)",
                border: `1px solid ${selected ? "var(--k-primary)" : "var(--k-border)"}`,
                borderRadius: "var(--k-r-md)",
                boxShadow: selected ? "0 0 0 3px rgba(30,74,214,.12)" : "none",
                gridColumn: isCustomRow ? "1 / -1" : undefined,
              }}
            >
              <input
                type="radio"
                name="task"
                checked={selected}
                onChange={() => dispatch({ type: "SET_TASK", key })}
                className="accent-[var(--k-primary)]"
              />
              <span className="flex-1" style={{ fontSize: 14.5, fontWeight: 500, color: isCustomRow ? "var(--k-text-muted)" : undefined }}>
                {isCustomRow ? "Autre (préciser)…" : task}
              </span>
              {selected && <Check className="h-[18px] w-[18px]" style={{ color: "var(--k-primary)" }} />}
            </label>
          );
        })}
      </div>

      {state.taskKey === CUSTOM_TASK_KEY && (
        <input
          autoFocus
          maxLength={60}
          value={state.taskLabelOverride ?? ""}
          onChange={(e) => dispatch({ type: "SET_TASK_OVERRIDE", label: e.target.value })}
          placeholder="Décris la prestation en quelques mots"
          className="k-input mb-5"
        />
      )}

      <div className="k-overline mb-2">Durée estimée</div>
      <div className="mb-5 grid grid-cols-3 gap-2 md:grid-cols-5">
        {DURATIONS.map((d) => {
          const active = state.durationMin === d.minutes && (d.minutes !== null || state.durationMin === null);
          return (
            <button
              key={d.label}
              onClick={() => dispatch({ type: "SET_DURATION", minutes: d.minutes })}
              style={{
                height: 44,
                borderRadius: "var(--k-r-md)",
                border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                background: active ? "var(--k-primary-subtle)" : "var(--k-surface)",
                color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div className="k-overline mb-2">Détails (facultatif)</div>
      <textarea
        rows={3}
        value={state.description}
        onChange={(e) => dispatch({ type: "SET_DESCRIPTION", text: e.target.value })}
        placeholder="Précise le style, la longueur, les particularités…"
        className="k-input"
        style={{ resize: "vertical", minHeight: 80 }}
      />
      <div className="k-caption mt-1.5">Plus c'est précis, plus le pro arrive préparé.</div>
    </div>
  );
}
