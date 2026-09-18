import type { Actor } from "../../common/auth/types";
import { AddressesQueryParams, BookingsQueryParams, ConversationsQueryParams } from "../../common/contract";
import type { AddressesService } from "../addresses/addresses.service";
import type { BookingCard } from "../bookings/booking-view.service";
import type { BookingsService } from "../bookings/bookings.service";
import type { ConversationItem, MessagingService } from "../messaging/messaging.service";
import type { ReviewsService } from "../reviews/reviews.service";
import { AGENT_TIMEZONE } from "./agent.prompt";

export type ProfileDeps = {
  addresses: Pick<AddressesService, "list">;
  bookings: Pick<BookingsService, "list" | "get">;
  messaging: Pick<MessagingService, "list">;
  reviews: Pick<ReviewsService, "mine">;
};

type AddressItem = Awaited<ReturnType<AddressesService["list"]>>["items"][number];
type ReviewItem = Awaited<ReturnType<ReviewsService["mine"]>>["reviews"][number];

export type ProfileData = {
  firstName: string | null;
  phoneKnown: boolean;
  addresses: AddressItem[];
  completed: BookingCard[];
  open: BookingCard[];
  conversations: ConversationItem[];
  reviews: ReviewItem[];
  lastCompletedPlace: string | null;
};

export type AgentSuggestion = { text: string; providerId: string | null };

export const LOW_RATING_MAX = 2;
const COMPLETED_LIMIT = 3;
const OPEN_LIMIT = 5;
const CONVERSATIONS_LIMIT = 3;
const REVIEWS_LIMIT = 5;
const COMMENT_EXCERPT = 80;
const SUGGESTIONS_LIMIT = 3;

// The client's own messages name addresses in French ("Utilise mon adresse « Travail »"), so the model
// must see the same words next to the addressId, not the raw enum.
export const ADDRESS_LABELS: Record<string, string> = {
  HOME: "Domicile",
  WORK: "Travail",
  OTHER: "Autre",
};

export function addressLabel(label: string): string {
  return ADDRESS_LABELS[label] ?? label;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "en attente de confirmation",
  CONFIRMED: "confirmée",
  COMPLETED: "terminée",
  CANCELLED: "annulée",
};

const dayFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const instantFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: AGENT_TIMEZONE, day: "numeric", month: "long", year: "numeric" });

export function formatLocalDay(date: string): string {
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}

export async function loadProfileData(actor: Actor, deps: ProfileDeps): Promise<ProfileData> {
  const [addresses, completed, pending, confirmed, conversations, mine] = await Promise.all([
    deps.addresses.list(actor, AddressesQueryParams.parse({ page: 1, limit: 50 })),
    deps.bookings.list(actor, BookingsQueryParams.parse({ status: "COMPLETED", page: 1, limit: COMPLETED_LIMIT })),
    deps.bookings.list(actor, BookingsQueryParams.parse({ status: "PENDING", page: 1, limit: OPEN_LIMIT })),
    deps.bookings.list(actor, BookingsQueryParams.parse({ status: "CONFIRMED", page: 1, limit: OPEN_LIMIT })),
    deps.messaging.list(actor, ConversationsQueryParams.parse({ page: 1, limit: CONVERSATIONS_LIMIT })),
    deps.reviews.mine(actor),
  ]);

  const last = completed.items[0];
  const lastCompletedPlace = last ? await deps.bookings.get(actor, last.id).then(placeOf, () => null) : null;

  return {
    firstName: actor.firstName,
    phoneKnown: Boolean(actor.phone),
    addresses: addresses.items,
    completed: completed.items,
    open: [...pending.items, ...confirmed.items].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
    conversations: conversations.items,
    reviews: mine.reviews.slice(0, REVIEWS_LIMIT),
    lastCompletedPlace,
  };
}

function placeOf(detail: { placeChain: Array<{ kind: string; label: string }> }): string | null {
  const deepest = detail.placeChain.filter((place) => place.kind !== "COUNTRY").at(-1);
  return deepest?.label ?? null;
}

function chainLabel(chain: Array<{ label: string }>): string {
  return chain.map((place) => place.label).join(" › ");
}

function whoLabel(counterpart: { name: string; providerId: string | null }): string {
  return counterpart.providerId ? `${counterpart.name} (providerId ${counterpart.providerId})` : counterpart.name;
}

function excerpt(text: string | null): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= COMMENT_EXCERPT ? clean : `${clean.slice(0, COMMENT_EXCERPT - 1).trimEnd()}…`;
}

export function buildProfileBlock(data: ProfileData): string {
  const ratingByBooking = new Map(data.reviews.map((review) => [review.booking.id, review.rating]));
  const lines = ["Profil du client (mémoire déterministe, reconstruite à chaque tour) :"];

  lines.push(`Identité : ${data.firstName ?? "prénom inconnu"} ; téléphone ${data.phoneKnown ? "connu" : "inconnu"}.`);

  if (data.addresses.length > 0) {
    lines.push(
      `Adresses enregistrées : ${data.addresses
        .map((address) => `« ${addressLabel(address.label)} » (addressId ${address.id}${address.isDefault ? ", par défaut" : ""}) ${chainLabel(address.placeChain) || "lieu non précisé"}`)
        .join(" ; ")}.`,
    );
  }

  if (data.completed.length > 0) {
    lines.push(
      `Dernières prestations terminées : ${data.completed
        .map((booking) => {
          const rating = ratingByBooking.get(booking.id);
          const category = booking.counterpart.categoryLabel ?? "catégorie inconnue";
          return `${whoLabel(booking.counterpart)}, ${category}, ${formatLocalDay(booking.scheduledLocal.date)}, ${rating ? `note donnée ${rating}/5` : "sans avis"}`;
        })
        .join(" ; ")}.`,
    );
  }

  if (data.open.length > 0) {
    lines.push(
      `Réservations en cours : ${data.open
        .map(
          (booking) =>
            `${whoLabel(booking.counterpart)}, ${booking.counterpart.categoryLabel ?? "catégorie inconnue"}, ${formatLocalDay(booking.scheduledLocal.date)} à ${booking.scheduledLocal.time}, ${STATUS_LABELS[booking.status] ?? booking.status.toLowerCase()} (bookingId ${booking.id})`,
        )
        .join(" ; ")}.`,
    );
  }

  if (data.conversations.length > 0) {
    lines.push(
      `Dernières conversations : ${data.conversations
        .map((conversation) => `${whoLabel(conversation.counterpart)}, dernier message le ${instantFormat.format(conversation.lastMessageAt)}`)
        .join(" ; ")}.`,
    );
  }

  if (data.reviews.length > 0) {
    lines.push(
      `Avis rédigés par le client : ${data.reviews
        .map((review) => {
          const comment = excerpt(review.comment);
          const low = review.rating <= LOW_RATING_MAX ? " — note basse, à signaler si tu le proposes" : "";
          return `${review.provider.displayName} (providerId ${review.provider.id}) ${review.rating}/5${comment ? ` « ${comment} »` : ""}${low}`;
        })
        .join(" ; ")}.`,
    );
  }

  return lines.join("\n");
}

export function buildSuggestions(data: ProfileData): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  const seen = new Set<string>();
  const push = (text: string, providerId: string | null) => {
    if (suggestions.length >= SUGGESTIONS_LIMIT || seen.has(text)) return;
    seen.add(text);
    suggestions.push({ text, providerId });
  };

  const recontact = data.conversations[0]?.counterpart ?? data.completed[0]?.counterpart;
  if (recontact?.providerId) push(`Recontacter ${recontact.name}`, recontact.providerId);

  const lastCompleted = data.completed[0];
  if (lastCompleted?.counterpart.categoryLabel) {
    push(`Réserver à nouveau : ${lastCompleted.counterpart.categoryLabel}`, lastCompleted.counterpart.providerId);
  }

  if (data.lastCompletedPlace) push(`Comme la dernière fois à ${data.lastCompletedPlace}`, lastCompleted?.counterpart.providerId ?? null);

  return suggestions;
}
