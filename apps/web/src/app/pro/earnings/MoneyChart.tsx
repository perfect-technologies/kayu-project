"use client";

import { EARNINGS_WEEKLY, LAST_WEEK_TOTAL, type WeekDay } from "./fixtures";

function MoneyBar({ day, max }: { day: WeekDay; max: number }) {
  const h = day.amount === 0 ? 2 : Math.max(6, (day.amount / max) * 100);
  const isToday = day.isToday;
  const isFuture = day.isFuture;
  const color = "var(--k-primary)";

  const background = isFuture
    ? "var(--k-surface-muted)"
    : isToday
      ? `linear-gradient(to top, ${color}, ${color}bb)`
      : `linear-gradient(to top, ${color}88, ${color}44)`;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          height: 120,
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 3px",
        }}
      >
        <div
          aria-label={`${day.day} · ${day.amount.toLocaleString("fr-FR")} FC`}
          style={{
            width: "100%",
            height: `${h}%`,
            borderRadius: 6,
            background,
            boxShadow: isToday
              ? `0 0 0 2px var(--k-bg), 0 0 0 3.5px ${color}`
              : "none",
            transition: "height 320ms var(--k-ease-emph)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--k-font-mono)",
          fontSize: 11,
          fontWeight: 500,
          color: isToday
            ? "var(--k-primary-hover)"
            : isFuture
              ? "var(--k-text-subtle)"
              : "var(--k-text-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {day.day}
      </span>
    </div>
  );
}

export function MoneyChart() {
  const max = Math.max(...EARNINGS_WEEKLY.map((d) => d.amount), 1);
  const total = EARNINGS_WEEKLY.reduce((s, d) => s + d.amount, 0);
  const change = ((total - LAST_WEEK_TOTAL) / LAST_WEEK_TOTAL) * 100;
  const up = change > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            className="k-caption"
            style={{ color: "var(--k-text-muted)", marginBottom: 4 }}
          >
            Cette semaine
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            <span className="k-num">{total.toLocaleString("fr-FR")}</span>
            <span
              style={{
                fontSize: 18,
                color: "var(--k-text-muted)",
                marginLeft: 4,
                fontWeight: 600,
              }}
            >
              FC
            </span>
          </div>
          <div
            className="k-caption"
            style={{ color: "var(--k-text-subtle)", marginTop: 4 }}
          >
            vs semaine dernière
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: up ? "var(--k-success-subtle)" : "var(--k-danger-subtle)",
            color: up ? "#047857" : "#BE123C",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--k-font-mono)",
          }}
        >
          <span style={{ fontSize: 13 }}>{up ? "↑" : "↓"}</span>
          {Math.abs(change).toFixed(0)}%
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        {EARNINGS_WEEKLY.map((d) => (
          <MoneyBar key={d.day} day={d} max={max} />
        ))}
      </div>
    </div>
  );
}
