"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  Inbox,
  Info,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi, queryKeys } from "@kayu/api";
import type { Notification, NotificationType, NotificationsResponse } from "@kayu/schemas";
import { formatRelativeFr } from "@kayu/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingRow } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { notificationsCopy } from "@/copy/notifications";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { notificationHref } from "./notification-links";

const copy = notificationsCopy;
const LIMIT = 30;

const ICONS: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  NEW_MESSAGE: { icon: MessageSquare, className: "bg-blue-50 text-blue-600" },
  BOOKING_NEW: { icon: CalendarClock, className: "bg-amber-50 text-amber-700" },
  BOOKING_CONFIRMED: { icon: CalendarCheck, className: "bg-secondary text-primary" },
  BOOKING_COMPLETED: { icon: CheckCircle, className: "bg-emerald-50 text-emerald-700" },
  BOOKING_CANCELLED: { icon: XCircle, className: "bg-red-50 text-red-700" },
  NEW_REVIEW: { icon: Star, className: "bg-amber-50 text-amber-700" },
  NEW_CLIENT_REVIEW: { icon: Star, className: "bg-amber-50 text-amber-700" },
  VERIFICATION_UPDATED: { icon: ShieldCheck, className: "bg-emerald-50 text-emerald-700" },
  PLACE_SUGGESTION_RESOLVED: { icon: MapPin, className: "bg-primary/10 text-primary" },
  SYSTEM: { icon: Info, className: "bg-muted text-muted-foreground" },
};

const pageParams = (page: number) => ({ page, limit: LIMIT }) as const;

export function NotificationsClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pages, setPages] = useState(1);

  const results = useQueries({
    queries: Array.from({ length: pages }, (_, index) => ({
      queryKey: queryKeys.notifications.list(pageParams(index + 1)),
      queryFn: () => notificationsApi(apiClient).list(pageParams(index + 1)),
    })),
  });
  const first = results[0];
  const items = results.flatMap((result) => result.data?.items ?? []);
  const total = first?.data?.total ?? 0;
  const unreadCount = first?.data?.unreadCount ?? 0;
  const loadingMore = results.some((result) => result.isLoading);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAll = useMutation({
    mutationFn: () => notificationsApi(apiClient).markAllRead(),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const markRead = (notification: Notification) => {
    if (notification.isRead) return;
    for (let page = 1; page <= pages; page += 1) {
      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.list(pageParams(page)), (current) =>
        current
          ? {
              ...current,
              unreadCount: Math.max(0, current.unreadCount - (current.items.some((item) => item.id === notification.id) ? 1 : 0)),
              items: current.items.map((item) => (item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)),
            }
          : current,
      );
    }
    void notificationsApi(apiClient)
      .markRead(notification.id)
      .then(invalidate)
      .catch(() => undefined);
  };

  return (
    <div className="mobile-page max-w-3xl">
      <PageHeader
        back="history"
        backLabel={copy.backLabel}
        title={copy.title}
        subtitle={first?.isSuccess ? copy.subtitle(total) : undefined}
        icon={<Bell size={20} aria-hidden />}
        iconDot={unreadCount > 0}
        iconLabel={copy.bellLabel}
      />
      {unreadCount > 0 && (
        <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="mt-3 inline-flex min-h-9 items-center text-sm font-bold text-primary disabled:opacity-55">
          {copy.markAllRead}
        </button>
      )}

      <section className="mt-5">
        {first?.isLoading ? (
          <div aria-hidden className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <LoadingRow key={index} className="rounded-2xl" />
            ))}
          </div>
        ) : first?.isError ? (
          <ErrorCard onRetry={() => void first.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title={copy.empty.title} description={copy.empty.description} action={{ href: "/", label: copy.empty.action }} />
        ) : (
          <ul className="space-y-2">
            {items.map((notification) => {
              const { icon: Icon, className } = ICONS[notification.type];
              return (
                <li key={notification.id}>
                  <Link
                    href={notificationHref(notification, user?.role)}
                    onClick={() => markRead(notification)}
                    className={cn(
                      "relative flex items-start gap-3 rounded-2xl border border-border p-3 transition-colors",
                      notification.isRead ? "bg-white" : "bg-primary/5",
                    )}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", className)}>
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-foreground">{notification.title}</span>
                      <span className="block line-clamp-1 text-xs text-muted-foreground">{notification.message}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeFr(notification.createdAt)}</span>
                    {!notification.isRead && (
                      <span className="absolute top-3 right-3 size-1.5 rounded-full bg-primary">
                        <span className="sr-only">{copy.unread}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {items.length > 0 && items.length < total && (
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => setPages((count) => count + 1)} disabled={loadingMore} className="secondary-action rounded-full disabled:opacity-55">
              {copy.more}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
