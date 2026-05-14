"use client";

import { useEffect, useReducer } from "react";
import type { KinCommune } from "@kayu/schemas";
import { CUSTOM_TASK_KEY } from "@kayu/schemas";

export interface BookingDraft {
  subcategoryId: string | null;
  subcategorySlug: string | null;
  taskKey: string | null;
  taskLabelOverride: string | null;
  durationMin: number | null;
  description: string;

  scheduledDate: string | null;
  scheduledTime: string | null;

  city: "Kinshasa";
  commune: KinCommune | null;
  street: string;
  locationNote: string;

  step: number;
}

export const initialDraft: BookingDraft = {
  subcategoryId: null,
  subcategorySlug: null,
  taskKey: null,
  taskLabelOverride: null,
  durationMin: null,
  description: "",
  scheduledDate: null,
  scheduledTime: null,
  city: "Kinshasa",
  commune: null,
  street: "",
  locationNote: "",
  step: 0,
};

export type BookingAction =
  | { type: "SET_SUBCATEGORY"; id: string; slug: string }
  | { type: "SET_TASK"; key: string }
  | { type: "SET_TASK_OVERRIDE"; label: string }
  | { type: "SET_DURATION"; minutes: number | null }
  | { type: "SET_DESCRIPTION"; text: string }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_TIME"; time: string }
  | { type: "SET_COMMUNE"; commune: KinCommune }
  | { type: "SET_STREET"; street: string }
  | { type: "SET_LOCATION_NOTE"; note: string }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

export function bookingReducer(state: BookingDraft, action: BookingAction): BookingDraft {
  switch (action.type) {
    case "SET_SUBCATEGORY":
      return { ...state, subcategoryId: action.id, subcategorySlug: action.slug, taskKey: null, taskLabelOverride: null };
    case "SET_TASK":
      return { ...state, taskKey: action.key, taskLabelOverride: action.key === CUSTOM_TASK_KEY ? state.taskLabelOverride : null };
    case "SET_TASK_OVERRIDE":
      return { ...state, taskLabelOverride: action.label };
    case "SET_DURATION":
      return { ...state, durationMin: action.minutes };
    case "SET_DESCRIPTION":
      return { ...state, description: action.text };
    case "SET_DATE":
      return { ...state, scheduledDate: action.date, scheduledTime: null };
    case "SET_TIME":
      return { ...state, scheduledTime: action.time };
    case "SET_COMMUNE":
      return { ...state, commune: action.commune };
    case "SET_STREET":
      return { ...state, street: action.street };
    case "SET_LOCATION_NOTE":
      return { ...state, locationNote: action.note };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "RESET":
      return initialDraft;
  }
}

const STORAGE_PREFIX = "kayou:booking-draft:";

export function useBookingDraft(providerId: string) {
  const key = STORAGE_PREFIX + providerId;
  const [state, dispatch] = useReducer(bookingReducer, initialDraft, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return init;
      const parsed = JSON.parse(raw) as BookingDraft;
      return { ...init, ...parsed, city: "Kinshasa" as const };
    } catch { return init; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
  }, [key, state]);

  function clear() {
    if (typeof window !== "undefined") {
      try { window.sessionStorage.removeItem(key); } catch { /* ignore */ }
    }
    dispatch({ type: "RESET" });
  }

  return { state, dispatch, clear };
}
