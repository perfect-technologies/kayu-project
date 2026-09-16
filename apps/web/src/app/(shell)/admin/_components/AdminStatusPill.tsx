import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";

export type AdminPillStatus = keyof typeof adminCopy.pills;

const MODIFIER: Partial<Record<AdminPillStatus, string>> = {
  PENDING: "status-pill--pending",
  CONFIRMED: "status-pill--confirmed",
  CANCELLED: "status-pill--cancelled",
  NEW: "status-pill--messages",
  REPLIED: "status-pill--confirmed",
  OPEN: "status-pill--pending",
  RESOLVED: "status-pill--confirmed",
  UNDER_REVIEW: "status-pill--pending",
  VERIFIED: "status-pill--confirmed",
  REJECTED: "status-pill--cancelled",
  APPROVED: "status-pill--confirmed",
  BOOSTED: "status-pill--pending",
  ELITE: "status-pill--elite",
  ADMIN: "status-pill--elite",
  PROVIDER: "status-pill--confirmed",
  PUBLIC: "status-pill--confirmed",
  SUSPENDED: "status-pill--cancelled",
  ACTIVE: "status-pill--confirmed",
};

/** `.status-pill` with the admin statuses (contact, report, verification, tier, role, flags). */
export function AdminStatusPill({ status, className }: { status: AdminPillStatus; className?: string }) {
  return <span className={cn("status-pill", MODIFIER[status], className)}>{adminCopy.pills[status]}</span>;
}
