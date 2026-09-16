"use client";

import { useState, type ReactNode } from "react";
import { TextAreaField } from "@/components/forms/Field";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";
import { adminErrorMessage } from "./admin-errors";

export type ConfirmActionProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Native tooltip, shown for locked rows (self, last admin…). */
  title?: string;
  sheet: {
    title: string;
    description?: string;
    confirmLabel: string;
    reason?: { label: string; placeholder?: string; required?: boolean; initial?: string };
  };
  destructive?: boolean;
  /** Resolves when the mutation succeeds; a rejection keeps the sheet open with the message. */
  onConfirm: (reason: string) => Promise<unknown>;
  "aria-label"?: string;
};

/** A button that opens a `ConfirmSheet`, with an optional (required) reason textarea. */
export function ConfirmAction({ children, className, disabled, title, sheet, destructive, onConfirm, ...aria }: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(sheet.reason?.initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonMissing = Boolean(sheet.reason?.required) && reason.trim().length === 0;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError(null);
  };

  const confirm = async () => {
    if (reasonMissing) {
      setError(adminCopy.common.reasonRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason(sheet.reason?.initial ?? "");
    } catch (cause) {
      setError(adminErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={title}
        aria-label={aria["aria-label"]}
        className={cn("secondary-action", destructive && "secondary-action--danger", className)}
      >
        {children}
      </button>
      <ConfirmSheet
        open={open}
        onClose={close}
        title={sheet.title}
        description={sheet.description}
        confirmLabel={sheet.confirmLabel}
        tone={destructive ? "danger" : "primary"}
        busy={busy}
        disabled={reasonMissing}
        onConfirm={() => void confirm()}
        error={error}
      >
        {sheet.reason && (
          <TextAreaField
            label={sheet.reason.label}
            required={sheet.reason.required}
            placeholder={sheet.reason.placeholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            counter={`${reason.length}/500`}
          />
        )}
      </ConfirmSheet>
    </>
  );
}
