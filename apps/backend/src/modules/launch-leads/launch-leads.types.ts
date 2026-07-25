export type LeadAttributionInput = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  referrerHost?: string;
};

export type LaunchLeadBaseInput = {
  firstName: string;
  phone: string;
  email?: string;
  operationalConsent: true;
  marketingConsent: boolean;
  privacyNoticeVersion: string;
  attribution?: LeadAttributionInput;
  website?: string;
  formStartedAt?: string;
};

export type CreateProviderLeadInput = LaunchLeadBaseInput & {
  primarySubcategoryId: string;
  additionalSubcategoryIds: string[];
  experienceBand:
    | "STARTING"
    | "ONE_TO_THREE_YEARS"
    | "FOUR_PLUS_YEARS";
  homeCommune: string;
  serviceCommunes: string[];
  hasWhatsApp?: boolean;
  summary?: string;
};

export type CreateClientLeadInput = LaunchLeadBaseInput & {
  commune: string;
  neededSubcategoryIds: string[];
  timing: "WITHIN_7_DAYS" | "WITHIN_30_DAYS" | "LATER" | "EXPLORING";
  needSummary?: string;
  preferredContact?: "PHONE" | "WHATSAPP";
};

export type LaunchRequestContext = {
  ip?: string;
};

export type NormalizedAttribution = {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  referrerHost: string | null;
  campaignKey: string;
};
