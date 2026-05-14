// apps/web/src/components/bookings/FinalOfferDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { finalOffersApi } from "@kayu/api";
import { formatMoneyFc } from "@kayu/ui";
import { I } from "@kayu/ui/web";

type CreateFinalOfferInput = Parameters<
  ReturnType<typeof finalOffersApi>["create"]
>[0];

export type FinalOfferDialogInitialValues = {
  title?: string;
  description?: string;
  price?: number | string;
  durationHours?: number | string;
  scheduledDate?: Date | string;
  address?: string;
  city?: string;
  notes?: string;
};

export type FinalOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  clientId: string;
  conversationId?: string;
  bookingId?: string;
  initialValues?: FinalOfferDialogInitialValues;
  heading?: string;
  subheading?: string;
  submitLabel?: string;
  onSubmit: (offer: CreateFinalOfferInput) => Promise<unknown>;
  busy: boolean;
  commissionPct?: number;
  clientFirstName?: string;
};

const DURATION_OPTIONS: { key: string; label: string; minutes: number }[] = [
  { key: "1h", label: "1 h", minutes: 60 },
  { key: "2h", label: "2 h", minutes: 120 },
  { key: "half", label: "½ jour", minutes: 240 },
  { key: "day", label: "Journée", minutes: 480 },
];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDateTimeLocalValue(value: Date | string | undefined) {
  const d = value instanceof Date ? value : value ? new Date(value) : defaultDate();
  if (Number.isNaN(d.getTime())) return toDateTimeLocalValue(defaultDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nearestDurationKey(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 90) return "1h";
  if (minutes <= 180) return "2h";
  if (minutes <= 360) return "half";
  return "day";
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isDesktop;
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: "var(--k-text-muted)",
  fontFamily: "var(--k-font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
  fontWeight: 600,
};

const optStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontWeight: 500,
  fontSize: 10.5,
  color: "var(--k-text-subtle)",
  marginLeft: 6,
  textTransform: "none",
  letterSpacing: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-md)",
  background: "var(--k-surface)",
  color: "var(--k-text-primary)",
  fontFamily: "var(--k-font-body)",
  fontSize: 14,
  minHeight: 42,
  boxSizing: "border-box",
  outline: "none",
};

export function FinalOfferDialog({
  open,
  onOpenChange,
  providerId,
  clientId,
  conversationId,
  bookingId,
  initialValues,
  heading,
  subheading,
  submitLabel,
  onSubmit,
  busy,
  commissionPct = 10,
  clientFirstName,
}: FinalOfferDialogProps) {
  const isDesktop = useIsDesktop();
  const adjusting = !!initialValues?.title;
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(
    initialValues?.price != null ? String(initialValues.price) : "",
  );
  const [durationKey, setDurationKey] = useState(() =>
    nearestDurationKey(
      initialValues?.durationHours != null
        ? Number(String(initialValues.durationHours).replace(",", ".")) * 60
        : null,
    ),
  );
  const [scheduledDate, setScheduledDate] = useState(
    toDateTimeLocalValue(initialValues?.scheduledDate),
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "Kinshasa");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setPrice(initialValues?.price != null ? String(initialValues.price) : "");
    setDurationKey(
      nearestDurationKey(
        initialValues?.durationHours != null
          ? Number(String(initialValues.durationHours).replace(",", ".")) * 60
          : null,
      ),
    );
    setScheduledDate(toDateTimeLocalValue(initialValues?.scheduledDate));
    setAddress(initialValues?.address ?? "");
    setCity(initialValues?.city ?? "Kinshasa");
    setNotes(initialValues?.notes ?? "");
    setFormError(null);
  }, [open, initialValues]);

  const parsedPrice = useMemo(() => Number(price), [price]);
  const commission = useMemo(() => {
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return 0;
    return Math.round((parsedPrice * commissionPct) / 100);
  }, [parsedPrice, commissionPct]);
  const net = Math.max(0, parsedPrice - commission);

  if (!open) return null;

  const dialogTitle =
    heading ??
    (adjusting
      ? "Ajuster l'accord"
      : clientFirstName
        ? `Confirme l'accord avec ${clientFirstName}`
        : "Confirme l'accord");
  const dialogSub =
    subheading ??
    (adjusting
      ? "L'accord précédent sera remplacé par cette mise à jour."
      : "Indique ce que tu vas faire, la durée, le prix convenu et l'adresse. Le client recevra une confirmation immédiate.");
  const dialogCrumb = `ACCORD FINAL · ${adjusting ? "AJUSTEMENT" : "NOUVEAU"}`;
  const submit = async () => {
    const minutes =
      DURATION_OPTIONS.find((o) => o.key === durationKey)?.minutes ?? 60;
    const parsedScheduledDate = new Date(scheduledDate);
    if (!title.trim() || title.trim().length < 3) {
      setFormError("Indique le service convenu (3 caractères min).");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Indique un prix valide en FC.");
      return;
    }
    if (!scheduledDate || Number.isNaN(parsedScheduledDate.getTime())) {
      setFormError("Choisis une date et une heure valides.");
      return;
    }
    setFormError(null);
    await onSubmit({
      providerId,
      clientId,
      conversationId,
      bookingId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      duration: minutes,
      scheduledDate: parsedScheduledDate,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod: "cash",
    });
    onOpenChange(false);
  };

  const headerBlock = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        padding: isDesktop ? "18px 20px 0" : "8px 18px 0",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="k-overline" style={{ fontFamily: "var(--k-font-mono)" }}>
          {dialogCrumb}
        </div>
        <h2
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: isDesktop ? 22 : 20,
            color: "var(--k-text-primary)",
            margin: "4px 0 0",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
          }}
        >
          {dialogTitle}
        </h2>
        <p
          className="k-body-m"
          style={{ color: "var(--k-text-muted)", margin: "4px 0 0", fontSize: 12.5 }}
        >
          {dialogSub}
        </p>
      </div>
      <button
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
        style={{
          border: "1px solid var(--k-border)",
          background: "var(--k-surface)",
          borderRadius: "var(--k-r-md)",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--k-text-body)",
        }}
      >
        <I.x size={16} />
      </button>
    </div>
  );

  const fields = (
    <div style={{ padding: isDesktop ? "14px 20px 0" : "14px 18px 0" }}>
      <div>
        <span style={labelStyle}>Service</span>
        <input
          className="k-input"
          style={inputStyle}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setFormError(null);
          }}
          placeholder="Service convenu"
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>
          Description<span style={optStyle}>facultatif</span>
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte"
          rows={3}
          style={{
            ...inputStyle,
            minHeight: 60,
            resize: "vertical",
            fontFamily: "var(--k-font-body)",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <span style={labelStyle}>Prix convenu</span>
          <div
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              padding: 0,
              paddingLeft: 12,
              paddingRight: 8,
            }}
          >
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setFormError(null);
              }}
              placeholder="35 000"
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                fontSize: 14,
                fontFamily: "var(--k-font-body)",
                color: "var(--k-text-primary)",
                background: "transparent",
                padding: "10px 0",
                minWidth: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--k-font-mono)",
                fontSize: 11.5,
                color: "var(--k-text-muted)",
              }}
            >
              FC
            </span>
          </div>
        </div>
        <div>
          <span style={labelStyle}>Durée</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DURATION_OPTIONS.map((opt) => {
              const on = durationKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setDurationKey(opt.key)}
                  style={{
                    padding: "8px 11px",
                    border: `1px solid ${on ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: on ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: on ? "#fff" : "var(--k-text-body)",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>Date et heure</span>
        <input
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 200px" : "1fr",
          gap: 10,
        }}
      >
        <div>
          <span style={labelStyle}>
            Adresse<span style={optStyle}>facultatif</span>
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. de la Paix, n° 24"
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Commune</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Gombe"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>
          Précision utile<span style={optStyle}>facultatif</span>
        </span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Portail bleu, en face de la pharmacie Wenge."
          style={inputStyle}
        />
      </div>
      {/* Résumé */}
      <div
        style={{
          marginTop: 18,
          padding: 14,
          background: "#F8FAFC",
          borderRadius: "var(--k-r-lg)",
        }}
      >
        <div className="k-overline" style={{ fontFamily: "var(--k-font-mono)" }}>
          Résumé pour toi
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 12px",
            marginTop: 8,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--k-text-muted)" }}>Total convenu</span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-mono)",
              color: "var(--k-text-primary)",
            }}
          >
            {formatMoneyFc(Number.isFinite(parsedPrice) ? parsedPrice : 0)}
          </span>
          <span style={{ color: "var(--k-text-muted)" }}>
            Commission KAYOU ({commissionPct} %)
          </span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-mono)",
              color: "var(--k-text-primary)",
            }}
          >
            −{formatMoneyFc(commission)}
          </span>
          <div
            style={{
              gridColumn: "1 / -1",
              height: 1,
              background: "var(--k-border-subtle)",
              margin: "6px 0",
            }}
          />
          <span
            style={{ color: "var(--k-text-body)", fontWeight: 600 }}
          >
            Gain net estimé
          </span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              color: "var(--k-success)",
              fontSize: 14,
            }}
          >
            {formatMoneyFc(net)}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--k-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <I.coins size={12} strokeColor="var(--k-text-muted)" />
          Paiement en espèces. Le gain est crédité après confirmation du paiement reçu.
        </div>
      </div>
      {formError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            color: "#9F1239",
            background: "var(--k-danger-subtle)",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 12.5,
          }}
        >
          {formError}
        </div>
      )}
    </div>
  );

  const footer = (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: isDesktop ? "14px 20px" : "14px 18px",
        marginTop: 18,
        borderTop: "1px solid var(--k-border-subtle)",
        background: "var(--k-surface)",
      }}
    >
      <button
        className="k-btn k-btn-secondary"
        style={{ flex: 1 }}
        onClick={() => onOpenChange(false)}
      >
        Annuler
      </button>
      <button
        className="k-btn k-btn-primary"
        style={{ flex: 2 }}
        disabled={busy || !title.trim() || !price.toString().trim()}
        onClick={submit}
      >
        {submitLabel ?? (adjusting ? "Mettre à jour l'accord" : "Confirmer l'accord")}
      </button>
    </div>
  );

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(15,23,42,0.42)",
    display: "flex",
    alignItems: isDesktop ? "center" : "flex-end",
    justifyContent: "center",
    padding: isDesktop ? 20 : 0,
  };

  const containerStyle: React.CSSProperties = isDesktop
    ? {
        width: "min(520px, 100%)",
        borderRadius: 16,
        background: "var(--k-surface)",
        boxShadow:
          "0 24px 60px -16px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.06)",
        maxHeight: "min(720px, calc(100vh - 32px))",
        overflowY: "auto",
      }
    : {
        width: "100%",
        borderRadius: "20px 20px 0 0",
        background: "var(--k-surface)",
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
        boxShadow: "0 -8px 32px -8px rgba(15,23,42,0.25)",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onClick={() => onOpenChange(false)}
    >
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        {!isDesktop && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}>
            <span
              aria-hidden
              style={{
                width: 36,
                height: 4,
                background: "#CBD5E1",
                borderRadius: 999,
              }}
            />
          </div>
        )}
        {headerBlock}
        {fields}
        {footer}
      </div>
    </div>
  );
}
