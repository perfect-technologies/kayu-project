const DATE_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const LONG_DATE_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const DATE_TIME_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const RELATIVE_FR = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const NUMBER_FR = new Intl.NumberFormat("fr-CD");

/** "16 sept. 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  return value ? DATE_FR.format(new Date(value)) : "—";
}

/** "16 septembre 2026" */
export function formatLongDate(value: string | Date | null | undefined): string {
  return value ? LONG_DATE_FR.format(new Date(value)) : "—";
}

/** "16 sept. 2026 09:24" */
export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? DATE_TIME_FR.format(new Date(value)) : "—";
}

/** "il y a 3 h", "hier", "dans 2 jours". */
export function formatRelative(value: string | Date): string {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return RELATIVE_FR.format(Math.round(diff), "second");
  if (abs < 3600) return RELATIVE_FR.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return RELATIVE_FR.format(Math.round(diff / 3600), "hour");
  if (abs < 86_400 * 30) return RELATIVE_FR.format(Math.round(diff / 86_400), "day");
  return DATE_FR.format(new Date(value));
}

/** "mer. 16 sept. · 09:00" in the booking's own timezone. */
export function formatSlot(scheduledAt: string | Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: timezone })
      .format(new Date(scheduledAt))
      .replace(" ", " ");
  } catch {
    return DATE_TIME_FR.format(new Date(scheduledAt));
  }
}

export function formatNumber(value: number): string {
  return NUMBER_FR.format(value);
}

/** "25 000 FC" */
export function formatCdf(amount: number): string {
  return `${NUMBER_FR.format(amount)} FC`;
}

/** `yyyy-mm-dd` for a `<input type="date">`. */
export function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
