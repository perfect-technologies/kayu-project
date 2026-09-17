import type { Notification, NotificationType } from "@kayu/schemas";
import type { AuthRole } from "@/contexts/AuthContext";

/** Deep-link table by notification type; workstream 10's smoke asserts these patterns. */
export const NOTIFICATION_DEEP_LINKS: Readonly<Record<NotificationType, string>> = {
  BOOKING_NEW: "/reservation/[bookingId]",
  BOOKING_CONFIRMED: "/reservation/[bookingId]",
  BOOKING_COMPLETED: "/reservation/[bookingId]",
  BOOKING_CANCELLED: "/reservation/[bookingId]",
  NEW_MESSAGE: "/messagerie?c=[conversationId]",
  NEW_REVIEW: "/avis (CLIENT, ADMIN) | /mon-espace (PROVIDER)",
  NEW_CLIENT_REVIEW: "/avis (CLIENT, ADMIN) | /mon-espace (PROVIDER)",
  VERIFICATION_UPDATED: "/verification",
  PLACE_SUGGESTION_RESOLVED: "/compte",
  SYSTEM: "/notifications",
};

const FALLBACK = "/notifications";

export function notificationHref(notification: Pick<Notification, "type" | "data">, role: AuthRole | undefined): string {
  const data = notification.data ?? {};
  switch (notification.type) {
    case "BOOKING_NEW":
    case "BOOKING_CONFIRMED":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
      return data.bookingId ? `/reservation/${encodeURIComponent(data.bookingId)}` : FALLBACK;
    case "NEW_MESSAGE":
      return data.conversationId ? `/messagerie?c=${encodeURIComponent(data.conversationId)}` : "/messagerie";
    case "NEW_REVIEW":
    case "NEW_CLIENT_REVIEW":
      return role === "PROVIDER" ? "/mon-espace" : "/avis";
    case "VERIFICATION_UPDATED":
      return "/verification";
    case "PLACE_SUGGESTION_RESOLVED":
      return "/compte";
    default:
      return FALLBACK;
  }
}
