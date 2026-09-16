"use client";

import type { ReactNode } from "react";
import { spacesCopy } from "@/copy/spaces";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";

export type ConfirmSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "gold" | "danger";
  busy?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  /** Extra fields rendered between the description and the buttons. */
  children?: ReactNode;
  error?: string | null;
};

/** Bottom sheet with a description, optional fields and a cancel / confirm pair. */
export function ConfirmSheet({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = spacesCopy.cancel,
  tone = "primary",
  busy,
  disabled,
  onConfirm,
  children,
  error,
}: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy && !disabled) onConfirm();
        }}
        className="space-y-4"
      >
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {children}
        {error && (
          <p role="alert" className="text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="secondary-action flex-1" disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={busy || disabled}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-sm font-bold disabled:opacity-55",
              tone === "danger" && "border border-red-200 bg-white text-destructive",
              tone === "gold" && "bg-accent text-accent-foreground",
              tone === "primary" && "bg-primary text-primary-foreground",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
