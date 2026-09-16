"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import { Database, GitCommitHorizontal, Globe, HardDrive, Mail, Server, Tag } from "lucide-react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { SectionTitle } from "../_components/SectionTitle";

const copy = adminCopy.system;

export type SystemProps = { webMode: string; nodeVersion: string };

/** Health cards from `GET /admin/health`, plus the web mode and Node version reported by the web server. */
export function System({ webMode, nodeVersion }: SystemProps) {
  const query = useQuery({ queryKey: queryKeys.admin.health, queryFn: () => adminApi(apiClient).health(), retry: 1 });
  const data = query.data;
  const state = (value: "ok" | "error" | undefined) => (value === undefined ? "—" : value === "ok" ? copy.ok : copy.error);
  const tone = (value: "ok" | "error" | undefined) => (value === "error" ? "text-destructive" : undefined);

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      {query.isError && <ErrorCard className="mb-4" onRetry={() => void query.refetch()} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard index={0} icon={<Database size={22} aria-hidden />} value={<span className={tone(data?.database)}>{state(data?.database)}</span>} label={copy.database} />
        <MetricCard index={1} icon={<HardDrive size={22} aria-hidden />} value={<span className={tone(data?.storage)}>{state(data?.storage)}</span>} label={copy.storage} />
        <MetricCard index={2} icon={<Mail size={22} aria-hidden />} value={data ? copy.notConfigured : "—"} label={copy.email} />
        <MetricCard index={3} icon={<Tag size={22} aria-hidden />} value={data?.version ?? "—"} label={copy.version} sub={data?.commit ? `${copy.commit} ${data.commit.slice(0, 8)}` : undefined} />
        <MetricCard index={4} icon={<Globe size={22} aria-hidden />} value={webMode || copy.unknown} label={copy.webMode} />
        <MetricCard index={5} icon={<Server size={22} aria-hidden />} value={nodeVersion || copy.unknown} label={copy.node} />
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <GitCommitHorizontal size={12} aria-hidden /> {data?.commit ?? copy.unknown}
      </p>
    </section>
  );
}
