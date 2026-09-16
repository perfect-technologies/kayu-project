"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminProvider, AdminUpdateProviderDto, PremiumTier } from "@kayu/schemas";
import { BadgeCheck, BadgeX, Eye, EyeOff, Sparkles } from "lucide-react";
import { Field, SelectField } from "@/components/forms/Field";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { adminCopy } from "@/copy/admin";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { toDateInput } from "../_components/format";

const copy = adminCopy.providers;
const TIERS: PremiumTier[] = ["FREE", "VERIFIED", "BOOSTED", "ELITE"];

export type ProviderCardProps = {
  provider: AdminProvider;
  busy: boolean;
  onUpdate: (dto: AdminUpdateProviderDto) => Promise<unknown>;
};

/** Avatar, name, place · category, pills, then verify / hide / tier controls. */
export function ProviderCard({ provider, busy, onUpdate }: ProviderCardProps) {
  const [tierOpen, setTierOpen] = useState(false);
  const [tier, setTier] = useState<PremiumTier>(provider.premiumTier);
  const [until, setUntil] = useState(toDateInput(provider.premiumUntil));
  const verified = provider.verificationStatus === "VERIFIED";
  const verifySheet = verified ? copy.sheets.unverify : copy.sheets.verify;

  const saveTier = (nextTier: PremiumTier, nextUntil: string) => {
    setTier(nextTier);
    setUntil(nextUntil);
    void onUpdate({ premiumTier: nextTier, premiumUntil: nextUntil ? new Date(`${nextUntil}T23:59:59`) : null }).catch(() => {
      setTier(provider.premiumTier);
      setUntil(toDateInput(provider.premiumUntil));
    });
  };

  return (
    <article className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <MiniAvatar src={provider.profilePhoto} name={provider.displayName} size={48} />
        <div className="min-w-0 flex-1">
          <Link href={`/prestataire/${encodeURIComponent(provider.id)}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-extrabold text-foreground hover:text-primary">
            {provider.displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {[provider.placeLabel, provider.categoryLabel].filter(Boolean).join(" · ") || adminCopy.common.none}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {copy.rating(provider.ratingAvg, provider.ratingCount)} · {copy.jobs(provider.completedJobs)}
            {!provider.owner.isActive && <span className="ml-1 italic">· {copy.ownerSuspended}</span>}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <AdminStatusPill status={provider.verificationStatus} />
        <AdminStatusPill status={provider.premiumTier} />
        {provider.hidden && <AdminStatusPill status="HIDDEN" />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ConfirmAction
          className="h-9 px-3 text-xs"
          disabled={busy}
          destructive={verified}
          sheet={{ title: verifySheet.title, description: verifySheet.description, confirmLabel: verifySheet.confirm }}
          onConfirm={() => onUpdate({ verificationStatus: verified ? "PENDING" : "VERIFIED" })}
        >
          {verified ? <BadgeX size={14} aria-hidden /> : <BadgeCheck size={14} aria-hidden />} {verified ? copy.unverify : copy.verify}
        </ConfirmAction>
        {provider.hidden ? (
          <button type="button" disabled={busy} onClick={() => void onUpdate({ hidden: false })} className="secondary-action h-9 px-3 text-xs">
            <Eye size={14} aria-hidden /> {copy.publish}
          </button>
        ) : (
          <ConfirmAction className="h-9 px-3 text-xs" disabled={busy} sheet={{ title: copy.sheets.hide.title, description: copy.sheets.hide.description, confirmLabel: copy.sheets.hide.confirm }} onConfirm={() => onUpdate({ hidden: true })}>
            <EyeOff size={14} aria-hidden /> {copy.hide}
          </ConfirmAction>
        )}
        <button type="button" onClick={() => setTierOpen((open) => !open)} aria-expanded={tierOpen} className="secondary-action h-9 px-3 text-xs">
          <Sparkles size={14} aria-hidden /> {copy.tier} : {adminCopy.pills[tier]}
        </button>
      </div>
      {tierOpen && (
        <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-secondary/40 p-3 sm:grid-cols-2">
          <SelectField label={copy.tier} value={tier} disabled={busy} onChange={(event) => saveTier(event.target.value as PremiumTier, until)}>
            {TIERS.map((value) => (
              <option key={value} value={value}>
                {adminCopy.pills[value]}
              </option>
            ))}
          </SelectField>
          <Field label={copy.premiumUntil} type="date" value={until} disabled={busy || tier === "FREE"} hint={copy.premiumUntilHint} onChange={(event) => saveTier(tier, event.target.value)} />
        </div>
      )}
    </article>
  );
}
