"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { providersApi, queryKeys } from "@kayu/api";
import type { ProviderCard as ProviderCardDto, ProviderSearchResponse } from "@kayu/schemas";
import { toast } from "sonner";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FilterChips } from "@/components/search/FilterChips";
import { FiltersSheet } from "@/components/search/FiltersSheet";
import { NearMeButton } from "@/components/search/NearMeButton";
import { ProviderCardSkeleton } from "@/components/search/ProviderCardSkeleton";
import { ResultsHeader } from "@/components/search/ResultsHeader";
import { SearchBar } from "@/components/search/SearchBar";
import {
  EMPTY_STATE,
  PAGE_SIZE,
  countActive,
  countAdvanced,
  criteriaKey,
  draftOf,
  parseSearchState,
  serializeSearchState,
  toApiParams,
  type FilterDraft,
  type SearchState,
} from "@/components/search/search-state";
import { searchCopy } from "@/copy/search";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { apiClient } from "@/lib/api";
import { findRoot } from "@/lib/dto/category";
import { GeolocationDenied, getBrowserPosition, roundCoord } from "@/lib/geo";

const SearchMapView = dynamic(() => import("@/components/search/SearchMapView"), { ssr: false });

const SKELETONS = [0, 1, 2, 3];

export function SearchClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = useMemo(() => parseSearchState(new URLSearchParams(searchParams.toString())), [searchParams]);
  const { tree } = useCategoryTree();

  const update = useCallback(
    (patch: Partial<SearchState>) => {
      const query = serializeSearchState({ ...state, ...patch });
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, state],
  );

  // Typed text lives locally and reaches the URL after 250 ms.
  const [qInput, setQInput] = useState(state.q);
  const lastUrlQ = useRef(state.q);
  useEffect(() => {
    if (state.q !== lastUrlQ.current) {
      lastUrlQ.current = state.q;
      setQInput(state.q);
    }
  }, [state.q]);
  useEffect(() => {
    if (qInput === state.q) return;
    const timer = setTimeout(() => {
      lastUrlQ.current = qInput;
      update({ q: qInput, page: 1 });
    }, 250);
    return () => clearTimeout(timer);
  }, [qInput, state.q, update]);

  const pages = useMemo(() => Array.from({ length: state.page }, (_, index) => index + 1), [state.page]);
  const results = useQueries({
    queries: pages.map((page) => {
      const params = toApiParams(state, page);
      return {
        queryKey: queryKeys.providers.search(params),
        queryFn: () => providersApi(apiClient).search(params),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
        retry: 1,
      };
    }),
  });

  const first = results[0];
  const pageData = results.map((result) => result.data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const settled = useMemo(() => pageData.filter(Boolean) as ProviderSearchResponse[], pageData);
  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: ProviderCardDto[] = [];
    for (const page of settled) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [settled]);
  const last = settled[settled.length - 1];
  const total = last?.total ?? null;
  const hasMore = last ? last.page * last.limit < last.total : false;
  const loadingMore = state.page > 1 && results[results.length - 1]?.isPending === true;

  // Keep the last good result set on screen when a refetch fails.
  const lastGood = useRef<{ key: string; items: ProviderCardDto[]; total: number; hasMore: boolean } | null>(null);
  useEffect(() => {
    if (last && !first?.isPlaceholderData) lastGood.current = { key: criteriaKey(state), items, total: last.total, hasMore };
  });
  const failed = results.some((result) => result.isError);
  useEffect(() => {
    if (failed) toast.error(searchCopy.errors.unavailable);
  }, [failed]);

  const showSkeletons = first?.isPending === true && !first.data;
  const fallback = failed ? lastGood.current : null;
  const visibleItems = items.length > 0 ? items : fallback ? fallback.items : items;
  const visibleTotal = total ?? (fallback ? fallback.total : null);
  const visibleHasMore = last ? hasMore : fallback ? fallback.hasMore : false;

  // Geolocation
  const [locating, setLocating] = useState(false);
  const hasPosition = state.lat !== null && state.lng !== null;
  const viewer = hasPosition ? { lat: state.lat!, lng: state.lng! } : null;
  const nearMe = async () => {
    if (hasPosition) {
      update({ lat: null, lng: null, sort: state.sort === "distance" ? "recommended" : state.sort, page: 1 });
      return;
    }
    setLocating(true);
    try {
      const position = await getBrowserPosition();
      update({ lat: roundCoord(position.lat), lng: roundCoord(position.lng), sort: "distance", page: 1 });
    } catch (error) {
      toast.error(error instanceof GeolocationDenied ? searchCopy.errors.locationDenied : searchCopy.errors.locationUnavailable);
    } finally {
      setLocating(false);
    }
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const applyDraft = (draft: FilterDraft) => update({ ...draft, page: 1 });
  const clearAll = () => update({ ...EMPTY_STATE, lat: state.lat, lng: state.lng, view: state.view });

  return (
    <div className="mobile-page max-w-7xl pt-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{searchCopy.title}</h1>

      <div className="mt-4 flex gap-2">
        <SearchBar value={qInput} onChange={setQInput} />
        <NearMeButton active={hasPosition} locating={locating} onClick={nearMe} />
      </div>

      <FilterChips
        advancedCount={countAdvanced(state)}
        activeCount={countActive(state) + (state.q ? 1 : 0)}
        hasPosition={hasPosition}
        onOpen={() => setSheetOpen(true)}
        onClear={clearAll}
      />

      <ResultsHeader total={showSkeletons ? null : visibleTotal} hasMore={visibleHasMore} view={state.view} onView={(view) => update({ view })} />

      {showSkeletons ? (
        <div role="status" aria-label={searchCopy.searching} className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SKELETONS.map((index) => (
            <ProviderCardSkeleton key={index} />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="empty-state mt-8 flex flex-col items-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <SearchX size={22} aria-hidden />
          </span>
          <h2 className="text-base font-extrabold">{searchCopy.empty.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{searchCopy.empty.description}</p>
          <button type="button" onClick={clearAll} className="secondary-action mt-4">
            {searchCopy.empty.action}
          </button>
        </div>
      ) : state.view === "map" ? (
        <div className="mt-6">
          <SearchMapView providers={visibleItems} viewer={viewer} />
        </div>
      ) : (
        <>
          <div className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${first?.isPlaceholderData ? "opacity-70" : ""}`}>
            {visibleItems.map((provider, index) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                category={findRoot(tree, provider.categoryChain[0]?.slug)}
                viewer={viewer}
                index={index % PAGE_SIZE}
              />
            ))}
          </div>
          {visibleHasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => update({ page: state.page + 1 })}
                disabled={loadingMore}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 text-sm font-semibold text-primary shadow-soft transition hover:bg-primary/10 disabled:opacity-60"
              >
                {loadingMore ? searchCopy.loadingMore : searchCopy.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      <FiltersSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={draftOf(state)}
        onApply={applyDraft}
        tree={tree}
        hasPosition={hasPosition}
      />
    </div>
  );
}
