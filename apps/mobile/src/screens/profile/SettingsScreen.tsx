import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '@/lib/theme';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';

interface SettingRowProps {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

function SettingRow({ label, value, onToggle }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
        thumbColor={value ? colors.primary.DEFAULT : colors.neutral[100]}
      />
    </View>
  );
}

export function SettingsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.settings.visibility,
    queryFn: () => api.settings.getVisibility(),
  });

  const updateVisibility = useMutation({
    mutationFn: (updates: Record<string, boolean>) =>
      api.settings.updateVisibility(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.visibility });
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.message || 'Impossible de sauvegarder');
      refetch(); // revert to server state
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;

  const settings = data.settings;

  const toggle = (key: string, val: boolean) => {
    updateVisibility.mutate({ [key]: val });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Visibilité du profil</Text>
      <View style={styles.card}>
        <SettingRow
          label="Profil visible"
          value={settings.profileVisible === 'PUBLIC'}
          onToggle={(val) =>
            updateVisibility.mutate({ profileVisible: val ? 'PUBLIC' : 'PRIVATE' } as any)
          }
        />
        <SettingRow
          label="Apparaître dans la recherche"
          value={settings.appearInSearch}
          onToggle={(val) => toggle('appearInSearch', val)}
        />
        <SettingRow
          label="Apparaître dans les catégories"
          value={settings.appearInCategory}
          onToggle={(val) => toggle('appearInCategory', val)}
        />
      </View>

      <Text style={styles.sectionTitle}>Informations affichées</Text>
      <View style={styles.card}>
        <SettingRow
          label="Afficher l'email"
          value={settings.showEmail}
          onToggle={(val) => toggle('showEmail', val)}
        />
        <SettingRow
          label="Afficher le téléphone"
          value={settings.showPhone}
          onToggle={(val) => toggle('showPhone', val)}
        />
        <SettingRow
          label="Afficher le tarif horaire"
          value={settings.showHourlyRate}
          onToggle={(val) => toggle('showHourlyRate', val)}
        />
        <SettingRow
          label="Afficher les avis"
          value={settings.showReviews}
          onToggle={(val) => toggle('showReviews', val)}
        />
        <SettingRow
          label="Afficher les certifications"
          value={settings.showCertifications}
          onToggle={(val) => toggle('showCertifications', val)}
        />
        <SettingRow
          label="Afficher les travaux passés"
          value={settings.showPastWork}
          onToggle={(val) => toggle('showPastWork', val)}
        />
        <SettingRow
          label="Afficher la disponibilité"
          value={settings.showAvailability}
          onToggle={(val) => toggle('showAvailability', val)}
        />
        <SettingRow
          label="Position exacte"
          value={settings.showExactLocation}
          onToggle={(val) => toggle('showExactLocation', val)}
        />
      </View>

      <Text style={styles.sectionTitle}>Contact</Text>
      <View style={styles.card}>
        <SettingRow
          label="Autoriser le contact direct"
          value={settings.allowDirectContact}
          onToggle={(val) => toggle('allowDirectContact', val)}
        />
        <SettingRow
          label="Autoriser les messages"
          value={settings.allowMessages}
          onToggle={(val) => toggle('allowMessages', val)}
        />
      </View>
    </ScrollView>
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
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  settingLabel: {
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
});
