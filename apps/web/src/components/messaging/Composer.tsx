"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { ApiError, conversationsApi } from "@kayu/api";
import type { Message } from "@kayu/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { messagerieCopy } from "@/copy/messagerie";
import { apiClient } from "@/lib/api";
import { AttachmentBar, type PendingAttachment } from "./AttachmentBar";
import { appendMessage, patchConversation, replaceMessage } from "./thread-cache";

const copy = messagerieCopy.composer;
const BODY_MAX = 4000;

export type ComposerProps = {
  conversationId: string;
  blocked: boolean;
  onSent?: () => void;
};

/** Attachment bar above a rounded textarea and a round Send button; optimistic append into the thread cache. */
export function Composer({ conversationId, blocked, onSent }: ComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const send = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      const files = attachments.map(({ kind, path, mime, bytes }) => ({ kind, path, mime, bytes }));
      const tempId = `tmp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: user?.id ?? "",
        mine: true,
        body: text || null,
        attachments: files,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      appendMessage(queryClient, conversationId, optimistic);
      setBody("");
      setAttachments([]);
      try {
        const message = await conversationsApi(apiClient).send(conversationId, { body: text || undefined, attachments: files });
        replaceMessage(queryClient, conversationId, tempId, message);
        patchConversation(queryClient, conversationId, (item) => ({
          ...item,
          lastPreview: text || copy.attachmentPreview,
          lastMessageAt: message.createdAt,
        }));
        return message;
      } catch (cause) {
        replaceMessage(queryClient, conversationId, tempId, null);
        setBody(text);
        setAttachments(attachments);
        throw cause;
      }
    },
    onSuccess: () => {
      setError(null);
      onSent?.();
      textarea.current?.focus();
    },
    onError: (cause) => setError(cause instanceof ApiError && cause.code === "BLOCKED" ? copy.blocked : errorMessage(cause)),
  });

  const submit = () => {
    if (blocked || send.isPending) return;
    if (!body.trim() && attachments.length === 0) {
      setError(copy.empty);
      return;
    }
    setError(null);
    send.mutate();
  };

  const autosize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 4 * 24 + 20)}px`;
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="border-t border-border bg-white px-3 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] sm:px-4"
    >
      {!blocked && <AttachmentBar attachments={attachments} onChange={setAttachments} onError={setError} disabled={send.isPending} />}
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-end gap-2">
        <label className="field h-auto min-h-12 flex-1 items-end py-2.5">
          <span className="sr-only">{copy.label}</span>
          <textarea
            ref={textarea}
            rows={1}
            value={body}
            maxLength={BODY_MAX}
            disabled={blocked}
            placeholder={blocked ? copy.blocked : copy.placeholder}
            onChange={(event) => {
              setBody(event.target.value);
              autosize(event.target);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            className="max-h-28 resize-none leading-6"
          />
        </label>
        <button
          type="submit"
          disabled={blocked || send.isPending}
          aria-label={send.isPending ? copy.sending : copy.send}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-55"
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}
