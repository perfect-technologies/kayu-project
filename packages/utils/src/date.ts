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
