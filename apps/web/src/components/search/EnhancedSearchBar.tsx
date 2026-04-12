"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Filter,
  History,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";

// Cities for DRC and Congo-Brazzaville
const cities = [
  { value: "Kinshasa", label: "Kinshasa", country: "RDC" },
  { value: "Brazzaville", label: "Brazzaville", country: "Congo" },
  { value: "Lubumbashi", label: "Lubumbashi", country: "RDC" },
  { value: "Matadi", label: "Matadi", country: "RDC" },
  { value: "Pointe-Noire", label: "Pointe-Noire", country: "Congo" },
];

// Time slots
const timeSlots = [
  { value: "morning", label: "Matin", icon: Sun, time: "6h - 12h" },
  { value: "afternoon", label: "Après-midi", icon: Sunset, time: "12h - 18h" },
  { value: "evening", label: "Soir", icon: Moon, time: "18h - 22h" },
];

// Price range filters
const priceRanges = [
  { value: "budget", label: "Économique", description: "Moins de 15 000 CDF", color: "bg-emerald-500" },
  { value: "standard", label: "Standard", description: "15 000 - 50 000 CDF", color: "bg-blue-500" },
  { value: "premium", label: "Premium", description: "Plus de 50 000 CDF", color: "bg-purple-500" },
];

// Popular searches with gradient colors
const popularSearches = [
  { term: "Plombier", gradient: "from-blue-500 to-cyan-500" },
  { term: "Électricien", gradient: "from-amber-500 to-orange-500" },
  { term: "Femme de ménage", gradient: "from-emerald-500 to-teal-500" },
  { term: "Coiffeur", gradient: "from-pink-500 to-rose-500" },
  { term: "Maçon", gradient: "from-orange-500 to-red-500" },
  { term: "Mécanicien", gradient: "from-violet-500 to-purple-500" },
];

// Service suggestions for autocomplete
const serviceSuggestions = [
  "Plombier", "Électricien", "Femme de ménage", "Coiffeur", "Maçon",
  "Mécanicien", "Jardinier", "Peintre", "Menuisier", "Coursier",
  "Cuisinier", "Chauffeur", "Réparateur électroménager",
  "Développeur informatique", "Photographe",
];

interface EnhancedSearchBarProps {
  onSearch?: (params: SearchParams) => void;
  className?: string;
  showPopularSearches?: boolean;
  variant?: "hero" | "inline";
}

export interface SearchParams {
  query: string;
  city: string;
  date: Date | null;
  timeSlot: string;
  availableNow: boolean;
  priceRange: string;
}

const RECENT_SEARCHES_KEY = "kayou_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function EnhancedSearchBar({
  onSearch,
  className,
  showPopularSearches = true,
  variant = "hero",
}: EnhancedSearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Kinshasa");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const hasLoadedFromStorage = useRef(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }
    return [];
  });

  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
      } catch {
        // Ignore errors
      }
    }
    hasLoadedFromStorage.current = true;
  }, [recentSearches]);

  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  }, [recentSearches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        const filtered = serviceSuggestions.filter((suggestion) =>
          suggestion.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredSuggestions(filtered.slice(0, 6));
      } else {
        setFilteredSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !selectedCity) return;

    setIsSearching(true);
    saveToRecentSearches(query);

    const searchParams: SearchParams = {
      query,
      city: selectedCity,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      availableNow,
      priceRange: selectedPriceRange,
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (selectedCity) params.set("city", selectedCity);
      if (selectedDate) params.set("date", selectedDate.toISOString());
      if (selectedTimeSlot) params.set("time", selectedTimeSlot);
      if (availableNow) params.set("available", "true");
      if (selectedPriceRange) params.set("price", selectedPriceRange);

      router.push(`/services?${params.toString()}`);
    }

    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  }, [query, selectedCity, selectedDate, selectedTimeSlot, availableNow, selectedPriceRange, onSearch, router, saveToRecentSearches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setQuery("");
    setSelectedDate(null);
    setSelectedTimeSlot("");
    setAvailableNow(false);
    setSelectedPriceRange("");
  };

  const hasAdvancedFilters = selectedDate || selectedTimeSlot || availableNow || selectedPriceRange;

  const handlePopularSearchClick = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    saveToRecentSearches(term);

    const searchParams: SearchParams = {
      query: term,
      city: selectedCity,
      date: null,
      timeSlot: "",
      availableNow: false,
      priceRange: "",
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      const params = new URLSearchParams();
      params.set("q", term);
      if (selectedCity) params.set("city", selectedCity);
      router.push(`/services?${params.toString()}`);
    }
  };

  const isHero = variant === "hero";

  return (
    <div className={cn("w-full", className)}>
      {/* Main Search Bar - Glassmorphism Style */}
      <div
        className={cn(
          "bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 sm:p-5 border border-white/10 transition-all duration-300",
        )}
      >
        <div className="flex flex-col gap-4">
          {/* Primary Search Row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input with Suggestions */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Quel service recherchez-vous ?"
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white",
                  "placeholder:text-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20",
                  "transition-all duration-300"
                )}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && (filteredSuggestions.length > 0 || recentSearches.length > 0) && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0d0d12]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden"
                >
                  {/* Recent Searches */}
                  {!query && recentSearches.length > 0 && (
                    <div className="p-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 font-medium">
                        <History className="h-3 w-3" />
                        Recherches récentes
                      </div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 text-left text-sm text-white/70 transition-colors"
                          onClick={() => {
                            setQuery(search);
                            setShowSuggestions(false);
                          }}
                        >
                          <History className="h-3.5 w-3.5 text-white/30" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Service Suggestions */}
                  {filteredSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        Suggestions
                      </div>
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 text-left text-sm text-white/70 transition-colors"
                          onClick={() => {
                            setQuery(suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          <Search className="h-3.5 w-3.5 text-white/30" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* City Select */}
            <div className="relative md:w-48">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 z-10" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white h-auto focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#0d0d12]/95 backdrop-blur-xl border-white/10">
                  {cities.map((city) => (
                    <SelectItem key={city.value} value={city.value} className="rounded-lg text-white/70 hover:bg-white/5 focus:bg-white/5">
                      <div className="flex items-center gap-2">
                        <span>{city.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/20 text-white/50">
                          {city.country}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <GlassButton
              variant="primary"
              size="lg"
              className="h-12 md:h-auto px-8"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Recherche...
                </>
              ) : (
                <>
                  Rechercher
                  <Search className="ml-2 h-5 w-5" />
                </>
              )}
            </GlassButton>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              {hasAdvancedFilters && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-500/20 text-blue-400 text-xs border-blue-500/30">
                  {[
                    selectedDate && 1,
                    selectedTimeSlot && 1,
                    availableNow && 1,
                    selectedPriceRange && 1,
                  ].filter(Boolean).length}
                </Badge>
              )}
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {hasAdvancedFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-red-400/70 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Effacer les filtres
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showAdvancedFilters ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 h-12 text-white/70",
                      !selectedDate && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-white/40" />
                    {selectedDate ? (
                      format(selectedDate, "d MMMM yyyy", { locale: fr })
                    ) : (
                      "Date (optionnel)"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl bg-[#0d0d12]/95 backdrop-blur-xl border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date) => setSelectedDate(date || null)}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={fr}
                    className="rounded-xl text-white"
                  />
                </PopoverContent>
              </Popover>

              {/* Time Slot Selector */}
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 h-12 text-white/70">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/40" />
                    <SelectValue placeholder="Créneau horaire" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#0d0d12]/95 backdrop-blur-xl border-white/10">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value} className="rounded-lg text-white/70 hover:bg-white/5 focus:bg-white/5">
                      <div className="flex items-center gap-2">
                        <slot.icon className="h-4 w-4 text-white/50" />
                        <span>{slot.label}</span>
                        <span className="text-white/40 text-xs">({slot.time})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Availability Toggle */}
              <button
                onClick={() => setAvailableNow(!availableNow)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl transition-all h-12",
                  availableNow
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "relative flex h-3 w-3",
                    availableNow && "animate-pulse"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      availableNow ? "bg-emerald-400" : "bg-white/30"
                    )}
                    style={{ animation: availableNow ? "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite" : "none" }}
                  />
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      availableNow ? "bg-emerald-400" : "bg-white/50"
                    )}
                  />
                </div>
                <span className="text-sm font-medium">Disponible maintenant</span>
              </button>

              {/* Price Range Quick Filters */}
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 h-12 text-white/70">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/40" />
                    <SelectValue placeholder="Budget" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#0d0d12]/95 backdrop-blur-xl border-white/10">
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value} className="rounded-lg text-white/70 hover:bg-white/5 focus:bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", range.color)} />
                        <div>
                          <div className="font-medium">{range.label}</div>
                          <div className="text-xs text-white/40">{range.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Searches */}
      {showPopularSearches && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-5 sm:mt-6 px-2">
          <span className="text-white/40 text-xs sm:text-sm font-medium">Populaire:</span>
          {popularSearches.slice(0, isHero ? 4 : 6).map((search) => (
            <button
              key={search.term}
              onClick={() => handlePopularSearchClick(search.term)}
              className={cn(
                "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium transition-all hover:scale-105 active:scale-95 bg-gradient-to-r shadow-lg",
                search.gradient
              )}
            >
              {search.term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EnhancedSearchBar;
