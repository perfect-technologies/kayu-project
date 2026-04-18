import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import { BookingCard, type MobileBookingCardData } from '@/components/bookings/BookingCard';
import { toV2Status, type V2Status } from '@/lib/bookingV2';
import type {
  BookingsStackParamList,
  MainTabParamList,
} from '@/navigation/AppNavigator';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<BookingsStackParamList, 'BookingsMain'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const TABS: { id: V2Status; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'active', label: 'En cours' },
  { id: 'completed', label: 'Terminées' },
  { id: 'cancelled', label: 'Annulées' },
];

const EMPTY_COPY: Record<V2Status, { title: string; sub: string; cta: string | null }> = {
  upcoming: {
    title: 'Aucune réservation à venir',
    sub: 'Quand vous réservez un pro, il apparaîtra ici.',
    cta: 'Trouver un pro',
  },
  active: {
    title: 'Rien en cours',
    sub: 'Les missions actives apparaissent ici, avec le suivi en temps réel.',
    cta: 'Parcourir les catégories',
  },
  completed: {
    title: 'Pas encore de missions terminées',
    sub: 'Votre historique vit ici.',
    cta: 'Réserver un pro',
  },
  cancelled: {
    title: 'Aucune annulation',
    sub: 'Bon signe — tout roule.',
    cta: null,
  },
};

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [tab, setTab] = useState<V2Status>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.bookings.all(),
    queryFn: () => api.bookings.getAll(),
  });

  const bookings = (data?.bookings ?? []) as MobileBookingCardData[];
  const perspective: 'client' | 'pro' = user?.role === 'PROVIDER' ? 'pro' : 'client';

  const counts = useMemo(() => {
    const c: Record<V2Status, number> = {
      upcoming: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const b of bookings) c[toV2Status(b.status)]++;
    return c;
  }, [bookings]);

  const filtered = useMemo(
    () => bookings.filter((b) => toV2Status(b.status) === tab),
    [bookings, tab],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      {/* Sticky title */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes réservations</Text>
      </View>

      {/* Scrollable tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const count = counts[t.id];
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    active && styles.countBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      active && styles.countTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyBookings
            tab={tab}
            onBrowse={() => navigation.navigate('Search')}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                perspective={perspective}
                onPress={() =>
                  navigation.navigate('BookingDetail', { bookingId: b.id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyBookings({
  tab,
  onBrowse,
}: {
  tab: V2Status;
  onBrowse: () => void;
}) {
  const copy = EMPTY_COPY[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <I.calendar size={28} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{copy.title}</Text>
      <Text style={styles.emptySub}>{copy.sub}</Text>
      {copy.cta && (
        <Pressable style={styles.emptyCta} onPress={onBrowse}>
          <Text style={styles.emptyCtaText}>{copy.cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: theme.colors.bg,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
  },
  tabsScroll: {
    maxHeight: 48,
    flexGrow: 0,
  },
  tabsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pillActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  pillText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  pillTextActive: {
    color: '#fff',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  countTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  list: {
    gap: 12,
  },
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 18,
    lineHeight: 20,
  },
  emptyCta: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCtaText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
});
