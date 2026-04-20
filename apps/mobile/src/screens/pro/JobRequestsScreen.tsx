import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  BookingsResponse,
  JobRequestForPro,
  JobRequestsInboxResponse,
} from '@kayu/schemas';
import { queryKeys } from '@kayu/api';
import { Avatar, I } from '@kayu/ui/mobile';
import { tokens, type CategorySlug } from '@kayu/ui';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import type { RequestsStackParamList } from '@/navigation/AppNavigator';
import type {
  ActiveJob,
  ActiveJobStatus,
  InboundRequest,
} from './fixtures';

type Nav = NativeStackNavigationProp<RequestsStackParamList, 'RequestsMain'>;

const STATUS_COPY: Record<
  ActiveJobStatus,
  { label: string; color: string; bg: string; pulse?: boolean }
> = {
  pending: {
    label: 'À confirmer',
    color: theme.colors.warning,
    bg: theme.colors.warningSubtle,
  },
  scheduled: {
    label: 'Planifié',
    color: theme.colors.primary,
    bg: theme.colors.primarySubtle,
  },
  enroute: {
    label: 'En route',
    color: theme.colors.warning,
    bg: theme.colors.warningSubtle,
  },
  arrived: {
    label: 'Sur place',
    color: theme.colors.success,
    bg: theme.colors.successSubtle,
  },
  in_progress: {
    label: 'En cours',
    color: theme.colors.success,
    bg: theme.colors.successSubtle,
    pulse: true,
  },
};

const AVATAR_PALETTE = [
  '#FB7185',
  '#10B981',
  '#7C3AED',
  '#F59E0B',
  '#0EA5E9',
  '#BE123C',
  '#6366F1',
  '#14B8A6',
];

function bgForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initialsFrom(
  firstName?: string | null,
  lastName?: string | null,
  fallback = 'Client',
) {
  const f = (firstName ?? '').trim().charAt(0);
  const l = (lastName ?? '').trim().charAt(0);
  return `${f}${l}`.toUpperCase() || fallback.charAt(0).toUpperCase();
}

function formatReceivedAt(iso: string | Date | null): string {
  if (!iso) return '';
  const date = iso instanceof Date ? iso : new Date(iso);
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function describeExpiry(iso: string | Date | null) {
  if (!iso) return { label: 'pas de limite', minutes: 9999 };
  const date = iso instanceof Date ? iso : new Date(iso);
  const mins = Math.max(0, Math.floor((date.getTime() - Date.now()) / 60_000));
  if (mins <= 0) return { label: 'expirée', minutes: 0 };
  if (mins < 60) return { label: `${mins} min`, minutes: mins };
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return {
    label: rest === 0 ? `${hours}h` : `${hours}h ${rest.toString().padStart(2, '0')}min`,
    minutes: mins,
  };
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance) || distance <= 0) return 'Distance à confirmer';
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1)} km`;
}

function mapInbound(req: JobRequestForPro): InboundRequest {
  const fullName =
    `${req.client.firstName ?? ''} ${req.client.lastName ?? ''}`.trim() ||
    'Client';
  const initials = initialsFrom(req.client.firstName, req.client.lastName);
  const expiry = describeExpiry(req.expiresAt);
  const slug = (req.category?.slug as CategorySlug | undefined) ?? 'plomberie';

  return {
    id: req.id,
    client: {
      name: fullName,
      initials,
      bg: bgForId(req.clientId),
      rating: req.client.rating ?? null,
      jobs: req.client.jobs,
      newClient: req.client.newClient,
    },
    service: req.service,
    category: slug,
    when: req.whenPref,
    address: req.address,
    neighborhood: req.commune ?? req.city,
    distance: req.distanceKm ?? 0,
    estimatedHours: req.estimatedHours ?? 1,
    budget: req.budget ?? 0,
    description: req.description,
    photos: req.photoCount,
    receivedAt: formatReceivedAt(req.notifiedAt),
    expiresIn: expiry.label,
    expiresMinutes: expiry.minutes,
    competing: req.competingCount,
    matchScore: req.matchScore,
    urgent: req.urgent,
  };
}

type BookingLite = BookingsResponse['bookings'][number];

function mapActive(booking: BookingLite): ActiveJob {
  const firstName = booking.client?.firstName ?? null;
  const lastName = booking.client?.lastName ?? null;
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Client';
  const initials = initialsFrom(firstName, lastName);
  const when = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date à confirmer';

  return {
    id: booking.id,
    client: {
      name,
      initials,
      bg: bgForId(booking.clientId ?? booking.id),
    },
    service: booking.title,
    when,
    address: booking.address ?? booking.city ?? 'Adresse à confirmer',
    status:
      booking.status === 'PENDING'
        ? 'pending'
        : booking.status === 'IN_PROGRESS'
          ? 'in_progress'
          : 'scheduled',
    payout: booking.price ?? 0,
  };
}

export function JobRequestsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const inboxQuery = useQuery({
    queryKey: queryKeys.jobRequests.inboxForPro,
    queryFn: () => api.jobRequests.inbox() as Promise<JobRequestsInboxResponse>,
    refetchInterval: 30_000,
  });

  const activeQuery = useQuery({
    queryKey: queryKeys.bookings.all({ role: 'provider' }),
    queryFn: () =>
      api.bookings.getAll({ role: 'provider' }) as Promise<BookingsResponse>,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.jobRequests.dismiss(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.inboxForPro }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider }),
      ]);
    },
  });

  const visible = useMemo(() => {
    const items = (inboxQuery.data?.requests ?? []).map(mapInbound);
    return items.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  }, [inboxQuery.data]);

  const activeJobs = useMemo(() => {
    const items = (activeQuery.data?.bookings ?? []).filter(
      (b) =>
        b.status === 'PENDING' ||
        b.status === 'CONFIRMED' ||
        b.status === 'IN_PROGRESS',
    );
    return items.map(mapActive);
  }, [activeQuery.data]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.overline}>Espace pro</Text>
        <Text style={styles.h1}>Demandes</Text>
        <Text style={styles.subtitle}>
          Acceptez vite, envoyez un devis propre.
        </Text>
      </View>

      {/* Section: new */}
      <View style={styles.section}>
        <SectionHeader label="Nouvelles demandes" count={visible.length} />
        {inboxQuery.isLoading ? (
          <LoadingBox copy="Chargement des demandes…" />
        ) : inboxQuery.isError ? (
          <ErrorBox
            copy="Impossible de charger vos demandes."
            onRetry={() => inboxQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyBox
            iconName="check"
            title="Boîte vide"
            copy="Les nouvelles demandes apparaîtront ici dès qu'un client vous cible."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {visible.map((r) => (
              <InboundRequestCard
                key={r.id}
                req={r}
                onDecline={() => dismissMutation.mutate(r.id)}
                onQuote={() =>
                  navigation.navigate('QuoteCompose', { requestId: r.id })
                }
              />
            ))}
          </View>
        )}
      </View>

      {/* Section: active */}
      <View style={styles.section}>
        <SectionHeader label="Réservations et missions" count={activeJobs.length} />
        {activeQuery.isLoading ? (
          <LoadingBox copy="Chargement des missions…" />
        ) : activeQuery.isError ? (
          <ErrorBox
            copy="Impossible de charger vos missions."
            onRetry={() => activeQuery.refetch()}
          />
        ) : activeJobs.length === 0 ? (
          <EmptyBox
            iconName="calendar"
            title="Rien en cours"
            copy="Vos réservations à confirmer et missions acceptées apparaîtront ici."
          />
        ) : (
          <ActiveJobsCard
            jobs={activeJobs}
            onSelect={(j) =>
              navigation.navigate('BookingDetail', { bookingId: j.id })
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionOverline}>
        {label}{' '}
        <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>
          ({count})
        </Text>
      </Text>
    </View>
  );
}

function InboundRequestCard({
  req,
  onDecline,
  onQuote,
}: {
  req: InboundRequest;
  onDecline: () => void;
  onQuote: () => void;
}) {
  const cat = tokens.portfolio[req.category] ?? tokens.portfolio.plomberie;
  const soon = req.expiresMinutes <= 30;

  return (
    <View
      style={[
        styles.requestCard,
        req.urgent ? { borderColor: '#FECDD3' } : null,
      ]}
    >
      {/* Top: client + match */}
      <View style={styles.requestTopRow}>
        <Avatar
          name={req.client.name}
          bg={req.client.bg}
          size={40}
          initials={req.client.initials}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.clientName} numberOfLines={1}>
            {req.client.name}
          </Text>
          <View style={styles.clientMetaRow}>
            {req.client.newClient ? (
              <View style={styles.newClientBadge}>
                <Text style={styles.newClientBadgeText}>Nouveau client</Text>
              </View>
            ) : (
              <>
                <I.star size={11} color={theme.colors.warning} />
                <Text style={styles.ratingText}>
                  {req.client.rating?.toFixed(1)}
                </Text>
                <Text style={styles.mutedSmall}>
                  · {req.client.jobs} missions
                </Text>
              </>
            )}
          </View>
          <Text style={styles.mutedSmall} numberOfLines={1}>
            {req.receivedAt}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.matchLabel}>Match</Text>
          <Text style={styles.matchValue}>{req.matchScore}%</Text>
        </View>
      </View>

      {/* Service + description */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.serviceTitle}>{req.service}</Text>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          « {req.description} »
        </Text>
      </View>

      {/* Chip row */}
      <View style={styles.chipRow}>
        <View style={[styles.categoryChip, { backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryChipText, { color: cat.accent }]}>
            {cat.label}
          </Text>
        </View>
        <View style={styles.chip}>
          <I.calendar size={11} color={theme.colors.textBody} />
          <Text style={styles.chipText} numberOfLines={1}>
            {req.when}
          </Text>
        </View>
        <View style={styles.chip}>
          <I.mapPin size={11} color={theme.colors.textBody} />
          <Text style={styles.chipText} numberOfLines={1}>
            {req.neighborhood}
          </Text>
        </View>
        <View style={styles.chip}>
          <I.clock size={11} color={theme.colors.textBody} />
          <Text style={styles.chipText} numberOfLines={1}>
            {formatDistance(req.distance)}
          </Text>
        </View>
        {req.photos > 0 && (
          <View style={styles.chip}>
            <I.camera size={11} color={theme.colors.textBody} />
            <Text style={styles.chipText}>{req.photos}</Text>
          </View>
        )}
      </View>

      {/* Budget + expire */}
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaOverline}>Budget client</Text>
          <Text style={styles.metaValue}>
            {req.budget.toLocaleString('fr-FR')} FC
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View
            style={[
              styles.expirePill,
              {
                backgroundColor: soon
                  ? theme.colors.dangerSubtle
                  : theme.colors.warningSubtle,
              },
            ]}
          >
            <I.clock size={10} color={soon ? '#9F1239' : '#B45309'} />
            <Text
              style={[
                styles.expirePillText,
                { color: soon ? '#9F1239' : '#B45309' },
              ]}
            >
              Expire {req.expiresIn}
            </Text>
          </View>
          {(req.competing ?? 0) > 1 && (
            <Text style={styles.mutedSmall}>{req.competing} pros voient</Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDecline}
          style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
        >
          <Text style={styles.btnSecondaryText}>Décliner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onQuote}
          style={[styles.btn, styles.btnPrimary, { flex: 2 }]}
        >
          <Text style={styles.btnPrimaryText}>Envoyer un devis</Text>
          <I.arrowRight size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ActiveJobsCard({
  jobs,
  onSelect,
}: {
  jobs: ActiveJob[];
  onSelect: (j: ActiveJob) => void;
}) {
  return (
    <View style={styles.groupedCard}>
      {jobs.map((job, idx) => {
        const st = STATUS_COPY[job.status];
        return (
          <Pressable
            key={job.id}
            onPress={() => onSelect(job)}
            style={({ pressed }) => [
              styles.activeRow,
              idx > 0 && styles.activeRowDivider,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Avatar
              name={job.client.name}
              bg={job.client.bg}
              size={40}
              initials={job.client.initials}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.activeRowTitle} numberOfLines={1}>
                {job.service}
              </Text>
              <Text style={styles.activeRowMeta} numberOfLines={1}>
                {job.client.name} · {job.when}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                {st.pulse && (
                  <View
                    style={[styles.statusDot, { backgroundColor: st.color }]}
                  />
                )}
                <Text style={[styles.statusPillText, { color: st.color }]}>
                  {st.label}
                </Text>
              </View>
              <Text style={styles.payout}>
                {job.payout.toLocaleString('fr-FR')} FC
              </Text>
            </View>
            <I.chevronRight size={16} color={theme.colors.textSubtle} />
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyBox({
  iconName,
  title,
  copy,
}: {
  iconName: 'check' | 'calendar';
  title: string;
  copy: string;
}) {
  const Icon = I[iconName];
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Icon size={22} color={theme.colors.success} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function LoadingBox({ copy }: { copy: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={theme.colors.accent} />
      <Text style={styles.stateBoxCopy}>{copy}</Text>
    </View>
  );
}

function ErrorBox({ copy, onRetry }: { copy: string; onRetry: () => void }) {
  return (
    <View style={[styles.stateBox, { borderColor: theme.colors.danger }]}>
      <Text style={[styles.stateBoxCopy, { color: theme.colors.danger }]}>
        {copy}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.btn, styles.btnSecondary, { paddingHorizontal: 18 }]}
      >
        <Text style={styles.btnSecondaryText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.surfacePrimary,
  },
  overline: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  h1: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 26,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionOverline: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },

  // Inbound request card
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    ...theme.shadow.e1,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  clientName: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  clientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  newClientBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.accentSubtle,
  },
  newClientBadgeText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#BE123C',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ratingText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 12,
    color: theme.colors.textBody,
  },
  mutedSmall: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  matchLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  matchValue: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.success,
    letterSpacing: -0.3,
  },
  serviceTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  serviceDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textBody,
    fontStyle: 'italic',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  categoryChipText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    maxWidth: 180,
  },
  chipText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.bg,
    gap: 10,
  },
  metaOverline: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  metaValue: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.success,
    marginTop: 2,
  },
  expirePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  expirePillText: {
    fontFamily: theme.fonts.mono,
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    height: 42,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  btnPrimary: { backgroundColor: theme.colors.primary },
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

  // Active jobs grouped card
  groupedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    ...theme.shadow.e1,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  activeRowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  activeRowTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14.5,
    color: theme.colors.textPrimary,
  },
  activeRowMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 11,
  },
  payout: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },

  // Empty
  emptyBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  emptyCopy: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  // Loading / Error shared
  stateBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  stateBoxCopy: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
