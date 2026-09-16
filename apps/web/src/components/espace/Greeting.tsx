"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { espaceCopy } from "@/copy/espace";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { cn } from "@/lib/utils";

const copy = espaceCopy.greeting;

export type GreetingProps = {
  photo: string | null;
  displayName: string;
  isAvailable: boolean;
};

/** Avatar + "Bonjour, <prénom>", availability pill and the bell with an accent dot when unread. */
export function Greeting({ photo, displayName, isAvailable }: GreetingProps) {
  const { user } = useAuth();
  const unread = useUnreadNotifications();
  const firstName = user?.firstName?.trim() || displayName || copy.fallbackName;

  return (
    <div className="flex items-center gap-3">
      <MiniAvatar src={photo ?? user?.avatar} name={displayName || firstName} size={48} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{copy.hello}</p>
        <h1 className="truncate">{firstName}</h1>
      </div>
      <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-semibold text-foreground">
        <span aria-hidden className={cn("size-2 rounded-full", isAvailable ? "bg-emerald-500" : "bg-border")} />
        {isAvailable ? copy.available : copy.unavailable}
      </span>
      <Link href="/notifications" className="icon-button relative" aria-label={copy.notifications}>
        <Bell size={18} aria-hidden />
        {unread > 0 && <span aria-hidden className="absolute top-2 right-2 size-2.5 rounded-full bg-accent ring-2 ring-white" />}
      </Link>
    </div>
  );
}
