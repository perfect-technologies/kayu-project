"use client";

import { Archive, MessageSquarePlus, PanelLeft } from "lucide-react";
import { assistantCopy } from "@/copy/assistant";

const copy = assistantCopy.conversations;

/** Below `lg` it carries the drawer trigger and « Nouvelle conversation »; from `lg` the sidebar has both and only the title and archive stay. */
export function ConversationHeader({
  title,
  archived,
  empty,
  busy,
  onOpenList,
  onNew,
  onArchive,
}: {
  title: string | null;
  archived: boolean;
  empty: boolean;
  busy: boolean;
  onOpenList: () => void;
  onNew: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <button
        type="button"
        onClick={onOpenList}
        aria-haspopup="dialog"
        className="order-1 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-foreground active:scale-[.975] lg:hidden"
      >
        <PanelLeft size={17} aria-hidden /> {copy.trigger}
      </button>
      <h2 data-conversation-title className="order-3 min-w-0 flex-1 basis-full truncate text-sm font-extrabold text-foreground lg:order-1 lg:basis-0 lg:text-base">
        {title ?? copy.untitled}
      </h2>
      <div className="order-2 ml-auto flex items-center gap-2">
        {!archived && !empty && (
          <button type="button" onClick={onArchive} disabled={busy} aria-label={copy.archive} className="icon-button disabled:opacity-55">
            <Archive size={17} aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onNew}
          disabled={busy || empty}
          aria-label={copy.new}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground active:scale-[.975] disabled:opacity-45 lg:hidden"
        >
          <MessageSquarePlus size={15} aria-hidden />
          <span className="hidden min-[380px]:inline">{copy.newShort}</span>
        </button>
      </div>
    </div>
  );
}
