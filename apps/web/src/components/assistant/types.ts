import { isToolUIPart, type UIDataTypes, type UIMessage } from "ai";
import type {
  Address,
  AssistantCreateBookingInput,
  AssistantFindPlaceInput,
  AssistantGetMyActivityInput,
  AssistantGetProviderInput,
  AssistantProviderAvailabilityInput,
  AssistantSearchProvidersInput,
  AssistantSendMessageInput,
  BookingCard,
  BookingDetail,
  Conversation,
  PlaceSummary,
  ProviderCard,
  ProviderPublic,
  StartConversationResponse,
} from "@kayu/schemas";

export type AssistantMessageMetadata = {
  providerId?: string;
  date?: string;
  time?: string;
  addressId?: string;
  revisedFor?: string;
  [key: string]: unknown;
};

export type ActivityOutput = {
  openBookings: BookingCard[];
  conversations: Conversation[];
  addresses: Address[];
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
  get_my_activity: { input: AssistantGetMyActivityInput; output: ActivityOutput };
  create_booking: { input: AssistantCreateBookingInput; output: BookingDetail };
  send_message: { input: AssistantSendMessageInput; output: StartConversationResponse };
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

export type ApprovalAnswer = { id: string; approved: boolean; reason?: string };

/**
 * Answers from the last step of the last assistant message, like the SDK's own completeness check:
 * a continued message keeps the answers of earlier steps, which the server has already applied.
 */
export function pendingAnswers(messages: AssistantUIMessage[]): ApprovalAnswer[] {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return [];
  const lastStepStart = last.parts.reduce((index, part, at) => (part.type === "step-start" ? at : index), -1);
  const answers: ApprovalAnswer[] = [];
  for (const part of last.parts.slice(lastStepStart + 1)) {
    if (isToolUIPart(part) && part.state === "approval-responded") {
      answers.push({ id: part.approval.id, approved: part.approval.approved, reason: part.approval.reason });
    }
  }
  return answers;
}

export type KnownProvider = { id: string; displayName: string; timezone: string | null };

/** Providers the conversation already showed, so approval cards can name them without another request. */
export function knownProviders(messages: AssistantUIMessage[]): Map<string, KnownProvider> {
  const known = new Map<string, KnownProvider>();
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.parts) {
      if (part.type === "tool-search_providers" && part.state === "output-available") {
        for (const card of part.output.items) known.set(card.id, { id: card.id, displayName: card.displayName, timezone: known.get(card.id)?.timezone ?? null });
      }
      if (part.type === "tool-get_provider" && part.state === "output-available") {
        known.set(part.output.id, { id: part.output.id, displayName: part.output.displayName, timezone: part.output.schedule.timezone });
      }
      if (part.type === "tool-get_provider_availability" && part.state === "output-available") {
        const current = known.get(part.output.providerId);
        if (current) known.set(current.id, { ...current, timezone: part.output.timezone });
      }
      if (part.type === "tool-get_my_activity" && part.state === "output-available") {
        for (const booking of part.output.openBookings) {
          if (booking.counterpart.providerId && !known.has(booking.counterpart.providerId)) {
            known.set(booking.counterpart.providerId, { id: booking.counterpart.providerId, displayName: booking.counterpart.name, timezone: booking.timezone });
          }
        }
        for (const conversation of part.output.conversations) {
          if (conversation.counterpart.providerId && !known.has(conversation.counterpart.providerId)) {
            known.set(conversation.counterpart.providerId, { id: conversation.counterpart.providerId, displayName: conversation.counterpart.name, timezone: null });
          }
        }
      }
    }
  }
  return known;
}

/** The last place the client resolved through find_place, used to offer saving it as the default address. */
export function lastResolvedPlace(messages: AssistantUIMessage[]): FindPlaceOutput["items"][number] | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]!;
    if (message.role !== "assistant") continue;
    for (const part of message.parts) {
      if (part.type === "tool-find_place" && part.state === "output-available" && part.output.items[0]) return part.output.items[0];
    }
  }
  return null;
}

export const ADDRESS_MARKER = "[[adresse]]";

export function stripAddressMarker(text: string): { text: string; asksAddress: boolean } {
  const asksAddress = text.includes(ADDRESS_MARKER);
  return { text: asksAddress ? text.split(ADDRESS_MARKER).join("").trim() : text, asksAddress };
}

export function messageAsksAddress(message: AssistantUIMessage): boolean {
  return message.role === "assistant" && message.parts.some((part) => part.type === "text" && part.text.includes(ADDRESS_MARKER));
}

export function formatSlotLabel(date: string, time: string): string {
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} à ${time}`;
}
