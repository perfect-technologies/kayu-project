import type { BookingStatus } from "@kayu/schemas";
import { spacesCopy } from "@/copy/spaces";
import { cn } from "@/lib/utils";

const MODIFIER: Record<BookingStatus, string> = {
  PENDING: "status-pill--pending",
  CONFIRMED: "status-pill--confirmed",
  COMPLETED: "status-pill--completed",
  CANCELLED: "status-pill--cancelled",
};

/** Booking status as a pill (contract §11 rule 4). */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return <span className={cn("status-pill", MODIFIER[status], className)}>{spacesCopy.status[status]}</span>;
}
