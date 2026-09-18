"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, X } from "lucide-react";
import { addressesApi, queryKeys } from "@kayu/api";
import type { AssistantCreateBookingInput } from "@kayu/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { assistantCopy } from "@/copy/assistant";
import { apiClient } from "@/lib/api";
import { formatSlotLabel, type KnownProvider } from "./types";
import { useProviderName } from "./useProviderName";

const copy = assistantCopy.approval;
const DEFAULT_TIMEZONE = "Africa/Kinshasa";

export type ApprovalState = { state: "approval-requested" } | { state: "approval-responded"; approved: boolean; reason?: string };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <dt className="w-24 shrink-0 text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

export function ApprovalOutcome({ approval }: { approval: Extract<ApprovalState, { state: "approval-responded" }> }) {
  const superseded = approval.reason?.startsWith("Remplacé");
  return <p className="mt-3 text-xs font-semibold text-muted-foreground">{approval.approved ? copy.answered : superseded ? copy.superseded : copy.denied}</p>;
}

export function ApprovalActions({ confirmLabel, disabled, onApprove, onDeny }: { confirmLabel: string; disabled?: boolean; onApprove: () => void; onDeny: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button type="button" disabled={disabled} onClick={onApprove} className="primary-action primary-action--gold min-h-11 flex-1 text-sm">
        <Check size={16} aria-hidden /> {confirmLabel}
      </button>
      <button type="button" disabled={disabled} onClick={onDeny} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-foreground disabled:opacity-55">
        <X size={16} aria-hidden /> {copy.cancel}
      </button>
    </div>
  );
}

export function BookingApprovalCard({
  input,
  provider: known,
  approval,
  disabled,
  onApprove,
  onDeny,
}: {
  input: AssistantCreateBookingInput;
  provider: KnownProvider | null;
  approval: ApprovalState;
  disabled?: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const { user } = useAuth();
  const provider = useProviderName(input.providerId, known);
  const addresses = useQuery({
    queryKey: queryKeys.addresses.list({ limit: 50 }),
    queryFn: async () => (await addressesApi(apiClient).list({ limit: 50 })).items,
    enabled: Boolean(input.addressId),
    staleTime: 60 * 1000,
  });
  const saved = input.addressId ? (addresses.data?.find((address) => address.id === input.addressId) ?? null) : null;
  const timezone = provider?.timezone ?? DEFAULT_TIMEZONE;
  const phone = input.clientPhone ?? user?.phone ?? "—";
  const placeChain = saved?.placeChain.filter((place) => place.kind !== "COUNTRY").map((place) => place.label).join(" › ");

  return (
    <section aria-label={copy.bookingTitle} className="rounded-3xl border-2 border-accent/60 bg-white p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <CalendarCheck size={16} aria-hidden className="text-primary" /> {copy.bookingTitle}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{copy.bookingHint}</p>
      <dl className="mt-3 space-y-2">
        <Row label={copy.provider}>{provider?.displayName ?? "…"}</Row>
        <Row label={copy.when}>
          <span className="font-semibold">{formatSlotLabel(input.date, input.time)}</span>
          <span className="block text-[11px] text-muted-foreground">{copy.timezone(timezone)}</span>
        </Row>
        <Row label={copy.phone}>{phone}</Row>
        <Row label={copy.address}>
          {saved ? (
            <>
              <span className="font-semibold">{copy.addressSaved(assistantCopy.addressCard.labels[saved.label] ?? saved.label)}</span>
              <span className="block">{saved.addressLine}</span>
              {placeChain && <span className="block text-[11px] text-muted-foreground">{placeChain}</span>}
            </>
          ) : input.addressId ? (
            <span className="text-muted-foreground">…</span>
          ) : input.addressLine ? (
            input.addressLine
          ) : (
            <span className="text-muted-foreground">{copy.addressNone}</span>
          )}
        </Row>
        {input.clientNotes && <Row label={copy.notes}>{input.clientNotes}</Row>}
      </dl>
      {approval.state === "approval-requested" ? <ApprovalActions confirmLabel={copy.confirm} disabled={disabled} onApprove={onApprove} onDeny={onDeny} /> : <ApprovalOutcome approval={approval} />}
    </section>
  );
}
