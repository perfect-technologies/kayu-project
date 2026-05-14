// apps/web/src/components/bookings/MobileStickyBar.tsx
"use client";

import { I } from "@kayu/ui/web";
import type { BookingAction, BookingActions } from "./bookingActions";

const iconFor: Partial<Record<
  NonNullable<BookingAction["icon"]>,
  keyof typeof I
>> = {
  messageCircle: "messageCircle",
  check: "check",
  coins: "coins",
  star: "star",
  pencil: "pencil",
};

function classFor(variant: BookingAction["variant"]): string {
  if (variant === "primary") return "k-btn k-btn-primary";
  if (variant === "secondary") return "k-btn k-btn-secondary";
  return "k-btn k-btn-ghost";
}

function colorFor(variant: BookingAction["variant"]): React.CSSProperties {
  if (variant === "ghost-danger")
    return { color: "var(--k-danger)", fontWeight: 500 };
  return {};
}

function Btn({
  action,
  onClick,
  flex,
  disabled,
}: {
  action: BookingAction;
  onClick: () => void;
  flex: number;
  disabled?: boolean;
}) {
  const IconCmp = action.icon ? I[iconFor[action.icon] ?? "check"] : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classFor(action.variant)}
      style={{ flex, ...colorFor(action.variant) }}
    >
      {IconCmp && <IconCmp size={14} />}
      {action.label}
    </button>
  );
}

export function MobileStickyBar({
  actions,
  busy,
  onAction,
}: {
  actions: BookingActions;
  busy: boolean;
  onAction: (id: BookingAction["id"]) => void;
}) {
  const left = actions.destructive ?? actions.secondary ?? null;
  const right = actions.primary;
  if (!left && !right) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--k-surface)",
        borderTop: "1px solid var(--k-border)",
        padding: "12px 14px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        display: "flex",
        gap: 8,
        zIndex: 20,
      }}
    >
      {left ? (
        <Btn action={left} onClick={() => onAction(left.id)} flex={2} disabled={busy} />
      ) : null}
      {right ? (
        <Btn
          action={right}
          onClick={() => onAction(right.id)}
          flex={left ? 3 : 1}
          disabled={busy}
        />
      ) : null}
    </div>
  );
}
