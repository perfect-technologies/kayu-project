"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Users,
  Map,
  LayoutGrid,
  Home,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { ProviderCard, ProviderCardSkeleton } from "@/components/providers";
import { ProvidersMap } from "@/components/map/ProvidersMap";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { categoriesApi, providersApi, queryKeys } from "@kayu/api";

// Types
interface Subcategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  subcategories?: Subcategory[];
}

interface Provider {
  id: string;
  userId: string;
  profession: string;
  description?: string | null;
  hourlyRate?: number | null;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  isCertified: boolean;
  isPremium: boolean;
  isAvailable: boolean;
  experience?: number | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    city?: string | null;
    isVerified: boolean;
    latitude?: number | null;
    longitude?: number | null;
  };
  categories: Category[];
  serviceZones: Array<{
    city: string;
    commune?: string | null;
  }>;
}

// Cities in RDC and Congo
const cities = [
  { value: "Kinshasa", label: "Kinshasa" },
  { value: "Brazzaville", label: "Brazzaville" },
  { value: "Pointe-Noire", label: "Pointe-Noire" },
  { value: "Lubumbashi", label: "Lubumbashi" },
  { value: "Matadi", label: "Matadi" },
  { value: "Mbandaka", label: "Mbandaka" },
  { value: "Kisangani", label: "Kisangani" },
  { value: "Goma", label: "Goma" },
  { value: "Bukavu", label: "Bukavu" },
  { value: "Kananga", label: "Kananga" },
];

// Default categories (fallback)
const defaultCategories: Category[] = [
  { id: "1", name: "Ménage & Nettoyage", slug: "menage-nettoyage" },
  { id: "2", name: "Plomberie", slug: "plomberie" },
  { id: "3", name: "Électricité", slug: "electricite" },
  { id: "4", name: "BTP & Construction", slug: "btp-construction" },
  { id: "5", name: "Coiffure & Beauté", slug: "coiffure-beaute" },
  { id: "6", name: "Éducation & Soutien", slug: "education-soutien" },
  { id: "7", name: "Santé & Bien-être", slug: "sante-bien-etre" },
  { id: "8", name: "Transport", slug: "transport" },
  { id: "9", name: "Mécanique Auto", slug: "mecanique-auto" },
  { id: "10", name: "Informatique", slug: "informatique" },
];

// Breadcrumb Navigation Component
function BreadcrumbNav({
  selectedCategory,
  selectedSubcategory,
  categories,
  subcategories,
  onCategoryChange,
  onSubcategoryChange,
  onClearFilters,
  totalProviders,
}: {
  selectedCategory: string;
  selectedSubcategory: string;
  categories: Category[];
  subcategories: Subcategory[];
  onCategoryChange: (slug: string) => void;
  onSubcategoryChange: (slug: string) => void;
  onClearFilters: () => void;
  totalProviders?: number;
}) {
  const currentCategory = categories.find((c) => c.slug === selectedCategory);
  const currentSubcategory = subcategories.find((s) => s.slug === selectedSubcategory);

  return (
    <nav className="flex flex-col gap-2 mb-4">
      {/* Main breadcrumb row */}
      <div className="flex items-center gap-2 text-sm text-white/80 overflow-x-auto whitespace-nowrap">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-white transition-colors shrink-0"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Accueil</span>
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />

        {/* Category Dropdown or Link */}
        {selectedCategory && currentCategory ? (
          <>
            <Link
              href={`/categories/${selectedCategory}`}
              className={cn(
                "flex items-center gap-1 hover:text-white transition-colors rounded-full px-3 py-1",
                selectedSubcategory ? "bg-white/10" : "bg-white/20 font-medium text-white"
              )}
            >
              {currentCategory.icon && (
                <span className="text-base">{currentCategory.icon}</span>
              )}
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                {currentCategory.name}
              </span>
            </Link>

            {selectedSubcategory && currentSubcategory ? (
              <>
                <ChevronRight className="h-4 w-4 shrink-0" />
                <span className="bg-white/20 text-white font-medium rounded-full px-3 py-1 truncate max-w-[150px] md:max-w-[200px]">
                  {currentSubcategory.name}
                </span>
              </>
            ) : subcategories.length > 0 ? (
              <>
                <ChevronRight className="h-4 w-4 shrink-0" />
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 rounded-full px-3 py-1">
                    <span>Sous-catégorie</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border py-2 min-w-[220px] hidden group-hover:block z-50">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b mb-1">
                      Choisir une sous-catégorie
                    </div>
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSubcategoryChange(sub.slug)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        {sub.icon && <span className="text-lg">{sub.icon}</span>}
                        <span className="text-gray-700">{sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <Link
            href="/services"
            className={cn(
              "hover:text-white transition-colors rounded-full px-3 py-1",
              !selectedCategory ? "bg-white/20 font-medium text-white" : ""
            )}
          >
            Services
          </Link>
        )}

        {/* Clear filters button */}
        {(selectedCategory || selectedSubcategory) && (
          <button
            onClick={onClearFilters}
            className="ml-2 p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0"
            title="Effacer les filtres"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* "View all providers in [Category]" link - shown when subcategory is selected */}
      {selectedCategory && currentCategory && selectedSubcategory && (
        <div className="flex items-center gap-2">
          <Link
            href={`/categories/${selectedCategory}`}
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Voir toutes les sous-catégories de {currentCategory.name}
          </Link>
        </div>
      )}
    </nav>
  );
}

// Subcategory Pills Component
function SubcategoryPills({
  subcategories,
  selectedSubcategory,
  onSelect,
  categorySlug,
  totalProviders,
}: {
  subcategories: Subcategory[];
  selectedSubcategory: string;
  onSelect: (slug: string) => void;
  categorySlug: string;
  totalProviders?: number;
}) {
  if (subcategories.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Filtrer par sous-catégorie</h3>
        <Link
          href={`/categories/${categorySlug}`}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Voir la catégorie
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* All providers button */}
        <Link
          href={`/services?category=${categorySlug}`}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
            !selectedSubcategory
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
              : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
          )}
        >
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Tous
            {totalProviders !== undefined && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                !selectedSubcategory ? "bg-white/20" : "bg-gray-100"
              )}>
                {totalProviders}
              </span>
            )}
          </span>
        </Link>
        {/* Subcategory buttons */}
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.slug)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
              selectedSubcategory === sub.slug
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {sub.icon && <span className="mr-1.5">{sub.icon}</span>}
            {sub.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Price ranges in CDF
const priceRanges = [
  { min: 0, max: 5000, label: "Moins de 5 000 CDF" },
  { min: 5000, max: 15000, label: "5 000 - 15 000 CDF" },
  { min: 15000, max: 30000, label: "15 000 - 30 000 CDF" },
  { min: 30000, max: 50000, label: "30 000 - 50 000 CDF" },
  { min: 50000, max: 100000, label: "50 000 - 100 000 CDF" },
  { min: 100000, max: 0, label: "Plus de 100 000 CDF" },
];

export function ServicesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Filter state - initialize with empty defaults to prevent hydration mismatch
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Initialize state from URL params after mount
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

  // Mobile filter sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // View mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Build search params object for React Query
  const searchParamsObj = useMemo(() => ({
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
    subcategory: selectedSubcategory || undefined,
    city: selectedCity || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
    available: availableOnly || undefined,
    verified: verifiedOnly || undefined,
    page,
    limit: 12,
  }), [searchQuery, selectedCategory, selectedSubcategory, selectedCity, minRating, priceRange, availableOnly, verifiedOnly, page]);

  // Fetch providers with React Query
  const {
    data: providersData,
    isLoading: loading,
    isError,
    refetch: fetchProviders,
  } = useQuery({
    queryKey: queryKeys.providers.search(searchParamsObj),
    queryFn: () => providersApi(apiClient).search(searchParamsObj as Record<string, string | number | boolean | undefined>),
    enabled: mounted,
    placeholderData: (prev) => prev,
  });

  const providers = (providersData?.providers ?? []) as Provider[];
  const total = providersData?.pagination?.total ?? 0;
  const totalPages = providersData?.pagination?.totalPages ?? 1;

  // Fetch categories with React Query
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.hierarchy,
    queryFn: () => categoriesApi(apiClient).getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = useMemo(() => {
    if (!categoriesData) return defaultCategories;
    const catArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).categories ?? [];
    return catArray.map((cat: any) => ({
      id: cat.id ?? "",
      name: cat.name,
      slug: cat.slug ?? "",
      icon: cat.icon ?? null,
      color: cat.color ?? null,
      subcategories: (cat.subcategories ?? []).map((sub: any) => ({
        id: sub.id ?? "",
        name: sub.name,
        slug: sub.slug ?? "",
        icon: sub.icon ?? null,
      })),
    }));
  }, [categoriesData]);

  // Get subcategories for the selected category
  const subcategories: Subcategory[] = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find((c) => c.slug === selectedCategory);
    return cat?.subcategories ?? [];
  }, [categories, selectedCategory]);

  // Update URL with filters
  const updateUrl = useCallback(
    (newParams: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams();

      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
      if (selectedCity) params.set("city", selectedCity);
      if (minRating > 0) params.set("minRating", minRating.toString());
      if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
      if (priceRange[1] < 100000) params.set("maxPrice", priceRange[1].toString());
      if (availableOnly) params.set("available", "true");
      if (verifiedOnly) params.set("verified", "true");
      if (page > 1) params.set("page", page.toString());

      // Override with new params
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== 0 && value !== false) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`/services?${params.toString()}`, { scroll: false });
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
    ]
  );

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ page: null });
  };

  // Clear all filters
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

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return !!(
      searchQuery ||
      selectedCategory ||
      selectedSubcategory ||
      selectedCity ||
      minRating > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < 100000 ||
      availableOnly ||
      verifiedOnly
    );
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedCity, minRating, priceRange, availableOnly, verifiedOnly]);

  // Filter content component (shared between sidebar and mobile sheet)
  const FilterContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={`space-y-6 ${inSheet ? "" : "sticky top-24"}`}>
      {/* Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Recherche</Label>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom, profession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Catégorie</Label>
        <Select
          value={selectedCategory || "_all"}
          onValueChange={(value) => {
            const newValue = value === "_all" ? "" : value;
            setSelectedCategory(newValue);
            setSelectedSubcategory("");
            setPage(1);
            updateUrl({ category: newValue || null, subcategory: null, page: null });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory Filter */}
      {selectedCategory && subcategories.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Sous-catégorie</Label>
          <Select
            value={selectedSubcategory || "_all"}
            onValueChange={(value) => {
              const newValue = value === "_all" ? "" : value;
              setSelectedSubcategory(newValue);
              setPage(1);
              updateUrl({ subcategory: newValue || null, page: null });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les sous-catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Toutes les sous-catégories</SelectItem>
              {subcategories.map((subcat) => (
                <SelectItem key={subcat.id} value={subcat.slug}>
                  {subcat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* City Filter */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Ville</Label>
        <Select
          value={selectedCity || "_all"}
          onValueChange={(value) => {
            const newValue = value === "_all" ? "" : value;
            setSelectedCity(newValue);
            setPage(1);
            updateUrl({ city: newValue || null, page: null });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les villes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Toutes les villes</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Note minimum</Label>
        <RadioGroup
          value={minRating.toString()}
          onValueChange={(value) => {
            setMinRating(parseFloat(value));
            setPage(1);
            updateUrl({ minRating: parseFloat(value) || null, page: null });
          }}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="0" id="rating-any" />
            <Label htmlFor="rating-any" className="text-sm font-normal cursor-pointer">
              Toutes les notes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="rating-3" />
            <Label htmlFor="rating-3" className="text-sm font-normal cursor-pointer flex items-center gap-1">
              3+ <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4" id="rating-4" />
            <Label htmlFor="rating-4" className="text-sm font-normal cursor-pointer flex items-center gap-1">
              4+ <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4.5" id="rating-4.5" />
            <Label htmlFor="rating-4.5" className="text-sm font-normal cursor-pointer flex items-center gap-1">
              4.5+ <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Tarif horaire (CDF)
        </Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={100000}
            step={5000}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{priceRange[0].toLocaleString()} CDF</span>
            <span>{priceRange[1] >= 100000 ? "100 000+" : priceRange[1].toLocaleString()} CDF</span>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={(checked) => {
              setAvailableOnly(checked as boolean);
              setPage(1);
              updateUrl({ available: checked || null, page: null });
            }}
          />
          <Label htmlFor="available" className="text-sm font-normal cursor-pointer">
            Disponible maintenant
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={(checked) => {
              setVerifiedOnly(checked as boolean);
              setPage(1);
              updateUrl({ verified: checked || null, page: null });
            }}
          />
          <Label htmlFor="verified" className="text-sm font-normal cursor-pointer flex items-center gap-1">
            <BadgeCheck className="h-4 w-4 text-primary" />
            Certifiés uniquement
          </Label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );

  // Active filters badges
  const ActiveFiltersBadges = () => {
    if (!hasActiveFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {searchQuery && (
          <Badge variant="secondary" className="gap-1">
            &quot;{searchQuery}&quot;
            <button
              onClick={() => {
                setSearchQuery("");
                updateUrl({ q: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedCategory && (
          <Badge variant="secondary" className="gap-1">
            {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedSubcategory("");
                updateUrl({ category: null, subcategory: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedSubcategory && (
          <Badge variant="secondary" className="gap-1">
            <ChevronRight className="h-3 w-3" />
            {subcategories.find((s) => s.slug === selectedSubcategory)?.name || selectedSubcategory}
            <button
              onClick={() => {
                setSelectedSubcategory("");
                updateUrl({ subcategory: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedCity && (
          <Badge variant="secondary" className="gap-1">
            <MapPin className="h-3 w-3" />
            {selectedCity}
            <button
              onClick={() => {
                setSelectedCity("");
                updateUrl({ city: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {minRating > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {minRating}+
            <button
              onClick={() => {
                setMinRating(0);
                updateUrl({ minRating: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {verifiedOnly && (
          <Badge variant="secondary" className="gap-1">
            <BadgeCheck className="h-3 w-3 text-primary" />
            Certifiés
            <button
              onClick={() => {
                setVerifiedOnly(false);
                updateUrl({ verified: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {availableOnly && (
          <Badge variant="secondary" className="gap-1">
            Disponibles
            <button
              onClick={() => {
                setAvailableOnly(false);
                updateUrl({ available: null });
              }}
              className="ml-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Show loading spinner during hydration */}
      {!mounted && (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {mounted && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="container mx-auto px-4 py-6 md:py-8">
              {/* Breadcrumb */}
              <BreadcrumbNav
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                categories={categories}
                subcategories={subcategories}
                onCategoryChange={(slug) => {
                  setSelectedCategory(slug);
                  setSelectedSubcategory("");
                  updateUrl({ category: slug, subcategory: null, page: null });
                }}
                onSubcategoryChange={(slug) => {
                  setSelectedSubcategory(slug);
                  updateUrl({ subcategory: slug, page: null });
                }}
                onClearFilters={clearFilters}
                totalProviders={total}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                    {selectedCategory && categories.find((c) => c.slug === selectedCategory)?.name
                      ? `${categories.find((c) => c.slug === selectedCategory)?.name}`
                      : "Trouvez votre prestataire"}
                  </h1>
                  <p className="text-white/80 mt-1 md:mt-2 text-sm md:text-base lg:text-lg">
                    {total > 0
                      ? `${total.toLocaleString()} prestataire${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}`
                      : "Recherchez parmi nos prestataires vérifiés"}
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center bg-white/10 rounded-lg md:rounded-xl p-0.5 md:p-1">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-white text-blue-600 hover:bg-white/90 h-8 md:h-9" : "text-white hover:bg-white/10 h-8 md:h-9"}
                    >
                      <LayoutGrid className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="text-xs md:text-sm">Liste</span>
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("map")}
                      className={viewMode === "map" ? "bg-white text-blue-600 hover:bg-white/90 h-8 md:h-9" : "text-white hover:bg-white/10 h-8 md:h-9"}
                    >
                      <Map className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="text-xs md:text-sm">Carte</span>
                    </Button>
                  </div>

                  {/* Mobile Filter Button */}
                  <div className="lg:hidden">
                    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="gap-1.5 md:gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 md:h-9">
                          <SlidersHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm">Filtres</span>
                          {hasActiveFilters && (
                            <Badge className="ml-0.5 md:ml-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] md:text-xs">
                              !
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[280px] sm:w-[300px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle className="text-lg">Filtres</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          <FilterContent inSheet />
                        </div>
                        <SheetFooter className="mt-6">
                          <Button
                            onClick={() => setFilterSheetOpen(false)}
                            className="w-full"
                          >
                            Appliquer
                          </Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="flex gap-4 md:gap-6 lg:gap-8">
              {/* Sidebar - Desktop (only show in list view) */}
              {viewMode === "list" && (
                <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
                  <Card className="rounded-xl md:rounded-2xl">
                    <CardHeader className="pb-2 md:pb-3">
                      <CardTitle className="text-base md:text-lg">Filtres</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FilterContent />
                    </CardContent>
                  </Card>
                </aside>
              )}

              {/* Provider Grid or Map */}
              <div className="flex-1 min-w-0">
                {/* Subcategory Pills - only show when category is selected */}
                {selectedCategory && subcategories.length > 0 && viewMode === "list" && (
                  <SubcategoryPills
                    subcategories={subcategories}
                    selectedSubcategory={selectedSubcategory}
                    onSelect={(slug) => {
                      setSelectedSubcategory(slug);
                      updateUrl({ subcategory: slug, page: null });
                    }}
                    categorySlug={selectedCategory}
                    totalProviders={total}
                  />
                )}

                {/* Active Filters Badges */}
                <ActiveFiltersBadges />

                {/* Map View */}
                {viewMode === "map" && (
                  <ProvidersMap
                    providers={providers}
                    height="600px"
                    showControls={true}
                  />
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <>
                    {/* Loading State */}
                    {loading && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {[...Array(6)].map((_, i) => (
                          <ProviderCardSkeleton key={i} />
                        ))}
                      </div>
                    )}

                    {/* Error State */}
                    {isError && !loading && (
                      <div className="text-center py-8 md:py-12">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 md:mb-4">
                          <X className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Erreur</h3>
                        <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                          Erreur lors du chargement des prestataires
                        </p>
                        <Button onClick={() => fetchProviders()}>Réessayer</Button>
                      </div>
                    )}

                    {/* Empty State */}
                    {!loading && !isError && providers.length === 0 && (
                      <div className="text-center py-8 md:py-12">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 md:mb-4">
                          <Users className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
                          Aucun prestataire trouvé
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                          Essayez de modifier vos critères de recherche
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                          Réinitialiser les filtres
                        </Button>
                      </div>
                    )}

                    {/* Provider Cards */}
                    {!loading && !isError && providers.length > 0 && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                          {providers.map((provider) => (
                            <ProviderCard key={provider.id} provider={provider} />
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page === 1}
                              onClick={() => {
                                const newPage = page - 1;
                                setPage(newPage);
                                updateUrl({ page: newPage > 1 ? newPage : null });
                              }}
                              className="h-8 md:h-9"
                            >
                              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              <span className="text-xs md:text-sm">Précédent</span>
                            </Button>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              Page {page} sur {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page >= totalPages}
                              onClick={() => {
                                const newPage = page + 1;
                                setPage(newPage);
                                updateUrl({ page: newPage });
                              }}
                              className="h-8 md:h-9"
                            >
                              <span className="text-xs md:text-sm">Suivant</span>
                              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
