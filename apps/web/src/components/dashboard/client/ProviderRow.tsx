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

export function ProviderRow({ provider, isFirst }: { provider: ClientDashboardProviderRow; isFirst: boolean }) {
  const router = useRouter();
  const initials = `${(provider.firstName[0] ?? "").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;
  const meta =
    provider.bookingCount > 0
      ? `${provider.profession} · ${provider.isFavorite ? "★ " : ""}${provider.bookingCount} fois`
      : `${provider.profession}${provider.isFavorite ? " · ★ favori" : ""}`;
  return (
    <Link
      href={`/providers/${provider.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        textDecoration: "none",
        color: "var(--k-text-primary)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: colorFor(provider.id),
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "var(--k-font-display)",
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
          {provider.firstName} {provider.lastName.slice(0, 1)}.
        </div>
        <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 1 }}>{meta}</div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/providers/${provider.id}`);
        }}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        Réserver →
      </button>
    </Link>
  );
}
