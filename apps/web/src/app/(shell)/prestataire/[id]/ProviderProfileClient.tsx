"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { providersApi, queryKeys } from "@kayu/api";
import type { CategoryTreeNode, ProviderPublic, PublicReview } from "@kayu/schemas";
import { calculateDistance, localParts } from "@kayu/utils";
import { LoginWall } from "@/components/auth/LoginWall";
import { BookingForm } from "@/components/booking/BookingForm";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { AddressCard } from "@/components/provider/AddressCard";
import { ContactBlock } from "@/components/provider/ContactBlock";
import { DistanceEstimator } from "@/components/provider/DistanceEstimator";
import { Gallery } from "@/components/provider/Gallery";
import { ProviderChoices } from "@/components/provider/ProviderChoices";
import { ProviderHeaderCard } from "@/components/provider/ProviderHeaderCard";
import { ReviewForm } from "@/components/provider/ReviewForm";
import { ReviewsList } from "@/components/provider/ReviewsList";
import { ScheduleSummary } from "@/components/provider/ScheduleSummary";
import { SkillsList } from "@/components/provider/SkillsList";
import { SocialEmbeds } from "@/components/provider/SocialEmbeds";
import { useAuth } from "@/contexts/AuthContext";
import { providerCopy } from "@/copy/provider";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { apiClient } from "@/lib/api";
import { imageMedia, videoMedia } from "@/lib/dto/provider";
import type { LatLng } from "@/lib/geo";

export type ProviderProfileClientProps = {
  initial: ProviderPublic;
  initialReviews: PublicReview[];
  reviewsTotal: number;
  category: CategoryTreeNode | null;
};

function BackLink() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(typeof document !== "undefined" && document.referrer.includes("/rechercher"));
  }, []);
  const className = "inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-primary";
  return canGoBack ? (
    <button type="button" onClick={() => router.back()} className={className}>
      <ArrowLeft size={16} aria-hidden /> {providerCopy.back}
    </button>
  ) : (
    <Link href="/rechercher" className={className}>
      <ArrowLeft size={16} aria-hidden /> {providerCopy.back}
    </Link>
  );
}

export function ProviderProfileClient({ initial, initialReviews, reviewsTotal, category }: ProviderProfileClientProps) {
  const { status, user, isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();
  const [viewer, setViewer] = useState<LatLng | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [total, setTotal] = useState(reviewsTotal);

  // The server rendered the anonymous or cookie view; a signed-in browser refetches for its own contacts.
  const detail = useQuery({
    queryKey: queryKeys.providers.detail(initial.id),
    queryFn: () => providersApi(apiClient).getPublic(initial.id),
    initialData: initial,
    initialDataUpdatedAt: 0,
    enabled: status === "ready",
    staleTime: 60 * 1000,
  });
  const provider = detail.data ?? initial;

  const distanceKm = useMemo(() => {
    if (!viewer || provider.latitude === null || provider.longitude === null) return provider.distanceKm;
    return calculateDistance(viewer.lat, viewer.lng, provider.latitude, provider.longitude);
  }, [viewer, provider.latitude, provider.longitude, provider.distanceKm]);

  const today = useMemo(() => localParts(provider.schedule.timezone, new Date()).date, [provider.schedule.timezone]);
  const images = imageMedia(provider);
  const videos = videoMedia(provider);
  const signedIn = isAuthenticated && status === "ready";
  const canMessage = signedIn && !provider.isOwner && (user?.role === "CLIENT" || user?.role === "ADMIN");
  const showContacts = signedIn && provider.contacts !== null && !provider.contactsLocked;

  const onReviewCreated = (review: PublicReview) => {
    setReviews((list) => [review, ...list]);
    setTotal((count) => count + 1);
  };

  const rightColumn = (
    <>
      <ScheduleSummary summary={provider.scheduleSummary} exceptions={provider.schedule.exceptions} today={today} />
      {showContacts && provider.contacts && <AddressCard contacts={provider.contacts} placeChain={provider.placeChain} />}
      {!provider.isOwner &&
        (signedIn ? (
          <BookingForm providerId={provider.id} timezone={provider.schedule.timezone} enabled={settings.feat_booking} />
        ) : (
          <div id="reserver" className="scroll-mt-24">
            <LoginWall />
          </div>
        ))}
      {!provider.isOwner &&
        (signedIn ? (
          <ReviewForm providerId={provider.id} enabled={settings.feat_reviews} onCreated={onReviewCreated} />
        ) : (
          <div id="avis" className="scroll-mt-24">
            <LoginWall />
          </div>
        ))}
    </>
  );

  return (
    <div className="mobile-page max-w-5xl">
      <BackLink />

      <ProviderHeaderCard provider={provider} category={category} distanceKm={distanceKm} canReport={signedIn && !provider.isOwner} />

      {provider.isOwner ? null : signedIn ? (
        <ContactBlock provider={provider} whatsappEnabled={settings.feat_whatsapp} canMessage={canMessage} onMessage={() => setComposerOpen(true)} />
      ) : (
        <div className="mt-4">
          <LoginWall />
        </div>
      )}

      {canMessage && <MessageComposer open={composerOpen} onClose={() => setComposerOpen(false)} providerId={provider.id} providerName={provider.displayName} />}

      <DistanceEstimator onPosition={setViewer} />

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Gallery items={images} />
          <SocialEmbeds social={provider.social} videos={videos} />
          <ProviderChoices provider={provider} />
          <SkillsList provider={provider} />
          <ReviewsList reviews={reviews} total={total} />
        </div>
        <div className="space-y-6 md:sticky md:top-24 md:self-start">{rightColumn}</div>
      </div>
    </div>
  );
}
