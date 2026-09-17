import { Check, MessageSquare, Star } from "lucide-react";
import type { ProviderDashboardResponse } from "@kayu/schemas";
import { MetricCard } from "@/components/ui/MetricCard";
import { espaceCopy } from "@/copy/espace";

const copy = espaceCopy.metrics;

/** Demandes à traiter · Terminées · Note moyenne, 3-up at every width. */
export function MetricsRow({ metrics }: { metrics: ProviderDashboardResponse["metrics"] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <MetricCard index={0} icon={<MessageSquare size={20} aria-hidden />} value={metrics.pending} label={copy.pending.label} sub={copy.pending.sub} />
      <MetricCard index={1} icon={<Check size={20} aria-hidden />} value={metrics.completed} label={copy.completed.label} sub={copy.completed.sub} />
      <MetricCard
        index={2}
        icon={<Star size={20} aria-hidden />}
        value={metrics.ratingCount > 0 ? metrics.ratingAvg.toFixed(1) : copy.noRating}
        label={copy.rating.label}
        sub={copy.rating.sub(metrics.ratingCount)}
      />
    </div>
  );
}
