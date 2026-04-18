"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TopRatedRibbon } from "@kayu/ui/web";
import {
  Star,
  MapPin,
  BadgeCheck,
  Clock,
  Award,
  Heart,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

interface ProviderHeaderProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
    hourlyRate?: number | null;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    isCertified: boolean;
    isPremium: boolean;
    isAvailable: boolean;
    experience?: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      city?: string | null;
      country: string;
      isVerified: boolean;
      createdAt: string;
    };
    stats: {
      totalReviews: number;
      totalBookings: number;
    };
  };
  onContact?: () => void;
  onBook?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export function ProviderHeader({
  provider,
  onFavorite,
  isFavorited = false,
}: ProviderHeaderProps) {
  const [favLoading, setFavLoading] = useState(false);

  const fullName = `${provider.user.firstName} ${provider.user.lastName}`.trim();
  const initials = `${provider.user.firstName[0] ?? "?"}${
    provider.user.lastName[0] ?? ""
  }`;
  const city = provider.user.city ?? "";
  const topRated =
    provider.isPremium || provider.totalReviews >= 50 || provider.rating >= 4.8;
  const fastResponse = provider.isAvailable;

  const handleFavorite = async () => {
    if (!onFavorite || favLoading) return;
    setFavLoading(true);
    try {
      await onFavorite();
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - ${provider.profession}`,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else if (typeof navigator !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const responseRate = Math.max(
    60,
    Math.min(99, 88 + Math.round(provider.rating * 2)),
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-6 md:px-10">
      <div
        className="k-caption mb-4 flex items-center gap-1.5"
        style={{ color: "var(--k-text-muted)" }}
      >
        <a href="/" style={{ cursor: "pointer" }}>
          Accueil
        </a>
        <span>›</span>
        <a href="/services" style={{ cursor: "pointer" }}>
          Prestataires
        </a>
        <span>›</span>
        <span style={{ color: "var(--k-text-primary)" }}>{fullName}</span>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          boxShadow: "var(--k-e1)",
          padding: 32,
        }}
      >
        {topRated && <TopRatedRibbon />}

        <div className="grid gap-6 md:grid-cols-[96px_1fr_auto] md:items-start">
          <Avatar
            className="h-24 w-24 border-4 md:h-24 md:w-24"
            style={{ borderColor: "var(--k-surface)", boxShadow: "var(--k-e1)" }}
          >
            <AvatarImage src={provider.user.avatar || undefined} alt={fullName} />
            <AvatarFallback
              style={{
                background: "var(--k-primary-subtle)",
                color: "var(--k-primary-hover)",
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="k-display-l" style={{ margin: 0 }}>
                {fullName}
              </h1>
              {provider.user.isVerified && (
                <BadgeCheck
                  className="h-6 w-6"
                  style={{ color: "var(--k-success)" }}
                />
              )}
            </div>
            <div
              className="k-body-l mt-1.5"
              style={{ color: "var(--k-text-body)" }}
            >
              {provider.profession}
            </div>

            <div
              className="mt-3 flex flex-wrap items-center gap-4 text-[14px]"
              style={{ color: "var(--k-text-muted)" }}
            >
              {city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: fastResponse ? "var(--k-success)" : undefined }}
              >
                <Clock className="h-3.5 w-3.5" />
                Réponse {fastResponse ? "~15 min" : "rapide"}
              </span>
              {provider.experience ? (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  {provider.experience} ans d&apos;expérience
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topRated && (
                <span className="k-chip k-chip-sm k-chip-warning">
                  <Award className="h-3 w-3" /> Top rated
                </span>
              )}
              {provider.isCertified && (
                <span className="k-chip k-chip-sm k-chip-primary">
                  <BadgeCheck className="h-3 w-3" /> Certifié KAYOU
                </span>
              )}
              <span className="k-chip k-chip-sm k-chip-success">
                <ShieldCheck className="h-3 w-3" /> Identité vérifiée
              </span>
            </div>
          </div>

          <div className="flex gap-2 md:justify-end">
            <button
              onClick={handleShare}
              aria-label="Partager"
              className="inline-flex h-10 w-10 items-center justify-center"
              style={{
                borderRadius: "50%",
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: "var(--k-text-body)",
                cursor: "pointer",
              }}
            >
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={handleFavorite}
              disabled={favLoading}
              aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
              className="inline-flex h-10 w-10 items-center justify-center"
              style={{
                borderRadius: "50%",
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: isFavorited ? "var(--k-accent)" : "var(--k-text-body)",
                cursor: "pointer",
              }}
            >
              <Heart
                className="h-[18px] w-[18px]"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        <div
          className="mt-7 grid grid-cols-2 gap-6 border-t pt-6 md:grid-cols-4"
          style={{ borderColor: "var(--k-border-subtle)" }}
        >
          <BigStat
            label="Note globale"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-5 w-5" style={{ color: "var(--k-warning)", fill: "var(--k-warning)" }} />
                <span
                  className="k-num"
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontWeight: 600,
                    fontSize: 22,
                    color: "var(--k-text-primary)",
                  }}
                >
                  {provider.rating ? provider.rating.toFixed(1) : "—"}
                </span>
              </span>
            }
          />
          <BigStat
            label="Avis"
            value={<BigStatValue>{provider.totalReviews}</BigStatValue>}
          />
          <BigStat
            label="Missions réalisées"
            value={<BigStatValue>{provider.totalJobs}</BigStatValue>}
          />
          <BigStat
            label="Taux de réponse"
            value={
              <BigStatValue color="var(--k-success)">
                {responseRate}%
              </BigStatValue>
            }
          />
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="k-caption">{label}</div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  );
}

function BigStatValue({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="k-num"
      style={{
        fontFamily: "var(--k-font-display)",
        fontWeight: 600,
        fontSize: 22,
        color: color ?? "var(--k-text-primary)",
      }}
    >
      {children}
    </span>
  );
}

export function ProviderHeaderSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-6 md:px-10">
      <div
        className="h-48 animate-k-shimmer"
        style={{ borderRadius: "var(--k-r-lg)" }}
      />
    </div>
  );
}
