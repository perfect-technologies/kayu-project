"use client";

import { TodoRow, type TodoRowItem } from "./TodoRow";

export type TodoStripProps = {
  items: TodoRowItem[];
};

export function TodoStrip({ items }: TodoStripProps) {
  if (items.length === 0) return null;

  const visible = items.slice(0, 5);
  const overflow = items.length - visible.length;
  const label = items.length === 1 ? "1 tâche" : `${items.length} tâches`;

  return (
    <section
      className="k-pd-todo"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "var(--k-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          À FAIRE
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            background: "#F1F5F9",
            padding: "2px 8px",
            borderRadius: "var(--k-r-pill)",
          }}
        >
          {label}
        </span>
      </div>

      {visible.map((item) => (
        <TodoRow key={item.key} item={item} isFirst={false} />
      ))}

      {overflow > 0 && (
        <a
          href="/bookings"
          style={{
            display: "block",
            padding: "10px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            textAlign: "right",
            textDecoration: "none",
          }}
        >
          +{overflow} de plus →
        </a>
      )}
    </section>
  );
}
