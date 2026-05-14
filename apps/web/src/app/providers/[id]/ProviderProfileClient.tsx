"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProviderHeader,
  ProviderHeaderSkeleton,
  ProviderAbout,
  ProviderAboutSkeleton,
  ProviderSkills,
  ProviderSkillsSkeleton,
  ProviderRecentWork,
  ProviderReviews,
  ProviderReviewsSkeleton,
  ProviderCredentials,
  BookingForm,
  ContactDialog,
} from "@/components/provider-profile";
import {
  ChevronLeft,
  Heart,
  Share2,
  Lock,
  LogIn,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { BookingRail } from "@/components/provider-profile/BookingRail";
import { MobileStickyBar } from "@/components/provider-profile/MobileStickyBar";
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
            totalBookings: 0,
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
              <ProviderReviewsSkeleton />
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
        onFavorite={handleFavorite}
        isFavorited={isFavorited}
      />

      <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <ProviderAbout provider={visibleProvider} />
            <ProviderRecentWork
              portfolio={visibleProvider.portfolio}
              projects={visibleProvider.portfolioProjects}
            />
            {visibility.showReviews && (
              <ProviderReviews
                providerId={provider.id}
                firstName={provider.user.firstName}
                initialReviews={visibleProvider.recentReviews}
                stats={visibleProvider.stats}
              />
            )}
            {provider.skills.length > 0 && (
              <ProviderSkills skills={provider.skills} />
            )}
            {visibility.showCertifications && (
              <ProviderCredentials
                diplomas={visibleProvider.diplomas}
                certifications={visibleProvider.certifications}
              />
            )}
          </div>

          {/* Sticky booking rail */}
          <BookingRail
            providerId={provider.id}
            firstName={provider.user.firstName}
            hourlyRate={visibleProvider.hourlyRate ?? null}
            rating={provider.rating}
            totalReviews={provider.totalReviews}
            totalJobs={provider.totalJobs}
            responseTime={provider.responseTime ?? null}
            verificationStatus={provider.verificationStatus}
            phone={visibleProvider.user.phone ?? null}
            allowMessages={visibility.allowMessages}
            isOwnProfile={isOwnProfile}
            onBook={() => router.push(`/book/${provider.id}`)}
            onContact={() => setContactOpen(true)}
            onDashboard={() => router.push("/dashboard")}
          />
        </div>
      </div>

      <MobileStickyBar
        hourlyFormatted={hourlyFormatted}
        phone={visibleProvider.user.phone ?? null}
        allowMessages={visibility.allowMessages}
        isOwnProfile={isOwnProfile}
        onBook={() => router.push(`/book/${provider.id}`)}
        onContact={() => setContactOpen(true)}
        onDashboard={() => router.push("/dashboard")}
      />

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
