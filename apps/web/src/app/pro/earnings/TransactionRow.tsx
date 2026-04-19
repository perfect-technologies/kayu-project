"use client";

import { I } from "@kayu/ui/web";
import type { Transaction } from "./fixtures";

const METHOD_CHIPS: Record<
  NonNullable<Transaction["paymentMethod"]>,
  { label: string; bg: string; color: string }
> = {
  cash: { label: "Cash", bg: "var(--k-warning-subtle)", color: "#B45309" },
  mpesa: { label: "M-Pesa", bg: "#ECFDF5", color: "#10B981" },
  airtel: { label: "Airtel", bg: "#FEF2F2", color: "#E11D48" },
  orange: { label: "Orange", bg: "#FFF7ED", color: "#F97316" },
  mtn: { label: "MTN", bg: "#FFFBEB", color: "#B45309" },
};

export function TransactionRow({
  tx,
  last,
}: {
  tx: Transaction;
  last: boolean;
}) {
  const isEarning = tx.type === "earning";
  const isPayout = tx.type === "payout";
  const isBonus = tx.type === "bonus";

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

  const amountColor =
    isPayout
      ? "var(--k-text-primary)"
      : isEarning
        ? "var(--k-success)"
        : "var(--k-warning)";
  const sign = tx.amount > 0 ? "+" : "";

  const methodChip = tx.paymentMethod ? METHOD_CHIPS[tx.paymentMethod] : null;

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
            {tx.at}
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
          {tx.status === "pending" && (
            <span className="k-chip k-chip-sm k-chip-warning">En attente</span>
          )}
          {tx.status === "failed" && (
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
          {tx.ref && (
            <span
              className="k-caption"
              style={{
                color: "var(--k-text-subtle)",
                fontFamily: "var(--k-font-mono)",
              }}
            >
              {tx.ref}
            </span>
          )}
        </div>
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
        {tx.net != null && (
          <div
            className="k-caption"
            style={{
              color: "var(--k-text-muted)",
              marginTop: 2,
              fontSize: 11,
            }}
          >
            Net : <span className="k-num">{tx.net.toLocaleString("fr-FR")}</span> FC
          </div>
        )}
      </div>
    </div>
  );
}
