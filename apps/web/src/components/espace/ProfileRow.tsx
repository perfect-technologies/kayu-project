import Link from "next/link";
import { Pencil, Star } from "lucide-react";
import type { ProviderDashboardResponse } from "@kayu/schemas";
import { ProviderAvatar } from "@/components/provider/ProviderAvatar";
import { espaceCopy } from "@/copy/espace";

const copy = espaceCopy.profile;

export type ProfileRowProps = {
  provider: ProviderDashboardResponse["provider"];
  /** "Catégorie · Lieu" line; the dashboard DTO carries neither, so the caller passes what it knows. */
  meta?: string | null;
};

/** 56 px avatar, display name, meta line, rating and an outline "Modifier"; the row opens the public profile. */
export function ProfileRow({ provider, meta }: ProfileRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border bg-white p-4 shadow-soft">
      <Link href={`/prestataire/${provider.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl" aria-label={copy.view}>
        <ProviderAvatar src={provider.profilePhoto} name={provider.displayName} size={56} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-extrabold text-foreground">{provider.displayName}</span>
          {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
          <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-foreground">
            <Star size={13} aria-hidden className="fill-amber-400 text-amber-400" />
            {provider.ratingCount > 0 ? `${provider.ratingAvg.toFixed(1)} (${provider.ratingCount})` : copy.noRating}
          </span>
        </span>
      </Link>
      <Link href={`/prestataire/${provider.id}/modifier`} className="secondary-action shrink-0 px-4">
        <Pencil size={14} aria-hidden /> {copy.edit}
      </Link>
    </div>
  );
}
