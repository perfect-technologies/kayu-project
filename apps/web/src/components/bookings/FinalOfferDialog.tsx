"use client";

import { useEffect, useState } from "react";
import type { finalOffersApi } from "@kayu/api";
import { I } from "@kayu/ui/web";

type CreateFinalOfferInput = Parameters<ReturnType<typeof finalOffersApi>["create"]>[0];

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
};

function defaultOfferDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDateTimeLocalValue(value: Date | string | undefined) {
  const d = value instanceof Date ? value : value ? new Date(value) : defaultOfferDate();
  if (Number.isNaN(d.getTime())) return toDateTimeLocalValue(defaultOfferDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FinalOfferDialog({
  open,
  onOpenChange,
  providerId,
  clientId,
  conversationId,
  bookingId,
  initialValues,
  heading = "Enregistrer l'accord final",
  subheading = "Résumez l'accord déjà convenu dans ce fil. La réservation est confirmée immédiatement.",
  submitLabel = "Confirmer l'accord",
  onSubmit,
  busy,
}: FinalOfferDialogProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(
    initialValues?.price != null ? String(initialValues.price) : "",
  );
  const [durationHours, setDurationHours] = useState(
    initialValues?.durationHours != null ? String(initialValues.durationHours) : "2",
  );
  const [scheduledDate, setScheduledDate] = useState(
    toDateTimeLocalValue(initialValues?.scheduledDate),
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "Kinshasa");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the form when the dialog opens so a freshly-opened dialog reflects
  // the latest booking state (e.g. provider re-opens after editing the booking).
  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setPrice(initialValues?.price != null ? String(initialValues.price) : "");
    setDurationHours(
      initialValues?.durationHours != null ? String(initialValues.durationHours) : "2",
    );
    setScheduledDate(toDateTimeLocalValue(initialValues?.scheduledDate));
    setAddress(initialValues?.address ?? "");
    setCity(initialValues?.city ?? "Kinshasa");
    setNotes(initialValues?.notes ?? "");
    setFormError(null);
  }, [open, initialValues]);

  if (!open) return null;

  const submit = async () => {
    const parsedPrice = Number(price);
    const parsedDuration = Number(durationHours.replace(",", "."));
    const parsedScheduledDate = new Date(scheduledDate);
    if (!title.trim()) {
      setFormError("Indiquez le service convenu.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Indiquez un prix valide en FC.");
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setFormError("Indiquez une durée valide, par exemple 1,5 ou 2.");
      return;
    }
    if (!scheduledDate || Number.isNaN(parsedScheduledDate.getTime())) {
      setFormError("Choisissez une date et une heure valides.");
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
      duration: Math.max(1, Math.round(parsedDuration * 60)),
      scheduledDate: parsedScheduledDate,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod: "cash",
    });
    onOpenChange(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="k-final-offer-dialog"
        style={{
          width: "min(520px, 100%)",
          borderRadius: 16,
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          boxShadow: "var(--k-e3)",
          padding: 20,
          maxHeight: "min(720px, calc(100dvh - 32px))",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="k-display-m" style={{ margin: 0, fontSize: 22 }}>
              {heading}
            </h2>
            <p className="k-body-m" style={{ color: "var(--k-text-muted)", margin: "4px 0 0" }}>
              {subheading}
            </p>
          </div>
          <button
            aria-label="Fermer"
            onClick={() => onOpenChange(false)}
            style={{ border: 0, background: "transparent", cursor: "pointer" }}
          >
            <I.x size={20} />
          </button>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input
            className="k-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Service convenu"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte"
            rows={3}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              color: "var(--k-text-primary)",
              font: "inherit",
              resize: "vertical",
            }}
          />
          <div className="k-final-offer-form-row">
            <input
              className="k-input"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix convenu en FC"
            />
            <input
              className="k-input"
              inputMode="decimal"
              value={durationHours}
              onChange={(e) => {
                setDurationHours(e.target.value);
                setFormError(null);
              }}
              placeholder="Durée en heures"
            />
          </div>
          <input
            className="k-input"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <div className="k-final-offer-address-row">
            <input
              className="k-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse"
            />
            <input
              className="k-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
            />
          </div>
          <input
            className="k-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Précision utile pour le client"
          />
        </div>
        {formError && (
          <div
            role="alert"
            className="k-caption"
            style={{
              marginTop: 12,
              color: "#BE123C",
              background: "var(--k-danger-subtle)",
              borderRadius: 10,
              padding: "9px 12px",
            }}
          >
            {formError}
          </div>
        )}
        <div
          className="k-caption"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--k-surface-primary)",
            color: "var(--k-text-body)",
          }}
        >
          Paiement en espèces à la fin de la mission.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            className="k-btn k-btn-secondary"
            style={{ flex: 1 }}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </button>
          <button
            className="k-btn k-btn-primary"
            style={{ flex: 1 }}
            disabled={busy || !title.trim() || !price.toString().trim()}
            onClick={submit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
