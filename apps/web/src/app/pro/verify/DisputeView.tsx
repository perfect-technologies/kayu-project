"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, I } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { PRO_DISPUTE } from "./fixtures";

const MIN_RESPONSE_LEN = 20;

const OPTIONS = [
  {
    id: "revisit",
    label: "Je peux revenir réparer gratuitement",
    desc: "Solution préférée — conserve la relation client",
  },
  {
    id: "partial",
    label: "Je propose un remboursement partiel",
    desc: "Montant à définir avec le client",
  },
  {
    id: "full",
    label: "Remboursement intégral",
    desc: `${PRO_DISPUTE.amount.toLocaleString("fr-FR")} FC · Vos gains seront ajustés`,
  },
  {
    id: "contest",
    label: "Je conteste — le travail était conforme",
    desc: "Un agent KAYOU arbitrera",
  },
];

export function DisputeView({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState("");
  const [option, setOption] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const d = PRO_DISPUTE;

  const canSubmit = msg.length >= MIN_RESPONSE_LEN && option.length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success("Votre réponse est envoyée à l'équipe KAYOU.");
    onBack();
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "8px 0 60px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <I.arrowLeft size={17} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: tokens.font.display,
              fontWeight: 700,
              fontSize: 18,
              color: tokens.color.textPrimary,
            }}
          >
            Litige #{d.ref}
          </div>
          <div style={{ fontSize: 11.5, color: tokens.color.textMuted }}>
            Ouvert {d.opened.toLowerCase()}
          </div>
        </div>
        <span
          style={{
            background: "#FEF3C7",
            color: "#B45309",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
          }}
        >
          Réponse attendue
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <I.clock size={16} strokeColor="#B45309" />
          <div style={{ fontSize: 13, color: "#78350F", flex: 1 }}>
            <strong>{d.deadline}</strong> pour répondre au client, sinon la
            décision sera prise sans votre version.
          </div>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tokens.color.textMuted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Réservation concernée
          </div>
          <div
            style={{
              fontFamily: tokens.font.display,
              fontWeight: 600,
              fontSize: 16,
              color: tokens.color.textPrimary,
              marginBottom: 4,
            }}
          >
            {d.service}
          </div>
          <div
            style={{
              fontSize: 13,
              color: tokens.color.textMuted,
              marginBottom: 10,
            }}
          >
            Client : {d.client} · Montant :{" "}
            <strong style={{ color: tokens.color.textPrimary }}>
              {d.amount.toLocaleString("fr-FR")} FC
            </strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="k-btn k-btn-secondary k-btn-sm">
              <I.fileText size={12} /> Voir le devis
            </button>
            <button className="k-btn k-btn-secondary k-btn-sm">
              <I.messageCircle size={12} /> Historique chat
            </button>
          </div>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Avatar name={d.client} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.client}</div>
              <div style={{ fontSize: 11.5, color: tokens.color.textMuted }}>
                Version du client
              </div>
            </div>
            <span
              style={{
                background: "#FEE2E2",
                color: "#B91C1C",
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              {d.reason}
            </span>
          </div>
          <div
            style={{
              padding: 14,
              background: "#FEF2F2",
              borderRadius: 10,
              border: "1px solid #FECACA",
              fontSize: 13.5,
              color: "#7F1D1D",
              lineHeight: 1.55,
              marginBottom: 10,
            }}
          >
            « {d.clientSide} »
          </div>
          {d.evidence > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {Array.from({ length: d.evidence }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #FCA5A5, #EF4444)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <I.camera size={18} />
                </div>
              ))}
              <div
                style={{
                  fontSize: 11,
                  color: tokens.color.textMuted,
                  marginLeft: 4,
                }}
              >
                {d.evidence} photos fournies par le client
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: tokens.color.textPrimary,
              marginBottom: 10,
            }}
          >
            Votre version des faits
          </div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value.slice(0, 1000))}
            placeholder="Expliquez calmement et factuellement ce qui s'est passé. Nos équipes liront tout."
            rows={5}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${tokens.color.border}`,
              fontSize: 13.5,
              fontFamily: tokens.font.body,
              resize: "vertical",
              lineHeight: 1.5,
              outline: "none",
              background: tokens.color.surface,
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <button className="k-btn k-btn-secondary k-btn-sm" type="button">
              <I.camera size={13} /> Joindre des photos
            </button>
            <button className="k-btn k-btn-secondary k-btn-sm" type="button">
              <I.fileText size={13} /> Joindre un document
            </button>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 11.5,
                color:
                  msg.length < MIN_RESPONSE_LEN
                    ? tokens.color.textSubtle
                    : tokens.color.textMuted,
                fontFamily: tokens.font.mono,
              }}
            >
              {msg.length}/1000
              {msg.length < MIN_RESPONSE_LEN &&
                ` (min ${MIN_RESPONSE_LEN})`}
            </span>
          </div>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Que souhaitez-vous proposer ?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {OPTIONS.map((o) => {
              const isSel = option === o.id;
              return (
                <label
                  key={o.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${isSel ? tokens.color.primary : tokens.color.border}`,
                    background: isSel
                      ? tokens.color.primarySubtle
                      : tokens.color.surface,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="dispute-opt"
                    checked={isSel}
                    onChange={() => setOption(o.id)}
                    style={{ marginTop: 3, accentColor: tokens.color.primary }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: tokens.color.textPrimary,
                        marginBottom: 2,
                      }}
                    >
                      {o.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: tokens.color.textMuted,
                        lineHeight: 1.4,
                      }}
                    >
                      {o.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="k-btn k-btn-secondary" type="button">
            Escalader à KAYOU
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="k-btn k-btn-primary k-btn-lg"
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitted}
            style={{ minWidth: 220, justifyContent: "center" }}
          >
            <I.send size={14} /> Envoyer ma réponse
          </button>
        </div>
      </div>
    </div>
  );
}
