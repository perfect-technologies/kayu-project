import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '@/lib/theme';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProviders } from '@/components/home/FeaturedProviders';
import type { MainTabParamList } from '@/navigation/AppNavigator';

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.categories.getAll(),
  });

  const {
    data: providersData,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: queryKeys.providers.search({ limit: 10 }),
    queryFn: () => api.providers.search({ limit: 10 }),
  });

  const {
    data: statsData,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.stats.global,
    queryFn: () => api.stats.getGlobal(),
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProviders(), refetchStats()]);
    setRefreshing(false);
  };

  const categories = categoriesData?.categories ?? [];
  const providers = providersData?.providers ?? [];
  const stats = statsData;

  const greeting = user?.firstName
    ? `Bonjour, ${user.firstName}`
    : 'Bonjour';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>
            Que recherchez-vous aujourd'hui ?
          </Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={22} color={colors.primary.DEFAULT} />
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <Text style={styles.searchPlaceholder}>
          Rechercher un prestataire...
        </Text>
      </TouchableOpacity>

      {/* Stats banner */}
      {stats && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.totalProviders}
            </Text>
            <Text style={styles.statLabel}>Prestataires</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.totalClients}
            </Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.totalCategories}
            </Text>
            <Text style={styles.statLabel}>Catégories</Text>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        {categoriesLoading ? (
          <ActivityIndicator color={colors.primary.DEFAULT} style={styles.loader} />
        ) : (
          <CategoryGrid
            categories={categories}
            onPress={(cat) =>
              (navigation as any).navigate('Search', {
                screen: 'CategoryDetail',
                params: { categoryId: cat.id, categoryName: cat.name },
              })
            }
          />
        )}
      </View>

      {/* Featured Providers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestataires populaires</Text>
        {providersLoading ? (
          <ActivityIndicator color={colors.primary.DEFAULT} style={styles.loader} />
        ) : (
          <FeaturedProviders
            providers={providers}
            onPress={(provider) =>
              (navigation as any).navigate('Search', {
                screen: 'ProviderProfile',
                params: { providerId: provider.id },
              })
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: fontSizes.md,
    color: colors.text.tertiary,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primary.DEFAULT,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text.inverse,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.primary[200],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.primary[400],
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
});
