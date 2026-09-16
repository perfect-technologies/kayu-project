"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { ApiError, providersApi } from "@kayu/api";
import { FormError } from "@/components/forms/Field";
import { ProgressRail } from "@/components/onboarding/ProgressRail";
import { StepInfos } from "@/components/onboarding/StepInfos";
import { StepLocation } from "@/components/onboarding/StepLocation";
import { StepPublic } from "@/components/onboarding/StepPublic";
import { StepServices } from "@/components/onboarding/StepServices";
import { WizardFooter } from "@/components/onboarding/WizardFooter";
import { WizardHero } from "@/components/onboarding/WizardHero";
import { WIZARD_STEP_LABELS } from "@/components/onboarding/ProgressRail";
import { emptyDraft, useWizardDraft, type WizardStep } from "@/components/onboarding/wizard-state";
import { mapIssues, stepErrors, stepIsValid, toPublishPayload, validatePayload, type FieldErrors } from "@/components/onboarding/wizard-validation";
import { AuthBootScreen } from "@/components/guards";
import { Skeleton } from "@/components/ui/skeleton";
import { WizardSteps } from "@/components/ui/wizard-steps";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { onboardingCopy } from "@/copy/onboarding";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { apiClient } from "@/lib/api";
import { getBrowserPosition, roundCoord } from "@/lib/geo";
import { clearDraft } from "@/lib/onboarding-draft";

const copy = onboardingCopy;
const SUCCESS_DELAY_MS = 1500;

type ServerValidation = { errors?: Array<{ path: string; message: string }> };

export function WizardClient() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { tree } = useCategoryTree();
  const { draft, patch, hydrated } = useWizardDraft(() => emptyDraft({ phone: user?.phone, displayName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") }));
  const [busySources, setBusySources] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const redirect = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = draft.step;
  const uploading = Object.values(busySources).some(Boolean);
  const canContinue = hydrated && stepIsValid(step, draft, tree);

  const busyFor = useMemo(() => {
    const make = (key: string) => (busy: boolean) => setBusySources((current) => (current[key] === busy ? current : { ...current, [key]: busy }));
    return { photo: make("photo"), public: make("public") };
  }, []);

  useEffect(() => () => {
    if (redirect.current) clearTimeout(redirect.current);
  }, []);

  // An existing provider belongs in the editor; the check lives here (not in a guard) so the role
  // flip after publishing does not pull the success screen away.
  const existingProviderId = user?.provider?.id ?? null;
  useEffect(() => {
    if (existingProviderId && !publishedId) router.replace(`/prestataire/${encodeURIComponent(existingProviderId)}/modifier`);
  }, [existingProviderId, publishedId, router]);

  const goTo = useCallback(
    (next: WizardStep) => {
      patch({ step: next });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [patch],
  );

  const submit = useCallback(async () => {
    setServerError(null);
    let latitude = draft.latitude;
    let longitude = draft.longitude;
    if (latitude === null || longitude === null) {
      try {
        const position = await getBrowserPosition(5000);
        latitude = roundCoord(position.lat);
        longitude = roundCoord(position.lng);
        patch({ latitude, longitude });
      } catch {
        latitude = null;
        longitude = null;
      }
    }
    const payload = toPublishPayload({ ...draft, latitude, longitude }, tree);
    const invalid = validatePayload(payload);
    if (invalid) {
      setErrors(invalid.fields);
      setServerError(copy.errors.stepInvalid(WIZARD_STEP_LABELS[invalid.step]));
      goTo(invalid.step);
      return;
    }
    setSubmitting(true);
    try {
      const created = await providersApi(apiClient).publish(payload);
      clearDraft();
      setPublishedId(created.id);
      await refreshUser();
      redirect.current = setTimeout(() => router.replace(`/prestataire/${encodeURIComponent(created.id)}`), SUCCESS_DELAY_MS);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setServerError(copy.errors.alreadyProvider);
        const me = await refreshUser();
        router.replace(me?.provider ? `/prestataire/${encodeURIComponent(me.provider.id)}/modifier` : "/mon-espace");
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        const body = error.body as ServerValidation | undefined;
        const mapped = mapIssues(body?.errors ?? []);
        if (mapped) {
          setErrors(mapped.fields);
          setServerError(copy.errors.stepInvalid(WIZARD_STEP_LABELS[mapped.step]));
          goTo(mapped.step);
          return;
        }
      }
      setServerError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [draft, tree, patch, goTo, refreshUser, router]);

  const next = () => {
    const found = stepErrors(step, draft, tree);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < 4) goTo((step + 1) as WizardStep);
    else void submit();
  };

  const back = () => {
    setErrors({});
    setServerError(null);
    if (step > 1) goTo((step - 1) as WizardStep);
  };

  if (existingProviderId && !publishedId) return <AuthBootScreen />;

  if (publishedId) {
    return (
      <div className="mobile-page max-w-lg py-24 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent shadow-soft">
          <CheckCircle size={40} aria-hidden className="text-accent-foreground" />
        </div>
        <h1 className="mt-5">{copy.success.title}</h1>
        <p role="status" className="mt-2 text-muted-foreground">
          {copy.success.subtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="mobile-page max-w-3xl">
      <WizardHero />
      <ProgressRail step={step} className="mt-7" />
      <div className="mt-6 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-7">
        {!hydrated ? (
          <div aria-hidden className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <WizardSteps step={step}>
            {step === 1 && (
              <StepInfos
                value={{ displayName: draft.displayName, phone: draft.phone, whatsapp: draft.whatsapp, profilePhoto: draft.profilePhoto }}
                onChange={patch}
                errors={errors}
                onBusyChange={busyFor.photo}
              />
            )}
            {step === 2 && (
              <StepServices
                tree={tree}
                value={{
                  categoryId: draft.categoryId,
                  subcategoryId: draft.subcategoryId,
                  serviceId: draft.serviceId,
                  yearsExperience: draft.yearsExperience,
                  skillIds: draft.skillIds,
                  freeSkills: draft.freeSkills,
                  description: draft.description,
                }}
                onChange={patch}
                errors={errors}
              />
            )}
            {step === 3 && (
              <StepLocation value={{ placeId: draft.placeId, addressLine: draft.addressLine, latitude: draft.latitude, longitude: draft.longitude }} onChange={patch} errors={errors} />
            )}
            {step === 4 && <StepPublic tree={tree} draft={draft} onChange={patch} errors={errors} onBusyChange={busyFor.public} />}
          </WizardSteps>
        )}
        <FormError message={serverError} className="mt-4" />
        {uploading && (
          <p role="status" className="mt-3 text-xs font-semibold text-muted-foreground">
            {copy.footer.uploading}
          </p>
        )}
      </div>
      <WizardFooter step={step} canContinue={canContinue} submitting={submitting} uploading={uploading} onBack={back} onNext={next} />
    </div>
  );
}
