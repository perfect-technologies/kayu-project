"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { I } from "@kayu/ui/web";
import { queryKeys, quotesApi } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function QuoteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [confirming, setConfirming] = useState<"accept" | "decline" | null>(
    null,
  );

  const quoteQuery = useQuery({
    queryKey: queryKeys.quotes.detail(id),
    queryFn: () => quotesApi(apiClient).getByIdForClient(id),
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: () => quotesApi(apiClient).accept(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.mine });
      toast.success("Devis accepté — réservation créée");
      router.push(`/bookings/${res.booking.id}`);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => quotesApi(apiClient).decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
      toast.success("Devis refusé");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    },
  });

  if (isLoading || quoteQuery.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement du devis…
      </div>
    );
  }

  if (quoteQuery.isError) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <div style={{ color: "var(--k-danger)", fontWeight: 600, marginBottom: 10 }}>
          Impossible de charger le devis.
        </div>
        <button
          type="button"
          className="k-btn k-btn-secondary k-btn-sm"
          onClick={() => quoteQuery.refetch()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const quote = quoteQuery.data?.quote;
  if (!quote) return null;

  const pro = quote.provider;
  const proName = [pro?.user.firstName, pro?.user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Prestataire";
  const canAct = quote.status === "SENT";
  const expired = quote.status === "EXPIRED";
  const accepted = quote.status === "ACCEPTED";
  const declined = quote.status === "DECLINED";
  const pending = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 48px" }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--k-text-muted)",
          fontSize: 13,
          padding: "6px 0",
          marginBottom: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I.arrowLeft size={14} /> Retour
      </button>

      {/* Status banner */}
      <StatusBanner status={quote.status} />

      <header style={{ margin: "18px 0 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--k-text-muted)",
            marginBottom: 6,
          }}
        >
          Devis reçu
        </div>
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
          {quote.jobRequest?.service ?? "Mission"}
        </h1>
      </header>

      {/* Provider card */}
      <section
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 18,
          marginBottom: 16,
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            background: pro?.user.avatar ? undefined : "var(--k-surface-muted)",
            backgroundImage: pro?.user.avatar ? `url(${pro.user.avatar})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-text-muted)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {!pro?.user.avatar ? proName.charAt(0) || "?" : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 16,
              color: "var(--k-ink)",
            }}
          >
            {proName}
          </div>
          {pro ? (
            <div style={{ fontSize: 13, color: "var(--k-text-muted)" }}>
              {pro.profession}
              {pro.user.city ? ` · ${pro.user.city}` : ""}
            </div>
          ) : null}
        </div>
      </section>

      {/* Message */}
      {quote.message ? (
        <section
          style={{
            background: "var(--k-surface-primary)",
            borderRadius: "var(--k-r-md)",
            padding: 14,
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--k-ink)",
            whiteSpace: "pre-wrap",
          }}
        >
          {quote.message}
        </section>
      ) : null}

      {/* Lines */}
      <section
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--k-border-subtle)",
            fontWeight: 600,
            fontSize: 14,
            color: "var(--k-ink)",
          }}
        >
          Détail
        </div>
        {quote.lines.map((line, i) => (
          <div
            key={line.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              padding: "12px 16px",
              borderBottom:
                i === quote.lines.length - 1
                  ? "none"
                  : "1px solid var(--k-border-subtle)",
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "var(--k-ink)", fontWeight: 500 }}>
                {line.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 2 }}>
                {line.qty} × {line.unitPrice.toLocaleString("fr-FR")} FC /{" "}
                {line.unit}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--k-ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(line.qty * line.unitPrice).toLocaleString("fr-FR")} FC
            </div>
          </div>
        ))}

        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--k-border-subtle)",
            background: "var(--k-surface-muted)",
          }}
        >
          <Row label="Sous-total" value={quote.subtotal} />
          {quote.discountAmt > 0 ? (
            <Row
              label={`Remise (${quote.discountPct}%)`}
              value={-quote.discountAmt}
              muted
            />
          ) : null}
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--k-border-subtle)",
            }}
          >
            <Row label="Total à payer" value={quote.total} big />
          </div>
        </div>
      </section>

      {/* Metadata */}
      <section
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--k-text-muted)",
        }}
      >
        <Meta
          icon={<I.calendar size={14} />}
          label="Début"
          value={formatStartDate(quote.startDateKind)}
        />
        <Meta
          icon={<I.info size={14} />}
          label="Validité"
          value={`${quote.validityDays} jour${quote.validityDays > 1 ? "s" : ""}`}
        />
        {quote.expiresAt ? (
          <Meta
            icon={<I.info size={14} />}
            label="Expire le"
            value={new Date(quote.expiresAt).toLocaleDateString("fr-FR")}
          />
        ) : null}
      </section>

      {/* Actions */}
      {canAct ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="k-btn k-btn-secondary k-btn-lg"
            disabled={pending}
            onClick={() => setConfirming("decline")}
            style={{ flex: 1, minWidth: 140 }}
          >
            Refuser
          </button>
          <button
            type="button"
            className="k-btn k-btn-primary k-btn-lg"
            disabled={pending}
            onClick={() => setConfirming("accept")}
            style={{ flex: 2, minWidth: 180 }}
          >
            {pending ? "En cours…" : `Accepter · ${quote.total.toLocaleString("fr-FR")} FC`}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: 14,
            background: accepted
              ? "var(--k-success-subtle)"
              : expired || declined
                ? "var(--k-surface-muted)"
                : "var(--k-surface-muted)",
            borderRadius: "var(--k-r-md)",
            color: accepted ? "#065F46" : "var(--k-text-muted)",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {accepted
            ? "Devis accepté — votre mission est confirmée."
            : declined
              ? "Vous avez refusé ce devis."
              : expired
                ? "Ce devis a expiré."
                : "Ce devis est en brouillon."}
        </div>
      )}

      {confirming ? (
        <ConfirmDialog
          mode={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            if (confirming === "accept") acceptMutation.mutate();
            else declineMutation.mutate();
            setConfirming(null);
          }}
        />
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  big,
  muted,
}: {
  label: string;
  value: number;
  big?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "3px 0",
      }}
    >
      <span
        style={{
          fontSize: big ? 14 : 13,
          color: muted ? "var(--k-text-muted)" : "var(--k-text-body)",
          fontWeight: big ? 600 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: big ? "var(--font-display)" : "var(--font-mono)",
          fontSize: big ? 20 : 14,
          fontWeight: 700,
          color: muted ? "var(--k-text-muted)" : "var(--k-ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value < 0 ? "−" : ""}
        {Math.abs(value).toLocaleString("fr-FR")} FC
      </span>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span>
        {label} : <strong style={{ color: "var(--k-ink)" }}>{value}</strong>
      </span>
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    DRAFT: {
      label: "Brouillon",
      bg: "var(--k-surface-muted)",
      fg: "var(--k-text-muted)",
    },
    SENT: {
      label: "En attente de votre réponse",
      bg: "var(--k-primary-subtle)",
      fg: "var(--k-primary-hover)",
    },
    ACCEPTED: {
      label: "Devis accepté",
      bg: "var(--k-success-subtle)",
      fg: "#065F46",
    },
    DECLINED: {
      label: "Devis refusé",
      bg: "var(--k-surface-muted)",
      fg: "var(--k-text-muted)",
    },
    EXPIRED: {
      label: "Devis expiré",
      bg: "var(--k-warning-subtle)",
      fg: "#92400E",
    },
  };
  const entry = map[status] ?? map.SENT;
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: entry.bg,
        color: entry.fg,
        fontWeight: 600,
        fontSize: 12,
        display: "inline-block",
      }}
    >
      {entry.label}
    </div>
  );
}

function ConfirmDialog({
  mode,
  onCancel,
  onConfirm,
}: {
  mode: "accept" | "decline";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--k-surface)",
          borderRadius: "var(--k-r-lg)",
          padding: 20,
          maxWidth: 380,
          width: "100%",
          boxShadow: "var(--k-e3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--k-ink)",
          }}
        >
          {mode === "accept" ? "Accepter ce devis ?" : "Refuser ce devis ?"}
        </h3>
        <p style={{ color: "var(--k-text-muted)", fontSize: 14, margin: "0 0 18px" }}>
          {mode === "accept"
            ? "Une réservation sera automatiquement créée. Cette action est définitive."
            : "Le pro sera notifié de votre refus. Cette action est définitive."}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            className="k-btn k-btn-secondary"
            style={{ flex: 1 }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              mode === "accept"
                ? "k-btn k-btn-primary"
                : "k-btn k-btn-secondary"
            }
            style={{ flex: 1 }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function formatStartDate(kind: string): string {
  if (kind === "today") return "Aujourd'hui";
  if (kind === "tomorrow") return "Demain";
  if (kind === "this_week" || kind === "week") return "Cette semaine";
  const parsed = new Date(kind);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("fr-FR");
  }
  return kind;
}
