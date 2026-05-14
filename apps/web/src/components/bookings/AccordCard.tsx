// apps/web/src/components/bookings/AccordCard.tsx
"use client";

import type { FinalOffer } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { formatMoneyFc } from "@kayu/ui";
import { formatRelativeFR, toV2Status } from "@/lib/booking-v2";

type AccordBooking = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  price?: number | null;
  isPaid?: boolean | null;
  commissionPct?: number | null;
  commissionAmt?: number | null;
  providerNetAmt?: number | null;
  scheduledDate?: string | Date | null;
};

type AccordState = "empty" | "registered" | "locked";

function accordState(
  booking: AccordBooking,
  offer: FinalOffer | null,
): AccordState {
  if (booking.status === "COMPLETED" || booking.status === "CANCELLED")
    return "locked";
  if (offer) return "registered";
  return "empty";
}

function durationLabel(minutes: number | null | undefined): string {
  if (!minutes) return "Durée à confirmer";
  if (minutes <= 60) return "≈ 1 h";
  if (minutes <= 120) return "≈ 2 h";
  if (minutes <= 240) return "½ jour";
  return "Journée";
}

function CardHead({
  title,
  metaLabel,
  metaTone,
}: {
  title: string;
  metaLabel: string;
  metaTone: "warn" | "ok" | "neutral";
}) {
  const color =
    metaTone === "warn"
      ? "#92400E"
      : metaTone === "ok"
        ? "#047857"
        : "var(--k-text-muted)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 12,
        gap: 8,
      }}
    >
      <h3
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          fontSize: 14.5,
          margin: 0,
          color: "var(--k-text-primary)",
        }}
      >
        {title}
      </h3>
      <span
        className="k-overline"
        style={{ color, fontFamily: "var(--k-font-mono)" }}
      >
        {metaLabel}
      </span>
    </div>
  );
}

const cardShell: React.CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-lg)",
  padding: "16px 18px",
};

function EmptyClient({ estimate }: { estimate: number }) {
  return (
    <section style={cardShell}>
      <CardHead title="Accord" metaLabel="En attente" metaTone="warn" />
      <EmptyStack
        icon={<I.fileText size={20} strokeColor="var(--k-text-muted)" />}
        hl="En attente d'un accord"
        sl="Le pro revient vers toi pour confirmer le service, la durée et le prix."
        estimateLabel="Estimation initiale"
        estimateValue={estimate}
      />
    </section>
  );
}

function EmptyProvider({
  estimate,
  clientFirstName,
  onCreate,
}: {
  estimate: number;
  clientFirstName: string;
  onCreate: () => void;
}) {
  return (
    <section style={cardShell}>
      <CardHead title="Accord à enregistrer" metaLabel="À faire" metaTone="warn" />
      <EmptyStack
        icon={<I.fileText size={20} strokeColor="var(--k-text-muted)" />}
        hl={
          clientFirstName
            ? `Confirme l'accord avec ${clientFirstName}`
            : "Confirme l'accord avec le client"
        }
        sl="Saisis le service final, la durée, le prix et l'adresse. La réservation passera à Confirmée."
        estimateLabel="Estimation initiale du client"
        estimateValue={estimate}
      />
      <button
        onClick={onCreate}
        className="k-btn k-btn-primary"
        style={{ width: "100%", marginTop: 14 }}
      >
        <I.coins size={14} /> Enregistrer l'accord final
      </button>
    </section>
  );
}

function EmptyStack({
  icon,
  hl,
  sl,
  estimateLabel,
  estimateValue,
}: {
  icon: React.ReactNode;
  hl: string;
  sl: string;
  estimateLabel: string;
  estimateValue: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--k-text-primary)",
          marginBottom: 3,
        }}
      >
        {hl}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--k-text-muted)",
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        {sl}
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          background: "#F8FAFC",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          fontSize: 12.5,
        }}
      >
        <span style={{ color: "var(--k-text-muted)" }}>{estimateLabel}</span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            color: "var(--k-text-primary)",
          }}
        >
          {formatMoneyFc(estimateValue)}
        </span>
      </div>
    </div>
  );
}

function TitleBlock({
  title,
  description,
  priceLabel,
  price,
  struck,
}: {
  title: string;
  description?: string | null;
  priceLabel: string;
  price: number;
  struck?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--k-text-primary)",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--k-text-body)",
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          className="k-overline"
          style={{ fontFamily: "var(--k-font-mono)" }}
        >
          {priceLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: "var(--k-text-primary)",
            marginTop: 2,
            textDecoration: struck ? "line-through" : "none",
            textDecorationThickness: 1,
          }}
        >
          {formatMoneyFc(price)}
        </div>
      </div>
    </div>
  );
}

function KvGrid({
  rows,
  cols = 2,
}: {
  rows: { label: string; value: string; mono?: boolean }[];
  cols?: 2 | 3;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "12px 16px",
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px dashed var(--k-border-subtle)",
      }}
    >
      {rows.map((r) => (
        <div key={r.label}>
          <div
            className="k-overline"
            style={{ fontFamily: "var(--k-font-mono)" }}
          >
            {r.label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--k-text-primary)",
              fontWeight: 500,
              marginTop: 2,
              fontFamily: r.mono ? "var(--k-font-mono)" : "var(--k-font-body)",
            }}
          >
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function PayNote({
  paid,
  cancelled,
}: {
  paid?: boolean;
  cancelled?: boolean;
}) {
  const text = cancelled
    ? "Mission annulée. Aucune transaction."
    : paid
      ? "Réglé en espèces à la fin de la mission."
      : "Paiement en espèces à la fin de la mission.";
  const Icon = paid ? I.check : cancelled ? I.x : I.coins;
  return (
    <div
      style={{
        marginTop: 14,
        padding: "9px 12px",
        background: "#F8FAFC",
        borderRadius: 10,
        fontSize: 12,
        color: "var(--k-text-body)",
        display: "flex",
        gap: 7,
        alignItems: "center",
      }}
    >
      <Icon size={13} strokeColor="var(--k-text-muted)" />
      {text}
    </div>
  );
}

function CommissionBlock({
  pct,
  amt,
  net,
  labelTotal,
  labelNet,
}: {
  pct: number;
  amt: number;
  net: number;
  labelTotal: string;
  labelNet: string;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--k-border-subtle)",
        display: "grid",
        gap: 5,
        fontSize: 12.5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--k-text-muted)" }}>
          {labelTotal} ({pct} %)
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            color: "var(--k-text-primary)",
          }}
        >
          −{formatMoneyFc(amt)}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--k-text-body)", fontWeight: 600 }}>
          {labelNet}
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            color: "var(--k-success)",
            fontSize: 14,
          }}
        >
          {formatMoneyFc(net)}
        </span>
      </div>
    </div>
  );
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <button
        onClick={onClick}
        style={{
          background: "transparent",
          border: 0,
          color: "var(--k-text-primary)",
          fontSize: 12.5,
          fontWeight: 600,
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          textDecoration: "underline",
          textUnderlineOffset: 3,
          textDecorationThickness: 1,
          textDecorationColor: "var(--k-text-subtle)",
        }}
      >
        <I.pencil size={12} /> Ajuster l'accord
      </button>
    </div>
  );
}

export function AccordCard({
  booking,
  offer,
  perspective,
  isDesktop,
  paidAt,
  onCreate,
  onAdjust,
  clientFirstName,
}: {
  booking: AccordBooking;
  offer: FinalOffer | null;
  perspective: "client" | "pro";
  isDesktop: boolean;
  paidAt?: string | Date | null;
  onCreate: () => void;
  onAdjust: () => void;
  clientFirstName: string;
}) {
  const isClient = perspective === "client";
  const v2 = toV2Status(booking.status);
  const state = accordState(booking, offer);
  const estimate = booking.price ?? 0;

  if (state === "empty") {
    if (v2 === "cancelled") {
      return (
        <section style={cardShell}>
          <CardHead title="Accord" metaLabel="Non conclu" metaTone="neutral" />
          <EmptyStack
            icon={<I.x size={20} strokeColor="var(--k-text-muted)" />}
            hl="Aucun accord enregistré"
            sl="La mission a été annulée avant qu'un accord ne soit conclu."
            estimateLabel="Estimation initiale"
            estimateValue={estimate}
          />
        </section>
      );
    }
    if (isClient) return <EmptyClient estimate={estimate} />;
    return (
      <EmptyProvider
        estimate={estimate}
        clientFirstName={clientFirstName}
        onCreate={onCreate}
      />
    );
  }

  // registered or locked
  const title = offer?.title ?? booking.title ?? "Service";
  const description = offer?.description ?? booking.description ?? null;
  const price = offer?.price ?? booking.price ?? 0;
  const duration = offer?.duration ?? null;
  const isLocked = state === "locked";
  const isCancelled = v2 === "cancelled";
  const pct =
    offer?.commissionPct ?? booking.commissionPct ?? 10;
  const amt =
    offer?.commissionAmt ??
    booking.commissionAmt ??
    Math.round((price * pct) / 100);
  const net = offer?.providerNetAmt ?? booking.providerNetAmt ?? price - amt;

  // labels
  const headerLabel = isLocked
    ? isCancelled
      ? "Annulé"
      : "Clôturé"
    : "Confirmé";
  const headerTone = isLocked ? "neutral" : "ok";
  const priceLabel = isLocked
    ? isClient
      ? booking.isPaid
        ? "Payé"
        : isCancelled
          ? "Annulée"
          : "À régler"
      : booking.isPaid
        ? "Encaissé"
        : isCancelled
          ? "Annulée"
          : "À encaisser"
    : "Prix convenu";

  const kvRows: { label: string; value: string; mono?: boolean }[] = isLocked
    ? [
        { label: "Durée", value: durationLabel(duration) },
        {
          label: booking.isPaid ? "Payé le" : "Date",
          value: formatRelativeFR(paidAt ?? booking.scheduledDate ?? null),
        },
      ]
    : [
        { label: "Durée", value: durationLabel(duration) },
        {
          label: "Confirmé",
          value: formatRelativeFR(
            (offer?.acceptedAt as Date | string | null | undefined) ??
              (offer?.createdAt as Date | string | null | undefined) ??
              null,
          ),
        },
      ];

  if (isDesktop) {
    kvRows.push({
      label: "Référence",
      value: `#${booking.id.slice(0, 8).toUpperCase()}`,
      mono: true,
    });
  }

  return (
    <section style={cardShell}>
      <CardHead
        title="Accord final"
        metaLabel={headerLabel}
        metaTone={headerTone}
      />
      <TitleBlock
        title={title}
        description={description}
        priceLabel={priceLabel}
        price={price}
        struck={isCancelled}
      />
      <KvGrid rows={kvRows} cols={isDesktop ? 3 : 2} />
      <PayNote paid={!!booking.isPaid && isLocked} cancelled={isCancelled} />
      {!isClient && (
        <CommissionBlock
          pct={pct}
          amt={amt}
          net={net}
          labelTotal="Commission KAYOU"
          labelNet={isLocked ? "Gain net" : "Gain net estimé"}
        />
      )}
      {!isClient && !isLocked && <EditLink onClick={onAdjust} />}
    </section>
  );
}
