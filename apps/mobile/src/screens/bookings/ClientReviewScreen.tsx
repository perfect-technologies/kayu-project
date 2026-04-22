import React, { useState } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, I } from '@kayu/ui/mobile';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hasClientReview } from '@/lib/bookingV2';
import { theme } from '@/lib/theme';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ProviderStackParamList, 'ClientReview'>;
type Route = RouteProp<ProviderStackParamList, 'ClientReview'>;
type PaymentRating = 'PREPAID' | 'ONTIME' | 'LATE' | 'PARTIAL' | 'DISPUTED';

const PAYMENT_OPTIONS: {
  value: PaymentRating;
  label: string;
  description: string;
}[] = [
  { value: 'PREPAID', label: 'Prepaye', description: 'Paiement recu avant ou au debut' },
  { value: 'ONTIME', label: 'A l heure', description: 'Paiement normal a la fin' },
  { value: 'LATE', label: 'Retard', description: 'Paiement recu avec delai' },
  { value: 'PARTIAL', label: 'Partiel', description: 'Paiement incomplet' },
  { value: 'DISPUTED', label: 'Litige', description: 'Paiement conteste ou bloque' },
];

const QUICK_TAGS = [
  'Paiement fluide',
  'Consignes claires',
  'Respectueux',
  'Disponible',
  'Ponctuel',
  'Je reprendrais cette mission',
];

function RatingRow({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const displayValue = value ?? 0;

  return (
    <View style={styles.ratingRow}>
      <View style={styles.ratingHeader}>
        <View>
          <Text style={styles.ratingLabel}>{label}</Text>
          <Text style={styles.ratingHelper}>{helper}</Text>
        </View>
        {displayValue > 0 ? <Text style={styles.ratingValue}>{displayValue}.0</Text> : null}
      </View>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = displayValue >= star;
          return (
            <Pressable
              key={star}
              onPress={() => onChange(star)}
              style={[
                styles.starButton,
                active ? styles.starButtonActive : null,
              ]}
            >
              <I.star
                size={16}
                color={active ? theme.colors.warning : theme.colors.textSubtle}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ClientReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [paymentRating, setPaymentRating] = useState<PaymentRating>('ONTIME');
  const [communication, setCommunication] = useState<number | null>(null);
  const [respectfulness, setRespectfulness] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bookings.detail(params.bookingId),
    queryFn: () => api.bookings.getById(params.bookingId),
  });

  const booking = data?.booking;
  const clientName =
    `${booking?.client?.firstName ?? ''} ${booking?.client?.lastName ?? ''}`.trim() ||
    'Client';
  const alreadyReviewed = booking ? hasClientReview(booking) : false;
  const canReview =
    user?.role === 'PROVIDER' &&
    booking?.status === 'COMPLETED' &&
    !alreadyReviewed &&
    Boolean(booking?.client?.id);

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!booking?.client?.id) {
        throw new Error("Impossible d'identifier le client pour cet avis.");
      }

      return api.reviews.createClient({
        bookingId: params.bookingId,
        clientId: booking.client.id,
        paymentRating,
        communication: communication ?? undefined,
        respectfulness: respectfulness ?? undefined,
        tags,
        comment: comment.trim() || undefined,
        isPublic: true,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(params.bookingId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobRequests.inboxForPro,
        }),
      ]);
      setDone(true);
    },
  });

  if (done) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.centered]}>
        <View style={styles.successIcon}>
          <I.check size={22} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Avis client enregistre</Text>
        <Text style={styles.successText}>
          La reputation client sera prise en compte sur les prochaines demandes.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.replace('BookingDetail', { bookingId: params.bookingId })}
        >
          <Text style={styles.primaryButtonText}>Retour a la reservation</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!canReview) {
    const message = alreadyReviewed
      ? 'Vous avez deja evalue ce client pour cette reservation.'
      : "L'avis client n'est disponible qu'une fois la mission terminee.";

    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.centered]}>
        <Text style={styles.guardTitle}>Evaluation indisponible</Text>
        <Text style={styles.guardText}>{message}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.replace('BookingDetail', { bookingId: params.bookingId })}
        >
          <Text style={styles.primaryButtonText}>Retour a la reservation</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
            >
              <I.arrowLeft size={18} color={theme.colors.textBody} />
            </Pressable>
            <Text style={styles.headerTitle}>Evaluer le client</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.clientCard}>
            <Avatar name={clientName} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.clientMeta}>{booking?.title ?? 'Mission terminee'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paiement</Text>
            <Text style={styles.sectionHint}>
              Ce point alimente la reputation du client pour les prochains pros.
            </Text>
            <View style={styles.paymentList}>
              {PAYMENT_OPTIONS.map((option) => {
                const active = paymentRating === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPaymentRating(option.value)}
                    style={[styles.paymentCard, active ? styles.paymentCardActive : null]}
                  >
                    <Text style={[styles.paymentLabel, active ? styles.paymentLabelActive : null]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.paymentDescription,
                        active ? styles.paymentDescriptionActive : null,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comportement</Text>
            <RatingRow
              label="Communication"
              helper="Besoin clair, reponses utiles, consignes coherentes"
              value={communication}
              onChange={setCommunication}
            />
            <RatingRow
              label="Respect"
              helper="Ponctualite, courtoisie, conditions de travail"
              value={respectfulness}
              onChange={setRespectfulness}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points marquants</Text>
            <View style={styles.tagCloud}>
              {QUICK_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.tag, active ? styles.tagActive : null]}
                  >
                    {active ? <I.check size={12} color={theme.colors.primaryHover} /> : null}
                    <Text style={[styles.tagText, active ? styles.tagTextActive : null]}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Ajoutez un contexte utile pour les prochains prestataires"
              placeholderTextColor={theme.colors.textSubtle}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>

          {submitMutation.error instanceof Error ? (
            <Text style={styles.errorText}>{submitMutation.error.message}</Text>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              ((communication ?? 0) < 1 ||
                (respectfulness ?? 0) < 1 ||
                submitMutation.isPending) &&
                styles.primaryButtonDisabled,
            ]}
            disabled={
              (communication ?? 0) < 1 ||
              (respectfulness ?? 0) < 1 ||
              submitMutation.isPending
            }
            onPress={() => submitMutation.mutate()}
          >
            <Text style={styles.primaryButtonText}>
              {submitMutation.isPending ? 'Envoi...' : 'Enregistrer cet avis'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  clientCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientName: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  clientMeta: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    padding: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  sectionHint: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
  },
  paymentList: {
    gap: 10,
  },
  paymentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    backgroundColor: theme.colors.bg,
  },
  paymentCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  paymentLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 14,
    color: theme.colors.textBody,
  },
  paymentLabelActive: {
    color: theme.colors.primaryHover,
  },
  paymentDescription: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  paymentDescriptionActive: {
    color: theme.colors.primaryHover,
  },
  ratingRow: {
    gap: 10,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  ratingHelper: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  ratingValue: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warningSubtle,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  tagText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.textBody,
  },
  tagTextActive: {
    color: theme.colors.primaryHover,
  },
  textarea: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    padding: 14,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 15,
    color: '#fff',
  },
  guardTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  guardText: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  successText: {
    ...theme.text.bodyM,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    ...theme.text.bodyM,
    color: theme.colors.danger,
    textAlign: 'center',
  },
});
