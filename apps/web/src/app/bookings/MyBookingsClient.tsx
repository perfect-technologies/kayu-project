"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { I } from "@kayu/ui/web";
import { BookingCard, type BookingCardData } from "@/components/bookings/BookingCard";
import { toV2Status, type V2Status } from "@/lib/booking-v2";

type BookingTab = Exclude<V2Status, "active">;

const TABS: { id: BookingTab; label: string }[] = [
  { id: "upcoming", label: "À venir" },
  { id: "completed", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
];

const EMPTY_COPY: Record<BookingTab, { title: string; sub: string; cta: string | null }> = {
  upcoming: {
    title: "Aucune réservation à venir",
    sub: "Quand vous réservez un pro, il apparaîtra ici.",
    cta: "Trouver un pro",
  },
  completed: {
    title: "Pas encore de missions terminées",
    sub: "Votre historique vit ici.",
    cta: "Réserver un pro",
  },
  cancelled: {
    title: "Aucune annulation",
    sub: "Bon signe — tout roule.",
    cta: null,
  },
};

export function MyBookingsClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<BookingTab>("upcoming");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bookings.all(),
    queryFn: () => bookingsApi(apiClient).getAll(),
    enabled: !!user,
  });

  const bookings = (data?.bookings ?? []) as BookingCardData[];
  const perspective: "client" | "pro" = user?.role === "PROVIDER" ? "pro" : "client";

  const counts = useMemo(() => {
    const c: Record<BookingTab, number> = {
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const b of bookings) {
      const status = toV2Status(b.status);
      if (status !== "active") c[status]++;
    }
    return c;
  }, [bookings]);

  const filtered = useMemo(
    () => bookings.filter((b) => toV2Status(b.status) === tab),
    [bookings, tab],
  );

  if (!authLoading && !isAuthenticated) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <h1 className="k-display-m" style={{ marginBottom: 12 }}>
          Connectez-vous pour voir vos réservations
        </h1>
        <p className="k-body" style={{ color: "var(--k-text-muted)", marginBottom: 24 }}>
          Retrouvez toutes vos missions passées et à venir.
        </p>
        <button className="k-btn k-btn-primary" onClick={() => router.push("/auth")}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "8px 0 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="k-display-m" style={{ margin: "0 0 6px" }}>
            Mes réservations
          </h1>
          <div className="k-body-m" style={{ color: "var(--k-text-muted)" }}>
            Vos missions passées et à venir, avec les détails de réservation.
          </div>
        </div>

        {/* Desktop tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            borderBottom: "1px solid var(--k-border)",
            marginBottom: 24,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const count = counts[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 0,
                  border: 0,
                  background: "transparent",
                  borderBottom: `2px solid ${active ? "var(--k-primary)" : "transparent"}`,
                  color: active ? "var(--k-text-primary)" : "var(--k-text-muted)",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  marginBottom: -1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="k-num"
                    style={{
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active ? "var(--k-primary-subtle)" : "var(--k-surface-muted)",
                      color: active ? "var(--k-primary-hover)" : "var(--k-text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <BookingListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyBookings
            tab={tab}
            onBrowse={() => router.push("/")}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {filtered.map((b) => (
              <BookingCard key={b.id} booking={b} perspective={perspective} />
            ))}
          </div>
        )}
    </div>
  );
}

function EmptyBookings({ tab, onBrowse }: { tab: BookingTab; onBrowse: () => void }) {
  const copy = EMPTY_COPY[tab];
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          margin: "0 auto 16px",
          background: "var(--k-surface-primary)",
          color: "var(--k-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I.calendar size={28} />
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          fontSize: 17,
          marginBottom: 6,
        }}
      >
        {copy.title}
      </div>
      <div
        className="k-body-m"
        style={{ color: "var(--k-text-muted)", maxWidth: 320, margin: "0 auto 18px" }}
      >
        {copy.sub}
      </div>
      {copy.cta && (
        <button className="k-btn k-btn-primary" onClick={onBrowse}>
          {copy.cta}
        </button>
      )}
    </div>
  );
}

function BookingListSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 188,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border-subtle)",
            borderRadius: 16,
          }}
          className="animate-k-shimmer"
        />
      ))}
    </div>
  );
}
