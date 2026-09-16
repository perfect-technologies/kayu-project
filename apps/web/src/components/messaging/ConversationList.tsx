"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { conversationsApi, queryKeys } from "@kayu/api";
import type { Conversation } from "@kayu/schemas";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { LoadingRow } from "@/components/ui/skeleton";
import { messagerieCopy } from "@/copy/messagerie";
import { apiClient } from "@/lib/api";
import { ConversationRow } from "./ConversationRow";
import { useConversationPolling } from "./useConversationPolling";

const copy = messagerieCopy.list;
const LIMIT = 20;

function ConversationPage({ page, activeId, onLoaded }: { page: number; activeId: string | null; onLoaded: (total: number) => void }) {
  const polling = useConversationPolling();
  const params = { page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: async () => {
      const data = await conversationsApi(apiClient).list(params);
      onLoaded(data.total);
      return data;
    },
    refetchInterval: polling.refetchInterval,
    refetchIntervalInBackground: polling.refetchIntervalInBackground,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: page === 1 ? 4 : 2 }, (_, index) => (
          <LoadingRow key={index} className="rounded-2xl" />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorCard onRetry={() => void query.refetch()} />;
  const items: Conversation[] = query.data?.items ?? [];
  if (page === 1 && items.length === 0) {
    return <EmptyState icon={Inbox} title={copy.empty.title} description={copy.empty.description} action={{ href: "/rechercher", label: copy.empty.action }} />;
  }
  return (
    <div className="space-y-2">
      {items.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === activeId} />
      ))}
    </div>
  );
}

/** Paged `GET /conversations` with "Voir plus"; every page polls while visible. */
export function ConversationList({ activeId }: { activeId: string | null }) {
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const hasMore = total !== null && pages * LIMIT < total;

  return (
    <section aria-label={copy.label} className="space-y-3">
      {Array.from({ length: pages }, (_, index) => (
        <ConversationPage key={index + 1} page={index + 1} activeId={activeId} onLoaded={setTotal} />
      ))}
      {hasMore && (
        <button type="button" onClick={() => setPages((count) => count + 1)} className="secondary-action w-full">
          {copy.more}
        </button>
      )}
    </section>
  );
}
