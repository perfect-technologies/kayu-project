"use client";

import { WizardSteps } from "@/components/ui/wizard-steps";
import { authCopy } from "@/copy/auth";
import { AuthStepDots } from "./AuthStepDots";
import { NameStep } from "./NameStep";
import { OtpStep } from "./OtpStep";
import { PhoneStep } from "./PhoneStep";
import { TermsStep } from "./TermsStep";
import { AUTH_PHASES, type useAuthFlow } from "./useAuthFlow";

const STEP_LABELS = [authCopy.steps.phone, authCopy.steps.otp, authCopy.steps.name, authCopy.steps.terms];

export type OtpFlowProps = {
  flow: ReturnType<typeof useAuthFlow>;
  otpSubmitLabel?: string;
  /** Rendered above the phone step only (the register account-type picker). */
  beforePhone?: React.ReactNode;
};

/** The four OTP steps swapped with the wizard transition (x ±24, 0.28 s). */
export function OtpFlow({ flow, otpSubmitLabel, beforePhone }: OtpFlowProps) {
  const index = AUTH_PHASES.indexOf(flow.phase);
  return (
    <div className="mt-6">
      <AuthStepDots steps={STEP_LABELS} active={index} className="mb-5" />
      <WizardSteps step={index}>
        {flow.phase === "phone" && (
          <div className="space-y-4">
            {beforePhone}
            <PhoneStep
              country={flow.country}
              onCountryChange={flow.setCountry}
              number={flow.number}
              onNumberChange={flow.setNumber}
              busy={flow.busy}
              error={flow.error}
              onSubmit={() => void flow.sendCode()}
            />
          </div>
        )}
        {flow.phase === "otp" && (
          <OtpStep
            phone={flow.phone}
            busy={flow.busy}
            error={flow.error}
            errorNonce={flow.errorNonce}
            onSubmit={(code) => void flow.verify(code)}
            onResend={flow.resend}
            onChangeNumber={flow.changeNumber}
            submitLabel={otpSubmitLabel}
          />
        )}
        {flow.phase === "name" && (
          <NameStep
            initial={{ firstName: flow.user?.firstName ?? null, lastName: flow.user?.lastName ?? null, placeId: null }}
            busy={flow.busy}
            error={flow.error}
            onSubmit={(value) => void flow.submitName(value)}
          />
        )}
        {flow.phase === "terms" && <TermsStep busy={flow.busy} error={flow.error} onSubmit={() => void flow.submitTerms()} />}
      </WizardSteps>
    </div>
  );
}
