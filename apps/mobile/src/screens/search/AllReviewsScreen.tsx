import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { formatRelativeTime } from '@kayu/utils';
import { api } from '@/lib/api';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { SearchStackParamList, ProfileStackParamList } from '@/navigation/AppNavigator';

type Route = RouteProp<SearchStackParamList & ProfileStackParamList, 'AllReviews'>;

export function AllReviewsScreen() {
  const { params } = useRoute<Route>();

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.reviews.byProvider(params.providerId),
    queryFn: ({ pageParam }) =>
      api.reviews.getByProvider(params.providerId, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore
        ? (lastPage.pagination.page ?? 1) + 1
        : undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const reviews = useMemo(
    () => data?.pages.flatMap((page) => page.reviews) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <FlatList
      style={styles.container}
      data={reviews}
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
          icon="chatbox-outline"
          title="Aucun avis"
          message="Ce prestataire n'a pas encore reçu d'avis"
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => {
        const reviewerName =
          [item.client?.firstName, item.client?.lastName]
            .filter(Boolean)
            .join(' ') || 'Client';
        return (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <View style={styles.reviewerAvatar}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={colors.primary.DEFAULT}
                  />
                </View>
                <Text style={styles.reviewerName}>{reviewerName}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons
                  name="star"
                  size={13}
                  color={colors.warning.DEFAULT}
                />
                <Text style={styles.ratingText}>
                  {item.rating ?? item.overallScore ?? 0}
                </Text>
              </View>
            </View>

            {item.comment && (
              <Text style={styles.comment}>{item.comment}</Text>
            )}

            {/* Category ratings */}
            <View style={styles.categoryRatings}>
              {item.punctuality != null && (
                <Text style={styles.catRating}>
                  Ponctualité: {item.punctuality}/5
                </Text>
              )}
              {item.quality != null && (
                <Text style={styles.catRating}>
                  Qualité: {item.quality}/5
                </Text>
              )}
              {item.communication != null && (
                <Text style={styles.catRating}>
                  Communication: {item.communication}/5
                </Text>
              )}
            </View>

            <Text style={styles.date}>
              {formatRelativeTime(String(item.createdAt))}
            </Text>
          </View>
        );
      }}
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
  reviewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  comment: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  categoryRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  catRating: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  date: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
