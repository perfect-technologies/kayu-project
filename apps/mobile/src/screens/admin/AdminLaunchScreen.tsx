import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

const ADMIN_WEB_URL = 'https://kayou.cd/dashboard/admin';

export function AdminLaunchScreen() {
  const { signOut } = useAuth();

  const openAdminDashboard = async () => {
    try {
      await Linking.openURL(ADMIN_WEB_URL);
    } catch {
      Alert.alert(
        'Ouvrir le dashboard web',
        `Connectez-vous sur ${ADMIN_WEB_URL}`,
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Administration</Text>
        <Text style={styles.title}>Le pilotage ops se fait sur le web pour le MVP.</Text>
        <Text style={styles.body}>
          Cette application mobile ne propose pas de parcours admin au lancement.
          Utilisez le tableau de bord web admin pour la moderation, la verification et
          le support booking.
        </Text>
        <View style={styles.urlBlock}>
          <Text style={styles.urlLabel}>Dashboard web</Text>
          <Text selectable style={styles.urlValue}>
            {ADMIN_WEB_URL}
          </Text>
        </View>
        <Button title="Ouvrir le dashboard web" onPress={() => void openAdminDashboard()} />
        <Button
          title="Se déconnecter"
          variant="outline"
          onPress={() => void signOut()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary.DEFAULT,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text.primary,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  urlBlock: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    gap: spacing.xs,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  urlValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary.DEFAULT,
  },
});
