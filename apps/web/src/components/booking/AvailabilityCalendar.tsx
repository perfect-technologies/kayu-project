"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type DayStatus = "available" | "off" | "full" | "past";
export interface AvailabilityDay { date: string; status: DayStatus; slots: string[]; }

interface Props {
  days: AvailabilityDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  visibleMonth: Date;
  onChangeMonth: (offset: -1 | 1) => void;
}

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function AvailabilityCalendar({ days, selectedDate, onSelectDate, visibleMonth, onChangeMonth }: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((firstWeekday + lastDay) / 7) * 7;

  const monthLabel = visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 14,
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <button
          aria-label="Mois précédent"
          onClick={() => onChangeMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div style={{ fontWeight: 700, fontSize: 14.5, textTransform: "capitalize" }}>{monthLabel}</div>
        <button
          aria-label="Mois suivant"
          onClick={() => onChangeMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-0.5">
        {WEEKDAY_LETTERS.map((d, i) => (
          <div key={i} className="k-caption text-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: cells }, (_, i) => {
          const dayNum = i - firstWeekday + 1;
          const valid = dayNum >= 1 && dayNum <= lastDay;
          if (!valid) return <div key={i} />;

          const dateObj = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), dayNum);
          const yyyyMmDd = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const day = byDate.get(yyyyMmDd);
          const status = day?.status ?? "off";
          const isSelected = selectedDate === yyyyMmDd;
          const tappable = status === "available" || status === "full";

          return (
            <button
              key={i}
              onClick={() => tappable && onSelectDate(yyyyMmDd)}
              disabled={!tappable}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 8,
                background: isSelected ? "var(--k-primary)" : "transparent",
                color: isSelected ? "#fff" : status === "off" || status === "past" ? "var(--k-text-subtle)" : "var(--k-text-primary)",
                border: 0,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                position: "relative",
                cursor: tappable ? "pointer" : "default",
              }}
            >
              {dayNum}
              {!isSelected && status === "available" && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--k-success)",
                  }}
                />
              )}
              {!isSelected && status === "full" && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 1,
                    background: "var(--k-text-subtle)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex gap-3.5 text-[11px]" style={{ color: "var(--k-text-muted)" }}>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--k-success)" }} />Disponible</span>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 8, height: 1, background: "var(--k-text-subtle)" }} />Complet</span>
      </div>
    </div>
  );
}
