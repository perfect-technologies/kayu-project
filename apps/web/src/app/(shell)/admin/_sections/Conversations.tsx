"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminConversation } from "@kayu/schemas";
import { MessagesSquare, Trash2 } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmAction } from "../_components/ConfirmAction";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { SplitPane } from "../_components/SplitPane";
import { formatRelative } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";
import { ConversationThread } from "./ConversationThread";

const copy = adminCopy.conversations;
const LIMIT = 50;

function ConversationRow({ conversation, active, onOpen, onDelete }: { conversation: AdminConversation; active: boolean; onOpen: () => void; onDelete: () => Promise<unknown> }) {
  return (
    <li className={cn("rounded-2xl border transition", active ? "border-primary bg-secondary/60" : "border-border bg-white")}>
      <div className="flex items-start gap-2 p-3">
        <button type="button" onClick={onOpen} aria-current={active ? "true" : undefined} className="min-w-0 flex-1 text-left">
          <p className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-bold text-foreground">{conversation.subject ?? copy.noSubject}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(conversation.lastMessageAt)}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{copy.parties(conversation.client.name, conversation.provider.displayName)}</p>
          {conversation.lastPreview && <p className="mt-1 truncate text-xs text-foreground/80">{conversation.lastPreview}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">{copy.messages(conversation.messageCount)}</p>
        </button>
        <ConfirmAction
          className="size-9 shrink-0 rounded-full p-0"
          destructive
          aria-label={copy.deleteConversation}
          title={copy.deleteConversation}
          sheet={{ title: copy.sheets.deleteConversation.title, description: copy.sheets.deleteConversation.description, confirmLabel: copy.sheets.deleteConversation.confirm }}
          onConfirm={onDelete}
        >
          <Trash2 size={15} aria-hidden />
        </ConfirmAction>
      </div>
    </li>
  );
}

export function Conversations() {
  const { q, page, id, set } = useAdminParams();
  const params = { q: q || undefined, page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.conversations(params),
    queryFn: () => adminApi(apiClient).conversations(params),
    placeholderData: keepPreviousData,
  });
  const remove = useAdminMutation({
    mutationFn: (conversationId: string) => adminApi(apiClient).deleteConversation(conversationId),
    invalidate: [["admin", "conversations"]],
    success: copy.toasts.conversationDeleted,
    silent: true,
    onSuccess: (_result, conversationId) => {
      if (conversationId === id) set({ id: null });
    },
  });
  const items = query.data?.items ?? [];

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <div className="mb-4 flex">
        <SearchBox placeholder={copy.searchPlaceholder} />
      </div>
      <SplitPane
        open={id !== null}
        onBack={() => set({ id: null })}
        placeholder={{ icon: MessagesSquare, title: adminCopy.common.selectPrompt }}
        list={
          <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={items.length === 0} empty={{ icon: MessagesSquare, title: copy.empty }}>
            <ul className="space-y-2">
              {items.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === id} onOpen={() => set({ id: conversation.id }, { push: true })} onDelete={() => remove.mutateAsync(conversation.id)} />
              ))}
            </ul>
            <Pagination page={page} total={query.data?.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next, id: null })} />
          </QueryState>
        }
        detail={id && <ConversationThread conversationId={id} />}
      />
    </section>
  );
}
