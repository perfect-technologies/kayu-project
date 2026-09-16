"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingsApi } from "@kayu/api";
import type { BookingStatus } from "@kayu/schemas";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { Field, TextAreaField } from "@/components/forms/Field";
import { bookingsCopy } from "@/copy/bookings";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = bookingsCopy.actions;

export type BookingActionsProps = {
  booking: { id: string; status: BookingStatus };
  perspective: "client" | "provider";
  className?: string;
};

type Sheet = "cancel" | "confirm" | "complete" | null;

/** Queries every booking mutation touches: lists, detail, dashboards, earnings and reviews. */
export const BOOKING_INVALIDATIONS = [["bookings"], ["dashboard"], ["earnings"], ["reviews"]] as const;

export function invalidateBookingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all(BOOKING_INVALIDATIONS.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })));
}

/** Client: Annuler on PENDING/CONFIRMED. Provider: Confirmer, Terminer, Annuler per state, each behind a sheet. */
export function BookingActions({ booking, perspective, className }: BookingActionsProps) {
  const queryClient = useQueryClient();
  const api = bookingsApi(apiClient);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setSheet(null);
    setError(null);
  };
  const settle = (message: string) => async () => {
    await invalidateBookingQueries(queryClient);
    toast.success(message);
    close();
  };
  const fail = (cause: unknown) => setError(errorMessage(cause));

  const cancel = useMutation({
    mutationFn: () => api.cancel(booking.id, reason.trim() ? { reason: reason.trim() } : {}),
    onSuccess: settle(copy.toasts.cancelled),
    onError: fail,
  });
  const confirm = useMutation({
    mutationFn: () => api.confirm(booking.id),
    onSuccess: settle(copy.toasts.confirmed),
    onError: fail,
  });
  const complete = useMutation({
    mutationFn: () => {
      const amount = price.trim() === "" ? undefined : Number(price);
      return api.complete(booking.id, { ...(amount !== undefined ? { agreedPrice: amount } : {}), isPaid: paid });
    },
    onSuccess: settle(copy.toasts.completed),
    onError: fail,
  });

  const busy = cancel.isPending || confirm.isPending || complete.isPending;
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canConfirm = perspective === "provider" && booking.status === "PENDING";
  const canComplete = perspective === "provider" && booking.status === "CONFIRMED";
  if (!canCancel && !canConfirm && !canComplete) return null;

  const priceInvalid = price.trim() !== "" && !/^\d{1,10}$/.test(price.trim());
  const reasonMissing = perspective === "provider" && reason.trim().length === 0;

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {canConfirm && (
          <button type="button" onClick={() => setSheet("confirm")} className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
            {copy.confirm}
          </button>
        )}
        {canComplete && (
          <button type="button" onClick={() => setSheet("complete")} className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground">
            {copy.complete}
          </button>
        )}
        {canCancel && (
          <button type="button" onClick={() => setSheet("cancel")} className="secondary-action secondary-action--danger">
            {copy.cancel}
          </button>
        )}
      </div>

      <ConfirmSheet
        open={sheet === "cancel"}
        onClose={close}
        title={copy.cancelTitle}
        description={perspective === "provider" ? copy.cancelDescriptionProvider : copy.cancelDescriptionClient}
        confirmLabel={copy.cancelConfirm}
        cancelLabel={copy.cancelKeep}
        tone="danger"
        busy={busy}
        disabled={reasonMissing}
        onConfirm={() => cancel.mutate()}
        error={error}
      >
        {perspective === "provider" && (
          <TextAreaField
            label={copy.cancelReasonLabel}
            required
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={copy.cancelReasonPlaceholder}
          />
        )}
      </ConfirmSheet>

      <ConfirmSheet
        open={sheet === "confirm"}
        onClose={close}
        title={copy.confirmTitle}
        description={copy.confirmDescription}
        confirmLabel={copy.confirmConfirm}
        busy={busy}
        onConfirm={() => confirm.mutate()}
        error={error}
      />

      <ConfirmSheet
        open={sheet === "complete"}
        onClose={close}
        title={copy.completeTitle}
        description={copy.completeDescription}
        confirmLabel={copy.completeConfirm}
        tone="gold"
        busy={busy}
        disabled={priceInvalid}
        onConfirm={() => complete.mutate()}
        error={error}
      >
        <Field
          label={copy.agreedPriceLabel}
          hint={copy.agreedPriceHint}
          inputMode="numeric"
          pattern="[0-9]*"
          value={price}
          onChange={(event) => setPrice(event.target.value.replace(/[^\d]/g, ""))}
          placeholder={copy.agreedPricePlaceholder}
        />
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-2 text-sm font-semibold text-foreground">
          {copy.paidLabel}
          <span className="relative inline-flex">
            <input type="checkbox" role="switch" checked={paid} onChange={(event) => setPaid(event.target.checked)} className="peer sr-only" />
            <span aria-hidden className="block h-7 w-12 rounded-full bg-border transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
            <span aria-hidden className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </ConfirmSheet>
    </>
  );
}
