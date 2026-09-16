"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Mailbox } from "lucide-react";
import { ConversationList } from "@/components/messaging/ConversationList";
import { Thread } from "@/components/messaging/Thread";
import { useAuth } from "@/contexts/AuthContext";
import { messagerieCopy } from "@/copy/messagerie";
import { cn } from "@/lib/utils";

const copy = messagerieCopy;

function ClientTip() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-primary/5 px-4 py-3 text-xs text-foreground">
      <Lock size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
      <span>{copy.thread.tip}</span>
    </p>
  );
}

/** URL is the state: `?c=<id>` opens a thread. Mobile shows one pane; desktop shows list (5) + thread (7). */
export function MessagerieClient() {
  const params = useSearchParams();
  const conversationId = params.get("c");
  const { user } = useAuth();
  const isClient = user?.role === "CLIENT";
  const threadOpen = conversationId !== null;

  useEffect(() => {
    if (!threadOpen) return;
    document.body.dataset.dock = "hidden";
    return () => {
      delete document.body.dataset.dock;
    };
  }, [threadOpen]);

  return (
    <div className={cn("mx-auto w-full max-w-5xl", threadOpen ? "px-0 pt-0 pb-0 sm:px-6 lg:pt-6 lg:pb-8" : "mobile-page")}>
      <header className={cn("hidden items-center gap-3 lg:flex", threadOpen && "lg:mb-0")}>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 text-white shadow-soft">
          <Mailbox size={22} aria-hidden />
        </span>
        <div>
          <h1>{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </header>
      <h1 className={cn("lg:hidden", threadOpen && "sr-only")}>{copy.title}</h1>

      <div className="mt-0 grid gap-4 lg:mt-6 lg:grid-cols-12 lg:items-start">
        <div className={cn("lg:col-span-5", threadOpen && "hidden lg:block")}>
          <ConversationList activeId={conversationId} />
        </div>
        <div className={cn("lg:col-span-7", !threadOpen && "hidden lg:block")}>
          {threadOpen ? (
            <div className="space-y-3">
              <Thread
                conversationId={conversationId}
                className="h-[calc(100dvh-64px)] bg-white lg:h-[min(72dvh,760px)] lg:min-h-[480px] lg:rounded-3xl lg:border lg:border-border lg:shadow-soft"
              />
              {isClient && (
                <div className="px-4 pb-4 sm:px-0">
                  <ClientTip />
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-white/60 p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Mailbox size={26} aria-hidden strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">{copy.thread.selectPrompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
