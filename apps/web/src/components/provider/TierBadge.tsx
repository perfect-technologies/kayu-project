import { BadgeCheck, Crown, TrendingUp } from "lucide-react";
import type { ProviderCard } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { tierBadgeKind } from "@/lib/dto/provider";

const STYLES = {
  verified: { Icon: BadgeCheck, className: "bg-emerald-50 text-emerald-700", label: providerCopy.tier.verified },
  boosted: { Icon: TrendingUp, className: "bg-amber-50 text-amber-700", label: providerCopy.tier.boosted },
  elite: { Icon: Crown, className: "bg-violet-50 text-violet-600", label: providerCopy.tier.elite },
} as const;

/** Vérifié / Boosté / Elite pill, or nothing for a FREE unverified provider. Server-safe. */
export function TierBadge({ provider }: { provider: Pick<ProviderCard, "premiumTier" | "verified"> }) {
  const kind = tierBadgeKind(provider);
  if (!kind) return null;
  const { Icon, className, label } = STYLES[kind];
  return (
    <span className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold ${className}`}>
      <Icon size={13} aria-hidden /> {label}
    </span>
  );
}
