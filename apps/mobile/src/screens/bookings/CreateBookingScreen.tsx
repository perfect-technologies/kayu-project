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
import type { SearchStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'CreateBooking'>;
type Route = RouteProp<SearchStackParamList, 'CreateBooking'>;

export function CreateBookingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [price, setPrice] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBooking = useMutation({
    mutationFn: () =>
      api.bookings.create({
        providerId: params.providerId,
        title,
        description: description || undefined,
        address: address || undefined,
        city: city || undefined,
        scheduledDate: new Date(scheduledDate),
        price: price ? Number(price) : undefined,
        clientNotes: clientNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      Alert.alert('Succès', 'Votre réservation a été créée', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.message || 'Impossible de créer la réservation');
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Le titre est requis';
    if (!scheduledDate.trim()) {
      newErrors.scheduledDate = 'La date est requise';
    } else if (isNaN(new Date(scheduledDate).getTime())) {
      newErrors.scheduledDate = 'Format de date invalide (AAAA-MM-JJ)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createBooking.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Réservation avec {params.providerName}
        </Text>

        <Input
          label="Titre du service *"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Réparation plomberie"
          error={errors.title}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre besoin..."
          multiline
          numberOfLines={3}
        />

        <Input
          label="Date prévue * (AAAA-MM-JJ)"
          value={scheduledDate}
          onChangeText={setScheduledDate}
          placeholder="2026-04-15"
          error={errors.scheduledDate}
        />

        <Input
          label="Adresse"
          value={address}
          onChangeText={setAddress}
          placeholder="Adresse de l'intervention"
        />

        <Input
          label="Ville"
          value={city}
          onChangeText={setCity}
          placeholder="Kinshasa"
        />

        <Input
          label="Budget (CDF)"
          value={price}
          onChangeText={setPrice}
          placeholder="5000"
          keyboardType="numeric"
        />

        <Input
          label="Notes"
          value={clientNotes}
          onChangeText={setClientNotes}
          placeholder="Instructions supplémentaires..."
          multiline
          numberOfLines={2}
        />

        <Button
          title="Créer la réservation"
          onPress={handleSubmit}
          loading={createBooking.isPending}
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
  submitButton: {
    marginTop: spacing.md,
  },
});
