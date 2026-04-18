"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  BadgeCheck,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  WideProviderCard,
  WideProviderCardSkeleton,
} from "@kayu/ui/web";
import type { ProviderCardData } from "@kayu/ui";
import { apiClient } from "@/lib/api";
import { categoriesApi, providersApi, queryKeys } from "@kayu/api";
import { toProviderCardData, resolveCategorySlug } from "@/lib/provider-card";

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
  const [selectedCity, setSelectedCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("pertinence");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
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

  const searchParamsObj = useMemo(
    () => ({
      q: searchQuery || undefined,
      category: selectedCategory || undefined,
      city: selectedCity || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
      available: availableOnly || undefined,
      verified: verifiedOnly || undefined,
      page,
      limit: 12,
    }),
    [
      searchQuery,
      selectedCategory,
      selectedCity,
      minRating,
      priceRange,
      availableOnly,
      verifiedOnly,
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
    }));
  }, [categoriesData]);

  const updateUrl = useCallback(
    (extra: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
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
    setSelectedCity("");
    setMinRating(0);
    setPriceRange([0, 100000]);
    setAvailableOnly(false);
    setVerifiedOnly(false);
    setPage(1);
    router.push("/services", { scroll: false });
  };

  const headingLabel = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name
    : "Tous les pros";

  if (!mounted) {
    return (
      <div
        style={{ background: "var(--k-bg)" }}
        className="mx-auto max-w-[1400px] px-5 py-6 md:px-8"
      >
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr_440px]">
          <div
            className="hidden rounded-[var(--k-r-lg)] lg:block"
            style={{
              height: 520,
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
            }}
          />
          <div className="space-y-3.5">
            {[...Array(4)].map((_, i) => (
              <WideProviderCardSkeleton key={i} />
            ))}
          </div>
          <div className="hidden lg:block" />
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
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-4 md:px-8">
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

      <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-6 md:px-8 lg:grid-cols-[260px_1fr_440px]">
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
              setPage(1);
              updateUrl({ category: slug || null, page: null });
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
                pros · mis à jour il y a quelques instants
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="k-caption">Trier par</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-[var(--k-r-sm)] px-2.5 py-1.5 text-[13px] font-medium"
                style={{
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-border)",
                  color: "var(--k-text-primary)",
                }}
              >
                <option value="pertinence">Pertinence</option>
                <option value="note">Note</option>
                <option value="distance">Distance</option>
                <option value="prix">Prix</option>
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
              <Check className="h-[13px] w-[13px]" /> Disponible maintenant
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
            <FilterPill>{`< 20 km`}</FilterPill>
            <FilterPill>Top rated</FilterPill>
            <FilterPill>
              <Award className="h-[13px] w-[13px]" /> Expert
            </FilterPill>
          </div>

          {loading && (
            <div className="grid gap-3.5">
              {[...Array(3)].map((_, i) => (
                <WideProviderCardSkeleton key={i} />
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
              <div className="grid gap-3.5">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <WideProviderCard
                      provider={p}
                      onClick={() => router.push(`/providers/${p.id}`)}
                    />
                  </div>
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

        {/* MAP */}
        <aside
          className="sticky top-[104px] hidden self-start lg:block"
          style={{ height: "calc(100vh - 140px)" }}
        >
          <MapPanel
            providers={providers}
            hoveredId={hoveredId}
            onPinClick={(id) => router.push(`/providers/${id}`)}
          />
        </aside>
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
                setPage(1);
                updateUrl({ category: slug || null, page: null });
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
  return (
    <div
      className="rounded-[var(--k-r-lg)] p-5"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
      }}
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="k-heading" style={{ margin: 0 }}>
          Filtres
        </h3>
        <button
          onClick={onClear}
          className="k-btn k-btn-ghost k-btn-sm"
          style={{ padding: 0, height: "auto" }}
        >
          Effacer
        </button>
      </div>

      <FilterSection title="Catégorie">
        <div className="grid gap-1.5">
          {categories.slice(0, 8).map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2.5 text-[14px]"
            >
              <input
                type="checkbox"
                checked={selectedCategory === c.slug}
                onChange={() =>
                  onCategory(selectedCategory === c.slug ? "" : c.slug)
                }
                className="h-4 w-4 cursor-pointer accent-[var(--k-primary)]"
              />
              <CategoryMini slug={c.slug} />
              <span style={{ color: "var(--k-text-body)" }}>{c.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Prix horaire">
        <div className="k-caption k-num mb-2 flex justify-between">
          <span>{priceRange[0].toLocaleString("fr-FR")} FC</span>
          <span>
            {priceRange[1] >= 100000
              ? "100 000+"
              : priceRange[1].toLocaleString("fr-FR")}{" "}
            FC
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100000}
          step={5000}
          value={priceRange[1]}
          onChange={(e) => onPriceRange([priceRange[0], Number(e.target.value)])}
          onMouseUp={() => onPriceCommit(priceRange)}
          onTouchEnd={() => onPriceCommit(priceRange)}
          className="w-full"
          style={{ accentColor: "var(--k-primary)" }}
        />
      </FilterSection>

      <FilterSection title="Note minimum">
        <div className="flex gap-1.5">
          {[5, 4, 3].map((n) => (
            <button
              key={n}
              onClick={() => onMinRating(minRating === n ? 0 : n)}
              className="inline-flex items-center gap-1"
              style={{
                padding: "6px 10px",
                borderRadius: 9999,
                border: `1px solid ${minRating === n ? "var(--k-primary)" : "var(--k-border)"}`,
                background:
                  minRating === n ? "var(--k-primary-subtle)" : "var(--k-surface)",
                color:
                  minRating === n ? "var(--k-primary-hover)" : "var(--k-text-body)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Star className="h-3 w-3" style={{ color: "var(--k-warning)" }} />
              {n}+
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Disponibilité">
        <Toggle
          label="Disponible maintenant"
          value={availableOnly}
          onChange={onAvailable}
        />
      </FilterSection>

      <FilterSection title="Confiance" last>
        <Toggle
          label="Vérifié"
          value={verifiedOnly}
          onChange={onVerified}
        />
      </FilterSection>
    </div>
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
    <label className="flex cursor-pointer items-center justify-between py-1.5 text-[14px]">
      <span style={{ color: "var(--k-text-body)" }}>{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onChange(!value);
        }}
        style={{
          width: 36,
          height: 20,
          borderRadius: 9999,
          border: 0,
          background: value ? "var(--k-primary)" : "var(--k-border)",
          position: "relative",
          cursor: "pointer",
          transition: "background 160ms",
        }}
        aria-pressed={value}
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

function CategoryMini({ slug }: { slug: string }) {
  const resolved = resolveCategorySlug(slug);
  const tintMap: Record<string, { bg: string; fg: string }> = {
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
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        background: tint.bg,
      }}
    />
  );
}

function MapPanel({
  providers,
  hoveredId,
  onPinClick,
}: {
  providers: ProviderCardData[];
  hoveredId: string | null;
  onPinClick: (id: string) => void;
}) {
  const pins = providers.slice(0, 6);
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[var(--k-r-md)]"
      style={{
        border: "1px solid var(--k-border)",
        boxShadow: "var(--k-e1)",
        background: "var(--k-surface-primary)",
      }}
    >
      <svg
        viewBox="0 0 440 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" stroke="#E0F2FE" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="440" height="800" fill="#F0F9FF" />
        <rect width="440" height="800" fill="url(#mapGrid)" />
        <path
          d="M -20 420 Q 80 390 160 440 T 320 480 T 480 430"
          stroke="#BAE6FD"
          strokeWidth="64"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M -20 420 Q 80 390 160 440 T 320 480 T 480 430"
          stroke="#7DD3FC"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 40 80 L 200 200 L 240 360 L 180 520 L 220 700"
          stroke="#CBD5E1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 400 60 L 320 180 L 280 340 L 300 520 L 360 720"
          stroke="#CBD5E1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="110" cy="270" rx="50" ry="32" fill="#DCFCE7" opacity="0.7" />
        <ellipse cx="340" cy="580" rx="44" ry="38" fill="#DCFCE7" opacity="0.7" />
        <text x="100" y="170" fontSize="11" fill="#94A3B8" fontWeight="500">
          GOMBE
        </text>
        <text x="320" y="280" fontSize="11" fill="#94A3B8" fontWeight="500">
          LIMETE
        </text>
        <text x="90" y="560" fontSize="11" fill="#94A3B8" fontWeight="500">
          LEMBA
        </text>
        <text x="300" y="700" fontSize="11" fill="#94A3B8" fontWeight="500">
          NGABA
        </text>
      </svg>

      {pins.map((p, i) => {
        const positions = [
          { x: 30, y: 22 },
          { x: 65, y: 35 },
          { x: 42, y: 55 },
          { x: 72, y: 62 },
          { x: 25, y: 70 },
          { x: 55, y: 80 },
        ];
        const pos = positions[i] || { x: 50, y: 50 };
        const isHot = hoveredId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onPinClick(p.id)}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -100%) scale(${isHot ? 1.15 : 1})`,
              transition: "transform 200ms var(--k-ease-bounce)",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              zIndex: isHot ? 10 : 1,
            }}
          >
            <div
              style={{
                background: isHot ? "var(--k-primary)" : "white",
                color: isHot ? "white" : "var(--k-text-primary)",
                border: `2px solid ${isHot ? "var(--k-primary)" : "var(--k-border-strong)"}`,
                borderRadius: 9999,
                padding: "4px 12px",
                boxShadow: isHot ? "var(--k-e3)" : "var(--k-e1)",
                fontFamily: "var(--k-font-mono)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {Math.round((p.hourly || 0) / 1000)}k
            </div>
          </button>
        );
      })}

      <div
        className="absolute right-3 top-3 overflow-hidden rounded-lg"
        style={{ background: "white", boxShadow: "var(--k-e2)" }}
      >
        <button
          className="flex h-9 w-9 items-center justify-center"
          aria-label="Zoom avant"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div style={{ height: 1, background: "var(--k-border)" }} />
        <button
          className="flex h-9 w-9 items-center justify-center"
          aria-label="Zoom arrière"
        >
          –
        </button>
      </div>
      <div
        className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
        style={{
          background: "white",
          border: "1px solid var(--k-border)",
          color: "var(--k-text-muted)",
        }}
      >
        <MapPin className="h-3 w-3" /> Kinshasa
      </div>

    </div>
  );
}
