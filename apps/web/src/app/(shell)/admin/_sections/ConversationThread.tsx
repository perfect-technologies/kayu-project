"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminMessage, MessageAttachment } from "@kayu/schemas";
import { Paperclip, Trash2 } from "lucide-react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useSignedAttachment } from "@/components/messaging/useSignedAttachment";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { formatDateTime } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";

const copy = adminCopy.conversations;

function AttachmentLink({ attachment }: { attachment: MessageAttachment }) {
  const signed = useSignedAttachment(attachment.path);
  const name = attachment.path.split("/").pop() ?? attachment.path;
  const label = `${copy.attachment(attachment.kind)} · ${name}`;
  if (!signed.data) return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Paperclip size={12} aria-hidden /> {label}</span>;
  return (
    <a href={signed.data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
      <Paperclip size={12} aria-hidden /> {label}
    </a>
  );
}

function MessageRow({ message, busy, onDelete }: { message: AdminMessage; busy: boolean; onDelete: () => Promise<unknown> }) {
  const deleted = message.deletedAt !== null;
  const client = message.sender.side === "client";
  return (
    <li className={cn("group flex", client ? "justify-start" : "justify-end")}>
      <div className={cn("relative max-w-[85%] rounded-2xl px-4 py-3", client ? "bg-secondary/70" : "bg-primary/10")}>
        <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{message.sender.name}</span>
          <span>{adminCopy.pills[client ? "CLIENT" : "PROVIDER"]}</span>
          <span>{formatDateTime(message.createdAt)}</span>
        </p>
        {deleted ? (
          <p className="mt-1 text-sm text-muted-foreground italic">{copy.deletedMessage}</p>
        ) : (
          <>
            {message.body && <p className="mt-1 text-sm whitespace-pre-line text-foreground">{message.body}</p>}
            {message.attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {message.attachments.map((attachment) => (
                  <li key={attachment.path}>
                    <AttachmentLink attachment={attachment} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex justify-end opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
              <ConfirmAction
                className="h-8 px-2.5 text-[11px]"
                destructive
                disabled={busy}
                aria-label={copy.deleteMessage}
                sheet={{ title: copy.sheets.deleteMessage.title, description: copy.sheets.deleteMessage.description, confirmLabel: copy.sheets.deleteMessage.confirm }}
                onConfirm={onDelete}
              >
                <Trash2 size={12} aria-hidden /> {adminCopy.common.delete}
              </ConfirmAction>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/** Every message of one conversation (newest page, 100 max) with a delete per message. */
export function ConversationThread({ conversationId }: { conversationId: string }) {
  const params = { limit: 100 };
  const query = useQuery({
    queryKey: queryKeys.admin.conversationMessages(conversationId, params),
    queryFn: () => adminApi(apiClient).conversationMessages(conversationId, params),
  });
  const remove = useAdminMutation({
    mutationFn: (messageId: string) => adminApi(apiClient).deleteMessage(messageId),
    invalidate: [["admin", "conversations"]],
    success: copy.toasts.messageDeleted,
    silent: true,
  });

  if (query.isLoading) return <SkeletonCard lines={4} />;
  if (query.isError || !query.data) return <ErrorCard onRetry={() => void query.refetch()} />;
  const { conversation, items } = query.data;

  return (
    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-foreground">{conversation.subject ?? copy.noSubject}</h3>
          <p className="text-xs text-muted-foreground">{copy.parties(conversation.client.name, conversation.provider.displayName)}</p>
        </div>
        <AdminStatusPill status="ACTIVE" className="h-6" />
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{copy.emptyThread}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((message) => (
            <MessageRow key={message.id} message={message} busy={remove.isPending} onDelete={() => remove.mutateAsync(message.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
