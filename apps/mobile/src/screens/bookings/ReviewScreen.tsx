import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { api } from '@/lib/api';
import { colors, spacing, fontSizes, fontWeights } from '@/lib/theme';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { RatingInput } from '@/components/reviews/RatingInput';
import type { BookingsStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'Review'>;
type Route = RouteProp<BookingsStackParamList, 'Review'>;

export function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [quality, setQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [value, setValue] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const createReview = useMutation({
    mutationFn: () =>
      api.reviews.create({
        bookingId: params.bookingId,
        providerId: params.providerId,
        rating,
        isPublic: true,
        punctuality: punctuality || undefined,
        quality: quality || undefined,
        communication: communication || undefined,
        value: value || undefined,
        professionalism: professionalism || undefined,
        comment: comment || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(params.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byProvider(params.providerId) });
      Alert.alert('Merci !', 'Votre avis a été enregistré', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.message || 'Impossible de soumettre l\'avis');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Veuillez donner une note globale');
      return;
    }
    setError('');
    createReview.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Évaluez {params.providerName}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <RatingInput
          label="Note globale *"
          icon="star-outline"
          value={rating}
          onChange={setRating}
        />

        <View style={styles.divider} />

        <Text style={styles.categoryTitle}>Notes détaillées (optionnel)</Text>

        <RatingInput
          label="Ponctualité"
          icon="time-outline"
          value={punctuality}
          onChange={setPunctuality}
        />
        <RatingInput
          label="Qualité"
          icon="ribbon-outline"
          value={quality}
          onChange={setQuality}
        />
        <RatingInput
          label="Communication"
          icon="chatbubble-outline"
          value={communication}
          onChange={setCommunication}
        />
        <RatingInput
          label="Rapport qualité-prix"
          icon="cash-outline"
          value={value}
          onChange={setValue}
        />
        <RatingInput
          label="Professionnalisme"
          icon="briefcase-outline"
          value={professionalism}
          onChange={setProfessionalism}
        />

        <View style={styles.divider} />

        <Input
          label="Commentaire (optionnel)"
          value={comment}
          onChangeText={setComment}
          placeholder="Partagez votre expérience..."
          multiline
          numberOfLines={4}
        />

        <Button
          title="Soumettre l'avis"
          onPress={handleSubmit}
          loading={createReview.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.error.DEFAULT,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.md,
  },
  categoryTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
