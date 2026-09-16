"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Navigation, Star } from "lucide-react";
import type { CategoryTreeNode, ProviderCard as ProviderCardDto } from "@kayu/schemas";
import { calculateDistance, formatDistance } from "@kayu/utils";
import { searchCopy } from "@/copy/search";
import { lucideIcon } from "@/lib/dto/icons";
import { categoryColorClass, cityOf, deepestCategory, formatRating, rootCategory } from "@/lib/dto/provider";
import type { LatLng } from "@/lib/geo";
import { ProviderAvatar } from "./ProviderAvatar";

const copy = searchCopy.card;

export type ProviderCardProps = {
  provider: ProviderCardDto;
  /** Root category node, for the icon; colour falls back to the token map. */
  category?: CategoryTreeNode | null;
  viewer?: LatLng | null;
  index?: number;
};

/** Search result tile: square photo, rating chip, name, specialty, city, gold "Voir le profil" pill. */
export function ProviderCard({ provider, category, viewer, index = 0 }: ProviderCardProps) {
  const reduce = useReducedMotion();
  const root = rootCategory(provider.categoryChain);
  const deepest = deepestCategory(provider.categoryChain);
  const Icon = lucideIcon(category?.icon);
  const city = cityOf(provider.placeChain);
  const distance =
    provider.distanceKm ??
    (viewer && provider.latitude !== null && provider.longitude !== null
      ? calculateDistance(viewer.lat, viewer.lng, provider.latitude, provider.longitude)
      : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      {...(reduce
        ? { animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
        : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { delay: Math.min(index * 0.03, 0.3) } })}
      className="h-full"
    >
      <Link
        href={`/prestataire/${encodeURIComponent(provider.id)}`}
        className="provider-tile group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition hover:border-primary/30 hover:shadow-soft-lg"
      >
        <div className="relative aspect-square w-full bg-muted">
          <ProviderAvatar src={provider.profilePhoto} name={provider.displayName} fill rounded="none" />
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-foreground shadow-sm">
            <Star aria-hidden className="fill-amber-400 text-amber-400" size={12} />
            {formatRating(provider.ratingAvg, provider.ratingCount)}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary sm:text-base">{provider.displayName}</h3>
          {deepest && (
            <p className="mt-1 flex min-w-0 items-start gap-1.5 text-xs font-medium text-muted-foreground">
              <span className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-white ${categoryColorClass(root?.slug)}`}>
                <Icon size={12} aria-hidden />
              </span>
              <span className="line-clamp-2 min-w-0">{deepest.name}</span>
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={12} aria-hidden className="shrink-0" />
              <span className="truncate">{city?.label ?? ""}</span>
            </span>
            {distance !== null ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
                <Navigation size={11} aria-hidden /> {formatDistance(distance)}
              </span>
            ) : (
              provider.ratingCount > 0 && <span className="shrink-0 text-muted-foreground/70">{copy.reviews(provider.ratingCount)}</span>
            )}
          </div>
          <span className="mt-4 flex min-h-10 items-center justify-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">
            {copy.viewProfile}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
