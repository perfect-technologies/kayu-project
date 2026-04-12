import React, { useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { useNavigation } from '@react-navigation/native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfile = useMutation({
    mutationFn: () =>
      api.identity.completeProfile({
        firstName,
        lastName,
        role: (user?.role === 'ADMIN' ? 'CLIENT' : user?.role) ?? 'CLIENT',
        country: user?.country ?? 'RDC',
        phone: phone || undefined,
        city: city || undefined,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.identity.me });
      await refreshUser();
      Alert.alert('Succès', 'Profil mis à jour', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour le profil');
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateProfile.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Input
          label="Prénom *"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
        />
        <Input
          label="Nom *"
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
        />
        <Input
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Input
          label="Ville"
          value={city}
          onChangeText={setCity}
        />

        <Button
          title="Enregistrer"
          onPress={handleSubmit}
          loading={updateProfile.isPending}
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
  submitButton: {
    marginTop: spacing.md,
  },
});
