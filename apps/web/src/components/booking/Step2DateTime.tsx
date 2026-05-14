"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { AvailabilityCalendar, AvailabilityDay } from "./AvailabilityCalendar";
import type { BookingDraft, BookingAction } from "./booking-state";

interface Props {
  providerId: string;
  providerFirstName: string;
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

type Period = "all" | "morning" | "afternoon";

export function Step2DateTime({ providerId, providerFirstName, state, dispatch }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (state.scheduledDate) {
      const [y, m] = state.scheduledDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [period, setPeriod] = useState<Period>("all");

  const fromYmd = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const toYmd = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const query = useQuery({
    queryKey: ["availability", providerId, fromYmd, toYmd],
    queryFn: () => providersApi(apiClient).availability(providerId, { from: fromYmd, to: toYmd }),
  });

  const days = (query.data?.days ?? []) as AvailabilityDay[];
  const workWindow = query.data?.workWindow ?? null;

  useEffect(() => {
    if (state.scheduledDate) return;
    const firstAvailable = days.find((d) => d.status === "available");
    if (firstAvailable) dispatch({ type: "SET_DATE", date: firstAvailable.date });
  }, [days, state.scheduledDate, dispatch]);

  const selectedDay = useMemo(() => days.find((d) => d.date === state.scheduledDate) ?? null, [days, state.scheduledDate]);
  const slotsFiltered = useMemo(() => {
    const slots = selectedDay?.slots ?? [];
    if (period === "morning") return slots.filter((s) => Number(s.split(":")[0]) < 12);
    if (period === "afternoon") return slots.filter((s) => Number(s.split(":")[0]) >= 12);
    return slots;
  }, [selectedDay, period]);

  function jumpToNextAvailable() {
    const next = days.find((d) => d.status === "available" && (!state.scheduledDate || d.date > state.scheduledDate));
    if (next) dispatch({ type: "SET_DATE", date: next.date });
  }

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Quand ?</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <AvailabilityCalendar
          days={days}
          selectedDate={state.scheduledDate}
          onSelectDate={(d) => dispatch({ type: "SET_DATE", date: d })}
          visibleMonth={visibleMonth}
          onChangeMonth={(offset) => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + offset, 1))}
        />

        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }} className="mb-2.5">
            {state.scheduledDate
              ? new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
              : "Choisis un jour"}
          </div>

          {state.scheduledDate && (
            <div className="mb-2.5 flex gap-1.5">
              {(["all", "morning", "afternoon"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${period === p ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: period === p ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: period === p ? "#fff" : "var(--k-text-body)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {p === "all" ? "Tout" : p === "morning" ? "Matin" : "Après-midi"}
                </button>
              ))}
            </div>
          )}

          {!state.scheduledDate && <div className="k-caption">Sélectionne d'abord une date dans le calendrier.</div>}

          {state.scheduledDate && slotsFiltered.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {(selectedDay?.slots ?? []).map((slot) => {
                const visible = slotsFiltered.includes(slot);
                const taken = !visible;
                const active = state.scheduledTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => visible && dispatch({ type: "SET_TIME", time: slot })}
                    disabled={taken}
                    style={{
                      height: 42,
                      borderRadius: "var(--k-r-md)",
                      border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                      background: taken ? "var(--k-surface-muted)" : active ? "var(--k-primary-subtle)" : "var(--k-surface)",
                      color: taken ? "var(--k-text-subtle)" : active ? "var(--k-primary-hover)" : "var(--k-text-primary)",
                      textDecoration: taken ? "line-through" : "none",
                      fontWeight: 600,
                      fontFamily: "var(--k-font-mono)",
                      fontSize: 13,
                      cursor: taken ? "not-allowed" : "pointer",
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}

          {state.scheduledDate && slotsFiltered.length === 0 && (
            <div>
              <div className="k-caption mb-2">Aucun créneau libre ce jour.</div>
              <button
                onClick={jumpToNextAvailable}
                style={{ background: "none", border: 0, color: "var(--k-primary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Voir le prochain disponible →
              </button>
            </div>
          )}

          {workWindow && (
            <div className="k-caption mt-2.5">
              {providerFirstName} travaille de {workWindow.start} à {workWindow.end}, créneaux d'1 h.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
