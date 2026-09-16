import type { ProviderSearchParams } from "@kayu/schemas";

export const PAGE_SIZE = 24;
export const SORT_KEYS = ["recommended", "rating", "distance", "newest"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type ViewMode = "list" | "map";
export const RATING_STEPS = [0, 3, 4, 4.5] as const;

export type SearchState = {
  q: string;
  category: string;
  subcategory: string;
  service: string;
  place: string;
  language: string;
  mode: string;
  minRating: number;
  verifiedOnly: boolean;
  premiumOnly: boolean;
  sort: SortKey;
  lat: number | null;
  lng: number | null;
  page: number;
  view: ViewMode;
};

export const EMPTY_STATE: SearchState = {
  q: "",
  category: "",
  subcategory: "",
  service: "",
  place: "",
  language: "",
  mode: "",
  minRating: 0,
  verifiedOnly: false,
  premiumOnly: false,
  sort: "recommended",
  lat: null,
  lng: null,
  page: 1,
  view: "list",
};

/** The sheet's criteria (everything the "Réinitialiser" button clears). */
export type FilterDraft = Pick<
  SearchState,
  "category" | "subcategory" | "service" | "place" | "language" | "mode" | "minRating" | "verifiedOnly" | "premiumOnly" | "sort"
>;

const num = (value: string | null): number | null => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function parseSearchState(params: URLSearchParams): SearchState {
  const sort = params.get("sort");
  const rating = num(params.get("rating")) ?? 0;
  const lat = num(params.get("lat"));
  const lng = num(params.get("lng"));
  const hasPosition = lat !== null && lng !== null;
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    subcategory: params.get("sub") ?? "",
    service: params.get("service") ?? "",
    place: params.get("place") ?? "",
    language: params.get("language") ?? "",
    mode: params.get("mode") ?? "",
    minRating: (RATING_STEPS as readonly number[]).includes(rating) ? rating : 0,
    verifiedOnly: params.get("verified") === "1",
    premiumOnly: params.get("premium") === "1",
    sort: sort && (SORT_KEYS as readonly string[]).includes(sort) && (sort !== "distance" || hasPosition) ? (sort as SortKey) : "recommended",
    lat: hasPosition ? lat : null,
    lng: hasPosition ? lng : null,
    page: Math.max(1, Math.min(50, Math.floor(num(params.get("page")) ?? 1))),
    view: params.get("view") === "map" ? "map" : "list",
  };
}

/** Only non-default keys, so a fresh search is `/rechercher`. */
export function serializeSearchState(state: SearchState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.subcategory) params.set("sub", state.subcategory);
  if (state.service) params.set("service", state.service);
  if (state.place) params.set("place", state.place);
  if (state.language) params.set("language", state.language);
  if (state.mode) params.set("mode", state.mode);
  if (state.minRating > 0) params.set("rating", String(state.minRating));
  if (state.verifiedOnly) params.set("verified", "1");
  if (state.premiumOnly) params.set("premium", "1");
  if (state.sort !== "recommended") params.set("sort", state.sort);
  if (state.lat !== null && state.lng !== null) {
    params.set("lat", String(state.lat));
    params.set("lng", String(state.lng));
  }
  if (state.page > 1) params.set("page", String(state.page));
  if (state.view !== "list") params.set("view", state.view);
  return params.toString();
}

/** The part of the state that identifies a result set (page and view excluded). */
export function criteriaKey(state: SearchState): string {
  return serializeSearchState({ ...state, page: 1, view: "list" });
}

export function toApiParams(state: SearchState, page: number): ProviderSearchParams {
  const hasPosition = state.lat !== null && state.lng !== null;
  return {
    q: state.q || undefined,
    categorySlug: state.category || undefined,
    subcategoryId: state.service || state.subcategory || undefined,
    placeId: state.place || undefined,
    languageId: state.language || undefined,
    modeId: state.mode || undefined,
    minRating: state.minRating > 0 ? state.minRating : undefined,
    verifiedOnly: state.verifiedOnly || undefined,
    premiumOnly: state.premiumOnly || undefined,
    sort: state.sort === "distance" && !hasPosition ? "recommended" : state.sort,
    lat: hasPosition ? state.lat! : undefined,
    lng: hasPosition ? state.lng! : undefined,
    page,
    limit: PAGE_SIZE,
  };
}

export function countAdvanced(state: FilterDraft): number {
  return (state.minRating > 0 ? 1 : 0) + (state.premiumOnly ? 1 : 0) + (state.verifiedOnly ? 1 : 0);
}

export function countActive(state: FilterDraft): number {
  return (
    [state.category, state.subcategory, state.service, state.place, state.language, state.mode].filter(Boolean).length +
    countAdvanced(state) +
    (state.sort !== "recommended" ? 1 : 0)
  );
}

export function draftOf(state: SearchState): FilterDraft {
  const { category, subcategory, service, place, language, mode, minRating, verifiedOnly, premiumOnly, sort } = state;
  return { category, subcategory, service, place, language, mode, minRating, verifiedOnly, premiumOnly, sort };
}

export const EMPTY_DRAFT: FilterDraft = draftOf(EMPTY_STATE);
