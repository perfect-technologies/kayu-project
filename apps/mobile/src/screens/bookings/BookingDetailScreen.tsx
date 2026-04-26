import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import {
  formatRelativeFR,
  formatWhen,
  fullAddress,
  hasClientReview,
  hasProviderReview,
  initialsFromName,
  paymentStatusLabel,
  priceLabelFor,
  toV2Status,
  type V2Status,
} from '@/lib/bookingV2';
import type {
  BookingsStackParamList,
  ProviderStackParamList,
  RequestsStackParamList,
} from '@/navigation/AppNavigator';

type DetailStackParamList = BookingsStackParamList &
  ProviderStackParamList &
  RequestsStackParamList;
type Nav = NativeStackNavigationProp<DetailStackParamList, 'BookingDetail'>;
type Route = RouteProp<BookingsStackParamList, 'BookingDetail'>;
type BackendBookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BookingUpdateInput = {
  status?: BackendBookingStatus;
  cancelReason?: string;
  isPaid?: true;
  paymentMethod?: 'cash';
};

// ─── Timeline ─────────────────────────────────────────────────────────────

const TIMELINE_STEPS: Record<V2Status, string[]> = {
  upcoming: ['booked', 'confirmed', 'done'],
  active: ['booked', 'confirmed', 'done'],
  completed: ['booked', 'confirmed', 'done', 'paid'],
  cancelled: ['booked', 'cancelled'],
};

type StepKey = keyof typeof STEP_META;
const STEP_META = {
  booked: { label: 'Réservation créée', icon: 'calendar' as const },
  confirmed: { label: 'Réservation confirmée', icon: 'check' as const },
  done: { label: 'Terminée', icon: 'badgeCheck' as const },
  paid: { label: 'Paiement espèces confirmé', icon: 'coins' as const },
  cancelled: { label: 'Annulée', icon: 'x' as const },
};

const currentStepIndex = (
  backend: string,
  v2: V2Status,
  isPaid?: boolean | null,
): number => {
  if (v2 === 'upcoming') return backend === 'PENDING' ? 0 : 1;
  if (v2 === 'active') return 1;
  if (v2 === 'completed') return isPaid ? 3 : 2;
  if (v2 === 'cancelled') return 1;
  return 0;
};

// ─── Screen ───────────────────────────────────────────────────────────────

export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bookings.detail(params.bookingId),
    queryFn: () => api.bookings.getById(params.bookingId),
  });

  const syncBookingCaches = React.useCallback(
    (result: { success: boolean; booking: Booking }) => {
      const nextBooking = result.booking;
      queryClient.setQueryData(queryKeys.bookings.detail(params.bookingId), result);
      queryClient.setQueriesData<{ bookings: Booking[] }>(
        { queryKey: ['bookings'] },
        (old) => {
          if (!old?.bookings) return old;
          return {
            ...old,
            bookings: old.bookings.map((item) =>
              item.id === nextBooking.id ? { ...item, ...nextBooking } : item,
            ),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(params.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
    [params.bookingId, queryClient],
  );

  const updateMutation = useMutation({
    mutationFn: (input: BookingUpdateInput) =>
      api.bookings.update(params.bookingId, input),
    onSuccess: (result, input) => {
      syncBookingCaches(result);
      if (input.status === 'CANCELLED') {
        Alert.alert('Annulée', 'La réservation a été annulée.');
      }
    },
    onError: (err: Error) => {
      Alert.alert(
        'Action impossible',
        err.message || "Cette réservation ne peut pas être modifiée maintenant.",
      );
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const current = data?.booking as Booking | undefined;
      if (!current) {
        throw new Error('Réservation introuvable');
      }

      if (current.status === 'CONFIRMED') {
        const started = await api.bookings.update(params.bookingId, {
          status: 'IN_PROGRESS',
        });
        syncBookingCaches(started);
      }

      return api.bookings.update(params.bookingId, { status: 'COMPLETED' });
    },
    onSuccess: (result) => {
      syncBookingCaches(result);
    },
    onError: (err: Error) => {
      Alert.alert(
        'Action impossible',
        err.message || "Cette réservation ne peut pas être terminée maintenant.",
      );
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !data?.booking) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorTitle}>Réservation introuvable</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              refetch();
            }
          }}
        >
          <Text style={styles.primaryBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const booking = data.booking as Booking;
  const v2 = toV2Status(booking.status);
  const isClient = user?.role !== 'PROVIDER';
  const reviewed = hasProviderReview(booking);
  const clientReviewed = hasClientReview(booking);
  const perspective: 'client' | 'pro' = isClient ? 'client' : 'pro';
  const steps = TIMELINE_STEPS[v2];
  const step = currentStepIndex(booking.status ?? '', v2, booking.isPaid);

  const counterparty = isClient
    ? {
        first: booking.provider?.user?.firstName ?? '',
        last: booking.provider?.user?.lastName ?? '',
        role: booking.provider?.profession ?? 'Votre pro',
        verified: !!booking.provider?.user?.isVerified,
      }
    : {
        first: booking.client?.firstName ?? '',
        last: booking.client?.lastName ?? '',
        role: 'Client',
        verified: false,
      };

  const counterName = `${counterparty.first} ${counterparty.last}`.trim() || '—';

  const cancelWithReason = (reason: string) =>
    updateMutation.mutate({ status: 'CANCELLED', cancelReason: reason });

  const onCancel = () => {
    const reasons = isClient
      ? ['Je ne suis plus disponible', 'Mon besoin a changé', 'J’ai trouvé une autre solution']
      : ['Je ne suis plus disponible', 'Hors zone ou hors compétence', 'Planning incompatible'];

    Alert.alert(
      isClient ? 'Annuler la réservation' : 'Décliner la réservation',
      'Sélectionnez la raison à transmettre à l’autre partie.',
      [
        ...reasons.map((reason) => ({
          text: reason,
          style: 'destructive' as const,
          onPress: () => cancelWithReason(reason),
        })),
        { text: 'Retour', style: 'cancel' as const },
      ],
    );
  };

  const onConfirm = () =>
    Alert.alert('Confirmer', 'Accepter cette demande de réservation ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: () => updateMutation.mutate({ status: 'CONFIRMED' }) },
    ]);

  const onComplete = () =>
    Alert.alert('Terminer', 'Confirmer que la mission est terminée ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        onPress: () => completeMutation.mutate(),
      },
    ]);

  const onConfirmPayment = () =>
    Alert.alert(
      'Paiement reçu',
      'Confirmer que le client a payé en espèces ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, paiement reçu',
          onPress: () =>
            updateMutation.mutate({ isPaid: true, paymentMethod: 'cash' }),
        },
      ],
    );

  const onReview = () => {
    if (!booking.providerId || booking.status !== 'COMPLETED' || reviewed) return;
    navigation.navigate('Review', {
      bookingId: booking.id,
      providerId: booking.providerId,
      providerName: counterName,
    });
  };

  const onClientReview = () => {
    if (isClient || booking.status !== 'COMPLETED' || clientReviewed) return;
    navigation.navigate('ClientReview', {
      bookingId: booking.id,
    });
  };

  return (
    <View style={styles.screen}>
      {/* Sticky top bar */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <I.arrowLeft size={17} color={theme.colors.textBody} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>Réservation</Text>
            <Text style={styles.topBarId}>
              #{booking.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <BdStatusChip status={v2} backendStatus={booking.status} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero — service + when + price */}
        <View style={styles.section}>
          <View style={styles.heroCard}>
            <Text style={styles.heroOverline}>{formatWhen(booking.scheduledDate)}</Text>
            <Text style={styles.heroTitle}>{booking.title}</Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPriceLabel}>{priceLabelFor(booking)}</Text>
              <Text style={styles.heroPriceValue}>
                {(booking.price ?? 0).toLocaleString('fr-FR')} FC
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <ActionButtons
            v2={v2}
            backendStatus={booking.status}
            booking={booking}
            isClient={isClient}
            reviewed={reviewed}
            clientReviewed={clientReviewed}
            busy={updateMutation.isPending || completeMutation.isPending}
            onMessage={() => {
              const userId = isClient ? booking.provider?.userId : booking.client?.id;
              if (!userId) return;
              const parent = navigation.getParent();
              (parent as unknown as { navigate: (tab: string, params: object) => void } | undefined)?.navigate(
                'Messages',
                {
                  screen: 'Chat',
                  params: { recipientId: userId, recipientName: counterName },
                },
              );
            }}
            onCancel={onCancel}
            onConfirm={onConfirm}
            onComplete={onComplete}
            onConfirmPayment={onConfirmPayment}
            onReview={onReview}
            onClientReview={onClientReview}
          />
        </View>

        {/* Counterparty */}
        <View style={styles.section}>
          <View style={styles.counterpartyCard}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>
                {initialsFromName(counterparty.first, counterparty.last)}
              </Text>
            </View>
            <View style={styles.counterpartyText}>
              <Text style={styles.counterpartyRole}>{counterparty.role}</Text>
              <View style={styles.nameLine}>
                <Text style={styles.counterpartyName}>{counterName}</Text>
                {counterparty.verified && (
                  <I.badgeCheck size={14} color={theme.colors.success} />
                )}
              </View>
              <Text style={styles.counterpartyMeta}>
                {isClient ? 'Messagez-le directement' : 'Client'}
              </Text>
            </View>
            <View style={styles.counterpartyActions}>
              <Pressable style={styles.smallIconBtn} onPress={() => {
                const userId = isClient ? booking.provider?.userId : booking.client?.id;
                if (!userId) return;
                const parent = navigation.getParent();
                (parent as unknown as { navigate: (tab: string, params: object) => void } | undefined)?.navigate(
                  'Messages',
                  {
                    screen: 'Chat',
                    params: { recipientId: userId, recipientName: counterName },
                  },
                );
              }}>
                <I.messageCircle size={15} color={theme.colors.textBody} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <MobileSection title="Suivi">
          <Timeline steps={steps} step={step} progress={booking.progress ?? null} />
        </MobileSection>

        {/* Address */}
        <MobileSection title={isClient ? 'Où' : 'Adresse'}>
          <AddressBlock booking={booking} isClient={isClient} />
        </MobileSection>

        {/* Final offer / estimate */}
        <MobileSection
          title="Accord"
          subtitle={booking.quote ? 'Confirmé' : 'Estimation'}
        >
          <QuoteBreakdown booking={booking} isClient={isClient} />
        </MobileSection>

        {/* Meta */}
        <MobileSection title="Détails">
          <MetaRow
            label="N° de réservation"
            value={`#${booking.id.slice(0, 8).toUpperCase()}`}
            mono
          />
          <MetaRow
            label="Créée"
            value={formatRelativeFR(booking.createdAt) || '—'}
          />
          <MetaRow
            label={isClient ? 'Paiement' : 'Etat du paiement'}
            value={paymentStatusLabel(booking)}
          />
          {booking.status === 'CANCELLED' && booking.cancelReason ? (
            <MetaRow label="Raison d’annulation" value={booking.cancelReason} />
          ) : null}
        </MobileSection>

        {!isClient && booking.status === 'COMPLETED' ? (
          <MobileSection title="Reputation client">
            <ClientReviewSummary
              reviewed={clientReviewed}
              rating={booking.clientRating ?? booking.clientReview?.rating ?? null}
              paymentRating={
                booking.clientReview?.paymentRating ??
                booking.clientReview?.paymentTimeliness ??
                null
              }
              comment={booking.clientReview?.comment ?? null}
            />
          </MobileSection>
        ) : null}

        {/* Help */}
        <View style={styles.helpWrap}>
          <View style={styles.helpBtn}>
            <I.coins size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.helpText}>Paiement en espèces</Text>
              <Text style={styles.helpSubtext}>
                KAYOU n'encaisse pas encore le client. Le pro confirme le règlement
                en espèces après la mission pour débloquer ses gains.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function BdStatusChip({
  status,
  backendStatus,
}: {
  status: V2Status;
  backendStatus?: string | null;
}) {
  const map: Record<V2Status, { label: string; bg: string; fg: string }> = {
    upcoming: {
      label: backendStatus === 'PENDING' ? 'En attente' : 'Confirmée',
      bg: theme.colors.primarySubtle,
      fg: theme.colors.primaryHover,
    },
    active: {
      label: 'Confirmée',
      bg: theme.colors.primarySubtle,
      fg: theme.colors.primaryHover,
    },
    completed: {
      label: 'Terminée',
      bg: theme.colors.surfaceMuted,
      fg: theme.colors.textBody,
    },
    cancelled: {
      label: 'Annulée',
      bg: theme.colors.dangerSubtle,
      fg: '#BE123C',
    },
  };
  const c = map[status];
  return (
    <View
      style={[
        styles.statusChip,
        { backgroundColor: c.bg },
      ]}
    >
      <Text style={[styles.statusChipText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

function MobileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ClientReviewSummary({
  reviewed,
  rating,
  paymentRating,
  comment,
}: {
  reviewed: boolean;
  rating: number | null;
  paymentRating: string | null;
  comment: string | null;
}) {
  if (!reviewed) {
    return (
      <Text style={styles.reviewHint}>
        Ajoutez un retour sur le paiement et le comportement du client pour enrichir sa reputation avant la prochaine mission.
      </Text>
    );
  }

  return (
    <View style={styles.clientReviewCard}>
      <View style={styles.clientReviewRow}>
        <Text style={styles.clientReviewLabel}>Etat</Text>
        <Text style={styles.clientReviewValue}>Avis envoye</Text>
      </View>
      {paymentRating ? (
        <View style={styles.clientReviewRow}>
          <Text style={styles.clientReviewLabel}>Paiement</Text>
          <Text style={styles.clientReviewValue}>{paymentCopy(paymentRating)}</Text>
        </View>
      ) : null}
      {rating != null ? (
        <View style={styles.clientReviewRow}>
          <Text style={styles.clientReviewLabel}>Comportement</Text>
          <View style={styles.clientReviewRating}>
            <I.star size={13} color={theme.colors.warning} />
            <Text style={styles.clientReviewValue}>{rating.toFixed(1)}</Text>
          </View>
        </View>
      ) : null}
      {comment ? <Text style={styles.clientReviewComment}>{comment}</Text> : null}
    </View>
  );
}

function Timeline({
  steps,
  step,
  progress,
}: {
  steps: string[];
  step: number;
  progress: string | null;
}) {
  return (
    <View>
      {steps.map((s, i) => {
        const meta = STEP_META[s as StepKey];
        const done = i < step;
        const current = i === step;
        const IconCmp = I[meta.icon];
        const isLast = i === steps.length - 1;
        return (
          <View
            key={s}
            style={[styles.tlRow, { paddingBottom: isLast ? 0 : 16 }]}
          >
            {!isLast && (
              <View
                style={[
                  styles.tlConnector,
                  {
                    backgroundColor: done
                      ? theme.colors.success
                      : theme.colors.border,
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.tlCircle,
                {
                  backgroundColor: done
                    ? theme.colors.success
                    : current
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor: done
                    ? theme.colors.success
                    : current
                      ? theme.colors.primary
                      : theme.colors.border,
                },
                current ? styles.tlCircleCurrent : null,
              ]}
            >
              <IconCmp
                size={14}
                color={done || current ? '#fff' : theme.colors.textMuted}
                strokeWidth={2}
              />
            </View>
            <View style={styles.tlLabelWrap}>
              <Text
                style={[
                  styles.tlLabel,
                  {
                    fontWeight: current ? '600' : '500',
                    color:
                      done || current
                        ? theme.colors.textPrimary
                        : theme.colors.textMuted,
                  },
                ]}
              >
                {meta.label}
              </Text>
              {current && (
                <Text style={styles.tlHint}>
                  {progress || 'À confirmer avec le pro'}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function QuoteBreakdown({
  booking,
  isClient,
}: {
  booking: Booking;
  isClient: boolean;
}) {
  if (!booking.quote) {
    const total = booking.price ?? 0;
    const commission = Math.round(total * 0.1);
    const durationHours =
      typeof booking.duration === 'number' ? Math.round((booking.duration / 60) * 10) / 10 : null;

    return (
      <View>
        <MetaRow label="Prix estimé" value={`${total.toLocaleString('fr-FR')} FC`} />
        <MetaRow
          label="Durée estimée"
          value={durationHours ? `${durationHours} h` : 'À confirmer'}
        />
        <MetaRow label="Paiement" value="Paiement en espèces à la fin de la mission" />
        {!isClient && total > 0 ? (
          <>
            <View style={styles.qbExtraRow}>
              <Text style={styles.qbExtraLabel}>Commission KAYOU estimée (10%)</Text>
              <Text style={styles.qbExtraValue}>
                −{commission.toLocaleString('fr-FR')} FC
              </Text>
            </View>
            <View style={styles.qbExtraRow}>
              <Text
                style={[styles.qbExtraLabel, { color: theme.colors.textBody, fontWeight: '600' }]}
              >
                Gain net estimé
              </Text>
              <Text style={[styles.qbExtraValue, styles.qbPayout]}>
                {(total - commission).toLocaleString('fr-FR')} FC
              </Text>
            </View>
          </>
        ) : null}
      </View>
    );
  }

  const lines = booking.quote.lines;
  const subtotal = lines.reduce((a, b) => a + b.qty * b.unitPrice, 0);
  const total = booking.price ?? subtotal;
  const commission = Math.round(total * 0.1);
  return (
    <View>
      {lines.map((l, i) => (
        <View key={i} style={styles.qbRow}>
          <View style={styles.qbLabelCol}>
            <Text style={styles.qbLabel}>{l.label}</Text>
            <Text style={styles.qbMeta}>
              {l.qty} × {l.unit}
            </Text>
          </View>
          <Text style={styles.qbUnit}>
            {l.unitPrice.toLocaleString('fr-FR')} FC
          </Text>
          <Text style={styles.qbTotal}>
            {(l.qty * l.unitPrice).toLocaleString('fr-FR')} FC
          </Text>
        </View>
      ))}
      <View style={styles.qbGrand}>
        <Text style={styles.qbGrandLabel}>Total</Text>
        <Text style={styles.qbGrandValue}>
          {total.toLocaleString('fr-FR')} FC
        </Text>
      </View>
      {!isClient && (
        <>
          <View style={styles.qbExtraRow}>
            <Text style={styles.qbExtraLabel}>Commission KAYOU (10%)</Text>
            <Text style={styles.qbExtraValue}>
              −{commission.toLocaleString('fr-FR')} FC
            </Text>
          </View>
          <View style={styles.qbExtraRow}>
            <Text
              style={[styles.qbExtraLabel, { color: theme.colors.textBody, fontWeight: '600' }]}
            >
              Gain net
            </Text>
            <Text style={[styles.qbExtraValue, styles.qbPayout]}>
              {(total - commission).toLocaleString('fr-FR')} FC
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function AddressBlock({
  booking,
  isClient,
}: {
  booking: Booking;
  isClient: boolean;
}) {
  const address = fullAddress(booking);
  const pin = (booking.city ?? address.split(',').slice(-1)[0] ?? 'Kinshasa').trim();
  return (
    <View>
      <View style={styles.addrRow}>
        <I.mapPin size={16} color={theme.colors.textMuted} />
        <View style={styles.addrText}>
          <Text style={styles.addrLine}>{address}</Text>
          <Text style={styles.addrHint}>
            {isClient ? "Adresse d'intervention" : 'Adresse client'}
          </Text>
        </View>
      </View>
      <View style={styles.miniMap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none" style={styles.miniMapSvg}>
          <Path
            d="M0 70 Q 100 30 200 60 T 400 50"
            stroke="#9CA3AF"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="3,3"
          />
          <Path d="M0 90 L 400 90" stroke="#D1D5DB" strokeWidth={0.8} fill="none" />
          <Circle cx={80} cy={55} r={3} fill="#9CA3AF" />
          <Circle cx={250} cy={65} r={3} fill="#9CA3AF" />
          <Circle cx={350} cy={40} r={3} fill="#9CA3AF" />
        </Svg>
        <View style={styles.mapPinLabel}>
          <I.mapPin size={11} color="#fff" />
          <Text style={styles.mapPinText}>{pin}</Text>
        </View>
        <Pressable style={styles.routeBtn}>
          <Text style={styles.routeBtnText}>Itinéraire ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

function paymentCopy(value: string) {
  switch (value) {
    case 'PREPAID':
      return 'Prepaye';
    case 'ONTIME':
      return "A l'heure";
    case 'LATE':
      return 'Paiement en retard';
    case 'PARTIAL':
      return 'Paiement partiel';
    case 'DISPUTED':
      return 'Paiement en litige';
    default:
      return value;
  }
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[
          styles.metaValue,
          mono ? { fontFamily: theme.fonts.mono, fontSize: 12 } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButtons({
  v2,
  backendStatus,
  booking,
  isClient,
  reviewed,
  clientReviewed,
  busy,
  onMessage,
  onCancel,
  onConfirm,
  onComplete,
  onConfirmPayment,
  onReview,
  onClientReview,
}: {
  v2: V2Status;
  backendStatus?: string | null;
  booking: Booking;
  isClient: boolean;
  reviewed: boolean;
  clientReviewed: boolean;
  busy: boolean;
  onMessage: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onConfirmPayment: () => void;
  onReview: () => void;
  onClientReview: () => void;
}) {
  if (backendStatus === 'PENDING') {
    return (
      <View style={{ gap: 8 }}>
        {!isClient && (
          <Pressable
            style={[styles.primaryBtn, styles.primaryBtnLg]}
            onPress={onConfirm}
            disabled={busy}
          >
            <I.check size={15} color="#fff" />
            <Text style={styles.primaryBtnText}>Confirmer la demande</Text>
          </Pressable>
        )}
        <Pressable style={styles.primaryBtn} onPress={onMessage}>
          <I.messageCircle size={15} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {isClient ? 'Contacter le pro' : 'Contacter le client'}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onCancel} disabled={busy}>
          <Text style={styles.secondaryBtnText}>
            {isClient ? 'Annuler' : 'Décliner'}
          </Text>
        </Pressable>
      </View>
    );
  }
  if (backendStatus === 'CONFIRMED' || backendStatus === 'IN_PROGRESS') {
    return (
      <View style={{ gap: 8 }}>
        {!isClient && (
          <Pressable
            style={[styles.primaryBtn, styles.primaryBtnLg]}
            onPress={onComplete}
            disabled={busy}
          >
            <I.check size={15} color="#fff" />
            <Text style={styles.primaryBtnText}>Marquer comme terminée</Text>
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={onMessage}>
            <I.messageCircle size={14} color={theme.colors.textPrimary} />
            <Text style={styles.secondaryBtnText}>Message</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, { flex: 1 }]}
            onPress={onCancel}
            disabled={busy}
          >
            <Text style={styles.secondaryBtnText}>
              {isClient ? 'Annuler' : 'Annuler'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
  if (v2 === 'active') {
    return (
      <View style={{ gap: 8 }}>
        {!isClient && (
          <Pressable
            style={[styles.primaryBtn, styles.primaryBtnLg]}
            onPress={onComplete}
            disabled={busy}
          >
            <I.check size={15} color="#fff" />
            <Text style={styles.primaryBtnText}>Marquer comme terminée</Text>
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            style={[styles.secondaryBtn, { flex: 1 }]}
            onPress={onMessage}
          >
            <I.messageCircle size={14} color={theme.colors.textPrimary} />
            <Text style={styles.secondaryBtnText}>Message</Text>
          </Pressable>
          {isClient && (
            <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={onMessage}>
              <I.messageCircle size={14} color={theme.colors.textPrimary} />
              <Text style={styles.secondaryBtnText}>Discuter</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }
  if (v2 === 'completed') {
    if (!isClient) {
      return (
        <View style={{ gap: 8 }}>
          {!booking.isPaid && (
            <Pressable style={[styles.primaryBtn, styles.primaryBtnLg]} onPress={onConfirmPayment}>
              <I.coins size={15} color="#fff" />
              <Text style={styles.primaryBtnText}>Confirmer le paiement reçu</Text>
            </Pressable>
          )}
          {!clientReviewed ? (
            <Pressable
              style={booking.isPaid ? styles.primaryBtn : styles.secondaryBtn}
              onPress={onClientReview}
            >
              <I.star
                size={14}
                color={booking.isPaid ? '#fff' : theme.colors.textPrimary}
              />
              <Text
                style={
                  booking.isPaid ? styles.primaryBtnText : styles.secondaryBtnText
                }
              >
                Evaluer le client
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.secondaryBtn}>
              <I.check size={14} color={theme.colors.textPrimary} />
              <Text style={styles.secondaryBtnText}>Avis client envoye</Text>
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isClient && !reviewed && (
            <Pressable style={[booking.isPaid ? styles.primaryBtn : styles.secondaryBtn, { flex: 1 }]} onPress={onReview}>
              <I.star size={14} color={booking.isPaid ? '#fff' : theme.colors.textPrimary} />
              <Text style={booking.isPaid ? styles.primaryBtnText : styles.secondaryBtnText}>Laisser un avis</Text>
            </Pressable>
          )}
          {isClient && reviewed && (
            <Pressable style={[styles.primaryBtn, { flex: 1 }]}>
              <Text style={styles.primaryBtnText}>Réserver à nouveau</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }
  return (
    <Pressable style={styles.secondaryBtn} onPress={onMessage}>
      <Text style={styles.secondaryBtnText}>Contacter</Text>
    </Pressable>
  );
}

// ─── Types + styles ───────────────────────────────────────────────────────

interface Booking {
  id: string;
  title: string;
  status?: string | null;
  scheduledDate?: string | Date | null;
  createdAt?: string | Date | null;
  address?: string | null;
  city?: string | null;
  duration?: number | null;
  price?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  cancelledByRole?: 'client' | 'provider' | 'admin' | null;
  providerId?: string | null;
  provider?: {
    id?: string | null;
    userId?: string | null;
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
    } | null;
  } | null;
  client?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  progress?: string | null;
  reviewed?: boolean | null;
  myRating?: number | null;
  clientReviewed?: boolean | null;
  clientRating?: number | null;
  review?: {
    id?: string | null;
    rating?: number | null;
    overallScore?: number | null;
  } | null;
  clientReview?: {
    id?: string | null;
    rating?: number | null;
    paymentRating?: string | null;
    paymentTimeliness?: string | null;
    comment?: string | null;
  } | null;
  quote?: {
    lines: { label: string; qty: number; unit: string; unitPrice: number }[];
  } | null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  scrollContent: { paddingBottom: 48 },

  // Top bar
  topBarSafe: {
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(250,250,249,0.94)' : theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  topBarCenter: { flex: 1, minWidth: 0 },
  topBarTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  topBarId: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusChip: {
    paddingHorizontal: 9,
    height: 22,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyMed,
  },
  sectionBody: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
  },
  reviewHint: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  clientReviewCard: {
    gap: 12,
  },
  clientReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  clientReviewLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  clientReviewValue: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  clientReviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientReviewComment: {
    ...theme.text.bodyM,
    color: theme.colors.textBody,
    lineHeight: 22,
    paddingTop: 2,
  },

  // Hero
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
  },
  heroOverline: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
    marginBottom: 14,
    lineHeight: 26,
  },
  heroPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  heroPriceLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  heroPriceValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
  },

  // Counterparty
  counterpartyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    fontSize: 16,
  },
  counterpartyText: { flex: 1, minWidth: 0 },
  counterpartyRole: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  counterpartyName: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  counterpartyMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  counterpartyActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timeline
  tlRow: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
  },
  tlConnector: {
    position: 'absolute',
    left: 15,
    top: 28,
    bottom: 0,
    width: 2,
  },
  tlCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlCircleCurrent: {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  tlLabelWrap: { flex: 1, paddingTop: 4 },
  tlLabel: { fontSize: 13.5 },
  tlHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  // Quote
  qbRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    alignItems: 'baseline',
  },
  qbLabelCol: { flex: 1, minWidth: 0 },
  qbLabel: {
    fontSize: 13.5,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  qbMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  qbUnit: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  qbTotal: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  qbGrand: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: theme.colors.textPrimary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  qbGrandLabel: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  qbGrandValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
  },
  qbExtraRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qbExtraLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  qbExtraValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  qbPayout: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  // Address
  addrRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addrText: { flex: 1 },
  addrLine: {
    fontSize: 13.5,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    lineHeight: 19,
  },
  addrHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  miniMap: {
    height: 110,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    overflow: 'hidden',
  },
  miniMapSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPinLabel: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapPinText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  routeBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  routeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  metaLabel: { fontSize: 13, color: theme.colors.textMuted },
  metaValue: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },

  // Action buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  primaryBtnLg: { height: 50 },
  primaryBtnText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  secondaryBtnText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },

  // Help
  helpWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  helpSubtext: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
});
