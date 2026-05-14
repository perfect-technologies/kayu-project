"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { bookingsApi } from "@kayu/api";
import { CUSTOM_TASK_KEY } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { KayouMoment } from "@kayu/ui/web";
import { Layout } from "@/components/layout";

import { BookingShell } from "@/components/booking/BookingShell";
import { SidebarRail } from "@/components/booking/SidebarRail";
import { MobileStickyBar } from "@/components/booking/MobileStickyBar";
import { Step1Service } from "@/components/booking/Step1Service";
import { Step2DateTime } from "@/components/booking/Step2DateTime";
import { Step3Address } from "@/components/booking/Step3Address";
import { Step4Recap } from "@/components/booking/Step4Recap";
import { useBookingDraft } from "@/components/booking/booking-state";

interface ProviderMini {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  avatarUrl: string | null;
  city: string;
  verified: boolean;
  subcategories: Array<{ id: string; slug: string; name: string; isPrimary?: boolean }>;
}

const STEPS = [
  { label: "Service",         shortLabel: "Service" },
  { label: "Date & heure",    shortLabel: "Date" },
  { label: "Adresse",         shortLabel: "Adresse" },
  { label: "Récapitulatif",   shortLabel: "Récap" },
];

export function BookingFlowClient({ provider }: { provider: ProviderMini }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { state, dispatch, clear } = useBookingDraft(provider.id);
  const step = state.step;
  const setStep = (next: number | ((prev: number) => number)) =>
    dispatch({ type: "SET_STEP", step: typeof next === "function" ? next(state.step) : next });
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState(false);

  const startingPrice = provider.hourlyRate || 0;
  const fullName = `${provider.firstName} ${provider.lastName}`.trim();

  const createBooking = useMutation({
    mutationFn: (payload: Parameters<ReturnType<typeof bookingsApi>["create"]>[0]) => bookingsApi(apiClient).create(payload),
    onSuccess: (result) => {
      setCreatedBookingId(result.booking.id);
      clear();
      setStep(4);
    },
    onError: (err: any) => {
      if (typeof err?.message === "string" && /SLOT_TAKEN/.test(err.message)) {
        setConflictBanner(true);
        setStep(1);
        dispatch({ type: "SET_TIME", time: "" });
        return;
      }
      alert(err?.message || "Erreur lors de la réservation");
    },
  });

  function handleConfirm() {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (!state.scheduledDate || !state.scheduledTime) return;
    const [h, m] = state.scheduledTime.split(":").map(Number);
    const [yy, mm, dd] = state.scheduledDate.split("-").map(Number);
    const scheduled = new Date(yy, mm - 1, dd, h, m, 0, 0);

    const taskLabel = state.taskKey === CUSTOM_TASK_KEY ? (state.taskLabelOverride ?? "Autre") : (state.taskKey ?? "Service");
    const addressParts = [state.street.trim(), state.commune ?? "", "Kinshasa"].filter(Boolean);
    const address = addressParts.join(", ");
    const clientNotes = [state.description.trim(), state.locationNote.trim() ? `Repère: ${state.locationNote.trim()}` : ""].filter(Boolean).join("\n");

    createBooking.mutate({
      providerId: provider.id,
      title: taskLabel,
      description: state.description || undefined,
      address,
      city: "Kinshasa",
      scheduledDate: scheduled,
      duration: state.durationMin ?? undefined,
      price: startingPrice,
      clientNotes: clientNotes || undefined,
      subcategoryId: state.subcategoryId ?? undefined,
      commune: state.commune ?? undefined,
    });
  }

  if (createdBookingId) {
    const dateLabel = state.scheduledDate && state.scheduledTime
      ? new Date(`${state.scheduledDate}T${state.scheduledTime}:00`).toLocaleDateString("fr-FR", {
          weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
        })
      : "";
    return (
      <Layout>
        <KayouMoment
          provider={{ firstName: provider.firstName, initials: `${provider.firstName[0]}${provider.lastName[0]}`.toUpperCase(), response: "15 min" }}
          dateLabel={dateLabel.replace(",", " ·")}
          onMessage={() => router.push("/messages")}
          onViewBooking={() => router.replace(`/bookings/${createdBookingId}`)}
        />
      </Layout>
    );
  }

  const canAdvance =
    step === 0
      ? !!state.taskKey && (state.taskKey !== CUSTOM_TASK_KEY || (state.taskLabelOverride ?? "").trim().length >= 3)
      : step === 1
        ? !!state.scheduledDate && !!state.scheduledTime
        : step === 2
          ? !!state.commune
          : true;

  const summary = [
    {
      label: "Service",
      value: state.taskKey
        ? `${state.taskKey === CUSTOM_TASK_KEY ? state.taskLabelOverride ?? "Autre" : state.taskKey}${state.durationMin ? ` · ${state.durationMin === 60 ? "1 h" : state.durationMin === 120 ? "2 h" : state.durationMin === 240 ? "Demi-j." : "Journée"}` : ""}`
        : null,
    },
    {
      label: "Date",
      value: state.scheduledDate && state.scheduledTime
        ? `${new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${state.scheduledTime}`
        : null,
    },
    {
      label: "Adresse",
      value: state.commune ? `${state.street ? state.street + ", " : ""}${state.commune}` : null,
    },
  ];

  const isStep4 = step === 3;
  const primaryLabel = isStep4 ? "Confirmer la réservation" : "Continuer";
  const primaryAction = isStep4 ? handleConfirm : () => setStep((s) => s + 1);

  return (
    <BookingShell
      title={`Réserver avec ${provider.firstName}`}
      steps={STEPS}
      currentStep={step}
      onBack={() => (step === 0 ? router.push(`/providers/${provider.id}`) : setStep((s) => s - 1))}
      main={
        <>
          {conflictBanner && (
            <div
              role="alert"
              className="mb-3 p-3"
              style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "var(--k-r-md)", color: "#92400E", fontSize: 13 }}
            >
              Ce créneau vient d'être pris. Choisis un autre horaire.
            </div>
          )}
          <div className="mb-4 md:hidden">
            <div className="flex items-center gap-3 p-3.5" style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)" }}>
              <div className="h-11 w-11 rounded-full" style={{ background: "#F5F2E9", color: "#7a5e2b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {provider.firstName[0]}{provider.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{fullName}</div>
                <div className="k-caption">{provider.profession}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>★ {provider.rating ? provider.rating.toFixed(1) : "—"}</div>
            </div>
          </div>

          {step === 0 && <Step1Service subcategories={provider.subcategories} state={state} dispatch={dispatch} />}
          {step === 1 && <Step2DateTime providerId={provider.id} providerFirstName={provider.firstName} state={state} dispatch={dispatch} />}
          {step === 2 && <Step3Address state={state} dispatch={dispatch} />}
          {step === 3 && (
            <Step4Recap
              state={state}
              subcategoryName={provider.subcategories.find((s) => s.id === state.subcategoryId)?.name ?? provider.profession}
              startingPriceFC={startingPrice}
              providerFirstName={provider.firstName}
              goToStep={(s) => setStep(s)}
            />
          )}
        </>
      }
      aside={
        <SidebarRail
          provider={{ firstName: provider.firstName, lastName: provider.lastName, profession: provider.profession, avatarUrl: provider.avatarUrl, rating: provider.rating }}
          summary={summary}
          startingPriceFC={startingPrice}
          primaryLabel={primaryLabel}
          primaryDisabled={!canAdvance || createBooking.isPending}
          onPrimary={primaryAction}
          onBack={step === 0 ? undefined : () => setStep((s) => s - 1)}
          variant={isStep4 ? "confirm" : "summary"}
        />
      }
      bottomBar={
        <MobileStickyBar
          canGoBack={step > 0}
          onBack={() => setStep((s) => s - 1)}
          onPrimary={primaryAction}
          primaryDisabled={!canAdvance || createBooking.isPending}
          primaryLabel={createBooking.isPending ? "Envoi…" : primaryLabel}
          variant={isStep4 ? "confirm" : "continue"}
        />
      }
    />
  );
}
