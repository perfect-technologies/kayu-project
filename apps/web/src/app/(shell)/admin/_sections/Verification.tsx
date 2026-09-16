"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminVerificationSubmission, VerificationStatus } from "@kayu/schemas";
import { ShieldCheck } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { FilterSelect } from "../_components/FilterSelect";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { SplitPane } from "../_components/SplitPane";
import { formatDate } from "../_components/format";
import { useAdminParams } from "../_components/useAdminParams";
import { VerificationDetail } from "./VerificationDetail";

const copy = adminCopy.verification;
const LIMIT = 20;
const STATUSES: VerificationStatus[] = ["UNDER_REVIEW", "PENDING", "VERIFIED", "REJECTED"];

function SubmissionRow({ submission, active, onOpen }: { submission: AdminVerificationSubmission; active: boolean; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={cn("flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition", active ? "border-primary bg-secondary/60" : "border-border bg-white hover:bg-secondary/40")}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{submission.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {submission.submittedAt ? copy.submittedOn(formatDate(submission.submittedAt)) : copy.notSubmitted} · {copy.progress(submission.counts.approved, submission.counts.total)}
          </p>
        </div>
        <AdminStatusPill status={submission.verificationStatus} className="shrink-0" />
      </button>
    </li>
  );
}

export function Verification() {
  const { q, page, id, set } = useAdminParams();
  const [status, setStatus] = useState<string>("UNDER_REVIEW");
  const params = { status: (status || undefined) as VerificationStatus | undefined, q: q || undefined, page, limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.admin.verification(params),
    queryFn: () => adminApi(apiClient).verificationQueue(params),
    placeholderData: keepPreviousData,
  });
  const submissions = query.data?.submissions ?? [];
  const selected = submissions.find((submission) => submission.providerId === id) ?? null;
  const stats = query.data?.stats;

  return (
    <section>
      <SectionTitle
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          stats && (
            <p className="text-xs text-muted-foreground">
              {copy.stats.underReview} {stats.underReview} · {copy.stats.verified} {stats.verified} · {copy.stats.rejected} {stats.rejected}
            </p>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox placeholder={copy.searchPlaceholder} />
        <FilterSelect label={copy.statusFilter} value={status} onChange={(value) => { setStatus(value); set({ page: null, id: null }); }} allLabel={adminCopy.common.all} options={STATUSES.map((value) => ({ value, label: adminCopy.pills[value] }))} />
      </div>
      <SplitPane
        open={selected !== null}
        onBack={() => set({ id: null })}
        placeholder={{ icon: ShieldCheck, title: adminCopy.common.selectPrompt }}
        list={
          <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={submissions.length === 0} empty={{ icon: ShieldCheck, title: copy.empty }}>
            <ul className="space-y-2">
              {submissions.map((submission) => (
                <SubmissionRow key={submission.providerId} submission={submission} active={submission.providerId === id} onOpen={() => set({ id: submission.providerId }, { push: true })} />
              ))}
            </ul>
            <Pagination page={page} total={query.data?.pagination.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next, id: null })} />
          </QueryState>
        }
        detail={selected && <VerificationDetail submission={selected} />}
      />
    </section>
  );
}
