import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@kayu/api";
import type { Conversation, ConversationsResponse, Message, MessagesResponse } from "@kayu/schemas";

export const MESSAGES_LIMIT = 30;

export type ThreadData = InfiniteData<MessagesResponse, unknown>;

/** Key of the one infinite query behind a thread (`?page=` lives in the page param, not the key). */
export function threadKey(conversationId: string) {
  return queryKeys.conversations.messages(conversationId, { limit: MESSAGES_LIMIT });
}

/** Pages are fetched newest-first (page 1 = newest); render oldest → newest. */
export function flattenMessages(data: ThreadData | undefined): Message[] {
  if (!data) return [];
  return [...data.pages].reverse().flatMap((page) => page.items);
}

export function patchThread(queryClient: QueryClient, conversationId: string, update: (data: ThreadData) => ThreadData) {
  queryClient.setQueryData<ThreadData>(threadKey(conversationId), (data) => (data ? update(data) : data));
}

export function appendMessage(queryClient: QueryClient, conversationId: string, message: Message) {
  patchThread(queryClient, conversationId, (data) => {
    const [first, ...rest] = data.pages;
    if (!first) return data;
    return { ...data, pages: [{ ...first, items: [...first.items, message], total: first.total + 1 }, ...rest] };
  });
}

export function replaceMessage(queryClient: QueryClient, conversationId: string, tempId: string, message: Message | null) {
  patchThread(queryClient, conversationId, (data) => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: message ? page.items.map((item) => (item.id === tempId ? message : item)) : page.items.filter((item) => item.id !== tempId),
      total: message ? page.total : Math.max(0, page.total - 1),
    })),
  }));
}

export function markMessageDeleted(queryClient: QueryClient, conversationId: string, messageId: string) {
  patchThread(queryClient, conversationId, (data) => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === messageId ? { ...item, body: null, attachments: [], deletedAt: new Date().toISOString() } : item,
      ),
    })),
  }));
}

/** Patch a conversation across every cached page of the list (`["conversations", "list", …]`). */
export function patchConversation(queryClient: QueryClient, conversationId: string, update: (item: Conversation) => Conversation) {
  queryClient.setQueriesData<ConversationsResponse>({ queryKey: ["conversations", "list"] }, (data) => {
    if (!data) return data;
    let touched = false;
    const items = data.items.map((item) => {
      if (item.id !== conversationId) return item;
      touched = true;
      return update(item);
    });
    if (!touched) return data;
    const unreadTotal = items.reduce((sum, item) => sum + item.unread, 0);
    return { ...data, items, unreadTotal };
  });
}
