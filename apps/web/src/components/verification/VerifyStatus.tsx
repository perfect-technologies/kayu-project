"use client";

import { ShieldCheck } from "lucide-react";
import type { VerificationStateResponse } from "@kayu/schemas";
import { verificationCopy } from "@/copy/verification";

const copy = verificationCopy;

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

/** Emerald hero with a faded shield watermark: state label, progress bar, next action, dates. */
export function VerifyStatus({ state, onEdit }: { state: VerificationStateResponse; onEdit?: () => void }) {
  const info = copy.states[state.state];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-soft">
      <ShieldCheck aria-hidden size={160} strokeWidth={1} className="pointer-events-none absolute -right-8 -bottom-10 text-white/10" />
      <div className="relative">
        <p className="text-[10px] font-extrabold tracking-[.19em] text-white/60 uppercase">{copy.title}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">{info.label}</h2>
        <p className="mt-2 text-sm text-white/75">{info.next}</p>
        <div className="mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress} aria-label={copy.progress(state.progress)}>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${state.progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-white/70">{copy.progress(state.progress)}</p>
        </div>
        {state.state === "REJECTED" && state.rejectionReason && (
          <p role="alert" className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm">
            {copy.rejectionReason} : {state.rejectionReason}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/60">
          {state.submittedAt && <span>{copy.submittedOn(formatDate(state.submittedAt))}</span>}
          {state.reviewedAt && <span>{copy.reviewedOn(formatDate(state.reviewedAt))}</span>}
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground">
            {copy.edit}
          </button>
        )}
      </div>
    </section>
  );
}
