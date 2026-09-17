import type { LocalSlot } from "@kayu/schemas";

const DAY_FR = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const DAY_YEAR_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const DATE_TIME_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const MONTH_YEAR_FR = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const CDF = new Intl.NumberFormat("fr-CD");

/** "mer. 16 sept." from a local slot date (no timezone shift: the date is already local). */
export function formatSlotDay(slot: LocalSlot): string {
  return DAY_FR.format(new Date(`${slot.date}T00:00:00`));
}

/** "16 septembre 2026" from a local slot date. */
export function formatSlotLongDay(slot: LocalSlot): string {
  return DAY_YEAR_FR.format(new Date(`${slot.date}T00:00:00`));
}

/** "16 sept. 09:24" for timeline rows. */
export function formatDateTime(value: string | Date): string {
  return DATE_TIME_FR.format(new Date(value));
}

/** "septembre 2026" for "Membre depuis". */
export function formatMonthYear(value: string | Date): string {
  return MONTH_YEAR_FR.format(new Date(value));
}

/** "25 000 FC" — integer CDF amounts. */
export function formatCdf(amount: number): string {
  return `${CDF.format(amount)} FC`;
}
