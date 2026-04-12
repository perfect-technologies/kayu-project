import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';

interface Provider {
  id: string;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    city?: string | null;
  };
  profession: string;
  rating: number;
  totalReviews: number;
}

interface FeaturedProvidersProps {
  providers: Provider[];
  onPress?: (provider: Provider) => void;
}

export function FeaturedProviders({ providers, onPress }: FeaturedProvidersProps) {
  if (providers.length === 0) return null;

  return (
    <FlatList
      data={providers}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const name = [item.user?.firstName, item.user?.lastName]
          .filter(Boolean)
          .join(' ') || 'Prestataire';

        return (
          <TouchableOpacity
            style={[styles.card, shadowStyles.md]}
            activeOpacity={0.7}
            onPress={() => onPress?.(item)}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={colors.primary.DEFAULT} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {item.profession && (
              <Text style={styles.profession} numberOfLines={1}>
                {item.profession}
              </Text>
            )}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning.DEFAULT} />
              <Text style={styles.ratingText}>
                {item.rating?.toFixed(1) ?? '—'}
              </Text>
              {item.totalReviews > 0 && (
                <Text style={styles.reviewCount}>({item.totalReviews})</Text>
              )}
            </View>
            {item.user.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.text.tertiary} />
                <Text style={styles.cityText}>{item.user.city}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingRight: spacing.lg,
  },
  card: {
    width: 160,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  profession: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  ratingText: {
    fontSize: fontSizes.sm,
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
    marginTop: 4,
  },
  cityText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
});
