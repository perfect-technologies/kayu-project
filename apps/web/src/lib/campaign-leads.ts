export type CampaignLeadType = "provider" | "client";

export type LeadAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  referrerHost?: string;
};

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
  attribution?: LeadAttribution;
  website?: string;
};

export type LeadAcceptedResponse = {
  accepted: true;
  message: string;
};

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

const ATTRIBUTION_LIMITS = {
  source: 64,
  medium: 64,
  campaign: 100,
  content: 100,
} as const;

function normalizeAttributionValue(
  value: string | null,
  maxLength: number,
  lowercase = false,
): string | undefined {
  if (!value) return undefined;

  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}._~ -]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

  if (!normalized) return undefined;
  return lowercase ? normalized.toLowerCase() : normalized;
}

export function parseCampaignAttribution(
  search: string | URLSearchParams,
  referrer?: string,
): LeadAttribution {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

  const attribution: LeadAttribution = {
    source: normalizeAttributionValue(
      params.get("utm_source") ?? params.get("source"),
      ATTRIBUTION_LIMITS.source,
      true,
    ),
    medium: normalizeAttributionValue(
      params.get("utm_medium") ?? params.get("medium"),
      ATTRIBUTION_LIMITS.medium,
      true,
    ),
    campaign: normalizeAttributionValue(
      params.get("utm_campaign") ?? params.get("campaign"),
      ATTRIBUTION_LIMITS.campaign,
    ),
    content: normalizeAttributionValue(
      params.get("utm_content") ?? params.get("content"),
      ATTRIBUTION_LIMITS.content,
    ),
  };

  if (referrer) {
    try {
      const hostname = new URL(referrer).hostname.toLowerCase().slice(0, 253);
      if (hostname) attribution.referrerHost = hostname;
    } catch {
      // An invalid referrer is ignored rather than copied into lead or analytics data.
    }
  }

  return Object.fromEntries(
    Object.entries(attribution).filter(([, value]) => Boolean(value)),
  ) as LeadAttribution;
}

export function mergeCampaignAttribution(
  previous: LeadAttribution,
  current: LeadAttribution,
): LeadAttribution {
  return Object.fromEntries(
    Object.entries({ ...previous, ...current }).filter(([, value]) =>
      Boolean(value),
    ),
  ) as LeadAttribution;
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

export function emitCampaignEvent(
  event: CampaignEventName,
  input: Parameters<typeof buildCampaignEvent>[1] = {},
): void {
  if (typeof window === "undefined") return;

  const payload = buildCampaignEvent(event, {
    ...input,
    deviceWidth: window.innerWidth,
  });

  try {
    window.dispatchEvent(
      new CustomEvent("kayou:campaign-event", { detail: payload }),
    );

    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
    };
    analyticsWindow.dataLayer?.push(payload);
  } catch {
    // Analytics is deliberately best-effort and cannot block lead submission.
  }
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    credentials: "omit",
    signal,
  });

  if (!response.ok) {
    throw new Error("CAMPAIGN_LEAD_SUBMISSION_FAILED");
  }

  const body = (await response.json()) as Partial<LeadAcceptedResponse>;
  if (body.accepted !== true) {
    throw new Error("CAMPAIGN_LEAD_RESPONSE_INVALID");
  }

  return {
    accepted: true,
    message:
      typeof body.message === "string" && body.message.trim()
        ? body.message
        : "Merci. Votre intérêt a bien été reçu.",
  };
}
