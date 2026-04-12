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
import { LoginDialog } from "@/components/auth/LoginDialog";
import { RegisterDialog } from "@/components/auth/RegisterDialog";
import {
  ChevronLeft,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  Lock,
  LogIn,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { favoritesApi } from "@kayu/api";

// Visibility settings interface
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
    skills: Array<{
      id: string;
      name: string;
      level: number;
    }>;
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
      category?: {
        id: string;
        name: string;
      } | null;
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
      category?: {
        id: string;
        name: string;
      } | null;
      documents: Array<{
        id: string;
        type: "DIPLOMA" | "CERTIFICATE" | "LICENSE" | "INSURANCE" | "ID_DOCUMENT" | "WORK_PERMIT" | "OTHER";
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
      ratingBreakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
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
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get visibility settings
  const visibility = provider.visibility;

  // Check if provider is favorited
  useEffect(() => {
    let isMounted = true;

    const checkFavorite = async () => {
      if (!isAuthenticated) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const data = await favoritesApi(apiClient).check(provider.id);
        if (isMounted && data) {
          // The check endpoint filters by providerId, so a non-empty favorites array means it's favorited
          const favorites = data.favorites ?? [];
          setIsFavorited(favorites.length > 0);
        }
      } catch (error) {
        console.error("Error checking favorite:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, provider.id]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
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
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${provider.user.firstName} ${provider.user.lastName} - ${provider.profession}`,
          text: `Découvrez ${provider.user.firstName} ${provider.user.lastName}, ${provider.profession} sur KAYOU`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLoginRequired = () => {
    setBookingOpen(false);
    setContactOpen(false);
    setLoginOpen(true);
  };

  // Check if current user is the provider
  const isOwnProfile = user?.id === provider.userId;

  // Apply visibility settings to provider data
  const visibleProvider = {
    ...provider,
    hourlyRate: isOwnProfile || visibility.showHourlyRate ? provider.hourlyRate : null,
    portfolio: isOwnProfile || visibility.showPastWork ? provider.portfolio : [],
    portfolioProjects: isOwnProfile || visibility.showPastWork ? provider.portfolioProjects : [],
    certifications: isOwnProfile || visibility.showCertifications ? provider.certifications : [],
    diplomas: isOwnProfile || visibility.showCertifications ? provider.diplomas : [],
    recentReviews: isOwnProfile || visibility.showReviews ? provider.recentReviews : [],
    stats: isOwnProfile || visibility.showReviews ? provider.stats : {
      ...provider.stats,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      ratingAverages: { overall: 0, punctuality: 0, quality: 0, communication: 0, value: 0 },
    },
    isAvailable: isOwnProfile || visibility.showAvailability ? provider.isAvailable : false,
    user: {
      ...provider.user,
      email: isOwnProfile || visibility.showEmail ? provider.user.email : undefined,
      phone: isOwnProfile || visibility.showPhone ? provider.user.phone : undefined,
      address: isOwnProfile || visibility.showExactLocation ? provider.user.address : undefined,
      latitude: isOwnProfile || visibility.showExactLocation ? provider.user.latitude : undefined,
      longitude: isOwnProfile || visibility.showExactLocation ? provider.user.longitude : undefined,
    },
  };

  // Access Denied Screen
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 pb-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {visibility.profileVisible === "PRIVATE" ? (
                <EyeOff className="h-8 w-8 text-muted-foreground" />
              ) : visibility.profileVisible === "CLIENTS_ONLY" ? (
                <Lock className="h-8 w-8 text-muted-foreground" />
              ) : (
                <LogIn className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {visibility.profileVisible === "PRIVATE"
                ? "Profil privé"
                : visibility.profileVisible === "CLIENTS_ONLY"
                ? "Accès restreint"
                : "Connexion requise"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {accessDeniedReason}
            </p>
            {visibility.profileVisible === "REGISTERED" && !isAuthenticated && (
              <div className="flex flex-col gap-3">
                <Button onClick={() => setLoginOpen(true)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </Button>
                <Button variant="outline" onClick={() => setRegisterOpen(true)}>
                  Créer un compte
                </Button>
              </div>
            )}
            <Button variant="outline" className="mt-4" onClick={() => router.push("/services")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour aux services
            </Button>
          </CardContent>
        </Card>

        <LoginDialog
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onSwitchToRegister={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
        />

        <RegisterDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onSwitchToLogin={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <ProviderHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <ProviderAboutSkeleton />
              <ProviderSkillsSkeleton />
              <ProviderCertificationsSkeleton />
              <ProviderDiplomasSkeleton />
              <ProviderPortfolioSkeleton />
              <ProviderReviewsSkeleton />
            </div>
            <div className="space-y-6">
              <ProviderCategoriesSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Back button - Mobile */}
      <div className="md:hidden bg-background sticky top-0 z-40 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2">
            <Link href="/services">
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleFavorite}>
              <Heart
                className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Provider Header */}
      <ProviderHeader
        provider={visibleProvider}
        onContact={() => setContactOpen(true)}
        onBook={() => setBookingOpen(true)}
        onFavorite={handleFavorite}
        isFavorited={isFavorited}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <ProviderAbout provider={visibleProvider} />
            {provider.skills.length > 0 && <ProviderSkills skills={provider.skills} />}
            {visibleProvider.certifications.length > 0 && (
              <ProviderCertifications certifications={visibleProvider.certifications} />
            )}
            {visibleProvider.diplomas.length > 0 && (
              <ProviderDiplomas diplomas={visibleProvider.diplomas} />
            )}
            {(visibleProvider.portfolio.length > 0 || visibleProvider.portfolioProjects.length > 0) && (
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

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ProviderCategories
              categories={provider.categories}
              serviceZones={provider.serviceZones}
            />

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex flex-col gap-3">
              {!isOwnProfile && (
                <>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={() => setBookingOpen(true)}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Réserver
                  </Button>
                  {visibility.allowMessages && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => setContactOpen(true)}
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Contacter
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t shadow-lg">
        <div className="flex items-center gap-3 p-3">
          {!isOwnProfile ? (
            <>
              {visibility.allowMessages && (
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setContactOpen(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contacter
                </Button>
              )}
              <Button
                className={`${visibility.allowMessages ? 'flex-1' : 'w-full'} h-12 bg-primary hover:bg-primary/90`}
                onClick={() => setBookingOpen(true)}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Réserver
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => router.push("/dashboard")}
            >
              Voir mon tableau de bord
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
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

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </div>
  );
}
