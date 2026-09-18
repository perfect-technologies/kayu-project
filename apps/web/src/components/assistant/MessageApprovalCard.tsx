"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import type { AssistantSendMessageInput } from "@kayu/schemas";
import { assistantCopy } from "@/copy/assistant";
import { ApprovalActions, ApprovalOutcome, type ApprovalState } from "./BookingApprovalCard";
import type { KnownProvider } from "./types";
import { useProviderName } from "./useProviderName";

const copy = assistantCopy.approval;
const MAX_LENGTH = 4000;

export function MessageApprovalCard({
  input,
  provider: known,
  approval,
  disabled,
  onApprove,
  onDeny,
  onRevise,
}: {
  input: AssistantSendMessageInput;
  provider: KnownProvider | null;
  approval: ApprovalState;
  disabled?: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onRevise: (text: string) => void;
}) {
  const provider = useProviderName(input.providerId, known);
  const [text, setText] = useState(input.body);
  const [error, setError] = useState<string | null>(null);
  const revised = text.trim() !== input.body.trim();

  const send = () => {
    const body = text.trim();
    if (!body) {
      setError(copy.empty);
      return;
    }
    setError(null);
    if (revised) onRevise(body);
    else onApprove();
  };

  return (
    <section aria-label={copy.messageTitle} className="rounded-3xl border-2 border-accent/60 bg-white p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <MessageSquare size={16} aria-hidden className="text-primary" /> {copy.messageTitle}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{copy.messageHint}</p>
      <p className="mt-3 text-sm text-foreground">
        <span className="text-xs font-bold text-muted-foreground">{copy.provider} · </span>
        {provider?.displayName ?? "…"}
      </p>
      {input.subject && (
        <p className="mt-1 text-sm text-foreground">
          <span className="text-xs font-bold text-muted-foreground">{copy.subject} · </span>
          {input.subject}
        </p>
      )}
      {approval.state === "approval-requested" ? (
        <>
          <label className="mt-3 block text-xs font-bold text-foreground">
            {copy.messageLabel}
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
              maxLength={MAX_LENGTH}
              rows={4}
              disabled={disabled}
              className="field mt-1.5 h-auto py-3 text-sm"
            />
          </label>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{copy.counter(text.length, MAX_LENGTH)}</p>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <ApprovalActions confirmLabel={revised ? copy.sendRevised : copy.send} disabled={disabled} onApprove={send} onDeny={onDeny} />
        </>
      ) : (
        <>
          <p className="mt-3 rounded-2xl bg-muted p-3 text-sm whitespace-pre-wrap text-foreground/80">{input.body}</p>
          <ApprovalOutcome approval={approval} />
        </>
      )}
    </section>
  );
}
