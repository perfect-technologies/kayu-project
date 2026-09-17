"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { providersApi, queryKeys } from "@kayu/api";
import { compteCopy } from "@/copy/compte";
import { apiClient } from "@/lib/api";

const copy = compteCopy.premium;

/** Providers only: current tier from the public profile and a link to /premium. */
export function PremiumStatusCard({ providerId }: { providerId: string }) {
  const profile = useQuery({
    queryKey: queryKeys.providers.detail(providerId),
    queryFn: () => providersApi(apiClient).getPublic(providerId),
    staleTime: 5 * 60 * 1000,
  });
  const tier = profile.data?.premiumTier ?? "FREE";
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-border bg-white p-4 shadow-soft">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Crown size={22} aria-hidden strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-foreground">{copy.title}</p>
        <p className="text-xs font-semibold text-primary">{copy.tiers[tier]}</p>
        <p className="text-xs text-muted-foreground">{copy.description}</p>
      </div>
      <Link href="/premium" className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground">
        {copy.action}
      </Link>
    </section>
  );
}
