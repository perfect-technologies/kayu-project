"use client";

import { Lock, Send } from "lucide-react";
import type { VerificationDocKind, VerificationStateResponse } from "@kayu/schemas";
import { Spinner } from "@/components/forms/Field";
import { verificationCopy } from "@/copy/verification";
import { UploadTarget, type UploadTargetProps } from "./UploadTarget";

const copy = verificationCopy;
const REQUIRED: VerificationDocKind[] = ["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS"];
const KINDS: VerificationDocKind[] = [...REQUIRED, "CERT_OPTIONAL"];

export type VerifyWizardProps = {
  state: VerificationStateResponse;
  locked: boolean;
  submitting: boolean;
  onUploaded: UploadTargetProps["onUploaded"];
  onRemove: UploadTargetProps["onRemove"];
  onSubmit: () => void;
};

/** Four required upload cards plus the optional certificate, a benefits card, the private-bucket note and the submit pill. */
export function VerifyWizard({ state, locked, submitting, onUploaded, onRemove, onSubmit }: VerifyWizardProps) {
  const byKind = new Map(state.docs.map((doc) => [doc.kind, doc]));
  const missing = REQUIRED.filter((kind) => !byKind.has(kind));
  const canSubmit = missing.length === 0 && !locked;

  return (
    <div className="space-y-5">
      <div className="space-y-5 rounded-3xl border border-border bg-white p-5">
        {KINDS.map((kind) => (
          <UploadTarget key={kind} kind={kind} required={REQUIRED.includes(kind)} doc={byKind.get(kind) ?? null} locked={locked} onUploaded={onUploaded} onRemove={onRemove} />
        ))}
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-bold text-emerald-800">{copy.benefits.title}</p>
        <ul className="mt-2 space-y-2">
          {copy.benefits.items.map((item) => (
            <li key={item.title} className="text-xs text-emerald-900">
              <span className="font-bold">{item.title}</span> — {item.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft">
          <Lock size={16} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold">{state.storage.title || copy.security.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{state.storage.description || copy.security.body}</p>
        </div>
      </section>

      {!locked && (
        <div className="space-y-2">
          {missing.length > 0 && (
            <p role="status" className="text-center text-xs font-semibold text-muted-foreground">
              {copy.missing(missing.length)}
            </p>
          )}
          <button type="button" disabled={!canSubmit || submitting} aria-busy={submitting} onClick={onSubmit} className="primary-action primary-action--gold">
            {submitting ? (
              <>
                <Spinner /> {copy.submitting}
              </>
            ) : (
              <>
                {copy.submit} <Send size={18} aria-hidden />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
