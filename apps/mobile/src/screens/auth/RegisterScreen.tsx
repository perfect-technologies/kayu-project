import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { identityApi } from '@kayu/api';
import { isValidPhone, normalizeDRCPhone } from '@kayu/utils';
import { colors, spacing, fontSizes, fontWeights, brand } from '@/lib/theme';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type Step = 'credentials' | 'profile';

export function RegisterScreen({ navigation }: Props) {
  const { signUpAndLogin, refreshUser } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('CD');
  const [role, setRole] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpAndLogin(email.trim(), password);
      setStep('profile');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }
    if (phone.trim() && !isValidPhone(phone.trim(), country === 'CG' ? 'Congo' : 'RDC')) {
      setError('Numéro de téléphone invalide');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const normalizedPhone = phone.trim()
        ? (country === 'CG' ? phone.trim() : normalizeDRCPhone(phone.trim()))
        : undefined;

      // 1. Complete profile (backend strips role from this endpoint)
      await identityApi(apiClient).completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        phone: normalizedPhone,
        city: city.trim() || undefined,
        country,
      });

      // 2. Set role via dedicated endpoint
      await identityApi(apiClient).setRole({ role });

      // 3. Provider onboarding (if applicable)
      if (role === 'PROVIDER') {
        await identityApi(apiClient).providerOnboarding({
          profession: 'Prestataire',
          categoryIds: [],
          skills: [],
          serviceZones: [],
          tradeIds: [],
        });
      }

      // 4. Now refresh user — this clears suppressAutoLogin and sets user,
      //    which triggers navigation to main tabs
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>{brand.APP_NAME}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>
            {step === 'credentials' ? 'Créer un compte' : 'Compléter le profil'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 'credentials' ? (
            <>
              <Input
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                label="Mot de passe"
                placeholder="Au moins 6 caractères"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Input
                label="Confirmer le mot de passe"
                placeholder="Retapez le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <Button
                title="Créer le compte"
                onPress={handleCreateAccount}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Input
                label="Prénom"
                placeholder="Votre prénom"
                value={firstName}
                onChangeText={setFirstName}
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                placeholder="Votre nom"
                value={lastName}
                onChangeText={setLastName}
                autoComplete="family-name"
              />
              <Input
                label="Téléphone"
                placeholder="+243 999 000 000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="Ville"
                placeholder="Kinshasa, Lubumbashi..."
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.label}>Pays</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setCountry('CD')}
                  style={[
                    styles.toggleOption,
                    country === 'CD' && styles.toggleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      country === 'CD' && styles.toggleOptionTextActive,
                    ]}
                  >
                    RDC
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCountry('CG')}
                  style={[
                    styles.toggleOption,
                    country === 'CG' && styles.toggleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      country === 'CG' && styles.toggleOptionTextActive,
                    ]}
                  >
                    Congo-Brazzaville
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Je suis</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setRole('CLIENT')}
                  style={[
                    styles.toggleOption,
                    role === 'CLIENT' && styles.toggleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      role === 'CLIENT' && styles.toggleOptionTextActive,
                    ]}
                  >
                    Client
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole('PROVIDER')}
                  style={[
                    styles.toggleOption,
                    role === 'PROVIDER' && styles.toggleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      role === 'PROVIDER' && styles.toggleOptionTextActive,
                    ]}
                  >
                    Prestataire
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Terminer l'inscription"
                onPress={handleCompleteProfile}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}

          {step === 'credentials' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 36,
    fontWeight: fontWeights.bold,
    color: colors.primary.DEFAULT,
    letterSpacing: 2,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: fontSizes.sm,
    color: colors.error.DEFAULT,
    backgroundColor: colors.error.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  toggleOptionActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[50],
  },
  toggleOptionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
  },
  toggleOptionTextActive: {
    color: colors.primary.DEFAULT,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: fontSizes.md,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold,
  },
});
