"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminReport } from "@kayu/schemas";
import { CheckCircle2, ExternalLink, Flag, ShieldCheck } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SectionTitle } from "../_components/SectionTitle";
import { formatDate } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";

const copy = adminCopy.reports;
const LIMIT = 50;

/** Where "Voir la cible" goes, by target kind; null when the target has no screen. */
export function reportTargetHref(report: AdminReport): string | null {
  if (!report.target.exists) return null;
  switch (report.target.kind) {
    case "PROVIDER":
      return `/prestataire/${encodeURIComponent(report.target.id)}`;
    case "USER":
      return `/admin?tab=users&id=${encodeURIComponent(report.target.id)}`;
    case "CONVERSATION":
      return `/admin?tab=conversations&id=${encodeURIComponent(report.target.id)}`;
    case "REVIEW":
      return `/admin?tab=reviews&q=${encodeURIComponent(report.target.label)}`;
    default:
      return null;
  }
}

function ReportCard({ report, onResolve }: { report: AdminReport; onResolve: (resolution: string) => Promise<unknown> }) {
  const href = reportTargetHref(report);
  return (
    <article className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wider text-primary uppercase">
          {copy.kinds[report.targetKind]} · <AdminStatusPill status={report.status} className="h-6 normal-case" />
        </span>
        <time className="text-xs text-muted-foreground" dateTime={new Date(report.createdAt).toISOString()}>
          {formatDate(report.createdAt)}
        </time>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{report.reason}</p>
      <p className="mt-2 text-xs text-muted-foreground">{copy.reporter(report.reporter.name)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {copy.target} : <span className="font-semibold text-foreground">{report.target.label}</span>
        {!report.target.exists && <span className="italic"> · {copy.targetMissing}</span>}
      </p>
      {report.resolution && (
        <p className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3 text-xs text-foreground">
          <span className="font-bold">{copy.resolution} : </span>
          {report.resolution}
          {report.resolvedAt && <span className="text-muted-foreground"> · {copy.resolvedBy(formatDate(report.resolvedAt))}</span>}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {href && (
          <Link href={href} target={href.startsWith("/admin") ? undefined : "_blank"} className="secondary-action h-9 px-3 text-xs">
            <ExternalLink size={14} aria-hidden /> {copy.viewTarget}
          </Link>
        )}
        {report.status === "OPEN" && (
          <ConfirmAction
            className="h-9 px-3 text-xs"
            sheet={{ title: copy.sheets.resolve.title, description: copy.sheets.resolve.description, confirmLabel: copy.sheets.resolve.confirm, reason: { label: copy.sheets.resolve.reason, placeholder: copy.sheets.resolve.placeholder, required: true } }}
            onConfirm={onResolve}
          >
            <CheckCircle2 size={14} aria-hidden /> {copy.resolve}
          </ConfirmAction>
        )}
      </div>
    </article>
  );
}

export function Reports() {
  const { page, set } = useAdminParams();
  const [resolved, setResolved] = useState(false);
  const params = { status: resolved ? ("RESOLVED" as const) : ("OPEN" as const), page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.reports(params),
    queryFn: () => adminApi(apiClient).reports(params),
    placeholderData: keepPreviousData,
  });
  const resolve = useAdminMutation({
    mutationFn: ({ reportId, resolution }: { reportId: string; resolution: string }) => adminApi(apiClient).resolveReport(reportId, { status: "RESOLVED", resolution }),
    invalidate: [["admin", "reports"]],
    success: copy.toasts.resolved,
    silent: true,
  });
  const items = query.data?.items ?? [];

  return (
    <section>
      <SectionTitle
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <button type="button" onClick={() => { setResolved((value) => !value); set({ page: null }); }} aria-pressed={resolved} className="secondary-action h-10 px-4 text-xs">
            {resolved ? copy.showOpen : copy.showResolved}
          </button>
        }
      />
      <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={items.length === 0} empty={{ icon: resolved ? Flag : ShieldCheck, title: resolved ? copy.emptyResolved : copy.empty, description: copy.emptyDescription }}>
        <div className="space-y-3">
          {items.map((report) => (
            <ReportCard key={report.id} report={report} onResolve={(resolution) => resolve.mutateAsync({ reportId: report.id, resolution })} />
          ))}
        </div>
      </QueryState>
      {items.length > 0 && <Pagination page={page} total={query.data?.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next })} />}
    </section>
  );
}
