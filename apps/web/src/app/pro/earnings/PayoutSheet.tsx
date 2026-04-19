"use client";

import { useEffect, useMemo, useState } from "react";
import { I } from "@kayu/ui/web";
import { MM_OPERATORS, type MMOperator } from "./fixtures";

// Fee is a placeholder preview — real Mobile Money fees vary per operator and
// are confirmed server-side. DS08 acceptance criteria calls for a flat 1%.
const FEE_RATE = 0.01;

export function PayoutSheet({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
}) {
  const [amount, setAmount] = useState(balance);
  const [selectedId, setSelectedId] = useState<MMOperator["id"]>("mpesa");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(balance);
      setSelectedId("mpesa");
      setSubmitted(false);
    }
  }, [open, balance]);

  const selected = useMemo(
    () => MM_OPERATORS.find((op) => op.id === selectedId) ?? MM_OPERATORS[0],
    [selectedId],
  );

  if (!open) return null;

  const fee = Math.round(amount * FEE_RATE);
  const receiving = amount - fee;
  const invalid = amount <= 0 || amount > balance;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Demander un paiement"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--k-surface)",
          borderRadius: "var(--k-r-xl)",
          padding: "28px 28px 24px",
          boxShadow: "0 30px 60px rgba(15,23,42,0.3)",
          animation: "kFadeIn 240ms var(--k-ease-emph)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <div>
            <h2
              className="k-display-m"
              style={{ margin: 0, fontSize: 22, letterSpacing: "-0.01em" }}
            >
              Demander un paiement
            </h2>
            <div
              className="k-caption"
              style={{ color: "var(--k-text-muted)", marginTop: 4 }}
            >
              Votre solde :{" "}
              <span className="k-price" style={{ color: "var(--k-text-primary)" }}>
                {balance.toLocaleString("fr-FR")} FC
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--k-text-muted)",
              padding: 4,
            }}
          >
            <I.x size={22} />
          </button>
        </div>

        {submitted ? (
          <SubmittedNotice op={selected} amount={amount} onClose={onClose} />
        ) : (
          <>
            {/* Amount */}
            <div style={{ margin: "22px 0 18px" }}>
              <div
                className="k-overline"
                style={{ color: "var(--k-text-muted)", marginBottom: 8 }}
              >
                Montant
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "14px 16px",
                  background: "var(--k-bg)",
                  borderRadius: "var(--k-r-md)",
                  border: "1px solid var(--k-border-subtle)",
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount === 0 ? "" : amount.toLocaleString("fr-FR")}
                  onChange={(e) =>
                    setAmount(
                      parseInt(e.target.value.replace(/\D/g, "") || "0", 10),
                    )
                  }
                  placeholder="0"
                  style={{
                    flex: 1,
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    fontFamily: "var(--k-font-display)",
                    fontWeight: 700,
                    fontSize: 30,
                    letterSpacing: "-0.02em",
                    color: "var(--k-text-primary)",
                    minWidth: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--k-font-mono)",
                    fontWeight: 600,
                    fontSize: 16,
                    color: "var(--k-text-muted)",
                  }}
                >
                  FC
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(balance)}
                  className="k-btn k-btn-ghost k-btn-sm"
                  style={{ padding: "0 10px" }}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Operator picker — 2×2 grid */}
            <div className="k-overline" style={{ marginBottom: 8 }}>
              Envoyer vers
            </div>
            <div
              role="radiogroup"
              aria-label="Opérateur Mobile Money"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {MM_OPERATORS.map((op) => (
                <OperatorTile
                  key={op.id}
                  op={op}
                  selected={selectedId === op.id}
                  onClick={() => setSelectedId(op.id)}
                />
              ))}
            </div>

            {/* Masked number */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--k-r-md)",
                border: "1px solid var(--k-border-subtle)",
                background: "var(--k-surface)",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  className="k-caption"
                  style={{ color: "var(--k-text-muted)" }}
                >
                  Numéro
                </div>
                <div
                  className="k-price"
                  style={{ fontSize: 15, color: "var(--k-text-primary)" }}
                >
                  {selected.number}
                </div>
              </div>
              <button
                type="button"
                className="k-btn k-btn-ghost k-btn-sm"
                onClick={() => {
                  /* TODO: open phone-entry sub-step (deferred) */
                }}
              >
                <I.pencil size={13} /> Modifier
              </button>
            </div>

            {/* Récapitulatif */}
            <div
              style={{
                padding: "14px 16px",
                background: "var(--k-surface-primary)",
                borderRadius: "var(--k-r-md)",
                marginBottom: 18,
              }}
            >
              <div
                className="k-overline"
                style={{
                  color: "var(--k-primary-hover)",
                  marginBottom: 10,
                }}
              >
                Récapitulatif
              </div>
              <RecapRow
                label="Montant"
                value={`${amount.toLocaleString("fr-FR")} FC`}
              />
              <RecapRow
                label={`Frais (${(FEE_RATE * 100).toFixed(0)} %)`}
                value={`− ${fee.toLocaleString("fr-FR")} FC`}
                valueColor="var(--k-text-body)"
              />
              <div
                style={{
                  height: 1,
                  background: "var(--k-border-subtle)",
                  margin: "10px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontWeight: 700,
                }}
              >
                <span style={{ fontSize: 14 }}>Total à recevoir</span>
                <span
                  className="k-price"
                  style={{ color: "var(--k-success)", fontSize: 16 }}
                >
                  {receiving.toLocaleString("fr-FR")} FC
                </span>
              </div>
            </div>

            <button
              type="button"
              className="k-btn k-btn-primary k-btn-lg"
              style={{
                width: "100%",
                opacity: invalid ? 0.5 : 1,
                cursor: invalid ? "not-allowed" : "pointer",
              }}
              disabled={invalid}
              onClick={() => setSubmitted(true)}
            >
              Valider le paiement
            </button>
            <div
              className="k-caption"
              style={{
                textAlign: "center",
                marginTop: 10,
                color: "var(--k-text-muted)",
              }}
            >
              Délai : 2–5 minutes · sécurisé par KAYOU
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OperatorTile({
  op,
  selected,
  onClick,
}: {
  op: MMOperator;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        width: "100%",
        border: `2px solid ${selected ? op.color : "var(--k-border-subtle)"}`,
        background: selected ? `${op.color}0A` : "var(--k-surface)",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 140ms, background 140ms",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: op.color,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--k-font-display)",
          fontWeight: 700,
          fontSize: op.init.length > 1 ? 12 : 18,
          letterSpacing: op.init.length > 1 ? 0.4 : 0,
        }}
      >
        {op.init}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 600,
            fontSize: 14.5,
            color: "var(--k-text-primary)",
          }}
        >
          {op.name}
        </div>
      </div>
      {selected && (
        <div
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: op.color,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <I.check size={13} stroke={2.5} />
        </div>
      )}
    </button>
  );
}

function RecapRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        marginBottom: 4,
      }}
    >
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <span
        className="k-price"
        style={{ color: valueColor ?? "var(--k-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function SubmittedNotice({
  op,
  amount,
  onClose,
}: {
  op: MMOperator;
  amount: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: "32px 4px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--k-success-subtle)",
          color: "var(--k-success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <I.check size={32} stroke={2.5} />
      </div>
      <h3
        className="k-display-m"
        style={{ margin: "0 0 6px", fontSize: 20 }}
      >
        Demande enregistrée
      </h3>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 auto", maxWidth: 360 }}
      >
        {amount.toLocaleString("fr-FR")} FC en route vers {op.name}. Tu recevras
        une notification dès que le virement est reçu.
      </p>
      <button
        type="button"
        className="k-btn k-btn-primary"
        style={{ marginTop: 20, width: "100%" }}
        onClick={onClose}
      >
        Fermer
      </button>
    </div>
  );
}
