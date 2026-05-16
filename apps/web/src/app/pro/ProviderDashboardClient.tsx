"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { dashboardApi, queryKeys } from "@kayu/api";
import { Greeting } from "@/components/dashboard/provider/Greeting";
import { DashboardHero } from "@/components/dashboard/provider/DashboardHero";
import { TodoStrip } from "@/components/dashboard/provider/TodoStrip";
import { RenforceTonProfil } from "@/components/dashboard/provider/RenforceTonProfil";
import type { TodoRowItem } from "@/components/dashboard/provider/TodoRow";
import { TodayList } from "@/components/dashboard/provider/TodayList";
import { UpcomingList } from "@/components/dashboard/provider/UpcomingList";
import { ReviewsList } from "@/components/dashboard/provider/ReviewsList";
import { PulseStrip } from "@/components/dashboard/provider/PulseStrip";
import { DashboardSkeleton } from "@/components/dashboard/provider/DashboardSkeleton";
import {
  formatRelativeShort,
  pickHeroBookingId,
  pickHeroVariant,
} from "@/components/dashboard/provider/providerDashboardHelpers";

export function ProviderDashboardClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
    enabled: !!user && user?.role === "PROVIDER",
  });

  const todos = useMemo<TodoRowItem[]>(() => {
    if (!data) return [];
    const items: TodoRowItem[] = [];
    const heroVariant = pickHeroVariant(data);
    const heroId = pickHeroBookingId(data, heroVariant);

    for (const todo of data.todos?.bookingsToClose ?? []) {
      items.push({
        key: `close-${todo.bookingId}`,
        kind: "close_overdue",
        title: `Clôture "${todo.title} · ${todo.client.firstName}"`,
        meta: `Mission du ${new Date(todo.scheduledDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })} non terminée · ${todo.price.toLocaleString("fr-FR")} FC en attente`,
        href: `/bookings/${todo.bookingId}`,
        cta: "Clôturer",
      });
    }

    for (const booking of data.bookingRequests ?? []) {
      if (booking.id === heroId) continue;
      const clientName = booking.client?.name ?? "Client";
      const firstName = clientName.split(" ")[0] ?? clientName;
      const dayShort = booking.scheduledDate
        ? new Date(booking.scheduledDate).toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
          })
        : "";
      const priceLabel = booking.price
        ? `${booking.price.toLocaleString("fr-FR")} FC`
        : "Prix à convenir";
      items.push({
        key: `pending-${booking.id}`,
        kind: "extra_pending",
        title: `Réponds à ${firstName} · ${booking.title}${dayShort ? ` ${dayShort}` : ""}`,
        meta: `Demandé ${booking.createdAt ? formatRelativeShort(booking.createdAt) : "récemment"} · ${priceLabel}`,
        href: `/bookings/${booking.id}`,
        cta: "Répondre",
      });
    }

    for (const m of data.todos?.unreadMessages ?? []) {
      const title =
        m.unreadCount > 1
          ? `${m.client.firstName} t'a écrit · ${m.unreadCount} messages`
          : `${m.client.firstName} t'a écrit`;
      const meta = m.lastMessagePreview
        ? `« ${m.lastMessagePreview} »`
        : `Conversation · ${formatRelativeShort(m.lastMessageAt)}`;
      const recipientId = m.client.id;
      const recipientName = `${m.client.firstName} ${m.client.lastName}`.trim();
      items.push({
        key: `msg-${m.conversationId}`,
        kind: "unread_message",
        title,
        meta,
        href: recipientId
          ? `/messages?recipientId=${encodeURIComponent(recipientId)}&recipientName=${encodeURIComponent(recipientName)}`
          : "/messages",
        cta: "Répondre",
      });
    }

    return items;
  }, [data]);

  if (authLoading || !user || user.role !== "PROVIDER") {
    return <DashboardSkeleton />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }}>
        <ErrorBlock onRetry={() => refetch()} firstName={user.firstName ?? "Pro"} />
      </div>
    );
  }

  const variant = pickHeroVariant(data);
  const heroBookingId = pickHeroBookingId(data, variant);

  const provider = data.provider;
  const firstName = user.firstName ?? "Pro";
  const rating = data.stats.avgRating.value;
  const totalJobs = provider.totalJobs ?? 0;
  const trust: "NEWCOMER" | "ESTABLISHED" | "TRUSTED" | "EXPERT" =
    totalJobs >= 50
      ? "EXPERT"
      : totalJobs >= 20
        ? "TRUSTED"
        : totalJobs >= 5
          ? "ESTABLISHED"
          : "NEWCOMER";
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";
  const zoneRadiusKm = data.availability.zoneRadiusKm ?? 10;
  const isAvailable = data.availability.isAvailable;

  const todayJobs = (data.today.jobs ?? []).filter((j) => j.id !== heroBookingId);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const upcoming = (data.upcomingBookings ?? [])
    .filter((b) => b.status === "CONFIRMED")
    .filter((b) => {
      if (!b.scheduledDate) return false;
      return new Date(b.scheduledDate).getTime() > endOfToday.getTime();
    })
    .filter((b) => b.id !== heroBookingId)
    .slice(0, 3);
  const recentReviews = data.recentReviews ?? [];

  const showSections =
    variant !== "onboarding" && variant !== "unavailable" && variant !== "empty";

  return (
    <div
      style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }}
      className="k-pd-page"
    >
      <Greeting
        firstName={firstName}
        rating={rating}
        totalJobs={totalJobs}
        trust={trust}
        isAvailable={isAvailable}
        zoneCity={zoneCity}
        zoneRadiusKm={zoneRadiusKm}
      />

      <DashboardHero data={data} />

      {variant !== "onboarding" && <RenforceTonProfil />}

      {todos.length > 0 && <TodoStrip items={todos} />}

      {showSections && (
        <div
          className="k-pd-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <TodayList items={todayJobs} estimatedRecette={data.today.estimatedRecette ?? 0} />
          <UpcomingList items={upcoming} />
        </div>
      )}

      {showSections && recentReviews.length > 0 && (
        <ReviewsList providerId={provider.id} items={recentReviews} />
      )}

      <PulseStrip
        stats={data.stats}
        ratingValue={rating}
        ratingDelta={data.stats.avgRating.delta}
      />

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.k-pd-page) {
            padding: 20px 24px 40px !important;
          }
          :global(.k-pd-grid) {
            grid-template-columns: 1.4fr 1fr !important;
            gap: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}

function ErrorBlock({ firstName, onRetry }: { firstName: string; onRetry: () => void }) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Bonjour {firstName}
        </h1>
      </div>
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 32,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <I.alertCircle size={36} color="var(--k-text-muted)" />
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          Impossible de charger ton tableau de bord.
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--k-text-body)" }}>
          Vérifie ta connexion et réessaie.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="k-btn k-btn-primary"
          style={{ marginTop: 8 }}
        >
          Réessayer
        </button>
      </div>
    </>
  );
}
