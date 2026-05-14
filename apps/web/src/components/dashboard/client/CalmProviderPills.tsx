import Link from "next/link";
import type { ClientDashboardProviderRow } from "@kayu/schemas";

const PALETTE = ["#F59E0B", "#6366F1", "#10B981", "#EC4899", "#0EA5E9"];
function colorFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(first: string, last: string): string {
  return `${(first[0] ?? "").toUpperCase()}${(last[0] ?? "").toUpperCase()}`;
}

export function CalmProviderPills({ providers }: { providers: ClientDashboardProviderRow[] }) {
  const items = providers.slice(0, 3);
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/providers/${p.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "#F8FAFC",
            borderRadius: 999,
            textDecoration: "none",
            color: "var(--k-text-primary)",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: colorFor(p.id),
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 10,
              fontFamily: "var(--k-font-display)",
            }}
          >
            {initials(p.firstName, p.lastName)}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>
            {p.firstName} {p.lastName.slice(0, 1)}. · {p.profession}
          </span>
        </Link>
      ))}
    </div>
  );
}
