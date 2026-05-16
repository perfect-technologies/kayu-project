import type { DashboardProviderResponse } from "@kayu/schemas";

export type ProviderDashboardData = DashboardProviderResponse;

export type HeroVariant =
  | "onboarding"
  | "pending_request"
  | "in_progress"
  | "next_today"
  | "next_upcoming"
  | "unavailable"
  | "calm"
  | "empty";

function endOfTodayLocal(now: Date = new Date()): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

function scheduledTime(value: Date | string | null | undefined): number {
  if (value == null) return 0;
  return new Date(value).getTime();
}

function scheduledTimeForSort(value: Date | string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  return new Date(value).getTime();
}

export function pickHeroVariant(data: ProviderDashboardData, now: Date = new Date()): HeroVariant {
  if (!data.onboarding.isComplete) return "onboarding";

  const pending = data.bookingRequests ?? [];
  if (pending.length > 0) return "pending_request";

  const upcomingAll = data.upcomingBookings ?? [];
  const inProgress = upcomingAll
    .filter((b) => b.status === "IN_PROGRESS")
    .sort((a, b) => scheduledTime(b.scheduledDate) - scheduledTime(a.scheduledDate))[0];
  if (inProgress) return "in_progress";

  const confirmedFuture = upcomingAll
    .filter((b) => b.status === "CONFIRMED")
    .filter((b) => scheduledTime(b.scheduledDate) > now.getTime())
    .sort((a, b) => scheduledTimeForSort(a.scheduledDate) - scheduledTimeForSort(b.scheduledDate));
  const soonest = confirmedFuture[0];
  if (soonest) {
    const ts = scheduledTime(soonest.scheduledDate);
    return ts <= endOfTodayLocal(now).getTime() ? "next_today" : "next_upcoming";
  }

  if (!data.availability.isAvailable) return "unavailable";

  if (data.hasAnyBookingEver) return "calm";
  return "empty";
}

export function pickHeroBookingId(data: ProviderDashboardData, variant: HeroVariant): string | null {
  if (variant === "pending_request") {
    const sorted = (data.bookingRequests ?? [])
      .slice()
      .sort((a, b) => scheduledTimeForSort(a.scheduledDate) - scheduledTimeForSort(b.scheduledDate));
    return sorted[0]?.id ?? null;
  }
  if (variant === "in_progress") {
    const inProgress = (data.upcomingBookings ?? [])
      .filter((b) => b.status === "IN_PROGRESS")
      .sort((a, b) => scheduledTime(b.scheduledDate) - scheduledTime(a.scheduledDate));
    return inProgress[0]?.id ?? null;
  }
  if (variant === "next_today" || variant === "next_upcoming") {
    const sorted = (data.upcomingBookings ?? [])
      .filter((b) => b.status === "CONFIRMED")
      .sort((a, b) => scheduledTimeForSort(a.scheduledDate) - scheduledTimeForSort(b.scheduledDate));
    return sorted[0]?.id ?? null;
  }
  return null;
}

export function formatShortMoney(fc: number): string {
  if (!Number.isFinite(fc) || fc === 0) return "0 FC";
  if (fc >= 1_000_000) {
    const millions = fc / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    return `${rounded.toString().replace(/\.0$/, "")}M FC`;
  }
  if (fc >= 1_000) {
    const k = Math.round(fc / 1_000);
    return `${k}k FC`;
  }
  return `${Math.round(fc).toLocaleString("fr-FR")} FC`;
}

export function formatRelativeShort(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const MONTHS_FR_ABBR = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];

export function dayMonthAbbr(value: Date | string): { day: string; month: string } {
  const date = value instanceof Date ? value : new Date(value);
  return {
    day: String(date.getDate()),
    month: MONTHS_FR_ABBR[date.getMonth()] ?? "",
  };
}

export function dayLongFR(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("fr-FR", { weekday: "long" });
}

export function timeOfDayFR(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

