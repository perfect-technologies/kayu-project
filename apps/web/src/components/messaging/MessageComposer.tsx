"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { ApiError, conversationsApi } from "@kayu/api";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { errorMessage } from "@/copy/errors";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";
import { AttachmentBar, type PendingAttachment } from "./AttachmentBar";

const copy = providerCopy.composer;
const SUBJECT_MAX = 120;
const BODY_MAX = 4000;

export type MessageComposerProps = {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
};

/** Modal sheet starting a conversation (`POST /conversations`), then `/messagerie?c=<id>`. */
export function MessageComposer({ open, onClose, providerId, providerName }: MessageComposerProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: () =>
      conversationsApi(apiClient).start({
        providerId,
        subject: subject.trim() || undefined,
        body: body.trim() || undefined,
        attachments: attachments.map(({ kind, path, mime, bytes }) => ({ kind, path, mime, bytes })),
      }),
    onSuccess: ({ conversation }) => {
      onClose();
      router.push(`/messagerie?c=${encodeURIComponent(conversation.id)}`);
    },
    onError: (cause) => {
      setError(cause instanceof ApiError && cause.code === "BLOCKED" ? copy.blocked : errorMessage(cause));
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() && attachments.length === 0) {
      setError(copy.empty);
      return;
    }
    setError(null);
    send.mutate();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={copy.title(providerName)} className="sm:top-[7dvh] sm:bottom-auto sm:rounded-3xl">
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-bold text-foreground">
          {copy.subject}
          <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={SUBJECT_MAX} placeholder={copy.subjectPlaceholder} className="field mt-1.5" />
        </label>
        <label className="block text-xs font-bold text-foreground">
          {copy.body}
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            maxLength={BODY_MAX}
            placeholder={copy.bodyPlaceholder}
            className="field mt-1.5 h-auto py-3"
          />
        </label>
        <p className="text-right text-xs text-muted-foreground" aria-live="polite">
          {copy.counter(body.length, BODY_MAX)}
        </p>
        <AttachmentBar attachments={attachments} onChange={setAttachments} onError={setError} />
        {error && (
          <p role="alert" className="text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="secondary-action">
            {copy.cancel}
          </button>
          <button
            type="submit"
            disabled={send.isPending}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-55"
          >
            <Send size={15} aria-hidden /> {send.isPending ? copy.sending : copy.send}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
