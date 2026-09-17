"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/forms/Field";
import { onboardingCopy } from "@/copy/onboarding";
import type { WizardStep } from "./wizard-state";

const copy = onboardingCopy.footer;

export type WizardFooterProps = {
  step: WizardStep;
  canContinue: boolean;
  submitting: boolean;
  uploading: boolean;
  onBack: () => void;
  onNext: () => void;
};

/** "← Retour" outline pill from step 2, gold "Continuer →" / "Créer mon profil →" disabled until the step validates. */
export function WizardFooter({ step, canContinue, submitting, uploading, onBack, onNext }: WizardFooterProps) {
  const last = step === 4;
  return (
    <div className="mt-5 flex items-center gap-3">
      {step > 1 && (
        <button type="button" onClick={onBack} disabled={submitting} className="secondary-action min-h-12 rounded-full">
          <ArrowLeft size={18} aria-hidden /> {copy.back}
        </button>
      )}
      <button type="button" onClick={onNext} disabled={!canContinue || submitting || uploading} aria-busy={submitting} className="primary-action primary-action--gold min-h-12 flex-1">
        {submitting ? (
          <>
            <Spinner /> {copy.submitting}
          </>
        ) : (
          <>
            {last ? copy.submit : copy.next} <ArrowRight size={18} aria-hidden />
          </>
        )}
      </button>
    </div>
  );
}
