import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/auth';
import { colors, spacing, borderRadius, fontSizes, fontWeights, shadowStyles } from '@/lib/theme';
import { Badge } from '@/components/common/Badge';
import type { ProfileStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

function MenuItem({ icon, label, onPress, variant = 'default' }: MenuItemProps) {
  const isDanger = variant === 'danger';
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={isDanger ? colors.error.DEFAULT : colors.primary.DEFAULT}
      />
      <Text style={[styles.menuLabel, isDanger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Utilisateur';

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={[styles.header, shadowStyles.sm]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={colors.primary.DEFAULT} />
        </View>
        <Text style={styles.name}>{name}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        <View style={styles.badgeRow}>
          <Badge
            label={user?.role === 'PROVIDER' ? 'Prestataire' : 'Client'}
            variant="primary"
          />
          {user?.isVerified && <Badge label="Vérifié" variant="success" />}
        </View>
        {user?.city && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.locationText}>
              {user.city}, {user.country}
            </Text>
          </View>
        )}
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        <MenuItem
          icon="create-outline"
          label="Modifier le profil"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="heart-outline"
          label="Mes favoris"
          onPress={() => navigation.navigate('Favorites')}
        />
        <MenuItem
          icon="settings-outline"
          label="Paramètres de visibilité"
          onPress={() => navigation.navigate('Settings')}
        />
        <MenuItem
          icon="log-out-outline"
          label="Déconnexion"
          onPress={handleSignOut}
          variant="danger"
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
    paddingBottom: spacing.xxl,
  },
  header: {
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },
  email: {
    fontSize: fontSizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
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
  menu: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },
  menuLabelDanger: {
    color: colors.error.DEFAULT,
  },
});
