import type { UIDataTypes, UIMessage } from "ai";
import type {
  AssistantFindPlaceInput,
  AssistantGetProviderInput,
  AssistantProviderAvailabilityInput,
  AssistantSearchProvidersInput,
  PlaceSummary,
  ProviderCard,
  ProviderPublic,
} from "@kayu/schemas";

export type AssistantMessageMetadata = {
  providerId?: string;
  date?: string;
  time?: string;
  [key: string]: unknown;
};

export type FindPlaceOutput = {
  q: string;
  total: number;
  items: Array<PlaceSummary & { chain: PlaceSummary[] }>;
};

export type SearchProvidersOutput = {
  placeId: string;
  total: number;
  items: ProviderCard[];
};

export type AvailabilityOutput = {
  providerId: string;
  timezone: string;
  slotDurationMin: number;
  days: Array<{ date: string; slots: string[] }>;
};

export type AssistantUITools = {
  find_place: { input: AssistantFindPlaceInput; output: FindPlaceOutput };
  search_providers: { input: AssistantSearchProvidersInput; output: SearchProvidersOutput };
  get_provider: { input: AssistantGetProviderInput; output: ProviderPublic };
  get_provider_availability: { input: AssistantProviderAvailabilityInput; output: AvailabilityOutput };
};

export type AssistantUIMessage = UIMessage<AssistantMessageMetadata | undefined, UIDataTypes, AssistantUITools>;

export type PickedSlot = { providerId: string; date: string; time: string };

export function providerHref(providerId: string): string {
  return `/prestataire/${encodeURIComponent(providerId)}`;
}

export function bookingHref(providerId: string): string {
  return `${providerHref(providerId)}#reserver`;
}

export function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

/** The latest provider the client chose and the latest slot they picked, read from their own messages. */
export function lastChoices(messages: AssistantUIMessage[]): { providerId: string | null; slot: PickedSlot | null; chosenIds: Set<string> } {
  let providerId: string | null = null;
  let slot: PickedSlot | null = null;
  const chosenIds = new Set<string>();
  for (const message of messages) {
    if (message.role !== "user" || !message.metadata) continue;
    const { providerId: id, date, time } = message.metadata;
    if (typeof id === "string" && !date) {
      providerId = id;
      slot = null;
      chosenIds.add(id);
    }
    if (typeof id === "string" && typeof date === "string" && typeof time === "string") {
      slot = { providerId: id, date, time };
    }
  }
  return { providerId, slot, chosenIds };
}
