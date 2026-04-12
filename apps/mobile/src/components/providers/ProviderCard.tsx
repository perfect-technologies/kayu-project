import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';
import { formatCDF } from '@kayu/utils';

interface ProviderCardProps {
  provider: {
    id: string;
    profession: string;
    rating: number;
    totalReviews: number;
    hourlyRate?: number | null;
    isAvailable: boolean;
    user: {
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
      city?: string | null;
    };
  };
  onPress: () => void;
}

export function ProviderCard({ provider, onPress }: ProviderCardProps) {
  const name =
    [provider.user.firstName, provider.user.lastName].filter(Boolean).join(' ') ||
    'Prestataire';

  return (
    <TouchableOpacity
      style={[styles.card, shadowStyles.sm]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color={colors.primary.DEFAULT} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.profession} numberOfLines={1}>
          {provider.profession}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={colors.warning.DEFAULT} />
            <Text style={styles.ratingText}>
              {provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
            </Text>
            {provider.totalReviews > 0 && (
              <Text style={styles.reviewCount}>({provider.totalReviews})</Text>
            )}
          </View>

          {provider.user.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.text.tertiary} />
              <Text style={styles.cityText}>{provider.user.city}</Text>
            </View>
          )}
        </View>

        {provider.hourlyRate != null && provider.hourlyRate > 0 && (
          <Text style={styles.price}>{formatCDF(provider.hourlyRate)}/h</Text>
        )}
      </View>

      {provider.isAvailable && <View style={styles.availableDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  profession: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cityText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  price: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary.DEFAULT,
    marginTop: spacing.xs,
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success.DEFAULT,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
});
