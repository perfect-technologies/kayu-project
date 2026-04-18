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
import {
  CategoryStrip,
  I,
  WideProviderCard,
  WideProviderCardSkeleton,
  type CategoryStripItem,
} from '@kayu/ui/mobile';
import type { CategorySlug } from '@kayu/ui';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { FloatingBackButton, IconButton } from '@/components/shell';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { providerToCardData, toCategorySlug } from '@/lib/providerAdapter';
import {
  MobileFilterSheet,
  EMPTY_FILTERS,
  type MobileFilters,
} from './components/MobileFilterSheet';
import type { SearchStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'SearchMain'>;
type Route = RouteProp<SearchStackParamList, 'SearchMain'>;

const FALLBACK_STRIP: CategoryStripItem[] = [
  { slug: 'plomberie' },
  { slug: 'electricite' },
  { slug: 'menage' },
  { slug: 'coiffure' },
  { slug: 'jardinage' },
  { slug: 'informatique' },
  { slug: 'peinture' },
  { slug: 'menuiserie' },
];

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const initialCategory = route.params?.category
    ? toCategorySlug(route.params.category)
    : null;

  const [filters, setFilters] = useState<MobileFilters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  // React to nav param changes (Home → Search with category)
  useEffect(() => {
    if (route.params?.category) {
      setFilters((f) => ({ ...f, category: toCategorySlug(route.params!.category!) }));
    }
  }, [route.params?.category]);

  const searchParams = useMemo(
    () => ({
      category: filters.category ?? undefined,
      limit: 30,
    }),
    [filters.category],
  );

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.categories.getAll(),
  });

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

  const stripItems: CategoryStripItem[] = useMemo(() => {
    const apiCategories = categoriesData?.categories ?? [];
    if (apiCategories.length === 0) return FALLBACK_STRIP;
    const seen = new Set<CategorySlug>();
    const items: CategoryStripItem[] = [];
    for (const c of apiCategories) {
      const slug = toCategorySlug(c.slug);
      if (seen.has(slug)) continue;
      seen.add(slug);
      items.push({ slug, label: c.name });
      if (items.length >= 8) break;
    }
    return items.length > 0 ? items : FALLBACK_STRIP;
  }, [categoriesData]);

  const rawProviders = providersData?.providers ?? [];
  const rawCards = useMemo(() => rawProviders.map(providerToCardData), [rawProviders]);

  // Client-side refine: available / verified / topRated / expert / distance.
  // Category is already applied server-side via searchParams.
  const cards = useMemo(() => {
    return rawCards.filter((c) => {
      if (filters.available && !c.online) return false;
      if (filters.verified && !c.verified) return false;
      if (filters.topRated && !c.topRated) return false;
      // expert and distance are placeholders — no data wiring yet.
      return true;
    });
  }, [rawCards, filters]);

  const goToProfile = (providerId: string) => {
    navigation.navigate('ProviderProfile', { providerId });
  };

  const queryLabel =
    filters.category
      ? (stripItems.find((s) => s.slug === filters.category)?.label ??
        filters.category)
      : 'Trouver un pro';

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
                  Kinshasa · {cards.length} pros
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
              setFilters((f) => ({ ...f, category: f.category === slug ? null : slug }))
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
              Disponible
            </FilterPill>
            <FilterPill
              active={filters.verified}
              onPress={() =>
                setFilters((f) => ({ ...f, verified: !f.verified }))
              }
            >
              Vérifié
            </FilterPill>
            <FilterPill
              active={false}
              onPress={() => setSheetOpen(true)}
            >
              {`< ${filters.maxDistanceKm} km`}
            </FilterPill>
            <FilterPill
              active={filters.topRated}
              onPress={() =>
                setFilters((f) => ({ ...f, topRated: !f.topRated }))
              }
            >
              Top rated
            </FilterPill>
            <FilterPill
              active={filters.expert}
              onPress={() => setFilters((f) => ({ ...f, expert: !f.expert }))}
              leadingIcon="award"
            >
              Expert
            </FilterPill>
          </ScrollView>
        </View>

        {/* Result summary row */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>
            {cards.length} pros disponibles
          </Text>
          <Pressable hitSlop={6} style={styles.sortBtn}>
            <Text style={styles.sortText}>Trier</Text>
            <I.chevronDown size={13} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        {/* Results body */}
        {error ? (
          <View style={styles.emptyWrap}>
            <ErrorState onRetry={() => refetch()} />
          </View>
        ) : view === 'list' ? (
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
        ) : (
          <View style={styles.mapPanel}>
            <View style={styles.mapPlaceholder}>
              <I.mapPin size={28} color={theme.colors.textMuted} />
              <Text style={styles.mapPlaceholderText}>
                Carte bientôt disponible
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Liste/Carte toggle */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={view === 'list' ? 'Afficher la carte' : 'Afficher la liste'}
        onPress={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
        style={[styles.toggle, theme.shadow.e4]}
      >
        {view === 'list' ? (
          <I.mapPin size={16} color={theme.colors.textInverse} />
        ) : (
          <I.menu size={16} color={theme.colors.textInverse} />
        )}
        <Text style={styles.toggleText}>
          {view === 'list' ? 'Carte' : 'Liste'}
        </Text>
      </Pressable>

      <MobileFilterSheet
        open={sheetOpen}
        initial={filters}
        resultCount={cards.length}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

function FilterPill({
  children,
  active,
  onPress,
  leadingIcon,
}: {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  leadingIcon?: 'award';
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
      {leadingIcon === 'award' ? (
        <I.award size={12} color={active ? theme.colors.primaryHover : theme.colors.textBody} />
      ) : null}
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
    paddingBottom: 14,
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
  mapPanel: {
    marginHorizontal: 16,
    height: 500,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfacePrimary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapPlaceholderText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  toggle: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -58 }],
    bottom: 96,
    zIndex: 25,
    width: 116,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  toggleText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
});
