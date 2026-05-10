import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CategoryStrip,
  FeaturedProviderCard,
  FeaturedProviderCardSkeleton,
  I,
  NearbyCard,
  NearbyCardSkeleton,
  type CategoryStripItem,
} from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { useShrinkOnScroll } from '@/hooks/useShrinkOnScroll';
import { ShrinkingSearchHeader } from '@/components/shell';
import {
  buildCategoryLookup,
  providerToCardData,
} from '@/lib/providerAdapter';
import type { MainTabParamList } from '@/navigation/AppNavigator';

type HomeNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { width } = useWindowDimensions();
  const { scrolled, onScroll } = useShrinkOnScroll(40);

  const { data: categoriesData } = useQuery({
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

  const {
    data: providersData,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: queryKeys.providers.search({ limit: 10 }),
    queryFn: () => api.providers.search({ limit: 10 }),
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchProviders();
    setRefreshing(false);
  };

  const providers = providersData?.providers ?? [];
  const cards = useMemo(
    () => providers.map((p) => providerToCardData(p, categoryLookup)),
    [providers, categoryLookup],
  );
  const featured = cards.slice(0, 4);
  const nearby = cards.slice(0, 4);

  const goToSearch = (category?: string) => {
    navigation.navigate('Search', { screen: 'SearchMain', params: { category } } as never);
  };

  const goToProfile = (providerId: string) => {
    navigation.navigate('Search', {
      screen: 'ProviderProfile',
      params: { providerId },
    } as never);
  };

  const carouselWidth = Math.min(320, Math.round(width * 0.78));

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <ShrinkingSearchHeader scrolled={scrolled} onSearchTap={() => goToSearch()} />

        {/* Category strip */}
        <View style={styles.stripWrap}>
          <CategoryStrip items={stripItems} onSelect={(slug) => goToSearch(slug)} />
        </View>

        {/* Hero intro */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>
            Le bon pro,{'\n'}près de toi.
          </Text>
          <Text style={styles.heroBody}>
            Trouve un pro à Kinshasa, discute directement et demande une réservation.
          </Text>
        </View>

        {/* Featured carousel */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Top pros cette semaine</Text>
            <Pressable hitSlop={6} onPress={() => goToSearch()}>
              <Text style={styles.linkText}>Tout voir</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={carouselWidth + 14}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {providersLoading && featured.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ marginRight: 14 }}>
                    <FeaturedProviderCardSkeleton width={carouselWidth} />
                  </View>
                ))
              : featured.map((p, i) => (
                  <View
                    key={p.id}
                    style={{ marginRight: i === featured.length - 1 ? 0 : 14 }}
                  >
                    <FeaturedProviderCard
                      provider={p}
                      width={carouselWidth}
                      onPress={goToProfile}
                    />
                  </View>
                ))}
          </ScrollView>
        </View>

        {/* Nearby grouped card */}
        <View style={styles.nearbySection}>
          <View style={[styles.sectionHead, styles.nearbyHead]}>
            <Text style={styles.sectionTitle}>Près de toi</Text>
            <Pressable hitSlop={6} onPress={() => goToSearch()}>
              <Text style={styles.linkText}>Tout voir</Text>
            </Pressable>
          </View>
          {providersLoading && nearby.length === 0 ? (
            <NearbyCardSkeleton rows={4} />
          ) : nearby.length > 0 ? (
            <NearbyCard providers={nearby} onSelect={goToProfile} />
          ) : null}
        </View>

        {/* How it works */}
        <View style={styles.howSection}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          <View style={styles.howList}>
            {HOW_STEPS.map((step) => (
              <View key={step.number} style={styles.howCard}>
                <View style={styles.howNumber}>
                  <Text style={styles.howNumberText}>{step.number}</Text>
                </View>
                <View style={styles.howBody}>
                  <Text style={styles.howTitle}>{step.title}</Text>
                  <Text style={styles.howDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Provider CTA — coral gradient */}
        <View style={styles.ctaWrap}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaBlob} />
            <Text style={styles.ctaOverline}>Pour les pros</Text>
            <Text style={styles.ctaTitle}>Tu es un pro ? Rejoins-nous.</Text>
            <Text style={styles.ctaBody}>
              Crée ton profil, reçois des messages et des réservations directes.
            </Text>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Devenir pro</Text>
              <I.arrowRight size={14} color={theme.colors.textInverse} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const HOW_STEPS = [
  { number: '01', title: 'Trouve', desc: 'Parcours les pros vérifiés autour de toi.' },
  { number: '02', title: 'Discute', desc: 'Appelle ou envoie un message pour préciser le besoin.' },
  { number: '03', title: 'Paie cash', desc: 'Paiement en espèces à la fin de la mission.' },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stripWrap: {
    paddingTop: 4,
  },
  heroBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  heroTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 30,
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
  },
  heroBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  featuredSection: {
    marginTop: 22,
  },
  sectionHead: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  nearbyHead: {
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 20,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  linkText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  carouselContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  nearbySection: {
    marginTop: 26,
    paddingHorizontal: 20,
  },
  howSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  howList: {
    marginTop: 12,
    gap: 10,
  },
  howCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadow.e1,
  },
  howNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howNumberText: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  howBody: {
    flex: 1,
  },
  howTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  howDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  ctaWrap: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  ctaCard: {
    borderRadius: theme.radius.lg,
    padding: 22,
    backgroundColor: '#FFE4E6',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  ctaBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251,113,133,0.2)',
  },
  ctaOverline: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: '#BE123C',
    marginBottom: 8,
  },
  ctaTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  ctaBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#9F1239',
    marginBottom: 14,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
});
