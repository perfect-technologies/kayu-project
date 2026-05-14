import Link from "next/link";
import type { ClientDashboardProviderRow } from "@kayu/schemas";
import { ProviderRow } from "./ProviderRow";
import { ProviderCard } from "./ProviderCard";

export function ProvidersList({ items }: { items: ClientDashboardProviderRow[] }) {
  if (items.length === 0) return null;
  return (
    <section
      id="tes-prestataires"
      className="k-cd-providers"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">TES PRESTATAIRES</span>
        <Link
          href="/dashboard/settings"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--k-text-primary)" }}
        >
          Tous →
        </Link>
      </header>

      <div className="k-cd-providers-desktop">
        {items.map((p, idx) => (
          <ProviderRow key={p.id} provider={p} isFirst={idx === 0} />
        ))}
      </div>

      <div
        className="k-cd-providers-mobile"
        style={{
          display: "none",
          gap: 10,
          overflowX: "auto",
          margin: "0 -16px",
          padding: "4px 16px 2px",
          scrollSnapType: "x mandatory",
        }}
      >
        {items.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>

      <style jsx global>{`
        @media (max-width: 767px) {
          .k-cd-providers-desktop {
            display: none !important;
          }
          .k-cd-providers-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </section>
  );
}
