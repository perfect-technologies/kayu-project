"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookingDetail,
  type BookingDetailData,
} from "@/components/bookings/BookingDetail";

export function BookingDetailPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingsApi(apiClient).getById(id),
    enabled: !!user,
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h1 className="k-display-m" style={{ marginBottom: 12 }}>
          Connectez-vous pour voir cette réservation
        </h1>
        <button className="k-btn k-btn-primary" onClick={() => router.push("/auth")}>
          Se connecter
        </button>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "12px 0",
        }}
      >
        <div
          className="animate-k-shimmer"
          style={{ height: 32, width: 240, marginBottom: 24, borderRadius: 8 }}
        />
        <div
          className="animate-k-shimmer"
          style={{ height: 420, borderRadius: 16 }}
        />
      </div>
    );
  }

  const booking = (data?.booking as BookingDetailData | undefined) ?? null;

  if (error || !booking) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h1 className="k-display-m" style={{ marginBottom: 12 }}>
          Réservation introuvable
        </h1>
        <p className="k-body" style={{ color: "var(--k-text-muted)", marginBottom: 24 }}>
          Cette réservation n&apos;existe pas ou vous n&apos;y avez pas accès.
        </p>
        <button
          className="k-btn k-btn-primary"
          onClick={() => router.push("/bookings")}
        >
          Retour à mes réservations
        </button>
      </div>
    );
  }

  // Derive perspective from role + relationship. A pro viewing a booking where
  // they are the provider gets the pro perspective; a client gets the client one.
  const perspective: "client" | "pro" =
    user?.role === "PROVIDER" && booking.providerId && user.id !== booking.clientId
      ? "pro"
      : "client";

  return <BookingDetail booking={booking} perspective={perspective} />;
}
