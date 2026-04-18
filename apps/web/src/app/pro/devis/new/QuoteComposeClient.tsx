"use client";

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { I } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { useAuth } from "@/contexts/AuthContext";
import { findRequest, getPresets } from "@/components/pro/fixtures";
import type { InboundRequest, LineItemPreset } from "@/components/pro/types";

type Line = {
  id: number;
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

type StartDateKey = "today" | "tomorrow" | "week" | "custom";

const START_DATE_LABEL: Record<StartDateKey, string> = {
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  custom: "Choisir…",
};

const VALIDITY_OPTIONS = [3, 7, 14, 30] as const;

const UNIT_OPTIONS = ["Heure", "Forfait", "Pièce", "Jour", "m²"] as const;

function initialLines(req: InboundRequest | undefined): Line[] {
  if (!req) {
    return [{ id: 1, label: "", qty: 1, unit: "Forfait", unitPrice: 0 }];
  }
  return [
    { id: 1, label: "Diagnostic + déplacement", qty: 1, unit: "Forfait", unitPrice: 5000 },
    {
      id: 2,
      label: "Main-d'œuvre",
      qty: req.estimatedHours,
      unit: "Heure",
      unitPrice: 8000,
    },
  ];
}

export function QuoteComposeClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, isLoading } = useAuth();
  const requestId = search.get("requestId");
  const req = useMemo(() => findRequest(requestId), [requestId]);
  const presets = getPresets(req?.category);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const firstName = user?.firstName ?? "Pro";
  const [lines, setLines] = useState<Line[]>(() => initialLines(req));
  const [nextId, setNextId] = useState(() => lines.length + 1);
  const [message, setMessage] = useState(() => defaultMessage(req, firstName));
  const [startDate, setStartDate] = useState<StartDateKey>(() =>
    req?.when.toLowerCase().includes("aujourd") ? "today" : "tomorrow",
  );
  const [customDate, setCustomDate] = useState("");
  const [validityDays, setValidityDays] = useState<number>(7);
  const [discountPct, setDiscountPct] = useState(0);
  const [sent, setSent] = useState(false);

  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmt;
  const kayouFee = Math.round(total * 0.1);
  const payout = total - kayouFee;
  const vsBudget = req ? total - req.budget : 0;
  const hasEmptyLabel = lines.some((l) => l.label.trim() === "");
  const disabled = lines.length === 0 || total === 0 || hasEmptyLabel;

  const addPreset = (p: LineItemPreset) => {
    setLines((prev) => [
      ...prev,
      {
        id: nextId,
        label: p.label,
        qty: 1,
        unit: p.unit,
        unitPrice: p.unitPrice,
      },
    ]);
    setNextId((n) => n + 1);
  };

  const addBlank = () => {
    setLines((prev) => [
      ...prev,
      { id: nextId, label: "", qty: 1, unit: "Forfait", unitPrice: 0 },
    ]);
    setNextId((n) => n + 1);
  };

  const updateLine = (id: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  if (isLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  if (sent) {
    return (
      <QuoteSent
        req={req}
        total={total}
        validityDays={validityDays}
        onBack={() => router.push("/pro/requests")}
        onDashboard={() => router.push("/pro")}
      />
    );
  }

  return (
    <div
      className="k-quote-compose"
      style={{ padding: "8px 0 32px", maxWidth: 1080, margin: "0 auto" }}
    >
      <button
        type="button"
        onClick={() => router.push(req ? "/pro/requests" : "/pro")}
        style={{
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--k-text-muted)",
          fontSize: 13,
          padding: "6px 0",
          marginBottom: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I.arrowLeft size={14} /> {req ? "Retour aux demandes" : "Retour au dashboard"}
      </button>

      <div
        style={{
          marginBottom: 22,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--k-ink)",
            }}
          >
            Nouveau devis
          </h1>
          <div style={{ color: "var(--k-text-muted)", fontSize: 14, marginTop: 4 }}>
            {req ? (
              <>
                Pour <strong style={{ color: "var(--k-ink)" }}>{req.client.name}</strong>{" "}
                · {req.service}
              </>
            ) : (
              <>Compose un devis sans demande attachée.</>
            )}
          </div>
        </div>
      </div>

      <div
        className="k-quote-compose-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {req && <RequestContextCard req={req} />}

          {/* Line items */}
          <Panel
            title="Prestations"
            rightMeta={`${lines.length} ligne${lines.length > 1 ? "s" : ""}`}
          >
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 84px 104px 110px 32px",
                gap: 12,
                padding: "8px 4px",
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--k-text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--k-border-subtle)",
              }}
            >
              <div>Description</div>
              <div style={{ textAlign: "center" }}>Qté / unité</div>
              <div style={{ textAlign: "right" }}>Prix unit.</div>
              <div style={{ textAlign: "right" }}>Total</div>
              <div />
            </div>

            {lines.map((l) => (
              <WebLineRow
                key={l.id}
                line={l}
                canDelete={lines.length > 1}
                onChange={updateLine}
                onRemove={removeLine}
              />
            ))}

            {/* Add options */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addPreset(p)}
                  style={presetChipStyle}
                >
                  <I.plus size={12} /> {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={addBlank}
                style={{ ...presetChipStyle, borderStyle: "dashed" }}
              >
                <I.pencil size={12} /> Ligne personnalisée
              </button>
            </div>
          </Panel>

          {/* Discount + validity + start date */}
          <div
            className="k-quote-compose-details"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <Panel title="Début d'intervention">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(Object.keys(START_DATE_LABEL) as StartDateKey[]).map((key) => (
                  <PillButton
                    key={key}
                    active={startDate === key}
                    onClick={() => setStartDate(key)}
                  >
                    {START_DATE_LABEL[key]}
                  </PillButton>
                ))}
              </div>
              {startDate === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--k-border)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                  }}
                />
              )}
            </Panel>
            <Panel title="Validité du devis">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {VALIDITY_OPTIONS.map((d) => (
                  <PillButton
                    key={d}
                    active={validityDays === d}
                    onClick={() => setValidityDays(d)}
                  >
                    {d} jours
                  </PillButton>
                ))}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "var(--k-text-muted)",
                }}
              >
                Le client a {validityDays} jour{validityDays > 1 ? "s" : ""} pour répondre.
              </div>
            </Panel>
          </div>

          <Panel title="Réduction">
            <DiscountRow value={discountPct} onChange={setDiscountPct} />
          </Panel>

          <Panel title="Message au client">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Un petit mot personnel…"
              style={{
                width: "100%",
                minHeight: 110,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--k-border)",
                background: "var(--k-surface-muted)",
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--k-ink)",
                outline: "none",
                resize: "vertical",
              }}
            />
          </Panel>
        </div>

        {/* Sticky summary */}
        <aside
          className="k-quote-compose-summary"
          style={{ position: "sticky", top: 24 }}
        >
          <div
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              borderRadius: "var(--k-r-lg)",
              boxShadow: "var(--k-e2)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <I.fileText size={16} strokeColor="var(--k-text-muted)" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--k-text-muted)",
                  fontWeight: 600,
                }}
              >
                Récapitulatif
              </span>
            </div>

            <TotalRow label="Sous-total" value={subtotal} />
            {discountPct > 0 && (
              <TotalRow
                label={`Remise (${discountPct}%)`}
                value={-discountAmt}
                muted
              />
            )}

            <div
              style={{
                margin: "14px 0",
                padding: "14px 0",
                borderTop: "1px solid var(--k-border-subtle)",
                borderBottom: "1px solid var(--k-border-subtle)",
              }}
            >
              <TotalRow label="Total client" value={total} bold big />
              {req && <VsBudgetDelta vsBudget={vsBudget} budget={req.budget} />}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <TotalRow
                label="Commission KAYOU (10%)"
                value={-kayouFee}
                muted
                small
              />
              <TotalRow label="Votre payout" value={payout} big accent />
            </div>

            <button
              type="button"
              onClick={() => setSent(true)}
              disabled={disabled}
              className="k-btn k-btn-primary k-btn-lg"
              style={{
                width: "100%",
                marginTop: 18,
                opacity: disabled ? 0.55 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              Envoyer le devis <I.send size={15} />
            </button>

            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {req
                ? `Valable ${validityDays} jour${validityDays > 1 ? "s" : ""}. Le client peut accepter, refuser ou demander un ajustement.`
                : `Le devis est enregistré en brouillon jusqu'à ce qu'un·e client·e y soit associé·e.`}
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: "var(--k-r-md)",
              background: "var(--k-surface-primary)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <I.sparkles
              size={16}
              strokeColor="var(--k-primary)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ fontSize: 12, color: "var(--k-text-body)", lineHeight: 1.5 }}>
              <strong>Conseil KAYOU :</strong> les devis avec 3 lignes ou plus sont
              acceptés 2× plus souvent que les forfaits uniques.
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.k-quote-compose-grid) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          :global(.k-quote-compose-summary) {
            position: static !important;
          }
          :global(.k-quote-compose-details) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function RequestContextCard({ req }: { req: InboundRequest }) {
  const cat = tokens.portfolio[req.category] ?? tokens.portfolio.plomberie;
  return (
    <div
      style={{
        background: cat.bg,
        border: `1px solid ${cat.accent}30`,
        borderRadius: "var(--k-r-lg)",
        padding: 16,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: cat.accent,
          flexShrink: 0,
        }}
      >
        <I.wrench size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--k-ink)",
            marginBottom: 4,
          }}
        >
          {req.service}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--k-text-body)", lineHeight: 1.55 }}>
          <I.calendar
            size={12}
            style={{ verticalAlign: "-2px", marginRight: 4 }}
            strokeColor={cat.accent}
          />
          {req.when}
          <br />
          <I.mapPin
            size={12}
            style={{ verticalAlign: "-2px", marginRight: 4 }}
            strokeColor={cat.accent}
          />
          {req.address} · {req.distance} km
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12.5,
            color: "var(--k-text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Budget indicatif :{" "}
          <strong
            style={{
              color: "var(--k-ink)",
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {req.budget.toLocaleString("fr-FR")} FC
          </strong>
        </div>
      </div>
    </div>
  );
}

function WebLineRow({
  line,
  canDelete,
  onChange,
  onRemove,
}: {
  line: Line;
  canDelete: boolean;
  onChange: (id: number, patch: Partial<Line>) => void;
  onRemove: (id: number) => void;
}) {
  const total = line.qty * line.unitPrice;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 84px 104px 110px 32px",
        gap: 12,
        padding: "12px 4px",
        alignItems: "center",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}
    >
      <input
        value={line.label}
        onChange={(e) => onChange(line.id, { label: e.target.value })}
        placeholder="Description de la prestation"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="number"
          min={0}
          step={0.5}
          value={line.qty}
          onChange={(e) =>
            onChange(line.id, { qty: parseFloat(e.target.value) || 0 })
          }
          style={{
            ...inputStyle,
            width: 40,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <select
          value={line.unit}
          onChange={(e) => onChange(line.id, { unit: e.target.value })}
          style={{ ...inputStyle, padding: "6px 4px", fontSize: 12 }}
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <input
          type="number"
          min={0}
          step={500}
          value={line.unitPrice}
          onChange={(e) =>
            onChange(line.id, { unitPrice: parseInt(e.target.value) || 0 })
          }
          style={{
            ...inputStyle,
            width: 74,
            textAlign: "right",
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--k-text-muted)" }}>FC</span>
      </div>
      <div
        style={{
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--k-ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {total.toLocaleString("fr-FR")} FC
      </div>
      <button
        type="button"
        aria-label="Supprimer la ligne"
        disabled={!canDelete}
        onClick={() => onRemove(line.id)}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: "1px solid var(--k-border)",
          background: "white",
          cursor: canDelete ? "pointer" : "not-allowed",
          color: canDelete ? "var(--k-text-muted)" : "var(--k-text-subtle)",
          opacity: canDelete ? 1 : 0.4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I.trash size={13} />
      </button>
    </div>
  );
}

function Panel({
  title,
  rightMeta,
  children,
}: {
  title: string;
  rightMeta?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 20,
        boxShadow: "var(--k-e1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.01em",
            color: "var(--k-ink)",
          }}
        >
          {title}
        </h3>
        {rightMeta && (
          <span style={{ color: "var(--k-text-muted)", fontSize: 12 }}>{rightMeta}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        border: active
          ? "1px solid var(--k-primary)"
          : "1px solid var(--k-border)",
        background: active ? "var(--k-primary-subtle)" : "white",
        color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

function DiscountRow({
  value,
  onChange,
}: {
  value: number;
  onChange: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[0, 5, 10, 15].map((p) => (
          <PillButton key={p} active={value === p} onClick={() => onChange(p)}>
            {p === 0 ? "Aucune" : `-${p}%`}
          </PillButton>
        ))}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginLeft: "auto",
        }}
      >
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isNaN(n)) onChange(0);
            else onChange(Math.min(100, Math.max(0, n)));
          }}
          style={{
            ...inputStyle,
            width: 60,
            textAlign: "right",
            fontFamily: "var(--font-mono)",
          }}
        />
        <span style={{ color: "var(--k-text-muted)", fontSize: 13 }}>%</span>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  big,
  bold,
  muted,
  small,
  accent,
}: {
  label: string;
  value: number;
  big?: boolean;
  bold?: boolean;
  muted?: boolean;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: big ? "2px 0" : "3px 0",
      }}
    >
      <span
        style={{
          fontSize: small ? 12 : big ? 14 : 13,
          color: muted
            ? "var(--k-text-muted)"
            : accent
              ? "var(--k-primary-hover)"
              : "var(--k-text-body)",
          fontWeight: bold ? 600 : 500,
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: big ? "var(--font-display)" : "var(--font-mono)",
          fontSize: big ? 22 : small ? 13 : 14,
          fontWeight: bold || big ? 700 : 600,
          color: accent
            ? "var(--k-primary)"
            : muted
              ? "var(--k-text-muted)"
              : "var(--k-ink)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: big ? "-0.02em" : "-0.01em",
        }}
      >
        {value < 0 ? "−" : ""}
        {Math.abs(value).toLocaleString("fr-FR")} FC
      </span>
    </div>
  );
}

function VsBudgetDelta({ vsBudget, budget }: { vsBudget: number; budget: number }) {
  const over = vsBudget > 0;
  if (vsBudget === 0) return null;
  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 10px",
        borderRadius: 10,
        background: over ? "var(--k-warning-subtle)" : "var(--k-success-subtle)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <I.info
        size={14}
        strokeColor={over ? "var(--k-warning)" : "var(--k-success)"}
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <div
        style={{
          fontSize: 11.5,
          color: over ? "#92400E" : "#065F46",
          lineHeight: 1.5,
        }}
      >
        {over ? (
          <>
            <strong>+{vsBudget.toLocaleString("fr-FR")} FC</strong> au-dessus du budget
            client ({budget.toLocaleString("fr-FR")} FC). Expliquez la différence dans
            votre message.
          </>
        ) : (
          <>
            <strong>Dans le budget</strong> · {Math.abs(vsBudget).toLocaleString("fr-FR")}{" "}
            FC sous le budget indicatif.
          </>
        )}
      </div>
    </div>
  );
}

function QuoteSent({
  req,
  total,
  validityDays,
  onBack,
  onDashboard,
}: {
  req: InboundRequest | undefined;
  total: number;
  validityDays: number;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const firstName = req?.client.name.split(" ")[0] ?? "le client";
  return (
    <div
      style={{
        minHeight: 640,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "var(--k-success-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-success)",
          marginBottom: 20,
          boxShadow: "0 0 0 8px rgba(16,185,129,0.10)",
        }}
      >
        <I.check size={36} stroke={2.5} />
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 28,
          margin: "0 0 10px",
          letterSpacing: "-0.02em",
          color: "var(--k-ink)",
        }}
      >
        Devis envoyé !
      </h2>
      <p
        style={{
          color: "var(--k-text-muted)",
          maxWidth: 440,
          margin: "0 0 24px",
          fontSize: 15,
          lineHeight: 1.55,
        }}
      >
        {firstName} va recevoir votre devis et a {validityDays} jour
        {validityDays > 1 ? "s" : ""} pour répondre.
      </p>
      {req && (
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 14,
            padding: 16,
            width: "100%",
            maxWidth: 380,
            boxShadow: "var(--k-e1)",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--k-text-muted)",
                fontWeight: 500,
              }}
            >
              {req.service}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--k-ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {total.toLocaleString("fr-FR")} FC
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--k-text-muted)" }}>
            Envoyé à l'instant · en attente de réponse
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 10,
          width: "100%",
          maxWidth: 380,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="k-btn k-btn-primary k-btn-lg"
          style={{ flex: 1, minWidth: 160 }}
        >
          Voir mes demandes
        </button>
        <button
          type="button"
          onClick={onDashboard}
          className="k-btn k-btn-secondary k-btn-lg"
          style={{ flex: 1, minWidth: 160 }}
        >
          Retour au dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function defaultMessage(req: InboundRequest | undefined, pro: string): string {
  if (!req) {
    return `Bonjour, merci pour votre demande. Voici mon devis. — ${pro}`;
  }
  const clientFirst = req.client.name.split(" ")[0];
  return `Bonjour ${clientFirst}, merci pour votre demande. Voici mon devis pour « ${req.service} ». Je peux intervenir dès que ça vous arrange. — ${pro}`;
}

// ─── Shared inline styles ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--k-border)",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  background: "white",
  color: "var(--k-ink)",
  outline: "none",
  width: "100%",
};

const presetChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid var(--k-border)",
  background: "var(--k-surface-muted)",
  fontSize: 12.5,
  fontFamily: "var(--font-body)",
  color: "var(--k-text-body)",
  cursor: "pointer",
  fontWeight: 500,
};

