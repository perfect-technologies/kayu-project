"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { identityApi, queryKeys } from "@kayu/api";
import { AccountSecurityCard } from "@/components/account/AccountSecurityCard";
import { PremiumStatusCard } from "@/components/account/PremiumStatusCard";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ProfileHeaderCard } from "@/components/account/ProfileHeaderCard";
import { QuickAccessGrid } from "@/components/account/QuickAccessGrid";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useAuth } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";
import { apiClient } from "@/lib/api";

const copy = compteCopy;

export function CompteClient() {
  const { user } = useAuth();
  const me = useQuery({
    queryKey: queryKeys.identity.me,
    queryFn: async () => (await identityApi(apiClient).me()).user,
    enabled: Boolean(user),
  });
  if (!user) return null;
  const isClient = user.role !== "PROVIDER" && !user.provider;

  return (
    <div className="mobile-page max-w-4xl">
      <h1>{copy.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="mt-6 space-y-5">
        <ProfileHeaderCard user={user} me={me.data} />
        {user.provider && <PremiumStatusCard providerId={user.provider.id} />}
        <QuickAccessGrid role={user.role} />

        {me.isLoading ? (
          <SkeletonCard lines={6} />
        ) : me.isError ? (
          <ErrorCard onRetry={() => void me.refetch()} />
        ) : me.data ? (
          <ProfileForm me={me.data} />
        ) : null}

        {isClient && (
          <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-white p-5 shadow-soft">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Briefcase size={22} aria-hidden strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-foreground">{copy.becomeProvider.title}</p>
              <p className="text-xs text-muted-foreground">{copy.becomeProvider.description}</p>
            </div>
            <Link href="/prestataire/nouveau" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
              {copy.becomeProvider.action}
            </Link>
          </section>
        )}

        <AccountSecurityCard />
      </div>
    </div>
  );
}
