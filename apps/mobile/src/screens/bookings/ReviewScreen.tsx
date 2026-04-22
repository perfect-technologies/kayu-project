import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Avatar, I, type IconName } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { hasProviderReview } from '@/lib/bookingV2';
import { theme } from '@/lib/theme';
import type {
  BookingsStackParamList,
  MainTabParamList,
} from '@/navigation/AppNavigator';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<BookingsStackParamList, 'Review'>,
  BottomTabNavigationProp<MainTabParamList>
>;
type Route = RouteProp<BookingsStackParamList, 'Review'>;

// ─── Dimensions + tags ────────────────────────────────────────────────────

type DimKey = 'punctuality' | 'quality' | 'communication' | 'value' | 'professionalism';

type Dim = {
  key: DimKey;
  label: string;
  desc: string;
  icon: IconName;
};

const REVIEW_DIMENSIONS: Dim[] = [
  { key: 'punctuality', label: 'Ponctualité', desc: "Arrivé à l'heure ?", icon: 'clock' },
  { key: 'quality', label: 'Qualité du travail', desc: 'Résultat à la hauteur ?', icon: 'sparkles' },
  { key: 'communication', label: 'Communication', desc: "Clair, réactif, à l'écoute ?", icon: 'messageCircle' },
  { key: 'value', label: 'Rapport qualité-prix', desc: 'Prix juste pour le service ?', icon: 'coins' },
  { key: 'professionalism', label: 'Professionnalisme', desc: 'Respectueux, soigné, sérieux ?', icon: 'shieldCheck' },
];

const QUICK_TAGS = [
  'Ponctuel',
  'Travail propre',
  'Bon communicant',
  'Prix honnête',
  'Je recommande',
  'Expert dans son domaine',
  'Conseils utiles',
  'Matériel de qualité',
  'Chantier bien rangé',
  'Réactif',
];

type Ratings = Partial<Record<DimKey, number>>;

// ─── DimensionRow ─────────────────────────────────────────────────────────

function DimensionRow({
  dim,
  value,
  onChange,
}: {
  dim: Dim;
  value: number;
  onChange: (n: number) => void;
}) {
  const IconC = I[dim.icon];
  return (
    <View style={styles.dimRow}>
      <View style={styles.dimRowTop}>
        <View style={styles.dimIconBox}>
          <IconC size={18} color={theme.colors.primaryHover} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.dimLabel}>{dim.label}</Text>
          <Text style={styles.dimDesc}>{dim.desc}</Text>
        </View>
        {value > 0 && <Text style={styles.dimScore}>{value}.0</Text>}
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value >= n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''} sur 5`}
              style={[
                styles.starBtn,
                {
                  borderColor: filled ? theme.colors.warning : theme.colors.border,
                  backgroundColor: filled ? theme.colors.warningSubtle : theme.colors.surface,
                },
              ]}
            >
              <I.star size={16} color={filled ? theme.colors.warning : theme.colors.textSubtle} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────

export function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const queryClient = useQueryClient();
  const { data: bookingData, isLoading: isBookingLoading } = useQuery({
    queryKey: queryKeys.bookings.detail(params.bookingId),
    queryFn: () => api.bookings.getById(params.bookingId),
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ratings, setRatings] = useState<Ratings>({});
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const overall = useMemo(() => {
    const vals = Object.values(ratings).filter((v): v is number => typeof v === 'number');
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [ratings]);

  const allRated = Object.keys(ratings).length === REVIEW_DIMENSIONS.length;
  const booking = bookingData?.booking;
  const alreadyReviewed = booking ? hasProviderReview(booking) : false;
  const canReviewBooking = booking?.status === 'COMPLETED' && !alreadyReviewed;
  const canFinish = canReviewBooking && allRated && text.trim().length >= 10;
  const canAdvance = step === 1 ? allRated : step === 2 ? true : canFinish;

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submitMutation = useMutation({
    mutationFn: async () => {
      return api.reviews.create({
        bookingId: params.bookingId,
        providerId: params.providerId,
        rating: Math.round(overall),
        punctuality: ratings.punctuality,
        quality: ratings.quality,
        communication: ratings.communication,
        value: ratings.value,
        professionalism: ratings.professionalism,
        satisfactionTags: tags,
        comment: text.trim(),
        isPublic: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(params.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byProvider(params.providerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.providers.detail(params.providerId),
      });
      setDone(true);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Impossible d'envoyer ton avis. Réessaie.");
    },
  });

  const goHome = () => {
    // Dismiss the review stack, then reset onto the Home tab so the user
    // lands on a clean entry point after completing the loop.
    if (navigation.canGoBack()) navigation.popToTop();
    navigation.navigate('Home');
  };

  const onBack = () => {
    if (step === 1) {
      if (navigation.canGoBack()) navigation.goBack();
      else goHome();
      return;
    }
    setStep((s) => (s === 3 ? 2 : 1));
  };

  if (done) {
    return (
      <ReviewSuccess
        providerFirstName={firstNameFrom(params.providerName)}
        onDone={goHome}
      />
    );
  }

  if (isBookingLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!canReviewBooking) {
    const message =
      alreadyReviewed
        ? 'Un avis a déjà été publié pour cette réservation.'
        : 'Vous pourrez laisser un avis quand la réservation sera terminée.';

    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.centered]}>
        <Text style={styles.guardTitle}>Avis indisponible</Text>
        <Text style={styles.guardText}>{message}</Text>
        <Pressable
          style={styles.guardButton}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('BookingDetail', { bookingId: params.bookingId });
          }}
        >
          <Text style={styles.guardButtonText}>Retour à la réservation</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const titles: Record<1 | 2 | 3, string> = {
    1: 'Notez la mission',
    2: 'Ce qui a fonctionné',
    3: 'Ajoutez un avis écrit',
  };
  const firstName = firstNameFrom(params.providerName);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Top row: back + step */}
          <View style={styles.topRow}>
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
              <I.arrowLeft size={20} color={theme.colors.textBody} />
            </Pressable>
            <Text style={styles.stepCaption}>Étape {step} / 3</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            {[1, 2, 3].map((n) => (
              <View
                key={n}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor:
                      n <= step ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Provider tag */}
          <View style={styles.providerRow}>
            <Avatar name={params.providerName} size={44} />
            <View>
              <Text style={styles.providerName}>{params.providerName}</Text>
              <Text style={styles.providerMeta}>Mission terminée</Text>
            </View>
          </View>

          <Text style={styles.stepTitle}>{titles[step]}</Text>

          {step === 1 && (
            <View>
              {REVIEW_DIMENSIONS.map((d) => (
                <DimensionRow
                  key={d.key}
                  dim={d}
                  value={ratings[d.key] ?? 0}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [d.key]: v }))}
                />
              ))}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.sectionOverline}>Qu&apos;est-ce qui s&apos;est bien passé ?</Text>
              <View style={styles.tagCloud}>
                {QUICK_TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => toggleTag(t)}
                      style={[
                        styles.tagPill,
                        {
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active
                            ? theme.colors.primarySubtle
                            : theme.colors.surface,
                        },
                      ]}
                    >
                      {active && (
                        <I.check size={13} color={theme.colors.primaryHover} />
                      )}
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: active
                              ? theme.colors.primaryHover
                              : theme.colors.textBody,
                          },
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionHint, { marginTop: 18 }]}>
                Les photos seront ajoutees quand l'upload existera. Pour le lancement, seuls les tags et le commentaire sont enregistres.
              </Text>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.sectionOverline}>Votre avis écrit</Text>
              <Text style={styles.sectionHint}>
                Ce sera visible sur le profil de {firstName}. Minimum 10 caractères.
              </Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Raconte ta mission…"
                placeholderTextColor={theme.colors.textSubtle}
                multiline
                textAlignVertical="top"
                style={styles.textarea}
              />
              <Text style={styles.counter}>{text.length} caractères</Text>

              {overall > 0 && (
                <View style={styles.overallSummary}>
                  <View>
                    <Text style={styles.overallOverline}>Note globale</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.overallNumber}>{overall.toFixed(1)}</Text>
                      <Text style={styles.overallDenom}>/ 5</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <I.star
                        key={n}
                        size={20}
                        color={overall >= n - 0.5 ? theme.colors.warning : theme.colors.border}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {submitError && (
            <View style={styles.errorBanner}>
              <I.alertCircle size={15} color={theme.colors.danger} />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky submit */}
        <View style={styles.stickyFooter}>
          <Pressable
            disabled={!canAdvance || submitMutation.isPending}
            onPress={() => {
              if (step === 3) {
                setSubmitError(null);
                submitMutation.mutate();
              } else {
                setStep((s) => (s === 1 ? 2 : 3));
              }
            }}
            style={[
              styles.submitBtn,
              {
                opacity: canAdvance && !submitMutation.isPending ? 1 : 0.5,
              },
            ]}
          >
            <Text style={styles.submitLabel}>
              {step === 3
                ? submitMutation.isPending
                  ? 'Envoi…'
                  : "Publier l'avis"
                : 'Continuer'}
            </Text>
            <I.arrowRight size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Success state ────────────────────────────────────────────────────────

function ReviewSuccess({
  providerFirstName,
  onDone,
}: {
  providerFirstName: string;
  onDone: () => void;
}) {
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <I.check size={44} color={theme.colors.success} />
        </View>
        <Text style={styles.successTitle}>Merci pour ton avis !</Text>
        <Text style={styles.successSub}>
          Ta note aide la communauté à trouver les bons pros. {providerFirstName} sera notifié.
        </Text>
        <Pressable onPress={onDone} style={styles.successBtn}>
          <Text style={styles.successBtnLabel}>Retour à l&apos;accueil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function firstNameFrom(fullName: string): string {
  return fullName.split(/\s+/)[0] || fullName;
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guardTitle: {
    ...theme.text.displayM,
    marginBottom: 8,
    textAlign: 'center',
  },
  guardText: {
    ...theme.text.body,
    color: theme.colors.textBody,
    textAlign: 'center',
    marginBottom: 20,
  },
  guardButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  stepCaption: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  providerName: {
    ...theme.text.bodyM,
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  providerMeta: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  stepTitle: {
    ...theme.text.heading,
    marginBottom: 18,
  },
  // Dimension row
  dimRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  dimRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  dimIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimLabel: {
    ...theme.text.bodyM,
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  dimDesc: {
    ...theme.text.caption,
    marginTop: 2,
  },
  dimScore: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 48,
  },
  starBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tags
  sectionOverline: {
    ...theme.text.overline,
    marginBottom: 12,
  },
  sectionHint: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: theme.fonts.bodyMed,
  },
  // Text + summary
  textarea: {
    minHeight: 180,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
  counter: {
    ...theme.text.caption,
    marginTop: 6,
    textAlign: 'right',
  },
  overallSummary: {
    marginTop: 20,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warningSubtle,
    borderWidth: 1,
    borderColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallOverline: {
    ...theme.text.overline,
    color: theme.colors.textMuted,
  },
  overallNumber: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 32,
    color: theme.colors.textPrimary,
  },
  overallDenom: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  // Error
  errorBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  // Sticky footer
  stickyFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  submitBtn: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: theme.fonts.bodySemi,
  },
  // Success
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  successTitle: {
    ...theme.text.displayM,
    marginBottom: 10,
    textAlign: 'center',
  },
  successSub: {
    ...theme.text.bodyL,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 28,
  },
  successBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: theme.fonts.bodySemi,
  },
});
