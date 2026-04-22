"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { earningsApi, queryKeys } from "@kayu/api";
import type { CreatePayoutDto, CreatePayoutResponse } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { MM_OPERATORS, type MMOperator } from "./fixtures";

// Fee preview is a client-side placeholder (DS08 spec: flat 1%). The real fee
// is set server-side; this preview helps the pro pick an amount.
const FEE_RATE = 0.01;

export function PayoutSheet({
  open,
  onClose,
  balance,
  defaultPhone,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  defaultPhone: string | null;
}) {
  const [amount, setAmount] = useState(balance);
  const [selected, setSelected] = useState<MMOperator>(MM_OPERATORS[0]);
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [result, setResult] = useState<CreatePayoutResponse | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreatePayoutDto) =>
      earningsApi(apiClient).createPayout(data),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.earnings.summary });
      void queryClient.invalidateQueries({
        queryKey: ["earnings", "transactions"],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.earnings.payouts });
    },
  });

  useEffect(() => {
    if (open) {
      setAmount(balance);
      setSelected(MM_OPERATORS[0]);
      setPhone(defaultPhone ?? "");
      setResult(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, balance, defaultPhone]);

  const fee = useMemo(() => Math.round(amount * FEE_RATE), [amount]);
  const receiving = amount - fee;
  const invalid =
    amount <= 0 ||
    amount > balance ||
    phone.trim().length < 8 ||
    mutation.isPending;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Demander un retrait manuel"
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
              Demander un retrait manuel
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

        {result ? (
          <SubmittedNotice
            op={selected}
            amount={amount}
            reference={result.payout.reference ?? "PSP en attente"}
            onClose={onClose}
          />
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
                  selected={selected.id === op.id}
                  onClick={() => setSelected(op)}
                />
              ))}
            </div>

            {/* Phone number */}
            <div style={{ marginBottom: 18 }}>
              <div
                className="k-overline"
                style={{ color: "var(--k-text-muted)", marginBottom: 8 }}
              >
                Numéro
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 810 123 742"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "var(--k-r-md)",
                  border: "1px solid var(--k-border-subtle)",
                  background: "var(--k-surface)",
                  fontFamily: "var(--k-font-mono)",
                  fontSize: 15,
                  color: "var(--k-text-primary)",
                  outline: "none",
                }}
              />
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

            {mutation.isError && (
              <div
                className="k-caption"
                style={{
                  color: "var(--k-danger)",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Impossible d'enregistrer la demande. Réessayez."}
              </div>
            )}

            <button
              type="button"
              className="k-btn k-btn-primary k-btn-lg"
              style={{
                width: "100%",
                opacity: invalid ? 0.5 : 1,
                cursor: invalid ? "not-allowed" : "pointer",
              }}
              disabled={invalid}
              onClick={() =>
                mutation.mutate({
                  operator: selected.id,
                  amount,
                  phone: phone.trim(),
                })
              }
            >
              {mutation.isPending ? "Enregistrement…" : "Valider la demande"}
            </button>
            <div
              className="k-caption"
              style={{
                textAlign: "center",
                marginTop: 10,
                color: "var(--k-text-muted)",
              }}
            >
              Traitement manuel KAYOU avant envoi Mobile Money
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
  reference,
  onClose,
}: {
  op: MMOperator;
  amount: number;
  reference: string;
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
        {amount.toLocaleString("fr-FR")} FC ont ete enregistres pour verification
        manuelle avant envoi vers {op.name}.
      </p>
      <div
        className="k-caption"
        style={{
          color: "var(--k-text-subtle)",
          fontFamily: "var(--k-font-mono)",
          marginTop: 10,
        }}
      >
        Réf : {reference}
      </div>
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
