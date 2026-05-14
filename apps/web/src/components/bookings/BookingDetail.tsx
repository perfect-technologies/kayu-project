// apps/web/src/components/bookings/BookingDetail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, finalOffersApi, queryKeys } from "@kayu/api";
import type { FinalOffer } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { toV2Status } from "@/lib/booking-v2";
import { BookingHero } from "./BookingHero";
import { StepStrip } from "./StepStrip";
import { AccordCard } from "./AccordCard";
import { AddressRow } from "./AddressRow";
import { MobileStickyBar } from "./MobileStickyBar";
import { ActionsCard } from "./ActionsCard";
import { DetailsCard } from "./DetailsCard";
import { FinalOfferDialog } from "./FinalOfferDialog";
import {
  deriveBookingActions,
  type BookingAction,
} from "./bookingActions";

export interface BookingDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  address?: string | null;
  city?: string | null;
  scheduledDate?: string | Date | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
  price?: number | null;
  commissionPct?: number | null;
  commissionAmt?: number | null;
  providerNetAmt?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  providerId?: string | null;
  clientId?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  clientNotes?: string | null;
  providerNotes?: string | null;
  duration?: number | null;
  provider?: {
    id?: string | null;
    userId?: string | null;
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
      avatar?: string | null;
    } | null;
  } | null;
  client?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  } | null;
  progress?: string | null;
  reviewed?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
}

type BackendStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type BookingMutationInput = {
  status?: BackendStatus;
  isPaid?: true;
  paymentMethod?: "cash";
};

function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setV(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return v;
}

export function BookingDetail({
  booking,
  perspective,
}: {
  booking: BookingDetailData;
  perspective: "client" | "pro";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const isClient = perspective === "client";
  const v2 = toV2Status(booking.status);

  const counterparty = isClient
    ? {
        first: booking.provider?.user?.firstName ?? "",
        last: booking.provider?.user?.lastName ?? "",
        id: booking.provider?.userId ?? null,
        role: booking.provider?.profession
          ? `Votre ${booking.provider.profession}`
          : "Votre pro",
        verified: !!booking.provider?.user?.isVerified,
        rating: booking.rating ?? null,
        reviews: booking.reviewCount ?? null,
      }
    : {
        first: booking.client?.firstName ?? "",
        last: booking.client?.lastName ?? "",
        id: booking.client?.id ?? booking.clientId ?? null,
        role: "Client",
        verified: false,
        rating: null,
        reviews: null,
      };

  const clientFirstName = booking.client?.firstName ?? "";

  const onMessage = () => {
    const name = `${counterparty.first} ${counterparty.last}`.trim();
    if (counterparty.id) {
      router.push(
        `/messages?recipientId=${encodeURIComponent(counterparty.id)}&recipientName=${encodeURIComponent(name || counterparty.role)}`,
      );
      return;
    }
    router.push("/messages");
  };

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi(apiClient).cancel(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (data: BookingMutationInput) =>
      bookingsApi(apiClient).update(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
    },
  });

  const offerQueryParams = useMemo(() => ({ bookingId: booking.id }), [booking.id]);
  const { data: offersData } = useQuery({
    queryKey: queryKeys.finalOffers.all(offerQueryParams),
    queryFn: () => finalOffersApi(apiClient).getAll(offerQueryParams),
    enabled: !!booking.id,
  });
  const bookingOffers = offersData?.finalOffers ?? [];
  const activeOffer: FinalOffer | null = useMemo(() => {
    const accepted = bookingOffers.find((o) => o.status === "ACCEPTED");
    if (accepted) return accepted;
    return bookingOffers.find((o) => o.status === "PENDING") ?? null;
  }, [bookingOffers]);

  const createOffer = useMutation({
    mutationFn: (data: Parameters<ReturnType<typeof finalOffersApi>["create"]>[0]) =>
      finalOffersApi(apiClient).create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.finalOffers.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversations(),
      });
    },
  });

  const providerRecordId = booking.provider?.id ?? null;
  const clientUserId = booking.client?.id ?? booking.clientId ?? null;
  const isLockedStatus =
    booking.status === "COMPLETED" || booking.status === "CANCELLED";
  const canRecordOffer =
    !isClient && !isLockedStatus && !!providerRecordId && !!clientUserId;

  const [offerOpen, setOfferOpen] = useState(false);

  const scheduledForOffer = (() => {
    const source = activeOffer?.scheduledDate ?? booking.scheduledDate;
    if (!source) return undefined;
    return source instanceof Date ? source : new Date(source);
  })();
  const offerInitialValues = {
    title: activeOffer?.title ?? booking.title ?? "",
    description: activeOffer?.description ?? booking.description ?? "",
    price: activeOffer?.price ?? booking.price ?? "",
    durationHours:
      activeOffer?.duration != null
        ? String(Math.max(0.25, activeOffer.duration / 60))
        : booking.duration != null
          ? String(Math.max(0.25, booking.duration / 60))
          : undefined,
    scheduledDate: scheduledForOffer,
    address: activeOffer?.address ?? booking.address ?? "",
    city: activeOffer?.city ?? booking.city ?? "Kinshasa",
    notes: activeOffer?.notes ?? "",
  };

  const onCompleteBooking = async () => {
    if (booking.status === "CONFIRMED") {
      await updateMutation.mutateAsync({ status: "IN_PROGRESS" });
    }
    updateMutation.mutate({ status: "COMPLETED" });
  };

  const busy = cancelMutation.isPending || updateMutation.isPending;

  const actions = deriveBookingActions({
    v2Status: v2,
    backendStatus: booking.status,
    isPaid: !!booking.isPaid,
    isClient,
    hasOffer: !!activeOffer,
    reviewed: !!booking.reviewed,
    counterpartyFirstName: counterparty.first,
  });

  const onAction = (id: BookingAction["id"]) => {
    switch (id) {
      case "message":
      case "messageNamed":
        return onMessage();
      case "cancel":
        return cancelMutation.mutate();
      case "rebook":
        if (booking.providerId)
          router.push(`/providers/${booking.providerId}`);
        return;
      case "review":
        if (booking.providerId)
          router.push(
            `/review/${booking.providerId}?bookingId=${booking.id}`,
          );
        return;
      case "confirmBooking":
        return updateMutation.mutate({ status: "CONFIRMED" });
      case "completeBooking":
        return void onCompleteBooking();
      case "confirmPayment":
        return updateMutation.mutate({ isPaid: true, paymentMethod: "cash" });
      case "createAccord":
      case "adjustAccord":
        setOfferOpen(true);
        return;
    }
  };

  const accordDuration = activeOffer?.duration ?? booking.duration ?? null;
  const heroBooking = {
    id: booking.id,
    title: activeOffer?.title ?? booking.title,
    status: booking.status,
    scheduledDate: activeOffer?.scheduledDate ?? booking.scheduledDate,
    price: activeOffer?.price ?? booking.price,
    isPaid: booking.isPaid ?? false,
    cancelledBy: booking.cancelledBy,
    cancelReason: booking.cancelReason,
    progress: booking.progress,
  };

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: isDesktop ? "16px 24px 40px" : "12px 16px 96px",
      }}
    >
      <button
        onClick={() => router.push("/bookings")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--k-text-muted)",
          fontSize: 11,
          padding: "6px 2px",
          marginBottom: 12,
          fontFamily: "var(--k-font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <I.arrowLeft size={13} /> Mes réservations
      </button>

      <BookingHero
        booking={heroBooking}
        duration={accordDuration}
        counterparty={counterparty}
        isClient={isClient}
        isDesktop={isDesktop}
        onMessage={onMessage}
      />

      <div style={{ marginTop: 12 }}>
        <StepStrip
          v2Status={v2}
          backendStatus={booking.status}
          isPaid={!!booking.isPaid}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: isDesktop ? 18 : 12,
          gridTemplateColumns: isDesktop ? "1fr 300px" : "1fr",
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isDesktop ? 14 : 12,
          }}
        >
          <AccordCard
            booking={booking}
            offer={activeOffer}
            perspective={perspective}
            isDesktop={isDesktop}
            paidAt={booking.paidAt}
            onCreate={() => setOfferOpen(true)}
            onAdjust={() => setOfferOpen(true)}
            clientFirstName={clientFirstName}
          />
          <AddressRow booking={booking} perspective={perspective} />
        </div>

        {isDesktop && (
          <aside
            style={{
              position: "sticky",
              top: 20,
              alignSelf: "start",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <ActionsCard actions={actions} busy={busy} onAction={onAction} />
            <DetailsCard booking={booking} isClient={isClient} />
          </aside>
        )}
      </div>

      {!isDesktop && (
        <MobileStickyBar actions={actions} busy={busy} onAction={onAction} />
      )}

      {canRecordOffer && providerRecordId && clientUserId && (
        <FinalOfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          providerId={providerRecordId}
          clientId={clientUserId}
          bookingId={booking.id}
          initialValues={offerInitialValues}
          onSubmit={(data) => createOffer.mutateAsync(data)}
          busy={createOffer.isPending}
          commissionPct={booking.commissionPct ?? 10}
          clientFirstName={clientFirstName}
        />
      )}
    </div>
  );
}
