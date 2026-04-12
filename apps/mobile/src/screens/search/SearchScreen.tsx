import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { SearchStackParamList } from '@/navigation/AppNavigator';

const CITIES = ['Kinshasa', 'Lubumbashi', 'Brazzaville', 'Pointe-Noire', 'Goma'];

type Nav = NativeStackNavigationProp<SearchStackParamList, 'SearchMain'>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  const searchParams = {
    q: searchText || undefined,
    category: selectedCategory,
    city: selectedCity,
    limit: 20,
  };

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.categories.getAll(),
  });

  const {
    data: providersData,
    isLoading,
    error: providersError,
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

  const categories = categoriesData?.categories ?? [];
  const providers = providersData?.providers ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Rechercher un prestataire..."
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter pills */}
      <View style={styles.filterSection}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.slug;
            return (
              <TouchableOpacity
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() =>
                  setSelectedCategory(isActive ? undefined : item.slug)
                }
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* City filter */}
      <FlatList
        data={CITIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isActive = selectedCity === item;
          return (
            <TouchableOpacity
              style={[styles.cityPill, isActive && styles.cityPillActive]}
              onPress={() => setSelectedCity(isActive ? undefined : item)}
            >
              <Ionicons
                name="location-outline"
                size={13}
                color={isActive ? colors.text.inverse : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.cityPillText,
                  isActive && styles.cityPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results */}
      {isLoading ? (
        <LoadingScreen />
      ) : providersError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.results}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Aucun prestataire trouvé"
              message="Essayez de modifier vos critères de recherche"
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  filterSection: {
    marginBottom: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  filterPillText: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    fontWeight: fontWeights.medium,
  },
  filterPillTextActive: {
    color: colors.text.inverse,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  cityPillActive: {
    backgroundColor: colors.primary[700],
  },
  cityPillText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    fontWeight: fontWeights.medium,
  },
  cityPillTextActive: {
    color: colors.text.inverse,
  },
  results: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
});
