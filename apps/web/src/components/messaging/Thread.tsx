"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, conversationsApi } from "@kayu/api";
import type { Message } from "@kayu/schemas";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/copy/errors";
import { messagerieCopy } from "@/copy/messagerie";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import { ThreadHeader } from "./ThreadHeader";
import { MESSAGES_LIMIT, flattenMessages, markMessageDeleted, patchConversation, threadKey } from "./thread-cache";
import { useConversationPolling } from "./useConversationPolling";

const copy = messagerieCopy.thread;

function ThreadSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col justify-end gap-3 p-4">
      {[64, 40, 72, 48].map((width, index) => (
        <Skeleton key={index} className={cn("h-12 rounded-2xl", index % 2 ? "self-end" : "self-start")} style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

/** One conversation: header, scrollable bubbles (older pages prepend), composer; polls every 15 s while visible. */
export function Thread({ conversationId, className }: { conversationId: string; className?: string }) {
  const queryClient = useQueryClient();
  const polling = useConversationPolling();
  const scroller = useRef<HTMLDivElement>(null);
  const [toDelete, setToDelete] = useState<Message | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const scrolledOnce = useRef<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: threadKey(conversationId),
    queryFn: ({ pageParam }) => conversationsApi(apiClient).messages(conversationId, { page: pageParam, limit: MESSAGES_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * MESSAGES_LIMIT < last.total ? pages.length + 1 : undefined),
    refetchInterval: polling.refetchInterval,
    refetchIntervalInBackground: polling.refetchIntervalInBackground,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    retry: (count, error) => !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 1,
  });

  const conversation = query.data?.pages[0]?.conversation ?? null;
  const messages = flattenMessages(query.data);
  const blockedError = query.error instanceof ApiError && query.error.code === "BLOCKED";
  const blocked = Boolean(conversation?.blocked) || blockedError;

  useEffect(() => {
    if (!conversation) return;
    patchConversation(queryClient, conversationId, (item) => (item.unread === 0 ? item : { ...item, unread: 0 }));
  }, [conversation, conversationId, queryClient]);

  const scrollToBottom = () => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  };
  useEffect(() => {
    if (query.data && scrolledOnce.current !== conversationId) {
      scrolledOnce.current = conversationId;
      scrollToBottom();
    }
  }, [query.data, conversationId]);

  const remove = useMutation({
    mutationFn: (message: Message) => conversationsApi(apiClient).deleteMessage(conversationId, message.id),
    onSuccess: (_, message) => {
      markMessageDeleted(queryClient, conversationId, message.id);
      patchConversation(queryClient, conversationId, (item) => (item.lastPreview === message.body ? { ...item, lastPreview: messagerieCopy.list.deletedPreview } : item));
      toast.success(copy.deleted_toast);
      setToDelete(null);
      setDeleteError(null);
    },
    onError: (cause) => setDeleteError(errorMessage(cause)),
  });

  const loadOlder = async () => {
    const element = scroller.current;
    const before = element ? element.scrollHeight - element.scrollTop : 0;
    await query.fetchNextPage();
    if (element) element.scrollTop = element.scrollHeight - before;
  };

  if (query.isLoading) {
    return (
      <section className={cn("flex flex-col", className)}>
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <ThreadSkeleton />
      </section>
    );
  }
  if (query.isError && !blockedError) {
    return (
      <section className={cn("flex flex-col p-4", className)}>
        <ErrorCard message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  return (
    <section className={cn("flex flex-col", className)} aria-label={conversation?.subject ?? copy.defaultSubject}>
      {conversation && <ThreadHeader conversation={conversation} />}
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {query.hasNextPage && (
          <div className="flex justify-center">
            <button type="button" onClick={() => void loadOlder()} disabled={query.isFetchingNextPage} className="secondary-action min-h-9 px-4 text-xs">
              {copy.older}
            </button>
          </div>
        )}
        {messages.length === 0 && !blocked && <p className="py-10 text-center text-sm text-muted-foreground">{copy.empty}</p>}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} senderName={conversation?.counterpart.name ?? ""} onDelete={setToDelete} />
        ))}
        {blocked && (
          <p role="status" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {copy.blocked}
          </p>
        )}
      </div>
      <Composer conversationId={conversationId} blocked={blocked} onSent={scrollToBottom} />

      <ConfirmSheet
        open={toDelete !== null}
        onClose={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmLabel={copy.deleteConfirm}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        error={deleteError}
      />
    </section>
  );
}
