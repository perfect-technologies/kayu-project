import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/auth';
import { colors, spacing, fontSizes, fontWeights, brand } from '@/lib/theme';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signInWithPhone, verifyOtp } = useAuth();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithPhone(phone.trim());
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Erreur d'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Veuillez entrer le code reçu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone.trim(), otpCode.trim());
    } catch (err: any) {
      setError(err.message || 'Code invalide');
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
          <Text style={styles.tagline}>{brand.APP_TAGLINE}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Se connecter</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {mode === 'email' ? (
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
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
              <Button
                title="Se connecter"
                onPress={handleEmailLogin}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Input
                label="Téléphone"
                placeholder="+243 999 000 000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!otpSent}
              />
              {otpSent && (
                <Input
                  label="Code de vérification"
                  placeholder="000000"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
              <Button
                title={otpSent ? 'Vérifier le code' : 'Envoyer le code'}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                loading={loading}
              />
            </>
          )}

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'email' ? 'phone' : 'email');
              setError('');
              setOtpSent(false);
              setOtpCode('');
            }}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {mode === 'email'
                ? 'Connexion par téléphone'
                : 'Connexion par email'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 80,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 42,
    fontWeight: fontWeights.bold,
    color: colors.primary.DEFAULT,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  toggleButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.medium,
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
