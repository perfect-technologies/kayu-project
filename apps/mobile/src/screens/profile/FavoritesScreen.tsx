import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { ProfileStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Favorites'>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: () => api.favorites.getAll(),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const favorites = data?.favorites ?? [];

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <FlatList
      style={styles.container}
      data={favorites}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="Aucun favori"
          message="Ajoutez des prestataires à vos favoris depuis leur profil"
        />
      }
      renderItem={({ item }) => (
        <ProviderCard
          provider={item.provider}
          onPress={() =>
            navigation.navigate('ProviderProfile', { providerId: item.provider.id })
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
});
