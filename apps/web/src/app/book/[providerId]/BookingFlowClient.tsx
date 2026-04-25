"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layout } from "@/components/layout";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { bookingsApi } from "@kayu/api";
import { useAuth } from "@/contexts/AuthContext";
import { KayouMoment } from "@kayu/ui/web";

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
}

export function BookingFlowClient({ provider }: { provider: ProviderMini }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState(0); // 0..2 content, 3 celebrate
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [service, setService] = useState("Dépannage urgent");
  const [duration, setDuration] = useState(2);
  const [day, setDay] = useState(18);
  const [time, setTime] = useState("10:00");
  const [address, setAddress] = useState("Kinshasa, Gombe");
  const [note, setNote] = useState("");

  const hourly = provider.hourlyRate || 0;
  const total = hourly * duration;
  const fee = Math.round(total * 0.07);
  const grand = total + fee;
  const fullName = `${provider.firstName} ${provider.lastName}`.trim();
  const initials =
    `${(provider.firstName[0] ?? "?").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;

  const createBooking = useMutation({
    mutationFn: (payload: Parameters<ReturnType<typeof bookingsApi>["create"]>[0]) =>
      bookingsApi(apiClient).create(payload),
    onSuccess: (result) => {
      setCreatedBookingId(result.booking.id);
      setStep(3);
    },
    onError: (err: Error) => {
      alert(err.message || "Erreur lors de la réservation");
    },
  });

  const handleConfirm = () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    const scheduled = new Date();
    scheduled.setDate(day);
    const [h, m] = time.split(":").map(Number);
    scheduled.setHours(h, m, 0, 0);
    createBooking.mutate({
      providerId: provider.id,
      title: service,
      description: note,
      address,
      city: provider.city,
      scheduledDate: scheduled,
      duration: duration * 60,
      price: total,
      clientNotes: note,
    });
  };

  if (step === 3) {
    const providerInitials =
      `${(provider.firstName[0] ?? "?").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;
    const scheduled = new Date();
    scheduled.setDate(day);
    const [h, m] = time.split(":").map(Number);
    scheduled.setHours(h, m, 0, 0);
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(scheduled);
    return (
      <Layout>
        <KayouMoment
          provider={{
            firstName: provider.firstName,
            initials: providerInitials,
            response: "15 min",
          }}
          dateLabel={dateLabel.replace(",", " ·")}
          onMessage={() => router.push("/dashboard/client")}
          onViewBooking={() =>
            router.replace(createdBookingId ? `/bookings/${createdBookingId}` : "/bookings")
          }
        />
      </Layout>
    );
  }

  const steps = [
    { label: "Service" },
    { label: "Date & heure" },
    { label: "Confirmation" },
  ];

  return (
    <Layout>
      <div className="py-6" style={{ background: "var(--k-bg)", minHeight: "100%" }}>
        <div className="mx-auto max-w-[560px] px-5">
          <div className="mb-6 flex items-center gap-2.5">
            <button
              onClick={() =>
                step === 0 ? router.push(`/providers/${provider.id}`) : setStep((s) => s - 1)
              }
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: "var(--k-text-primary)",
                cursor: "pointer",
              }}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <h1 className="k-display-m" style={{ margin: 0 }}>
              Réserver avec {provider.firstName}
            </h1>
          </div>

          <div className="mb-6 flex gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex-1">
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background:
                      i <= step ? "var(--k-primary)" : "var(--k-border)",
                    transition: "background 240ms",
                  }}
                />
                <div
                  className="k-caption mt-1.5"
                  style={{
                    color:
                      i === step ? "var(--k-text-primary)" : "var(--k-text-muted)",
                    fontWeight: i === step ? 600 : 500,
                  }}
                >
                  {i + 1}. {s.label}
                </div>
              </div>
            ))}
          </div>

          <div
            className="mb-4 flex items-center gap-3 p-3.5"
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              borderRadius: "var(--k-r-md)",
            }}
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={provider.avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback
                style={{
                  background: "var(--k-primary-subtle)",
                  color: "var(--k-primary-hover)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{fullName}</span>
                {provider.verified && (
                  <BadgeCheck
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--k-success)" }}
                  />
                )}
              </div>
              <div className="k-caption">{provider.profession}</div>
            </div>
            <div
              className="inline-flex items-center gap-1 text-[13px]"
              style={{ color: "var(--k-warning)" }}
            >
              <Star className="h-3.5 w-3.5" />
              <span
                className="k-num"
                style={{ color: "var(--k-text-primary)", fontWeight: 600 }}
              >
                {provider.rating ? provider.rating.toFixed(1) : "—"}
              </span>
            </div>
          </div>

          {step === 0 && (
            <>
              <h2 className="k-heading" style={{ marginTop: 0 }}>
                Quel service ?
              </h2>
              <div className="mt-3 grid gap-2">
                {[
                  "Dépannage urgent",
                  "Installation nouvelle",
                  "Devis / diagnostic",
                  "Rénovation complète",
                ].map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-3"
                    style={{
                      padding: 16,
                      background: "var(--k-surface)",
                      border: `1px solid ${service === s ? "var(--k-primary)" : "var(--k-border)"}`,
                      borderRadius: "var(--k-r-md)",
                      boxShadow:
                        service === s ? "0 0 0 3px rgba(14,165,233,0.12)" : "none",
                      transition: "box-shadow 160ms, border-color 160ms",
                    }}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={service === s}
                      onChange={() => setService(s)}
                      className="accent-[var(--k-primary)]"
                    />
                    <span
                      className="flex-1"
                      style={{ fontWeight: 500, fontSize: 15 }}
                    >
                      {s}
                    </span>
                    {service === s && (
                      <Check
                        className="h-[18px] w-[18px]"
                        style={{ color: "var(--k-primary)" }}
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <div className="k-overline" style={{ marginBottom: 8 }}>
                  Durée estimée
                </div>
                <div className="flex gap-2">
                  {[1, 2, 4, 8].map((h) => {
                    const active = duration === h;
                    return (
                      <button
                        key={h}
                        onClick={() => setDuration(h)}
                        className="flex-1"
                        style={{
                          height: 44,
                          borderRadius: "var(--k-r-md)",
                          border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                          background: active
                            ? "var(--k-primary-subtle)"
                            : "var(--k-surface)",
                          color: active
                            ? "var(--k-primary-hover)"
                            : "var(--k-text-body)",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        {h}h
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="k-overline" style={{ marginBottom: 8 }}>
                  Décris ton besoin
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Précise le problème, l'urgence, les détails…"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "var(--k-surface)",
                    border: "1px solid var(--k-border)",
                    borderRadius: "var(--k-r-md)",
                    fontFamily: "inherit",
                    fontSize: 14,
                    resize: "vertical",
                    outline: 0,
                  }}
                />
              </div>

              <button
                className="k-btn k-btn-primary k-btn-lg mt-6 w-full"
                onClick={() => setStep(1)}
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="k-heading" style={{ marginTop: 0 }}>
                Quand ?
              </h2>
              <MiniCalendar selected={day} onSelect={setDay} />

              <div className="mt-6">
                <div className="k-overline" style={{ marginBottom: 8 }}>
                  Créneaux disponibles
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["08:00", "10:00", "14:00", "16:00", "18:00"].map((t) => {
                    const active = time === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        style={{
                          height: 42,
                          borderRadius: "var(--k-r-md)",
                          border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                          background: active
                            ? "var(--k-primary-subtle)"
                            : "var(--k-surface)",
                          color: active
                            ? "var(--k-primary-hover)"
                            : "var(--k-text-body)",
                          fontWeight: 600,
                          fontFamily: "var(--k-font-mono)",
                          cursor: "pointer",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="k-overline" style={{ marginBottom: 8 }}>
                  Adresse d&apos;intervention
                </div>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="k-input"
                />
              </div>

              <button
                className="k-btn k-btn-primary k-btn-lg mt-6 w-full"
                onClick={() => setStep(2)}
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="k-heading" style={{ marginTop: 0 }}>
                Récapitulatif
              </h2>
              <div
                className="mt-3 p-4"
                style={{
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-border)",
                  borderRadius: "var(--k-r-md)",
                }}
              >
                <SumRow label="Service" value={service} />
                <SumRow label="Durée estimée" value={`${duration}h`} />
                <SumRow
                  label="Date"
                  value={`Mer. ${day} avril · ${time}`}
                />
                <SumRow label="Adresse" value={address} multiline />
                <SumRow label="Note" value={note || "—"} multiline last />
              </div>

              <div
                className="mt-3 p-4"
                style={{
                  background: "var(--k-surface-primary)",
                  border: "1px solid #BAE6FD",
                  borderRadius: "var(--k-r-md)",
                }}
              >
                <div className="flex justify-between text-[14px]">
                  <span style={{ color: "var(--k-text-body)" }}>
                    {hourly.toLocaleString("fr-FR")} FC × {duration}h
                  </span>
                  <span className="k-price">
                    {total.toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between text-[14px]">
                  <span style={{ color: "var(--k-text-muted)" }}>
                    Frais de service
                  </span>
                  <span
                    className="k-price"
                    style={{ color: "var(--k-text-body)" }}
                  >
                    {fee.toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <div
                  style={{ height: 1, background: "#BAE6FD", margin: "12px 0" }}
                />
                <div className="flex items-baseline justify-between">
                  <span className="k-heading" style={{ margin: 0 }}>
                    Total estimé
                  </span>
                  <span
                    className="k-price"
                    style={{ fontSize: 22, color: "var(--k-primary-hover)" }}
                  >
                    {grand.toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <div
                  className="k-caption mt-2 inline-flex items-center gap-1.5"
                >
                  <ShieldCheck
                    className="h-3 w-3"
                    style={{ color: "var(--k-success)" }}
                  />
                  Paiement direct au pro en espèces à la fin de la mission.
                </div>
              </div>

              <button
                className="k-btn k-btn-primary k-btn-lg mt-4 w-full"
                disabled={createBooking.isPending}
                onClick={handleConfirm}
              >
                {createBooking.isPending
                  ? "Envoi…"
                  : "Confirmer la réservation"}
              </button>
              <div
                className="k-caption mt-2.5 text-center"
              >
                En confirmant, tu acceptes les{" "}
                <a style={{ color: "var(--k-primary-hover)" }}>
                  conditions générales
                </a>
                .
              </div>
            </>
          )}
        </div>

      </div>
    </Layout>
  );
}

function SumRow({
  label,
  value,
  multiline,
  last,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="grid gap-3"
      style={{
        padding: "12px 0",
        borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
        gridTemplateColumns: multiline ? "1fr" : "140px 1fr",
      }}
    >
      <div className="k-caption">{label}</div>
      <div className="k-body-m" style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (d: number) => void;
}) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const grid = Array.from({ length: 35 }, (_, i) => i - 1);
  const available = [18, 19, 20, 22, 24, 25, 27];
  return (
    <div
      className="mt-3 p-4"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Avril 2026
        </span>
        <button
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1.5 grid grid-cols-7 gap-0.5">
        {days.map((d, i) => (
          <div key={i} className="k-caption text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const valid = d >= 1 && d <= 30;
          const isAvail = valid && d >= 18 && available.includes(d);
          const isSel = d === selected;
          return (
            <button
              key={d}
              disabled={!isAvail}
              onClick={() => isAvail && onSelect(d)}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 8,
                background: isSel ? "var(--k-primary)" : "transparent",
                color: isSel
                  ? "white"
                  : isAvail
                    ? "var(--k-text-primary)"
                    : "var(--k-text-subtle)",
                border: 0,
                fontSize: 13,
                fontWeight: isSel ? 700 : 500,
                position: "relative",
                opacity: valid ? 1 : 0,
                cursor: isAvail ? "pointer" : "default",
              }}
            >
              {valid ? d : ""}
              {isAvail && !isSel && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "var(--k-success)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
