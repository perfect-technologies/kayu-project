import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { SearchStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'CategoryDetail'>;
type Route = RouteProp<SearchStackParamList, 'CategoryDetail'>;

export function CategoryDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  // Fetch subcategories for this category
  const { data: catData } = useQuery({
    queryKey: [...queryKeys.categories.all, 'detail', params.categoryId],
    queryFn: () =>
      api.categories.getAll({
        categoryId: params.categoryId,
        withSubcategories: true,
      }),
  });

  // Fetch providers in this category
  const {
    data: providersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.providers.search({ category: params.categoryId }),
    queryFn: () => api.providers.search({ category: params.categoryId }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const providers = providersData?.providers ?? [];
  const category = catData?.categories?.[0];
  const subcategories = category?.subcategories ?? [];

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <FlatList
      style={styles.container}
      data={providers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
        />
      }
      ListHeaderComponent={
        subcategories.length > 0 ? (
          <View style={styles.subcategoriesSection}>
            <Text style={styles.sectionTitle}>Sous-catégories</Text>
            <View style={styles.subcategoryGrid}>
              {subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subcategoryCard, shadowStyles.sm]}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.setParams({
                      categoryId: sub.id,
                      categoryName: sub.name,
                    })
                  }
                >
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={colors.primary.DEFAULT}
                  />
                  <Text style={styles.subcategoryName} numberOfLines={2}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Prestataires</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="briefcase-outline"
          title="Aucun prestataire"
          message="Aucun prestataire dans cette catégorie pour le moment"
        />
      }
      renderItem={({ item }) => (
        <ProviderCard
          provider={item}
          onPress={() =>
            navigation.navigate('ProviderProfile', { providerId: item.id })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  subcategoriesSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  subcategoryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '45%',
    flexGrow: 1,
  },
  subcategoryName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
    flex: 1,
  },
});
