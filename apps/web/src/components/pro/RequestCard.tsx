"use client";

import { Avatar, Chip, I } from "@kayu/ui/web";
import type { DashboardRequest } from "./types";

export function RequestCard({
  req,
  mobile = false,
  onQuote,
  onDecline,
}: {
  req: DashboardRequest;
  mobile?: boolean;
  onQuote?: () => void;
  onDecline?: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: `1px solid ${req.urgent ? "#FCA5A5" : "var(--k-border)"}`,
        borderRadius: "var(--k-r-md)",
        padding: mobile ? 14 : 18,
        boxShadow: "var(--k-e1)",
        position: "relative",
      }}
    >
      {req.urgent && (
        <div
          style={{
            position: "absolute",
            top: -8,
            left: 14,
            background: "var(--k-danger)",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "3px 8px",
            borderRadius: 999,
            textTransform: "uppercase",
            fontFamily: "var(--font-body)",
          }}
        >
          Urgent
        </div>
      )}

      {/* Row 1: avatar + client + match */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Avatar
          name={req.client.name}
          bg={req.client.bg}
          size={36}
          initials={req.client.initials}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14.5,
              color: "var(--k-text-primary)",
            }}
          >
            {req.client.name}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--k-text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {req.receivedAt} · {req.distance} km
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--k-text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Match
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--k-success)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {req.matchScore}%
          </div>
        </div>
      </div>

      {/* Row 2: service */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--k-text-primary)",
          marginBottom: 4,
        }}
      >
        {req.kind}
      </div>

      {/* Row 3: message preview */}
      <p
        style={{
          color: "var(--k-text-body)",
          margin: "0 0 10px",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: 1.45,
          fontStyle: "italic",
        }}
      >
        « {req.msg} »
      </p>

      {/* Row 4: chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <Chip size="sm" leadingIcon={<I.calendar size={11} />}>
          {req.when}
        </Chip>
        <Chip size="sm" leadingIcon={<I.mapPin size={11} />}>
          {req.address}
        </Chip>
      </div>

      {/* Row 5: actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="k-btn k-btn-secondary k-btn-sm"
          style={{ flex: 1 }}
          onClick={onDecline}
        >
          Décliner
        </button>
        <button
          type="button"
          className="k-btn k-btn-primary k-btn-sm"
          style={{ flex: 2 }}
          onClick={onQuote}
        >
          Envoyer un devis <I.arrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
