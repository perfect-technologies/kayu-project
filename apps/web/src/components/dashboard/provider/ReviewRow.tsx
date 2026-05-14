"use client";

import type { Review } from "@kayu/schemas";
import { dayMonthAbbr } from "./providerDashboardHelpers";

const AVATAR_COLORS = ["#FB7185", "#10B981", "#F59E0B", "#BE185D", "#7C3AED", "#475569", "#0EA5E9", "#DC2626"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function ReviewRow({ review, isFirst }: { review: Review; isFirst: boolean }) {
  const firstName = review.client?.firstName ?? "Client";
  const lastName = review.client?.lastName ?? "";
  const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
  const name = `${firstName}${lastInitial ? ` ${lastInitial}` : ""}`.trim();
  const score = Math.round(review.overallScore ?? review.rating ?? 0);
  const { day, month } = dayMonthAbbr(review.createdAt);
  const service = review.service ?? null;

  return (
    <div
      style={{
        padding: "11px 14px",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: colorFor(review.client?.id ?? firstName),
          color: "white",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {initialsFor(`${firstName} ${lastName}`)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: 11, color: "#F59E0B", letterSpacing: 1 }}>
            {"★".repeat(score)}
            <span style={{ color: "var(--k-border)" }}>{"★".repeat(Math.max(0, 5 - score))}</span>
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--k-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {day} {month}
          </span>
        </div>
        {review.comment && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--k-text-body)",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            « {review.comment} »
          </div>
        )}
        {service && (
          <div style={{ fontSize: 10.5, color: "var(--k-text-muted)", marginTop: 4 }}>{service}</div>
        )}
      </div>
    </div>
  );
}
