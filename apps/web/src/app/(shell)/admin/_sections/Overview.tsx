"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import { Briefcase, CalendarCheck, Flag, MapPinned, ShieldCheck, Sparkles, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { CommandHero } from "../_components/CommandHero";
import { formatNumber } from "../_components/format";

const copy = adminCopy.overview;

export function Overview() {
  const query = useQuery({ queryKey: queryKeys.admin.overview, queryFn: () => adminApi(apiClient).overview() });
  const data = query.data;
  const value = (n: number | undefined) => (n === undefined ? "—" : formatNumber(n));

  return (
    <div>
      <CommandHero />
      {query.isError && <ErrorCard className="mt-6" onRetry={() => void query.refetch()} />}
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard index={0} icon={<Users size={21} aria-hidden />} value={value(data?.users.total)} label={copy.members} sub={data ? copy.suspended(data.users.suspended) : undefined} />
        <MetricCard index={1} icon={<Briefcase size={21} aria-hidden />} value={value(data?.providers)} label={copy.providers} />
        <MetricCard index={2} icon={<CalendarCheck size={21} aria-hidden />} value={value(data?.bookings)} label={copy.bookings} />
        <MetricCard index={3} icon={<Flag size={21} aria-hidden />} value={value(data?.openReports)} label={copy.reports} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MetricCard
          index={6}
          icon={<Sparkles size={21} aria-hidden />}
          value={value(data?.assistant.conversationsToday)}
          label={copy.assistant}
          sub={data ? copy.assistantSub(data.assistant.messagesSent, data.assistant.bookingsCreated, data.assistant.fallbackRate) : undefined}
          className="h-full sm:col-span-2"
        />
        <Link href="/admin?tab=references&sub=places" className="block rounded-[22px] focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${copy.suggestions} · ${copy.open}`}>
          <MetricCard index={4} icon={<MapPinned size={21} aria-hidden />} value={value(data?.pendingSuggestions)} label={copy.suggestions} sub={copy.open} className="h-full" />
        </Link>
        <Link href="/admin?tab=verification" className="block rounded-[22px] focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${copy.verifications} · ${copy.open}`}>
          <MetricCard index={5} icon={<ShieldCheck size={21} aria-hidden />} value={value(data?.pendingVerifications)} label={copy.verifications} sub={copy.open} className="h-full" />
        </Link>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-white p-6">
        <h3 className="font-bold text-foreground">{copy.cardTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.cardBody}</p>
      </div>
    </div>
  );
}
