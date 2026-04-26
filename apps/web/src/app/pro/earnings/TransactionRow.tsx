"use client";

import { I } from "@kayu/ui/web";
import type { Transaction } from "@kayu/schemas";

const METHOD_CHIPS: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  cash: { label: "Cash", bg: "var(--k-warning-subtle)", color: "#B45309" },
  mpesa: { label: "Autre", bg: "var(--k-surface-muted)", color: "var(--k-text-muted)" },
  airtel: { label: "Autre", bg: "var(--k-surface-muted)", color: "var(--k-text-muted)" },
  orange: { label: "Autre", bg: "var(--k-surface-muted)", color: "var(--k-text-muted)" },
  mtn: { label: "Autre", bg: "var(--k-surface-muted)", color: "var(--k-text-muted)" },
};

function formatRelative(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 12 && sameDay(d, now)) return `Il y a ${diffH}h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday))
    return `Hier · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (sameDay(d, now))
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const short = d
    .toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" })
    .replace(".", "");
  return `${short} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function TransactionRow({
  tx,
  last,
}: {
  tx: Transaction;
  last: boolean;
}) {
  const isEarning = tx.type === "EARNING";
  const isPayout = tx.type === "PAYOUT";
  const isBonus = tx.type === "BONUS";

  const iconColor = isPayout
    ? "var(--k-primary)"
    : isBonus
      ? "var(--k-warning)"
      : "var(--k-success)";
  const iconBg = isPayout
    ? "var(--k-primary-subtle)"
    : isBonus
      ? "var(--k-warning-subtle)"
      : "var(--k-success-subtle)";
  const IconNode = isPayout
    ? I.arrowRight
    : isBonus
      ? I.sparkles
      : I.trendingUp;

  const amountColor = isPayout
    ? "var(--k-text-primary)"
    : isEarning
      ? "var(--k-success)"
      : "var(--k-warning)";
  const sign = tx.amount > 0 ? "+" : "";

  const method = tx.paymentMethod?.toLowerCase() ?? null;
  const methodChip = method && METHOD_CHIPS[method] ? METHOD_CHIPS[method] : null;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: "14px 4px",
        borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconNode size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontWeight: 600,
            fontSize: 14.5,
            color: "var(--k-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3,
            flexWrap: "wrap",
          }}
        >
          <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>
            {formatRelative(tx.occurredAt)}
          </span>
          {methodChip && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 999,
                background: methodChip.bg,
                color: methodChip.color,
                fontFamily: "var(--k-font-mono)",
                letterSpacing: "0.02em",
              }}
            >
              {methodChip.label}
            </span>
          )}
          {tx.status === "PENDING" && (
            <span className="k-chip k-chip-sm k-chip-warning">En attente</span>
          )}
          {tx.status === "FAILED" && (
            <span
              className="k-chip k-chip-sm"
              style={{
                background: "var(--k-danger-subtle)",
                color: "var(--k-danger)",
              }}
            >
              Échec
            </span>
          )}
          {tx.reference && (
            <span
              className="k-caption"
              style={{
                color: "var(--k-text-subtle)",
                fontFamily: "var(--k-font-mono)",
              }}
            >
              {tx.reference}
            </span>
          )}
        </div>
        {tx.note && (
          <div
            className="k-caption"
            style={{
              color: "var(--k-text-muted)",
              marginTop: 4,
              fontSize: 11.5,
              lineHeight: 1.4,
            }}
          >
            {tx.note}
          </div>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          className="k-price"
          style={{
            fontSize: 15,
            color: amountColor,
            fontWeight: 700,
          }}
        >
          {sign}
          {tx.amount.toLocaleString("fr-FR")}{" "}
          <span style={{ color: "var(--k-text-muted)", fontSize: 12 }}>FC</span>
        </div>
        {isEarning && tx.netAmt > 0 && (
          <div
            className="k-caption"
            style={{
              color: "var(--k-text-muted)",
              marginTop: 2,
              fontSize: 11,
            }}
          >
            Net : <span className="k-num">{tx.netAmt.toLocaleString("fr-FR")}</span> FC
          </div>
        )}
      </div>
    </div>
  );
}
