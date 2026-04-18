"use client";

import { Avatar, I } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import type { InboundRequest } from "./types";

export function InboundRequestCard({
  req,
  mobile = false,
  onQuote,
  onDecline,
}: {
  req: InboundRequest;
  mobile?: boolean;
  onQuote?: () => void;
  onDecline?: () => void;
}) {
  const cat = tokens.portfolio[req.category] ?? tokens.portfolio.plomberie;
  const soon = req.expiresMinutes <= 30;
  const expireBg = soon ? "var(--k-danger-subtle)" : "var(--k-warning-subtle)";
  const expireColor = soon ? "#9F1239" : "#B45309";

  return (
    <article
      style={{
        background: "var(--k-surface)",
        border: `1px solid ${req.urgent ? "#FECDD3" : "var(--k-border)"}`,
        borderRadius: 18,
        padding: mobile ? 14 : 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "var(--k-e1)",
      }}
    >
      {/* Top: client + match % */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <Avatar
          name={req.client.name}
          bg={req.client.bg}
          size={40}
          initials={req.client.initials}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--k-ink)",
              lineHeight: 1.2,
            }}
          >
            {req.client.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 3,
              flexWrap: "wrap",
            }}
          >
            {req.client.newClient ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--k-accent-subtle)",
                  color: "#BE123C",
                  textTransform: "uppercase",
                }}
              >
                Nouveau client
              </span>
            ) : (
              <>
                <I.star size={11} strokeColor="var(--k-warning)" />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "var(--k-text-body)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {req.client.rating?.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--k-text-muted)",
                    fontWeight: 500,
                  }}
                >
                  · {req.client.jobs} missions
                </span>
              </>
            )}
            <span
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                fontWeight: 500,
              }}
            >
              · {req.receivedAt} · {req.distance} km
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.8,
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
              fontSize: 17,
              color: "var(--k-success)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {req.matchScore}%
          </div>
        </div>
      </div>

      {/* Service title + description */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 16,
            color: "var(--k-ink)",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {req.service}
        </div>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--k-text-body)",
            fontSize: 13.5,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            fontStyle: "italic",
          }}
        >
          « {req.description} »
        </p>
      </div>

      {/* Chip row: category · when · location · photos */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 999,
            background: cat.bg,
            color: cat.accent,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {cat.label}
        </span>
        <Chip icon={<I.calendar size={11} />} label={req.when} />
        <Chip icon={<I.mapPin size={11} />} label={`${req.neighborhood} · ${req.distance} km`} />
        {req.photos > 0 && (
          <Chip icon={<I.camera size={11} />} label={`${req.photos} photo${req.photos > 1 ? "s" : ""}`} />
        )}
      </div>

      {/* Meta row: budget · expiration · competing */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "auto 1fr auto",
          gap: mobile ? 8 : 12,
          padding: "10px 12px",
          borderRadius: 12,
          background: "var(--k-bg)",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--k-text-muted)",
            }}
          >
            Budget client
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--k-success)",
              fontVariantNumeric: "tabular-nums",
              marginTop: 2,
            }}
          >
            {req.budget.toLocaleString("fr-FR")} FC
          </div>
        </div>
        <div style={{ display: mobile ? "none" : "block" }} />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            justifySelf: mobile ? "flex-start" : "flex-end",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 999,
              background: expireBg,
              color: expireColor,
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            <I.clock size={11} /> Expire {req.expiresIn}
          </span>
          {(req.competing ?? 0) > 1 && (
            <span
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                fontWeight: 500,
              }}
            >
              {req.competing} pros voient
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onDecline}
          className="k-btn k-btn-secondary k-btn-sm"
          style={{ flex: 1 }}
        >
          Décliner
        </button>
        <button
          type="button"
          onClick={onQuote}
          className="k-btn k-btn-primary k-btn-sm"
          style={{ flex: 2 }}
        >
          Envoyer un devis <I.arrowRight size={13} />
        </button>
      </div>
    </article>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        background: "var(--k-surface-muted)",
        color: "var(--k-text-body)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
