"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientDashboardProviderRow } from "@kayu/schemas";

const PALETTE = ["#F59E0B", "#6366F1", "#10B981", "#EC4899", "#0EA5E9"];
function colorFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function ProviderCard({ provider }: { provider: ClientDashboardProviderRow }) {
  const router = useRouter();
  const initials = `${(provider.firstName[0] ?? "").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;
  return (
    <Link
      href={`/providers/${provider.id}`}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 10,
        minWidth: 140,
        flexShrink: 0,
        scrollSnapAlign: "start",
        textDecoration: "none",
        color: "var(--k-text-primary)",
        display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: colorFor(provider.id),
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "var(--k-font-display)",
          }}
        >
          {initials}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {provider.firstName} {provider.lastName.slice(0, 1)}.
          </div>
          <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 1 }}>
            {provider.profession}
            {provider.rating > 0 ? ` · ★ ${provider.rating.toFixed(1)}` : ""}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/providers/${provider.id}`);
        }}
        style={{
          display: "block",
          width: "100%",
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "#F1F5F9",
          border: "none",
          borderRadius: 8,
          padding: "6px 8px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        Réserver →
      </button>
    </Link>
  );
}
