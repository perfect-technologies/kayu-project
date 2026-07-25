import type {
  ClientTiming,
  ProviderExperienceBand,
} from "./campaign-leads";

export type CampaignFormValues = {
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

export function createEmptyCampaignFormValues(): CampaignFormValues {
  return {
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
}
