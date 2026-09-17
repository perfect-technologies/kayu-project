"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Flag } from "lucide-react";
import { toast } from "sonner";
import { safetyApi } from "@kayu/api";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { errorMessage } from "@/copy/errors";
import { messagerieCopy } from "@/copy/messagerie";
import { apiClient } from "@/lib/api";

const copy = messagerieCopy.safety;

type Mode = "report" | "block" | null;

/** Signaler (`POST /reports`, CONVERSATION) and Bloquer (`POST /blocks`); the thread then shows the blocked notice. */
export function ThreadSafety({ conversationId, counterpartUserId }: { conversationId: string; counterpartUserId: string }) {
  const queryClient = useQueryClient();
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
      await safetyApi(apiClient).report({ targetKind: "CONVERSATION", targetId: conversationId, reason: reason.trim() });
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
      await safetyApi(apiClient).block(counterpartUserId);
      toast.success(copy.blocked);
      close();
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const textButton = "inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:text-destructive";

  return (
    <>
      <div className="flex shrink-0 gap-1">
        <button type="button" className={textButton} onClick={() => setMode("report")}>
          <Flag size={13} aria-hidden /> <span className="hidden sm:inline">{copy.report}</span>
          <span className="sr-only sm:hidden">{copy.report}</span>
        </button>
        <button type="button" className={textButton} onClick={() => setMode("block")}>
          <Ban size={13} aria-hidden /> <span className="hidden sm:inline">{copy.block}</span>
          <span className="sr-only sm:hidden">{copy.block}</span>
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

      <ConfirmSheet
        open={mode === "block"}
        onClose={close}
        title={copy.blockTitle}
        description={copy.blockHint}
        confirmLabel={copy.blockConfirm}
        cancelLabel={copy.blockCancel}
        tone="danger"
        busy={busy}
        onConfirm={() => void block()}
        error={error}
      />
    </>
  );
}
