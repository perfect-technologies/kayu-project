"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Inbox, Package } from "lucide-react";
import { bookingsApi, dashboardApi, queryKeys } from "@kayu/api";
import type { BookingCard as BookingCardDto, BookingStatus } from "@kayu/schemas";
import { BookingCard } from "@/components/bookings/BookingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { bookingsCopy } from "@/copy/bookings";
import { spacesCopy } from "@/copy/spaces";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = bookingsCopy.list;
const LIST_PARAMS = { limit: 100 } as const;

type Tab = "all" | "active" | "completed" | "cancelled";

const TAB_STATUSES: Record<Tab, readonly BookingStatus[]> = {
  all: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
  active: ["PENDING", "CONFIRMED"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELLED"],
};
const TABS: Tab[] = ["all", "active", "completed", "cancelled"];

function byDateDesc(a: BookingCardDto, b: BookingCardDto): number {
  return String(b.scheduledAt).localeCompare(String(a.scheduledAt));
}

export function MesReservationsClient() {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("all");

  const bookings = useQuery({
    queryKey: queryKeys.bookings.list(LIST_PARAMS),
    queryFn: () => bookingsApi(apiClient).list(LIST_PARAMS),
  });
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard.client,
    queryFn: () => dashboardApi(apiClient).client(),
  });

  const all = useMemo(() => [...(bookings.data?.items ?? [])].sort(byDateDesc), [bookings.data]);
  const counts = useMemo(
    () =>
      Object.fromEntries(TABS.map((key) => [key, all.filter((booking) => TAB_STATUSES[key].includes(booking.status)).length])) as Record<
        Tab,
        number
      >,
    [all],
  );
  const visible = all.filter((booking) => TAB_STATUSES[tab].includes(booking.status));
  const rating = dashboard.data?.clientRating;

  return (
    <div className="mobile-page max-w-3xl">
      <PageHeader
        back="/"
        backLabel={copy.backLabel}
        title={copy.title}
        subtitle={rating && rating.count > 0 ? spacesCopy.rating(rating.avg, rating.count) : undefined}
        icon={<Package size={20} aria-hidden />}
      />

      <div
        role="tablist"
        aria-label={copy.title}
        className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground",
              )}
            >
              {copy.tabs[key]}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  active ? "bg-white/20 text-primary-foreground" : "bg-secondary text-primary",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <section className="mt-5">
        {bookings.isLoading ? (
          <SkeletonList count={3} />
        ) : bookings.isError ? (
          <ErrorCard onRetry={() => void bookings.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState icon={Inbox} title={copy.empty.title} description={copy.empty.description} action={{ href: "/rechercher", label: copy.empty.action }} />
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted-foreground">{copy.emptyFiltered}</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  layout={!reduceMotion}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.24, delay: Math.min(index * 0.03, 0.25) }}
                >
                  <BookingCard booking={booking} perspective="client" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
