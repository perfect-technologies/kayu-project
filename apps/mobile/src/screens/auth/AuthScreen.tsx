// I02 — Auth phone OTP (finalized, mobile).
// Two modes via route params:
//   login  (default)  : phone → OTP → route by role (with name/role edge steps)
//   signup            : role → phone → OTP → (client) name; pro skips name
// Pixel source: docs/design-plan-v2/prototype/components/Auth.jsx.

import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { I } from '@kayu/ui/mobile';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { identityApi } from '@kayu/api';
import { theme } from '@/lib/theme';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type CountryCode = 'cd' | 'cg';
type Role = 'CLIENT' | 'PROVIDER';
type Mode = 'login' | 'signup';
type FallbackKind = 'name' | 'rolePicker';

interface Country {
  code: CountryCode;
  dial: string;
  name: string;
  flag: string;
  hint: string;
}

const COUNTRIES: readonly Country[] = [
  {
    code: 'cd',
    dial: '+243',
    name: 'RD Congo',
    flag: '🇨🇩',
    hint: '9 chiffres — ex. 897 123 456',
  },
  {
    code: 'cg',
    dial: '+242',
    name: 'Congo-Brazzaville',
    flag: '🇨🇬',
    hint: '9 chiffres — ex. 06 123 4567',
  },
] as const;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 32;

const CITIES_CD = [
  'Kinshasa',
  'Lubumbashi',
  'Goma',
  'Mbuji-Mayi',
  'Kisangani',
  'Matadi',
  'Boma',
  'Likasi',
  'Kolwezi',
];
const CITIES_CG = [
  'Brazzaville',
  'Pointe-Noire',
  'Dolisie',
  'Nkayi',
  'Impfondo',
];

// Dev-only seeded accounts for fast role switching while the SMS provider is wired.
type DemoTone = 'success' | 'primary' | 'danger';
interface DemoAccount {
  role: 'Client' | 'Prestataire' | 'Admin';
  name: string;
  email: string;
  password: string;
  hint: string;
  tone: DemoTone;
  initials: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: 'Client',
    name: 'Paul Kabasele',
    email: 'paul.kabasele@email.cd',
    password: 'Password123!',
    hint: 'Réservations et favoris',
    tone: 'success',
    initials: 'PK',
  },
  {
    role: 'Prestataire',
    name: 'Jean-Pierre Mukendi',
    email: 'jeanpierre.mukendi@kayou.cd',
    password: 'Password123!',
    hint: 'Profil pro et demandes',
    tone: 'primary',
    initials: 'JM',
  },
  {
    role: 'Admin',
    name: 'Admin KAYOU',
    email: 'admin@kayou.cd',
    password: 'Password123!',
    hint: 'Pilotage et modération',
    tone: 'danger',
    initials: 'AK',
  },
] as const;

const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== 'production';

function supabaseErrorCopy(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/invalid\s*phone|phone\s*number/i.test(msg)) {
    return 'Numéro invalide. Vérifie le format.';
  }
  if (/token|otp|code/i.test(msg) && /invalid|expired/i.test(msg)) {
    return 'Code invalide ou expiré. Demande-en un nouveau.';
  }
  if (/rate|too many|too\s*many\s*requests/i.test(msg)) {
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  }
  return "Impossible d'envoyer le code. Réessaie dans un instant.";
}

function authFlowErrorCopy(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/role has already been set|rôle|role/i.test(msg)) {
    return 'Ce compte a déjà un rôle. Connectez-vous avec le parcours correspondant.';
  }
  return supabaseErrorCopy(err);
}

function hasRequiredName(user: {
  firstName?: string | null;
  lastName?: string | null;
} | null | undefined): boolean {
  return Boolean(user?.firstName?.trim() && user?.lastName?.trim());
}

function hasEstablishedRole(user: {
  role?: string | null;
  roleSelectedAt?: string | Date | null;
  provider?: unknown;
  firstName?: string | null;
  lastName?: string | null;
} | null | undefined): boolean {
  return Boolean(user?.role && (user.roleSelectedAt || user.provider || hasRequiredName(user)));
}

function readRoleSelectedAt(user: unknown): string | Date | null {
  if (!user || typeof user !== 'object' || !('roleSelectedAt' in user)) {
    return null;
  }

  return (user as { roleSelectedAt?: string | Date | null }).roleSelectedAt ?? null;
}

type AuthRoute = RouteProp<AuthStackParamList, 'Auth'>;

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<AuthRoute>();
  const mode: Mode = route.params?.mode === 'signup' ? 'signup' : 'login';
  const { setAuthFlowPending, refreshUser, signInWithEmail } = useAuth();

  const [step, setStep] = React.useState<0 | 1 | 2 | 3>(
    mode === 'signup' ? 0 : 1,
  );
  const [chosenRole, setChosenRole] = React.useState<Role | null>(null);
  const [fallbackKind, setFallbackKind] = React.useState<FallbackKind | null>(
    null,
  );
  const [country, setCountry] = React.useState<CountryCode>('cd');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [resendLeft, setResendLeft] = React.useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [nameFirst, setNameFirst] = React.useState('');
  const [nameLast, setNameLast] = React.useState('');
  const [nameCity, setNameCity] = React.useState('Kinshasa');
  const [nameEmail, setNameEmail] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [demoLoadingEmail, setDemoLoadingEmail] = React.useState<string | null>(
    null,
  );
  const [demoError, setDemoError] = React.useState<string | null>(null);
  const otpRefs = React.useRef<Array<TextInput | null>>([]);

  const c = COUNTRIES.find((x) => x.code === country)!;
  const prettyPhone = phone.replace(/(\d{3})(?=\d)/g, '$1 ');
  const phoneValid = phone.length === 9;
  const otpValid = otp.every((d) => d.length > 0);
  const fullPhone = `${c.dial}${phone}`;
  const citiesForCountry = country === 'cd' ? CITIES_CD : CITIES_CG;

  // Freeze auto-login for the duration of the flow so navigator stays on Auth.
  React.useEffect(() => {
    setAuthFlowPending(true);
    return () => {
      setAuthFlowPending(false);
    };
  }, [setAuthFlowPending]);

  // Resend countdown ticks on OTP step.
  React.useEffect(() => {
    if (step !== 2) return;
    setResendLeft(RESEND_SECONDS);
    const id = setInterval(() => {
      setResendLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Auto-verify when OTP is complete.
  React.useEffect(() => {
    if (step !== 2 || !otpValid || submitting) return;
    const t = setTimeout(() => {
      handleVerifyOtp();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValid, step]);

  const totalDots = (() => {
    if (mode === 'signup') {
      if (chosenRole === 'PROVIDER') return 3;
      return 4;
    }
    if (step === 3) return 3;
    return 2;
  })();
  const dotsStep = mode === 'signup' ? step : Math.max(0, step - 1);

  const handleSelectRole = (role: Role) => {
    setChosenRole(role);
    setStep(1);
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    if (demoLoadingEmail) return;
    setDemoError(null);
    setDemoLoadingEmail(account.email);
    try {
      await signInWithEmail(account.email, account.password);
      // AppNavigator flips to MainNavigator as soon as user state updates.
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Erreur de connexion');
      setDemoLoadingEmail(null);
    }
  };

  const handleRequestOtp = async () => {
    if (!phoneValid || submitting) return;
    setPhoneError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      setStep(2);
    } catch (err) {
      setPhoneError(supabaseErrorCopy(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendLeft > 0 || submitting) return;
    setOtpError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      setResendLeft(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setOtpError(supabaseErrorCopy(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH || submitting) return;
    setOtpError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: 'sms',
      });
      if (error) throw error;
      const tokenStr = data.session?.access_token;
      if (!tokenStr) throw new Error('No session returned');
      apiClient.setAccessToken(tokenStr);

      const identity = identityApi(apiClient);
      let me = await identity.me();
      const userRole = me.user?.role as 'CLIENT' | 'PROVIDER' | 'ADMIN' | null | undefined;

      // SIGNUP
      if (mode === 'signup' && chosenRole) {
        if (userRole !== chosenRole || !readRoleSelectedAt(me.user)) {
          me = await identity.setRole({ role: chosenRole });
        }

        if (chosenRole === 'PROVIDER') {
          await refreshUser();
          // Navigator swaps to the pro app; users without a provider profile
          // start on onboarding.
          return;
        }

        if (hasRequiredName(me.user)) {
          await refreshUser();
          return;
        }

        setFallbackKind('name');
        setStep(3);
        setSubmitting(false);
        return;
      }

      // LOGIN: no role → fallback role picker
      if (!userRole || !hasEstablishedRole(me.user)) {
        setFallbackKind('rolePicker');
        setStep(3);
        setSubmitting(false);
        return;
      }

      // Returning pro — pro navigator handles onboarding when no profile exists.
      if (userRole === 'PROVIDER') {
        await refreshUser();
        return;
      }

      // Returning client missing profile names.
      if (userRole === 'CLIENT' && !hasRequiredName(me.user)) {
        setFallbackKind('name');
        setStep(3);
        setSubmitting(false);
        return;
      }

      await refreshUser();
    } catch (err) {
      setOtpError(authFlowErrorCopy(err));
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      otpRefs.current[0]?.focus();
      setSubmitting(false);
    }
  };

  const handleRoleFallback = async (role: Role) => {
    if (submitting) return;
    setNameError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).setRole({ role });
      if (role === 'PROVIDER') {
        await refreshUser();
        return;
      }
      setChosenRole('CLIENT');
      setFallbackKind('name');
      setSubmitting(false);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.',
      );
      setSubmitting(false);
    }
  };

  const handleSubmitName = async () => {
    if (submitting) return;
    if (nameFirst.trim().length < 2 || nameLast.trim().length < 2) {
      setNameError('Le prénom et le nom sont requis (2 caractères min).');
      return;
    }
    setNameError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).completeProfile({
        firstName: nameFirst.trim(),
        lastName: nameLast.trim(),
        city: nameCity || undefined,
        email: nameEmail.trim() || undefined,
        country: country === 'cd' ? 'RDC' : 'CG',
      });
      await refreshUser();
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.',
      );
      setSubmitting(false);
    }
  };

  const handleOtpChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > 1) {
      const filled = Array.from({ length: OTP_LENGTH }, (_, k) => digits[k] ?? '');
      setOtp(filled);
      const target = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[target]?.focus();
      return;
    }
    if (!/^\d?$/.test(digits)) return;
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (otpError) setOtpError(null);
    if (digits && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyPress = (i: number, key: string) => {
    if (key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 8,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexGrow: 1 }}>
          {step === 0 && (
            <RolePickerStep onSelect={handleSelectRole} mode="signup" />
          )}
          {step === 1 && (
            <PhoneStep
              mode={mode}
              chosenRole={chosenRole}
              country={c}
              onCountry={setCountry}
              prettyPhone={prettyPhone}
              onChangePhone={(v) => {
                setPhone(v);
                if (phoneError) setPhoneError(null);
              }}
              phoneValid={phoneValid}
              phoneError={phoneError}
              submitting={submitting}
              onSubmit={handleRequestOtp}
              demoLoadingEmail={demoLoadingEmail}
              demoError={demoError}
              onDemoLogin={handleDemoLogin}
            />
          )}
          {step === 2 && (
            <OtpStep
              country={c}
              prettyPhone={prettyPhone}
              otp={otp}
              onChangeOtp={handleOtpChange}
              onKeyPress={handleOtpKeyPress}
              otpRefs={otpRefs}
              resendLeft={resendLeft}
              onResend={handleResend}
              onBack={() => setStep(1)}
              otpError={otpError}
              submitting={submitting}
            />
          )}
          {step === 3 && fallbackKind === 'name' && (
            <NameStep
              firstName={nameFirst}
              lastName={nameLast}
              city={nameCity}
              email={nameEmail}
              cities={citiesForCountry}
              onFirstName={setNameFirst}
              onLastName={setNameLast}
              onCity={setNameCity}
              onEmail={setNameEmail}
              onSubmit={handleSubmitName}
              submitting={submitting}
              error={nameError}
            />
          )}
          {step === 3 && fallbackKind === 'rolePicker' && (
            <RolePickerStep
              onSelect={handleRoleFallback}
              mode="fallback"
              error={nameError}
            />
          )}
        </View>

        <View style={styles.dotsContainer}>
          <StepDots step={dotsStep} total={totalDots} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ProfileCompletionScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, signOut } = useAuth();
  const initialCountry: CountryCode = user?.country === 'CG' ? 'cg' : 'cd';
  const [firstName, setFirstName] = React.useState(user?.firstName ?? '');
  const [lastName, setLastName] = React.useState(user?.lastName ?? '');
  const [city, setCity] = React.useState(user?.city ?? 'Kinshasa');
  const [email, setEmail] = React.useState(user?.email ?? '');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [roleSelectionDone, setRoleSelectionDone] = React.useState(
    Boolean(user?.roleSelectedAt) || hasRequiredName(user),
  );

  const cities = initialCountry === 'cd' ? CITIES_CD : CITIES_CG;
  const needsRoleSelection =
    user?.role === 'CLIENT' &&
    !roleSelectionDone &&
    !user.hasProviderProfile &&
    !hasRequiredName(user);

  const handleRoleSelect = async (role: Role) => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).setRole({ role });
      if (role === 'PROVIDER') {
        await refreshUser();
        return;
      }
      setRoleSelectionDone(true);
      setSubmitting(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.',
      );
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Le prénom et le nom sont requis (2 caractères min).');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city || undefined,
        email: email.trim() || undefined,
        country: initialCountry === 'cd' ? 'RDC' : 'CG',
      });
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.',
      );
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 8,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexGrow: 1 }}>
          {needsRoleSelection ? (
            <RolePickerStep
              onSelect={handleRoleSelect}
              mode="fallback"
              error={error}
            />
          ) : (
            <NameStep
              firstName={firstName}
              lastName={lastName}
              city={city}
              email={email}
              cities={cities}
              onFirstName={setFirstName}
              onLastName={setLastName}
              onCity={setCity}
              onEmail={setEmail}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          )}

          <Pressable
            onPress={signOut}
            disabled={submitting}
            accessibilityRole="button"
            style={styles.signOutLink}
          >
            <Text style={styles.signOutText}>Utiliser un autre compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 22 : 6,
            height: 6,
            borderRadius: 999,
            backgroundColor:
              i <= step ? theme.colors.primary : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Role picker step ─────────────────────────────────────────────────────────

function RolePickerStep({
  onSelect,
  mode,
  error,
}: {
  onSelect: (role: Role) => void;
  mode: 'signup' | 'fallback';
  error?: string | null;
}) {
  return (
    <View>
      <View style={styles.logoBlock}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>K</Text>
        </View>
      </View>
      <Text style={styles.h1}>
        {mode === 'signup' ? 'Que voulez-vous faire ?' : 'Presque prêt'}
      </Text>
      <Text style={styles.body}>
        {mode === 'signup'
          ? 'Choisissez votre rôle pour configurer le bon espace.'
          : 'Comment voulez-vous utiliser KAYOU ?'}
      </Text>
      <View style={styles.roleStack}>
        <RoleCard
          title="Je cherche un pro"
          subtitle="Plombier, électricien, coiffeuse, ménage…"
          tone="primary"
          icon={<I.search size={22} color={theme.colors.primary} />}
          onPress={() => onSelect('CLIENT')}
        />
        <RoleCard
          title="Je suis un pro"
          subtitle="Recevez des demandes, gérez vos missions, payez-vous en M-Pesa."
          tone="accent"
          icon={<I.sparkles size={22} color={theme.colors.accent} />}
          onPress={() => onSelect('PROVIDER')}
        />
      </View>
      {error && <ErrorRow message={error} />}
    </View>
  );
}

// ─── Phone step ───────────────────────────────────────────────────────────────

function PhoneStep({
  mode,
  chosenRole,
  country,
  onCountry,
  prettyPhone,
  onChangePhone,
  phoneValid,
  phoneError,
  submitting,
  onSubmit,
  demoLoadingEmail,
  demoError,
  onDemoLogin,
}: {
  mode: Mode;
  chosenRole: Role | null;
  country: Country;
  onCountry: (c: CountryCode) => void;
  prettyPhone: string;
  onChangePhone: (v: string) => void;
  phoneValid: boolean;
  phoneError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  demoLoadingEmail: string | null;
  demoError: string | null;
  onDemoLogin: (account: DemoAccount) => void;
}) {
  const title =
    mode === 'signup'
      ? chosenRole === 'PROVIDER'
        ? 'Créer votre compte pro'
        : 'Créer votre compte'
      : 'Bienvenue sur KAYOU';
  const bodyCopy =
    mode === 'signup'
      ? 'Entrez votre numéro. On vous enverra un code par SMS.'
      : 'Entrez votre numéro pour vous connecter. On vous enverra un code par SMS.';

  return (
    <View>
      <View style={styles.logoBlock}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>K</Text>
        </View>
      </View>

      <Text style={styles.h1}>{title}</Text>
      <Text style={styles.body}>{bodyCopy}</Text>

      <View style={styles.countryTabs}>
        {COUNTRIES.map((x) => {
          const active = country.code === x.code;
          return (
            <Pressable
              key={x.code}
              onPress={() => onCountry(x.code)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.countryTab, active && styles.countryTabActive]}
            >
              <Text
                style={[styles.countryFlag, { opacity: active ? 1 : 0.85 }]}
              >
                {x.flag}
              </Text>
              <Text
                style={[
                  styles.countryLabel,
                  active && styles.countryLabelActive,
                ]}
              >
                {x.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.phoneRow,
          phoneError ? { borderColor: theme.colors.danger } : null,
        ]}
      >
        <View style={styles.dialBox}>
          <Text style={styles.dialFlag}>{country.flag}</Text>
          <Text style={styles.dialText}>{country.dial}</Text>
        </View>
        <TextInput
          value={prettyPhone}
          onChangeText={(v) => onChangePhone(v.replace(/\D/g, '').slice(0, 9))}
          placeholder="897 123 456"
          placeholderTextColor={theme.colors.textSubtle}
          keyboardType="phone-pad"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          maxLength={11}
          accessibilityLabel={`Numéro de téléphone (${country.name})`}
          style={styles.phoneInput}
        />
      </View>
      <Text style={styles.hint}>{country.hint}</Text>

      {phoneError && <ErrorRow message={phoneError} />}

      <Pressable
        onPress={onSubmit}
        disabled={!phoneValid || submitting}
        accessibilityRole="button"
        accessibilityState={{ disabled: !phoneValid || submitting }}
        style={[
          styles.cta,
          (!phoneValid || submitting) && styles.ctaDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.ctaLabel}>Envoyer le code</Text>
            <I.arrowRight size={16} color="#FFFFFF" />
          </>
        )}
      </Pressable>

      <View style={styles.assurance}>
        <I.shieldCheck size={18} color={theme.colors.primary} />
        <Text style={styles.assuranceText}>
          KAYOU ne partage jamais votre numéro avec les pros tant que vous
          n&apos;avez pas confirmé une mission.
        </Text>
      </View>

      {SHOW_DEMO_ACCOUNTS && (
        <DemoAccountsPanel
          loadingEmail={demoLoadingEmail}
          error={demoError}
          onPick={onDemoLogin}
        />
      )}
    </View>
  );
}

// ─── Dev-only demo accounts ──────────────────────────────────────────────────

const DEMO_TONE: Record<DemoTone, string> = {
  success: theme.colors.success,
  primary: theme.colors.primary,
  danger: theme.colors.danger,
};

function DemoAccountsPanel({
  loadingEmail,
  error,
  onPick,
}: {
  loadingEmail: string | null;
  error: string | null;
  onPick: (account: DemoAccount) => void;
}) {
  const busy = loadingEmail !== null;
  return (
    <View style={styles.demoPanel}>
      <Text style={styles.demoOverline}>Accès rapide (dev)</Text>
      <Text style={styles.demoHint}>
        Comptes seedés — raccourci dev en attendant le provider SMS.
      </Text>
      {error ? (
        <View style={styles.demoError}>
          <Text style={styles.demoErrorText}>{error}</Text>
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        {DEMO_ACCOUNTS.map((a) => {
          const isLoading = loadingEmail === a.email;
          return (
            <Pressable
              key={a.email}
              onPress={() => onPick(a)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Se connecter en tant que ${a.name} (${a.role})`}
              style={({ pressed }) => [
                styles.demoCard,
                pressed && !busy && { borderColor: DEMO_TONE[a.tone] },
                busy && !isLoading && { opacity: 0.55 },
              ]}
            >
              <View
                style={[
                  styles.demoInitials,
                  { backgroundColor: DEMO_TONE[a.tone] },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.demoInitialsText}>{a.initials}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Text style={styles.demoName} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={styles.demoRolePill}>{a.role}</Text>
                </View>
                <Text style={styles.demoSubhint} numberOfLines={1}>
                  {a.hint}
                </Text>
              </View>
              <I.chevronRight size={14} color={theme.colors.textSubtle} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── OTP step ─────────────────────────────────────────────────────────────────

function OtpStep({
  country,
  prettyPhone,
  otp,
  onChangeOtp,
  onKeyPress,
  otpRefs,
  resendLeft,
  onResend,
  onBack,
  otpError,
  submitting,
}: {
  country: Country;
  prettyPhone: string;
  otp: string[];
  onChangeOtp: (i: number, v: string) => void;
  onKeyPress: (i: number, key: string) => void;
  otpRefs: React.MutableRefObject<Array<TextInput | null>>;
  resendLeft: number;
  onResend: () => void;
  onBack: () => void;
  otpError: string | null;
  submitting: boolean;
}) {
  return (
    <View>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={styles.backLink}
      >
        <I.arrowLeft size={14} color={theme.colors.textMuted} />
        <Text style={styles.backLinkText}>Retour</Text>
      </Pressable>

      <Text style={styles.h1}>Entrez le code à 6 chiffres</Text>
      <Text style={styles.body}>
        <Text>Envoyé par SMS à </Text>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
          {country.dial} {prettyPhone}
        </Text>
        <Text> · </Text>
        <Text
          onPress={onBack}
          style={{ color: theme.colors.primaryHover, fontWeight: '600' }}
        >
          modifier
        </Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            value={d}
            onChangeText={(v) => onChangeOtp(i, v)}
            onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            inputMode="numeric"
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'sms-otp' : 'off'}
            maxLength={i === 0 ? OTP_LENGTH : 1}
            autoFocus={i === 0}
            editable={!submitting}
            accessibilityLabel={`Chiffre ${i + 1}`}
            style={[
              styles.otpCell,
              d.length > 0 && styles.otpCellFilled,
              otpError ? { borderColor: theme.colors.danger } : null,
            ]}
          />
        ))}
      </View>

      {otpError && <ErrorRow message={otpError} />}

      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={styles.resendLine}>
          <Text>Pas de SMS ? </Text>
          <Text
            onPress={resendLeft > 0 || submitting ? undefined : onResend}
            style={{
              color: theme.colors.primaryHover,
              fontWeight: '600',
              opacity: resendLeft > 0 ? 0.75 : 1,
            }}
          >
            {resendLeft > 0
              ? `Renvoyer dans ${resendLeft}s`
              : 'Renvoyer le code'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Name step (client) ───────────────────────────────────────────────────────

function NameStep({
  firstName,
  lastName,
  city,
  email,
  cities,
  onFirstName,
  onLastName,
  onCity,
  onEmail,
  onSubmit,
  submitting,
  error,
}: {
  firstName: string;
  lastName: string;
  city: string;
  email: string;
  cities: readonly string[];
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onCity: (v: string) => void;
  onEmail: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const disabled =
    submitting || firstName.trim().length < 2 || lastName.trim().length < 2;
  return (
    <View>
      <Text style={styles.h1}>Enchanté !</Text>
      <Text style={styles.body}>Dites-nous qui vous êtes.</Text>

      <View style={{ gap: 12 }}>
        <Field label="Prénom" required>
          <TextInput
            value={firstName}
            onChangeText={onFirstName}
            placeholder="Paul"
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.textField}
            autoFocus
            editable={!submitting}
          />
        </Field>
        <Field label="Nom" required>
          <TextInput
            value={lastName}
            onChangeText={onLastName}
            placeholder="Kabasele"
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.textField}
            editable={!submitting}
          />
        </Field>
        <Field label="Ville">
          <View style={styles.cityPickerRow}>
            {cities.slice(0, 4).map((x) => {
              const active = city === x;
              return (
                <Pressable
                  key={x}
                  onPress={() => onCity(x)}
                  style={[
                    styles.cityChip,
                    active && styles.cityChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.cityChipLabel,
                      active && styles.cityChipLabelActive,
                    ]}
                  >
                    {x}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field
          label="Email (optionnel)"
          hint="Pour recevoir vos reçus — vous pouvez l'ajouter plus tard."
        >
          <TextInput
            value={email}
            onChangeText={onEmail}
            placeholder="paul@email.cd"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textField}
            editable={!submitting}
          />
        </Field>
      </View>

      {error && <ErrorRow message={error} />}

      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        style={[styles.cta, disabled && styles.ctaDisabled]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.ctaLabel}>Continuer</Text>
            <I.arrowRight size={16} color="#FFFFFF" />
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function ErrorRow({ message }: { message: string }) {
  return (
    <View style={styles.errorRow}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: theme.colors.danger }}> *</Text> : null}
      </Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function RoleCard({
  title,
  subtitle,
  tone,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  tone: 'primary' | 'accent';
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const tint = tone === 'primary' ? theme.colors.primary : theme.colors.accent;
  const tintSubtle =
    tone === 'primary'
      ? theme.colors.primarySubtle
      : theme.colors.accentSubtle;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.roleCard,
        pressed && { borderColor: tint, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.roleIconBox, { backgroundColor: tintSubtle }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
      <I.chevronRight size={18} color={theme.colors.textSubtle} />
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    flexDirection: 'column',
  },
  dotsContainer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },

  logoBlock: {
    marginBottom: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.brand,
  },
  logoLetter: {
    fontFamily: theme.fonts.display,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  h1: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 30,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginBottom: 28,
  },

  countryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 4,
    borderRadius: 12,
  },
  countryTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countryTabActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  countryFlag: { fontSize: 16 },
  countryLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  countryLabelActive: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  dialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  dialFlag: { fontSize: 18 },
  dialText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: theme.fonts.mono,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: theme.colors.textPrimary,
  },
  hint: {
    marginTop: 8,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  cta: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadow.brand,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: {
    fontFamily: theme.fonts.body,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  assurance: {
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  assuranceText: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textBody,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  otpCell: {
    width: 44,
    height: 56,
    textAlign: 'center',
    fontFamily: theme.fonts.mono,
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    flex: 1,
  },
  otpCellFilled: {
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.02 }],
  },
  resendLine: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  roleStack: { gap: 10 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  roleSubtitle: {
    marginTop: 2,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  textField: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14.5,
    color: theme.colors.textPrimary,
  },
  fieldLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  fieldHint: {
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  cityPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cityChipActive: {
    backgroundColor: theme.colors.primarySubtle,
    borderColor: theme.colors.primary,
  },
  cityChipLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  cityChipLabelActive: {
    color: theme.colors.primaryHover,
    fontWeight: '600',
  },
  signOutLink: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },

  errorRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSubtle,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.danger,
  },

  demoPanel: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  demoOverline: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  demoHint: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  demoError: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSubtle,
  },
  demoErrorText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.danger,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
  },
  demoInitials: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoInitialsText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    fontSize: 12.5,
  },
  demoName: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  demoRolePill: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    overflow: 'hidden',
  },
  demoSubhint: {
    marginTop: 1,
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
});
