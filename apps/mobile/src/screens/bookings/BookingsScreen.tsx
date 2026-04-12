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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDate } from '@kayu/utils';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import type { BookingsStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'BookingsMain'>;

const TABS = [
  { key: undefined, label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmées' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
] as const;

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.bookings.all({ status: statusFilter as any }),
    queryFn: () => api.bookings.getAll({ status: statusFilter as any }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const bookings = data?.bookings ?? [];

  return (
    <View style={styles.container}>
      {/* Status tabs */}
      <FlatList
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabList}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => {
          const isActive = statusFilter === item.key;
          return (
            <TouchableOpacity
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Aucune réservation"
              message="Vous n'avez pas encore de réservation"
            />
          }
          renderItem={({ item }) => {
            const providerName = item.provider
              ? [item.provider.user.firstName, item.provider.user.lastName]
                  .filter(Boolean)
                  .join(' ')
              : 'Prestataire';

            return (
              <TouchableOpacity
                style={[styles.bookingCard, shadowStyles.sm]}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('BookingDetail', { bookingId: item.id })
                }
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <BookingStatusBadge status={item.status} />
                </View>
                <Text style={styles.providerName}>{providerName}</Text>
                {item.scheduledDate && (
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.dateText}>
                      {formatDate(String(item.scheduledDate))}
                    </Text>
                  </View>
                )}
                {item.price != null && (
                  <Text style={styles.price}>{item.price.toLocaleString()} CDF</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  bookingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  providerName: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  price: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary.DEFAULT,
    marginTop: spacing.xs,
  },
});
