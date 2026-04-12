import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { formatCDF } from '@kayu/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import { RatingDisplay } from '@/components/reviews/RatingDisplay';
import type { SearchStackParamList, ProfileStackParamList } from '@/navigation/AppNavigator';

// This screen lives in both SearchStack and ProfileStack — use a union type
type Nav = NativeStackNavigationProp<SearchStackParamList & ProfileStackParamList, 'ProviderProfile'>;
type Route = RouteProp<SearchStackParamList & ProfileStackParamList, 'ProviderProfile'>;

export function ProviderProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.providers.detail(params.providerId),
    queryFn: () => api.providers.getById(params.providerId),
  });

  const { data: favCheck } = useQuery({
    queryKey: queryKeys.favorites.check(params.providerId),
    queryFn: () => api.favorites.check(params.providerId),
  });

  const isFavorite = (favCheck?.favorites ?? []).length > 0;

  const toggleFav = useMutation({
    mutationFn: () =>
      isFavorite
        ? api.favorites.remove(params.providerId)
        : api.favorites.add({ providerId: params.providerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.check(params.providerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorState onRetry={() => refetch()} />;

  const name =
    [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' ') ||
    'Prestataire';

  const providerUserId = profile.user.id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
      }
    >
      {/* Header */}
      <View style={[styles.header, shadowStyles.sm]}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary.DEFAULT} />
          </View>
          <TouchableOpacity onPress={() => toggleFav.mutate()} style={styles.favButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? colors.error.DEFAULT : colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.profession}>{profile.profession}</Text>

        <View style={styles.badgeRow}>
          {profile.isAvailable && <Badge label="Disponible" variant="success" />}
          {profile.isPremium && <Badge label="Premium" variant="primary" />}
          {profile.isCertified && <Badge label="Certifié" variant="primary" />}
          {profile.verificationStatus === 'VERIFIED' && (
            <Badge label="Vérifié" variant="success" />
          )}
        </View>

        {profile.user.city && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.locationText}>
              {profile.user.city}, {profile.user.country}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Button
          title="Réserver"
          onPress={() =>
            navigation.navigate('CreateBooking', {
              providerId: params.providerId,
              providerName: name,
            })
          }
          style={styles.actionButton}
        />
        <Button
          title="Contacter"
          variant="outline"
          onPress={() =>
            navigation.navigate('Chat', {
              recipientId: providerUserId,
              recipientName: name,
            })
          }
          style={styles.actionButton}
        />
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        {profile.description && (
          <Text style={styles.bodyText}>{profile.description}</Text>
        )}
        <View style={styles.infoGrid}>
          {profile.experience != null && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expérience</Text>
              <Text style={styles.infoValue}>{profile.experience} ans</Text>
            </View>
          )}
          {profile.hourlyRate != null && profile.hourlyRate > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tarif horaire</Text>
              <Text style={styles.infoValue}>{formatCDF(profile.hourlyRate)}/h</Text>
            </View>
          )}
          {profile.totalJobs > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Missions</Text>
              <Text style={styles.infoValue}>{profile.totalJobs}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Skills */}
      {profile.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences</Text>
          <View style={styles.skillsRow}>
            {profile.skills.map((skill) => (
              <Badge key={skill.name} label={skill.name} variant="neutral" />
            ))}
          </View>
        </View>
      )}

      {/* Certifications */}
      {profile.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {profile.certifications.map((cert) => (
            <View key={cert.id} style={styles.certCard}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.success.DEFAULT} />
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certOrg}>{cert.issuingOrg}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Ratings */}
      {profile.stats && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avis</Text>
            {profile.stats.totalReviews > 0 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllReviews', {
                    providerId: params.providerId,
                    providerName: name,
                  })
                }
              >
                <Text style={styles.seeAllLink}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          <RatingDisplay
            averages={profile.stats.ratingAverages}
            totalReviews={profile.stats.totalReviews}
          />
        </View>
      )}

      {/* Recent reviews */}
      {profile.recentReviews.length > 0 && (
        <View style={styles.section}>
          {profile.recentReviews.slice(0, 3).map((review) => {
            const reviewerName =
              [review.client?.firstName, review.client?.lastName].filter(Boolean).join(' ') || 'Client';
            return (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{reviewerName}</Text>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={13} color={colors.warning.DEFAULT} />
                    <Text style={styles.reviewRatingText}>
                      {review.rating ?? review.overallScore ?? 0}
                    </Text>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={3}>
                    {review.comment}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Categories */}
      {profile.categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.skillsRow}>
            {profile.categories.map((cat) => (
              <Badge key={cat.id} label={cat.name} variant="primary" />
            ))}
          </View>
        </View>
      )}

      {/* Service zones */}
      {profile.serviceZones.length > 0 && (
        <View style={[styles.section, { marginBottom: spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Zones d'intervention</Text>
          <View style={styles.skillsRow}>
            {profile.serviceZones.map((zone, i) => (
              <Badge
                key={`${zone.city}-${i}`}
                label={zone.commune ? `${zone.city}, ${zone.commune}` : zone.city}
                variant="neutral"
              />
            ))}
          </View>
        </View>
      )}
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
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButton: {
    padding: spacing.xs,
  },
  name: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  profession: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: colors.text.tertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  seeAllLink: {
    fontSize: fontSizes.sm,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.medium,
  },
  bodyText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 100,
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  infoValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  certInfo: {
    flex: 1,
  },
  certTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },
  certOrg: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
  },
  reviewCard: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewRatingText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },
  reviewComment: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
