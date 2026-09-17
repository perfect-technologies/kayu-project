"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Conversation } from "@kayu/schemas";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { messagerieCopy } from "@/copy/messagerie";
import { ThreadSafety } from "./ThreadSafety";

const copy = messagerieCopy.thread;

/** Back arrow (mobile), subject, "Prestataire : X" / "Client : Y" and the safety actions. */
export function ThreadHeader({ conversation }: { conversation: Conversation }) {
  const roleLine = conversation.side === "client" ? copy.provider(conversation.counterpart.name) : copy.client(conversation.counterpart.name);
  const profileHref = conversation.counterpart.providerId ? `/prestataire/${conversation.counterpart.providerId}` : null;
  return (
    <header className="flex items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
      <Link href="/messagerie" className="icon-button lg:hidden" aria-label={copy.back}>
        <ArrowLeft size={18} aria-hidden />
      </Link>
      {profileHref ? (
        <Link href={profileHref} aria-label={copy.viewProfile} className="shrink-0 rounded-full">
          <MiniAvatar src={conversation.counterpart.photo} name={conversation.counterpart.name} size={40} />
        </Link>
      ) : (
        <MiniAvatar src={conversation.counterpart.photo} name={conversation.counterpart.name} size={40} />
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-extrabold text-foreground">{conversation.subject?.trim() || copy.defaultSubject}</h2>
        <p className="truncate text-[11px] text-muted-foreground">{roleLine}</p>
      </div>
      <ThreadSafety conversationId={conversation.id} counterpartUserId={conversation.counterpart.userId} />
    </header>
  );
}
