import Link from "next/link";
import type { ClientDashboardReviewTodo, ClientDashboardMessageTodo } from "@kayu/schemas";
import { interleaveTodos } from "./dashboardHelpers";
import { TodoRow } from "./TodoRow";

export function TodoStrip({
  reviews,
  unreadMessages,
}: {
  reviews: ClientDashboardReviewTodo[];
  unreadMessages: ClientDashboardMessageTodo[];
}) {
  const all = interleaveTodos(reviews, unreadMessages);
  if (all.length === 0) return null;

  const visible = all.slice(0, all.length > 5 ? 4 : 5);
  const overflow = all.length > 5 ? all.length - 4 : 0;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 6px",
        }}
      >
        <span className="k-overline">À FAIRE</span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            background: "#F1F5F9",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {all.length} {all.length === 1 ? "tâche" : "tâches"}
        </span>
      </header>
      {visible.map((item, idx) => (
        <TodoRow key={item.key} item={item} isFirst={idx === 0} />
      ))}
      {overflow > 0 && (
        <Link
          href="/bookings"
          style={{
            display: "block",
            padding: "11px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--k-text-muted)",
            textDecoration: "none",
          }}
        >
          +{overflow} de plus →
        </Link>
      )}
    </section>
  );
}
