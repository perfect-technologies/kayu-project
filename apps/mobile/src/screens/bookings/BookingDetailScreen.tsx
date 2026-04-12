import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { formatDateTime } from '@kayu/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { Button } from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import type { BookingsStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'BookingDetail'>;
type Route = RouteProp<BookingsStackParamList, 'BookingDetail'>;

export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bookings.detail(params.bookingId),
    queryFn: () => api.bookings.getById(params.bookingId),
  });

  const updateBooking = useMutation({
    mutationFn: (status: string) =>
      api.bookings.update(params.bookingId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(params.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: () => api.bookings.cancel(params.bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(params.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      Alert.alert('Succès', 'Réservation annulée');
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;

  const booking = data.booking as any;
  const providerName = booking.provider
    ? [booking.provider.user?.firstName, booking.provider.user?.lastName]
        .filter(Boolean)
        .join(' ')
    : 'Prestataire';

  const isProvider = user?.role === 'PROVIDER';
  const canConfirm = isProvider && booking.status === 'PENDING';
  const canStart = isProvider && booking.status === 'CONFIRMED';
  const canComplete = isProvider && booking.status === 'IN_PROGRESS';
  const canCancel =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canReview = booking.status === 'COMPLETED' && !isProvider;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={styles.statusSection}>
        <BookingStatusBadge status={booking.status} />
      </View>

      {/* Title & provider */}
      <View style={styles.section}>
        <Text style={styles.title}>{booking.title}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={colors.text.tertiary} />
          <Text style={styles.infoText}>{providerName}</Text>
        </View>
        {booking.scheduledDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.infoText}>
              {formatDateTime(String(booking.scheduledDate))}
            </Text>
          </View>
        )}
        {booking.city && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.infoText}>
              {booking.address ? `${booking.address}, ${booking.city}` : booking.city}
            </Text>
          </View>
        )}
        {booking.price != null && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.infoText}>{booking.price.toLocaleString()} CDF</Text>
          </View>
        )}
        {booking.duration != null && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.infoText}>{booking.duration} min</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {booking.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>{booking.description}</Text>
        </View>
      )}

      {/* Notes */}
      {booking.clientNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes client</Text>
          <Text style={styles.bodyText}>{booking.clientNotes}</Text>
        </View>
      )}
      {booking.providerNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes prestataire</Text>
          <Text style={styles.bodyText}>{booking.providerNotes}</Text>
        </View>
      )}

      {/* Cancel reason */}
      {booking.cancelReason && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raison d'annulation</Text>
          <Text style={styles.bodyText}>{booking.cancelReason}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {canConfirm && (
          <Button
            title="Confirmer la réservation"
            loading={updateBooking.isPending}
            onPress={() =>
              Alert.alert(
                'Confirmer',
                'Voulez-vous confirmer cette réservation ?',
                [
                  { text: 'Non', style: 'cancel' },
                  { text: 'Oui', onPress: () => updateBooking.mutate('CONFIRMED') },
                ],
              )
            }
          />
        )}
        {canStart && (
          <Button
            title="Démarrer la mission"
            loading={updateBooking.isPending}
            onPress={() => updateBooking.mutate('IN_PROGRESS')}
          />
        )}
        {canComplete && (
          <Button
            title="Marquer comme terminée"
            loading={updateBooking.isPending}
            onPress={() =>
              Alert.alert(
                'Terminer',
                'Confirmer que la mission est terminée ?',
                [
                  { text: 'Non', style: 'cancel' },
                  { text: 'Oui', onPress: () => updateBooking.mutate('COMPLETED') },
                ],
              )
            }
          />
        )}
        {canReview && (
          <Button
            title="Laisser un avis"
            onPress={() =>
              navigation.navigate('Review', {
                bookingId: booking.id,
                providerId: booking.providerId ?? '',
                providerName,
              })
            }
          />
        )}
        {canCancel && (
          <Button
            title="Annuler la réservation"
            variant="outline"
            loading={cancelBooking.isPending}
            onPress={() =>
              Alert.alert(
                'Annuler',
                'Voulez-vous vraiment annuler cette réservation ?',
                [
                  { text: 'Non', style: 'cancel' },
                  { text: 'Oui', onPress: () => cancelBooking.mutate(), style: 'destructive' },
                ],
              )
            }
            textStyle={{ color: colors.error.DEFAULT }}
            style={{ borderColor: colors.error.DEFAULT }}
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
  statusSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    flex: 1,
  },
  bodyText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
});
