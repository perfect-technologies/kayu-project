"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  I,
  ProviderShowcaseCard,
  ProviderShowcaseCardSkeleton,
} from "@kayu/ui/web";
import type { CategorySlug, ProviderCardData } from "@kayu/ui";
import { apiClient } from "@/lib/api";
import { categoriesApi, providersApi, queryKeys } from "@kayu/api";
import { toProviderCardData, resolveCategorySlug } from "@/lib/provider-card";

const PRICE_MAX = 100000;

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  subcategories?: Subcategory[];
}

const cities = [
  "Kinshasa",
  "Brazzaville",
  "Pointe-Noire",
  "Lubumbashi",
  "Matadi",
  "Goma",
];

const defaultCategories: Category[] = [
  { id: "1", name: "Plomberie", slug: "plomberie" },
  { id: "2", name: "Électricité", slug: "electricite" },
  { id: "3", name: "Ménage & Nettoyage", slug: "menage-nettoyage" },
  { id: "4", name: "Coiffure & Beauté", slug: "coiffure-beaute" },
  { id: "5", name: "Informatique", slug: "informatique" },
  { id: "6", name: "Jardinage", slug: "jardinage" },
];

export function ServicesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<
    "recommended" | "hourlyRate-asc" | "hourlyRate-desc" | "createdAt-desc"
  >("recommended");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedSubcategory(searchParams.get("subcategory") || "");
    setSelectedCity(searchParams.get("city") || "");
    setMinRating(parseFloat(searchParams.get("minRating") || "0"));
    setPriceRange([
      parseFloat(searchParams.get("minPrice") || "0"),
      parseFloat(searchParams.get("maxPrice") || "100000"),
    ]);
    setAvailableOnly(searchParams.get("available") === "true");
    setVerifiedOnly(searchParams.get("verified") === "true");
    setPage(parseInt(searchParams.get("page") || "1"));
    setMounted(true);
  }, [searchParams]);

  const sortParams = useMemo(() => {
    switch (sort) {
      case "hourlyRate-asc":
        return { sortBy: "hourlyRate" as const, sortOrder: "asc" as const };
      case "hourlyRate-desc":
        return { sortBy: "hourlyRate" as const, sortOrder: "desc" as const };
      case "createdAt-desc":
        return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
      case "recommended":
      default:
        return { sortBy: undefined, sortOrder: undefined };
    }
  }, [sort]);

  const searchParamsObj = useMemo(
    () => ({
      q: searchQuery || undefined,
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      city: selectedCity || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
      available: availableOnly || undefined,
      verified: verifiedOnly || undefined,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
      page,
      limit: 12,
    }),
    [
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedCity,
      minRating,
      priceRange,
      availableOnly,
      verifiedOnly,
      sortParams,
      page,
    ],
  );

  const {
    data: providersData,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.providers.search(searchParamsObj),
    queryFn: () =>
      providersApi(apiClient).search(
        searchParamsObj as Record<string, string | number | boolean | undefined>,
      ),
    enabled: mounted,
    placeholderData: (prev) => prev,
  });

  const rawProviders = (providersData?.providers ?? []) as Array<
    Record<string, unknown>
  >;
  const providers = useMemo<ProviderCardData[]>(
    () => rawProviders.map((p) => toProviderCardData(p)),
    [rawProviders],
  );
  const total = providersData?.pagination?.total ?? 0;
  const totalPages = providersData?.pagination?.totalPages ?? 1;

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.hierarchy,
    queryFn: () => categoriesApi(apiClient).getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = useMemo(() => {
    if (!categoriesData) return defaultCategories;
    const arr = Array.isArray(categoriesData)
      ? categoriesData
      : ((categoriesData as { categories?: unknown[] }).categories ?? []);
    return (arr as Array<Record<string, unknown>>).map((cat) => ({
      id: (cat.id as string) ?? "",
      name: cat.name as string,
      slug: (cat.slug as string) ?? "",
      icon: (cat.icon as string) ?? null,
      color: (cat.color as string) ?? null,
      subcategories: Array.isArray(cat.subcategories)
        ? (cat.subcategories as Array<Record<string, unknown>>).map((sub) => ({
            id: (sub.id as string) ?? "",
            name: (sub.name as string) ?? "",
            slug: (sub.slug as string) ?? "",
          }))
        : [],
    }));
  }, [categoriesData]);

  const updateUrl = useCallback(
    (extra: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
      if (selectedCity) params.set("city", selectedCity);
      if (minRating > 0) params.set("minRating", String(minRating));
      if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
      if (priceRange[1] < 100000) params.set("maxPrice", String(priceRange[1]));
      if (availableOnly) params.set("available", "true");
      if (verifiedOnly) params.set("verified", "true");
      if (page > 1) params.set("page", String(page));
      Object.entries(extra).forEach(([k, v]) => {
        if (v !== null && v !== "" && v !== 0 && v !== false) {
          params.set(k, String(v));
        } else {
          params.delete(k);
        }
      });
      router.push(
        `/services${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false },
      );
    },
    [
      router,
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedCity,
      minRating,
      priceRange,
      availableOnly,
      verifiedOnly,
      page,
    ],
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedCity("");
    setMinRating(0);
    setPriceRange([0, 100000]);
    setAvailableOnly(false);
    setVerifiedOnly(false);
    setPage(1);
    router.push("/services", { scroll: false });
  };

  const selectedCategoryObj = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)
    : undefined;
  const selectedSubcategoryObj = selectedSubcategory
    ? selectedCategoryObj?.subcategories?.find((s) => s.slug === selectedSubcategory)
    : undefined;
  const headingLabel =
    selectedSubcategoryObj?.name ??
    selectedCategoryObj?.name ??
    "Tous les pros";

  if (!mounted) {
    return (
      <div
        style={{ background: "var(--k-bg)" }}
        className="mx-auto max-w-[1120px] px-5 py-6 md:px-8"
      >
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr]">
          <div
            className="hidden rounded-[var(--k-r-lg)] lg:block"
            style={{
              height: 520,
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
            }}
          />
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <ProviderShowcaseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Thin search strip */}
      <div
        style={{
          background: "var(--k-surface)",
          borderBottom: "1px solid var(--k-border)",
        }}
      >
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-5 py-4 md:px-8">
          <label
            className="flex flex-[1.2] items-center gap-2.5 rounded-[var(--k-r-md)] px-3.5 py-2.5"
            style={{ border: "1px solid var(--k-border)" }}
          >
            <Search className="h-4 w-4" style={{ color: "var(--k-text-muted)" }} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              onBlur={() => updateUrl({ q: searchQuery, page: null })}
              placeholder="Plombier, coiffeur, électricien…"
              className="flex-1 bg-transparent text-[14px] outline-none"
              style={{ color: "var(--k-text-primary)" }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  updateUrl({ q: null });
                }}
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" style={{ color: "var(--k-text-muted)" }} />
              </button>
            )}
          </label>
          <label
            className="flex flex-1 items-center gap-2.5 rounded-[var(--k-r-md)] px-3.5 py-2.5"
            style={{ border: "1px solid var(--k-border)" }}
          >
            <MapPin className="h-4 w-4" style={{ color: "var(--k-text-muted)" }} />
            <select
              value={selectedCity}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedCity(v);
                setPage(1);
                updateUrl({ city: v || null, page: null });
              }}
              className="flex-1 bg-transparent text-[14px] outline-none"
              style={{ color: "var(--k-text-primary)" }}
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            className="k-btn k-btn-primary"
            onClick={() => updateUrl({ q: searchQuery, page: null })}
          >
            Rechercher
          </button>
          <button
            className="k-btn k-btn-secondary lg:hidden"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1120px] gap-6 px-5 py-6 md:px-8 lg:grid-cols-[260px_1fr]">
        {/* FILTERS */}
        <aside
          className="sticky top-[104px] hidden self-start lg:block"
          style={{ maxHeight: "calc(100vh - 140px)", overflow: "auto" }}
        >
          <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategory={(slug) => {
              setSelectedCategory(slug);
              setSelectedSubcategory("");
              setPage(1);
              updateUrl({ category: slug || null, subcategory: null, page: null });
            }}
            selectedSubcategory={selectedSubcategory}
            onSubcategory={(slug) => {
              setSelectedSubcategory(slug);
              setPage(1);
              updateUrl({ subcategory: slug || null, page: null });
            }}
            minRating={minRating}
            onMinRating={(v) => {
              setMinRating(v);
              setPage(1);
              updateUrl({ minRating: v || null, page: null });
            }}
            priceRange={priceRange}
            onPriceRange={(v) => setPriceRange(v)}
            onPriceCommit={(v) =>
              updateUrl({
                minPrice: v[0] > 0 ? v[0] : null,
                maxPrice: v[1] < 100000 ? v[1] : null,
                page: null,
              })
            }
            availableOnly={availableOnly}
            onAvailable={(v) => {
              setAvailableOnly(v);
              setPage(1);
              updateUrl({ available: v || null, page: null });
            }}
            verifiedOnly={verifiedOnly}
            onVerified={(v) => {
              setVerifiedOnly(v);
              setPage(1);
              updateUrl({ verified: v || null, page: null });
            }}
            onClear={clearFilters}
          />
        </aside>

        {/* LIST */}
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="k-display-m" style={{ margin: 0 }}>
                {headingLabel}
                {selectedCity ? ` à ${selectedCity}` : ""}
              </h1>
              <div
                className="k-body-m mt-1"
                style={{ color: "var(--k-text-muted)" }}
              >
                <b className="k-num" style={{ color: "var(--k-text-primary)" }}>
                  {total}
                </b>{" "}
                pros
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="k-caption">Trier par</span>
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as typeof sort)
                }
                className="rounded-[var(--k-r-sm)] px-2.5 py-1.5 text-[13px] font-medium"
                style={{
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-border)",
                  color: "var(--k-text-primary)",
                }}
              >
                <option value="recommended">Recommandés</option>
                <option value="hourlyRate-asc">Prix croissant</option>
                <option value="hourlyRate-desc">Prix décroissant</option>
                <option value="createdAt-desc">Nouveaux pros</option>
              </select>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <FilterPill
              active={availableOnly}
              onClick={() => {
                const v = !availableOnly;
                setAvailableOnly(v);
                updateUrl({ available: v || null });
              }}
            >
              <Check className="h-[13px] w-[13px]" /> Accepte les demandes
            </FilterPill>
            <FilterPill
              active={verifiedOnly}
              onClick={() => {
                const v = !verifiedOnly;
                setVerifiedOnly(v);
                updateUrl({ verified: v || null });
              }}
            >
              <BadgeCheck className="h-[13px] w-[13px]" /> Vérifié
            </FilterPill>
            <FilterPill
              active={minRating >= 4}
              onClick={() => {
                const next = minRating >= 4 ? 0 : 4;
                setMinRating(next);
                setPage(1);
                updateUrl({ minRating: next || null, page: null });
              }}
            >
              <Star className="h-[13px] w-[13px]" /> Note 4+
            </FilterPill>
          </div>

          {loading && (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <ProviderShowcaseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && !loading && (
            <div
              className="rounded-[var(--k-r-lg)] p-8 text-center"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
              }}
            >
              <h3 className="k-heading mb-2">Oups, erreur de chargement</h3>
              <p
                className="k-body mb-4"
                style={{ color: "var(--k-text-muted)" }}
              >
                Vérifie ta connexion et réessaie.
              </p>
              <button
                className="k-btn k-btn-primary"
                onClick={() => refetch()}
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !isError && providers.length === 0 && (
            <div
              className="rounded-[var(--k-r-lg)] p-8 text-center"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
              }}
            >
              <h3 className="k-heading mb-2">Aucun pro pour ces critères</h3>
              <p
                className="k-body mb-4"
                style={{ color: "var(--k-text-muted)" }}
              >
                Élargis les filtres ou tente une autre catégorie.
              </p>
              <button
                className="k-btn k-btn-secondary"
                onClick={clearFilters}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {!loading && !isError && providers.length > 0 && (
            <>
              <div className="flex flex-col gap-4">
                {providers.map((p) => (
                  <ProviderShowcaseCard
                    key={p.id}
                    provider={p}
                    onClick={() => router.push(`/providers/${p.id}`)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    className="k-btn k-btn-secondary k-btn-sm"
                    disabled={page === 1}
                    onClick={() => {
                      const n = page - 1;
                      setPage(n);
                      updateUrl({ page: n > 1 ? n : null });
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  <span className="k-caption">
                    Page {page} sur {totalPages}
                  </span>
                  <button
                    className="k-btn k-btn-secondary k-btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const n = page + 1;
                      setPage(n);
                      updateUrl({ page: n });
                    }}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {filterSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:hidden"
          style={{ background: "rgba(15,23,42,0.4)" }}
          onClick={() => setFilterSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] w-full overflow-auto rounded-t-[var(--k-r-xl)] px-5 py-4"
            style={{ background: "var(--k-bg)" }}
          >
            <div
              className="mx-auto mb-4 h-1 w-10 rounded"
              style={{ background: "var(--k-border-strong)" }}
            />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="k-heading" style={{ margin: 0 }}>
                Filtres
              </h3>
              <button
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Fermer les filtres"
              >
                <X className="h-[22px] w-[22px]" />
              </button>
            </div>
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategory={(slug) => {
                setSelectedCategory(slug);
                setSelectedSubcategory("");
                setPage(1);
                updateUrl({ category: slug || null, subcategory: null, page: null });
              }}
              selectedSubcategory={selectedSubcategory}
              onSubcategory={(slug) => {
                setSelectedSubcategory(slug);
                setPage(1);
                updateUrl({ subcategory: slug || null, page: null });
              }}
              minRating={minRating}
              onMinRating={(v) => {
                setMinRating(v);
                setPage(1);
                updateUrl({ minRating: v || null, page: null });
              }}
              priceRange={priceRange}
              onPriceRange={(v) => setPriceRange(v)}
              onPriceCommit={(v) =>
                updateUrl({
                  minPrice: v[0] > 0 ? v[0] : null,
                  maxPrice: v[1] < 100000 ? v[1] : null,
                  page: null,
                })
              }
              availableOnly={availableOnly}
              onAvailable={(v) => {
                setAvailableOnly(v);
                setPage(1);
                updateUrl({ available: v || null, page: null });
              }}
              verifiedOnly={verifiedOnly}
              onVerified={(v) => {
                setVerifiedOnly(v);
                setPage(1);
                updateUrl({ verified: v || null, page: null });
              }}
              onClear={clearFilters}
            />
            <button
              className="k-btn k-btn-primary mt-4 w-full"
              style={{ height: 48 }}
              onClick={() => setFilterSheetOpen(false)}
            >
              Voir {total} résultats
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        height: 34,
        padding: "0 14px",
        borderRadius: 9999,
        border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
        background: active ? "var(--k-primary-subtle)" : "var(--k-surface)",
        color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
        fontFamily: "var(--k-font-body)",
        fontSize: 13,
        fontWeight: 500,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </button>
  );
}

interface FilterPanelProps {
  categories: Category[];
  selectedCategory: string;
  onCategory: (slug: string) => void;
  selectedSubcategory: string;
  onSubcategory: (slug: string) => void;
  minRating: number;
  onMinRating: (v: number) => void;
  priceRange: [number, number];
  onPriceRange: (v: [number, number]) => void;
  onPriceCommit: (v: [number, number]) => void;
  availableOnly: boolean;
  onAvailable: (v: boolean) => void;
  verifiedOnly: boolean;
  onVerified: (v: boolean) => void;
  onClear: () => void;
}

function FilterPanel({
  categories,
  selectedCategory,
  onCategory,
  selectedSubcategory,
  onSubcategory,
  minRating,
  onMinRating,
  priceRange,
  onPriceRange,
  onPriceCommit,
  availableOnly,
  onAvailable,
  verifiedOnly,
  onVerified,
  onClear,
}: FilterPanelProps) {
  // Visual-only filters not yet wired to the API. Local state keeps the
  // toggles interactive so the panel matches the prototype exactly.
  const [distance, setDistance] = useState(20);
  const [fastResponse, setFastResponse] = useState(false);
  const [weekend, setWeekend] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [expert, setExpert] = useState(false);

  const subSlugs = categories
    .find((c) => c.slug === selectedCategory)
    ?.subcategories;

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 20,
        }}
      >
        <h3 className="k-heading" style={{ margin: 0 }}>
          Filtres
        </h3>
        <button
          onClick={onClear}
          className="k-btn k-btn-ghost k-btn-sm"
          style={{ padding: 0 }}
        >
          Effacer
        </button>
      </div>

      <FilterSection title="Catégorie">
        <div style={{ display: "grid", gap: 6 }}>
          {categories.slice(0, 6).map((c) => (
            <CategoryRow
              key={c.id}
              slug={c.slug}
              label={c.name}
              checked={selectedCategory === c.slug}
              onToggle={() =>
                onCategory(selectedCategory === c.slug ? "" : c.slug)
              }
            />
          ))}
        </div>
      </FilterSection>

      {selectedCategory && subSlugs && subSlugs.length > 0 ? (
        <FilterSection title="Spécialité">
          <div style={{ display: "grid", gap: 6 }}>
            {subSlugs.slice(0, 8).map((sub) => (
              <label
                key={sub.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSubcategory === sub.slug}
                  onChange={() =>
                    onSubcategory(
                      selectedSubcategory === sub.slug ? "" : sub.slug,
                    )
                  }
                  style={{ accentColor: "var(--k-primary)" }}
                />
                <span style={{ color: "var(--k-text-body)" }}>{sub.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Prix horaire">
        <PriceSlider
          value={priceRange}
          onChange={onPriceRange}
          onCommit={onPriceCommit}
        />
      </FilterSection>

      <FilterSection title="Note minimum">
        <div style={{ display: "flex", gap: 6 }}>
          {[5, 4, 3].map((n) => {
            const active = minRating === n;
            return (
              <button
                key={n}
                onClick={() => onMinRating(active ? 0 : n)}
                style={{
                  border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                  borderRadius: 999,
                  background: active
                    ? "var(--k-primary-subtle)"
                    : "var(--k-surface)",
                  color: active
                    ? "var(--k-primary-hover)"
                    : "var(--k-text-body)",
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <Star
                  className="h-3 w-3"
                  fill="var(--k-warning)"
                  stroke="none"
                />{" "}
                {n}+
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Distance">
        <div
          className="k-caption k-num"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span>0 km</span>
          <span>&lt; {distance} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: "var(--k-primary)",
          }}
        />
      </FilterSection>

      <FilterSection title="Disponibilité">
        <Toggle
          label="Disponible maintenant"
          value={availableOnly}
          onChange={onAvailable}
        />
        <Toggle
          label="Répond en < 30 min"
          value={fastResponse}
          onChange={setFastResponse}
        />
        <Toggle
          label="Accepte le week-end"
          value={weekend}
          onChange={setWeekend}
        />
      </FilterSection>

      <FilterSection title="Confiance" last>
        <Toggle label="Vérifié" value={verifiedOnly} onChange={onVerified} />
        <Toggle label="Top rated" value={topRated} onChange={setTopRated} />
        <Toggle label="Expert" value={expert} onChange={setExpert} />
      </FilterSection>
    </div>
  );
}

function CategoryRow({
  slug,
  label,
  checked,
  onToggle,
}: {
  slug: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const resolved = resolveCategorySlug(slug) as CategorySlug;
  const tintMap: Record<CategorySlug, { bg: string; fg: string }> = {
    plomberie: { bg: "#CCFBF1", fg: "#0D9488" },
    electricite: { bg: "#FEF3C7", fg: "#D97706" },
    menage: { bg: "#FFE4E6", fg: "#E11D48" },
    coiffure: { bg: "#FCE7F3", fg: "#BE185D" },
    informatique: { bg: "#EDE9FE", fg: "#7C3AED" },
    jardinage: { bg: "#D1FAE5", fg: "#059669" },
    peinture: { bg: "#DBEAFE", fg: "#2563EB" },
    transport: { bg: "#E2E8F0", fg: "#475569" },
    menuiserie: { bg: "#FEF3C7", fg: "#B45309" },
  };
  const tint = tintMap[resolved] ?? tintMap.plomberie;
  const portfolioIconMap: Record<CategorySlug, keyof typeof I> = {
    plomberie: "wrench",
    electricite: "zap",
    menage: "sparkles",
    coiffure: "scissors",
    informatique: "laptop",
    jardinage: "leaf",
    peinture: "paintbrush",
    transport: "car",
    menuiserie: "hammer",
  };
  const Icon = I[portfolioIconMap[resolved]] as React.FC<{ size?: number }>;
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ accentColor: "var(--k-primary)" }}
      />
      <span
        aria-hidden
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: tint.bg,
          color: tint.fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon size={14} /> : null}
      </span>
      <span style={{ flex: 1, color: "var(--k-text-body)" }}>{label}</span>
    </label>
  );
}

function PriceSlider({
  value,
  onChange,
  onCommit,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  onCommit: (v: [number, number]) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);
  const [min, max] = value;
  const minPct = Math.max(0, Math.min(100, (min / PRICE_MAX) * 100));
  const maxPct = Math.max(0, Math.min(100, (max / PRICE_MAX) * 100));

  const valueAt = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round((ratio * PRICE_MAX) / 1000) * 1000;
  };

  const startDrag =
    (handle: "min" | "max") => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingRef.current = handle;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const v = valueAt(e.clientX);
    if (draggingRef.current === "min") {
      onChange([Math.min(v, max - 1000), max]);
    } else {
      onChange([min, Math.max(v, min + 1000)]);
    }
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    onCommit([min, max]);
  };

  const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FC`;

  return (
    <>
      <div
        className="k-caption k-num"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
      <div
        ref={trackRef}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: "relative",
          height: 28,
          padding: "10px 0",
          touchAction: "none",
        }}
      >
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "var(--k-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            height: 4,
            borderRadius: 2,
            background: "var(--k-primary)",
          }}
        />
        {(["min", "max"] as const).map((handle) => {
          const pct = handle === "min" ? minPct : maxPct;
          return (
            <div
              key={handle}
              role="slider"
              aria-label={handle === "min" ? "Prix minimum" : "Prix maximum"}
              aria-valuemin={0}
              aria-valuemax={PRICE_MAX}
              aria-valuenow={handle === "min" ? min : max}
              tabIndex={0}
              onPointerDown={startDrag(handle)}
              style={{
                position: "absolute",
                top: 5,
                left: `calc(${pct}% - 7px)`,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "white",
                border: "2px solid var(--k-primary)",
                cursor: "grab",
                touchAction: "none",
              }}
            />
          );
        })}
      </div>
    </>
  );
}

function FilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        paddingBottom: last ? 0 : 20,
        marginBottom: last ? 0 : 20,
        borderBottom: last ? "none" : "1px solid var(--k-border-subtle)",
      }}
    >
      <div className="k-overline" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--k-text-body)" }}>{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onChange(!value);
        }}
        aria-pressed={value}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          border: 0,
          background: value ? "var(--k-primary)" : "var(--k-border)",
          position: "relative",
          cursor: "pointer",
          transition: "background 160ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "white",
            transition: "left 160ms",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    </label>
  );
}
