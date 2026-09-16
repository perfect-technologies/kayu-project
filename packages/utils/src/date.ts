import { toLocalSlot } from "./schedule.js";

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

/**
 * Format an ISO date string to a French date: "11 Avr 2026".
 */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format an ISO date string to French date with time: "11 Avr 2026 à 14:30".
 */
export function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()} à ${hours}:${minutes}`;
}

/**
 * Format an ISO date string to a French relative time string.
 * "Il y a 5 min", "Il y a 2 h", "Il y a 3 j", "11 Avr 2026"
 */
export function formatRelativeTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHour < 24) return `Il y a ${diffHour} h`;
  if (diffDay < 7) return `Il y a ${diffDay} j`;

  return formatDate(isoDate);
}

const DAY_MONTH_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const DAY_MONTH_YEAR_FR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Lower-case French relative time for feeds and threads.
 * "à l'instant", "il y a 3 min", "il y a 2 h", "il y a 4 j", then "12 sept." ("12 sept. 2025"
 * when the year differs from `now`).
 */
export function formatRelativeFr(date: Date | string, now: Date = new Date()): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `il y a ${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `il y a ${diffDay} j`;

  return d.getFullYear() === now.getFullYear()
    ? DAY_MONTH_FR.format(d)
    : DAY_MONTH_YEAR_FR.format(d);
}

/**
 * A booking instant as the provider sees it.
 * formatSlotLocal("2026-09-16T08:00:00Z", "Africa/Kinshasa")
 *   → { date: "2026-09-16", time: "09:00", label: "mer. 16 sept. · 09:00" }
 */
export function formatSlotLocal(
  iso: Date | string,
  timezone: string,
): { date: string; time: string; label: string } {
  const slot = toLocalSlot(iso, timezone);
  const day = new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
  return { ...slot, label: `${day} · ${slot.time}` };
}
