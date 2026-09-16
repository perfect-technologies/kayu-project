"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminUpdateProviderDto, PremiumTier, VerificationStatus } from "@kayu/schemas";
import { Briefcase } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { FilterSelect } from "../_components/FilterSelect";
import { Pagination } from "../_components/Pagination";
import { QueryState } from "../_components/QueryState";
import { SearchBox } from "../_components/SearchBox";
import { SectionTitle } from "../_components/SectionTitle";
import { useAdminMutation } from "../_components/useAdminMutation";
import { useAdminParams } from "../_components/useAdminParams";
import { ProviderCard } from "./ProviderCard";

const copy = adminCopy.providers;
const LIMIT = 30;
const VERIFICATION: VerificationStatus[] = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];
const TIERS: PremiumTier[] = ["FREE", "VERIFIED", "BOOSTED", "ELITE"];

export function Providers() {
  const { q, page, set } = useAdminParams();
  const [verification, setVerification] = useState("");
  const [tier, setTier] = useState("");
  const [hidden, setHidden] = useState("");

  const params = {
    q: q || undefined,
    verificationStatus: (verification || undefined) as VerificationStatus | undefined,
    premiumTier: (tier || undefined) as PremiumTier | undefined,
    hidden: hidden === "" ? undefined : hidden === "true",
    page,
    limit: LIMIT,
  };
  const query = useQuery({
    queryKey: queryKeys.admin.providers(params),
    queryFn: () => adminApi(apiClient).providers(params),
    placeholderData: keepPreviousData,
  });
  const update = useAdminMutation({
    mutationFn: ({ providerId, dto }: { providerId: string; dto: AdminUpdateProviderDto }) => adminApi(apiClient).updateProvider(providerId, dto),
    invalidate: [["admin", "providers"], ["admin", "verification"], ["providers"]],
    success: (_result, { dto }) => {
      if (dto.verificationStatus !== undefined) return dto.verificationStatus === "VERIFIED" ? copy.toasts.verified : copy.toasts.unverified;
      if (dto.hidden !== undefined) return dto.hidden ? copy.toasts.hidden : copy.toasts.published;
      return copy.toasts.tier;
    },
  });
  const items = query.data?.items ?? [];
  const resetPage = () => set({ page: null });

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox placeholder={copy.searchPlaceholder} />
        <FilterSelect label={copy.verificationFilter} value={verification} onChange={(value) => { setVerification(value); resetPage(); }} allLabel={adminCopy.common.all} options={VERIFICATION.map((value) => ({ value, label: adminCopy.pills[value] }))} />
        <FilterSelect label={copy.tierFilter} value={tier} onChange={(value) => { setTier(value); resetPage(); }} allLabel={adminCopy.common.all} options={TIERS.map((value) => ({ value, label: adminCopy.pills[value] }))} />
        <FilterSelect label={copy.hiddenFilter} value={hidden} onChange={(value) => { setHidden(value); resetPage(); }} allLabel={adminCopy.common.all} options={[{ value: "false", label: copy.visibleOnly }, { value: "true", label: copy.hiddenOnly }]} />
      </div>
      <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={items.length === 0} empty={{ icon: Briefcase, title: copy.empty }} skeletons={4}>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              busy={update.isPending && update.variables?.providerId === provider.id}
              onUpdate={(dto) => update.mutateAsync({ providerId: provider.id, dto })}
            />
          ))}
        </div>
      </QueryState>
      {items.length > 0 && <Pagination page={page} total={query.data?.total ?? 0} limit={LIMIT} onPage={(next) => set({ page: next })} />}
    </section>
  );
}
