// Client-side helpers for DS03 — maps backend bookings to v2 visual model.
// Not a backend concern: pure derivation from the Booking record.

import { tokens } from "@kayu/ui";

export type V2Status = "upcoming" | "active" | "completed" | "cancelled";

export type BackendBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const toV2Status = (status: string | undefined | null): V2Status => {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "upcoming";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "upcoming";
  }
};

export type CategorySlug = keyof typeof tokens.portfolio;

// Light keyword matcher for work-tile accents now that bookings no longer
// carry catalog category IDs.
export const categoryFromTitle = (
  title: string | null | undefined,
  fallback: CategorySlug = "plomberie",
): CategorySlug => {
  const t = (title ?? "").toLowerCase();
  if (/plomb|fuite|tuyau|evier|wc|toilette|robinet/.test(t)) return "plomberie";
  if (/elec|électri|prise|disjonc|câbl|cabl|lampe/.test(t)) return "electricite";
  if (/peint|mur/.test(t)) return "peinture";
  if (/coiff|tresse|barbe|cheveu/.test(t)) return "coiffure";
  if (/inform|ordi|laptop|pc|écran|ecran|wifi/.test(t)) return "informatique";
  if (/ménag|menage|nettoy|propre/.test(t)) return "menage";
  if (/jardin|gazon|arbre|plante/.test(t)) return "jardinage";
  if (/transport|déménag|demenag|livr/.test(t)) return "transport";
  if (/menuis|bois|meuble/.test(t)) return "menuiserie";
  return fallback;
};

// Derive a price label that matches v2 prototype tone. Does not invent payment
// rails the backend doesn't know about — uses the booking's paymentMethod when
// present, generic fallbacks otherwise.
export const priceLabelFor = (booking: {
  status?: string | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  cancelledBy?: string | null;
}): string => {
  const s = booking.status;
  if (s === "COMPLETED") {
    if (booking.isPaid && booking.paymentMethod) {
      return `Payé ${paymentMethodLabel(booking.paymentMethod)}`;
    }
    return booking.isPaid ? "Payé" : "Paiement à confirmer";
  }
  if (s === "CANCELLED") return "Annulée";
  if (s === "CONFIRMED" || s === "IN_PROGRESS") return "Prix convenu";
  return "Estimation";
};

export const paymentMethodLabel = (
  paymentMethod: string | null | undefined,
): string => {
  switch (paymentMethod?.toLowerCase()) {
    case "cash":
      return "en espèces";
    default:
      return "en espèces";
  }
};

export const paymentStatusLabel = (booking: {
  isPaid?: boolean | null;
  paymentMethod?: string | null;
}): string => {
  if (booking.isPaid) {
    return `Confirmé ${paymentMethodLabel(booking.paymentMethod)}`;
  }

  return "Paiement en espèces à confirmer";
};

// "Demain · 09:00" / "Aujourd'hui · 14:30" / "Sam. 12 avril · 10:00"
const WEEKDAY_SHORT = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const MONTH_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export const formatWhen = (scheduled: Date | string | null | undefined): string => {
  if (!scheduled) return "Date à confirmer";
  const d = typeof scheduled === "string" ? new Date(scheduled) : scheduled;
  if (Number.isNaN(d.getTime())) return "Date à confirmer";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tmr = new Date(now);
  tmr.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tmr.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const time = `${hh}:${mm}`;
  if (sameDay) return `Aujourd'hui · ${time}`;
  if (isTomorrow) return `Demain · ${time}`;
  const dayName = WEEKDAY_SHORT[d.getDay()];
  const dayN = d.getDate();
  const monthName = MONTH_FR[d.getMonth()];
  return `${dayName} ${dayN} ${monthName} · ${time}`;
};

export const formatRelativeFR = (input: Date | string | null | undefined): string => {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `Il y a ${weeks} sem.`;
  const months = Math.round(days / 30);
  return `Il y a ${months} mois`;
};

export const fullAddress = (booking: {
  address?: string | null;
  city?: string | null;
}): string => {
  const a = (booking.address ?? "").trim();
  const c = (booking.city ?? "").trim();
  if (a && c && !a.includes(c)) return `${a}, ${c}`;
  return a || c || "Adresse à confirmer";
};

export const initialsFromName = (first?: string | null, last?: string | null): string => {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || "?";
};
