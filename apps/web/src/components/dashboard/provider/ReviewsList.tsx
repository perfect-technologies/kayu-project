"use client";

import Link from "next/link";
import type { Review } from "@kayu/schemas";
import { ReviewRow } from "./ReviewRow";

export type ReviewsListProps = {
  providerId: string;
  items: Review[];
};

export function ReviewsList({ providerId, items }: ReviewsListProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="k-pd-section"
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
          padding: "10px 14px",
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
          AVIS RÉCENTS
        </div>
        <Link
          href={`/providers/${providerId}#avis`}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            textDecoration: "none",
          }}
        >
          Voir tous →
        </Link>
      </div>
      {items.slice(0, 3).map((r) => (
        <ReviewRow key={r.id} review={r} isFirst={false} />
      ))}
    </section>
  );
}
