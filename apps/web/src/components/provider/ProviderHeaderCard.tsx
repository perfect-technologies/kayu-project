"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, MapPin, Navigation, Star } from "lucide-react";
import type { CategoryTreeNode, ProviderPublic } from "@kayu/schemas";
import { formatDistance } from "@kayu/utils";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { providerCopy } from "@/copy/provider";
import { lucideIcon } from "@/lib/dto/icons";
import { categoryColorClass, deepestCategory, formatRating, placeLabel, rootCategory } from "@/lib/dto/provider";
import { ProviderAvatar } from "./ProviderAvatar";
import { SafetyActions } from "./SafetyActions";
import { TierBadge } from "./TierBadge";

const copy = providerCopy.header;

export function ProviderHeaderCard({
  provider,
  category,
  distanceKm,
  canReport,
}: {
  provider: ProviderPublic;
  category: CategoryTreeNode | null;
  distanceKm: number | null;
  canReport: boolean;
}) {
  const reduce = useReducedMotion();
  const root = rootCategory(provider.categoryChain);
  const deepest = deepestCategory(provider.categoryChain);
  const Icon = lucideIcon(category?.icon);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : undefined}
      className="mt-4 overflow-hidden rounded-3xl border border-border bg-white shadow-soft"
    >
      <div aria-hidden className={`h-3 ${categoryColorClass(category?.slug ?? root?.slug)}`} />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
        <ProviderAvatar src={provider.profilePhoto} name={provider.displayName} size={96} className="self-center shadow-soft sm:self-auto" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{provider.displayName}</h1>
            <TierBadge provider={provider} />
          </div>
          {canReport && (
            <div className="mt-1.5">
              <SafetyActions providerId={provider.id} ownerId={provider.ownerId} />
            </div>
          )}
          {provider.isOwner && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {copy.ownerHint}{" "}
              <Link href={`/prestataire/${encodeURIComponent(provider.id)}/modifier`} className="font-bold text-primary">
                {copy.edit}
              </Link>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-muted-foreground">
            {deepest && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className={`inline-flex shrink-0 items-center justify-center rounded-md p-1 text-white ${categoryColorClass(category?.slug ?? root?.slug)}`}>
                  <Icon size={14} aria-hidden />
                </span>
                <span className="min-w-0">{deepest.name}</span>
              </span>
            )}
            {provider.yearsExperience !== null && provider.yearsExperience > 0 && (
              <span className="inline-flex items-center gap-1">
                <Briefcase size={13} aria-hidden /> {copy.experience(provider.yearsExperience)}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star aria-hidden className="fill-amber-400 text-amber-400" size={15} />
              {formatRating(provider.ratingAvg, provider.ratingCount)}
              <span className="font-normal text-muted-foreground">({copy.reviews(provider.ratingCount)})</span>
            </span>
            {provider.placeChain.length > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin size={14} aria-hidden /> {placeLabel(provider.placeChain)}
              </span>
            )}
            {distanceKm !== null && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <Navigation size={14} aria-hidden /> {formatDistance(distanceKm)}
              </span>
            )}
          </div>

          {provider.description && (
            <ExpandableText text={provider.description} chars={180} className="mt-3 text-sm leading-relaxed text-muted-foreground" />
          )}
        </div>
      </div>
    </motion.section>
  );
}
