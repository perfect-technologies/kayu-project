"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Message } from "@kayu/schemas";
import { messagerieCopy } from "@/copy/messagerie";
import { cn } from "@/lib/utils";
import { MessageAttachments } from "./MessageAttachments";

const copy = messagerieCopy.thread;
const TIME_FR = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const LONG_PRESS_MS = 500;

export type MessageBubbleProps = {
  message: Message;
  senderName: string;
  onDelete?: (message: Message) => void;
};

/** Mine right on primary, theirs left on muted with the sender name; attachments and a 10 px timestamp. */
export function MessageBubble({ message, senderName, onDelete }: MessageBubbleProps) {
  const [menu, setMenu] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleted = message.deletedAt !== null || message.body === null && message.attachments.length === 0;
  const canDelete = message.mine && !deleted && onDelete && !message.id.startsWith("tmp-");

  const pressStart = () => {
    if (!canDelete) return;
    timer.current = setTimeout(() => setMenu(true), LONG_PRESS_MS);
  };
  const pressEnd = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div data-message-id={message.id} className={cn("group flex w-full", message.mine ? "justify-end" : "justify-start")}>
      <div className={cn("relative max-w-[82%] sm:max-w-[70%]", message.mine ? "items-end" : "items-start")}>
        {!message.mine && <p className="mb-0.5 pl-1 text-[11px] font-semibold text-muted-foreground">{senderName}</p>}
        <div
          onPointerDown={pressStart}
          onPointerUp={pressEnd}
          onPointerLeave={pressEnd}
          onPointerCancel={pressEnd}
          onContextMenu={(event) => {
            if (canDelete) {
              event.preventDefault();
              setMenu(true);
            }
          }}
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm",
            message.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground",
            message.id.startsWith("tmp-") && "opacity-70",
          )}
        >
          {deleted ? (
            <p className={cn("text-xs italic", message.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{copy.deleted}</p>
          ) : (
            <>
              {message.body && <p className="break-words whitespace-pre-line">{message.body}</p>}
              <MessageAttachments attachments={message.attachments} mine={message.mine} />
            </>
          )}
          <p className={cn("mt-1 text-right text-[10px] leading-none", message.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
            <time dateTime={new Date(message.createdAt).toISOString()}>{TIME_FR.format(new Date(message.createdAt))}</time>
          </p>
        </div>
        {canDelete && (
          <div className={cn("mt-1 flex justify-end", !menu && "opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100")}>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onDelete(message);
              }}
              className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-destructive hover:bg-red-50"
            >
              <Trash2 size={13} aria-hidden /> {copy.delete}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
