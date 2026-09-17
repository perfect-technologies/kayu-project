"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Check, ChevronRight, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import { earningsApi, queryKeys } from "@kayu/api";
import type { EarningsTransactionsResponse } from "@kayu/schemas";
import { formatCdf, formatSlotDay } from "@/components/bookings/format";
import { WeekBars } from "@/components/espace/WeekBars";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { revenusCopy } from "@/copy/revenus";
import { apiClient } from "@/lib/api";

const copy = revenusCopy;
const PREVIEW = 6;
const PAGE_SIZE = 20;

type Transaction = EarningsTransactionsResponse["items"][number];

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const booking = transaction.booking;
  const category = booking?.categoryLabel ?? (transaction.type === "BONUS" ? copy.transactions.bonus : copy.transactions.fallbackLabel);
  const label = booking ? `${category} · ${booking.clientName}` : category;
  const inner = (
    <>
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-extrabold text-primary">
        {category.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{booking ? formatSlotDay(booking.scheduledLocal) : ""}</span>
      </span>
      <span className="shrink-0 text-sm font-extrabold text-emerald-700">{formatCdf(transaction.netAmt)}</span>
      {booking && <ChevronRight size={16} aria-hidden className="shrink-0 text-muted-foreground" />}
    </>
  );
  const className = "flex items-center gap-3 rounded-2xl border border-border bg-white p-3";
  return booking ? (
    <Link href={`/reservation/${booking.id}`} className={className} aria-label={copy.transactions.open(label)}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function Transactions() {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const first = useQuery({
    queryKey: queryKeys.earnings.transactions({ page: 1, limit: PAGE_SIZE }),
    queryFn: () => earningsApi(apiClient).transactions({ page: 1, limit: PAGE_SIZE }),
  });
  const extra = useQuery({
    queryKey: queryKeys.earnings.transactions({ page, limit: PAGE_SIZE }),
    queryFn: () => earningsApi(apiClient).transactions({ page, limit: PAGE_SIZE }),
    enabled: expanded && page > 1,
  });
  const [loaded, setLoaded] = useState<Transaction[]>([]);

  const base = first.data?.items ?? [];
  const items = expanded ? [...base, ...loaded] : base.slice(0, PREVIEW);
  const total = first.data?.total ?? 0;
  const hasMore = expanded && base.length + loaded.length < total;

  useEffect(() => {
    if (!extra.data || page === 1) return;
    setLoaded((current) => {
      const known = new Set(current.map((item) => item.id));
      return [...current, ...extra.data.items.filter((item) => !known.has(item.id))];
    });
  }, [extra.data, page]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold sm:text-xl">{copy.transactions.title}</h2>
        {total > PREVIEW && (
          <button
            type="button"
            onClick={() => {
              setExpanded((value) => !value);
              setPage(1);
              setLoaded([]);
            }}
            className="inline-flex min-h-9 items-center text-sm font-bold text-primary"
          >
            {expanded ? copy.transactions.seeLess : copy.transactions.seeAll}
          </button>
        )}
      </div>
      {first.isLoading && (
        <div aria-hidden className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      )}
      {first.isError && <ErrorCard onRetry={() => void first.refetch()} />}
      {first.data && items.length === 0 && (
        <p className="rounded-3xl border-2 border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted-foreground">{copy.transactions.empty}</p>
      )}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((transaction) => (
            <li key={transaction.id}>
              <TransactionRow transaction={transaction} />
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <button type="button" onClick={() => setPage((value) => value + 1)} disabled={extra.isFetching} className="secondary-action mt-3 w-full">
          {copy.transactions.more}
        </button>
      )}
    </section>
  );
}

export function RevenusClient() {
  const summary = useQuery({ queryKey: queryKeys.earnings.summary, queryFn: () => earningsApi(apiClient).summary() });
  const data = summary.data;

  return (
    <div className="mobile-page max-w-4xl">
      <PageHeader
        title={copy.title}
        back="/mon-espace"
        backLabel={copy.backLabel}
        centered
        action={<span className="inline-flex h-9 shrink-0 items-center rounded-full border border-border bg-white px-3 text-xs font-semibold text-foreground">{copy.period}</span>}
      />

      <div className="mt-6 space-y-6">
        {summary.isLoading && (
          <div aria-hidden className="space-y-6">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Skeleton className="h-32 rounded-[22px]" />
              <Skeleton className="h-32 rounded-[22px]" />
              <Skeleton className="h-32 rounded-[22px]" />
            </div>
          </div>
        )}
        {summary.isError && <ErrorCard onRetry={() => void summary.refetch()} />}
        {data && (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Wallet size={22} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-primary-foreground/75">{copy.hero.total}</p>
                  <p className="font-heading text-3xl font-extrabold tracking-tight">{formatCdf(data.total)}</p>
                  <p className="mt-1 text-xs text-primary-foreground/70">{copy.hero.caption}</p>
                </div>
              </div>
              <WeekBars values={data.byDay} />
            </section>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <MetricCard index={0} icon={<Calendar size={20} aria-hidden />} value={data.completedThisWeek} label={copy.metrics.interventions.label} sub={copy.metrics.interventions.sub} />
              <MetricCard
                index={1}
                icon={<Check size={20} aria-hidden />}
                value={data.acceptanceRate === null ? copy.metrics.none : `${data.acceptanceRate} %`}
                label={copy.metrics.acceptance.label}
                sub={copy.metrics.acceptance.sub}
              />
              <MetricCard
                index={2}
                icon={<Star size={20} aria-hidden />}
                value={data.ratingCount > 0 ? data.ratingAvg.toFixed(1) : copy.metrics.none}
                label={copy.metrics.rating.label}
                sub={copy.metrics.rating.sub(data.ratingCount)}
              />
            </div>

            <Transactions />

            <button type="button" onClick={() => toast(copy.withdrawSoon)} className="primary-action primary-action--gold">
              <Wallet size={18} aria-hidden /> {copy.withdraw}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
