"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProviderHeader,
  ProviderHeaderSkeleton,
  ProviderAbout,
  ProviderAboutSkeleton,
  ProviderSkills,
  ProviderSkillsSkeleton,
  ProviderPortfolio,
  ProviderPortfolioSkeleton,
  ProviderReviews,
  ProviderReviewsSkeleton,
  ProviderCategories,
  ProviderCategoriesSkeleton,
  ProviderCertifications,
  ProviderCertificationsSkeleton,
  ProviderDiplomas,
  ProviderDiplomasSkeleton,
  BookingForm,
  ContactDialog,
} from "@/components/provider-profile";
import {
  ChevronLeft,
  Heart,
  Share2,
  MessageCircle,
  Lock,
  LogIn,
  EyeOff,
  ShieldCheck,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { favoritesApi } from "@kayu/api";

interface VisibilitySettings {
  profileVisible: string;
  showEmail: boolean;
  showPhone: boolean;
  showExactLocation: boolean;
  showHourlyRate: boolean;
  showPastWork: boolean;
  showReviews: boolean;
  showAvailability: boolean;
  showCertifications: boolean;
  allowDirectContact: boolean;
  allowMessages: boolean;
}

interface ProviderProfileClientProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
    description?: string | null;
    experience?: number | null;
    hourlyRate?: number | null;
    videoUrl?: string | null;
    isCertified: boolean;
    isPremium: boolean;
    premiumExpiry?: string | null;
    isAvailable: boolean;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    responseTime?: number | null;
    verificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      city?: string | null;
      country: string;
      isVerified: boolean;
      createdAt: string;
      email?: string;
      phone?: string | null;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
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
      experience?: number | null;
    }>;
    skills: Array<{ id: string; name: string; level: number }>;
    portfolio: Array<{
      id: string;
      title: string;
      description?: string | null;
      imageUrl: string;
      order: number;
    }>;
    portfolioProjects: Array<{
      id: string;
      title: string;
      description?: string | null;
      duration?: number | null;
      price?: number | null;
      viewCount: number;
      isFeatured: boolean;
      createdAt: string;
      category?: { id: string; name: string } | null;
      images: Array<{
        id: string;
        imageType: "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";
        imageUrl: string;
        thumbnailUrl?: string | null;
        caption?: string | null;
        displayOrder: number;
        uploadedAt: string;
      }>;
    }>;
    certifications: Array<{
      id: string;
      title: string;
      issuingOrg: string;
      certificateNum?: string | null;
      status: "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";
      issueDate?: string | null;
      expiryDate?: string | null;
      isLifetime: boolean;
      rejectionReason?: string | null;
      category?: { id: string; name: string } | null;
      documents: Array<{
        id: string;
        type:
          | "DIPLOMA"
          | "CERTIFICATE"
          | "LICENSE"
          | "INSURANCE"
          | "ID_DOCUMENT"
          | "WORK_PERMIT"
          | "OTHER";
        fileUrl: string;
        fileName: string;
        uploadedAt: string;
      }>;
    }>;
    diplomas: Array<{
      id: string;
      title: string;
      issuingOrg: string;
      certificateNum?: string | null;
      status: "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";
      issueDate?: string | null;
      documents: Array<{
        id: string;
        type: "DIPLOMA";
        fileUrl: string;
        fileName: string;
        uploadedAt: string;
      }>;
    }>;
    serviceZones: Array<{
      id: string;
      city: string;
      commune?: string | null;
    }>;
    recentReviews: Array<{
      id: string;
      rating: number;
      punctuality?: number | null;
      quality?: number | null;
      communication?: number | null;
      value?: number | null;
      comment?: string | null;
      createdAt: string;
      reply?: string | null;
      repliedAt?: string | null;
      client: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        initials: string;
      };
    }>;
    stats: {
      totalReviews: number;
      totalBookings: number;
      ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
      ratingAverages: {
        overall: number;
        punctuality: number;
        quality: number;
        communication: number;
        value: number;
      };
    };
    visibility: VisibilitySettings;
  };
  hasAccess: boolean;
  accessDeniedReason: string;
}

export function ProviderProfileClient({
  provider,
  hasAccess,
  accessDeniedReason,
}: ProviderProfileClientProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [isFavorited, setIsFavorited] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const visibility = provider.visibility;

  useEffect(() => {
    let alive = true;
    const checkFavorite = async () => {
      if (!isAuthenticated) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const data = await favoritesApi(apiClient).check(provider.id);
        if (alive && data) {
          const favorites = data.favorites ?? [];
          setIsFavorited(favorites.length > 0);
        }
      } catch (e) {
        console.error("Error checking favorite:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    checkFavorite();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, provider.id]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    try {
      if (isFavorited) {
        await favoritesApi(apiClient).remove(provider.id);
        setIsFavorited(false);
      } else {
        await favoritesApi(apiClient).add({ providerId: provider.id });
        setIsFavorited(true);
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${provider.user.firstName} ${provider.user.lastName} - ${provider.profession}`,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else if (typeof navigator !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLoginRequired = () => {
    setBookingOpen(false);
    setContactOpen(false);
    router.push("/auth");
  };

  const isOwnProfile = user?.id === provider.userId;

  const visibleProvider = {
    ...provider,
    hourlyRate:
      isOwnProfile || visibility.showHourlyRate ? provider.hourlyRate : null,
    portfolio: isOwnProfile || visibility.showPastWork ? provider.portfolio : [],
    portfolioProjects:
      isOwnProfile || visibility.showPastWork ? provider.portfolioProjects : [],
    certifications:
      isOwnProfile || visibility.showCertifications ? provider.certifications : [],
    diplomas:
      isOwnProfile || visibility.showCertifications ? provider.diplomas : [],
    recentReviews:
      isOwnProfile || visibility.showReviews ? provider.recentReviews : [],
    stats:
      isOwnProfile || visibility.showReviews
        ? provider.stats
        : {
            ...provider.stats,
            totalReviews: 0,
            ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            ratingAverages: {
              overall: 0,
              punctuality: 0,
              quality: 0,
              communication: 0,
              value: 0,
            },
          },
    isAvailable:
      isOwnProfile || visibility.showAvailability ? provider.isAvailable : false,
    user: {
      ...provider.user,
      email: isOwnProfile || visibility.showEmail ? provider.user.email : undefined,
      phone: isOwnProfile || visibility.showPhone ? provider.user.phone : undefined,
      address:
        isOwnProfile || visibility.showExactLocation
          ? provider.user.address
          : undefined,
      latitude:
        isOwnProfile || visibility.showExactLocation
          ? provider.user.latitude
          : undefined,
      longitude:
        isOwnProfile || visibility.showExactLocation
          ? provider.user.longitude
          : undefined,
    },
  };

  if (!hasAccess) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: "var(--k-bg)" }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pb-8 pt-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--k-surface-muted)" }}
            >
              {visibility.profileVisible === "PRIVATE" ? (
                <EyeOff className="h-8 w-8" style={{ color: "var(--k-text-muted)" }} />
              ) : visibility.profileVisible === "CLIENTS_ONLY" ? (
                <Lock className="h-8 w-8" style={{ color: "var(--k-text-muted)" }} />
              ) : (
                <LogIn className="h-8 w-8" style={{ color: "var(--k-text-muted)" }} />
              )}
            </div>
            <h2 className="k-heading mb-2">
              {visibility.profileVisible === "PRIVATE"
                ? "Profil privé"
                : visibility.profileVisible === "CLIENTS_ONLY"
                  ? "Accès restreint"
                  : "Connexion requise"}
            </h2>
            <p className="k-body mb-6" style={{ color: "var(--k-text-muted)" }}>
              {accessDeniedReason}
            </p>
            {visibility.profileVisible === "REGISTERED" && !isAuthenticated && (
              <div className="flex flex-col gap-3">
                <button
                  className="k-btn k-btn-primary w-full"
                  onClick={() => router.push("/auth")}
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </button>
                <button
                  className="k-btn k-btn-secondary w-full"
                  onClick={() => router.push("/auth?mode=signup")}
                >
                  Créer un compte
                </button>
              </div>
            )}
            <button
              className="k-btn k-btn-secondary mt-4 w-full"
              onClick={() => router.push("/services")}
            >
              <ChevronLeft className="h-4 w-4" />
              Retour aux services
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: "var(--k-bg)" }} className="min-h-screen pb-24 md:pb-0">
        <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-10">
          <ProviderHeaderSkeleton />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <ProviderAboutSkeleton />
              <ProviderSkillsSkeleton />
              <ProviderCertificationsSkeleton />
              <ProviderDiplomasSkeleton />
              <ProviderPortfolioSkeleton />
              <ProviderReviewsSkeleton />
            </div>
            <div className="space-y-4">
              <ProviderCategoriesSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hourlyFormatted = provider.hourlyRate
    ? provider.hourlyRate.toLocaleString("fr-FR")
    : null;

  return (
    <div style={{ background: "var(--k-bg)" }} className="min-h-screen pb-28 md:pb-12">
      {/* Mobile back bar */}
      <div
        className="sticky top-[64px] z-30 border-b md:hidden"
        style={{
          background: "var(--k-bg)",
          borderColor: "var(--k-border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/services" className="k-btn k-btn-ghost -ml-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                color: isFavorited ? "var(--k-accent)" : "var(--k-text-body)",
              }}
            >
              <Heart
                className="h-5 w-5"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={handleShare}
              aria-label="Partager"
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                color: "var(--k-text-body)",
              }}
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <ProviderHeader
        provider={visibleProvider}
        onContact={() => setContactOpen(true)}
        onBook={() => setBookingOpen(true)}
        onFavorite={handleFavorite}
        isFavorited={isFavorited}
      />

      <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <ProviderAbout provider={visibleProvider} />
            {provider.skills.length > 0 && (
              <ProviderSkills skills={provider.skills} />
            )}
            {visibleProvider.certifications.length > 0 && (
              <ProviderCertifications certifications={visibleProvider.certifications} />
            )}
            {visibleProvider.diplomas.length > 0 && (
              <ProviderDiplomas diplomas={visibleProvider.diplomas} />
            )}
            {(visibleProvider.portfolio.length > 0 ||
              visibleProvider.portfolioProjects.length > 0) && (
              <ProviderPortfolio
                portfolio={visibleProvider.portfolio}
                projects={visibleProvider.portfolioProjects}
              />
            )}
            {visibility.showReviews && (
              <ProviderReviews
                providerId={provider.id}
                initialReviews={visibleProvider.recentReviews}
                stats={visibleProvider.stats}
              />
            )}
          </div>

          {/* Sticky booking rail */}
          <aside className="hidden self-start lg:sticky lg:top-[104px] lg:block">
            <div
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                borderRadius: "var(--k-r-lg)",
                boxShadow: "var(--k-e2)",
                padding: 24,
              }}
            >
              {hourlyFormatted ? (
                <>
                  <div className="k-caption mb-1">À partir de</div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="k-price"
                      style={{ fontSize: 32, letterSpacing: "-0.02em" }}
                    >
                      {hourlyFormatted}
                    </span>
                    <span
                      className="k-body"
                      style={{ color: "var(--k-text-muted)" }}
                    >
                      FC
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <div className="k-caption">Prix de départ</div>
                  <div className="k-display-m" style={{ margin: "4px 0 0" }}>
                    À convenir
                  </div>
                </div>
              )}
              <div className="k-caption mt-2">
                Paiement en espèces à la fin de la mission. Le prix final est convenu avec le prestataire.
              </div>

              <div
                className="mt-4 grid gap-2.5 p-3.5"
                style={{
                  background: "var(--k-surface-muted)",
                  borderRadius: "var(--k-r-md)",
                }}
              >
                <MiniRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Zone"
                  value={visibleProvider.user.city ?? "Kinshasa"}
                />
              </div>

              {!isOwnProfile && (
                <>
                  <button
                    className="k-btn k-btn-primary k-btn-lg mt-4 w-full"
                    onClick={() => router.push(`/book/${provider.id}`)}
                  >
                    Demander une réservation
                  </button>
                  {visibleProvider.user.phone && (
                    <a
                      className="k-btn k-btn-secondary mt-2 w-full"
                      href={`tel:${visibleProvider.user.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                      Appeler
                    </a>
                  )}
                  {visibility.allowMessages && (
                    <button
                      className="k-btn k-btn-secondary mt-2 w-full"
                      onClick={() => setContactOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Envoyer un message
                    </button>
                  )}
                </>
              )}

              <div
                className="mt-4 flex items-center gap-2 border-t pt-4"
                style={{ borderColor: "var(--k-border-subtle)" }}
              >
                <ShieldCheck
                  className="h-4 w-4"
                  style={{ color: "var(--k-success)" }}
                />
                <span
                  className="k-caption"
                  style={{ color: "var(--k-text-body)" }}
                >
                  Paiement en espèces à la fin de la mission.
                </span>
              </div>
            </div>

            <div className="mt-4">
              <ProviderCategories
                categories={provider.categories}
                serviceZones={provider.serviceZones}
              />
            </div>
          </aside>

          {/* Categories card on mobile (non-sticky) */}
          <div className="lg:hidden">
            <ProviderCategories
              categories={provider.categories}
              serviceZones={provider.serviceZones}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 md:hidden"
        style={{
          background: "var(--k-surface)",
          borderTop: "1px solid var(--k-border)",
          boxShadow: "0 -4px 20px -8px rgba(15,23,42,0.1)",
        }}
      >
        <div className="min-w-0 flex-shrink">
          {hourlyFormatted ? (
            <>
              <div className="k-caption mt-0.5">À partir de</div>
              <div>
                <span
                  className="k-price"
                  style={{
                    fontSize: 17,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  {hourlyFormatted} FC
                </span>
              </div>
              <div className="k-caption mt-0.5">
                ★ {provider.rating ? provider.rating.toFixed(1) : "—"} ·{" "}
                {provider.totalReviews} avis
              </div>
            </>
          ) : (
            <>
              <div className="k-body-m" style={{ fontWeight: 600 }}>
                À convenir
              </div>
              <div className="k-caption mt-0.5">Discussion puis offre finale</div>
            </>
          )}
        </div>
        <div className="flex-1" />
        {visibility.allowMessages && !isOwnProfile && (
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Contacter"
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              color: "var(--k-text-primary)",
            }}
            onClick={() => setContactOpen(true)}
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>
        )}
        {visibleProvider.user.phone && !isOwnProfile && (
          <a
            className="flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Appeler"
            href={`tel:${visibleProvider.user.phone}`}
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              color: "var(--k-text-primary)",
            }}
          >
            <Phone className="h-[18px] w-[18px]" />
          </a>
        )}
        {!isOwnProfile ? (
          <button
            className="k-btn k-btn-primary"
            style={{ height: 46, padding: "0 22px" }}
            onClick={() => router.push(`/book/${provider.id}`)}
          >
            Réserver
          </button>
        ) : (
          <Button
            variant="outline"
            className="h-11"
            onClick={() => router.push("/dashboard")}
          >
            Tableau de bord
          </Button>
        )}
      </div>

      <BookingForm
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        provider={visibleProvider}
        isAuthenticated={isAuthenticated}
        onLoginRequired={handleLoginRequired}
      />

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        provider={visibleProvider}
        isAuthenticated={isAuthenticated}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  );
}

function MiniRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color: "var(--k-text-muted)" }}>{icon}</span>
      <span
        className="k-body-m flex-1"
        style={{ color: "var(--k-text-muted)" }}
      >
        {label}
      </span>
      <span className="k-body-m" style={{ fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
