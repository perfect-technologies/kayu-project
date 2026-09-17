import { tool } from "ai";
import type { Actor } from "../../common/auth/types";
import { AvailabilityQueryParams, PlacesQueryParams, ProviderSearchParams } from "../../common/contract";
import type { PlaceTreeService } from "../places/place-tree.service";
import type { PlacesService } from "../places/places.service";
import type { ProviderCard, ProviderPublic } from "../providers/provider-mapper";
import type { ProvidersService } from "../providers/providers.service";

export const AGENT_TOOL_NAMES = [
  "find_place",
  "search_providers",
  "get_provider",
  "get_provider_availability",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

export type AgentToolCallTrace = {
  name: AgentToolName;
  durationMs: number;
  ok: boolean;
};

export type AgentToolDeps = {
  places: Pick<PlacesService, "list">;
  placeTree: Pick<PlaceTreeService, "chains">;
  providers: Pick<ProvidersService, "search" | "getPublicProfile" | "getAvailability">;
  onToolCall?: (trace: AgentToolCallTrace) => void;
};

const FIND_PLACE_LIMIT = 5;
const DESCRIPTION_EXCERPT = 280;
const SKILLS_LIMIT = 12;
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Never reaches the model, whatever the DTO carries (RFC §4.5, §13).
export const CONTACT_FIELDS = new Set([
  "phone",
  "whatsapp",
  "email",
  "addressLine",
  "latitude",
  "longitude",
  "contacts",
]);

export function withoutContactFields<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => withoutContactFields(item)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !CONTACT_FIELDS.has(key))
        .map(([key, inner]) => [key, withoutContactFields(inner)]),
    ) as T;
  }
  return value;
}

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function labelPath(chain: Array<{ label: string }>): string {
  return chain.map((item) => item.label).join(" › ");
}

export function categoryPath(chain: Array<{ name: string }>): string {
  return chain.map((item) => item.name).join(" › ");
}

export function priceLabel(pricing: ProviderCard["pricing"]): string | null {
  if (!pricing) return null;
  const unit = pricing.unit?.label ? ` / ${pricing.unit.label}` : "";
  return `${pricing.amount} ${pricing.currency?.label ?? "CDF"}${unit}`;
}

export function excerpt(text: string | null, max = DESCRIPTION_EXCERPT): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function compactProviderCard(card: ProviderCard) {
  return {
    id: card.id,
    name: card.displayName,
    category: categoryPath(card.categoryChain),
    place: labelPath(card.placeChain),
    rating: Math.round(card.ratingAvg * 10) / 10,
    reviewCount: card.ratingCount,
    completedJobs: card.completedJobs,
    tier: card.premiumTier,
    verified: card.verified,
    available: card.isAvailable,
    price: priceLabel(card.pricing),
  };
}

export function compactProviderProfile(profile: ProviderPublic) {
  return {
    ...compactProviderCard(profile),
    description: excerpt(profile.description),
    yearsExperience: profile.yearsExperience,
    skills: [...profile.skills.map((skill) => skill.label), ...profile.freeSkills].slice(0, SKILLS_LIMIT),
    languages: profile.languages.map((item) => item.label),
    interventionModes: profile.interventionModes.map((item) => item.label),
    schedule: profile.scheduleSummary
      .filter((day) => day.ranges.length > 0)
      .map(
        (day) =>
          `${DAY_LABELS[day.dayOfWeek]} ${day.ranges.map((range) => `${range.startTime}–${range.endTime}`).join(", ")}`,
      ),
    timezone: profile.schedule.timezone,
    contactsLocked: profile.contactsLocked,
    blocked: profile.blocked,
  };
}

export async function buildTools(actor: Actor, deps: AgentToolDeps) {
  const {
    AssistantFindPlaceInput,
    AssistantGetProviderInput,
    AssistantProviderAvailabilityInput,
    AssistantSearchProvidersInput,
  } = await import("@kayu/schemas");

  const timed = async <T>(name: AgentToolName, run: () => Promise<T>): Promise<T> => {
    const startedAt = Date.now();
    try {
      const output = await run();
      deps.onToolCall?.({ name, durationMs: Date.now() - startedAt, ok: true });
      return output;
    } catch (error) {
      deps.onToolCall?.({ name, durationMs: Date.now() - startedAt, ok: false });
      throw error;
    }
  };

  const find_place = tool({
    description:
      "Retrouve un lieu (pays, province, ville, commune, quartier) à partir d'un nom ou d'un surnom et renvoie son id avec sa chaîne d'appartenance. À appeler avant search_providers dès que le client cite un lieu.",
    inputSchema: AssistantFindPlaceInput,
    execute: (input) =>
      timed("find_place", async () => {
        const query = PlacesQueryParams.parse({
          q: input.q,
          kind: input.kind,
          page: 1,
          limit: FIND_PLACE_LIMIT,
        });
        let page = await deps.places.list(query);
        const folded = stripAccents(input.q);
        if (page.items.length === 0 && folded !== input.q) {
          page = await deps.places.list({ ...query, q: folded });
        }
        const chains = await deps.placeTree.chains(page.items.map((place) => place.id));
        return {
          q: input.q,
          total: page.total,
          items: page.items.map((place) => ({ ...place, chain: chains.get(place.id) ?? [place] })),
        };
      }),
    toModelOutput: ({ output }) => ({
      type: "json",
      value: withoutContactFields({
        total: output.total,
        places: output.items.map((place) => ({
          id: place.id,
          label: place.label,
          kind: place.kind,
          chain: labelPath(place.chain),
        })),
      }),
    }),
  });

  const search_providers = tool({
    description:
      "Cherche des prestataires visibles pour un lieu (placeId de find_place, descendants inclus) et une catégorie ou sous-catégorie de la taxonomie. Renvoie au plus `limit` prestataires classés par recommandation.",
    inputSchema: AssistantSearchProvidersInput,
    execute: (input) =>
      timed("search_providers", async () => {
        const query = ProviderSearchParams.parse({
          placeId: input.placeId,
          subcategoryId: input.subcategoryId,
          categoryId: input.categoryId,
          q: input.q,
          minRating: input.minRating,
          verifiedOnly: input.verifiedOnly,
          sort: input.sort,
          page: 1,
          limit: input.limit,
        });
        const page = await deps.providers.search(query, actor);
        return { placeId: input.placeId, total: page.total, items: page.items };
      }),
    toModelOutput: ({ output }) => ({
      type: "json",
      value: withoutContactFields({
        total: output.total,
        providers: output.items.map(compactProviderCard),
      }),
    }),
  });

  const get_provider = tool({
    description:
      "Donne le détail public d'un prestataire choisi : description, compétences, langues, modes d'intervention, tarif indicatif, horaires hebdomadaires et état des contacts (verrouillés ou non).",
    inputSchema: AssistantGetProviderInput,
    execute: (input) =>
      timed("get_provider", async () => deps.providers.getPublicProfile(input.providerId, actor)),
    toModelOutput: ({ output }) => ({
      type: "json",
      value: withoutContactFields(compactProviderProfile(output)),
    }),
  });

  const get_provider_availability = tool({
    description:
      "Donne les créneaux libres d'un prestataire pour une à sept dates (AAAA-MM-JJ), calculés depuis son planning réel moins ses réservations. Les heures sont dans le fuseau du prestataire.",
    inputSchema: AssistantProviderAvailabilityInput,
    execute: (input) =>
      timed("get_provider_availability", async () => {
        const dates = [...new Set(input.dates.map((date) => AvailabilityQueryParams.parse({ date }).date))].sort();
        const days = await Promise.all(
          dates.map(async (date) => {
            const day = await deps.providers.getAvailability(input.providerId, date, actor);
            return { date, slots: day.slots, timezone: day.timezone, slotDurationMin: day.slotDurationMin };
          }),
        );
        return {
          providerId: input.providerId,
          timezone: days[0]?.timezone ?? "Africa/Kinshasa",
          slotDurationMin: days[0]?.slotDurationMin ?? 60,
          days: days.map(({ date, slots }) => ({ date, slots })),
        };
      }),
    toModelOutput: ({ output }) => ({
      type: "json",
      value: withoutContactFields({
        providerId: output.providerId,
        timezone: output.timezone,
        slotDurationMin: output.slotDurationMin,
        days: output.days,
      }),
    }),
  });

  return { find_place, search_providers, get_provider, get_provider_availability };
}

export type AgentTools = Awaited<ReturnType<typeof buildTools>>;
