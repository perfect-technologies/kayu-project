// apps/web/src/components/bookings/ActionsCard.tsx
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
  disabled,
  marginTop,
}: {
  action: BookingAction;
  onClick: () => void;
  disabled?: boolean;
  marginTop?: number;
}) {
  const IconCmp = action.icon ? I[iconFor[action.icon] ?? "check"] : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classFor(action.variant)}
      style={{ width: "100%", marginTop, ...colorFor(action.variant) }}
    >
      {IconCmp && <IconCmp size={14} />}
      {action.label}
    </button>
  );
}

export function ActionsCard({
  actions,
  busy,
  onAction,
}: {
  actions: BookingActions;
  busy: boolean;
  onAction: (id: BookingAction["id"]) => void;
}) {
  const { primary, secondary, destructive } = actions;
  if (!primary && !secondary && !destructive) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 16,
      }}
    >
      <div className="k-overline" style={{ marginBottom: 10 }}>
        Actions
      </div>
      {primary && (
        <Btn action={primary} onClick={() => onAction(primary.id)} disabled={busy} />
      )}
      {secondary && (
        <Btn
          action={secondary}
          onClick={() => onAction(secondary.id)}
          disabled={busy}
          marginTop={primary ? 8 : 0}
        />
      )}
      {destructive && (
        <Btn
          action={destructive}
          onClick={() => onAction(destructive.id)}
          disabled={busy}
          marginTop={primary || secondary ? 6 : 0}
        />
      )}
    </section>
  );
}
