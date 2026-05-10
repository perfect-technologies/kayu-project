import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ProviderSearchParams } from '@kayu/schemas';
import {
  CategoryStrip,
  I,
  WideProviderCard,
  WideProviderCardSkeleton,
  type CategoryStripItem,
} from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { FloatingBackButton, IconButton } from '@/components/shell';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  buildCategoryLookup,
  providerToCardData,
} from '@/lib/providerAdapter';
import {
  MobileFilterSheet,
  MOBILE_SORT_LABELS,
  EMPTY_FILTERS,
  type MobileFilters,
} from './components/MobileFilterSheet';
import type { SearchStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'SearchMain'>;
type Route = RouteProp<SearchStackParamList, 'SearchMain'>;

function parseFilterNumber(raw: string): number | undefined {
  const normalized = raw.trim();
  if (!normalized) return undefined;
  const value = Number.parseInt(normalized, 10);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const initialCategory = route.params?.category ?? null;

  const [filters, setFilters] = useState<MobileFilters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (route.params?.category) {
      setFilters((f) => ({
        ...f,
        category: route.params!.category!,
        subcategory: null,
      }));
    }
  }, [route.params?.category]);

  const searchParams = useMemo<Partial<ProviderSearchParams>>(
    () => ({
      category: filters.category ?? undefined,
      subcategory: filters.subcategory ?? undefined,
      q: filters.q.trim() || undefined,
      city: filters.city.trim() || undefined,
      available: filters.available || undefined,
      verified: filters.verified || undefined,
      minRating: filters.minRating ?? undefined,
      minPrice: parseFilterNumber(filters.minPrice),
      maxPrice: parseFilterNumber(filters.maxPrice),
      sortBy:
        filters.sort === 'newest'
          ? 'createdAt'
          : filters.sort === 'price_low' || filters.sort === 'price_high'
            ? 'hourlyRate'
            : 'recommended',
      sortOrder:
        filters.sort === 'price_high'
          ? 'desc'
          : filters.sort === 'price_low'
            ? 'asc'
            : undefined,
      limit: 30,
    }),
    [filters],
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.hierarchy,
    queryFn: () => api.categories.getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });

  const apiCategories = useMemo(() => {
    const arr = Array.isArray(categoriesData)
      ? categoriesData
      : ((categoriesData as { categories?: unknown[] } | undefined)?.categories ?? []);
    return (arr as Array<Record<string, unknown>>).map((cat) => ({
      slug: (cat.slug as string) ?? '',
      name: (cat.name as string) ?? '',
      icon: (cat.icon as string | null) ?? null,
      color: (cat.color as string | null) ?? null,
      subcategories: Array.isArray(cat.subcategories)
        ? (cat.subcategories as Array<Record<string, unknown>>).map((sub) => ({
            slug: (sub.slug as string) ?? '',
            name: (sub.name as string) ?? '',
          }))
        : [],
    }));
  }, [categoriesData]);

  const categoryLookup = useMemo(
    () => buildCategoryLookup(apiCategories),
    [apiCategories],
  );

  const stripItems: CategoryStripItem[] = useMemo(
    () =>
      apiCategories
        .filter((c) => c.slug.length > 0)
        .slice(0, 8)
        .map((c) => ({
          slug: c.slug,
          label: c.name,
          iconName: c.icon ?? undefined,
          color: c.color ?? undefined,
        })),
    [apiCategories],
  );

  const filterCategories = useMemo(
    () =>
      apiCategories
        .filter((c) => c.slug.length > 0)
        .map((c) => ({
          slug: c.slug,
          label: c.name,
          icon: c.icon,
          color: c.color,
          subcategories: c.subcategories
            .filter((s) => s.slug.length > 0)
            .map((s) => ({ slug: s.slug, label: s.name })),
        })),
    [apiCategories],
  );

  const {
    data: providersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.providers.search(searchParams),
    queryFn: () => api.providers.search(searchParams),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rawProviders = providersData?.providers ?? [];
  const cards = useMemo(
    () => rawProviders.map((p) => providerToCardData(p, categoryLookup)),
    [rawProviders, categoryLookup],
  );
  const totalResults = providersData?.pagination.total ?? cards.length;
  const locationLabel = filters.city.trim() || 'Toutes zones';

  const goToProfile = (providerId: string) => {
    navigation.navigate('ProviderProfile', { providerId });
  };

  const queryLabel =
    filters.q.trim() ||
    (filters.category
      ? (apiCategories.find((c) => c.slug === filters.category)?.name ??
        filters.category)
      : 'Trouver un pro');

  const hasBudgetFilter = Boolean(filters.minPrice.trim() || filters.maxPrice.trim());

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Sticky compact header */}
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.headerRow}>
            <FloatingBackButton
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  (navigation.getParent() as any)?.navigate('Home');
                }
              }}
            />
            <Pressable
              accessibilityRole="search"
              accessibilityLabel={queryLabel}
              style={styles.queryPill}
              onPress={() => setSheetOpen(true)}
            >
              <I.search size={16} color={theme.colors.textPrimary} />
              <View style={styles.queryPillMid}>
                <Text style={styles.queryTitle} numberOfLines={1}>
                  {queryLabel}
                </Text>
                <Text style={styles.queryCaption} numberOfLines={1}>
                  {locationLabel} · {totalResults} pros
                </Text>
              </View>
            </Pressable>
            <IconButton
              accessibilityLabel="Ouvrir les filtres"
              size={40}
              onPress={() => setSheetOpen(true)}
            >
              <I.sliders size={18} color={theme.colors.textPrimary} />
            </IconButton>
          </View>

          {/* Category strip */}
          <CategoryStrip
            items={stripItems}
            active={filters.category ?? undefined}
            onSelect={(slug) =>
              setFilters((f) => ({
                ...f,
                category: f.category === slug ? null : slug,
                subcategory: null,
              }))
            }
          />

          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            <FilterPill
              active={filters.available}
              onPress={() =>
                setFilters((f) => ({ ...f, available: !f.available }))
              }
            >
              Accepte les demandes
            </FilterPill>
            <FilterPill
              active={filters.verified}
              onPress={() =>
                setFilters((f) => ({ ...f, verified: !f.verified }))
              }
            >
              Vérifié
            </FilterPill>
            {filters.city.trim() ? (
              <FilterPill active onPress={() => setSheetOpen(true)}>
                {filters.city.trim()}
              </FilterPill>
            ) : null}
            {filters.minRating != null ? (
              <FilterPill active onPress={() => setSheetOpen(true)}>
                {`${filters.minRating.toFixed(1)}+`}
              </FilterPill>
            ) : null}
            {hasBudgetFilter ? (
              <FilterPill active onPress={() => setSheetOpen(true)}>
                Budget
              </FilterPill>
            ) : null}
          </ScrollView>
        </View>

        {/* Result summary row */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>
            {totalResults} pros
          </Text>
          <Pressable hitSlop={6} style={styles.sortBtn} onPress={() => setSheetOpen(true)}>
            <Text style={styles.sortText}>{MOBILE_SORT_LABELS[filters.sort]}</Text>
            <I.chevronDown size={13} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        {/* Results body */}
        {error ? (
          <View style={styles.emptyWrap}>
            <ErrorState onRetry={() => refetch()} />
          </View>
        ) : (
          <View style={styles.resultsList}>
            {isLoading && cards.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <WideProviderCardSkeleton key={i} style={{ marginBottom: 16 }} />
              ))
            ) : cards.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="Aucun pro trouvé"
                message="Élargis la zone ou retire un filtre."
              />
            ) : (
              cards.map((c) => (
                <WideProviderCard
                  key={c.id}
                  provider={c}
                  onPress={goToProfile}
                  style={styles.card}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <MobileFilterSheet
        open={sheetOpen}
        initial={filters}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
        categoriesAvailable={filterCategories}
        categoriesLoading={categoriesLoading}
      />
    </View>
  );
}

function FilterPill({
  children,
  active,
  onPress,
}: {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    backgroundColor: theme.colors.bg,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  queryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    minHeight: 40,
    ...theme.shadow.e2,
  },
  queryPillMid: {
    flex: 1,
    minWidth: 0,
  },
  queryTitle: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  queryCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  pillsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  pillText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  pillTextActive: {
    color: theme.colors.primaryHover,
    fontWeight: '600',
  },
  summaryRow: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 19,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 16,
  },
  emptyWrap: {
    paddingVertical: 48,
  },
});
