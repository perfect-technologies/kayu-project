"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { dashboardApi, queryKeys } from "@kayu/api";
import { Greeting } from "@/components/dashboard/client/Greeting";
import { DashboardHero } from "@/components/dashboard/client/DashboardHero";
import { TodoStrip } from "@/components/dashboard/client/TodoStrip";
import { UpcomingList } from "@/components/dashboard/client/UpcomingList";
import { ProvidersList } from "@/components/dashboard/client/ProvidersList";
import { ActivityList } from "@/components/dashboard/client/ActivityList";
import { DashboardSkeleton } from "@/components/dashboard/client/DashboardSkeleton";
import {
  pickHeroVariant,
  pickHeroBooking,
  excludeHeroFromUpcoming,
  pickActivityRows,
  pickGreetingSummary,
} from "@/components/dashboard/client/dashboardHelpers";

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.client,
    queryFn: () => dashboardApi(apiClient).getClientDashboard(),
    enabled: !!user,
  });

  if (isLoading || !data) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 16px 32px" }}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 16px 32px" }}>
        <Greeting
          firstName={user?.firstName ?? ""}
          summary="Tableau de bord"
          isDesktop={isDesktop}
        />
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 14,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <I.alertCircle size={36} color="var(--k-text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Impossible de charger ton tableau de bord.
          </h2>
          <p style={{ fontSize: 13, color: "var(--k-text-muted)", margin: 0 }}>
            Vérifie ta connexion et réessaie.
          </p>
          <button className="k-btn k-btn-primary" onClick={() => refetch()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const firstName = data.user?.firstName ?? "";
  const variant = pickHeroVariant(data);
  const heroBooking = pickHeroBooking(data, variant);
  const upcomingForList = excludeHeroFromUpcoming(data, heroBooking?.id ?? null);
  const activityRows = pickActivityRows(data);
  const summary = pickGreetingSummary(data, variant);
  const isEmpty = variant === "empty";

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: isDesktop ? "20px 24px 40px" : "12px 16px 32px",
      }}
    >
      <Greeting firstName={firstName} summary={summary} isDesktop={isDesktop} />
      <DashboardHero data={data} />

      {!isEmpty && (
        <TodoStrip
          reviews={data.todos.reviews}
          unreadMessages={data.todos.unreadMessages}
        />
      )}

      {!isEmpty && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1.4fr 1fr" : "1fr",
            gap: 14,
          }}
        >
          <UpcomingList items={upcomingForList} />
          <ProvidersList items={data.providers} />
        </div>
      )}

      {!isEmpty && <ActivityList items={activityRows} />}
    </div>
  );
}
