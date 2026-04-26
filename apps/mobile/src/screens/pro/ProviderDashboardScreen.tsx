import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Chip, I, StatCard } from '@kayu/ui/mobile';
import { queryKeys } from '@kayu/api';
import type { DashboardBooking, RequestPreview, TodayJob } from '@kayu/schemas';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import { launchFlags } from '@/lib/launchFlags';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';

type ProviderDashboardNav = NativeStackNavigationProp<
  ProviderStackParamList,
  'ProviderDashboardMain'
>;

type JobStatus = 'confirmed' | 'en_route' | 'completed';

type ClientSummary = { name: string; initials: string; bg: string };

type DashboardJob = {
  id: string;
  time: string;
  duration: string;
  client: ClientSummary;
  kind: string;
  address: string;
  status: JobStatus;
  fee: number;
  distance: number;
};

type DashboardRequest = {
  id: string;
  client: ClientSummary;
  kind: string;
  when: string;
  address: string;
  msg: string;
  matchScore: number;
  receivedAt: string;
  distance: number;
  urgent?: boolean;
};

type DashboardBookingRequest = {
  id: string;
  clientId?: string | null;
  client: ClientSummary;
  kind: string;
  when: string;
  address: string;
  fee: number;
  requestedAt: string;
};

const AVATAR_COLORS = [
  '#FB7185',
  '#10B981',
  '#F59E0B',
  '#BE185D',
  '#7C3AED',
  '#475569',
  '#0EA5E9',
  '#DC2626',
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return 'Date inconnue';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';

  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatScheduledDate(value: string | Date | null | undefined): string {
  if (!value) return 'Date à confirmer';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date à confirmer';
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance) || distance <= 0) return 'Distance à confirmer';
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1)} km`;
}

function toDashboardJob(job: TodayJob): DashboardJob {
  return {
    id: job.id,
    time: job.time,
    duration: job.duration,
    kind: job.kind,
    client: {
      name: job.client.name,
      initials: initialsFor(job.client.name),
      bg: colorFor(job.client.id || job.client.name),
    },
    address: job.address,
    status: job.status,
    fee: job.fee,
    distance: job.distance,
  };
}

function toDashboardRequest(req: RequestPreview): DashboardRequest {
  return {
    id: req.id,
    client: {
      name: req.client.name,
      initials: initialsFor(req.client.name),
      bg: colorFor(req.client.id || req.client.name),
    },
    kind: req.service,
    when: req.when,
    address: req.address,
    msg: req.message,
    matchScore: req.matchScore,
    receivedAt: formatRelativeTime(req.receivedAt),
    distance: req.distance,
    urgent: req.urgent,
  };
}

function toDashboardBookingRequest(booking: DashboardBooking): DashboardBookingRequest {
  const clientName = booking.client?.name ?? 'Client';
  const address = [booking.address, booking.city].filter(Boolean).join(', ');

  return {
    id: booking.id,
    clientId: booking.clientId ?? booking.client?.id ?? null,
    client: {
      name: clientName,
      initials: initialsFor(clientName),
      bg: colorFor(booking.client?.id ?? booking.clientId ?? booking.id),
    },
    kind: booking.service?.name ?? booking.title,
    when: formatScheduledDate(booking.scheduledDate),
    address: address || 'Adresse à confirmer',
    fee: booking.price ?? 0,
    requestedAt: formatRelativeTime(booking.createdAt),
  };
}

export function ProviderDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<ProviderDashboardNav>();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => api.dashboard.getProviderDashboard(),
    enabled: !!user && user.role === 'PROVIDER',
    refetchInterval: 30_000,
  });

  const earningsQuery = useQuery({
    queryKey: queryKeys.earnings.summary,
    queryFn: () => api.earnings.summary(),
    enabled: !!user && user.role === 'PROVIDER',
    refetchInterval: 60_000,
  });

  const availabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) =>
      api.providers.updateAvailability({ isAvailable }),
    onMutate: async (isAvailable) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(
        queryKeys.dashboard.provider,
        (old: typeof data | undefined) =>
          old
            ? {
                ...old,
                availability: { ...old.availability, isAvailable },
                provider: { ...old.provider, isAvailable },
              }
            : old,
      );
      return { prev };
    },
    onError: (_err, _value, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.dashboard.provider, context.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    },
  });

  const dismissRequestMutation = useMutation({
    mutationFn: (id: string) => api.jobRequests.dismiss(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.inboxForPro }),
      ]);
    },
    onError: (err) => {
      Alert.alert(
        'Action impossible',
        err instanceof Error ? err.message : 'La demande n’a pas pu être déclinée.',
      );
    },
  });

  const bookingActionMutation = useMutation({
    mutationFn: ({
      id,
      status,
      cancelReason,
    }: {
      id: string;
      status: 'CONFIRMED' | 'CANCELLED';
      cancelReason?: string;
    }) => api.bookings.update(id, { status, cancelReason }),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(variables.id),
        }),
      ]);
    },
    onError: (err) => {
      Alert.alert(
        'Action impossible',
        err instanceof Error ? err.message : 'La réservation n’a pas pu être mise à jour.',
      );
    },
  });

  const todayJobs = useMemo(
    () => (data?.today.jobs ?? []).map(toDashboardJob),
    [data],
  );
  const bookingRequests = useMemo(
    () => (data?.bookingRequests ?? []).map(toDashboardBookingRequest),
    [data],
  );
  const newRequests = useMemo(
    () =>
      launchFlags.enableJobRequests
        ? (data?.newRequests ?? []).map(toDashboardRequest)
        : [],
    [data],
  );
  const todayTotal = data?.today.estimatedRecette ?? 0;
  const earnings = earningsQuery.data?.summary;
  const refreshing = Boolean(data && (isFetching || earningsQuery.isFetching));

  const handleRefresh = useCallback(() => {
    void Promise.all([refetch(), earningsQuery.refetch()]);
  }, [earningsQuery, refetch]);

  const confirmDeclineBooking = useCallback(
    (bookingId: string) => {
      Alert.alert(
        'Décliner cette réservation ?',
        'Le client verra que vous ne pouvez pas prendre cette mission.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Décliner',
            style: 'destructive',
            onPress: () =>
              bookingActionMutation.mutate({
                id: bookingId,
                status: 'CANCELLED',
                cancelReason: 'Créneau indisponible',
              }),
          },
        ],
      );
    },
    [bookingActionMutation],
  );

  const firstName = user?.firstName ?? 'Pro';
  const lastName = user?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const rating = data?.stats.avgRating.value ?? 0;
  const available = data?.availability.isAvailable ?? true;
  const onboarding = data?.onboarding;

  if (isLoading && !data) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.centerStateText}>Chargement…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Impossible de charger votre tableau de bord.</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnSecondary, { marginTop: 16 }]}
          onPress={() => refetch()}
        >
          <Text style={styles.btnSecondaryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const revenueValue = data.stats.revenue.value;
  const revenueDelta = data.stats.revenue.deltaPct;
  const missionsValue = data.stats.missions.value;
  const missionsDelta = data.stats.missions.deltaPct;
  const responseRate = data.stats.responseRate;
  const avgRatingDelta = data.stats.avgRating.delta;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.greetingRow}>
          <Avatar name={fullName || firstName} bg="#0EA5E9" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingCaption}>Bonjour</Text>
            <Text style={styles.greetingName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Boîte de réception"
            style={styles.inboxButton}
            onPress={() => navigation.getParent()?.navigate('Messages' as never)}
            activeOpacity={0.7}
          >
            <I.inbox size={18} color={theme.colors.textBody} />
            {data.notifications.unreadCount > 0 && <View style={styles.inboxDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.availabilityPill}>
          <View
            style={[
              styles.availabilityDot,
              { backgroundColor: available ? theme.colors.success : theme.colors.borderStrong },
            ]}
          />
          <Text style={styles.availabilityLabel}>
            {available ? "Disponible aujourd'hui" : 'Indisponible'}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{ checked: available, disabled: availabilityMutation.isPending }}
            accessibilityLabel="Disponibilité"
            onPress={() => availabilityMutation.mutate(!available)}
            disabled={availabilityMutation.isPending}
            style={[
              styles.toggleTrack,
              {
                backgroundColor: available ? theme.colors.success : theme.colors.borderStrong,
                opacity: availabilityMutation.isPending ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.toggleThumb,
                { left: available ? 18 : 2 },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {onboarding && !onboarding.isComplete && (
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProviderOnboarding')}
            style={styles.onboardingBanner}
            activeOpacity={0.9}
          >
            <View style={styles.onboardingIcon}>
              <I.sparkles size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.onboardingTitle}>Complétez votre inscription</Text>
              <Text style={styles.onboardingSub}>
                Étape {(onboarding.currentStep ?? 0) + 1} sur {onboarding.totalSteps} ·
                Continuer
              </Text>
              <View style={styles.onboardingTrack}>
                <View
                  style={[
                    styles.onboardingFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((onboarding.currentStep ?? 0) / (onboarding.totalSteps || 6)) * 100,
                        ),
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <I.chevronRight size={16} color="#0369A1" />
          </TouchableOpacity>
        </View>
      )}

      {/* Today summary */}
      <View style={styles.section}>
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStatCard}>
            <Text style={styles.overline}>Aujourd'hui</Text>
            <Text style={styles.miniStatValue}>{todayJobs.length} missions</Text>
            <Text style={styles.miniStatSub}>
              {todayJobs[0] ? `Prochaine à ${todayJobs[0].time}` : 'Rien de prévu'}
            </Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.overline}>Recette prévue</Text>
            <Text style={[styles.miniStatValue, { fontFamily: theme.fonts.mono }]}>
              {todayTotal.toLocaleString('fr-FR')} FC
            </Text>
            <Text style={styles.miniStatSub}>
              {todayJobs.length} mission{todayJobs.length > 1 ? 's' : ''} confirmée
              {todayJobs.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Direct booking requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>
            Réservations à confirmer{' '}
            <Text style={{ color: theme.colors.accent, fontSize: 14 }}>
              ({bookingRequests.length})
            </Text>
          </Text>
        </View>
        {bookingRequests.length === 0 ? (
          <EmptyLine iconName="inbox" copy="Aucune demande directe à confirmer" />
        ) : (
          <View style={{ gap: 12 }}>
            {bookingRequests.map((booking) => (
              <BookingRequestCard
                key={booking.id}
                booking={booking}
                busy={
                  bookingActionMutation.isPending &&
                  bookingActionMutation.variables?.id === booking.id
                }
                onOpen={() =>
                  navigation.navigate('BookingDetail', { bookingId: booking.id })
                }
                onMessage={() => {
                  if (!booking.clientId) return;
                  const parent = navigation.getParent();
                  (parent as unknown as { navigate: (tab: string, params: object) => void } | undefined)?.navigate(
                    'Messages',
                    {
                      screen: 'Chat',
                      params: {
                        recipientId: booking.clientId,
                        recipientName: booking.client.name,
                      },
                    },
                  );
                }}
                onAccept={() =>
                  bookingActionMutation.mutate({
                    id: booking.id,
                    status: 'CONFIRMED',
                  })
                }
                onDecline={() => confirmDeclineBooking(booking.id)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Today schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Planning du jour</Text>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => navigation.getParent()?.navigate('Bookings' as never)}
          >
            <Text style={styles.linkLabel}>Missions</Text>
          </TouchableOpacity>
        </View>
        {todayJobs.length === 0 ? (
          <EmptyLine iconName="calendar" copy="Aucune mission aujourd'hui" />
        ) : (
          <View style={{ gap: 10 }}>
            {todayJobs.map((j) => (
              <JobCard
                key={j.id}
                job={j}
                onPress={() =>
                  navigation.navigate('BookingDetail', { bookingId: j.id })
                }
              />
            ))}
          </View>
        )}
      </View>

      {launchFlags.enableJobRequests && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.heading}>
              Nouvelles demandes{' '}
              <Text style={{ color: theme.colors.accent, fontSize: 14 }}>
                ({newRequests.length})
              </Text>
            </Text>
          </View>
          {newRequests.length === 0 ? (
            <EmptyLine iconName="inbox" copy="Pas de demande en attente" />
          ) : (
            <View style={{ gap: 12 }}>
              {newRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  req={r}
                  busy={
                    dismissRequestMutation.isPending &&
                    dismissRequestMutation.variables === r.id
                  }
                  onDecline={() => dismissRequestMutation.mutate(r.id)}
                  onQuote={() =>
                    navigation.navigate('QuoteCompose', { requestId: r.id })
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Earnings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Gains</Text>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => navigation.getParent()?.navigate('Earnings' as never)}
          >
            <Text style={styles.linkLabel}>Détails</Text>
          </TouchableOpacity>
        </View>
        {earningsQuery.isError ? (
          <EmptyLine iconName="inbox" copy="Gains indisponibles pour le moment" />
        ) : (
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <Text style={styles.overline}>Disponible</Text>
              <Text style={[styles.miniStatValue, { fontFamily: theme.fonts.mono }]}>
                {earningsQuery.isLoading
                  ? '—'
                  : `${(earnings?.balance ?? 0).toLocaleString('fr-FR')} FC`}
              </Text>
              <Text style={styles.miniStatSub}>Paiement en espèces confirmé</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.overline}>En attente</Text>
              <Text style={[styles.miniStatValue, { fontFamily: theme.fonts.mono }]}>
                {earningsQuery.isLoading
                  ? '—'
                  : `${(earnings?.pending ?? 0).toLocaleString('fr-FR')} FC`}
              </Text>
              <Text style={styles.miniStatSub}>Missions non réglées</Text>
            </View>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.section}>
        <Text style={[styles.heading, { marginBottom: 12 }]}>Ce mois</Text>
        <View style={styles.statGrid}>
          <View style={styles.statGridItem}>
            <StatCard
              label="Revenus"
              value={`${Math.round(revenueValue / 1000)}k FC`}
              sub={`${revenueDelta >= 0 ? '+' : ''}${revenueDelta}%`}
              trend={revenueDelta >= 0 ? 1 : -1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Missions"
              value={missionsValue}
              sub={`${missionsDelta >= 0 ? '+' : ''}${missionsDelta}%`}
              trend={missionsDelta >= 0 ? 1 : -1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Taux réponse"
              value={`${responseRate.value}%`}
              sub={responseRate.label}
              trend={responseRate.value >= 70 ? 1 : -1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Note moyenne"
              value={rating.toFixed(1)}
              sub={`${avgRatingDelta >= 0 ? '+' : ''}${avgRatingDelta.toFixed(1)}`}
              trend={avgRatingDelta >= 0 ? 1 : -1}
              compact
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatusPill({ status }: { status: JobStatus }) {
  if (status === 'en_route') {
    return (
      <Chip variant="success" size="sm">
        Confirmé
      </Chip>
    );
  }
  if (status === 'confirmed') {
    return (
      <Chip variant="success" size="sm">
        Confirmé
      </Chip>
    );
  }
  return (
    <Chip variant="neutral" size="sm">
      Terminé
    </Chip>
  );
}

function JobCard({
  job,
  onPress,
}: {
  job: DashboardJob;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.jobCard}
    >
      <View style={styles.jobTime}>
        <Text style={styles.jobTimeValue}>{job.time}</Text>
        <Text style={styles.jobTimeSub}>{job.duration}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job.kind}
          </Text>
          <StatusPill status={job.status} />
        </View>
        <View style={styles.jobMetaRow}>
          <Avatar
            name={job.client.name}
            bg={job.client.bg}
            size={22}
            initials={job.client.initials}
          />
          <Text style={styles.jobClientName} numberOfLines={1}>
            {job.client.name}
          </Text>
          <Text style={styles.jobMetaDivider}>·</Text>
          <I.mapPin size={11} color={theme.colors.textMuted} />
          <Text style={styles.jobMeta} numberOfLines={1}>
            {job.address}
            {job.distance > 0 ? ` · ${job.distance} km` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BookingRequestCard({
  booking,
  busy,
  onOpen,
  onMessage,
  onAccept,
  onDecline,
}: {
  booking: DashboardBookingRequest;
  busy: boolean;
  onOpen: () => void;
  onMessage: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onOpen}
      style={styles.bookingRequestCard}
    >
      <View style={styles.requestHeader}>
        <Avatar
          name={booking.client.name}
          bg={booking.client.bg}
          size={38}
          initials={booking.client.initials}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.requestClientName} numberOfLines={1}>
            {booking.client.name}
          </Text>
          <Text style={styles.requestMeta}>Demandé {booking.requestedAt}</Text>
        </View>
        <Chip variant="warning" size="sm">
          À confirmer
        </Chip>
      </View>
      <Text style={styles.requestKind}>{booking.kind}</Text>
      <View style={styles.requestChips}>
        <Chip size="sm" leadingIcon={<I.calendar size={11} color={theme.colors.textBody} />}>
          {booking.when}
        </Chip>
        <Chip size="sm" leadingIcon={<I.mapPin size={11} color={theme.colors.textBody} />}>
          {booking.address}
        </Chip>
      </View>
      <View style={styles.bookingFooterRow}>
        <View>
          <Text style={styles.matchLabel}>Montant estimé</Text>
          <Text style={styles.bookingFee}>
            {booking.fee > 0 ? `${booking.fee.toLocaleString('fr-FR')} FC` : 'À confirmer'}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onMessage}>
          <View style={styles.messageLinkRow}>
            <I.messageCircle size={13} color={theme.colors.primaryHover} />
            <Text style={styles.linkLabel}>Message</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
          onPress={onDecline}
          disabled={busy}
        >
          <Text style={styles.btnSecondaryText}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnPrimary, { flex: 1.4 }]}
          onPress={onAccept}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.btnPrimaryText}>Accepter</Text>
              <I.check size={14} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function RequestCard({
  req,
  busy,
  onDecline,
  onQuote,
}: {
  req: DashboardRequest;
  busy: boolean;
  onDecline: () => void;
  onQuote: () => void;
}) {
  return (
    <View
      style={[
        styles.requestCard,
        req.urgent ? { borderColor: '#FCA5A5' } : null,
      ]}
    >
      {req.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>Urgent</Text>
        </View>
      )}
      <View style={styles.requestHeader}>
        <Avatar
          name={req.client.name}
          bg={req.client.bg}
          size={36}
          initials={req.client.initials}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.requestClientName} numberOfLines={1}>
            {req.client.name}
          </Text>
          <Text style={styles.requestMeta}>
            {req.receivedAt} · {formatDistance(req.distance)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.matchLabel}>Match</Text>
          <Text style={styles.matchValue}>{req.matchScore}%</Text>
        </View>
      </View>
      <Text style={styles.requestKind}>{req.kind}</Text>
      <Text style={styles.requestMsg} numberOfLines={2}>
        « {req.msg} »
      </Text>
      <View style={styles.requestChips}>
        <Chip size="sm" leadingIcon={<I.calendar size={11} color={theme.colors.textBody} />}>
          {req.when}
        </Chip>
        <Chip size="sm" leadingIcon={<I.mapPin size={11} color={theme.colors.textBody} />}>
          {req.address}
        </Chip>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
          onPress={onDecline}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.textBody} size="small" />
          ) : (
            <Text style={styles.btnSecondaryText}>Décliner</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnPrimary, { flex: 2 }]}
          onPress={onQuote}
          disabled={busy}
        >
          <Text style={styles.btnPrimaryText}>Envoyer un devis</Text>
          <I.arrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyLine({
  iconName,
  copy,
}: {
  iconName: 'calendar' | 'inbox';
  copy: string;
}) {
  const Icon = I[iconName];
  return (
    <View style={styles.emptyLine}>
      <Icon size={20} color={theme.colors.textMuted} />
      <Text style={styles.emptyLineText}>{copy}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const card: StyleProp<ViewStyle> = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  ...theme.shadow.e1,
};

const overline: StyleProp<TextStyle> = {
  fontFamily: theme.fonts.bodySemi,
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 0.88,
  textTransform: 'uppercase',
  color: theme.colors.textMuted,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.surfacePrimary,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  greetingCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  greetingName: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  inboxButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  toggleTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heading: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 20,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  linkLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  onboardingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#0C4A6E',
  },
  onboardingSub: {
    fontSize: 12.5,
    color: '#0369A1',
    marginTop: 2,
    lineHeight: 17,
  },
  onboardingTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#BAE6FD',
    overflow: 'hidden',
    marginTop: 8,
  },
  onboardingFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  miniStatCard: {
    ...(card as object),
    flex: 1,
    padding: 14,
  },
  overline,
  miniStatValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  miniStatSub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  jobCard: {
    ...(card as object),
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobTime: {
    width: 60,
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderSubtle,
  },
  jobTimeValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 19,
    color: theme.colors.textPrimary,
  },
  jobTimeSub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  jobTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  jobClientName: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  jobMetaDivider: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  jobMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  requestCard: {
    ...(card as object),
    padding: 14,
    position: 'relative',
  },
  bookingRequestCard: {
    ...(card as object),
    padding: 14,
    position: 'relative',
    borderColor: '#FED7AA',
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    left: 14,
    backgroundColor: theme.colors.danger,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  requestClientName: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14.5,
    color: theme.colors.textPrimary,
  },
  requestMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  matchLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  matchValue: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.success,
  },
  requestKind: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  requestMsg: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textBody,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  requestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  bookingFee: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  messageLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    height: 40,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    color: theme.colors.textBody,
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statGridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  emptyLine: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyLineText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: theme.colors.bg,
  },
  centerStateText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  errorTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
