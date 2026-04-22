"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { I } from "@kayu/ui/web";
import {
  formatRelativeFR,
  formatWhen,
  fullAddress,
  initialsFromName,
  paymentStatusLabel,
  priceLabelFor,
  toV2Status,
  type V2Status,
} from "@/lib/booking-v2";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BookingDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  address?: string | null;
  city?: string | null;
  scheduledDate?: string | Date | null;
  createdAt?: string | Date | null;
  price?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  providerId?: string | null;
  clientId?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  clientNotes?: string | null;
  providerNotes?: string | null;
  provider?: {
    id?: string | null;
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
      avatar?: string | null;
    } | null;
  } | null;
  client?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  } | null;
  // visual overlays synthesized by caller
  progress?: string | null;
  reviewed?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  quote?: {
    lines: { label: string; qty: number; unit: string; unitPrice: number }[];
  } | null;
}

type BookingMutationInput = {
  status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isPaid?: true;
  paymentMethod?: "cash";
};

// ─── Timeline metadata ────────────────────────────────────────────────────

const TIMELINE_STEPS: Record<V2Status, string[]> = {
  upcoming: ["booked", "confirmed", "enroute", "inprogress", "done"],
  active: ["booked", "confirmed", "enroute", "inprogress", "done"],
  completed: ["booked", "confirmed", "enroute", "inprogress", "done", "paid"],
  cancelled: ["booked", "cancelled"],
};

type StepMeta = { label: string; icon: keyof typeof I };
const STEP_META: Record<string, StepMeta> = {
  booked: { label: "Réservation créée", icon: "calendar" },
  confirmed: { label: "Devis accepté", icon: "check" },
  enroute: { label: "En route", icon: "mapPin" },
  inprogress: { label: "Intervention", icon: "wrench" },
  done: { label: "Terminée", icon: "badgeCheck" },
  paid: { label: "Payée", icon: "coins" },
  cancelled: { label: "Annulée", icon: "x" },
};

const currentStepIndex = (
  backend: string,
  v2: V2Status,
  isPaid?: boolean | null,
): number => {
  if (v2 === "upcoming") return backend === "PENDING" ? 0 : 1;
  if (v2 === "active") return 3;
  if (v2 === "completed") return isPaid ? 5 : 4;
  if (v2 === "cancelled") return 1;
  return 0;
};

// ─── Main component ───────────────────────────────────────────────────────

export function BookingDetail({
  booking,
  perspective,
}: {
  booking: BookingDetailData;
  perspective: "client" | "pro";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const v2Status = toV2Status(booking.status);
  const isClient = perspective === "client";
  const steps = TIMELINE_STEPS[v2Status];
  const step = currentStepIndex(booking.status, v2Status, booking.isPaid);

  const counterparty = isClient
    ? {
        first: booking.provider?.user?.firstName ?? "",
        last: booking.provider?.user?.lastName ?? "",
        role: booking.provider?.profession ?? "Votre pro",
        verified: !!booking.provider?.user?.isVerified,
        rating: booking.rating,
        reviews: booking.reviewCount,
      }
    : {
        first: booking.client?.firstName ?? "",
        last: booking.client?.lastName ?? "",
        role: "Client",
        verified: false,
        rating: null,
        reviews: null,
      };

  const onBack = () => router.push(isClient ? "/bookings" : "/pro/requests");

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi(apiClient).cancel(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (data: BookingMutationInput) =>
      bookingsApi(apiClient).update(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
    },
  });

  const onConfirmPayment = () => {
    updateMutation.mutate({ isPaid: true, paymentMethod: "cash" });
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "8px 0 32px" }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            color: "var(--k-text-muted)",
            fontSize: 13,
            padding: "6px 2px",
            marginBottom: 12,
          }}
        >
          <I.arrowLeft size={14} /> {isClient ? "Mes réservations" : "Mes demandes"}
        </button>

        {/* Header row: id + title + price */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                className="k-caption"
                style={{
                  color: "var(--k-text-muted)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--k-font-mono)",
                }}
              >
                #{booking.id.slice(0, 8).toUpperCase()}
              </span>
              <BdStatusChip status={v2Status} />
            </div>
            <h1 className="k-display-m" style={{ margin: "0 0 6px" }}>
              {booking.title}
            </h1>
            <div className="k-body" style={{ color: "var(--k-text-muted)" }}>
              {formatWhen(booking.scheduledDate)} · {fullAddress(booking)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              className="k-caption"
              style={{
                color: "var(--k-text-muted)",
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {priceLabelFor(booking)}
            </div>
            <div
              className="k-price"
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
              }}
            >
              {(booking.price ?? 0).toLocaleString("fr-FR")} FC
            </div>
          </div>
        </div>

        {/* 2-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
          {/* Main column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <WebCard title="Suivi" count={`${step + 1}/${steps.length}`}>
              <Timeline steps={steps} step={step} progress={booking.progress ?? null} />
            </WebCard>

            <WebCard
              title="Devis"
              subtitle={booking.quote ? "Accepté par le client" : "Estimation initiale"}
            >
              <QuoteBreakdown booking={booking} isClient={isClient} />
            </WebCard>

            <WebCard title={isClient ? "Adresse d'intervention" : "Adresse client"}>
              <AddressCard booking={booking} isClient={isClient} />
            </WebCard>

            <WebCard title="Conversation">
              <ChatPreview isClient={isClient} onOpen={() => router.push("/messages")} />
              <button
                onClick={() => router.push("/messages")}
                className="k-btn k-btn-secondary"
                style={{ marginTop: 10, width: "100%" }}
              >
                Ouvrir la conversation <I.arrowRight size={13} />
              </button>
            </WebCard>
          </div>

          {/* Sidebar */}
          <aside
            style={{
              position: "sticky",
              top: 24,
              alignSelf: "start",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                borderRadius: "var(--k-r-lg)",
                padding: 20,
                boxShadow: "var(--k-e1)",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <CounterpartyCard
                  counterparty={counterparty}
                  onMessage={() => router.push("/messages")}
                />
              </div>
              <ActionButtons
                v2Status={v2Status}
                isClient={isClient}
                booking={booking}
                busy={cancelMutation.isPending || updateMutation.isPending}
                onMessage={() => router.push("/messages")}
                onReview={() =>
                  booking.providerId &&
                  router.push(
                    `/review/${booking.providerId}?bookingId=${booking.id}`,
                  )
                }
                onRebook={() =>
                  booking.providerId && router.push(`/providers/${booking.providerId}`)
                }
                onCancel={() => cancelMutation.mutate()}
                onComplete={() => updateMutation.mutate({ status: "COMPLETED" })}
                onConfirmPayment={onConfirmPayment}
              />
            </div>

            <div
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                borderRadius: "var(--k-r-lg)",
                padding: 20,
                boxShadow: "var(--k-e1)",
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontWeight: 600,
                  fontSize: 13,
                  margin: "0 0 10px",
                  color: "var(--k-text-muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Détails
              </h4>
              <MetaRow
                label="Réservation"
                value={`#${booking.id.slice(0, 8).toUpperCase()}`}
                mono
              />
              <MetaRow label="Créée" value={formatRelativeFR(booking.createdAt)} />
              <MetaRow
                label={isClient ? "Paiement" : "Etat du paiement"}
                value={paymentStatusLabel(booking)}
              />
              {!isClient && <MetaRow label="Zone" value={booking.city ?? "—"} />}
            </div>

            <div
              style={{
                padding: 14,
                background: "var(--k-surface-primary)",
                borderRadius: "var(--k-r-md)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <I.coins
                size={16}
                strokeColor="var(--k-primary)"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ fontSize: 12, color: "var(--k-text-body)", lineHeight: 1.5 }}>
                <strong>Paiement en espèces</strong>
                <div style={{ color: "var(--k-text-muted)", marginTop: 3 }}>
                  KAYOU n'encaisse pas encore le client. Le prestataire confirme le
                  règlement en espèces après la mission pour débloquer ses gains.
                </div>
                <button
                  onClick={() => router.push("/help")}
                  style={{
                    marginTop: 8,
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    color: "var(--k-primary-hover)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Signaler un problème
                </button>
              </div>
            </div>
          </aside>
        </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function WebCard({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 24,
        boxShadow: "var(--k-e1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h3 className="k-heading" style={{ margin: 0 }}>
            {title}
          </h3>
          {subtitle && (
            <div
              className="k-caption"
              style={{ color: "var(--k-text-muted)", marginTop: 3, fontSize: 12 }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {count && (
          <span
            className="k-caption"
            style={{
              color: "var(--k-text-muted)",
              fontFamily: "var(--k-font-mono)",
              fontSize: 12,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--k-border-subtle)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <span
        style={{
          color: "var(--k-text-primary)",
          fontWeight: 500,
          fontFamily: mono ? "var(--k-font-mono)" : "var(--k-font-body)",
          fontSize: mono ? 12 : 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function BdStatusChip({ status }: { status: V2Status }) {
  const map: Record<V2Status, { label: string; cls: string }> = {
    upcoming: { label: "À venir", cls: "k-chip-primary" },
    active: { label: "En cours", cls: "k-chip-success" },
    completed: { label: "Terminée", cls: "" },
    cancelled: { label: "Annulée", cls: "" },
  };
  const c = map[status];
  const style =
    status === "cancelled"
      ? { background: "var(--k-danger-subtle)", color: "#BE123C" }
      : undefined;
  return (
    <span className={`k-chip k-chip-sm ${c.cls}`} style={style}>
      {c.label}
    </span>
  );
}

function Timeline({
  steps,
  step,
  progress,
}: {
  steps: string[];
  step: number;
  progress: string | null;
}) {
  return (
    <div style={{ position: "relative", padding: "4px 0" }}>
      {steps.map((s, i) => {
        const meta = STEP_META[s];
        const done = i < step;
        const current = i === step;
        const Icon = I[meta.icon] ?? I.check;
        const isLast = i === steps.length - 1;
        return (
          <div
            key={s}
            style={{
              display: "flex",
              gap: 12,
              paddingBottom: isLast ? 0 : 16,
              position: "relative",
            }}
          >
            {!isLast && (
              <div
                style={{
                  position: "absolute",
                  left: 15,
                  top: 28,
                  bottom: 0,
                  width: 2,
                  background: done ? "var(--k-success)" : "var(--k-border)",
                }}
              />
            )}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done
                  ? "var(--k-success)"
                  : current
                    ? "var(--k-primary)"
                    : "var(--k-surface)",
                color: done || current ? "white" : "var(--k-text-muted)",
                border: `2px solid ${
                  done
                    ? "var(--k-success)"
                    : current
                      ? "var(--k-primary)"
                      : "var(--k-border)"
                }`,
                boxShadow: current ? "0 0 0 4px var(--k-primary-subtle)" : "none",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Icon size={14} stroke={2} />
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div
                style={{
                  fontWeight: current ? 600 : 500,
                  fontSize: 13.5,
                  color: done || current ? "var(--k-text-primary)" : "var(--k-text-muted)",
                }}
              >
                {meta.label}
              </div>
              {current && (
                <div
                  className="k-caption"
                  style={{
                    color: "var(--k-text-muted)",
                    marginTop: 2,
                    fontSize: 12,
                  }}
                >
                  {progress || "En cours · maintenant"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuoteBreakdown({
  booking,
  isClient,
}: {
  booking: BookingDetailData;
  isClient: boolean;
}) {
  const lines = booking.quote?.lines ?? [
    { label: "Diagnostic + déplacement", qty: 1, unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre", qty: 1.5, unit: "Heure", unitPrice: 8000 },
    { label: "Joint + raccord", qty: 1, unit: "Pièce", unitPrice: 2000 },
  ];
  const subtotal = lines.reduce((a, b) => a + b.qty * b.unitPrice, 0);
  const total = booking.price ?? subtotal;
  const commission = Math.round(total * 0.1);
  return (
    <div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid var(--k-border-subtle)",
            alignItems: "baseline",
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, color: "var(--k-text-primary)", fontWeight: 500 }}>
              {l.label}
            </div>
            <div
              className="k-caption"
              style={{ color: "var(--k-text-muted)", fontSize: 11 }}
            >
              {l.qty} × {l.unit}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-mono)",
              fontSize: 12,
              color: "var(--k-text-muted)",
            }}
          >
            {l.unitPrice.toLocaleString("fr-FR")} FC
          </div>
          <div
            className="k-price"
            style={{
              fontSize: 13,
              color: "var(--k-text-primary)",
              fontFamily: "var(--k-font-mono)",
            }}
          >
            {(l.qty * l.unitPrice).toLocaleString("fr-FR")} FC
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 10,
          paddingTop: 12,
          borderTop: "2px solid var(--k-text-primary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 14 }}>
          Total
        </span>
        <span
          className="k-price"
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.02em",
            color: "var(--k-text-primary)",
          }}
        >
          {total.toLocaleString("fr-FR")} FC
        </span>
      </div>
      {!isClient && (
        <>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--k-text-muted)" }}>Commission KAYOU (10%)</span>
            <span
              className="k-price"
              style={{ color: "var(--k-text-muted)", fontSize: 12 }}
            >
              −{commission.toLocaleString("fr-FR")} FC
            </span>
          </div>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--k-text-body)" }}>Votre payout</span>
            <span className="k-price" style={{ color: "var(--k-primary)", fontWeight: 700 }}>
              {(total - commission).toLocaleString("fr-FR")} FC
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function CounterpartyCard({
  counterparty,
  onMessage,
}: {
  counterparty: {
    first: string;
    last: string;
    role: string;
    verified: boolean;
    rating: number | null | undefined;
    reviews: number | null | undefined;
  };
  onMessage: () => void;
}) {
  const name = `${counterparty.first} ${counterparty.last}`.trim() || "—";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar style={{ width: 52, height: 52 }}>
        <AvatarFallback
          style={{
            background: "var(--k-primary)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {initialsFromName(counterparty.first, counterparty.last)}
        </AvatarFallback>
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="k-caption"
          style={{
            color: "var(--k-text-muted)",
            fontSize: 11,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          {counterparty.role}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 600,
            fontSize: 15.5,
            color: "var(--k-text-primary)",
            marginBottom: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {name}
          {counterparty.verified && (
            <I.badgeCheck size={14} strokeColor="var(--k-success)" />
          )}
        </div>
        {counterparty.rating != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <I.star size={12} strokeColor="var(--k-warning)" />
            <strong style={{ color: "var(--k-text-primary)" }}>
              {counterparty.rating.toFixed(1)}
            </strong>
            {counterparty.reviews != null && (
              <span style={{ color: "var(--k-text-muted)" }}>
                ({counterparty.reviews} avis)
              </span>
            )}
          </div>
        ) : (
          <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12 }}>
            Nouveau
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={iconBtn} title="Appeler">
          <I.phone size={15} />
        </button>
        <button onClick={onMessage} style={iconBtn} title="Message">
          <I.messageCircle size={15} />
        </button>
      </div>
    </div>
  );
}

function ActionButtons({
  v2Status,
  isClient,
  booking,
  busy,
  onMessage,
  onReview,
  onRebook,
  onCancel,
  onComplete,
  onConfirmPayment,
}: {
  v2Status: V2Status;
  isClient: boolean;
  booking: BookingDetailData;
  busy: boolean;
  onMessage: () => void;
  onReview: () => void;
  onRebook: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onConfirmPayment: () => void;
}) {
  if (v2Status === "upcoming") {
    return (
      <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
        <button
          onClick={onMessage}
          className="k-btn k-btn-primary"
          style={{ width: "100%" }}
        >
          <I.messageCircle size={15} />
          {isClient ? "Contacter le pro" : "Contacter le client"}
        </button>
        <button
          onClick={onCancel}
          className="k-btn k-btn-secondary"
          style={{ width: "100%" }}
          disabled={busy}
        >
          {isClient ? "Annuler" : "Se désister"}
        </button>
      </div>
    );
  }
  if (v2Status === "active") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!isClient && (
          <button
            onClick={onComplete}
            className="k-btn k-btn-primary k-btn-lg"
            style={{ width: "100%" }}
            disabled={busy}
          >
            <I.check size={15} /> Marquer comme terminée
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onMessage}
            className="k-btn k-btn-secondary"
            style={{ flex: 1 }}
          >
            <I.messageCircle size={14} /> Message
          </button>
          {isClient && (
            <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
              <I.mapPin size={14} /> Suivre
            </button>
          )}
        </div>
      </div>
    );
  }
  if (v2Status === "completed") {
    return (
      <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
        {!isClient && !booking.isPaid && (
          <button
            onClick={onConfirmPayment}
            className="k-btn k-btn-primary"
            style={{ width: "100%" }}
            disabled={busy}
          >
            <I.coins size={14} /> Confirmer le paiement reçu
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {isClient && !booking.reviewed && (
            <button onClick={onReview} className="k-btn k-btn-primary" style={{ flex: 1 }}>
              <I.star size={14} /> Laisser un avis
            </button>
          )}
          {isClient && booking.reviewed && (
            <button onClick={onRebook} className="k-btn k-btn-primary" style={{ flex: 1 }}>
              Réserver à nouveau
            </button>
          )}
          <button className="k-btn k-btn-secondary">
            <I.fileText size={14} /> Facture
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onMessage}
      className="k-btn k-btn-secondary"
      style={{ width: "100%" }}
    >
      Contacter
    </button>
  );
}

function AddressCard({
  booking,
  isClient,
}: {
  booking: BookingDetailData;
  isClient: boolean;
}) {
  const address = fullAddress(booking);
  const pinLabel = (booking.city ?? address.split(",").slice(-1)[0] ?? "Kinshasa").trim();
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <I.mapPin
          size={16}
          strokeColor="var(--k-text-muted)"
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--k-text-primary)",
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {address}
          </div>
          <div
            className="k-caption"
            style={{ color: "var(--k-text-muted)", fontSize: 11, marginTop: 2 }}
          >
            {isClient ? "Adresse d'intervention" : "Adresse client"}
          </div>
        </div>
      </div>
      <MiniMap label={pinLabel} />
    </div>
  );
}

export function MiniMap({ label }: { label: string }) {
  return (
    <div
      style={{
        height: 110,
        borderRadius: 10,
        background: "linear-gradient(135deg, #ECFDF5 0%, #DBEAFE 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 110"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d="M0 70 Q 100 30 200 60 T 400 50"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="3 3"
        />
        <path d="M0 90 L 400 90" stroke="#D1D5DB" strokeWidth="0.8" fill="none" />
        <circle cx="80" cy="55" r="3" fill="#9CA3AF" />
        <circle cx="250" cy="65" r="3" fill="#9CA3AF" />
        <circle cx="350" cy="40" r="3" fill="#9CA3AF" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--k-primary)",
          color: "white",
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <I.mapPin size={11} /> {label}
      </div>
      <button
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "white",
          border: "1px solid var(--k-border)",
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--k-text-primary)",
          cursor: "pointer",
        }}
      >
        Itinéraire ↗
      </button>
    </div>
  );
}

function ChatPreview({
  isClient,
  onOpen,
}: {
  isClient: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--k-surface-muted)",
        border: 0,
        padding: 12,
        borderRadius: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--k-primary)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <I.messageCircle size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            marginBottom: 2,
          }}
        >
          Conversation
        </div>
        <div
          className="k-caption"
          style={{
            color: "var(--k-text-muted)",
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isClient
            ? "Pro : « Je serai là dans 15 min, merci de patienter »"
            : "Client : « Merci, à tout à l'heure ! »"}
        </div>
      </div>
      <I.chevronRight size={14} strokeColor="var(--k-text-muted)" />
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid var(--k-border)",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--k-text-body)",
  cursor: "pointer",
  flexShrink: 0,
};
