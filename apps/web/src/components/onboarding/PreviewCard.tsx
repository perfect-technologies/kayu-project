"use client";

import { ProviderAvatar } from "@/components/provider/ProviderAvatar";
import { onboardingCopy } from "@/copy/onboarding";

export type PreviewCardProps = {
  name: string;
  photoUrl: string | null;
  categoryLabel: string | null;
  subcategoryLabel: string | null;
  cityLabel: string | null;
  countryLabel: string | null;
};

/** How the provider card will read: avatar, name, "category · subcategory", "city · country". */
export function PreviewCard({ name, photoUrl, categoryLabel, subcategoryLabel, cityLabel, countryLabel }: PreviewCardProps) {
  const copy = onboardingCopy;
  const dash = copy.preview.empty;
  const sep = copy.preview.separator;
  return (
    <section className="rounded-2xl border border-border bg-secondary/40 p-4">
      <p className="mb-2 text-xs font-bold text-muted-foreground">{copy.public.preview}</p>
      <div className="flex items-center gap-3">
        <ProviderAvatar src={photoUrl} name={name || dash} size={56} rounded="full" />
        <div className="min-w-0 text-sm">
          <p className="truncate font-bold text-foreground">{name || dash}</p>
          <p className="truncate text-muted-foreground">{categoryLabel ? `${categoryLabel}${subcategoryLabel ? `${sep}${subcategoryLabel}` : ""}` : dash}</p>
          <p className="truncate text-muted-foreground">
            {cityLabel ?? dash}
            {sep}
            {countryLabel ?? dash}
          </p>
        </div>
      </div>
    </section>
  );
}
