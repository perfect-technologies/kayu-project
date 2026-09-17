"use client";

import Link from "next/link";
import { Briefcase, CalendarClock, Clock, MapPin, MessageCircle, Phone, Send, Star } from "lucide-react";
import type { ProviderPublic } from "@kayu/schemas";
import { formatNumber } from "@kayu/utils";
import { ContactsLocked } from "@/components/provider/ContactsLocked";
import { ProviderAvatar } from "@/components/provider/ProviderAvatar";
import { TierBadge } from "@/components/provider/TierBadge";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { Skeleton } from "@/components/ui/skeleton";
import { assistantCopy } from "@/copy/assistant";
import { providerCopy } from "@/copy/provider";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { findRoot } from "@/lib/dto/category";
import { lucideIcon } from "@/lib/dto/icons";
import { categoryColorClass, deepestCategory, formatRating, placeLabel, rootCategory, whatsappLink } from "@/lib/dto/provider";
import { bookingHref, providerHref } from "./types";

const copy = assistantCopy.detail;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SKILLS_SHOWN = 6;

export function ProviderDetailCardSkeleton() {
  return (
    <div role="status" aria-label={assistantCopy.thinking} className="loading-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <Skeleton className="mt-4 h-11 w-full rounded-full" />
    </div>
  );
}

export function ProviderDetailCard({
  provider,
  whatsappEnabled,
  disabled,
  onSlots,
}: {
  provider: ProviderPublic;
  whatsappEnabled: boolean;
  disabled?: boolean;
  onSlots: (provider: ProviderPublic) => void;
}) {
  const { tree } = useCategoryTree();
  const root = rootCategory(provider.categoryChain);
  const category = findRoot(tree, root?.slug);
  const deepest = deepestCategory(provider.categoryChain);
  const Icon = lucideIcon(category?.icon);
  const contacts = provider.contactsLocked ? null : provider.contacts;
  const whatsapp = whatsappEnabled ? contacts?.whatsapp || contacts?.phone || null : null;
  const skills = [...provider.skills.map((skill) => skill.label), ...provider.freeSkills].slice(0, SKILLS_SHOWN);
  const byDay = new Map(provider.scheduleSummary.map((day) => [day.dayOfWeek, day.ranges]));
  const pricing = provider.pricing;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
      <div aria-hidden className={`h-2 ${categoryColorClass(root?.slug)}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ProviderAvatar src={provider.profilePhoto} name={provider.displayName} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-extrabold text-foreground">{provider.displayName}</h3>
              <TierBadge provider={provider} />
            </div>
            {deepest && (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-white ${categoryColorClass(root?.slug)}`}>
                  <Icon size={12} aria-hidden />
                </span>
                <span className="truncate">{deepest.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star aria-hidden className="fill-amber-400 text-amber-400" size={13} />
            {formatRating(provider.ratingAvg, provider.ratingCount)}
            <span className="font-normal text-muted-foreground">({copy.reviews(provider.ratingCount)})</span>
          </span>
          {provider.placeChain.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden /> {placeLabel(provider.placeChain)}
            </span>
          )}
          {provider.yearsExperience !== null && provider.yearsExperience > 0 && (
            <span className="inline-flex items-center gap-1">
              <Briefcase size={12} aria-hidden /> {copy.experience(provider.yearsExperience)}
            </span>
          )}
          {!provider.isAvailable && <span className="status-pill status-pill--pending">{copy.unavailable}</span>}
        </div>

        {provider.description && <ExpandableText text={provider.description} chars={180} className="mt-3 text-sm leading-relaxed text-muted-foreground" />}

        {skills.length > 0 && (
          <ul aria-label={copy.skills} className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((skill, index) => (
              <li key={`${skill}-${index}`} className="inline-flex min-h-8 items-center rounded-full bg-muted px-2.5 text-xs font-medium text-foreground/80">
                {skill}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-secondary/60 p-3 text-xs">
            <p className="flex items-center gap-1 font-bold text-foreground">
              <Clock size={12} aria-hidden /> {copy.schedule}
            </p>
            <dl className="mt-1.5 space-y-0.5">
              {DAY_ORDER.map((day) => {
                const ranges = byDay.get(day) ?? [];
                return (
                  <div key={day} className="flex justify-between gap-2">
                    <dt className="w-8 font-semibold text-foreground">{providerCopy.schedule.days[day]}</dt>
                    <dd className={ranges.length === 0 ? "text-muted-foreground/70" : "text-right text-foreground/80"}>
                      {ranges.length === 0 ? copy.closed : ranges.map((range) => `${range.startTime}–${range.endTime}`).join(" · ")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
          {pricing && (
            <div className="rounded-2xl bg-secondary/60 p-3 text-xs">
              <p className="font-bold text-foreground">{copy.pricing}</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {copy.pricingFrom(`${formatNumber(pricing.amount)} ${pricing.currency?.label ?? ""}`.trim(), pricing.unit?.label ?? "")}
              </p>
              <p className="mt-1 text-muted-foreground">{providerCopy.choices.pricingHint}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          {provider.blocked ? (
            <p className="rounded-2xl border border-border bg-muted p-3 text-center text-sm text-muted-foreground">{copy.blocked}</p>
          ) : contacts ? (
            <div className="grid grid-cols-2 gap-2">
              {contacts.phone && (
                <a href={`tel:${contacts.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-3 text-sm font-semibold text-foreground">
                  <Phone size={16} aria-hidden /> {copy.call}
                </a>
              )}
              {whatsapp && (
                <a href={whatsappLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-white">
                  <MessageCircle size={16} aria-hidden /> {copy.whatsapp}
                </a>
              )}
            </div>
          ) : (
            <ContactsLocked />
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSlots(provider)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-55"
          >
            <CalendarClock size={16} aria-hidden /> {copy.slots}
          </button>
          <Link href={providerHref(provider.id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-primary">
            <Send size={16} aria-hidden /> {copy.write}
          </Link>
          <Link href={bookingHref(provider.id)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-bold text-primary">
            {copy.book}
          </Link>
        </div>
      </div>
    </article>
  );
}
