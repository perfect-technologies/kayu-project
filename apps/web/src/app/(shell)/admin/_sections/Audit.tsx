"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { ActivityLog } from "@kayu/schemas";
import { Activity } from "lucide-react";
import { truncateId } from "@kayu/utils";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { AdminTable } from "../_components/AdminTable";
import { SectionTitle } from "../_components/SectionTitle";
import { formatDateTime } from "../_components/format";

const copy = adminCopy.audit;
const COLUMNS = [
  { key: "action", label: copy.columns.action },
  { key: "actor", label: copy.columns.actor },
  { key: "target", label: copy.columns.target },
  { key: "date", label: copy.columns.date, className: "whitespace-nowrap" },
];

/** Console or public screen for an audit target, when one exists. */
export function auditTargetHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  const id = encodeURIComponent(entityId);
  switch (entityType) {
    case "User":
      return `/admin?tab=users&id=${id}`;
    case "Provider":
      return `/prestataire/${id}`;
    case "Booking":
      return `/reservation/${id}`;
    case "Conversation":
      return `/admin?tab=conversations&id=${id}`;
    case "ContactMessage":
      return `/admin?tab=contacts&id=${id}`;
    case "Report":
      return "/admin?tab=reports";
    case "Review":
      return "/admin?tab=reviews";
    case "Category":
    case "Subcategory":
      return "/admin?tab=categories";
    case "Place":
    case "PlaceSuggestion":
      return "/admin?tab=references&sub=places";
    case "ReferenceItem":
      return "/admin?tab=references&sub=lists";
    case "SystemSetting":
      return "/admin?tab=content";
    default:
      return null;
  }
}

function Target({ item }: { item: ActivityLog }) {
  const href = auditTargetHref(item.entityType, item.entityId);
  const label = item.entityId ? `${item.entityType} · ${truncateId(item.entityId)}` : item.entityType;
  return href ? (
    <Link href={href} className="text-xs font-bold text-primary">
      {label}
    </Link>
  ) : (
    <span className="text-xs text-muted-foreground">{label}</span>
  );
}

function Metadata({ item }: { item: ActivityLog }) {
  if (item.metadata === null || item.metadata === undefined) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">{copy.details}</summary>
      <pre className="mt-1 max-w-full overflow-x-auto rounded-xl bg-muted/60 p-2 text-[11px] whitespace-pre-wrap">{JSON.stringify(item.metadata, null, 1)}</pre>
    </details>
  );
}

export function Audit() {
  const query = useQuery({ queryKey: queryKeys.admin.audit, queryFn: () => adminApi(apiClient).audit() });
  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <AdminTable
        columns={COLUMNS}
        rows={query.data?.items ?? []}
        keyOf={(item) => item.id}
        cells={(item) => [
          <div key="action" className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{item.action}</p>
            <Metadata item={item} />
          </div>,
          <span key="actor" className="text-xs">{item.actor?.name ?? copy.system}</span>,
          <Target key="target" item={item} />,
          <span key="date" className="text-xs whitespace-nowrap">{formatDateTime(item.createdAt)}</span>,
        ]}
        card={(item) => (
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{item.action}</p>
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(item.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.actor?.name ?? copy.system}</p>
            <div className="mt-1">
              <Target item={item} />
            </div>
            <Metadata item={item} />
          </div>
        )}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        empty={{ icon: Activity, title: copy.empty }}
      />
    </section>
  );
}
