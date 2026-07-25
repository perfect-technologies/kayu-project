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
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import type { CampaignCategory } from "./campaign-data";
import {
  emitCampaignEvent,
  mergeCampaignAttribution,
  parseCampaignAttribution,
  submitCampaignLead,
  type CampaignLeadType,
  type ClientTiming,
  type LeadAttribution,
  type ProviderExperienceBand,
} from "@/lib/campaign-leads";

type CampaignFormProps = {
  role: CampaignLeadType;
  categories: CampaignCategory[];
  privacyNoticeVersion: string;
  privacyContact: string;
  onChooseOtherRole: () => void;
};

type FormValues = {
  firstName: string;
  phone: string;
  commune: string;
  subcategoryId: string;
  experienceBand: "" | ProviderExperienceBand;
  timing: "" | ClientTiming;
  email: string;
  hasWhatsApp: boolean;
  preferredContact: "PHONE" | "WHATSAPP";
  summary: string;
  operationalConsent: boolean;
  marketingConsent: boolean;
  website: string;
};

type FormErrors = Partial<Record<keyof FormValues | "form", string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  phone: "",
  commune: "",
  subcategoryId: "",
  experienceBand: "",
  timing: "",
  email: "",
  hasWhatsApp: false,
  preferredContact: "PHONE",
  summary: "",
  operationalConsent: false,
  marketingConsent: false,
  website: "",
};

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
    <p id={id} className="mt-1.5 text-[13px] text-[var(--k-danger)]">
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
      className="mb-1.5 block text-[14px] font-semibold text-[var(--k-text-primary)]"
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
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full appearance-none rounded-[12px] border border-[var(--k-border)] bg-[var(--k-surface)] px-3.5 pr-10 text-[15px] text-[var(--k-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--k-primary)] focus:ring-3 focus:ring-[rgba(14,165,233,0.15)] disabled:cursor-not-allowed disabled:bg-[var(--k-surface-muted)] disabled:text-[var(--k-text-muted)] aria-invalid:border-[var(--k-danger)]"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-[var(--k-text-muted)]"
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
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [attribution, setAttribution] = useState<LeadAttribution>({});
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const startedAt = useRef<number | null>(null);
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
    setErrors({});
    setAccepted(false);
    setSubmitting(false);
    startedAt.current = null;
  }, [role]);

  const trackOnce = useCallback(
    (
      key: string,
      event: Parameters<typeof emitCampaignEvent>[0],
      input: Parameters<typeof emitCampaignEvent>[1] = {},
    ) => {
      if (trackedEvents.current.has(key)) return;
      trackedEvents.current.add(key);
      emitCampaignEvent(event, {
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

  const updateValue = <Key extends keyof FormValues>(
    key: Key,
    value: FormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    }
  };

  const reportValidationErrors = useCallback(
    (nextErrors: FormErrors) => {
      for (const field of Object.keys(nextErrors)) {
        emitCampaignEvent("launch_form_validation_failed", {
          leadType: role,
          attribution,
          field,
          errorCode: "invalid_or_missing",
        });
      }
    },
    [attribution, role],
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
    const digits = values.phone.replace(/[^\d]/g, "");

    if (trimmedName.length < 2) {
      nextErrors.firstName = "Indiquez votre prénom (2 caractères minimum).";
    }
    if (digits.length < 9 || digits.length > 15) {
      nextErrors.phone = "Indiquez un numéro de téléphone valide.";
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

    setSubmitting(true);
    setErrors({});

    const shared = {
      firstName: values.firstName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase() || undefined,
      marketingConsent: values.marketingConsent,
      operationalConsent: true as const,
      privacyNoticeVersion,
      attribution:
        Object.keys(attribution).length > 0 ? attribution : undefined,
      website: values.website,
    };

    try {
      if (role === "provider") {
        await submitCampaignLead("provider", {
          ...shared,
          primarySubcategoryId: values.subcategoryId,
          homeCommune: values.commune,
          experienceBand: values.experienceBand as ProviderExperienceBand,
          hasWhatsApp: values.hasWhatsApp,
          summary: values.summary.trim() || undefined,
        });
      } else {
        await submitCampaignLead("client", {
          ...shared,
          commune: values.commune,
          neededSubcategoryIds: [values.subcategoryId],
          timing: values.timing as ClientTiming,
          needSummary: values.summary.trim() || undefined,
          preferredContact: values.preferredContact,
        });
      }

      emitCampaignEvent("launch_lead_submitted", {
        leadType: role,
        attribution,
        elapsedMilliseconds:
          startedAt.current == null ? undefined : Date.now() - startedAt.current,
      });
      setAccepted(true);
      window.requestAnimationFrame(() => {
        document.getElementById("campaign-confirmation")?.focus();
      });
    } catch {
      setErrors({
        form:
          "Préinscription non envoyée. Vérifiez votre connexion puis réessayez.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (accepted) {
    return (
      <section
        id="interest-form"
        className="scroll-mt-6 rounded-[20px] border border-[var(--k-border)] bg-[var(--k-surface)] p-5 shadow-[var(--k-e2)] sm:p-7"
      >
        <div
          id="campaign-confirmation"
          tabIndex={-1}
          className="outline-none"
        >
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--k-success-subtle)] text-[var(--k-success)]">
            <CheckCircle2 aria-hidden className="h-6 w-6" />
          </span>
          <p className="k-overline mb-2 text-[var(--k-success)]">
            Préinscription reçue
          </p>
          <h2 className="k-display-m mb-3">
            {role === "provider"
              ? "Vous êtes préinscrit parmi les premiers pros."
              : "Vous êtes préinscrit pour le lancement."}
          </h2>
          <div className="mb-4 grid gap-2 text-[14px] text-[var(--k-text-body)]">
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
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--k-success)]"
                />
                {item}
              </span>
            ))}
          </div>
          <p className="mb-6 max-w-xl text-[13px] leading-5 text-[var(--k-text-muted)]">
            En cas de prestation : paiement en espèces, directement entre
            client et prestataire.
          </p>
          <button
            type="button"
            className="k-btn k-btn-secondary min-h-12 whitespace-normal"
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
      className="scroll-mt-6 rounded-[20px] border border-[var(--k-border)] bg-[var(--k-surface)] p-4 shadow-[var(--k-e2)] sm:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="k-overline mb-2 text-[var(--k-primary-hover)]">
            {roleLabel}
          </p>
          <h2
            id="campaign-form-heading"
            tabIndex={-1}
            className="k-display-m outline-none"
          >
            {step === 1
              ? role === "provider"
                ? "Présentez vos services"
                : "Préparez votre première recherche"
              : "Finalisez votre préinscription gratuite"}
          </h2>
        </div>
        <span className="k-caption shrink-0 pt-1">
          Étape {step} sur 2
        </span>
      </div>

      <div
        aria-hidden
        className="mb-6 grid grid-cols-2 gap-2"
      >
        <span className="h-1 rounded-full bg-[var(--k-primary)]" />
        <span
          className={`h-1 rounded-full ${
            step === 2
              ? "bg-[var(--k-primary)]"
              : "bg-[var(--k-border)]"
          }`}
        />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} onFocusCapture={markStarted}>
        {errors.form && (
          <div
            role="alert"
            className="mb-5 rounded-[12px] border border-[var(--k-danger)] bg-[var(--k-danger-subtle)] p-3.5 text-[14px] text-[var(--k-danger)]"
          >
            {errors.form}
          </div>
        )}

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                <input
                  id="firstName"
                  value={values.firstName}
                  onChange={(event) =>
                    updateValue("firstName", event.target.value)
                  }
                  className="k-input h-12 text-[16px]"
                  autoComplete="given-name"
                  maxLength={80}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                  placeholder="Votre prénom"
                />
                <FieldError id="firstName-error">
                  {errors.firstName}
                </FieldError>
              </div>

              <div>
                <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(event) => updateValue("phone", event.target.value)}
                  className="k-input h-12 text-[16px]"
                  autoComplete="tel"
                  maxLength={24}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : "phone-help"}
                  placeholder="+243 …"
                />
                <p id="phone-help" className="mt-1.5 text-[12px] text-[var(--k-text-muted)]">
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
                  className="mt-2 inline-flex min-h-11 items-center gap-2 text-left text-[13px] font-semibold text-[var(--k-primary-hover)]"
                >
                  <RefreshCw aria-hidden className="h-4 w-4" />
                  Recharger les services
                </button>
              ) : (
                <p className="mt-1.5 text-[12px] text-[var(--k-text-muted)]">
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
                  updateValue("commune", event.target.value)
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
              className="k-btn k-btn-primary mt-1 min-h-12 w-full text-[15px] sm:w-auto sm:justify-self-end"
            >
              Continuer
              <ArrowRight aria-hidden className="h-4 w-4" />
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
                <legend className="mb-2 text-[14px] font-semibold text-[var(--k-text-primary)]">
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
                      className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2.5 text-[14px] font-medium ${
                        values.experienceBand === value
                          ? "border-[var(--k-primary)] bg-[var(--k-primary-subtle)] text-[var(--k-primary-hover)]"
                          : "border-[var(--k-border)] text-[var(--k-text-body)]"
                      }`}
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
                        className="h-4 w-4 accent-[var(--k-primary)]"
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
                <legend className="mb-2 text-[14px] font-semibold text-[var(--k-text-primary)]">
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
                      className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2.5 text-[14px] font-medium ${
                        values.timing === value
                          ? "border-[var(--k-primary)] bg-[var(--k-primary-subtle)] text-[var(--k-primary-hover)]"
                          : "border-[var(--k-border)] text-[var(--k-text-body)]"
                      }`}
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
                        className="h-4 w-4 accent-[var(--k-primary)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldError id="timing-error">{errors.timing}</FieldError>
              </fieldset>
            )}

            <details className="group rounded-[12px] border border-[var(--k-border)] bg-[var(--k-bg)]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-[var(--k-text-primary)] [&::-webkit-details-marker]:hidden">
                Ajouter des informations facultatives
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="grid gap-4 border-t border-[var(--k-border)] p-4">
                <div>
                  <FieldLabel htmlFor="email">E-mail (facultatif)</FieldLabel>
                  <input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(event) =>
                      updateValue("email", event.target.value)
                    }
                    className="k-input h-12 text-[16px]"
                    autoComplete="email"
                    maxLength={254}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="vous@exemple.cd"
                  />
                  <FieldError id="email-error">{errors.email}</FieldError>
                </div>

                {role === "provider" ? (
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[14px] text-[var(--k-text-body)]">
                    <input
                      type="checkbox"
                      checked={values.hasWhatsApp}
                      onChange={(event) =>
                        updateValue("hasWhatsApp", event.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--k-primary)]"
                    />
                    Ce numéro utilise WhatsApp
                  </label>
                ) : (
                  <fieldset>
                    <legend className="mb-2 text-[14px] font-semibold text-[var(--k-text-primary)]">
                      Contact préféré
                    </legend>
                    <div className="flex flex-wrap gap-4">
                      {[
                        ["PHONE", "Téléphone"],
                        ["WHATSAPP", "WhatsApp"],
                      ].map(([value, label]) => (
                        <label
                          key={value}
                          className="flex min-h-11 cursor-pointer items-center gap-2 text-[14px] text-[var(--k-text-body)]"
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
                            className="h-4 w-4 accent-[var(--k-primary)]"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <FieldLabel htmlFor="summary">
                      {role === "provider"
                        ? "Un mot sur votre service (facultatif)"
                        : "Précision sur le besoin (facultatif)"}
                    </FieldLabel>
                    <span className="k-caption">{values.summary.length}/300</span>
                  </div>
                  <textarea
                    id="summary"
                    value={values.summary}
                    onChange={(event) =>
                      updateValue("summary", event.target.value)
                    }
                    maxLength={300}
                    rows={3}
                    className="min-h-24 w-full resize-y rounded-[12px] border border-[var(--k-border)] bg-[var(--k-surface)] px-3.5 py-3 text-[16px] text-[var(--k-text-primary)] outline-none focus:border-[var(--k-primary)] focus:ring-3 focus:ring-[rgba(14,165,233,0.15)]"
                    placeholder={
                      role === "provider"
                        ? "Ex. types de travaux réalisés"
                        : "Sans adresse exacte ni information sensible"
                    }
                  />
                </div>

                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[13px] text-[var(--k-text-body)]">
                  <input
                    type="checkbox"
                    checked={values.marketingConsent}
                    onChange={(event) =>
                      updateValue("marketingConsent", event.target.checked)
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--k-primary)]"
                  />
                  J’accepte aussi de recevoir les nouvelles du lancement KAYOU.
                  Cet accord est facultatif et n’est pas précoché.
                </label>
              </div>
            </details>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-[var(--k-border)] p-3.5 text-[13px] leading-5 text-[var(--k-text-body)]">
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
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--k-primary)]"
                />
                <span>
                  J’autorise KAYOU à utiliser ces informations pour étudier ma
                  demande et me recontacter pour le lancement. Cela ne crée pas
                  de compte et ne garantit pas un accès anticipé.
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

            <p className="text-[12px] leading-5 text-[var(--k-text-muted)]">
              Notice de confidentialité : version {privacyNoticeVersion}. Pour
              consulter, corriger ou retirer votre demande, écrivez à{" "}
              <a
                href={`mailto:${privacyContact}`}
                className="font-semibold text-[var(--k-primary-hover)] underline underline-offset-2"
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
                className="k-btn k-btn-ghost min-h-12"
              >
                <ArrowLeft aria-hidden className="h-4 w-4" />
                Retour
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="k-btn k-btn-primary min-h-12 w-full text-[15px] sm:w-auto"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      aria-hidden
                      className="h-4 w-4 animate-spin"
                    />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Check aria-hidden className="h-4 w-4" />
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
