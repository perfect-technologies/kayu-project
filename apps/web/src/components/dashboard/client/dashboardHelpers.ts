import type {
  DashboardClientResponse,
  ClientDashboardUpcomingBooking,
  ClientDashboardCompletedBooking,
  ClientDashboardReviewTodo,
  ClientDashboardMessageTodo,
} from "@kayu/schemas";

export type HeroVariant =
  | "in_progress"
  | "upcoming_confirmed"
  | "upcoming_pending"
  | "calm"
  | "empty";

export function pickHeroVariant(data: DashboardClientResponse): HeroVariant {
  const inProgress = data.upcoming.find((b) => b.status === "IN_PROGRESS");
  if (inProgress) return "in_progress";

  const soonest = [...data.upcoming]
    .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

  if (soonest && soonest.status === "PENDING") return "upcoming_pending";
  if (soonest) return "upcoming_confirmed";

  if (data.hasAnyBookingEver) return "calm";
  return "empty";
}

export function pickHeroBooking(
  data: DashboardClientResponse,
  variant: HeroVariant,
): ClientDashboardUpcomingBooking | null {
  if (variant === "in_progress") {
    return data.upcoming.find((b) => b.status === "IN_PROGRESS") ?? null;
  }
  if (variant === "upcoming_confirmed" || variant === "upcoming_pending") {
    return (
      [...data.upcoming]
        .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0] ??
      null
    );
  }
  return null;
}

const MONTHS_FR_SHORT = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];

export function dayMonthAbbr(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: MONTHS_FR_SHORT[d.getMonth()],
  };
}

export function formatRelativeShort(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const day = 86_400_000;
  if (diffMs < day) return "aujourd'hui";
  if (diffMs < 2 * day) return "hier";
  const days = Math.floor(diffMs / day);
  if (days < 14) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function isTomorrow(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

const JOURS_LONGS = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

export function chipLabelForConfirmed(iso: string): string {
  if (isToday(iso)) return "CONFIRMÉE · AUJOURD'HUI";
  if (isTomorrow(iso)) return "CONFIRMÉE · DEMAIN";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays >= 0 && diffDays < 7) return `CONFIRMÉE · ${JOURS_LONGS[d.getDay()]}`;
  return "CONFIRMÉE";
}

export type TodoItem =
  | { kind: "review"; key: string; data: ClientDashboardReviewTodo }
  | { kind: "message"; key: string; data: ClientDashboardMessageTodo };

export function interleaveTodos(
  reviews: ClientDashboardReviewTodo[],
  unreadMessages: ClientDashboardMessageTodo[],
): TodoItem[] {
  const items: TodoItem[] = [
    ...unreadMessages.map<TodoItem>((m) => ({ kind: "message", key: `msg-${m.conversationId}`, data: m })),
    ...reviews.map<TodoItem>((r) => ({ kind: "review", key: `rev-${r.bookingId}`, data: r })),
  ];
  return items;
}

export function excludeHeroFromUpcoming(
  data: DashboardClientResponse,
  heroBookingId: string | null,
): ClientDashboardUpcomingBooking[] {
  if (!heroBookingId) return data.upcoming.slice(0, 3);
  return data.upcoming.filter((b) => b.id !== heroBookingId).slice(0, 3);
}

export function pickActivityRows(
  data: DashboardClientResponse,
): ClientDashboardCompletedBooking[] {
  return data.completed.slice(0, 3);
}

export function pickGreetingSummary(data: DashboardClientResponse, variant: HeroVariant): string {
  const upcomingCount = data.upcoming.length;
  const dateLong = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (variant === "empty") return "Bienvenue sur KAYOU";
  if (variant === "calm") {
    const last = data.completed[0];
    if (!last) return "Aucune réservation active";
    return `Aucune réservation active · dernière mission ${formatRelativeShort(last.completedAt)}`;
  }
  return `${dateLong} · ${upcomingCount} réservation${upcomingCount > 1 ? "s" : ""} à venir`;
}
