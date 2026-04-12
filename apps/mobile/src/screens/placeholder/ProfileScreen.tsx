import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '@/lib/theme';
import { Button } from '@/components/common/Button';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(' ') || 'Utilisateur';

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person" size={40} color={colors.primary.DEFAULT} />
      </View>
      <Text style={styles.name}>{displayName}</Text>
      {user?.email && <Text style={styles.email}>{user.email}</Text>}
      <Text style={styles.role}>
        {user?.role === 'PROVIDER' ? 'Prestataire' : user?.role === 'ADMIN' ? 'Admin' : 'Client'}
      </Text>
      <View style={styles.placeholderSection}>
        <Ionicons name="settings-outline" size={32} color={colors.neutral[300]} />
        <Text style={styles.placeholderText}>Paramètres bientôt disponibles</Text>
      </View>
      <Button
        title="Se déconnecter"
        onPress={signOut}
        variant="outline"
        style={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  email: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  role: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary.DEFAULT,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  placeholderSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: fontSizes.md,
    color: colors.text.tertiary,
  },
  logoutButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.xxl,
  },
});
