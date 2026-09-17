"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { KIN_COMMUNES } from "@kayu/schemas";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

import type { CampaignCategory } from "./campaign-data";
import { FormError, Spinner } from "@/components/forms/Field";
import {
  createEmptyCampaignFormValues,
  type CampaignFormValues,
} from "@/lib/campaign-form-state";
import {
  CampaignLeadSubmissionError,
  campaignSubmissionErrorCopy,
  emitCampaignEvent,
  emitCampaignEventOnce,
  mergeCampaignAttribution,
  normalizeCampaignPhone,
  parseCampaignAttribution,
  submitCampaignLead,
  type CampaignLeadType,
  type ClientTiming,
  type LeadAttribution,
  type ProviderExperienceBand,
} from "@/lib/campaign-leads";
import { cn } from "@/lib/utils";

type CampaignFormProps = {
  role: CampaignLeadType;
  categories: CampaignCategory[];
  privacyNoticeVersion: string;
  privacyContact: string;
  onChooseOtherRole: () => void;
};

type FormErrors = Partial<
  Record<keyof CampaignFormValues | "form", string>
>;

const ATTRIBUTION_STORAGE_KEY = "kayou:campaign-attribution";

function readStoredAttribution(): LeadAttribution {
  try {
    const value = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!value) return {};

    const parsed = JSON.parse(value) as LeadAttribution;
    return {
      source: typeof parsed.source === "string" ? parsed.source : undefined,
      medium: typeof parsed.medium === "string" ? parsed.medium : undefined,
      campaign:
        typeof parsed.campaign === "string" ? parsed.campaign : undefined,
      content: typeof parsed.content === "string" ? parsed.content : undefined,
      referrerHost:
        typeof parsed.referrerHost === "string"
          ? parsed.referrerHost
          : undefined,
    };
  } catch {
    return {};
  }
}

function FieldError({
  id,
  children,
}: {
  id: string;
  children?: string;
}) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-semibold text-destructive">
      {children}
    </p>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-bold text-foreground"
    >
      {children}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  children,
  error,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "field relative has-[select:disabled]:bg-muted",
        error && "border-destructive",
      )}
    >
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="appearance-none pr-8 text-base disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export function CampaignForm({
  role,
  categories,
  privacyNoticeVersion,
  privacyContact,
  onChooseOtherRole,
}: CampaignFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<CampaignFormValues>(
    createEmptyCampaignFormValues,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [attribution, setAttribution] = useState<LeadAttribution>({});
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const startedAt = useRef<number | null>(null);
  const submissionInFlight = useRef(false);
  const trackedEvents = useRef(new Set<string>());
  const formRef = useRef<HTMLFormElement>(null);

  const roleLabel =
    role === "provider" ? "Je propose mes services" : "Je cherche un service";

  const primaryAction =
    role === "provider"
      ? "Être parmi les premiers pros"
      : "Être parmi les premiers clients";

  useEffect(() => {
    const current = parseCampaignAttribution(
      window.location.search,
      document.referrer,
    );
    const merged = mergeCampaignAttribution(readStoredAttribution(), current);
    setAttribution(merged);

    try {
      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(merged),
      );
    } catch {
      // Storage availability is not required for a valid submission.
    }
  }, []);

  useEffect(() => {
    setStep(1);
    setValues(createEmptyCampaignFormValues());
    setErrors({});
    setAccepted(false);
    setSubmitting(false);
    startedAt.current = null;
    submissionInFlight.current = false;
  }, [role]);

  const trackOnce = useCallback(
    (
      key: string,
      event: Parameters<typeof emitCampaignEvent>[0],
      input: Parameters<typeof emitCampaignEvent>[1] = {},
    ) => {
      emitCampaignEventOnce(trackedEvents.current, key, event, {
        leadType: role,
        attribution,
        ...input,
      });
    },
    [attribution, role],
  );

  const markStarted = useCallback(() => {
    if (startedAt.current == null) startedAt.current = Date.now();
    trackOnce(`${role}:form-started`, "launch_form_started");
  }, [trackOnce]);

  const subcategoryCount = useMemo(
    () =>
      categories.reduce(
        (total, category) => total + category.subcategories.length,
        0,
      ),
    [categories],
  );

  const updateValue = <Key extends keyof CampaignFormValues>(
    key: Key,
    value: CampaignFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    }
  };

  const reportValidationErrors = useCallback(
    (nextErrors: FormErrors) => {
      for (const field of Object.keys(nextErrors)) {
        const errorCode =
          field === "operationalConsent"
            ? "consent_required"
            : field === "phone" || field === "email"
              ? "invalid_format"
              : field === "firstName" && values.firstName.trim().length > 0
                ? "too_short"
                : "required";
        emitCampaignEvent("launch_form_validation_failed", {
          leadType: role,
          attribution,
          field,
          errorCode,
        });
      }
    },
    [attribution, role, values.firstName],
  );

  const focusFirstError = (nextErrors: FormErrors) => {
    const firstField = Object.keys(nextErrors)[0];
    if (!firstField || firstField === "form") return;

    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`#${firstField}`)
        ?.focus({ preventScroll: false });
    });
  };

  const validateStepOne = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const trimmedName = values.firstName.trim();

    if (trimmedName.length < 2) {
      nextErrors.firstName = "Indiquez votre prénom (2 caractères minimum).";
    }
    if (!normalizeCampaignPhone(values.phone)) {
      nextErrors.phone = "Indiquez un numéro valide de RDC.";
    }
    if (!values.subcategoryId) {
      nextErrors.subcategoryId = "Choisissez le service principal.";
    }
    if (!values.commune) {
      nextErrors.commune = "Choisissez votre commune.";
    }
    return nextErrors;
  };

  const validateStepTwo = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (role === "provider" && !values.experienceBand) {
      nextErrors.experienceBand = "Choisissez votre niveau d’expérience.";
    }
    if (role === "client" && !values.timing) {
      nextErrors.timing = "Indiquez quand vous avez besoin du service.";
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Indiquez une adresse e-mail valide ou laissez vide.";
    }
    if (!values.operationalConsent) {
      nextErrors.operationalConsent =
        "Votre accord est nécessaire pour finaliser la préinscription.";
    }
    return nextErrors;
  };

  const goToStepTwo = () => {
    markStarted();
    const nextErrors = validateStepOne();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      reportValidationErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setStep(2);
    document
      .getElementById("campaign-form-heading")
      ?.focus({ preventScroll: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlight.current) return;
    markStarted();

    if (step === 1) {
      goToStepTwo();
      return;
    }

    const nextErrors = {
      ...validateStepOne(),
      ...validateStepTwo(),
    };
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      reportValidationErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setErrors({});

    const normalizedPhone = normalizeCampaignPhone(values.phone);
    if (!normalizedPhone) {
      submissionInFlight.current = false;
      setSubmitting(false);
      const phoneErrors = { phone: "Indiquez un numéro valide de RDC." };
      setErrors(phoneErrors);
      reportValidationErrors(phoneErrors);
      focusFirstError(phoneErrors);
      return;
    }

    const commune = values.commune;
    if (!commune) {
      submissionInFlight.current = false;
      setSubmitting(false);
      return;
    }

    const shared = {
      firstName: values.firstName.trim(),
      phone: normalizedPhone,
      email: values.email.trim().toLowerCase() || undefined,
      marketingConsent: values.marketingConsent,
      operationalConsent: true as const,
      privacyNoticeVersion,
      formStartedAt:
        startedAt.current == null
          ? undefined
          : new Date(startedAt.current).toISOString(),
      attribution:
        Object.keys(attribution).length > 0 ? attribution : undefined,
      website: values.website,
    };

    try {
      if (role === "provider") {
        await submitCampaignLead("provider", {
          ...shared,
          primarySubcategoryId: values.subcategoryId,
          homeCommune: commune,
          experienceBand: values.experienceBand as ProviderExperienceBand,
          hasWhatsApp: values.hasWhatsApp,
          summary: values.summary.trim() || undefined,
        });
      } else {
        await submitCampaignLead("client", {
          ...shared,
          commune,
          neededSubcategoryIds: [values.subcategoryId],
          timing: values.timing as ClientTiming,
          needSummary: values.summary.trim() || undefined,
          preferredContact: values.preferredContact,
        });
      }

      trackOnce(`${role}:submitted`, "launch_lead_submitted", {
        elapsedMilliseconds:
          startedAt.current == null ? undefined : Date.now() - startedAt.current,
      });
      setAccepted(true);
      window.requestAnimationFrame(() => {
        document.getElementById("campaign-confirmation")?.focus();
      });
    } catch (error) {
      submissionInFlight.current = false;
      if (
        error instanceof CampaignLeadSubmissionError &&
        error.kind === "stale_privacy"
      ) {
        setValues((current) => ({
          ...current,
          operationalConsent: false,
        }));
      }
      setErrors({
        form: campaignSubmissionErrorCopy(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (accepted) {
    return (
      <section
        id="interest-form"
        className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-soft sm:p-7"
      >
        <div
          id="campaign-confirmation"
          tabIndex={-1}
          className="outline-none"
        >
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 aria-hidden className="size-7" />
          </span>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.19em] text-emerald-700">
            Préinscription reçue
          </p>
          <h2 className="mb-4 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
            {role === "provider"
              ? "Vous êtes préinscrit parmi les premiers pros."
              : "Vous êtes préinscrit pour le lancement."}
          </h2>
          <div className="mb-4 grid gap-2.5 text-sm text-foreground/80">
            {(role === "provider"
              ? [
                  "Votre activité est enregistrée pour le lancement.",
                  "KAYOU peut vous recontacter avant l’ouverture.",
                  "Aucun compte n’a été créé.",
                  "Aucun travail ni revenu n’est garanti.",
                ]
              : [
                  "Votre besoin est enregistré pour le lancement.",
                  "KAYOU peut vous recontacter avant le lancement.",
                  "Aucun compte n’a été créé.",
                  "Aucun prestataire n’est promis immédiatement.",
                ]
            ).map((item) => (
              <span key={item} className="flex items-start gap-2">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                />
                {item}
              </span>
            ))}
          </div>
          <p className="mb-6 max-w-xl text-[13px] leading-5 text-muted-foreground">
            En cas de prestation : paiement en espèces, directement entre
            client et prestataire.
          </p>
          <button
            type="button"
            className="secondary-action min-h-12 whitespace-normal rounded-full text-center"
            onClick={onChooseOtherRole}
          >
            {role === "provider"
              ? "Je cherche aussi un service"
              : "Je propose aussi mes services"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="interest-form"
      className="scroll-mt-6 rounded-3xl bg-white p-4 shadow-soft sm:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.19em] text-primary">
            {roleLabel}
          </p>
          <h2
            id="campaign-form-heading"
            tabIndex={-1}
            className="text-xl font-extrabold leading-tight tracking-tight outline-none sm:text-2xl"
          >
            {step === 1
              ? role === "provider"
                ? "Présentez vos services"
                : "Préparez votre première recherche"
              : "Finalisez votre préinscription gratuite"}
          </h2>
        </div>
        <span className="shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground">
          Étape {step} sur 2
        </span>
      </div>

      <div
        aria-hidden
        className="mb-6 grid grid-cols-2 gap-2"
      >
        <span className="h-1.5 rounded-full bg-primary" />
        <span
          className={cn(
            "h-1.5 rounded-full",
            step === 2 ? "bg-primary" : "bg-border",
          )}
        />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} onFocusCapture={markStarted}>
        <FormError message={errors.form} className="mb-5" />

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                <div
                  className={cn("field", errors.firstName && "border-destructive")}
                >
                  <input
                    id="firstName"
                    value={values.firstName}
                    onChange={(event) =>
                      updateValue("firstName", event.target.value)
                    }
                    className="text-base"
                    autoComplete="given-name"
                    maxLength={80}
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={
                      errors.firstName ? "firstName-error" : undefined
                    }
                    placeholder="Votre prénom"
                  />
                </div>
                <FieldError id="firstName-error">
                  {errors.firstName}
                </FieldError>
              </div>

              <div>
                <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                <div className={cn("field", errors.phone && "border-destructive")}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={values.phone}
                    onChange={(event) => updateValue("phone", event.target.value)}
                    onBlur={() => {
                      const normalized = normalizeCampaignPhone(values.phone);
                      if (normalized) updateValue("phone", normalized);
                    }}
                    className="text-base"
                    autoComplete="tel"
                    maxLength={24}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : "phone-help"}
                    placeholder="+243 …"
                  />
                </div>
                <p id="phone-help" className="mt-1.5 text-xs text-muted-foreground">
                  Le numéro où KAYOU peut vous joindre.
                </p>
                <FieldError id="phone-error">{errors.phone}</FieldError>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="subcategoryId">
                {role === "provider"
                  ? "Votre service principal"
                  : "Le service recherché"}
              </FieldLabel>
              <SelectField
                id="subcategoryId"
                value={values.subcategoryId}
                onChange={(event) =>
                  updateValue("subcategoryId", event.target.value)
                }
                error={errors.subcategoryId}
                disabled={subcategoryCount === 0}
              >
                <option value="">
                  {subcategoryCount > 0
                    ? "Choisissez un service"
                    : "Services momentanément indisponibles"}
                </option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    {category.subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>
              <FieldError id="subcategoryId-error">
                {errors.subcategoryId}
              </FieldError>
              {subcategoryCount === 0 ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="secondary-action mt-2 rounded-full"
                >
                  <RefreshCw aria-hidden className="size-4" />
                  Recharger les services
                </button>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Toutes les catégories KAYOU actives sont proposées.
                </p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="commune">
                {role === "provider"
                  ? "Commune principale de service"
                  : "Commune du besoin"}
              </FieldLabel>
              <SelectField
                id="commune"
                value={values.commune}
                onChange={(event) =>
                  updateValue(
                    "commune",
                    event.target.value as CampaignFormValues["commune"],
                  )
                }
                error={errors.commune}
              >
                <option value="">Choisissez une commune</option>
                {KIN_COMMUNES.map((commune) => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </SelectField>
              <FieldError id="commune-error">{errors.commune}</FieldError>
            </div>

            <button
              type="button"
              onClick={goToStepTwo}
              disabled={subcategoryCount === 0}
              className="primary-action mt-1 sm:w-auto sm:justify-self-end sm:px-8"
            >
              Continuer
              <ArrowRight aria-hidden className="size-[18px]" />
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {role === "provider" ? (
              <fieldset
                aria-invalid={Boolean(errors.experienceBand)}
                aria-describedby={
                  errors.experienceBand ? "experienceBand-error" : undefined
                }
              >
                <legend className="mb-2 text-xs font-bold text-foreground">
                  Votre expérience
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["STARTING", "Je débute"],
                    ["ONE_TO_THREE_YEARS", "1 à 3 ans"],
                    ["FOUR_PLUS_YEARS", "4 ans ou plus"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-sm font-semibold",
                        values.experienceBand === value
                          ? "border-primary bg-secondary text-primary"
                          : "border-border bg-white text-foreground",
                      )}
                    >
                      <input
                        id={
                          value === "STARTING" ? "experienceBand" : undefined
                        }
                        type="radio"
                        name="experienceBand"
                        value={value}
                        checked={values.experienceBand === value}
                        onChange={() =>
                          updateValue(
                            "experienceBand",
                            value as ProviderExperienceBand,
                          )
                        }
                        className="size-4 shrink-0 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldError id="experienceBand-error">
                  {errors.experienceBand}
                </FieldError>
              </fieldset>
            ) : (
              <fieldset
                aria-invalid={Boolean(errors.timing)}
                aria-describedby={errors.timing ? "timing-error" : undefined}
              >
                <legend className="mb-2 text-xs font-bold text-foreground">
                  Quand avez-vous besoin du service ?
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["WITHIN_7_DAYS", "Dans les 7 jours"],
                    ["WITHIN_30_DAYS", "Dans les 30 jours"],
                    ["LATER", "Plus tard"],
                    ["EXPLORING", "Je me renseigne"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-sm font-semibold",
                        values.timing === value
                          ? "border-primary bg-secondary text-primary"
                          : "border-border bg-white text-foreground",
                      )}
                    >
                      <input
                        id={value === "WITHIN_7_DAYS" ? "timing" : undefined}
                        type="radio"
                        name="timing"
                        value={value}
                        checked={values.timing === value}
                        onChange={() =>
                          updateValue("timing", value as ClientTiming)
                        }
                        className="size-4 shrink-0 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldError id="timing-error">{errors.timing}</FieldError>
              </fieldset>
            )}

            <details className="group rounded-2xl border border-border bg-background">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
                Ajouter des informations facultatives
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="grid gap-4 border-t border-border p-4">
                <div>
                  <FieldLabel htmlFor="email">E-mail (facultatif)</FieldLabel>
                  <div className={cn("field", errors.email && "border-destructive")}>
                    <input
                      id="email"
                      type="email"
                      value={values.email}
                      onChange={(event) =>
                        updateValue("email", event.target.value)
                      }
                      className="text-base"
                      autoComplete="email"
                      maxLength={254}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      placeholder="vous@exemple.cd"
                    />
                  </div>
                  <FieldError id="email-error">{errors.email}</FieldError>
                </div>

                {role === "provider" ? (
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-foreground/80">
                    <input
                      type="checkbox"
                      checked={values.hasWhatsApp}
                      onChange={(event) =>
                        updateValue("hasWhatsApp", event.target.checked)
                      }
                      className="mt-0.5 size-5 shrink-0 accent-primary"
                    />
                    Ce numéro utilise WhatsApp
                  </label>
                ) : (
                  <fieldset>
                    <legend className="mb-2 text-xs font-bold text-foreground">
                      Contact préféré
                    </legend>
                    <div className="flex flex-wrap gap-4">
                      {[
                        ["PHONE", "Téléphone"],
                        ["WHATSAPP", "WhatsApp"],
                      ].map(([value, label]) => (
                        <label
                          key={value}
                          className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground/80"
                        >
                          <input
                            type="radio"
                            name="preferredContact"
                            value={value}
                            checked={values.preferredContact === value}
                            onChange={() =>
                              updateValue(
                                "preferredContact",
                                value as "PHONE" | "WHATSAPP",
                              )
                            }
                            className="size-4 shrink-0 accent-primary"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <FieldLabel htmlFor="summary">
                      {role === "provider"
                        ? "Un mot sur votre service (facultatif)"
                        : "Précision sur le besoin (facultatif)"}
                    </FieldLabel>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {values.summary.length}/300
                    </span>
                  </div>
                  <div className="field h-auto py-3">
                    <textarea
                      id="summary"
                      value={values.summary}
                      onChange={(event) =>
                        updateValue("summary", event.target.value)
                      }
                      maxLength={300}
                      rows={3}
                      className="min-h-20 resize-y text-base"
                      placeholder={
                        role === "provider"
                          ? "Ex. types de travaux réalisés"
                          : "Sans adresse exacte ni information sensible"
                      }
                    />
                  </div>
                </div>

                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[13px] leading-5 text-foreground/80">
                  <input
                    type="checkbox"
                    checked={values.marketingConsent}
                    onChange={(event) =>
                      updateValue("marketingConsent", event.target.checked)
                    }
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                  />
                  J’accepte aussi de recevoir les nouvelles du lancement KAYOU.
                  Cet accord est facultatif et n’est pas précoché.
                </label>
              </div>
            </details>

            <div>
              <p className="mb-2 text-[13px] leading-5 text-muted-foreground">
                Avant de donner votre accord, consultez la{" "}
                <a
                  href="/launch/confidentialite"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  notice de confidentialité
                </a>{" "}
                (version {privacyNoticeVersion}).
              </p>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-3.5 text-[13px] leading-5 text-foreground/80",
                  errors.operationalConsent
                    ? "border-destructive"
                    : "border-border",
                )}
              >
                <input
                  id="operationalConsent"
                  type="checkbox"
                  checked={values.operationalConsent}
                  onChange={(event) =>
                    updateValue("operationalConsent", event.target.checked)
                  }
                  aria-invalid={Boolean(errors.operationalConsent)}
                  aria-describedby={
                    errors.operationalConsent
                      ? "operationalConsent-error"
                      : undefined
                  }
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <span>
                  J’ai lu cette notice et j’autorise KAYOU à utiliser ces
                  informations pour étudier ma demande et me recontacter pour
                  le lancement. Aucun compte n’est créé.
                </span>
              </label>
              <FieldError id="operationalConsent-error">
                {errors.operationalConsent}
              </FieldError>
            </div>

            <input
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              name="website"
              value={values.website}
              onChange={(event) => updateValue("website", event.target.value)}
              className="absolute left-[-9999px] h-px w-px opacity-0"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Pour consulter, corriger ou retirer votre demande, écrivez à{" "}
              <a
                href={`mailto:${privacyContact}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {privacyContact}
              </a>
              .
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
                className="secondary-action min-h-12 rounded-full"
              >
                <ArrowLeft aria-hidden className="size-[18px]" />
                Retour
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="primary-action primary-action--gold whitespace-normal text-center sm:w-auto sm:px-8"
              >
                {submitting ? (
                  <>
                    <Spinner className="k-campaign-spinner animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Check aria-hidden className="size-[18px]" />
                    {primaryAction}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
