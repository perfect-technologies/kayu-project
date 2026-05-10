import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Avatar,
  Chip,
  I,
  PhotoTile,
  TrustChip,
  type TrustLevel,
} from '@kayu/ui/mobile';
import { tokens, formatHourly, type CategorySlug } from '@kayu/ui';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import {
  FloatingBackButton,
  FloatingHeartButton,
  FloatingShareButton,
  IconButton,
  StickyBottomBar,
} from '@/components/shell';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import { toCategorySlug } from '@/lib/providerAdapter';
import type { SearchStackParamList, ProfileStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SearchStackParamList & ProfileStackParamList, 'ProviderProfile'>;
type Route = RouteProp<SearchStackParamList & ProfileStackParamList, 'ProviderProfile'>;

const RATING_DIMENSIONS: {
  key: 'punctuality' | 'quality' | 'communication' | 'value' | 'professionalism';
  label: string;
  icon: keyof typeof I;
}[] = [
  { key: 'punctuality', label: 'Ponctualité', icon: 'clock' },
  { key: 'quality', label: 'Qualité', icon: 'wrench' },
  { key: 'communication', label: 'Communication', icon: 'messageCircle' },
  { key: 'value', label: 'Rapport qualité-prix', icon: 'coins' },
  { key: 'professionalism', label: 'Professionnalisme', icon: 'award' },
];

export function ProviderProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.providers.detail(params.providerId),
    queryFn: () => api_getById(params.providerId),
  });

  const { data: favCheck } = useQuery({
    queryKey: queryKeys.favorites.check(params.providerId),
    queryFn: () => api_favCheck(params.providerId),
  });
  const isFavorite = (favCheck?.favorites ?? []).length > 0;

  const toggleFav = useMutation({
    mutationFn: () =>
      isFavorite
        ? api_favRemove(params.providerId)
        : api_favAdd(params.providerId),
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

  const firstName = profile.user.firstName ?? '';
  const lastName = profile.user.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Prestataire';
  const categorySlug: CategorySlug = toCategorySlug(profile.categories?.[0]?.slug);
  const portfolio = tokens.portfolio[categorySlug];
  const rating = profile.rating ?? 0;
  const totalReviews = profile.totalReviews ?? 0;
  const totalJobs = profile.totalJobs ?? 0;
  const responseMinutes = profile.responseTime ?? 0;
  const responseLabel =
    responseMinutes > 0 && responseMinutes < 60
      ? `${responseMinutes} min`
      : responseMinutes >= 60
        ? `${Math.round(responseMinutes / 60)}h`
        : 'À confirmer';
  const isFastResponse = responseLabel.includes('min');
  const hourly = profile.hourlyRate ?? 0;
  const trustLevel: TrustLevel = profile.trustScore?.trustLevel ?? 'NEWCOMER';
  const ratingAverages = profile.stats.ratingAverages;
  const portfolioItems = profile.portfolio ?? [];
  const recentReviews = profile.recentReviews ?? [];
  const phone = profile.user.phone ?? null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Full-bleed photo hero */}
        <View style={styles.hero}>
          <PhotoTile category={categorySlug} aspect="16/11" radius={0} showAmbient>
            {/* Floating header row */}
            <View style={[styles.floatRow, { top: 14 + insets.top }]} pointerEvents="box-none">
              <FloatingBackButton
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else (navigation.getParent() as any)?.navigate('Home');
                }}
              />
              <View style={styles.floatRight}>
                <FloatingShareButton />
                <FloatingHeartButton active={isFavorite} onPress={() => toggleFav.mutate()} />
              </View>
            </View>

            {/* Specialty tag */}
            <View style={[styles.specTag, { top: 74 + insets.top }]}>
              <Text style={[styles.specTagText, { color: portfolio.accent }]}>
                {portfolio.label}
              </Text>
            </View>

            {/* Top-rated pill */}
            {trustLevel === 'TOP_RATED' ? (
              <View style={styles.topRatedPill}>
                <I.award size={12} color={theme.colors.textInverse} />
                <Text style={styles.topRatedText}>Top rated</Text>
              </View>
            ) : null}
          </PhotoTile>

          {/* Overlapping avatar */}
          <View style={styles.avatarWrap} pointerEvents="none">
            <View style={styles.avatarRing}>
              <Avatar
                name={fullName}
                src={profile.user.avatar ?? undefined}
                size={88}
                online={profile.isAvailable}
              />
            </View>
          </View>
        </View>

        {/* Identity block */}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
            {profile.verificationStatus === 'VERIFIED' || profile.user.isVerified ? (
              <I.badgeCheck size={18} color={theme.colors.success} />
            ) : null}
          </View>
          <Text style={styles.profession}>{profile.profession}</Text>
          {profile.user.city ? (
            <View style={styles.locRow}>
              <I.mapPin size={12} color={theme.colors.textMuted} />
              <Text style={styles.locText}>
                {profile.user.city}
                {profile.user.country ? `, ${profile.user.country}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stat row — divided */}
        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <View style={styles.statNumRow}>
              <I.star size={14} color={theme.colors.warning} fill={theme.colors.warning} />
              <Text style={styles.statNum}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={styles.statLabel}>{totalReviews} avis</Text>
          </View>
          <View style={[styles.statCell, styles.statCellMiddle]}>
            <Text style={styles.statNum}>{totalJobs}</Text>
            <Text style={styles.statLabel}>missions</Text>
          </View>
          <View style={styles.statCell}>
            <Text
              style={[
                styles.statNum,
                isFastResponse && { color: theme.colors.success },
              ]}
            >
              {responseMinutes > 0 ? `~${responseLabel}` : responseLabel}
            </Text>
            <Text style={styles.statLabel}>délai moyen</Text>
          </View>
        </View>

        {/* Trust chips */}
        <View style={styles.chipsRow}>
          <TrustChip trust={trustLevel} />
          {profile.verificationStatus === 'VERIFIED' ? (
            <Chip
              size="sm"
              variant="neutral"
              leadingIcon={<I.badgeCheck size={12} color={theme.colors.textBody} />}
            >
              Identité vérifiée
            </Chip>
          ) : null}
          {profile.isCertified ? (
            <Chip
              size="sm"
              variant="neutral"
              leadingIcon={<I.shieldCheck size={12} color={theme.colors.textBody} />}
            >
              Certification vérifiée
            </Chip>
          ) : null}
        </View>

        {/* À propos */}
        <Section title="À propos">
          {profile.description ? (
            <Text style={styles.bodyText}>{profile.description}</Text>
          ) : (
            <Text style={styles.bodyMuted}>Pas encore de description.</Text>
          )}
          {profile.experience != null ? (
            <Text style={[styles.bodyMuted, { marginTop: 8 }]}>
              {profile.experience} ans d'expérience
            </Text>
          ) : null}
          {profile.skills.length > 0 ? (
            <View style={styles.chipCloud}>
              {profile.skills.slice(0, 12).map((s) => (
                <Chip key={s.name} size="sm" variant="neutral">
                  {s.name}
                </Chip>
              ))}
            </View>
          ) : null}
          {profile.certifications.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {profile.certifications.map((cert) => (
                <View key={cert.id} style={styles.certRow}>
                  <I.shieldCheck size={18} color={theme.colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certTitle}>{cert.title}</Text>
                    {cert.issuingOrg ? (
                      <Text style={styles.certOrg}>{cert.issuingOrg}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {profile.serviceZones.length > 0 ? (
            <View style={[styles.chipCloud, { marginTop: 12 }]}>
              {profile.serviceZones.map((zone, i) => (
                <Chip key={`${zone.city}-${i}`} size="sm" variant="neutral">
                  {zone.commune ? `${zone.city}, ${zone.commune}` : zone.city}
                </Chip>
              ))}
            </View>
          ) : null}
        </Section>
        <Divider />

        {/* Évaluations KAYOU */}
        <Section title="Évaluations KAYOU" subtitle="Notes par dimension">
          {totalReviews === 0 ? (
            <Text style={styles.bodyMuted}>Pas encore d'évaluation.</Text>
          ) : (
            <View style={{ gap: 10, marginTop: 6 }}>
              {RATING_DIMENSIONS.map((d) => {
                const Icon = I[d.icon];
                const value = ratingAverages[d.key] ?? 0;
                const pct = Math.max(0, Math.min(1, value / 5));
                const color =
                  value >= 4
                    ? theme.colors.success
                    : value >= 3
                      ? theme.colors.warning
                      : theme.colors.danger;
                return (
                  <View key={d.key} style={styles.ratingRow}>
                    <Icon size={16} color={theme.colors.textBody} />
                    <Text style={styles.ratingLabel}>{d.label}</Text>
                    <View style={styles.ratingBarWrap}>
                      <View
                        style={[
                          styles.ratingBar,
                          { width: `${pct * 100}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingValue}>
                      {value > 0 ? value.toFixed(1) : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Section>
        <Divider />

        {/* Portfolio */}
        {portfolioItems.length > 0 ? (
          <>
            <Section title="Portfolio">
              <View style={styles.portfolioGrid}>
                {portfolioItems.slice(0, 6).map((item, i) => (
                  <View key={item.id ?? i} style={styles.portfolioItem}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImg} />
                    ) : (
                      <PhotoTile
                        category={categorySlug}
                        aspect="1/1"
                        radius={theme.radius.md}
                        showAmbient
                      />
                    )}
                  </View>
                ))}
              </View>
            </Section>
            <Divider />
          </>
        ) : null}

        {/* Avis */}
        <Section title={`Avis · ${totalReviews}`}>
          {recentReviews.length === 0 ? (
            <Text style={styles.bodyMuted}>Pas encore d'avis.</Text>
          ) : (
            <View style={{ gap: 14, marginTop: 4 }}>
              {recentReviews.slice(0, 3).map((r) => {
                const reviewer =
                  [r.client?.firstName, r.client?.lastName].filter(Boolean).join(' ') ||
                  'Client';
                return (
                  <View key={r.id}>
                    <View style={styles.reviewHead}>
                      <Text style={styles.reviewName}>{reviewer}</Text>
                      <View style={styles.reviewRating}>
                        <I.star size={13} color={theme.colors.warning} fill={theme.colors.warning} />
                        <Text style={styles.reviewScore}>
                          {(r.rating ?? r.overallScore ?? 0).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    {r.comment ? (
                      <Text numberOfLines={4} style={styles.reviewComment}>
                        {r.comment}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
              {totalReviews > 3 ? (
                <Pressable
                  style={styles.seeAllBtn}
                  onPress={() =>
                    navigation.navigate('AllReviews', {
                      providerId: params.providerId,
                      providerName: fullName,
                    })
                  }
                >
                  <Text style={styles.seeAllText}>Voir tous les avis</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </Section>
      </ScrollView>

      {/* Sticky price/reserve bar */}
      <StickyBottomBar>
        <View style={styles.priceBlock}>
          <Text style={styles.pricePrefix}>À partir de</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.priceText}>{formatHourly(hourly)} FC</Text>
            <Text style={styles.priceSuffix}> /h</Text>
          </View>
          <View style={styles.priceMeta}>
            <I.star size={11} color={theme.colors.warning} fill={theme.colors.warning} />
            <Text style={styles.priceRating}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.priceReviews}>· {totalReviews}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <IconButton
          accessibilityLabel="Envoyer un message"
          size={44}
          onPress={() =>
            navigation.navigate('Chat', {
              recipientId: profile.user.id,
              recipientName: fullName,
            })
          }
        >
          <I.messageCircle size={17} color={theme.colors.textPrimary} />
        </IconButton>
        {phone ? (
          <IconButton
            accessibilityLabel="Appeler"
            size={44}
            onPress={() => Linking.openURL(`tel:${phone}`)}
          >
            <I.phone size={17} color={theme.colors.textPrimary} />
          </IconButton>
        ) : null}
        <Pressable
          accessibilityRole="button"
          style={styles.reserve}
          onPress={() =>
            navigation.navigate('CreateBooking', {
              providerId: params.providerId,
              providerName: fullName,
            })
          }
        >
          <Text style={styles.reserveText}>Réserver</Text>
        </Pressable>
      </StickyBottomBar>
    </View>
  );
}

function Section({
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
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const api_getById = (id: string) => api.providers.getById(id);
const api_favCheck = (id: string) => api.favorites.check(id);
const api_favAdd = (id: string) => api.favorites.add({ providerId: id });
const api_favRemove = (id: string) => api.favorites.remove(id);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  hero: {
    position: 'relative',
    width: '100%',
  },
  floatRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  floatRight: {
    flexDirection: 'row',
    gap: 8,
  },
  specTag: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 2,
  },
  specTagText: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  topRatedPill: {
    position: 'absolute',
    left: 16,
    bottom: 74,
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  topRatedText: {
    fontFamily: theme.fonts.bodySemi,
    color: theme.colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  avatarWrap: {
    position: 'absolute',
    left: '50%',
    bottom: -40,
    transform: [{ translateX: -48 }],
    zIndex: 3,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.bg,
  },
  identity: {
    paddingHorizontal: 24,
    paddingTop: 54,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  name: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
  },
  profession: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  statRow: {
    marginHorizontal: 20,
    marginTop: 18,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    borderBottomColor: theme.colors.borderSubtle,
    paddingVertical: 14,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCellMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: theme.colors.borderSubtle,
    borderRightColor: theme.colors.borderSubtle,
  },
  statNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statNum: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 18,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  bodyText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textBody,
  },
  bodyMuted: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  chipCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  certTitle: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  certOrg: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: theme.colors.borderSubtle,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingLabel: {
    width: 140,
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  ratingBarWrap: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    borderRadius: 2,
  },
  ratingValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    width: 30,
    textAlign: 'right',
    color: theme.colors.textPrimary,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioItem: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
  },
  portfolioImg: {
    width: '100%',
    height: '100%',
  },
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewScore: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  reviewComment: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textBody,
    marginTop: 4,
  },
  seeAllBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  seeAllText: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  priceBlock: {
    flexShrink: 1,
  },
  pricePrefix: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 1,
  },
  priceText: {
    fontFamily: theme.fonts.mono,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
  },
  priceSuffix: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  priceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  priceRating: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  priceReviews: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  reserve: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
});
