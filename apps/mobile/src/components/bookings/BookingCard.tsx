import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { I } from '@kayu/ui/mobile';
import { theme } from '@/lib/theme';
import {
  categoryFromTitle,
  formatWhen,
  fullAddress,
  initialsFromName,
  priceLabelFor,
  toV2Status,
  type V2Status,
} from '@/lib/bookingV2';
import { BookingStatusChip } from './BookingStatusChip';

export interface MobileBookingCardData {
  id: string;
  title: string;
  status: string;
  scheduledDate?: string | Date | null;
  address?: string | null;
  city?: string | null;
  price?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  providerId?: string | null;
  provider?: {
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
    } | null;
  } | null;
  client?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  progress?: string | null;
  reviewed?: boolean | null;
  myRating?: number | null;
  cancelledByRole?: 'provider' | 'client' | 'admin' | null;
}

export function BookingCard({
  booking,
  perspective = 'client',
  onPress,
}: {
  booking: MobileBookingCardData;
  perspective?: 'client' | 'pro';
  onPress: () => void;
}) {
  const v2 = toV2Status(booking.status);
  const category = categoryFromTitle(booking.title);
  const portfolio = theme.portfolio[category];
  const IconCmp = I[portfolio.iconName as keyof typeof I] ?? I.wrench;
  const when = formatWhen(booking.scheduledDate);
  const address = fullAddress(booking);

  const counterparty =
    perspective === 'client'
      ? {
          first: booking.provider?.user?.firstName ?? '',
          last: booking.provider?.user?.lastName ?? '',
          verified: !!booking.provider?.user?.isVerified,
        }
      : {
          first: booking.client?.firstName ?? '',
          last: booking.client?.lastName ?? '',
          verified: false,
        };
  const counterName = `${counterparty.first} ${counterparty.last}`.trim() || '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        theme.shadow.e1,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.dateRow}>
          <I.calendar size={14} color={theme.colors.textMuted} />
          <Text style={styles.dateText}>{when}</Text>
        </View>
        <BookingStatusChip status={v2} backendStatus={booking.status} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View
          style={[
            styles.tile,
            { backgroundColor: portfolio.bg },
          ]}
        >
          <IconCmp size={24} color={portfolio.accent} />
        </View>
        <View style={styles.bodyText}>
          <Text style={styles.service} numberOfLines={1}>
            {booking.title}
          </Text>
          <View style={styles.nameRow}>
            <View
              style={[
                styles.miniAvatar,
                { backgroundColor: portfolio.accent },
              ]}
            >
              <Text style={styles.miniAvatarText}>
                {initialsFromName(counterparty.first, counterparty.last)}
              </Text>
            </View>
            <Text style={styles.nameText} numberOfLines={1}>
              {counterName}
            </Text>
            {counterparty.verified && (
              <I.badgeCheck size={12} color={theme.colors.success} />
            )}
          </View>
          <View style={styles.addressRow}>
            <I.mapPin size={11} color={theme.colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress banner (active only) */}
      {booking.progress ? (
        <View style={styles.progress}>
          <I.mapPin size={14} color="#047857" />
          <Text style={styles.progressText}>{booking.progress}</Text>
        </View>
      ) : null}

      {/* Footer: price + context action */}
      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>
            {(booking.price ?? 0).toLocaleString('fr-FR')} FC
          </Text>
          <Text style={styles.priceLabel}> · {priceLabelFor(booking)}</Text>
        </View>
        <FooterAction
          v2={v2}
          reviewed={booking.reviewed}
          myRating={booking.myRating}
          cancelledByRole={booking.cancelledByRole}
          perspective={perspective}
        />
      </View>
    </Pressable>
  );
}

function FooterAction({
  v2,
  reviewed,
  myRating,
  cancelledByRole,
  perspective,
}: {
  v2: V2Status;
  reviewed?: boolean | null;
  myRating?: number | null;
  cancelledByRole?: 'provider' | 'client' | 'admin' | null;
  perspective: 'client' | 'pro';
}) {
  if (v2 === 'completed' && perspective === 'client' && !reviewed) {
    return (
      <View style={styles.ctaInline}>
        <Text style={styles.ctaInlineText}>Laisser un avis</Text>
        <I.arrowRight size={12} color={theme.colors.primaryHover} />
      </View>
    );
  }
  if (v2 === 'completed' && reviewed && myRating != null) {
    return (
      <View style={styles.ctaInline}>
        <I.star size={12} color={theme.colors.warning} />
        <Text style={styles.ratingText}>{myRating.toFixed(1)}</Text>
      </View>
    );
  }
  if (v2 === 'cancelled' && cancelledByRole) {
    return (
      <Text style={styles.cancelledBy}>
        {cancelledByRole === 'admin'
          ? 'Par KAYOU'
          : cancelledByRole === 'provider'
          ? perspective === 'client'
            ? 'Par le pro'
            : 'Par vous'
          : perspective === 'client'
            ? 'Par vous'
            : 'Par le client'}
      </Text>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 16,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dateText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  body: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bodyText: {
    flex: 1,
    minWidth: 0,
  },
  service: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '700',
    fontFamily: theme.fonts.bodySemi,
  },
  nameText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  progress: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.successSubtle,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
  },
  priceValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  ctaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaInlineText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cancelledBy: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
