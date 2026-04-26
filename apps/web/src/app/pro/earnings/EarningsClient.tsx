"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { earningsApi, queryKeys } from "@kayu/api";
import type { TransactionType } from "@kayu/schemas";
import { ErrorState, I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MoneyChart } from "./MoneyChart";
import { TransactionRow } from "./TransactionRow";

type Filter = "ALL" | TransactionType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "Tout" },
  { id: "EARNING", label: "Gains" },
  { id: "BONUS", label: "Bonus" },
];

export function EarningsClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.earnings.summary,
    queryFn: () => earningsApi(apiClient).summary(),
    enabled: Boolean(user && user.role === "PROVIDER"),
  });

  const txParams = useMemo(
    () => (filter === "ALL" ? {} : { type: filter }),
    [filter],
  );
  const txQuery = useQuery({
    queryKey: queryKeys.earnings.transactions(txParams),
    queryFn: () => earningsApi(apiClient).transactions(txParams),
    enabled: Boolean(user && user.role === "PROVIDER"),
  });

  if (authLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  if (summaryQuery.isError) {
    return (
      <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
        <ErrorState
          title="Impossible de charger vos gains"
          subtitle="Vérifiez votre connexion puis réessayez."
          cta={{ label: "Réessayer", onClick: () => summaryQuery.refetch() }}
        />
      </div>
    );
  }

  const summary = summaryQuery.data?.summary;
  const transactions = txQuery.data?.transactions ?? [];
  const balance = summary?.balance ?? 0;
  const pending = summary?.pending ?? 0;
  const lifetime = summary?.lifetime ?? 0;
  const weeklyDays = summary?.weekly.days ?? [];
  const weeklyTotal = summary?.weekly.total ?? 0;
  const lastWeekTotal = summary?.weekly.lastWeekTotal ?? 0;
  const deltaPct = summary?.weekly.deltaPct ?? 0;
  return (
    <div style={{ padding: "8px 0 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            className="k-overline"
            style={{ color: "var(--k-accent)", marginBottom: 6 }}
          >
            Espace pro
          </div>
          <h1
            className="k-display-l"
            style={{ margin: 0, fontSize: 32, letterSpacing: "-0.02em" }}
          >
            Mes gains
          </h1>
          <div
            className="k-body-m"
            style={{ color: "var(--k-text-muted)", marginTop: 4 }}
          >
            Suivi des missions payees en especes et des confirmations en attente.
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: "14px 18px",
          borderRadius: "var(--k-r-lg)",
          background: "var(--k-surface-primary)",
          border: "1px solid #BAE6FD",
          color: "var(--k-text-body)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Politique de paiement MVP
        </div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>
          Le client regle directement le pro en especes a la fin de la mission.
          Les gains restent en attente tant que ce paiement n’est pas confirme.
        </div>
      </div>

      <div
        className="k-earnings-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 28,
        }}
      >
        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Balance + chart card */}
          <div
            style={{
              background: "var(--k-surface)",
              borderRadius: "var(--k-r-xl)",
              padding: "28px 28px 24px",
              boxShadow:
                "0 4px 14px -6px rgba(15,23,42,0.10), 0 1px 3px -1px rgba(15,23,42,0.05)",
            }}
          >
            <div
              className="k-overline"
              style={{ color: "var(--k-text-muted)", marginBottom: 8 }}
            >
              Gains confirmés
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 48,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                color: "var(--k-text-primary)",
              }}
            >
              <span className="k-num">{balance.toLocaleString("fr-FR")}</span>
              <span
                style={{
                  fontSize: 22,
                  color: "var(--k-text-muted)",
                  marginLeft: 6,
                  fontWeight: 600,
                }}
              >
                FC
              </span>
            </div>
            {(weeklyTotal > 0 || lastWeekTotal > 0) && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background:
                    deltaPct >= 0
                      ? "var(--k-success-subtle)"
                      : "var(--k-danger-subtle)",
                  color: deltaPct >= 0 ? "#047857" : "#BE123C",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--k-font-mono)",
                }}
              >
                <span>{deltaPct >= 0 ? "↑" : "↓"}</span>
                {Math.abs(deltaPct)}% cette semaine
              </div>
            )}

            <div
              style={{
                height: 1,
                background: "var(--k-border-subtle)",
                margin: "24px 0 22px",
              }}
            />

            <MoneyChart
              days={weeklyDays}
              total={weeklyTotal}
              lastWeekTotal={lastWeekTotal}
              deltaPct={deltaPct}
            />
          </div>

          {/* Transactions */}
          <div
            style={{
              background: "var(--k-surface)",
              borderRadius: "var(--k-r-xl)",
              padding: "20px 28px 24px",
              boxShadow:
                "0 4px 14px -6px rgba(15,23,42,0.10), 0 1px 3px -1px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--k-font-display)",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "var(--k-text-primary)",
                }}
              >
                Transactions
              </h2>
              <button
                type="button"
                className="k-btn k-btn-ghost k-btn-sm"
                onClick={() => toast.info("Export CSV — bientôt disponible")}
              >
                <I.fileText size={14} /> Export CSV
              </button>
            </div>

            {/* Filter chips */}
            <div
              role="tablist"
              aria-label="Filtrer les transactions"
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                      background: active
                        ? "var(--k-primary-subtle)"
                        : "var(--k-surface)",
                      color: active
                        ? "var(--k-primary-hover)"
                        : "var(--k-text-body)",
                      fontFamily: "var(--k-font-body)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 140ms var(--k-ease-std)",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {txQuery.isLoading ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--k-text-muted)",
                  fontSize: 13,
                }}
              >
                Chargement des transactions…
              </div>
            ) : txQuery.isError ? (
              <ErrorState
                title="Transactions indisponibles"
                subtitle="Réessayez dans un instant."
                cta={{ label: "Réessayer", onClick: () => txQuery.refetch() }}
              />
            ) : transactions.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--k-text-muted)",
                  fontSize: 13,
                }}
              >
                Pas encore de transactions. Tes gains apparaîtront ici dès ta
                première mission.
              </div>
            ) : (
              <div>
                {transactions.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    last={i === transactions.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StatTile
            label="Gains confirmés"
            value={`${balance.toLocaleString("fr-FR")} FC`}
            valueColor="var(--k-success)"
            caption="Paiement en espèces confirmé"
          />
          <StatTile
            label="En attente"
            value={`${pending.toLocaleString("fr-FR")} FC`}
            caption="Missions terminées sans paiement confirmé"
          />
          <StatTile
            label="Gains totaux"
            value={`${(lifetime / 1000).toFixed(0)}k FC`}
            caption="Historique des missions cash"
            muted
          />

          <div
            style={{
              background: "var(--k-surface-primary)",
              borderRadius: "var(--k-r-lg)",
              padding: "16px 18px",
              border: "1px solid #BAE6FD",
            }}
          >
            <div
              className="k-overline"
              style={{ color: "var(--k-primary-hover)", marginBottom: 6 }}
            >
              Suivi manuel
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--k-text-primary)",
              }}
            >
              Contrôle des confirmations
            </div>
            <div
              className="k-caption"
              style={{ color: "var(--k-text-muted)", marginTop: 4 }}
            >
              En cas d'écart, l'équipe KAYOU vérifie la mission et la
              confirmation du paiement en espèces.
            </div>
          </div>

          {/* Support */}
          <div
            style={{
              background: "var(--k-surface)",
              borderRadius: "var(--k-r-lg)",
              padding: "16px 18px",
              border: "1px solid var(--k-border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--k-surface-muted)",
                color: "var(--k-text-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <I.messageCircle size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--k-text-primary)",
                }}
              >
                Un souci de paiement ?
              </div>
              <div
                className="k-caption"
                style={{ color: "var(--k-text-muted)", marginTop: 2 }}
              >
                L'équipe KAYOU répond en moins d'une heure.
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @media (max-width: 960px) {
          .k-earnings-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatTile({
  label,
  value,
  caption,
  valueColor,
  muted,
}: {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--k-surface)",
        borderRadius: "var(--k-r-lg)",
        padding: "16px 18px",
        border: "1px solid var(--k-border-subtle)",
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.03), 0 1px 3px rgba(14,165,233,0.04)",
      }}
    >
      <div
        className="k-overline"
        style={{ color: "var(--k-text-muted)", marginBottom: 6 }}
      >
        {label}
      </div>
      <div
        className="k-price"
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 700,
          fontSize: 22,
          color:
            valueColor ?? (muted ? "var(--k-text-muted)" : "var(--k-text-primary)"),
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        className="k-caption"
        style={{ color: "var(--k-text-muted)", marginTop: 2 }}
      >
        {caption}
      </div>
    </div>
  );
}
