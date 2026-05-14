"use client";

import {
  Award,
  BadgeCheck,
  Briefcase,
  Clock,
  Heart,
  MapPin,
  ShieldCheck,
  Share2,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { derivePitch } from "@/lib/provider/derivePitch";

interface ProviderHeaderProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
    description?: string | null;
    hourlyRate?: number | null;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    responseTime?: number | null;
    isCertified: boolean;
    isPremium: boolean;
    isAvailable: boolean;
    verificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
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
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      icon?: string | null;
      color?: string | null;
    }>;
    subcategories: Array<{
      id: string;
      name: string;
      slug: string;
      isPrimary: boolean;
    }>;
    serviceZones: Array<{ id: string; city: string; commune?: string | null }>;
  };
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
  const first = provider.user.firstName[0] ?? "";
  const last = provider.user.lastName[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  const city = provider.user.city ?? "";
  const pitch = derivePitch(provider.description);
  const responseLabel = formatResponseTime(provider.responseTime);
  const yearJoined = new Date(provider.user.createdAt).getFullYear();
  const primarySubcategory =
    provider.subcategories.find((s) => s.isPrimary)?.name ?? null;
  const zoneSummary = provider.serviceZones
    .slice(0, 2)
    .map((z) => z.commune ?? z.city)
    .filter(Boolean)
    .join(", ");

  const topRated =
    provider.isPremium ||
    provider.totalReviews >= 50 ||
    (provider.totalReviews >= 5 && provider.rating >= 4.8);
  const identityVerified = provider.verificationStatus === "VERIFIED";

  const ratingFormatted =
    provider.rating > 0 ? provider.rating.toFixed(1).replace(".", ",") : "—";
  const reviewSub =
    provider.totalReviews > 0
      ? `${provider.totalReviews} avis`
      : "Pas encore d'avis";
  const experienceLabel =
    provider.experience && provider.experience > 0
      ? `${provider.experience} ans`
      : "Nouveau";

  const primaryCategory = provider.categories[0] ?? null;
  const secondaryCategories = provider.categories.slice(1);

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

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-6 md:px-10">
      <div
        className="k-caption mb-4 hidden items-center gap-1.5 md:flex"
        style={{ color: "var(--k-text-muted)" }}
      >
        <a href="/">Accueil</a>
        <span>›</span>
        <a href="/services">Prestataires</a>
        <span>›</span>
        <span style={{ color: "var(--k-text-primary)" }}>{fullName}</span>
      </div>

      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          boxShadow: "var(--k-e1)",
          padding: 24,
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: provider.isAvailable
                  ? "var(--k-success)"
                  : "var(--k-text-subtle)",
                boxShadow: provider.isAvailable
                  ? "0 0 0 3px rgba(16,185,129,0.18)"
                  : "none",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: provider.isAvailable ? "#15803D" : "var(--k-text-muted)",
              }}
            >
              {provider.isAvailable
                ? responseLabel
                  ? `Disponible aujourd'hui · Répond en ${responseLabel}`
                  : "Disponible aujourd'hui"
                : "Indisponible actuellement"}
            </span>
          </div>

          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Partager"
              className="inline-flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: "var(--k-text-body)",
                cursor: "pointer",
              }}
            >
              <Share2 className="h-[15px] w-[15px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favLoading}
              aria-label={
                isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"
              }
              className="inline-flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: isFavorited ? "var(--k-accent)" : "var(--k-text-body)",
                cursor: "pointer",
              }}
            >
              <Heart
                className="h-[15px] w-[15px]"
                fill={isFavorited ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-5 md:grid-cols-[130px_1fr]">
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 16,
              overflow: "hidden",
              background: "#F5F2E9",
              flexShrink: 0,
            }}
            className="md:!h-[130px] md:!w-[130px]"
          >
            {provider.user.avatar ? (
              <img
                src={provider.user.avatar}
                alt={fullName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : initials.trim().length > 0 ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--k-font-mono)",
                  fontWeight: 700,
                  fontSize: 36,
                  color: "var(--k-text-muted)",
                }}
              >
                {initials}
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User
                  className="h-10 w-10"
                  style={{ color: "var(--k-text-muted)" }}
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="k-display-l" style={{ margin: 0 }}>
                {fullName}
              </h1>
              {identityVerified && (
                <ShieldCheck
                  className="h-[22px] w-[22px]"
                  style={{ color: "var(--k-success)" }}
                  aria-label="Identité vérifiée"
                  role="img"
                />
              )}
            </div>
            <div
              className="k-body-l mt-1"
              style={{ color: "var(--k-text-body)" }}
            >
              {primarySubcategory
                ? `${provider.profession} · ${primarySubcategory}`
                : provider.profession}
            </div>
            {(city || zoneSummary) && (
              <div
                className="mt-1 flex items-center gap-1.5"
                style={{ fontSize: 13, color: "var(--k-text-muted)" }}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {city}
                {zoneSummary && ` · ${zoneSummary}`}
              </div>
            )}
            {pitch && (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--k-text-body)",
                  lineHeight: 1.55,
                  marginTop: 12,
                  marginBottom: 0,
                  paddingLeft: 12,
                  borderLeft: "2px solid var(--k-border)",
                  fontStyle: "italic",
                  maxWidth: 560,
                }}
              >
                {pitch}
              </p>
            )}
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-0 border-t pt-4 md:grid-cols-4 md:pt-5"
          style={{ borderColor: "var(--k-border-subtle)", marginTop: 20 }}
        >
          <RibbonCell
            icon={
              <Star
                className="h-3 w-3"
                style={{
                  color: "var(--k-warning)",
                  fill: "var(--k-warning)",
                }}
                aria-hidden="true"
              />
            }
            label="Note"
            value={ratingFormatted}
            sub={reviewSub}
          />
          <RibbonCell
            icon={
              <Briefcase
                className="h-3 w-3"
                style={{ color: "var(--k-text-muted)" }}
                aria-hidden="true"
              />
            }
            label="Missions"
            value={String(provider.totalJobs)}
            sub={`depuis ${yearJoined}`}
            divider
          />
          <RibbonCell
            icon={
              <Clock
                className="h-3 w-3"
                style={{
                  color:
                    responseLabel &&
                    provider.responseTime &&
                    provider.responseTime < 60
                      ? "var(--k-success)"
                      : "var(--k-text-muted)",
                }}
                aria-hidden="true"
              />
            }
            label="Délai"
            value={responseLabel ?? "À confirmer"}
            sub="moyenne 7 jours"
            divider
            valueColor={
              responseLabel &&
              provider.responseTime &&
              provider.responseTime < 60
                ? "#15803D"
                : undefined
            }
          />
          <RibbonCell
            icon={
              <Award
                className="h-3 w-3"
                style={{ color: "var(--k-text-muted)" }}
                aria-hidden="true"
              />
            }
            label="Expérience"
            value={experienceLabel}
            sub={
              provider.user.country === "CD"
                ? "RDC"
                : provider.user.country === "CG"
                  ? "Congo"
                  : provider.user.country
            }
            divider
          />
        </div>

        <div
          className="flex flex-wrap gap-1.5 border-t pt-4"
          style={{ borderColor: "var(--k-border-subtle)", marginTop: 16 }}
        >
          {primaryCategory && (
            <CategoryChip category={primaryCategory} primary />
          )}
          {secondaryCategories.map((cat) => (
            <CategoryChip key={cat.id} category={cat} />
          ))}
          {identityVerified && (
            <span className="k-chip k-chip-sm k-chip-success">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Identité
              vérifiée
            </span>
          )}
          {topRated && (
            <span className="k-chip k-chip-sm k-chip-warning">
              <Award className="h-3 w-3" aria-hidden="true" /> Top rated
            </span>
          )}
          {provider.isCertified && (
            <span className="k-chip k-chip-sm k-chip-primary">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" /> Certifié
              KAYOU
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RibbonCell({
  icon,
  label,
  value,
  sub,
  divider,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  divider?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      className={divider ? "md:border-l md:pl-4" : ""}
      style={divider ? { borderColor: "var(--k-border-subtle)" } : undefined}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--k-font-display)",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "-0.005em",
          color: valueColor ?? "var(--k-text-primary)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--k-text-muted)" }}>{sub}</div>
    </div>
  );
}

function CategoryChip({
  category,
  primary,
}: {
  category: { name: string; icon?: string | null; color?: string | null };
  primary?: boolean;
}) {
  if (primary && category.color) {
    return (
      <span
        className="k-chip k-chip-sm"
        style={{
          color: category.color,
          background: `${category.color}14`,
          borderColor: `${category.color}33`,
          fontWeight: 600,
        }}
      >
        {category.name}
      </span>
    );
  }
  return (
    <span className={`k-chip k-chip-sm${primary ? " k-chip-primary" : ""}`}>
      {category.name}
    </span>
  );
}

function formatResponseTime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
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
