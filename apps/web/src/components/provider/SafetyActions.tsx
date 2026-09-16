"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag } from "lucide-react";
import { safetyApi } from "@kayu/api";
import { toast } from "sonner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { errorMessage } from "@/copy/errors";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";

const copy = providerCopy.safety;

type Mode = "report" | "block" | null;

/** Signaler / Bloquer text buttons opening a small sheet; a block sends the viewer back to search. */
export function SafetyActions({ providerId, ownerId }: { providerId: string; ownerId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMode(null);
    setError(null);
  };

  const report = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await safetyApi(apiClient).report({ targetKind: "PROVIDER", targetId: providerId, reason: reason.trim() });
      toast.success(copy.reportSent);
      setReason("");
      close();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    setBusy(true);
    setError(null);
    try {
      await safetyApi(apiClient).block(ownerId);
      toast.success(copy.blocked);
      close();
      router.replace("/rechercher");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const textButton = "inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive";

  return (
    <>
      <div className="flex gap-4">
        <button type="button" className={textButton} onClick={() => setMode("report")}>
          <Flag size={13} aria-hidden /> {copy.report}
        </button>
        <button type="button" className={textButton} onClick={() => setMode("block")}>
          <Ban size={13} aria-hidden /> {copy.block}
        </button>
      </div>

      <BottomSheet open={mode === "report"} onClose={close} title={copy.reportTitle}>
        <form onSubmit={report} className="space-y-3">
          <label className="block text-xs font-bold text-foreground">
            {copy.reportLabel}
            <textarea
              required
              minLength={3}
              maxLength={1000}
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={copy.reportPlaceholder}
              className="field mt-1.5 h-auto py-3"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || reason.trim().length < 3} className="primary-action">
            {copy.reportSubmit}
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={mode === "block"} onClose={close} title={copy.blockTitle}>
        <p className="text-sm text-muted-foreground">{copy.blockHint}</p>
        {error && (
          <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={close} className="secondary-action flex-1">
            {copy.blockCancel}
          </button>
          <button
            type="button"
            onClick={block}
            disabled={busy}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] border border-red-200 bg-white px-5 text-sm font-bold text-destructive disabled:opacity-55"
          >
            {copy.blockConfirm}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
