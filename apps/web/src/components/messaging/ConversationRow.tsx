"use client";

import Link from "next/link";
import { formatRelativeFr } from "@kayu/utils";
import type { Conversation } from "@kayu/schemas";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { messagerieCopy } from "@/copy/messagerie";
import { cn } from "@/lib/utils";

const copy = messagerieCopy.list;

/** One conversation: subject or counterpart bold, relative time, role chip + name, preview, unread pill. */
export function ConversationRow({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const title = conversation.subject?.trim() || conversation.counterpart.name;
  const unread = conversation.unread > 0;
  return (
    <Link
      href={`/messagerie?c=${encodeURIComponent(conversation.id)}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-white p-3 transition",
        active ? "border-primary/30 bg-primary/5" : "border-border hover:bg-secondary/60",
      )}
    >
      <MiniAvatar src={conversation.counterpart.photo} name={conversation.counterpart.name} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm text-foreground", unread ? "font-extrabold" : "font-bold")}>{title}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeFr(conversation.lastMessageAt)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-primary">{copy.roles[conversation.side]}</span>
          <span className="truncate">{conversation.counterpart.name}</span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className={cn("truncate text-xs text-foreground", unread ? "opacity-90" : "opacity-70")}>
            {conversation.lastPreview ?? copy.noPreview}
          </span>
          {unread && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              <span className="sr-only">{copy.unread(conversation.unread)}</span>
              <span aria-hidden>{conversation.unread > 9 ? "9+" : conversation.unread}</span>
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
