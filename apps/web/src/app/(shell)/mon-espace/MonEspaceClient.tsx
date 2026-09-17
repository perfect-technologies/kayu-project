"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { dashboardApi, queryKeys } from "@kayu/api";
import { Greeting } from "@/components/espace/Greeting";
import { HistoryList } from "@/components/espace/HistoryList";
import { MetricsRow } from "@/components/espace/MetricsRow";
import { ProfileRow } from "@/components/espace/ProfileRow";
import { RequestAccordion } from "@/components/espace/RequestAccordion";
import { StatusBanner } from "@/components/espace/StatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { espaceCopy } from "@/copy/espace";
import { apiClient } from "@/lib/api";

const copy = espaceCopy;

function DashboardSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Skeleton className="h-32 rounded-[22px]" />
        <Skeleton className="h-32 rounded-[22px]" />
        <Skeleton className="h-32 rounded-[22px]" />
      </div>
    </div>
  );
}

export function MonEspaceClient() {
  const { user } = useAuth();
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).provider(),
    enabled: Boolean(user?.provider),
  });

  if (user && !user.provider) {
    return (
      <div className="mobile-page max-w-4xl">
        <EmptyState
          icon={Plus}
          title={copy.noProvider.title}
          description={copy.noProvider.description}
          action={{ href: "/prestataire/nouveau", label: copy.noProvider.action, tone: "gold" }}
        />
      </div>
    );
  }

  const data = dashboard.data;

  return (
    <div className="mobile-page max-w-4xl">
      {dashboard.isLoading && <DashboardSkeleton />}
      {dashboard.isError && <ErrorCard onRetry={() => void dashboard.refetch()} />}
      {data && (
        <div className="space-y-6">
          <Greeting photo={data.provider.profilePhoto} displayName={data.provider.displayName} isAvailable={data.provider.isAvailable} />
          <StatusBanner isAvailable={data.provider.isAvailable} hidden={data.provider.hidden} />
          <MetricsRow metrics={data.metrics} />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-extrabold sm:text-xl">{copy.requests.title}</h2>
              {data.pendingBookings.length > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 text-xs font-extrabold text-accent-foreground">
                  {data.pendingBookings.length}
                </span>
              )}
            </div>
            <RequestAccordion bookings={data.pendingBookings} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold sm:text-xl">{copy.profile.title}</h2>
            <ProfileRow provider={data.provider} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold sm:text-xl">{copy.history.title}</h2>
            <HistoryList bookings={data.history} />
          </section>
        </div>
      )}
    </div>
  );
}
