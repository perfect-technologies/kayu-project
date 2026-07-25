import { normalizePlausibleDRCMobilePhone } from "@kayu/utils";

export type CampaignLeadType = "provider" | "client";

export type LeadAttributionSource =
  | "direct"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "referral"
  | "partner"
  | "community"
  | "google"
  | "tiktok"
  | "other";

export type LeadAttributionMedium =
  | "direct"
  | "organic_social"
  | "paid_social"
  | "referral"
  | "partner"
  | "community"
  | "qr";

export type LeadAttribution = {
  source?: LeadAttributionSource;
  medium?: LeadAttributionMedium;
  campaign?: string;
  content?: string;
  referrerHost?: string;
};

type RawLeadAttribution = Partial<
  Record<keyof LeadAttribution, string | undefined>
>;

export type ProviderExperienceBand =
  | "STARTING"
  | "ONE_TO_THREE_YEARS"
  | "FOUR_PLUS_YEARS";

export type ClientTiming =
  | "WITHIN_7_DAYS"
  | "WITHIN_30_DAYS"
  | "LATER"
  | "EXPLORING";

export type CreateProviderLeadRequest = {
  firstName: string;
  phone: string;
  email?: string;
  primarySubcategoryId: string;
  experienceBand: ProviderExperienceBand;
  homeCommune: string;
  hasWhatsApp?: boolean;
  summary?: string;
  operationalConsent: true;
  marketingConsent?: boolean;
  privacyNoticeVersion: string;
  formStartedAt?: string;
  attribution?: LeadAttribution;
  website?: string;
};

export type CreateClientLeadRequest = {
  firstName: string;
  phone: string;
  email?: string;
  commune: string;
  neededSubcategoryIds: string[];
  timing: ClientTiming;
  needSummary?: string;
  preferredContact?: "PHONE" | "WHATSAPP";
  operationalConsent: true;
  marketingConsent?: boolean;
  privacyNoticeVersion: string;
  formStartedAt?: string;
  attribution?: LeadAttribution;
  website?: string;
};

export type LeadAcceptedResponse = {
  accepted: true;
  message: string;
};

export type CampaignSubmissionErrorKind =
  | "validation"
  | "stale_privacy"
  | "rate_limited"
  | "intake_disabled"
  | "network"
  | "server"
  | "invalid_response";

export class CampaignLeadSubmissionError extends Error {
  readonly kind: CampaignSubmissionErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    kind: CampaignSubmissionErrorKind,
    status?: number,
    code?: string,
    retryAfterSeconds?: number,
  ) {
    super(`CAMPAIGN_LEAD_${kind.toUpperCase()}`);
    this.name = "CampaignLeadSubmissionError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function campaignSubmissionErrorCopy(error: unknown): string {
  if (!(error instanceof CampaignLeadSubmissionError)) {
    return "Une erreur inattendue empêche l’envoi. Réessayez dans un instant.";
  }

  switch (error.kind) {
    case "validation":
      return "Certaines informations ne sont plus valides. Vérifiez le formulaire puis réessayez.";
    case "stale_privacy":
      return "La notice de confidentialité a changé. Rechargez la page, relisez-la puis donnez à nouveau votre accord.";
    case "rate_limited": {
      const minutes = error.retryAfterSeconds
        ? Math.max(1, Math.ceil(error.retryAfterSeconds / 60))
        : null;
      return minutes
        ? `Trop de tentatives. Réessayez dans ${minutes} min.`
        : "Trop de tentatives. Réessayez un peu plus tard.";
    }
    case "intake_disabled":
      return "Les préinscriptions sont momentanément fermées. Revenez un peu plus tard.";
    case "network":
      return "Connexion interrompue. Vérifiez votre réseau puis réessayez.";
    case "server":
    case "invalid_response":
      return "Le service ne répond pas correctement. Réessayez dans un instant.";
  }
}

export type CampaignEventName =
  | "launch_landing_viewed"
  | "launch_role_selected"
  | "launch_form_started"
  | "launch_form_validation_failed"
  | "launch_lead_submitted";

export type CampaignEvent = {
  event: CampaignEventName;
  leadType?: CampaignLeadType;
  field?: string;
  errorCode?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  deviceClass: "mobile" | "tablet" | "desktop";
  completionTimeBucket?: "<=30s" | "31-60s" | "61-90s" | ">90s";
};

export type LaunchFunnelEventRequest = {
  schemaVersion: 1;
  eventName: CampaignEventName;
  occurredAt: string;
  route: "/" | "/launch/providers" | "/launch/clients";
  deviceClass: "mobile" | "tablet" | "desktop" | "unknown";
  leadType?: "PROVIDER" | "CLIENT";
  validationField?:
    | "form"
    | "firstName"
    | "phone"
    | "email"
    | "primarySubcategoryId"
    | "additionalSubcategoryIds"
    | "experienceBand"
    | "homeCommune"
    | "serviceCommunes"
    | "hasWhatsApp"
    | "summary"
    | "commune"
    | "neededSubcategoryIds"
    | "timing"
    | "needSummary"
    | "preferredContact"
    | "operationalConsent"
    | "marketingConsent"
    | "privacyNoticeVersion"
    | "attribution";
  validationErrorCode?:
    | "required"
    | "invalid_format"
    | "too_short"
    | "too_long"
    | "invalid_option"
    | "duplicate_option"
    | "consent_required"
    | "rate_limited"
    | "network"
    | "server"
    | "unknown";
  attribution?: LeadAttribution;
};

const ATTRIBUTION_LIMITS = {
  campaign: 100,
  content: 100,
} as const;

const SOURCE_ALIASES: Record<string, LeadAttributionSource> = {
  direct: "direct",
  facebook: "facebook",
  fb: "facebook",
  meta: "facebook",
  instagram: "instagram",
  ig: "instagram",
  whatsapp: "whatsapp",
  "wa.me": "whatsapp",
  referral: "referral",
  referal: "referral",
  partner: "partner",
  affiliate: "partner",
  community: "community",
  communautaire: "community",
  google: "google",
  tiktok: "tiktok",
  other: "other",
};

const MEDIUM_ALIASES: Record<string, LeadAttributionMedium> = {
  direct: "direct",
  none: "direct",
  organic: "organic_social",
  social: "organic_social",
  organic_social: "organic_social",
  paid: "paid_social",
  cpc: "paid_social",
  ppc: "paid_social",
  paid_social: "paid_social",
  referral: "referral",
  referal: "referral",
  whatsapp: "referral",
  partner: "partner",
  affiliate: "partner",
  community: "community",
  communautaire: "community",
  qr: "qr",
  qrcode: "qr",
};

function attributionAliasKey(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
}

function normalizeAttributionKey(
  value: string | null | undefined,
  maxLength: number,
): string | undefined {
  if (!value) return undefined;

  const safeValue = value.normalize("NFKC").trim();
  if (/@/.test(safeValue) || /(?:\D*\d){8}/.test(safeValue)) {
    return undefined;
  }

  const normalized = safeValue
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, maxLength)
    .replace(/[^a-z0-9]+$/g, "");

  if (!normalized) return undefined;
  return normalized;
}

function normalizeReferrerHost(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().slice(0, 253);
  if (
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      normalized,
    )
  ) {
    return normalized;
  }
  return undefined;
}

export function normalizeLeadAttribution(
  input: RawLeadAttribution,
): LeadAttribution {
  const sourceKey = input.source ? attributionAliasKey(input.source) : "";
  const mediumKey = input.medium ? attributionAliasKey(input.medium) : "";
  const source = sourceKey
    ? (SOURCE_ALIASES[sourceKey] ?? "other")
    : undefined;
  const medium = mediumKey ? MEDIUM_ALIASES[mediumKey] : undefined;

  return Object.fromEntries(
    Object.entries({
      source,
      medium,
      campaign: normalizeAttributionKey(
        input.campaign,
        ATTRIBUTION_LIMITS.campaign,
      ),
      content: normalizeAttributionKey(
        input.content,
        ATTRIBUTION_LIMITS.content,
      ),
      referrerHost: normalizeReferrerHost(input.referrerHost),
    }).filter(([, value]) => Boolean(value)),
  ) as LeadAttribution;
}

export function normalizeCampaignPhone(input: string): string | null {
  try {
    return normalizePlausibleDRCMobilePhone(input);
  } catch {
    return null;
  }
}

export function parseCampaignAttribution(
  search: string | URLSearchParams,
  referrer?: string,
): LeadAttribution {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

  const attribution: RawLeadAttribution = {
    source: params.get("utm_source") ?? params.get("source") ?? undefined,
    medium: params.get("utm_medium") ?? params.get("medium") ?? undefined,
    campaign:
      params.get("utm_campaign") ?? params.get("campaign") ?? undefined,
    content: params.get("utm_content") ?? params.get("content") ?? undefined,
  };

  if (referrer) {
    try {
      const hostname = new URL(referrer).hostname;
      if (hostname) attribution.referrerHost = hostname;
    } catch {
      // An invalid referrer is ignored rather than copied into lead or analytics data.
    }
  }

  return normalizeLeadAttribution(attribution);
}

export function mergeCampaignAttribution(
  previous: LeadAttribution,
  current: LeadAttribution,
): LeadAttribution {
  const normalizedCurrent = normalizeLeadAttribution(current);

  // Last-touch model: an explicit source starts a complete new touch. Never
  // combine its source with medium/campaign/content from an older visit.
  if (normalizedCurrent.source) {
    return normalizedCurrent;
  }

  // Dependent UTM fields without a source cannot establish a trustworthy
  // touch, so keep the last complete touch rather than fabricate a hybrid.
  return normalizeLeadAttribution(previous);
}

export function completionTimeBucket(
  elapsedMilliseconds: number,
): CampaignEvent["completionTimeBucket"] {
  const seconds = Math.max(0, elapsedMilliseconds) / 1_000;
  if (seconds <= 30) return "<=30s";
  if (seconds <= 60) return "31-60s";
  if (seconds <= 90) return "61-90s";
  return ">90s";
}

export function deviceClassForWidth(
  width: number,
): CampaignEvent["deviceClass"] {
  if (width < 768) return "mobile";
  if (width < 1_024) return "tablet";
  return "desktop";
}

export function buildCampaignEvent(
  event: CampaignEventName,
  input: {
    leadType?: CampaignLeadType;
    field?: string;
    errorCode?: string;
    attribution?: LeadAttribution;
    deviceWidth?: number;
    elapsedMilliseconds?: number;
  } = {},
): CampaignEvent {
  const { attribution = {} } = input;
  const payload: CampaignEvent = {
    event,
    deviceClass: deviceClassForWidth(input.deviceWidth ?? 390),
  };

  if (input.leadType) payload.leadType = input.leadType;
  if (input.field) payload.field = input.field;
  if (input.errorCode) payload.errorCode = input.errorCode;
  if (attribution.source) payload.source = attribution.source;
  if (attribution.medium) payload.medium = attribution.medium;
  if (attribution.campaign) payload.campaign = attribution.campaign;
  if (attribution.content) payload.content = attribution.content;
  if (input.elapsedMilliseconds != null) {
    payload.completionTimeBucket = completionTimeBucket(
      input.elapsedMilliseconds,
    );
  }

  return payload;
}

const FUNNEL_VALIDATION_FIELDS = new Set<
  NonNullable<LaunchFunnelEventRequest["validationField"]>
>([
  "form",
  "firstName",
  "phone",
  "email",
  "primarySubcategoryId",
  "additionalSubcategoryIds",
  "experienceBand",
  "homeCommune",
  "serviceCommunes",
  "hasWhatsApp",
  "summary",
  "commune",
  "neededSubcategoryIds",
  "timing",
  "needSummary",
  "preferredContact",
  "operationalConsent",
  "marketingConsent",
  "privacyNoticeVersion",
  "attribution",
]);

const FUNNEL_VALIDATION_ERROR_CODES = new Set<
  NonNullable<LaunchFunnelEventRequest["validationErrorCode"]>
>([
  "required",
  "invalid_format",
  "too_short",
  "too_long",
  "invalid_option",
  "duplicate_option",
  "consent_required",
  "rate_limited",
  "network",
  "server",
  "unknown",
]);

function funnelRoute(
  pathname: string,
): LaunchFunnelEventRequest["route"] {
  if (pathname === "/launch/providers" || pathname === "/launch/clients") {
    return pathname;
  }
  return "/";
}

function funnelValidationField(
  field: string | undefined,
  leadType: CampaignLeadType | undefined,
): LaunchFunnelEventRequest["validationField"] | undefined {
  if (!field) return undefined;
  if (field === "subcategoryId") {
    return leadType === "provider"
      ? "primarySubcategoryId"
      : "neededSubcategoryIds";
  }
  if (field === "commune" && leadType === "provider") {
    return "homeCommune";
  }
  if (field === "summary") {
    return leadType === "provider" ? "summary" : "needSummary";
  }
  return FUNNEL_VALIDATION_FIELDS.has(
    field as NonNullable<LaunchFunnelEventRequest["validationField"]>,
  )
    ? (field as NonNullable<LaunchFunnelEventRequest["validationField"]>)
    : "form";
}

export function buildLaunchFunnelEventRequest(
  event: CampaignEventName,
  input: Parameters<typeof buildCampaignEvent>[1] = {},
  context: {
    deviceWidth?: number;
    pathname?: string;
    occurredAt?: string;
  } = {},
): LaunchFunnelEventRequest {
  const request: LaunchFunnelEventRequest = {
    schemaVersion: 1,
    eventName: event,
    occurredAt: context.occurredAt ?? new Date().toISOString(),
    route: funnelRoute(context.pathname ?? "/"),
    deviceClass: deviceClassForWidth(context.deviceWidth ?? 390),
  };

  if (input.leadType) {
    request.leadType = input.leadType === "provider" ? "PROVIDER" : "CLIENT";
  }

  if (event === "launch_form_validation_failed") {
    request.validationField = funnelValidationField(
      input.field,
      input.leadType,
    );
    request.validationErrorCode = FUNNEL_VALIDATION_ERROR_CODES.has(
      input.errorCode as NonNullable<
        LaunchFunnelEventRequest["validationErrorCode"]
      >,
    )
      ? (input.errorCode as NonNullable<
          LaunchFunnelEventRequest["validationErrorCode"]
        >)
      : "unknown";
  }

  const attribution = normalizeLeadAttribution(input.attribution ?? {});
  // Referrer host is accepted by the server contract, but browser funnel
  // events intentionally retain only campaign dimensions for minimization.
  delete attribution.referrerHost;
  if (Object.keys(attribution).length > 0) {
    request.attribution = attribution;
  }

  return request;
}

export async function persistCampaignEvent(
  event: CampaignEventName,
  input: Parameters<typeof buildCampaignEvent>[1] = {},
  context: {
    deviceWidth?: number;
    pathname?: string;
    occurredAt?: string;
  } = {},
): Promise<boolean> {
  const request = buildLaunchFunnelEventRequest(event, input, context);

  try {
    const response = await fetch("/api/launch/funnel-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
      credentials: "omit",
      keepalive: true,
    });
    if (!response.ok) return false;
    const receipt = (await response.json()) as { accepted?: unknown };
    return receipt.accepted === true;
  } catch {
    return false;
  }
}

export function emitCampaignEvent(
  event: CampaignEventName,
  input: Parameters<typeof buildCampaignEvent>[1] = {},
): void {
  if (typeof window === "undefined") return;

  const payload = buildCampaignEvent(event, {
    ...input,
    deviceWidth: window.innerWidth,
  });

  // Durable, first-party receipt is best-effort and never blocks conversion.
  void persistCampaignEvent(event, input, {
    deviceWidth: window.innerWidth,
    pathname: window.location?.pathname,
  });

  try {
    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
    };
    // Optional diagnostics bridge; the owned server collector above is the
    // authoritative campaign measurement path.
    (analyticsWindow.dataLayer ??= []).push(payload);
  } catch {
    // Analytics is deliberately best-effort and cannot block lead submission.
  }

  try {
    window.dispatchEvent(
      new CustomEvent("kayou:campaign-event", { detail: payload }),
    );
  } catch {
    // The DOM bridge is optional and isolated from the durable app queue above.
  }
}

export function emitCampaignEventOnce(
  deliveredKeys: Set<string>,
  key: string,
  event: CampaignEventName,
  input: Parameters<typeof buildCampaignEvent>[1] = {},
): boolean {
  if (deliveredKeys.has(key)) return false;
  deliveredKeys.add(key);
  emitCampaignEvent(event, input);
  return true;
}

export async function submitCampaignLead(
  leadType: "provider",
  payload: CreateProviderLeadRequest,
  signal?: AbortSignal,
): Promise<LeadAcceptedResponse>;
export async function submitCampaignLead(
  leadType: "client",
  payload: CreateClientLeadRequest,
  signal?: AbortSignal,
): Promise<LeadAcceptedResponse>;
export async function submitCampaignLead(
  leadType: CampaignLeadType,
  payload: CreateProviderLeadRequest | CreateClientLeadRequest,
  signal?: AbortSignal,
): Promise<LeadAcceptedResponse> {
  const endpoint =
    leadType === "provider"
      ? "/api/launch/provider-leads"
      : "/api/launch/client-leads";

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "omit",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CampaignLeadSubmissionError("network");
  }

  if (!response.ok) {
    const errorBody = await readSafeErrorBody(response);
    const retryAfterSeconds = parseRetryAfter(
      response.headers.get("Retry-After"),
    );
    throw new CampaignLeadSubmissionError(
      classifySubmissionError(response.status, errorBody.message, errorBody.code),
      response.status,
      errorBody.code,
      retryAfterSeconds,
    );
  }

  const body = (await response.json()) as Partial<LeadAcceptedResponse>;
  if (body.accepted !== true) {
    throw new CampaignLeadSubmissionError(
      "invalid_response",
      response.status,
    );
  }

  return {
    accepted: true,
    message:
      typeof body.message === "string" && body.message.trim()
        ? body.message
        : "Merci. Votre intérêt a bien été reçu.",
  };
}

function classifySubmissionError(
  status: number,
  message?: string,
  code?: string,
): CampaignSubmissionErrorKind {
  const hint = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  if (
    status === 400 &&
    /(privacy|confidentialit|notice|consent|version)/i.test(hint)
  ) {
    return "stale_privacy";
  }
  if (status === 400 || status === 409 || status === 422) {
    return "validation";
  }
  if (status === 429) return "rate_limited";
  if (status === 503) return "intake_disabled";
  return status >= 500 ? "server" : "validation";
}

async function readSafeErrorBody(
  response: Response,
): Promise<{ message?: string; code?: string }> {
  try {
    const body = (await response.json()) as {
      message?: unknown;
      code?: unknown;
    };
    const message =
      typeof body.message === "string" ? body.message.slice(0, 300) : undefined;
    const code =
      typeof body.code === "string" && /^[A-Z0-9_]{1,80}$/.test(body.code)
        ? body.code
        : undefined;
    return { message, code };
  } catch {
    return {};
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }
  const retryDate = Date.parse(value);
  if (!Number.isFinite(retryDate)) return undefined;
  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1_000));
}
